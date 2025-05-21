import uuid
import json
import os
import re
from datetime import date
from typing import Dict, List, Optional, Union
from pathlib import Path

# Utilisation de chemins absolus pour éviter les attaques par traversement de répertoire
from .forces_models import PoliticalParty, StrengthWeakness, MediaFile, TypeElement, MediaType

BASE_DIR = Path(__file__).parent.absolute()
DB_PARTIES_FILE = os.path.join(BASE_DIR, "parties.json")
DB_SW_FILE = os.path.join(BASE_DIR, "strengths_weaknesses.json")
DB_MEDIA_FILE = os.path.join(BASE_DIR, "media_files.json")
MEDIA_UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

# Fonction de validation des entrées pour prévenir les injections
def sanitize_input(text: str) -> str:
    if not isinstance(text, str):
        return ""
    # Supprimer les caractères potentiellement dangereux
    return re.sub(r'[<>"\\]', '', text)

# Initialisation des "bases de données" en mémoire (seront chargées depuis les fichiers)
political_parties_db: Dict[str, PoliticalParty] = {}
strengths_weaknesses_db: Dict[str, StrengthWeakness] = {}
media_files_db: Dict[str, MediaFile] = {}

# --- Fonctions de chargement et sauvegarde --- #

def _load_parties():
    global political_parties_db
    try:
        with open(DB_PARTIES_FILE, 'r') as f:
            parties_data = json.load(f)
            political_parties_db = {pid: PoliticalParty(**data) for pid, data in parties_data.items()}
    except FileNotFoundError:
        political_parties_db = {}
    except json.JSONDecodeError:
        political_parties_db = {} # Fichier corrompu ou vide

def _save_parties():
    # Créer un fichier temporaire pour éviter la corruption en cas d'erreur
    temp_file = f"{DB_PARTIES_FILE}.tmp"
    try:
        with open(temp_file, 'w') as f:
            json.dump({pid: party.model_dump(mode='json') for pid, party in political_parties_db.items()}, f, indent=2)
        # Remplacer le fichier original seulement si l'écriture a réussi
        os.replace(temp_file, DB_PARTIES_FILE)
    except Exception as e:
        # Nettoyer en cas d'erreur
        if os.path.exists(temp_file):
            os.remove(temp_file)
        print(f"Erreur lors de la sauvegarde des partis: {e}")
        raise

def _load_sw():
    global strengths_weaknesses_db
    try:
        with open(DB_SW_FILE, 'r') as f:
            sw_data = json.load(f)
            strengths_weaknesses_db = {sw_id: StrengthWeakness(**data) for sw_id, data in sw_data.items()}
            # Conversion des dates string en objets date
            for sw_id, sw_item in strengths_weaknesses_db.items():
                if isinstance(sw_item.date, str):
                    strengths_weaknesses_db[sw_id].date = date.fromisoformat(sw_item.date)
    except FileNotFoundError:
        strengths_weaknesses_db = {}
    except json.JSONDecodeError:
        strengths_weaknesses_db = {} # Fichier corrompu ou vide

def _load_media_files():
    global media_files_db
    try:
        with open(DB_MEDIA_FILE, 'r') as f:
            media_data = json.load(f)
            media_files_db = {media_id: MediaFile(**data) for media_id, data in media_data.items()}
    except FileNotFoundError:
        media_files_db = {}
    except json.JSONDecodeError:
        media_files_db = {} # Fichier corrompu ou vide

def _save_sw():
    # Créer un fichier temporaire pour éviter la corruption en cas d'erreur
    temp_file = f"{DB_SW_FILE}.tmp"
    try:
        with open(temp_file, 'w') as f:
            json.dump({sw_id: sw.model_dump(mode='json') for sw_id, sw in strengths_weaknesses_db.items()}, f, indent=2)
        # Remplacer le fichier original seulement si l'écriture a réussi
        os.replace(temp_file, DB_SW_FILE)
    except Exception as e:
        # Nettoyer en cas d'erreur
        if os.path.exists(temp_file):
            os.remove(temp_file)
        print(f"Erreur lors de la sauvegarde des forces/faiblesses: {e}")
        raise

def _save_media_files():
    # Créer un fichier temporaire pour éviter la corruption en cas d'erreur
    temp_file = f"{DB_MEDIA_FILE}.tmp"
    try:
        with open(temp_file, 'w') as f:
            json.dump({media_id: media.model_dump(mode='json') for media_id, media in media_files_db.items()}, f, indent=2)
        # Remplacer le fichier original seulement si l'écriture a réussi
        os.replace(temp_file, DB_MEDIA_FILE)
    except Exception as e:
        # Nettoyer en cas d'erreur
        if os.path.exists(temp_file):
            os.remove(temp_file)
        print(f"Erreur lors de la sauvegarde des fichiers média: {e}")
        raise

# Charger les données au démarrage du module
_load_parties()
_load_sw()
_load_media_files()

# Créer le répertoire d'upload s'il n'existe pas
os.makedirs(MEDIA_UPLOAD_DIR, exist_ok=True)

# --- CRUD pour PoliticalParty --- #

def create_party(nom: str, description: str, logo_url: Optional[str] = None) -> PoliticalParty:
    # Validation et nettoyage des entrées
    nom_clean = sanitize_input(nom)
    description_clean = sanitize_input(description)
    logo_url_clean = sanitize_input(logo_url) if logo_url else None
    
    # Vérification supplémentaire pour l'URL du logo
    if logo_url_clean and not logo_url_clean.startswith(("http://", "https://")):
        logo_url_clean = None
        
    # Vérifier si un parti avec le même nom existe déjà
    for party in political_parties_db.values():
        if party.nom.lower() == nom_clean.lower():
            raise ValueError(f"Un parti avec le nom '{nom_clean}' existe déjà")
    
    party_id = str(uuid.uuid4())
    party = PoliticalParty(id=party_id, nom=nom_clean, description=description_clean, logo_url=logo_url_clean)
    political_parties_db[party_id] = party
    _save_parties()
    return party

def get_party(party_id: str) -> Optional[PoliticalParty]:
    return political_parties_db.get(party_id)

def list_parties() -> List[PoliticalParty]:
    return list(political_parties_db.values())

def update_party(party_id: str, nom: Optional[str] = None, description: Optional[str] = None, logo_url: Optional[str] = None) -> Optional[PoliticalParty]:
    party = political_parties_db.get(party_id)
    if party:
        if nom is not None: party.nom = nom
        if description is not None: party.description = description
        if logo_url is not None: party.logo_url = logo_url
        _save_parties()
        return party
    return None

def delete_party(party_id: str) -> bool:
    if party_id in political_parties_db:
        del political_parties_db[party_id]
        # Supprimer aussi les forces/faiblesses associées
        related_sw_ids = [sw_id for sw_id, sw in strengths_weaknesses_db.items() if sw.party_id == party_id]
        for sw_id in related_sw_ids:
            del strengths_weaknesses_db[sw_id]
        _save_parties()
        _save_sw()
        return True
    return False

# --- CRUD pour StrengthWeakness --- #

def add_strength_weakness(party_id: str, type: Union[str, TypeElement], contenu: str, date_input: date, 
                       categorie: Optional[str] = None, resume: Optional[str] = None,
                       source: Optional[str] = None, auteur: Optional[str] = None) -> Optional[StrengthWeakness]:
    if party_id not in political_parties_db:
        return None # Le parti doit exister
    
    # Conversion du type si nécessaire
    if isinstance(type, str):
        try:
            type_element = TypeElement(type)
        except ValueError:
            type_element = TypeElement.AUTRE
    else:
        type_element = type
        
    sw_id = str(uuid.uuid4())
    item = StrengthWeakness(
        id=sw_id, 
        party_id=party_id, 
        type=type_element, 
        categorie=categorie,
        contenu=contenu, 
        resume=resume,
        date=date_input, 
        source=source, 
        auteur=auteur,
        media_files=[]
    )
    strengths_weaknesses_db[sw_id] = item
    _save_sw()
    return item

def list_strengths_weaknesses(party_id: str) -> List[StrengthWeakness]:
    return [sw for sw in strengths_weaknesses_db.values() if sw.party_id == party_id]

def get_strength_weakness(sw_id: str) -> Optional[StrengthWeakness]:
    return strengths_weaknesses_db.get(sw_id)

def list_all_strengths_weaknesses() -> List[StrengthWeakness]:
    """Retourne toutes les forces et faiblesses, tous partis confondus."""
    return list(strengths_weaknesses_db.values())

def add_media_to_strength_weakness(sw_id: str, file_path: str, media_type: Union[str, MediaType], importance: int = 1) -> Optional[MediaFile]:
    if sw_id not in strengths_weaknesses_db:
        return None  # L'élément doit exister
    
    # Conversion du type média si nécessaire
    if isinstance(media_type, str):
        try:
            media_type_enum = MediaType(media_type)
        except ValueError:
            media_type_enum = MediaType.AUTRE
    else:
        media_type_enum = media_type
    
    # Limiter l'importance entre 1 et 5
    importance_value = max(1, min(5, importance))
    
    media_id = str(uuid.uuid4())
    media_file = MediaFile(
        id=media_id,
        element_id=sw_id,
        file_path=file_path,
        media_type=media_type_enum,
        importance=importance_value
    )
    
    media_files_db[media_id] = media_file
    
    # Ajouter la référence au fichier média dans l'élément
    strengths_weaknesses_db[sw_id].media_files.append(media_file)
    
    _save_media_files()
    _save_sw()
    
    return media_file

def get_media_files_for_element(element_id: str) -> List[MediaFile]:
    return [media for media in media_files_db.values() if media.element_id == element_id]

def delete_media_file(media_id: str) -> bool:
    if media_id not in media_files_db:
        return False
    
    media = media_files_db[media_id]
    element_id = media.element_id
    
    # Supprimer le fichier physique si possible
    file_path = media.file_path
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Erreur lors de la suppression du fichier {file_path}: {e}")
    
    # Supprimer la référence dans l'élément
    if element_id in strengths_weaknesses_db:
        strengths_weaknesses_db[element_id].media_files = [
            m for m in strengths_weaknesses_db[element_id].media_files if m.id != media_id
        ]
        _save_sw()
    
    # Supprimer l'entrée de la base de données
    del media_files_db[media_id]
    _save_media_files()
    
    return True

def delete_strength_weakness(sw_id: str) -> bool:
    if sw_id in strengths_weaknesses_db:
        # Supprimer tous les fichiers média associés
        media_ids = [media.id for media in get_media_files_for_element(sw_id)]
        for media_id in media_ids:
            delete_media_file(media_id)
        
        # Supprimer l'élément
        del strengths_weaknesses_db[sw_id]
        _save_sw()
        return True
    return False
