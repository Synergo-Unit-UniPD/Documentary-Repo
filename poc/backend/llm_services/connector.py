import os
import json
from fastapi import HTTPException
from openai import AsyncOpenAI

DEFAULT_MODEL = "gemma3:1b"

client = AsyncOpenAI(
    base_url=os.getenv("ZUCCHETTI_LLM_BASE_URL"),
    api_key=os.getenv("ZUCCHETTI_LLM_API_KEY"),
    max_retries=0,
    timeout=40.0
)


def extract_json(content: str) -> dict:
    start = content.find("{")
    end = content.rfind("}") + 1

    if start == -1 or end == 0:
        raise ValueError(f"Risposta non JSON: {content}")

    return json.loads(content[start:end])


async def get_red_hat_proposal(text: str, model_name: str = DEFAULT_MODEL) -> dict:
    system_prompt = (
        "Sei un assistente integrato in un editor Markdown. "
        "Devi applicare il Cappello Rosso del metodo dei Sei Cappelli per Pensare. "
        "Il Cappello Rosso NON analizza fatti, logica, rischi tecnici o soluzioni razionali. "
        "Esprime invece reazioni emotive, impressioni immediate, disagio, fiducia, esitazione, entusiasmo, "
        "percezioni intuitive e clima percepito nel testo. "
        "Devi restituire una proposta testuale inseribile nel documento e un commento critico separato. "
        "Il commento deve spiegare quale reazione emotiva o intuitiva emerge dal testo e perché. "
        "Rispondi solo con JSON valido nel formato: "
        '{"proposal": "...", "comment": "..."}'
    )

    user_prompt = f"""
                    Testo selezionato:
                    {text}

                    Genera:
                    - proposal: 2-4 frasi, direttamente inseribili nel documento, con tono naturale e coerente.
                    - comment: 2-3 frasi, NON da inserire nel documento, che spiega la lettura emotiva/intuitiva del Cappello Rosso.

                    Non fare un riassunto del testo.
                    Non proporre soluzioni tecniche.
                    Non parlare di dati oggettivi.
                    """

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.5,
            max_tokens=350
        )

        content = response.choices[0].message.content.strip()
        data = extract_json(content)

        proposal = data.get("proposal", "").strip()
        comment = data.get("comment", "").strip()

        if not proposal or not comment:
            raise ValueError(f"JSON incompleto: {data}")

        return {
            "proposal": proposal,
            "comment": comment
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore di comunicazione con l'LLM: {str(e)}"
        )


async def get_distant_writing_proposal(prompt: str, model_name: str = DEFAULT_MODEL) -> dict:
    system_prompt = (
        "Sei un assistente di Distant Writing integrato in un editor Markdown. "
        "L'utente progetta il contenuto, tu scrivi un testo fluido, coerente e direttamente inseribile nel documento. "
        "Non aggiungere introduzioni, spiegazioni o commenti esterni."
    )

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_tokens=450
        )

        return {
            "proposal": response.choices[0].message.content.strip()
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Errore di comunicazione con l'LLM: {str(e)}"
        )