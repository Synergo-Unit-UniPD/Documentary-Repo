from fastapi import FastAPI

app = FastAPI()

@app.get("/api/status")
async def status():
    return "ok", 200