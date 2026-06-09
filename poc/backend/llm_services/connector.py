import os
from fastapi import FastAPI, HTTPException
from openai import AsyncOpenAI
import json
import asyncio
from fastapi import HTTPException

print(os.getenv("ZUCCHETTI_LLM_BASE_URL"))

client = AsyncOpenAI(
    base_url=os.getenv("ZUCCHETTI_LLM_BASE_URL"),
    api_key=os.getenv("ZUCCHETTI_LLM_API_KEY"),
    max_retries=5,
    timeout=60.0
)

async def get_red_hat_proposal(text: str, model_name: str) -> dict:
    """
    Effettua due chiamate parallele all'LLM per generare separatamente 
    la proposta e il commento (Cappello Rosso), restituendo il dizionario finale.
    """
    
    # 1. Definiamo i prompt di sistema specifici per ciascun compito
    proposal_system_prompt = (
        "Sei un assistente esperto del metodo dei Sei Cappelli per Pensare (Cappello Rosso). "
        "Fornisci l'analisi emotiva, viscerale e intuitiva (la proposta) del testo fornito. "
        "Rispondi ESCLUSIVAMENTE con il testo dell'analisi, senza introduzioni, commenti o virgolette."
    )

    comment_system_prompt = (
        "Sei un assistente esperto del metodo dei Sei Cappelli per Pensare (Cappello Rosso). "
        "Fornisci un commento di supporto o una spiegazione razionale/metodologica all'analisi emotiva del testo. "
        "Rispondi ESCLUSIVAMENTE con il testo del commento, senza introduzioni o virgolette."
    )

    # 2. Definiamo le due sotto-funzioni asincrone per le chiamate all'API
    async def fetch_proposal():
        res = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": proposal_system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.7
        )
        return res.choices[0].message.content.strip()

    async def fetch_comment():
        res = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": comment_system_prompt},
                {"role": "user", "content": text}
            ],
            temperature=0.7
        )
        return res.choices[0].message.content.strip()

    try:
        # 3. Lanciamo entrambe le richieste contemporaneamente in parallelo
        proposal_text, comment_text = await asyncio.gather(
            fetch_proposal(),
            fetch_comment()
        )

        # 4. Costruiamo il dizionario finale che si aspetta il frontend
        return {
            "proposal": proposal_text,
            "comment": comment_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore di comunicazione con l'LLM: {str(e)}")

from fastapi import HTTPException

async def get_distant_writing_proposal(prompt: str, model_name: str) -> dict:
    """
    Effettua una chiamata all'LLM per generare la proposta di Distant Writing
    e restituisce il dizionario formattato per il frontend.
    """
    
    system_prompt = (
        "Sei un assistente esperto di scrittura creativa e comunicazione a distanza (Distant Writing). "
        "Genera una proposta accurata in base alle indicazioni dell'utente. "
        "Rispondi ESCLUSIVAMENTE con il testo della proposta, senza introduzioni, commenti o virgolette."
    )

    try:
        response = await client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )

        proposal_text = response.choices[0].message.content.strip()

        # Costruiamo il dizionario con l'unica chiave richiesta dal frontend
        return {
            "proposal": proposal_text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore di comunicazione con l'LLM: {str(e)}")