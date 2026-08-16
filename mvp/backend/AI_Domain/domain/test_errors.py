import pytest

from AI_Domain.domain.errors import (
    AIDomainError,
    LLMTimeoutError,
    LLMUnavailableError,
    UnknownOperationError,
)


def test_ai_domain_error_e_astratta():
    """AIDomainError non deve poter essere istanziata direttamente."""
    with pytest.raises(TypeError):
        AIDomainError("messaggio")


@pytest.mark.parametrize(
    "error_cls",
    [LLMUnavailableError, LLMTimeoutError, UnknownOperationError],
)
def test_sottoclassi_concrete_espongono_message(error_cls):
    error = error_cls("dettaglio errore")

    assert isinstance(error, AIDomainError)
    assert isinstance(error, Exception)
    assert error.message == "dettaglio errore"
    assert str(error) == "dettaglio errore"
