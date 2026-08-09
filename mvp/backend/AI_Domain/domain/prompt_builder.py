from abc import ABC, abstractmethod
from typing import Optional

from .hat_type import HatType
from .value_objects import Prompt


class PromptBuilder(ABC):
    @abstractmethod
    def with_text(self, text: str) -> "PromptBuilder": ...

    @abstractmethod
    def with_operation(self, operation: str) -> "PromptBuilder": ...

    @abstractmethod
    def with_hat(self, hat: HatType) -> "PromptBuilder": ...

    @abstractmethod
    def with_language(self, language: str) -> "PromptBuilder": ...

    @abstractmethod
    def build(self) -> Prompt: ...


class StandardPromptBuilder(PromptBuilder):
    def __init__(self) -> None:
        self._text: Optional[str] = None
        self._operation: Optional[str] = None
        self._hat: Optional[HatType] = None
        self._language: Optional[str] = None

    def with_text(self, text: str) -> "StandardPromptBuilder":
        self._text = text
        return self

    def with_operation(self, operation: str) -> "StandardPromptBuilder":
        self._operation = operation
        return self

    def with_hat(self, hat: HatType) -> "StandardPromptBuilder":
        self._hat = hat
        return self

    def with_language(self, language: str) -> "StandardPromptBuilder":
        self._language = language
        return self

    def build(self) -> Prompt:
        system_parts = ["Sei un assistente di scrittura integrato in un editor Markdown."]

        if self._operation == "summarize":
            system_parts.append("Riassumi il testo fornito mantenendo i concetti chiave, in modo conciso.")
        elif self._operation == "translate":
            target = self._language or "inglese"
            system_parts.append(f"Traduci il testo fornito in {target}, preservando la formattazione Markdown.")
        elif self._operation == "rewrite":
            system_parts.append("Riscrivi il testo fornito migliorandone chiarezza e stile, senza alterarne il significato.")
        elif self._operation == "distant_writing":
            system_parts.append("Genera nuovo contenuto Markdown seguendo le istruzioni dell'utente.")
        elif self._operation == "hat_analysis":
            hat_prompts = {
                HatType.WHITE: "Analizza il testo dal punto di vista dei fatti e dei dati oggettivi.",
                HatType.RED: "Analizza il testo dal punto di vista emotivo e intuitivo.",
                HatType.BLACK: "Analizza il testo evidenziandone criticità, rischi e punti deboli.",
                HatType.YELLOW: "Analizza il testo evidenziandone benefici, opportunità e punti di forza.",
                HatType.GREEN: "Analizza il testo proponendo alternative creative e nuove idee.",
                HatType.BLUE: "Fornisci una visione d'insieme e di processo sul testo.",
            }
            system_parts.append(hat_prompts.get(self._hat, "Analizza il testo fornito."))

        system_text = " ".join(system_parts)
        user_text = self._text or ""

        return Prompt(system_text=system_text, user_text=user_text)
