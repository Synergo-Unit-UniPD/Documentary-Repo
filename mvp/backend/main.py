from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from API_business_layer.api.ai_router import router as ai_router
from API_business_layer.api.error_handlers import handle_ai_domain_error, handle_export_error
from API_business_layer.api.export_router import router as export_router
from config import settings
from AI_Domain.domain.errors import AIDomainError
from export.exceptions import ExportError

app = FastAPI(title="Second Brain API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,  # viene usato per decidere quali origini possono fare richieste al backend
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router)
app.include_router(export_router)

# I `# type: ignore[arg-type]` sono una limitazione nota di mypy con
# Starlette.add_exception_handler: la firma generica attesa è
# Callable[[Request, Exception], ...], ma i nostri handler prendono
# correttamente la sottoclasse specifica (AIDomainError/ExportError) come da
# progettazione (ErrorHandlers, Sezione 4.2 Specifica Tecnica); a runtime
# funziona correttamente, è solo la varianza dei tipi che mypy non risolve.
app.add_exception_handler(AIDomainError, handle_ai_domain_error)  # type: ignore[arg-type]
app.add_exception_handler(ExportError, handle_export_error)  # type: ignore[arg-type]


@app.get("/api/status")
async def status() -> dict:
    return {"status": "ok"}
