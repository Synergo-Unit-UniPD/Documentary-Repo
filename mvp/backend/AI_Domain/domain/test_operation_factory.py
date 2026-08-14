import pytest

import AI_Domain.domain.operations  # noqa: F401
from AI_Domain.domain.ai_operation import AIOperation
from AI_Domain.domain.errors import UnknownOperationError
from AI_Domain.domain.operation_factory import AIOperationFactory
from AI_Domain.domain.value_objects import Prompt


def test_available_types_contiene_le_operazioni_registrate():
    factory = AIOperationFactory()
    types = factory.available_types()

    for expected in ["summarize", "translate", "rewrite", "distant_writing", "hat_analysis"]:
        assert expected in types


def test_create_restituisce_istanza_del_tipo_richiesto():
    factory = AIOperationFactory()
    operation = factory.create("summarize", {})

    assert isinstance(operation, AIOperation)
    assert operation.type == "summarize"


def test_create_tipo_sconosciuto_solleva_unknown_operation_error():
    factory = AIOperationFactory()

    with pytest.raises(UnknownOperationError):
        factory.create("operazione_inesistente", {})


def test_register_permette_di_aggiungere_una_nuova_operazione_senza_modificare_ai_service():
    @AIOperationFactory.register
    class _DummyOperation(AIOperation):
        type = "__dummy_test_operation__"

        def build_prompt(self, text: str, params: dict) -> Prompt:
            return Prompt(system_text="dummy", user_text=text)

    try:
        factory = AIOperationFactory()
        assert "__dummy_test_operation__" in factory.available_types()

        instance = factory.create("__dummy_test_operation__", {})
        prompt = instance.build_prompt("ciao", {})
        assert prompt.user_text == "ciao"
    finally:
        AIOperationFactory._registry.pop("__dummy_test_operation__", None)
