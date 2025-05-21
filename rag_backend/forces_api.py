from fastapi import APIRouter, HTTPException
from typing import List
from datetime import date
import os
import uuid
from .forces_models import PoliticalParty, StrengthWeakness, MediaFile, TypeElement, MediaType, BaseModel
from .forces_store import (
    create_party, get_party, list_parties, update_party, delete_party,
    add_strength_weakness, list_strengths_weaknesses, delete_strength_weakness,
    list_all_strengths_weaknesses, add_media_to_strength_weakness, get_media_files_for_element,
    delete_media_file, strengths_weaknesses_db, MEDIA_UPLOAD_DIR
)

router = APIRouter()

# --- Endpoints pour le Tableau de Bord --- #

class DashboardSummary(BaseModel):
    total_parties: int
    recent_sw: List[StrengthWeakness]

@router.get("/dashboard-summary", response_model=DashboardSummary)
def get_dashboard_summary_api():
    try:
        all_parties = list_parties() or []
        all_sw = list_all_strengths_weaknesses() or []
        sorted_sw = sorted(all_sw, key=lambda x: getattr(x, 'date', None) or '', reverse=True)
        return DashboardSummary(
            total_parties=len(all_parties),
            recent_sw=sorted_sw[:3]
        )
    except Exception as e:
        print(f"[DASHBOARD ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors du résumé du dashboard: {e}")


# --- Endpoints pour les Partis --- #

class PartyCreate(BaseModel):
    nom: str
    description: str
    logo_url: str = None

@router.post("/parties", response_model=PoliticalParty)
def create_party_api(party: PartyCreate):
    try:
        return create_party(party.nom, party.description, party.logo_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"[PARTIES ERROR] {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du parti: {e}")

@router.get("/parties", response_model=List[PoliticalParty])
def list_parties_api():
    return list_parties()

@router.get("/parties/{party_id}", response_model=PoliticalParty)
def get_party_api(party_id: str):
    party = get_party(party_id)
    if not party:
        raise HTTPException(status_code=404, detail="Parti non trouvé")
    return party

@router.put("/parties/{party_id}", response_model=PoliticalParty)
def update_party_api(party_id: str, nom: str = None, description: str = None, logo_url: str = None):
    party = update_party(party_id, nom=nom, description=description, logo_url=logo_url)
    if not party:
        raise HTTPException(status_code=404, detail="Parti non trouvé")
    return party

@router.delete("/parties/{party_id}")
def delete_party_api(party_id: str):
    if not delete_party(party_id):
        raise HTTPException(status_code=404, detail="Parti non trouvé")
    return {"status": "deleted"}

class StrengthWeaknessCreate(BaseModel):
    party_id: str
    type: str
    categorie: str = None
    contenu: str
    resume: str = None
    date_: date
    source: str = None
    auteur: str = None

@router.post("/forces-faiblesses", response_model=StrengthWeakness)
def add_strength_weakness_api(sw: StrengthWeaknessCreate):
    return add_strength_weakness(
        party_id=sw.party_id, 
        type=sw.type, 
        contenu=sw.contenu, 
        date_input=sw.date_, 
        categorie=sw.categorie,
        resume=sw.resume,
        source=sw.source, 
        auteur=sw.auteur
    )

@router.get("/forces-faiblesses/{party_id}", response_model=List[StrengthWeakness])
def list_strengths_weaknesses_api(party_id: str, type: str = None):
    elements = list_strengths_weaknesses(party_id)
    if type:
        try:
            type_element = TypeElement(type)
            elements = [e for e in elements if e.type == type_element]
        except ValueError:
            # Si le type n'est pas valide, on ignore le filtre
            pass
    return elements

@router.get("/elements-types", response_model=List[str])
def get_element_types_api():
    return [t.value for t in TypeElement]

@router.delete("/forces-faiblesses/{sw_id}")
def delete_strength_weakness_api(sw_id: str):
    if not delete_strength_weakness(sw_id):
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    return {"status": "deleted"}

# --- Endpoints pour les fichiers média --- #

from fastapi import File, UploadFile, Form
import shutil

class MediaFileCreate(BaseModel):
    element_id: str
    media_type: str
    importance: int = 1

@router.post("/media-files", response_model=MediaFile)
async def add_media_file_api(element_id: str = Form(...), 
                           media_type: str = Form(...), 
                           importance: int = Form(1),
                           file: UploadFile = File(...)):
    # Vérifier que l'élément existe
    if element_id not in strengths_weaknesses_db:
        raise HTTPException(status_code=404, detail="Élément non trouvé")
    
    # Créer un nom de fichier unique
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(MEDIA_UPLOAD_DIR, unique_filename)
    
    # Sauvegarder le fichier
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload du fichier: {e}")
    
    # Ajouter le fichier média à l'élément
    media_file = add_media_to_strength_weakness(element_id, file_path, media_type, importance)
    if not media_file:
        # Supprimer le fichier si l'ajout a échoué
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail="Erreur lors de l'ajout du fichier média")
    
    return media_file

@router.get("/media-files/{element_id}", response_model=List[MediaFile])
def get_media_files_api(element_id: str):
    return get_media_files_for_element(element_id)

@router.delete("/media-files/{media_id}")
def delete_media_file_api(media_id: str):
    if not delete_media_file(media_id):
        raise HTTPException(status_code=404, detail="Fichier média non trouvé")
    return {"status": "deleted"}
