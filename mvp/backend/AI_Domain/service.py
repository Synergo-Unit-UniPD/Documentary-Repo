from datetime import datetime, timezone

from .domain.operation_factory import AIOperationFactory
from .domain.value_objects import Proposal
from .llm.llm_service import LLMService


class AIService:
    def __init__(self, llm: LLMService, factory: AIOperationFactory | None = None) -> None:
        self._llm = llm
        self._factory = factory if factory is not None else AIOperationFactory()

    async def request_operation(self, type: str, text: str, params: dict) -> Proposal:
        operation = self._factory.create(type, params)
        prompt = operation.build_prompt(text, params)
        content = await self._llm.complete(prompt)
        return Proposal(
            content=content,
            operation_type=type,
            created_at=datetime.now(timezone.utc),
        )

    def list_operations(self) -> list[str]:
        return self._factory.available_types()
