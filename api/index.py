import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from openai import OpenAI
from pydantic import BaseModel, Field

load_dotenv()

app = FastAPI(title="Resumidor", version="0.1.0")

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


class GenerarRequest(BaseModel):
    texto: str = Field(..., min_length=1, max_length=2000)


class GenerarResponse(BaseModel):
    resumen: str


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


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/generar", response_model=GenerarResponse)
def generar(payload: GenerarRequest) -> GenerarResponse:
    return GenerarResponse(resumen=llamar_ia(payload.texto))
