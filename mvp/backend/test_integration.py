"""
Test di integrazione end-to-end: avvia l'app FastAPI reale (con i suoi router,
DI providers ed error handler cablati come in produzione, fatta eccezione per il
solo LLMService che viene sostituito con un doppio per evitare chiamate di rete
reali) e ne esercita il flusso completo così come lo percorrerebbe il Frontend.
"""

import pytest
from fastapi.testclient import TestClient

import main
from AI_Domain.domain.errors import LLMUnavailableError
from AI_Domain.domain.operation_factory import AIOperationFactory
from AI_Domain.domain.value_objects import Prompt
from AI_Domain.llm.llm_service import LLMService
from AI_Domain.service import AIService
from API_business_layer.di.providers import get_ai_service


class _StubLLMService(LLMService):
    """Sostituisce l'OpenAIAdapter reale: nessuna chiamata di rete durante i test."""

    def __init__(self, response: str = "Risposta simulata dell'LLM.", raise_error: Exception | None = None) -> None:
        self._response = response
        self._raise_error = raise_error

    async def complete(self, prompt: Prompt) -> str:
        if self._raise_error is not None:
            raise self._raise_error
        return self._response


@pytest.fixture(autouse=True)
def _clear_overrides():
    yield
    main.app.dependency_overrides.clear()


@pytest.fixture
def client():
    return TestClient(main.app)


def test_status_endpoint(client):
    response = client.get("/api/status")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_flusso_completo_richiesta_ai_riassunto(client):
    """Riproduce il diagramma 'Richiesta AI (tratto REST->LLM)': l'AIService reale
    risolve la Strategy tramite la Simple Factory e costruisce il Prompt tramite
    il PromptBuilder; solo l'ultimo anello (LLM) è sostituito da uno stub."""
    stub_llm = _StubLLMService("Riassunto generato dallo stub.")
    main.app.dependency_overrides[get_ai_service] = lambda: AIService(llm=stub_llm, factory=AIOperationFactory())

    response = client.post(
        "/api/ai/operations",
        json={"type": "summarize", "text": "Un testo piuttosto lungo da riassumere.", "params": {}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["content"] == "Riassunto generato dallo stub."
    assert body["operation_type"] == "summarize"


def test_flusso_completo_errore_llm_non_disponibile_propaga_503(client):
    stub_llm = _StubLLMService(raise_error=LLMUnavailableError("LLM irraggiungibile"))
    main.app.dependency_overrides[get_ai_service] = lambda: AIService(llm=stub_llm, factory=AIOperationFactory())

    response = client.post(
        "/api/ai/operations",
        json={"type": "rewrite", "text": "testo", "params": {}},
    )

    assert response.status_code == 503
    assert response.json()["error"] == "LLMUnavailableError"


def test_flusso_completo_esportazione_dopo_operazione_ai(client):
    """Simula il ciclo 'genera con AI -> accetta -> esporta la nota' interamente lato Backend:
    la Proposal ottenuta da /api/ai/operations viene incollata nel Markdown e poi esportata."""
    stub_llm = _StubLLMService("Paragrafo generato dall'AI.")
    main.app.dependency_overrides[get_ai_service] = lambda: AIService(llm=stub_llm, factory=AIOperationFactory())

    ai_response = client.post(
        "/api/ai/operations",
        json={"type": "distant_writing", "text": "", "params": {"user_prompt": "scrivi un paragrafo"}},
    )
    assert ai_response.status_code == 200
    generated_text = ai_response.json()["content"]

    note_markdown = f"# La mia nota\n\n{generated_text}\n"
    export_response = client.post("/api/export/html", json={"content": note_markdown})

    assert export_response.status_code == 200
    assert b"La mia nota" in export_response.content
    assert b"Paragrafo generato dall" in export_response.content


def test_list_operations_e_coerente_con_le_operazioni_disponibili(client):
    stub_llm = _StubLLMService()
    main.app.dependency_overrides[get_ai_service] = lambda: AIService(llm=stub_llm, factory=AIOperationFactory())

    response = client.get("/api/ai/operations")

    assert response.status_code == 200
    operations = response.json()
    for expected in ["summarize", "translate", "rewrite", "distant_writing", "hat_analysis"]:
        assert expected in operations
