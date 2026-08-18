from fastapi import Request
from fastapi.responses import JSONResponse

from AI_Domain.domain.errors import AIDomainError, LLMTimeoutError, LLMUnavailableError, UnknownOperationError
from export.exceptions import ConversionError, ExportError

_AI_ERROR_STATUS: dict[type[AIDomainError], int] = {
    UnknownOperationError: 400,
    LLMTimeoutError: 504,
    LLMUnavailableError: 503,
}

_EXPORT_ERROR_STATUS: dict[type[ExportError], int] = {
    ConversionError: 422,
}


def _status_for(exc: Exception, mapping: dict, default: int) -> int:
    for exc_type, status_code in mapping.items():
        if isinstance(exc, exc_type):
            return status_code
    return default


async def handle_ai_domain_error(request: Request, exc: AIDomainError) -> JSONResponse:
    status_code = _status_for(exc, _AI_ERROR_STATUS, default=500)
    return JSONResponse(
        status_code=status_code,
        content={"error": type(exc).__name__, "message": exc.message},
    )


async def handle_export_error(request: Request, exc: ExportError) -> JSONResponse:
    status_code = _status_for(exc, _EXPORT_ERROR_STATUS, default=500)
    return JSONResponse(
        status_code=status_code,
        content={"error": type(exc).__name__, "message": exc.message},
    )
