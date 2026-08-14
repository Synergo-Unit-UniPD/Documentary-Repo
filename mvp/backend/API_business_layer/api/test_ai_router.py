from datetime import datetime, UTC

import pytest
from fastapi.testclient import TestClient

import main
from AI_Domain.domain.errors import LLMTimeoutError, LLMUnavailableError, UnknownOperationError
from AI_Domain.domain.value_objects import Proposal
from API_business_layer.di.providers import get_ai_service


class _FakeAIService:
    """Doppio di test per AIService, iniettato tramite dependency override di FastAPI."""

    def __init__(self, response_content: str = "risposta finta", raise_error: Exception | None = None) -> None:
        self._response_content = response_content
        self._raise_error = raise_error
        self.received: dict[str, object] | None = None

    async def request_operation(self, type: str, text: str, params: dict) -> Proposal:
        self.received = {"type": type, "text": text, "params": params}
        if self._raise_error is not None:
            raise self._raise_error
        return Proposal(content=self._response_content, operation_type=type, created_at=datetime.now(UTC))

    def list_operations(self) -> list[str]:
        return ["summarize", "translate", "rewrite", "distant_writing", "hat_analysis"]


@pytest.fixture
def client():
    return TestClient(main.app)


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    main.app.dependency_overrides.clear()


def test_post_operations_restituisce_la_proposta_generata(client):
    fake_service = _FakeAIService(response_content="Ecco il riassunto generato.")
    main.app.dependency_overrides[get_ai_service] = lambda: fake_service

    response = client.post(
        "/api/ai/operations",
        json={"type": "summarize", "text": "testo lungo da riassumere", "params": {}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["content"] == "Ecco il riassunto generato."
    assert body["operation_type"] == "summarize"
    assert "created_at" in body
    assert fake_service.received == {"type": "summarize", "text": "testo lungo da riassumere", "params": {}}


def test_get_operations_restituisce_lelenco_disponibile(client):
    fake_service = _FakeAIService()
    main.app.dependency_overrides[get_ai_service] = lambda: fake_service

    response = client.get("/api/ai/operations")

    assert response.status_code == 200
    body = response.json()
    assert "summarize" in body
    assert "hat_analysis" in body


def test_post_operations_tipo_sconosciuto_restituisce_400(client):
    fake_service = _FakeAIService(raise_error=UnknownOperationError("Operazione AI sconosciuta: 'boh'"))
    main.app.dependency_overrides[get_ai_service] = lambda: fake_service

    response = client.post("/api/ai/operations", json={"type": "boh", "text": "x", "params": {}})

    assert response.status_code == 400
    body = response.json()
    assert body["error"] == "UnknownOperationError"


def test_post_operations_llm_unavailable_restituisce_503(client):
    fake_service = _FakeAIService(raise_error=LLMUnavailableError("LLM non raggiungibile"))
    main.app.dependency_overrides[get_ai_service] = lambda: fake_service

    response = client.post("/api/ai/operations", json={"type": "summarize", "text": "x", "params": {}})

    assert response.status_code == 503
    assert response.json()["error"] == "LLMUnavailableError"


def test_post_operations_llm_timeout_restituisce_504(client):
    fake_service = _FakeAIService(raise_error=LLMTimeoutError("Timeout LLM"))
    main.app.dependency_overrides[get_ai_service] = lambda: fake_service

    response = client.post("/api/ai/operations", json={"type": "summarize", "text": "x", "params": {}})

    assert response.status_code == 504
    assert response.json()["error"] == "LLMTimeoutError"


def test_post_operations_valida_il_payload_mancante(client):
    # Anche se la richiesta non dovrebbe mai raggiungere il servizio applicativo
    # (fallisce prima in fase di validazione Pydantic), sovrascriviamo comunque
    # la dipendenza per isolare il test dalla configurazione reale dell'LLM.
    main.app.dependency_overrides[get_ai_service] = lambda: _FakeAIService()

    response = client.post("/api/ai/operations", json={"type": "summarize"})

    assert response.status_code == 422
