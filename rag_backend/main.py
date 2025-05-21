from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import timedelta

from .rag_engine import RAGEngine
from .forces_api import router as forces_router
from .rhdpchat_api import router as rhdpchat_router
from .forces_store import list_parties, list_strengths_weaknesses
from .forces_models import PoliticalParty, StrengthWeakness
from .security import User, create_access_token, get_current_active_user, verify_password, get_user, oauth2_scheme, fake_users_db, status # Ajout des imports de sécurité
from .config import settings # Importation des settings centralisés
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

app = FastAPI(title="RAG API", description="API pour le moteur de recherche RAG")

# Gestionnaires d'exceptions personnalisés
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    # Ici, vous pourriez ajouter du logging
    # import logging
    # logging.error(f"HTTPException: {exc.status_code} {exc.detail} for {request.url}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Loggez l'exception ici pour le débogage
    # import logging
    # logging.exception(f"Unhandled exception for {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred on the server."},
    )

# Configuration CORS via settings
# La logique de chargement et de parsing des origines est dans config.py

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ALLOWED_ORIGINS, # Utilisation des settings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Determine the path to the 'port' directory (parent of 'rag_backend')
# This directory contains index.html and potentially other static assets
# Define the path to the 'dist' directory created by 'npm run build'
# This is relative to the 'port' directory, which is the parent of 'rag_backend'
current_script_path = os.path.dirname(os.path.abspath(__file__))
project_root_directory = os.path.join(current_script_path, "..") # This is 'port/'
dist_directory = os.path.join(project_root_directory, "dist")

# Route to serve index.html from the 'dist' directory
@app.get("/", include_in_schema=False)
async def serve_index_html():
    index_path = os.path.join(dist_directory, "index.html")
    if not os.path.exists(index_path):
        raise HTTPException(status_code=404, detail="dist/index.html not found")
    return FileResponse(index_path)

app.include_router(forces_router)
app.include_router(rhdpchat_router)
rag = RAGEngine()

# Mount the 'dist/assets' directory to serve CSS, JS, etc.
assets_path = os.path.join(dist_directory, "assets")
if os.path.exists(assets_path):
    app.mount("/assets", StaticFiles(directory=assets_path), name="static_assets")

# Fallback: Mount the entire 'dist' directory to serve other static files
# (e.g., favicon.ico, logo.svg if they are copied to dist/ by the build process)
# This should come AFTER specific mounts like '/assets' and AFTER the root route for index.html.
# The `StaticFiles` instance for "/" needs to be mounted last if you have other specific routes.
# To avoid conflicts with API routes, it's often better to serve static files from a subpath like /static
# or ensure API routes are defined before this broad static mount.
# However, for a single-page application (SPA) where index.html handles routing, this is common.
if os.path.exists(dist_directory):
    app.mount("/", StaticFiles(directory=dist_directory), name="static_dist_root")

# Modèle pour la réponse du token
class Token(BaseModel):
    access_token: str
    token_type: str

# Endpoint pour l'authentification et l'obtention du token
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = get_user(fake_users_db, form_data.username) # Utilise fake_users_db de security.py
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES) # Correction: utiliser settings ici aussi pour la cohérence
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# Endpoint de test sécurisé
@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user


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
