from unittest.mock import AsyncMock, patch

import pytest

import presentation_layer.di.providers as providers_module
from presentation_layer.di.providers import get_ai_service
from config import Settings


@pytest.fixture(autouse=True)
def _llm_env(monkeypatch):
    # `settings` è un dataclass frozen istanziato una sola volta all'import di
    # config.py: impostare le variabili d'ambiente non basta a farlo rileggere.
    # Costruiamo una nuova Settings() (che rilegge i getenv ora aggiornati) e
    # sostituiamo il riferimento usato dalla composition root.
    monkeypatch.setenv("ZUCCHETTI_LLM_BASE_URL", "https://llm.test.invalid")
    monkeypatch.setenv("ZUCCHETTI_LLM_API_KEY", "sk-test")
    monkeypatch.setattr(providers_module, "settings", Settings())
    get_ai_service.cache_clear()
    yield
    get_ai_service.cache_clear()


def _make_openai_response(content: str):
    message = type("Message", (), {"content": content})()
    choice = type("Choice", (), {"message": message})()
    return type("Response", (), {"choices": [choice]})()


@pytest.mark.asyncio
async def test_get_ai_service_non_usa_la_cache_richieste_identiche_rielaborano_sempre():
    service = get_ai_service()

    with patch.object(
        service._llm._wrapped._client.chat.completions,
        "create",
        new=AsyncMock(
            side_effect=[
                _make_openai_response("Prima elaborazione"),
                _make_openai_response("Seconda elaborazione"),
            ]
        ),
    ) as mock_create:
        first = await service.request_operation(
            type="hat_analysis", text="Una frattura in una roccia.", params={"hat_type": "white"}
        )
        second = await service.request_operation(
            type="hat_analysis", text="Una frattura in una roccia.", params={"hat_type": "white"}
        )

    assert mock_create.call_count == 2
    assert first.content == "Prima elaborazione"
    assert second.content == "Seconda elaborazione"
    assert second.content != first.content
