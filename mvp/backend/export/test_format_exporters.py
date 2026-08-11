import pytest
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
    decoded = json.loads(result.decode('utf-8'))
    assert "nodes" in decoded
    assert "Testo Markdown" in decoded["nodes"]

def test_html_exporter():
    """Verifica che HtmlExporter formatti correttamente il Content in byte HTML."""
    exporter = HtmlExporter()
    result = exporter.export("Testo Markdown")
    
    assert isinstance(result, bytes)
    decoded = result.decode('utf-8')
    assert "<html>" in decoded
    assert "Testo Markdown" in decoded

def test_pdf_exporter():
    """Verifica che PdfExporter formatti correttamente il Content in byte PDF."""
    exporter = PdfExporter()
    result = exporter.export("Testo Markdown")
    
    assert isinstance(result, bytes)
    decoded = result.decode('utf-8')
    assert "%PDF" in decoded
    assert "Testo Markdown" in decoded