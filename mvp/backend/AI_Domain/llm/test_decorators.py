import logging

import pytest

from AI_Domain.domain.errors import LLMUnavailableError
from AI_Domain.domain.value_objects import Prompt
from AI_Domain.llm.decorators import LoggingLLMAdapter
from AI_Domain.llm.llm_service import LLMService


class _CountingLLMService(LLMService):
    """Stub di LLMService che conta le chiamate reali a complete()."""

    def __init__(self, response: str = "risposta") -> None:
        self.calls = 0
        self._response = response

    async def complete(self, prompt: Prompt) -> str:
        self.calls += 1
        return self._response


class _FailingLLMService(LLMService):
    """Stub che solleva sempre l'errore indicato, per verificare che i
    decoratori non lo ingoino né lo alterino."""

    def __init__(self, error: Exception) -> None:
        self._error = error

    async def complete(self, prompt: Prompt) -> str:
        raise self._error


@pytest.mark.asyncio
async def test_logging_adapter_delega_e_non_altera_il_risultato():
    wrapped = _CountingLLMService("ciao")
    adapter = LoggingLLMAdapter(wrapped)

    result = await adapter.complete(Prompt(system_text="sys", user_text="user"))

    assert result == "ciao"
    assert wrapped.calls == 1


@pytest.mark.asyncio
async def test_logging_adapter_registra_richiesta_e_risposta(caplog):
    wrapped = _CountingLLMService("risposta generata")
    adapter = LoggingLLMAdapter(wrapped)

    with caplog.at_level(logging.INFO, logger="secondbrain.llm"):
        await adapter.complete(Prompt(system_text="istruzioni di sistema", user_text="testo utente"))

    messages = [record.message for record in caplog.records]
    assert any("LLM request" in m for m in messages)
    assert any("LLM response" in m for m in messages)


@pytest.mark.asyncio
async def test_logging_adapter_propaga_gli_errori_del_servizio_avvolto():
    original_error = LLMUnavailableError("il modello non risponde")
    wrapped = _FailingLLMService(original_error)
    adapter = LoggingLLMAdapter(wrapped)

    with pytest.raises(LLMUnavailableError) as exc_info:
        await adapter.complete(Prompt(system_text="sys", user_text="user"))

    assert exc_info.value is original_error