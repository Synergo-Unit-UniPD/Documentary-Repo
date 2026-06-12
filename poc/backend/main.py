from fastapi import FastAPI
from pydantic import BaseModel

from llm_services.connector import (
    client,
    DEFAULT_MODEL,
    get_red_hat_proposal,
    get_distant_writing_proposal
)

app = FastAPI()


@app.get("/api/status")
async def status():
    return {"status": "ok"}


class QueryRequest(BaseModel):
    text: str
    model_name: str = DEFAULT_MODEL


@app.post("/api/red-hat")
async def red_hat(request: QueryRequest):
    return await get_red_hat_proposal(
        text=request.text,
        model_name=request.model_name
    )


class DistantWritingRequest(BaseModel):
    prompt: str
    model_name: str = DEFAULT_MODEL


@app.post("/api/distant-writing")
async def distant_writing(request: DistantWritingRequest):
    return await get_distant_writing_proposal(
        prompt=request.prompt,
        model_name=request.model_name
    )


@app.get("/api/models")
async def models():
    return await client.models.list()


@app.get("/api/test-chat")
async def test_chat():
    try:
        response = await client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": "Rispondi solo con OK"
                }
            ],
            max_tokens=5
        )

        return {
            "model": DEFAULT_MODEL,
            "response": response.choices[0].message.content
        }

    except Exception as e:
        return {
            "model": DEFAULT_MODEL,
            "error": str(e)
        }