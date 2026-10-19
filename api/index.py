import os

from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

app = FastAPI(title="Resumidor", version="0.1.0")


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}
