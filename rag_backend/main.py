from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import date

from rag_engine import RAGEngine
from forces_api import router as forces_router
from rhdpchat_api import router as rhdpchat_router
from forces_store import get_all_parties, get_party_strengths_weaknesses
from forces_models import PoliticalParty, StrengthWeakness

app = FastAPI(title="RAG API", description="API pour le moteur de recherche RAG")

# Configuration CORS
origins = [
    "http://localhost",          # Pour les développements locaux sans port spécifié
    "http://localhost:3000",     # Si votre frontend React tourne sur le port 3000 (Create React App par défaut)
    "http://localhost:5173",     # Si votre frontend React tourne sur le port 5173 (Vite par défaut)
    "https://demoiassistant.online",
    "https://www.demoiassistant.online",
    # Ajoutez d'autres origines si nécessaire
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Limiter aux méthodes nécessaires
    allow_headers=["Content-Type", "Authorization"],  # Limiter aux headers nécessaires
)

app.include_router(forces_router)
app.include_router(rhdpchat_router)
rag = RAGEngine()

# Fonction pour exécuter le script d'indexation
def run_indexer(args: str):
    """
    Exécute le script d'indexation avec les arguments spécifiés
    """
    import subprocess
    import sys
    import os
    
    # Chemin vers le script d'indexation
    indexer_path = os.path.join(os.path.dirname(__file__), "indexer.py")
    
    # Exécuter le script
    try:
        subprocess.run([sys.executable, indexer_path, args], check=True)
    except subprocess.CalledProcessError as e:
        print(f"Erreur lors de l'exécution du script d'indexation: {e}")

# Endpoints pour obtenir des informations sur les documents indexés
@app.get("/document-types")
def get_document_types():
    """
    Retourne les types de documents disponibles pour la recherche
    """
    return {
        "document_types": [
            {"value": "", "label": "Tous les types"},
            {"value": "edls", "label": "EDLS"},
            {"value": "forces", "label": "Forces & Faiblesses"},
            {"value": "standard", "label": "Documents standard"}
        ]
    }

@app.get("/source-types")
def get_source_types():
    """
    Retourne les types de sources disponibles pour la recherche
    """
    return {
        "source_types": [
            {"value": "", "label": "Toutes les sources"},
            {"value": "internal", "label": "Documents internes"},
            {"value": "external", "label": "Documents externes"}
        ]
    }

class AddDocRequest(BaseModel):
    doc_id: str
    text: str
    metadata: Optional[Dict[str, Any]] = None

class SearchFilter(BaseModel):
    document_type: Optional[str] = None  # 'edls', 'forces', 'standard'
    source_type: Optional[str] = None    # 'internal', 'external'
    date_from: Optional[str] = None      # Format ISO: YYYY-MM-DD
    date_to: Optional[str] = None        # Format ISO: YYYY-MM-DD

class SearchRequest(BaseModel):
    query: str
    n_results: int = 5
    filters: Optional[SearchFilter] = None

class QuestionRequest(BaseModel):
    question: str
    n_results_for_context: int = 3
    filters: Optional[SearchFilter] = None

class IndexEDLSRequest(BaseModel):
    edls_data: Dict[str, Any]

class IndexForcesRequest(BaseModel):
    force_data: Dict[str, Any]
    party_name: str

@app.post("/add-document")
def add_document(req: AddDocRequest):
    """
    Ajoute un document au moteur RAG avec des métadonnées optionnelles
    """
    try:
        rag.add_document(req.doc_id, req.text, req.metadata)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'indexation: {e}")

@app.post("/add-edls")
def add_edls_document(req: IndexEDLSRequest):
    """
    Indexe un document EDLS dans le moteur RAG
    """
    try:
        result = rag.add_edls_document(req.edls_data)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'indexation de l'EDLS: {e}")

@app.post("/add-forces")
def add_forces_document(req: IndexForcesRequest):
    """
    Indexe un document Forces/Faiblesses dans le moteur RAG
    """
    try:
        result = rag.add_forces_faiblesses_document(req.force_data, req.party_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'indexation du document Forces/Faiblesses: {e}")

@app.post("/index-all-edls")
def index_all_edls(background_tasks: BackgroundTasks):
    """
    Lance l'indexation de tous les documents EDLS en tâche de fond
    """
    try:
        # Lancer le script d'indexation en tâche de fond
        background_tasks.add_task(run_indexer, "--edls")
        return {"status": "ok", "message": "Indexation des EDLS lancée en tâche de fond"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du lancement de l'indexation: {e}")

@app.post("/index-all-forces")
def index_all_forces(background_tasks: BackgroundTasks):
    """
    Lance l'indexation de tous les documents Forces/Faiblesses en tâche de fond
    """
    try:
        # Lancer le script d'indexation en tâche de fond
        background_tasks.add_task(run_indexer, "--forces")
        return {"status": "ok", "message": "Indexation des Forces/Faiblesses lancée en tâche de fond"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du lancement de l'indexation: {e}")

@app.post("/search")
def search(req: SearchRequest):
    """
    Recherche des documents pertinents en fonction d'une requête et de filtres optionnels
    """
    # Convertir les filtres en dictionnaire si présents
    filters = req.filters.dict() if req.filters else None
    
    # Effectuer la recherche avec les filtres
    results = rag.search(req.query, req.n_results, filters)
    
    if 'error' in results:
        raise HTTPException(status_code=500, detail=results['error'])
    
    return results

@app.post("/answer-question")
def answer_question_endpoint(req: QuestionRequest):
    """
    Répond à une question en utilisant les documents pertinents comme contexte
    """
    # Convertir les filtres en dictionnaire si présents
    filters = req.filters.dict() if req.filters else None
    
    # Effectuer la recherche avec les filtres
    results = rag.answer_question(req.question, req.n_results_for_context, filters)
    
    if 'error' in results:
        raise HTTPException(status_code=500, detail=results['error'])
    
    return results
