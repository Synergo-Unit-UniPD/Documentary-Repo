from export.exporter import Exporter
from export.domain import Content

class PdfExporter(Exporter):
    """Esportatore concreto per il formato PDF."""

    def _convert_format(self, content: Content) -> bytes:
        # Generazione di una stringa formattata come file PDF
        text = content.nodes[0] if content.nodes else ""
        pdf_mock = f"%PDF-1.4\n% Mock PDF Content\n{text}\n%%EOF"
        return pdf_mock.encode('utf-8')