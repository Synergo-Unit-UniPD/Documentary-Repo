from abc import ABC


class AIDomainError(ABC, Exception):

    def __new__(cls, *args, **kwargs):
        if cls is AIDomainError:
            raise TypeError(
                "AIDomainError è astratta: istanzia una sottoclasse concreta "
                "(LLMUnavailableError, LLMTimeoutError, UnknownOperationError)."
            )
        return super().__new__(cls)

    def __init__(self, message: str) -> None:
        super().__init__(message)
        self.message = message


class LLMUnavailableError(AIDomainError):

class LLMTimeoutError(AIDomainError):


class UnknownOperationError(AIDomainError):
