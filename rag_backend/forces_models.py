from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from enum import Enum

class TypeElement(str, Enum):
    FORCE = "force"
    FAIBLESSE = "faiblesse"
    ENVIRONNEMENT = "environnement"
    RENFORCEMENT = "renforcement"
    DECONSTRUCTION = "deconstruction"
    REPONSE = "reponse"
    AUTRE = "autre"

class MediaType(str, Enum):
    TEXTE = "texte"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    AUTRE = "autre"

class MediaFile(BaseModel):
    id: str
    element_id: str
    file_path: str
    media_type: MediaType
    importance: int = 1  # Échelle de 1 à 5

class PoliticalParty(BaseModel):
    id: str
    nom: str
    description: str
    logo_url: Optional[str] = None

class StrengthWeakness(BaseModel):
    id: str
    party_id: str
    type: TypeElement
    categorie: Optional[str] = None
    contenu: str
    resume: Optional[str] = None
    date: date
    source: Optional[str] = None
    auteur: Optional[str] = None
    media_files: List[MediaFile] = []
