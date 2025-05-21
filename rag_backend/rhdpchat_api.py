from fastapi import FastAPI, APIRouter, HTTPException
from pydantic import BaseModel
import os
import httpx
from dotenv import load_dotenv
from pathlib import Path
# On charge .env à la racine du projet, même si le backend est lancé depuis un sous-dossier
load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")

GROQ_API_KEY_RHDPCHAT = os.getenv("GROQ_API_KEY_RHDPCHAT")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

from .forces_api import router as forces_router
from .perplexity_proxy import router as perplexity_router

app = FastAPI()
router = APIRouter()

class ChatQuery(BaseModel):
    query: str

class ChatResponse(BaseModel):
    response: str
    model_used: str

async def call_groq_api(query: str) -> str:
    if not GROQ_API_KEY_RHDPCHAT:
        raise HTTPException(status_code=500, detail="Groq API key for RHDPchat not configured. Veuillez définir GROQ_API_KEY_RHDPCHAT dans vos variables d'environnement.")
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY_RHDPCHAT}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": "llama-3.3-70b-versatile",  # Correction du nom du modèle Groq
        "messages": [
            {"role": "user", "content": query}
        ],
        "stream": False
    }
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(GROQ_API_URL, json=payload, headers=headers, timeout=45.0)
            response.raise_for_status()
            data = response.json()
            # Log sécurisé sans exposer les données sensibles
            print(f"[GROQ INFO] Requête envoyée à {GROQ_API_URL}, statut: {response.status_code}")
            # Ne pas logger la réponse complète qui peut contenir des informations sensibles
            return data["choices"][0]["message"]["content"]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Erreur Groq: {e}")

@router.post("/api/rhdpchat", response_model=ChatResponse)
async def handle_rhdp_chat(chat_query: ChatQuery):
    try:
        response = await call_groq_api(chat_query.query)
        return ChatResponse(response=response, model_used="meta-llama/llama-4-maverick-17b-128e-instruct")
    except HTTPException as e:
        print(f"[RHDPCCHAT API ERROR - HTTPException] {e.detail}")
        raise e
    except Exception as e:
        print(f"[RHDPCCHAT API ERROR - Exception] {e}")
        raise HTTPException(status_code=500, detail=f"Erreur inattendue: {e}")

app.include_router(router)
app.include_router(forces_router)
app.include_router(perplexity_router)
