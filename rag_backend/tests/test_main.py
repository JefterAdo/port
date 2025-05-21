from fastapi.testclient import TestClient
from rag_backend.main import app # Importez votre instance FastAPI 'app'

# Créez une instance de TestClient
client = TestClient(app)

def test_read_main_docs():
    """
    Teste si l'endpoint /docs (Swagger UI) est accessible.
    """
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]

def test_read_openapi_json():
    """
    Teste si l'endpoint /openapi.json est accessible et retourne du JSON.
    """
    response = client.get("/openapi.json")
    assert response.status_code == 200
    assert "application/json" in response.headers["content-type"]

# Vous pouvez ajouter ici un test simple pour un endpoint public si vous en avez un,
# par exemple un endpoint racine ("/") qui retourne un message de bienvenue.
# def test_read_root():
#     response = client.get("/")
#     assert response.status_code == 200
#     assert response.json() == {"message": "Welcome to RAG API"} # Adaptez selon votre API
