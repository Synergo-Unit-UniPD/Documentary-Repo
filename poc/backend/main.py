from fastapi import FastAPI, Request
from llm_services.connector import get_red_hat_proposal, get_distant_writing_proposal
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

@app.get("/api/status")
async def status():
    return "ok", 200

class QueryRequest(BaseModel):
    text: str
    model_name: str = "anthropic.claude-haiku-4-5"
@app.post("/api/red-hat")
async def red_hat(request: QueryRequest):
    # Chiamiamo la funzione separata passando i dati validati
    result = await get_red_hat_proposal(
        text=request.text, 
        model_name=request.model_name
    )
    
    # FastAPI converte automaticamente il dizionario Python nel JSON che il frontend vuole
    return result

class DistantWritingRequest(BaseModel):
    prompt: str
    model_name: str = "anthropic.claude-haiku-4-5"
@app.post("/api/distant-writing")
async def distant_writing(request: DistantWritingRequest):
    # Chiamiamo la nuova funzione separata
    result = await get_distant_writing_proposal(
        prompt=request.prompt, 
        model_name=request.model_name
    )
    return result