from unittest.mock import AsyncMock, patch

import httpx
import openai
import pytest

from AI_Domain.domain.errors import LLMTimeoutError, LLMUnavailableError
from AI_Domain.domain.value_objects import Prompt
from AI_Domain.llm.openai_adapter import OpenAIAdapter


def _make_openai_response(content: str | None):
    message = type("Message", (), {"content": content})()
    choice = type("Choice", (), {"message": message})()
    return type("Response", (), {"choices": [choice]})()


@pytest.fixture
def adapter():
    return OpenAIAdapter(api_key="fake-key", base_url="https://fake.test", model="fake-model")


@pytest.mark.asyncio
async def test_complete_restituisce_il_contenuto_della_risposta(adapter):
    response = _make_openai_response("Ecco il testo generato.")

    with patch.object(adapter._client.chat.completions, "create", new=AsyncMock(return_value=response)):
        result = await adapter.complete(Prompt(system_text="sistema", user_text="utente"))

    assert result == "Ecco il testo generato."


@pytest.mark.asyncio
async def test_complete_toglie_spazi_bianchi_superflui(adapter):
    response = _make_openai_response("  testo con spazi attorno  \n")

    with patch.object(adapter._client.chat.completions, "create", new=AsyncMock(return_value=response)):
        result = await adapter.complete(Prompt(system_text="sistema", user_text="utente"))

    assert result == "testo con spazi attorno"


@pytest.mark.asyncio
async def test_complete_gestisce_content_none_senza_eccezioni(adapter):
    response = _make_openai_response(None)

    with patch.object(adapter._client.chat.completions, "create", new=AsyncMock(return_value=response)):
        result = await adapter.complete(Prompt(system_text="sistema", user_text="utente"))

    assert result == ""


@pytest.mark.asyncio
async def test_complete_rimuove_il_ragionamento_del_modello_quando_presente(adapter):
    """Riproduce lo scenario segnalato: alcuni modelli (es. Gemma) possono
    restituire, nello stesso campo "content", sia il proprio ragionamento
    interno sia la risposta finale, separati da marcatori di canale in
    chiaro ("<|channel>thought" / "<channel|>"). Deve rimanere solo l'ultimo
    segmento, la vera risposta finale."""
    raw_with_reasoning = (
        "<|channel>thought\n"
        "* Role: Writing assistant in a Markdown editor.\n"
        "* Task: Translate text into English.\n"
        "Let's go with a natural version.\n"
        "<channel|>Hello, my name is Andrea and I am 18 years old."
    )
    response = _make_openai_response(raw_with_reasoning)

    with patch.object(adapter._client.chat.completions, "create", new=AsyncMock(return_value=response)):
        result = await adapter.complete(Prompt(system_text="sistema", user_text="utente"))

    assert result == "Hello, my name is Andrea and I am 18 years old."
    assert "channel" not in result
    assert "thought" not in result


@pytest.mark.asyncio
async def test_complete_non_tocca_le_risposte_normali_senza_marcatori_di_canale(adapter):
    response = _make_openai_response("Ecco il riassunto generato, nessun ragionamento visibile.")

    with patch.object(adapter._client.chat.completions, "create", new=AsyncMock(return_value=response)):
        result = await adapter.complete(Prompt(system_text="sistema", user_text="utente"))

    assert result == "Ecco il riassunto generato, nessun ragionamento visibile."


@pytest.mark.asyncio
async def test_complete_traduce_timeout_in_llm_timeout_error(adapter):
    fake_request = httpx.Request("POST", "https://fake.test")
    timeout_error = openai.APITimeoutError(request=fake_request)

    with (
        patch.object(adapter._client.chat.completions, "create", new=AsyncMock(side_effect=timeout_error)),
        pytest.raises(LLMTimeoutError) as exc_info,
    ):
        await adapter.complete(Prompt(system_text="sistema", user_text="utente"))

    assert "fake-model" in exc_info.value.message


@pytest.mark.asyncio
async def test_complete_traduce_connection_error_in_llm_unavailable_error(adapter):
    fake_request = httpx.Request("POST", "https://fake.test")
    connection_error = openai.APIConnectionError(request=fake_request)

    with (
        patch.object(adapter._client.chat.completions, "create", new=AsyncMock(side_effect=connection_error)),
        pytest.raises(LLMUnavailableError),
    ):
        await adapter.complete(Prompt(system_text="sistema", user_text="utente"))


@pytest.mark.asyncio
async def test_complete_traduce_api_status_error_in_llm_unavailable_error(adapter):
    fake_request = httpx.Request("POST", "https://fake.test")
    fake_httpx_response = httpx.Response(status_code=500, request=fake_request)
    status_error = openai.APIStatusError("Internal Server Error", response=fake_httpx_response, body=None)

    with (
        patch.object(adapter._client.chat.completions, "create", new=AsyncMock(side_effect=status_error)),
        pytest.raises(LLMUnavailableError),
    ):
        await adapter.complete(Prompt(system_text="sistema", user_text="utente"))
