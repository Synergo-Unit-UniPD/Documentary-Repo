from functools import lru_cache

from config import settings
from AI_Domain.domain.operation_factory import AIOperationFactory
from export.exporter import Exporter
from export.html_exporter import HtmlExporter
from export.json_exporter import JsonExporter
from export.pdf_exporter import PdfExporter
from AI_Domain.llm.decorators import LoggingLLMAdapter
from AI_Domain.llm.openai_adapter import OpenAIAdapter
from AI_Domain.service import AIService

# Punto unico di composizione delle dipendenze (Dependency Injection,
# Specifica Tecnica §3.2.2): FastAPI risolve queste funzioni tramite
# Depends() nei router, che quindi non istanziano mai direttamente le
# implementazioni concrete (R12-Q-D: sostituire il provider LLM significa
# modificare solo get_ai_service, non i router o il dominio).

_EXPORTERS: dict[str, type[Exporter]] = {
    "pdf": PdfExporter,
    "html": HtmlExporter,
    "json": JsonExporter,
}


# lru_cache(maxsize=1): un solo AIService per tutta la vita del processo,
# per riutilizzare la stessa connessione/configurazione verso l'LLM invece
# di ricrearla ad ogni richiesta.
@lru_cache(maxsize=1)
def get_ai_service() -> AIService:
    base_adapter = OpenAIAdapter(
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        model=settings.llm_default_model,
        timeout=settings.llm_timeout_seconds,
    )
    # LoggingLLMAdapter avvolge l'adapter reale (pattern Decorator, GoF
    # strutturale — Specifica Tecnica §5.2.3): aggiunge il logging delle
    # richieste/risposte LLM senza che OpenAIAdapter debba occuparsene.
    logging_adapter = LoggingLLMAdapter(base_adapter)

    return AIService(llm=logging_adapter, factory=AIOperationFactory())


# Per aggiungere un nuovo formato di export (R77-F-O) basta implementare
# Exporter e aggiungere una riga a _EXPORTERS: nessun altro punto del
# codice conosce le classi concrete dei singoli formati.
def get_exporter(format: str) -> Exporter:
    exporter_class = _EXPORTERS.get(format)
    if exporter_class is None:
        raise ValueError(f"Formato di export non supportato: '{format}'. Disponibili: {list(_EXPORTERS)}")
    return exporter_class()
