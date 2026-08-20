import pytest

from AI_Domain.domain.errors import UnknownOperationError
from AI_Domain.domain.operation_factory import AIOperationFactory
from AI_Domain.domain.value_objects import Prompt
from AI_Domain.llm.llm_service import LLMService
from AI_Domain.service import AIService


class _StubLLMService(LLMService):
    def __init__(self, response: str = "risposta generata") -> None:
        self.last_prompt: Prompt | None = None
        self._response = response

    async def complete(self, prompt: Prompt) -> str:
        self.last_prompt = prompt
        return self._response


@pytest.mark.asyncio
async def test_request_operation_risolve_la_strategia_e_restituisce_una_proposal():
    llm = _StubLLMService("Ecco il riassunto.")
    service = AIService(llm=llm, factory=AIOperationFactory())

    proposal = await service.request_operation(type="summarize", text="testo lungo", params={})

    assert proposal.content == "Ecco il riassunto."
    assert proposal.operation_type == "summarize"
    assert proposal.created_at is not None
    assert llm.last_prompt is not None
    assert llm.last_prompt.user_text == "testo lungo"


@pytest.mark.asyncio
async def test_request_operation_tipo_sconosciuto_propaga_unknown_operation_error():
    service = AIService(llm=_StubLLMService(), factory=AIOperationFactory())

    with pytest.raises(UnknownOperationError):
        await service.request_operation(type="non_esiste", text="testo", params={})


def test_list_operations_espone_i_tipi_disponibili():
    service = AIService(llm=_StubLLMService(), factory=AIOperationFactory())

    types = service.list_operations()

    assert "summarize" in types
    assert "hat_analysis" in types
