import pytest

from AI_Domain.domain.hat_type import HatType
from AI_Domain.domain.operations import (
    DistantWritingOperation,
    HatAnalysisOperation,
    RewriteOperation,
    SummarizeOperation,
    TranslateOperation,
)
from AI_Domain.domain.value_objects import Prompt


def test_summarize_operation_costruisce_un_prompt_coerente():
    operation = SummarizeOperation()
    prompt = operation.build_prompt("testo da riassumere", {})

    assert isinstance(prompt, Prompt)
    assert prompt.user_text == "testo da riassumere"
    assert "riassum" in prompt.system_text.lower()


def test_translate_operation_usa_target_language_di_default():
    operation = TranslateOperation.from_params({})
    prompt = operation.build_prompt("hello world in italiano", {})

    assert "en" in prompt.system_text.lower() or "inglese" in prompt.system_text.lower()


def test_translate_operation_usa_il_nome_della_lingua_non_il_codice_iso_grezzo():
    for code, name in [("en", "inglese"), ("fr", "francese"), ("es", "spagnolo"), ("de", "tedesco")]:
        operation = TranslateOperation.from_params({"target_language": code})
        prompt = operation.build_prompt("testo di esempio", {})

        assert name in prompt.system_text.lower()
        assert f"in {code}," not in prompt.system_text.lower()
        assert f"in {code} " not in prompt.system_text.lower()


def test_translate_operation_rispetta_target_language_dai_params():
    operation = TranslateOperation.from_params({"target_language": "fr"})
    prompt = operation.build_prompt("testo", {})

    assert "fr" in prompt.system_text.lower()


def test_translate_operation_rifiuta_lingua_non_supportata():
    with pytest.raises(ValueError):
        TranslateOperation.from_params({"target_language": "it"})


def test_rewrite_operation_costruisce_prompt():
    operation = RewriteOperation()
    prompt = operation.build_prompt("testo da riscrivere", {})

    assert prompt.user_text == "testo da riscrivere"
    assert "riscriv" in prompt.system_text.lower()


def test_distant_writing_operation_combina_contesto_e_prompt_utente():
    operation = DistantWritingOperation()
    prompt = operation.build_prompt("contesto nota", {"user_prompt": "scrivi una conclusione"})

    assert "contesto nota" in prompt.user_text
    assert "scrivi una conclusione" in prompt.user_text


def test_distant_writing_operation_senza_contesto_usa_solo_user_prompt():
    operation = DistantWritingOperation()
    prompt = operation.build_prompt("", {"user_prompt": "scrivi qualcosa"})

    assert prompt.user_text == "scrivi qualcosa"


def test_hat_analysis_operation_default_white():
    operation = HatAnalysisOperation.from_params({})
    prompt = operation.build_prompt("testo", {})

    assert "fatti" in prompt.system_text.lower() or "dati" in prompt.system_text.lower()


def test_hat_analysis_operation_rispetta_hat_type_richiesto():
    operation = HatAnalysisOperation.from_params({"hat_type": HatType.BLACK.value})
    prompt = operation.build_prompt("testo", {})

    assert "critic" in prompt.system_text.lower() or "rischi" in prompt.system_text.lower()


def test_ogni_operazione_istruisce_il_modello_a_non_aggiungere_testo_di_cornice():
    operations = [
        SummarizeOperation(),
        TranslateOperation.from_params({}),
        RewriteOperation(),
        DistantWritingOperation(),
        HatAnalysisOperation.from_params({}),
    ]

    for operation in operations:
        prompt = operation.build_prompt("testo di esempio", {"user_prompt": "scrivi qualcosa"})
        system_lower = prompt.system_text.lower()
        assert "esclusivamente" in system_lower
        assert "non aggiungere" in system_lower
        assert "frasi di chiusura" in system_lower


def test_translate_operation_vieta_esplicitamente_traduzioni_alternative_tra_parentesi():
    operation = TranslateOperation.from_params({"target_language": "en"})
    prompt = operation.build_prompt("ciao come stai", {})

    system_lower = prompt.system_text.lower()
    assert "alternative" in system_lower
    assert "parentesi" in system_lower
