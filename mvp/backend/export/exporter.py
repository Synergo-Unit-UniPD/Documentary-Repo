from abc import ABC, abstractmethod
from typing import final
from export.domain import Content
from export.exceptions import ConversionError


class Exporter(ABC):
    """
    Classe astratta che definisce il Template Method per l'esportazione.
    """

    @final
    def export(self, content: str) -> bytes:
        """
        Template Method: definisce l'algoritmo immutabile di esportazione.
        @final impedisce alle sottoclassi di sovrascrivere questo metodo.
        """
        # Step 3: prepare_content(content)
        ast_content = self._prepare_content(content)

        try:
            # Step 4: convert_format(astContent)
            return self._convert_format(ast_content)
        except Exception as e:
            if isinstance(e, ConversionError):
                raise
            # raised se convert_format fallisce
            raise ConversionError(f"Errore durante la conversione del formato: {str(e)}") from e

    def _prepare_content(self, content: str) -> Content:
        """
        Passo implementato nella classe base.
        Trasforma la stringa markdown grezza in un ValueObject Content.
        """
        return Content(nodes=[content])

    @abstractmethod
    def _convert_format(self, content: Content) -> bytes:
        """
        Passo specifico (variabile) delegato alle sottoclassi concrete
        (JsonExporter, HtmlExporter, PdfExporter).
        """
        pass
