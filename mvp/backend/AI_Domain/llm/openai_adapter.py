import openai

from ..domain.errors import LLMTimeoutError, LLMUnavailableError
from ..domain.value_objects import Prompt
from .llm_service import LLMService


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
        return (content or "").strip()
