from abc import ABC, abstractmethod
from typing import ClassVar

from .value_objects import Prompt


class AIOperation(ABC):
    type: ClassVar[str]

    @classmethod
    def from_params(cls, params: dict) -> "AIOperation":
        return cls()

    @abstractmethod
    def build_prompt(self, text: str, params: dict) -> Prompt: ...
