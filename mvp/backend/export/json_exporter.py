import json
from export.exporter import Exporter
from export.domain import Content


class JsonExporter(Exporter):
    """Esportatore concreto per il formato JSON."""

    def _convert_format(self, content: Content) -> bytes:
        # Struttura base per l'export JSON
        data = {"nodes": content.nodes}
        return json.dumps(data).encode("utf-8")
