import os
from dataclasses import dataclass, field


def _split_csv(value: str) -> list[str]:
    return [v.strip() for v in value.split(",") if v.strip()]


@dataclass(frozen=True)
class Settings:
    llm_base_url: str = field(default_factory=lambda: os.getenv("ZUCCHETTI_LLM_BASE_URL", ""))
    llm_api_key: str = field(default_factory=lambda: os.getenv("ZUCCHETTI_LLM_API_KEY", ""))
    llm_default_model: str = field(default_factory=lambda: os.getenv("ZUCCHETTI_LLM_MODEL", "gemma4:12b"))
    llm_timeout_seconds: float = field(default_factory=lambda: float(os.getenv("ZUCCHETTI_LLM_TIMEOUT", "40.0")))

    # dimensione massima della cache in-memory di CachingLLMAdapter (0 = illimitata)
    llm_cache_max_size: int = field(default_factory=lambda: int(os.getenv("LLM_CACHE_MAX_SIZE", "256")))

    # origini ammesse per CORS (dev: frontend Vite passa comunque dal proxy
    # /api -> backend:8000, quindi in teoria non servirebbe CORS; lo teniamo
    # permissivo in dev per chiamate dirette/debug, da restringere in prod)
    cors_allowed_origins: list[str] = field(
        default_factory=lambda: _split_csv(os.getenv("CORS_ALLOWED_ORIGINS", "*"))
    )
settings = Settings()
