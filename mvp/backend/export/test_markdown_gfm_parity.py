"""
Verifica che il rendering Markdown lato backend (usato per l'esportazione
PDF/HTML) copra le stesse estensioni GFM che il frontend abilita di default
tramite `marked` (vedi App.vue, `marked(content.value)` senza opzioni: la
libreria usa `gfm: true` come default).

Se in futuro qualcuno modifica la configurazione in export/markdown_renderer.py
(es. rimuovendo un plugin), questo test fallisce e segnala che l'anteprima
live e il documento esportato potrebbero non corrispondere più per lo stesso
testo Markdown.
"""

from export.markdown_renderer import markdown_renderer


def test_tabelle_gfm():
    html = markdown_renderer.render("| A | B |\n|---|---|\n| 1 | 2 |")
    assert "<table>" in html
    assert "<th>A</th>" in html


def test_testo_barrato_gfm():
    html = markdown_renderer.render("~~testo barrato~~")
    assert "testo barrato" in html
    # markdown-it-py usa <s>, marked usa <del>: tag diverso, stesso significato
    # semantico/visivo (entrambi indicano testo barrato) - divergenza accettata.
    assert "<s>" in html or "<del>" in html


def test_lista_di_attivita_gfm():
    """Le checkbox `- [ ]` / `- [x]` devono diventare input HTML reali,
    non restare come testo letterale (com'era prima del fix)."""
    html = markdown_renderer.render("- [ ] da fare\n- [x] fatto")
    assert 'type="checkbox"' in html
    assert "checked" in html
    assert "[ ]" not in html
    assert "[x]" not in html


def test_url_nudo_diventa_link_gfm():
    """Un URL scritto senza sintassi esplicita di link deve diventare
    comunque un <a href>, non restare come testo semplice (com'era prima
    del fix)."""
    html = markdown_renderer.render("vai su https://esempio.it per info")
    assert '<a href="https://esempio.it">' in html


def test_grassetto_commonmark_base():
    html = markdown_renderer.render("**grassetto**")
    assert "<strong>grassetto</strong>" in html
