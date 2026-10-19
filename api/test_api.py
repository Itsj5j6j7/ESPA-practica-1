"""Tests del contrato de la API (plan/plan.md §Contrato de la API).

El proveedor de IA se simula con monkeypatch sobre `api.index.llamar_ia`:
ningún test hace una llamada real a OpenRouter ni a Clerk.
"""

from fastapi.testclient import TestClient

from api.index import app

client = TestClient(app)


def test_health_is_public_and_ok():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_generar_happy_path_with_mocked_provider(monkeypatch):
    def proveedor_falso(texto: str) -> str:
        assert texto == "Texto de prueba largo suficiente para resumir."
        return "Resumen de prueba."

    monkeypatch.setattr("api.index.llamar_ia", proveedor_falso)

    response = client.post(
        "/api/generar",
        json={"texto": "Texto de prueba largo suficiente para resumir."},
    )

    assert response.status_code == 200
    assert response.json() == {"resumen": "Resumen de prueba."}

