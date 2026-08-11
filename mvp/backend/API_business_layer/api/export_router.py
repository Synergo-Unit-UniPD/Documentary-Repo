from fastapi import APIRouter, HTTPException, Response

from .schemas import ExportRequest
from API_business_layer.di.providers import get_exporter

router = APIRouter(prefix="/api/export", tags=["export"])

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
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    file_bytes = exporter.export(request.content)

    return Response(
        content=file_bytes,
        media_type=_MEDIA_TYPES[format],
        headers={"Content-Disposition": f'attachment; filename="note.{format}"'},
    )
