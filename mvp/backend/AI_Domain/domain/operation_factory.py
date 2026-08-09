from typing import Type

from .ai_operation import AIOperation
from .errors import UnknownOperationError


class AIOperationFactory:
    _registry: dict[str, Type[AIOperation]] = {}

    @classmethod
    def register(cls, op_class: Type[AIOperation]) -> Type[AIOperation]:
        cls._registry[op_class.type] = op_class
        return op_class

    def create(self, type: str, params: dict) -> AIOperation:
        op_class = self._registry.get(type)
        if op_class is None:
            raise UnknownOperationError(
                f"Operazione AI sconosciuta: '{type}'. Disponibili: {self.available_types()}"
            )
        return op_class.from_params(params)

    def available_types(self) -> list[str]:
        return list(self._registry.keys())
