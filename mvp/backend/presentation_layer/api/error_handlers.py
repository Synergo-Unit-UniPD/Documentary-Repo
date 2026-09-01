from fastapi import Request
from fastapi.responses import JSONResponse

from AI_Domain.domain.errors import AIDomainError, LLMTimeoutError, LLMUnavailableError, UnknownOperationError
from export.exceptions import ConversionError, ExportError

# Mappa ogni tipo di eccezione di dominio allo status HTTP più specifico
# possibile, così il frontend può distinguere (R49/R51/R54/R56/R58/R60/R62/
# R64/R66/R68-F-O, notifica errore AI) un input non valido (400) da un
# timeout (504) o da un servizio LLM irraggiungibile (503). Le eccezioni
# non elencate qui restituiscono 500 (errore generico non previsto).
_AI_ERROR_STATUS: dict[type[AIDomainError], int] = {
    UnknownOperationError: 400,
    LLMTimeoutError: 504,
    LLMUnavailableError: 503,
}

# Analogo per gli errori di esportazione (R77-F-O): un fallimento di
# conversione (es. Markdown non valido per il formato richiesto) è un
# errore del client (422), non un problema del server.
_EXPORT_ERROR_STATUS: dict[type[ExportError], int] = {
    ConversionError: 422,
}


def _status_for(exc: Exception, mapping: dict, default: int) -> int:
    # isinstance (non un lookup diretto su type(exc)) per rispettare
    # eventuali sottoclassi non esplicitamente mappate.
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
