from fastapi import APIRouter, HTTPException, Response

from .schemas import ExportRequest
from API_business_layer.di.providers import get_exporter

router = APIRouter(prefix="/api/export", tags=["export"])

# Content-Type di risposta per ciascun formato di esportazione (R77-F-O):
# deve restare allineato a _EXPORTERS in providers.py, entrambi tenuti
# sincronizzati manualmente perché rappresentano concetti diversi (classe
# esportatrice vs. tipo MIME della risposta HTTP).
_MEDIA_TYPES = {
    "pdf": "application/pdf",
    "html": "text/html",
    "json": "application/json",
}


@router.post("/{format}")
async def export_note(format: str, request: ExportRequest) -> Response:
    try:
        exporter = get_exporter(format)
    except ValueError as exc:
        # Formato non supportato: errore del client (400), non del server.
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    file_bytes = exporter.export(request.content)

    # Content-Disposition "attachment" forza il download lato browser
    # invece di tentare di visualizzare il file inline (R77-F-O).
    return Response(
        content=file_bytes,
        media_type=_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="note.{format}"'},
    )
