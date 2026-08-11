from export.exporter import Exporter
from export.domain import Content

class HtmlExporter(Exporter):
    """Esportatore concreto per il formato HTML."""

    def _convert_format(self, content: Content) -> bytes:
        # Generazione di un semplice scheletro HTML
        text = content.nodes[0] if content.nodes else ""
        html_string = f"<!DOCTYPE html>\n<html>\n<body>\n<p>{text}</p>\n</body>\n</html>"
        return html_string.encode('utf-8')