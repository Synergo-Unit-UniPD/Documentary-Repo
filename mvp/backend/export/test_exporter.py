import pytest
from dataclasses import FrozenInstanceError
from export.exceptions import ExportError, ConversionError
from export.domain import Content
from export.exporter import Exporter


class DummySuccessExporter(Exporter):
    """Mock di un esportatore concreto per testare il flusso corretto."""

    def _convert_format(self, content: Content) -> bytes:
        return b"pdf_bytes_success"


class DummyFailExporter(Exporter):
    """Mock di un esportatore che fallisce durante la conversione."""

    def _convert_format(self, content: Content) -> bytes:
        raise ValueError("Simulazione di errore interno")


def test_content_value_object():
    """Verifica la corretta inizializzazione e l'immutabilità del Value Object Content."""
    content = Content(nodes=["node1", "node2"])
    assert content.nodes == ["node1", "node2"]

    # Verifica che la dataclass sia frozen (principio DDD)
    with pytest.raises(FrozenInstanceError):
        content.nodes = ["new_node"]


def test_exporter_prepare_content():
    """Verifica che il passo comune prepare_content restituisca un oggetto Content."""
    exporter = DummySuccessExporter()
    ast_content = exporter._prepare_content("# Markdown")

    assert isinstance(ast_content, Content)
    assert isinstance(ast_content.nodes, list)
    assert "# Markdown" in ast_content.nodes


def test_exporter_template_method_success():
    """Verifica il flusso completo (Step 2, 3, 4, 6 del diagramma di sequenza)."""
    exporter = DummySuccessExporter()
    result = exporter.export("# Markdown Title")

    assert result == b"pdf_bytes_success"


def test_exporter_template_method_raises_conversion_error():
    """Verifica che un'eccezione in convert_format venga wrappata in un ConversionError."""
    exporter = DummyFailExporter()

    with pytest.raises(ConversionError) as exc_info:
        exporter.export("some text")

    assert "Simulazione di errore interno" in str(exc_info.value)
    assert isinstance(exc_info.value, ExportError)
