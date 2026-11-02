import logging
import os
import random
from datetime import date, time

from clerk_backend_api import AuthenticateRequestOptions, authenticate_request
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request
from openai import APITimeoutError, OpenAI, OpenAIError
from pydantic import BaseModel, Field

logger = logging.getLogger("espa")

load_dotenv()

app = FastAPI(title="Resumidor", version="0.1.0")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class GenerarRequest(BaseModel):
    texto: str = Field(..., min_length=1, max_length=2000)


class GenerarResponse(BaseModel):
    resumen: str


ARCANOS = [
    "El Loco", "El Mago", "La Sacerdotisa", "La Emperatriz", "El Emperador",
    "El Hierofante", "Los Enamorados", "El Carro", "La Fuerza", "El Ermitaño",
    "La Rueda de la Fortuna", "La Justicia", "El Colgado", "La Muerte",
    "La Templanza", "El Diablo", "La Torre", "La Estrella", "La Luna",
    "El Sol", "El Juicio", "El Mundo",
]
POSICIONES = ["Pasado", "Presente", "Futuro"]
# (mes, día) del primer día de cada signo, de enero a diciembre
SIGNOS = [
    ((1, 20), "Acuario"), ((2, 19), "Piscis"), ((3, 21), "Aries"),
    ((4, 20), "Tauro"), ((5, 21), "Géminis"), ((6, 21), "Cáncer"),
    ((7, 23), "Leo"), ((8, 23), "Virgo"), ((9, 23), "Libra"),
    ((10, 23), "Escorpio"), ((11, 22), "Sagitario"), ((12, 22), "Capricornio"),
]


class TarotRequest(BaseModel):
    fecha: date = Field(..., ge=date(1900, 1, 1))
    hora: time | None = None


class Carta(BaseModel):
    indice: int
    nombre: str
    posicion: str


class TarotResponse(BaseModel):
    signo: str
    cartas: list[Carta]
    lectura: str


def signo_de(fecha: date) -> str:
    signo = "Capricornio"
    for inicio, nombre in SIGNOS:
        if (fecha.month, fecha.day) >= inicio:
            signo = nombre
    return signo


def llamar_ia(texto: str) -> str:
    """Llama al proveedor de IA (OpenRouter). Aislada para poder simularla en tests."""
    client = OpenAI(
        api_key=os.getenv("AI_API_KEY"),
        base_url=OPENROUTER_BASE_URL,
        timeout=20,
    )
    completion = client.chat.completions.create(
        model=os.getenv("AI_MODEL"),
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres un asistente que resume textos. "
                    "Devuelve únicamente un resumen breve y claro en el mismo idioma "
                    "del texto original, sin preámbulos ni explicaciones."
                ),
            },
            {"role": "user", "content": f"Resume el siguiente texto:\n\n{texto}"},
        ],
    )
    resumen = completion.choices[0].message.content
    if not resumen:
        raise ValueError("El proveedor devolvió una respuesta vacía")
    return resumen.strip()


def llamar_ia_tarot(fecha: date, hora: time | None, signo: str, cartas: list[Carta]) -> str:
    """Pide la lectura de la tirada al proveedor de IA. Aislada para simularla en tests."""
    client = OpenAI(
        api_key=os.getenv("AI_API_KEY"),
        base_url=OPENROUTER_BASE_URL,
        timeout=20,
    )
    tirada = ", ".join(f"{c.posicion}: {c.nombre}" for c in cartas)
    nacimiento = f"{fecha.isoformat()}" + (f" a las {hora:%H:%M}" if hora else "")
    completion = client.chat.completions.create(
        model=os.getenv("AI_MODEL"),
        messages=[
            {
                "role": "system",
                "content": (
                    "Eres una tarotista con un tono místico, cálido y poético que escribe en español. "
                    "Haz una lectura de tres cartas de los Arcanos Mayores. "
                    "Responde con exactamente 4 párrafos separados por una línea en blanco: "
                    "uno por cada carta (pasado, presente, futuro), de 2 o 3 frases, "
                    "y un último párrafo con un consejo final. "
                    "Menciona el signo del consultante al menos una vez. "
                    "Sin títulos, listas ni markdown. Es entretenimiento: "
                    "no hagas predicciones médicas, legales ni económicas concretas."
                ),
            },
            {
                "role": "user",
                "content": f"Nací el {nacimiento} (signo {signo}). Tirada: {tirada}.",
            },
        ],
    )
    lectura = completion.choices[0].message.content
    if not lectura:
        raise ValueError("El proveedor devolvió una respuesta vacía")
    return lectura.strip()


def _authorized_parties() -> list[str] | None:
    partes = [
        parte.strip()
        for parte in os.getenv("CLERK_AUTHORIZED_PARTIES", "").split(",")
        if parte.strip()
    ]
    return partes or None


def require_auth(request: Request) -> None:
    """Valida el token de sesión de Clerk. Sin sesión válida responde 401."""
    estado = authenticate_request(
        request,
        AuthenticateRequestOptions(
            secret_key=os.getenv("CLERK_SECRET_KEY"),
            authorized_parties=_authorized_parties(),
            accepts_token=["session_token"],
        ),
    )
    if not estado.is_authenticated:
        raise HTTPException(status_code=401, detail="No autenticado")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post(
    "/api/generar",
    response_model=GenerarResponse,
    dependencies=[Depends(require_auth)],
)
def generar(payload: GenerarRequest) -> GenerarResponse:
    try:
        resumen = llamar_ia(payload.texto)
    except APITimeoutError:
        logger.warning("Timeout llamando al proveedor de IA")
        raise HTTPException(
            status_code=504, detail="El servicio de IA tardó demasiado"
        )
    except (OpenAIError, ValueError) as exc:
        # No logueamos str(exc): puede contener la clave o el cuerpo del proveedor.
        logger.warning("Error del proveedor de IA: %s", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="El servicio de IA no está disponible"
        )
    return GenerarResponse(resumen=resumen)


@app.post(
    "/api/tarot",
    response_model=TarotResponse,
    dependencies=[Depends(require_auth)],
)
def tarot(payload: TarotRequest) -> TarotResponse:
    if payload.fecha > date.today():
        raise HTTPException(status_code=422, detail="La fecha de nacimiento no puede ser futura")
    signo = signo_de(payload.fecha)
    cartas = [
        Carta(indice=i, nombre=ARCANOS[i], posicion=posicion)
        for i, posicion in zip(random.sample(range(len(ARCANOS)), 3), POSICIONES)
    ]
    try:
        lectura = llamar_ia_tarot(payload.fecha, payload.hora, signo, cartas)
    except APITimeoutError:
        logger.warning("Timeout llamando al proveedor de IA")
        raise HTTPException(
            status_code=504, detail="El servicio de IA tardó demasiado"
        )
    except (OpenAIError, ValueError) as exc:
        logger.warning("Error del proveedor de IA: %s", type(exc).__name__)
        raise HTTPException(
            status_code=502, detail="El servicio de IA no está disponible"
        )
    return TarotResponse(signo=signo, cartas=cartas, lectura=lectura)
