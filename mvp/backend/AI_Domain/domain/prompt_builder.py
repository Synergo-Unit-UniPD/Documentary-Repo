from abc import ABC, abstractmethod

from .hat_type import HatType
from .value_objects import Prompt

# Mappa i codici lingua ISO 639-1 usati dal frontend (R50-F-O) al nome
# italiano da inserire nel prompt di sistema: il modello riceve istruzioni
# in italiano indipendentemente dalla lingua di destinazione della traduzione.
# Se il codice non è mappato, si usa direttamente il valore ricevuto come
# fallback, per non bloccare l'operazione su lingue non ancora previste.
_LANGUAGE_NAMES = {
    "en": "inglese",
    "fr": "francese",
    "es": "spagnolo",
    "de": "tedesco",
}


class PromptBuilder(ABC):
    """
    Interfaccia del pattern Builder (GoF, creazionale — Specifica Tecnica
    §5.1.3): costruisce gradualmente un Prompt componendo testo, tipo di
    operazione AI, cappello (per l'analisi critica) e lingua di destinazione,
    per poi assemblarli in un'unica chiamata a build(). Ogni metodo "with_*"
    ritorna il builder stesso per permettere la concatenazione fluida delle
    chiamate (es. builder.with_text(...).with_operation(...).build()).
    """

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
    """
    Implementazione concreta del Builder: accumula lo stato tramite i metodi
    "with_*" e genera in build() il prompt di sistema specifico per
    l'operazione richiesta (riassunto, traduzione, riscrittura, Distant
    Writing, analisi Sei Cappelli — R48-R68), più un blocco di istruzioni
    di formato comune a tutte le operazioni.
    """

    def __init__(self) -> None:
        self._text: str | None = None
        self._operation: str | None = None
        self._hat: HatType | None = None
        self._language: str | None = None

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
            # Il codice lingua arriva dal frontend in minuscolo (default "en"
            # se assente); si traduce nel nome italiano per il prompt, con
            # fallback al codice stesso se non è tra le lingue mappate.
            code = (self._language or "en").lower()
            target = _LANGUAGE_NAMES.get(code, self._language or "inglese")
            system_parts.append(
                f"Traduci il testo fornito interamente in lingua {target.upper()}. "
                f"L'output deve essere scritto in {target}, non in italiano. "
                "Preserva la formattazione Markdown. "
                "Non includere il testo originale, né trascrizioni fonetiche, né traduzioni alternative "
                "tra parentesi: restituisci un'unica traduzione."
            )
        elif self._operation == "rewrite":
            system_parts.append(
                "Riscrivi il testo fornito migliorandone chiarezza e stile, senza alterarne il significato."
            )
        elif self._operation == "distant_writing":
            system_parts.append("Genera nuovo contenuto Markdown seguendo le istruzioni dell'utente.")
        elif self._operation == "hat_analysis":
            # Le sei prospettive del metodo "Sei Cappelli per Pensare" di
            # De Bono (R57-R68): ciascun HatType corrisponde a un'istruzione
            # di analisi diversa applicata allo stesso testo selezionato.
            hat_prompts = {
                HatType.WHITE: "Analizza il testo dal punto di vista dei fatti e dei dati oggettivi.",
                HatType.RED: "Analizza il testo dal punto di vista emotivo e intuitivo.",
                HatType.BLACK: "Analizza il testo evidenziandone criticità, rischi e punti deboli.",
                HatType.YELLOW: "Analizza il testo evidenziandone benefici, opportunità e punti di forza.",
                HatType.GREEN: "Analizza il testo proponendo alternative creative e nuove idee.",
                HatType.BLUE: "Fornisci una visione d'insieme e di processo sul testo.",
            }
            if self._hat is not None:
                system_parts.append(hat_prompts[self._hat])
            else:
                # Nessun cappello specificato: fallback a un'istruzione
                # generica, per non far fallire la richiesta.
                system_parts.append("Analizza il testo fornito.")

        # Istruzioni di formato comuni a TUTTE le operazioni: il testo
        # generato dal modello viene mostrato in un modale (R74-F-O) e, se
        # accettato, inserito direttamente nel documento (R69-F-O) senza
        # ulteriore elaborazione lato client — per questo il prompt vieta
        # esplicitamente premesse, spiegazioni o markup accessorio che
        # renderebbero l'output non direttamente utilizzabile.
        system_parts.append(
            "Rispondi ESCLUSIVAMENTE con il testo risultante, pronto per essere inserito "
            "direttamente nel documento al posto del testo originale. Non aggiungere "
            'introduzioni (es. "Ecco il risultato:"), spiegazioni, commenti, note tra '
            'parentesi, opzioni alternative, o frasi di chiusura (es. "Spero sia utile"). '
            "Non racchiudere la risposta tra virgolette o blocchi di codice a meno che il "
            "contenuto stesso non sia codice. Non ripetere il testo originale, a meno che "
            "l'istruzione non lo richieda esplicitamente."
        )

        system_text = " ".join(system_parts)
        user_text = self._text or ""

        return Prompt(system_text=system_text, user_text=user_text)
