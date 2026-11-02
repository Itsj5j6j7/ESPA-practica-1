"""Tests del contrato de la API (plan/plan.md §Contrato de la API).

El verificador de Clerk y el proveedor de IA se simulan con monkeypatch:
ningún test hace una llamada real a OpenRouter ni a Clerk.
"""

from types import SimpleNamespace

import httpx
import pytest
from fastapi.testclient import TestClient
from openai import APITimeoutError, OpenAIError

from api.index import app

AUTH_HEADERS = {"Authorization": "Bearer token-de-prueba"}

client = TestClient(app)


@pytest.fixture(autouse=True)
def verificador_simulado(monkeypatch):
    """Acepta solo el token de prueba, sin llamar a Clerk."""

    def verificar(request, options):
        return SimpleNamespace(
            is_authenticated=request.headers.get("Authorization")
            == AUTH_HEADERS["Authorization"]
        )

    monkeypatch.setattr("api.index.authenticate_request", verificar)


def test_health_is_public_and_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generar_rejects_request_without_token():
    response = client.post(
        "/api/generar",
        json={"texto": "Texto de prueba largo suficiente para resumir."},
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "No autenticado"}


def test_generar_happy_path_with_mocked_provider(monkeypatch):
    def proveedor_falso(texto: str) -> str:
        assert texto == "Texto de prueba largo suficiente para resumir."
        return "Resumen de prueba."

    monkeypatch.setattr("api.index.llamar_ia", proveedor_falso)

    response = client.post(
        "/api/generar",
        json={"texto": "Texto de prueba largo suficiente para resumir."},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    assert response.json() == {"resumen": "Resumen de prueba."}


@pytest.mark.parametrize(
    "texto",
    ["", "x" * 2001],
    ids=["vacio", "mas-de-2000-caracteres"],
)
def test_generar_rejects_invalid_input(texto):
    response = client.post(
        "/api/generar",
        json={"texto": texto},
        headers=AUTH_HEADERS,
    )
    assert response.status_code == 422


def test_generar_returns_generic_502_on_provider_failure(monkeypatch):
    def proveedor_fallo(texto: str) -> str:
        raise OpenAIError("CLAVE_SECRETA detalle interno del proveedor")

    monkeypatch.setattr("api.index.llamar_ia", proveedor_fallo)

    response = client.post(
        "/api/generar",
        json={"texto": "Texto de prueba."},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 502
    assert response.json() == {"detail": "El servicio de IA no está disponible"}
    assert "CLAVE_SECRETA" not in response.text


def test_generar_returns_504_on_provider_timeout(monkeypatch):
    def proveedor_lento(texto: str) -> str:
        raise APITimeoutError(request=httpx.Request("POST", "http://test"))

    monkeypatch.setattr("api.index.llamar_ia", proveedor_lento)

    response = client.post(
        "/api/generar",
        json={"texto": "Texto de prueba."},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 504
    assert response.json() == {"detail": "El servicio de IA tardó demasiado"}


def test_tarot_rejects_request_without_token():
    response = client.post("/api/tarot", json={"fecha": "2000-11-05", "hora": "14:30"})

    assert response.status_code == 401
    assert response.json() == {"detail": "No autenticado"}


def test_tarot_happy_path_with_mocked_provider(monkeypatch):
    def proveedor_falso(fecha, hora, signo, cartas):
        assert signo == "Escorpio"
        assert len(cartas) == 3
        return "Lectura de prueba."

    monkeypatch.setattr("api.index.llamar_ia_tarot", proveedor_falso)

    response = client.post(
        "/api/tarot",
        json={"fecha": "2000-11-05", "hora": "14:30"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["signo"] == "Escorpio"
    assert body["lectura"] == "Lectura de prueba."
    assert [c["posicion"] for c in body["cartas"]] == ["Pasado", "Presente", "Futuro"]
    assert len({c["indice"] for c in body["cartas"]}) == 3


@pytest.mark.parametrize(
    "payload",
    [{}, {"fecha": "no-es-fecha"}, {"fecha": "1800-01-01"}, {"fecha": "2999-01-01"}],
    ids=["sin-fecha", "formato-invalido", "anterior-a-1900", "futura"],
)
def test_tarot_rejects_invalid_input(payload):
    response = client.post("/api/tarot", json=payload, headers=AUTH_HEADERS)
    assert response.status_code == 422


def test_tarot_returns_generic_502_on_provider_failure(monkeypatch):
    def proveedor_fallo(*args):
        raise OpenAIError("CLAVE_SECRETA detalle interno del proveedor")

    monkeypatch.setattr("api.index.llamar_ia_tarot", proveedor_fallo)

    response = client.post(
        "/api/tarot",
        json={"fecha": "2000-11-05"},
        headers=AUTH_HEADERS,
    )

    assert response.status_code == 502
    assert "CLAVE_SECRETA" not in response.text
