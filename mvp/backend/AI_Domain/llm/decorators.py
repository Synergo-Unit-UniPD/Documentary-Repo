import hashlib
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


class CachingLLMAdapter(LLMServiceDecorator):

    def __init__(self, wrapped: LLMService, max_size: int = 256) -> None:
        super().__init__(wrapped)
        self._cache: dict[str, str] = {}
        self._max_size = max_size

    @staticmethod
    def _cache_key(prompt: Prompt) -> str:
        raw = f"{prompt.system_text}\x00{prompt.user_text}".encode("utf-8")
        return hashlib.sha256(raw).hexdigest()

    async def complete(self, prompt: Prompt) -> str:
        key = self._cache_key(prompt)
        if key in self._cache:
            logger.debug("Cache hit")
            return self._cache[key]

        result = await self._wrapped.complete(prompt)

        if self._max_size == 0 or len(self._cache) < self._max_size:
            self._cache[key] = result
        return result
