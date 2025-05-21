from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union, Optional

class Settings(BaseSettings):
    # Configuration pour l'authentification JWT (security.py)
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Configuration CORS (main.py)
    # Doit être une chaîne séparée par des virgules dans .env, ex: "http://localhost:3000,http://localhost:5173"
    CORS_ALLOWED_ORIGINS_STR: Optional[str] = None # Sera parsé en liste plus bas
    
    @property
    def CORS_ALLOWED_ORIGINS(self) -> List[str]:
        if isinstance(self.CORS_ALLOWED_ORIGINS_STR, str):
            return [origin.strip() for origin in self.CORS_ALLOWED_ORIGINS_STR.split(',')]
        # Valeurs par défaut si non défini dans .env, pour correspondre à l'ancienne configuration
        return [
            "http://localhost",
            "http://localhost:3000",
            "http://localhost:5173",
            "https://demoiassistant.online",
            "https://www.demoiassistant.online",
        ]

    # Configuration pour ChromaDB HttpClient (rag_engine.py)
    CHROMA_HOST: str = "localhost"
    CHROMA_PORT: int = 8000
    CHROMA_SSL_ENABLED: bool = False
    # CHROMA_SSL_VERIFY peut être un booléen ou le chemin vers un fichier de certificat CA
    CHROMA_SSL_VERIFY: Union[bool, str] = True 

    # Spécifie que les variables doivent être chargées depuis un fichier .env
    model_config = SettingsConfigDict(
        env_file=('.env.test', '.env'), 
        env_file_encoding='utf-8',
        extra='ignore',
        case_sensitive=False
    )

# Instance unique des settings qui sera importée dans les autres modules
settings = Settings()
