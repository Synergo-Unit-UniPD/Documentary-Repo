from functools import lru_cache

import AI_Domain.domain  # noqa: F401  (side-effect: registra le AIOperation in AIOperationFactory)
from config import settings
from AI_Domain.domain.operation_factory import AIOperationFactory
from export.exporter import Exporter
from export.html_exporter import HtmlExporter
from export.json_exporter import JsonExporter
from export.pdf_exporter import PdfExporter
from AI_Domain.llm.decorators import LoggingLLMAdapter
from AI_Domain.llm.openai_adapter import OpenAIAdapter
from AI_Domain.service import AIService

_EXPORTERS: dict[str, type[Exporter]] = {
    "pdf": PdfExporter,
    "html": HtmlExporter,
    "json": JsonExporter,
}


@lru_cache(maxsize=1)
def get_ai_service() -> AIService:
    base_adapter = OpenAIAdapter(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        model=settings.llm_default_model,
        timeout=settings.llm_timeout_seconds,
    )
    logging_adapter = LoggingLLMAdapter(base_adapter)

    return AIService(llm=logging_adapter, factory=AIOperationFactory())


def get_exporter(format: str) -> Exporter:
    exporter_class = _EXPORTERS.get(format)
    if exporter_class is None:
        raise ValueError(f"Formato di export non supportato: '{format}'. Disponibili: {list(_EXPORTERS)}")
    return exporter_class()