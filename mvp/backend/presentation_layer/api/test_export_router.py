import json

import pytest
from fastapi.testclient import TestClient

import main


@pytest.fixture
def client():
    return TestClient(main.app)


def test_export_json_restituisce_contenuto_json_valido(client):
    response = client.post("/api/export/json", json={"content": "# Titolo\n\nParagrafo di prova."})

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    payload = json.loads(response.content)
    assert "Titolo" in payload["nodes"][0]


def test_export_html_restituisce_documento_html(client):
    response = client.post("/api/export/html", json={"content": "# Titolo\n\nTesto."})

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/html")
    assert b"<h1>Titolo</h1>" in response.content


def test_export_pdf_restituisce_un_pdf_valido(client):
    response = client.post("/api/export/pdf", json={"content": "# Titolo\n\nTesto."})

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content.startswith(b"%PDF")


def test_export_formato_non_supportato_restituisce_400(client):
    response = client.post("/api/export/docx", json={"content": "testo"})

    assert response.status_code == 400


def test_export_content_disposition_include_il_nome_file(client):
    response = client.post("/api/export/json", json={"content": "testo"})

    assert 'filename="note.json"' in response.headers["content-disposition"]
