import json
from export.json_exporter import JsonExporter
from export.html_exporter import HtmlExporter
from export.pdf_exporter import PdfExporter


def test_json_exporter():
    """Verifica che JsonExporter formatti correttamente il Content in byte JSON."""
    exporter = JsonExporter()
    # Esegue il template method 'export'
    result = exporter.export("Testo Markdown")

    assert isinstance(result, bytes)
    decoded = json.loads(result.decode("utf-8"))
    assert "nodes" in decoded
    assert "Testo Markdown" in decoded["nodes"]


def test_html_exporter():
    """Verifica che HtmlExporter converta il Markdown in un documento HTML valido (markdown-it-py)."""
    exporter = HtmlExporter()
    result = exporter.export("# Titolo\n\nTesto Markdown")

    assert isinstance(result, bytes)
    decoded = result.decode("utf-8")
    assert "<html" in decoded
    assert "<h1>Titolo</h1>" in decoded
    assert "Testo Markdown" in decoded


def test_pdf_exporter():
    """Verifica che PdfExporter produca un documento PDF valido (markdown-it-py + xhtml2pdf)."""
    exporter = PdfExporter()
    result = exporter.export("# Titolo\n\nTesto Markdown")

    assert isinstance(result, bytes)
    # Un PDF valido inizia sempre con l'header %PDF (i byte successivi sono binari/compressi).
    assert result.startswith(b"%PDF")
    assert len(result) > 200
