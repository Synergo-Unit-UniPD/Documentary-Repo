from export.exporter import Exporter
from export.domain import Content
from export.markdown_renderer import markdown_renderer

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="utf-8">
<title>Second Brain - Nota esportata</title>
<style>
  body {{ font-family: -apple-system, Segoe UI, Helvetica, Arial, sans-serif; max-width: 860px; margin: 40px auto; padding: 0 20px; color: #1f2933; line-height: 1.6; }}
  h1, h2, h3 {{ color: #111827; }}
  code {{ background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }}
  pre {{ background: #f3f4f6; padding: 12px; border-radius: 8px; overflow-x: auto; }}
  blockquote {{ border-left: 4px solid #d1d5db; margin: 0; padding-left: 16px; color: #4b5563; }}
  table {{ border-collapse: collapse; width: 100%; }}
  th, td {{ border: 1px solid #d1d5db; padding: 6px 10px; }}
</style>
</head>
<body>
{body}
</body>
</html>
"""


class HtmlExporter(Exporter):
    """Esportatore concreto per il formato HTML: converte il Markdown in HTML tramite markdown-it-py."""

    def _convert_format(self, content: Content) -> bytes:
        text = content.nodes[0] if content.nodes else ""
        body_html = markdown_renderer.render(text)
        html_string = _HTML_TEMPLATE.format(body=body_html)
        return html_string.encode("utf-8")
