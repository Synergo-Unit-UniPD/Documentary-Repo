"""
Istanza condivisa del renderer Markdown, usata sia da HtmlExporter sia da
PdfExporter: entrambi devono produrre lo stesso HTML a partire dallo stesso
Markdown, quindi la configurazione vive in un unico punto invece di essere
duplicata nei due file.

"commonmark" come preset di base (invece di "default", più permissivo) +
riattivazione esplicita solo delle estensioni GFM che il frontend usa di
default (marked con gfm:true, vedi App.vue): tabelle, testo barrato, liste
di attività (checkbox) e URL "nudi" trasformati automaticamente in link.
Tiene l'anteprima live (browser) e i documenti esportati coerenti per lo
stesso testo Markdown (vedi export/test_markdown_gfm_parity.py).
"""

from markdown_it import MarkdownIt
from mdit_py_plugins.tasklists import tasklists_plugin

markdown_renderer = (
    MarkdownIt("commonmark", {"typographer": True, "linkify": True})
    .enable(["table", "strikethrough", "linkify"])
    .use(tasklists_plugin)
)
