import re

import openai

from ..domain.errors import LLMTimeoutError, LLMUnavailableError
from ..domain.value_objects import Prompt
from .llm_service import LLMService

# Alcuni modelli (es. Gemma con supporto al ragionamento esplicito) possono
# restituire, nel campo "content" della risposta, sia il ragionamento interno
# ("thinking") sia la risposta finale, mescolati insieme e separati da
# marcatori di canale in chiaro come "<|channel>thought" / "<channel|>" (non
# token di controllo invisibili: compaiono come testo vero e proprio). La
# separazione tra le due parti non è gestita né dal modello né dal gateway,
# resta a carico di chi chiama l'API. Se questi marcatori compaiono, si tiene
# solo l'ULTIMO segmento: la risposta finale segue sempre il ragionamento.
_CHANNEL_MARKER_PATTERN = re.compile(r"<\|?channel\|?>", re.IGNORECASE)


def _strip_reasoning_channel(text: str) -> str:
    parts = _CHANNEL_MARKER_PATTERN.split(text)
    if len(parts) <= 1:
        return text
    return parts[-1].strip()


class OpenAIAdapter(LLMService):
    def __init__(self, api_key: str, base_url: str, model: str, timeout: float = 40.0) -> None:
        self._api_key = api_key
        self._base_url = base_url
        self._model = model
        self._client = openai.AsyncOpenAI(
            base_url=base_url or None,
            api_key=api_key or None,
            max_retries=0,
            timeout=timeout,
        )

    async def complete(self, prompt: Prompt) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=[
                    {"role": "system", "content": prompt.system_text},
                    {"role": "user", "content": prompt.user_text},
                ],
                temperature=0.5,
            )
        except openai.APITimeoutError as exc:
            raise LLMTimeoutError(f"Timeout nella richiesta al modello '{self._model}'") from exc
        except (openai.APIConnectionError, openai.APIStatusError) as exc:
            raise LLMUnavailableError(f"LLM non raggiungibile: {exc}") from exc

        content = response.choices[0].message.content
        return _strip_reasoning_channel((content or "").strip())
