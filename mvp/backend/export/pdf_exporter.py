import io

from xhtml2pdf import pisa

from export.exporter import Exporter
from export.domain import Content
from export.markdown_renderer import markdown_renderer

_PDF_HTML_TEMPLATE = """<html>
<head>
<style>
  body {{ font-family: Helvetica, Arial, sans-serif; font-size: 11pt; }}
  h1, h2, h3 {{ color: #111827; }}
  code {{ background-color: #f3f4f6; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ border: 1px solid #999999; padding: 4px 8px; }}
</style>
</head>
<body>
{body}
</body>
</html>
"""


class PdfExporter(Exporter):
    """Esportatore concreto per il formato PDF: Markdown -> HTML (markdown-it-py) -> PDF (xhtml2pdf)."""

    def _convert_format(self, content: Content) -> bytes:
        text = content.nodes[0] if content.nodes else ""
        body_html = markdown_renderer.render(text)
        html_string = _PDF_HTML_TEMPLATE.format(body=body_html)

        buffer = io.BytesIO()
        result = pisa.CreatePDF(src=html_string, dest=buffer, encoding="utf-8")
        if result.err:
            raise ValueError(f"xhtml2pdf ha segnalato {result.err} errori durante la conversione")

        return buffer.getvalue()
