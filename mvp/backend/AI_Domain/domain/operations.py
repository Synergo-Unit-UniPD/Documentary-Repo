from .ai_operation import AIOperation
from .hat_type import HatType
from .operation_factory import AIOperationFactory
from .prompt_builder import StandardPromptBuilder
from .value_objects import Prompt

# Ogni operazione AI concreta (R48-R68) si auto-registra nella factory
# tramite il decoratore @AIOperationFactory.register, associando la classe
# alla stringa "type" ricevuta dal frontend (pattern Factory Method, GoF
# creazionale — Specifica Tecnica §5.1.2): l'API layer non deve conoscere
# le classi concrete, ma solo il tipo testuale dell'operazione richiesta.


@AIOperationFactory.register
class SummarizeOperation(AIOperation):
    type = "summarize"

    def build_prompt(self, text: str, params: dict) -> Prompt:
        return StandardPromptBuilder().with_operation(self.type).with_text(text).build()


@AIOperationFactory.register
class TranslateOperation(AIOperation):
    type = "translate"

    # Lingue disponibili per la traduzione (R50-F-O: inglese, francese,
    # spagnolo obbligatorie; tedesco desiderabile, R52-F-D).
    SUPPORTED_LANGUAGES = ("en", "fr", "es", "de")

    def __init__(self, target_language: str = "en") -> None:
        self._target_language = target_language

    @classmethod
    def from_params(cls, params: dict) -> "TranslateOperation":
        # Validazione a livello di dominio, indipendente dal validatore
        # dello schema API (schemas/ai_schemas.py): protegge anche eventuali
        # chiamate dirette al dominio che bypassano il layer API.
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
        # Distant Writing (R55-F-O) può partire da nota vuota (solo prompt
        # utente) o con contenuto esistente selezionato come contesto: in
        # quel caso il testo della nota e l'istruzione vengono combinati in
        # un unico messaggio, così il modello genera contenuto coerente con
        # quanto già scritto invece di ignorarlo.
        user_prompt = params.get("user_prompt", "")
        combined_text = f"Contesto della nota:\n{text}\n\nIstruzione:\n{user_prompt}" if text else user_prompt
        return StandardPromptBuilder().with_operation(self.type).with_text(combined_text).build()


@AIOperationFactory.register
class HatAnalysisOperation(AIOperation):
    type = "hat_analysis"

    # Cappello Bianco come default (R57-F-O): usato solo se from_params non
    # viene chiamato esplicitamente o se params non specifica hat_type.
    def __init__(self, hat_type: HatType = HatType.WHITE) -> None:
        self._hat_type = hat_type

    @classmethod
    def from_params(cls, params: dict) -> "HatAnalysisOperation":
        hat_value = params.get("hat_type", HatType.WHITE.value)
        hat_type = hat_value if isinstance(hat_value, HatType) else HatType(hat_value)
        return cls(hat_type=hat_type)

    def build_prompt(self, text: str, params: dict) -> Prompt:
        return StandardPromptBuilder().with_operation(self.type).with_text(text).with_hat(self._hat_type).build()
