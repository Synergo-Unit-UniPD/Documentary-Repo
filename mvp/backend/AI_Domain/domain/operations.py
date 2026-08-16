from .ai_operation import AIOperation
from .hat_type import HatType
from .operation_factory import AIOperationFactory
from .prompt_builder import StandardPromptBuilder
from .value_objects import Prompt


@AIOperationFactory.register
class SummarizeOperation(AIOperation):
    type = "summarize"

    def build_prompt(self, text: str, params: dict) -> Prompt:
        return StandardPromptBuilder().with_operation(self.type).with_text(text).build()


@AIOperationFactory.register
class TranslateOperation(AIOperation):
    type = "translate"

    SUPPORTED_LANGUAGES = ("en", "fr", "es", "de")

    def __init__(self, target_language: str = "en") -> None:
        self._target_language = target_language

    @classmethod
    def from_params(cls, params: dict) -> "TranslateOperation":
        target_language = params.get("target_language", "en")
        if target_language not in cls.SUPPORTED_LANGUAGES:
            raise ValueError(
                f"Lingua di destinazione non supportata: '{target_language}'. "
                f"Disponibili: {cls.SUPPORTED_LANGUAGES}"
            )
        return cls(target_language=target_language)

    def build_prompt(self, text: str, params: dict) -> Prompt:
        return (
            StandardPromptBuilder()
            .with_operation(self.type)
            .with_text(text)
            .with_language(self._target_language)
            .build()
        )


@AIOperationFactory.register
class RewriteOperation(AIOperation):
    type = "rewrite"

    def build_prompt(self, text: str, params: dict) -> Prompt:
        return StandardPromptBuilder().with_operation(self.type).with_text(text).build()


@AIOperationFactory.register
class DistantWritingOperation(AIOperation):
    type = "distant_writing"

    def build_prompt(self, text: str, params: dict) -> Prompt:
        user_prompt = params.get("user_prompt", "")
        combined_text = f"Contesto della nota:\n{text}\n\nIstruzione:\n{user_prompt}" if text else user_prompt
        return StandardPromptBuilder().with_operation(self.type).with_text(combined_text).build()


@AIOperationFactory.register
class HatAnalysisOperation(AIOperation):
    type = "hat_analysis"

    def __init__(self, hat_type: HatType = HatType.WHITE) -> None:
        self._hat_type = hat_type

    @classmethod
    def from_params(cls, params: dict) -> "HatAnalysisOperation":
        hat_value = params.get("hat_type", HatType.WHITE.value)
        hat_type = hat_value if isinstance(hat_value, HatType) else HatType(hat_value)
        return cls(hat_type=hat_type)

    def build_prompt(self, text: str, params: dict) -> Prompt:
        return StandardPromptBuilder().with_operation(self.type).with_text(text).with_hat(self._hat_type).build()
