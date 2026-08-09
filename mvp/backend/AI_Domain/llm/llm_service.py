from abc import ABC, abstractmethod

from ..domain.value_objects import Prompt


class LLMService(ABC):
    @abstractmethod
    async def complete(self, prompt: Prompt) -> str: ...
