import logging
from abc import ABC, abstractmethod

from ..domain.value_objects import Prompt
from .llm_service import LLMService

logger = logging.getLogger("secondbrain.llm")


class LLMServiceDecorator(LLMService, ABC):
    def __init__(self, wrapped: LLMService) -> None:
        self._wrapped = wrapped

    @abstractmethod
    async def complete(self, prompt: Prompt) -> str: ...


class LoggingLLMAdapter(LLMServiceDecorator):
    async def complete(self, prompt: Prompt) -> str:
        logger.info("LLM request | system=%r | user_len=%d", prompt.system_text[:80], len(prompt.user_text))
        result = await self._wrapped.complete(prompt)
        logger.info("LLM response | len=%d", len(result))
        return result
