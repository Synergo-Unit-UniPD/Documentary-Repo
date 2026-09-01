from pydantic import BaseModel, Field


class ExportRequest(BaseModel):
    content: str = Field(..., description="Contenuto Markdown della nota da esportare")
