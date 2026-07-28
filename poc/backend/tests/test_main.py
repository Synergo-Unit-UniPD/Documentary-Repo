from fastapi.testclient import TestClient
from main import app

# Inizializziamo il client di test di FastAPI
client = TestClient(app)


def test_status_endpoint():
    """Verifica che l'endpoint /api/status risponda con HTTP 200 e il JSON atteso."""
    response = client.get("/api/status")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}