from fastapi import APIRouter, HTTPException, Request
import httpx
import os
import logging

router = APIRouter()

# Configuration des URLs Perplexity
PERPLEXITY_CHAT_URL = "https://api.perplexity.ai/chat/completions"
PERPLEXITY_COMPLETIONS_URL = "https://api.perplexity.ai/completions"
PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

# Logger pour le débogage
logger = logging.getLogger("perplexity_proxy")

@router.post("/api/perplexity")
async def proxy_perplexity(request: Request):
    """Proxy générique pour les requêtes Perplexity"""
    if not PERPLEXITY_API_KEY:
        raise HTTPException(status_code=500, detail="Clé API Perplexity non configurée")
    
    # Récupérer le corps de la requête
    try:
        body = await request.json()
        logger.info(f"Requête reçue: {body}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Format de requête invalide: {e}")
    
    # Déterminer l'URL de l'API en fonction du type de requête
    # Par défaut, utiliser l'API de chat
    api_url = PERPLEXITY_CHAT_URL
    
    # Si c'est une requête de complétion simple (pas de messages)
    if 'prompt' in body and 'messages' not in body:
        api_url = PERPLEXITY_COMPLETIONS_URL
        # Convertir le format simple en format de chat si nécessaire
        if 'model' in body and isinstance(body['model'], str):
            # Si le modèle est passé comme string simple (ex: 'sonar')
            model_name = body['model']
            # Adapter le format pour l'API Perplexity
            body = {
                "model": model_name,
                "prompt": body.get('prompt', ''),
            }
    
    # En-têtes pour l'API Perplexity
    headers = {
        "Authorization": f"Bearer {PERPLEXITY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        logger.info(f"Envoi à Perplexity API: {api_url}")
        async with httpx.AsyncClient() as client:
            response = await client.post(api_url, json=body, headers=headers, timeout=60.0)
            response.raise_for_status()
            result = response.json()
            logger.info(f"Réponse de Perplexity reçue: {result}")
            return result
    except httpx.HTTPStatusError as e:
        error_detail = f"Erreur Perplexity {e.response.status_code}"
        try:
            error_json = e.response.json()
            if 'error' in error_json:
                error_detail = f"{error_detail}: {error_json['error']}"
        except:
            pass
        logger.error(error_detail)
        raise HTTPException(status_code=e.response.status_code, detail=error_detail)
    except Exception as e:
        logger.error(f"Erreur proxy Perplexity: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur proxy Perplexity: {e}")
