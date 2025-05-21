#!/usr/bin/env python3
"""
Script d'indexation pour le moteur RAG
Ce script récupère les données EDLS et Forces/Faiblesses et les indexe dans le moteur RAG.
Il peut être exécuté périodiquement pour maintenir l'index à jour.

Usage:
    python indexer.py --all  # Indexe toutes les données
    python indexer.py --edls  # Indexe uniquement les données EDLS
    python indexer.py --forces  # Indexe uniquement les données Forces/Faiblesses
"""

import os
import sys
import json
import argparse
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests

# Importer les modules nécessaires
from rag_engine import RAGEngine
from forces_models import PoliticalParty, StrengthWeakness
from forces_store import list_parties, list_strengths_weaknesses, get_party

# Configuration du logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("indexer.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("RAG-Indexer")

# Chemin vers le fichier de suivi d'indexation
INDEXING_TRACKER_FILE = "indexing_tracker.json"

def load_tracker() -> Dict[str, Any]:
    """Charge le fichier de suivi d'indexation ou crée un nouveau"""
    if os.path.exists(INDEXING_TRACKER_FILE):
        try:
            with open(INDEXING_TRACKER_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Erreur lors du chargement du fichier de suivi: {e}")
    
    # Créer un nouveau fichier de suivi
    return {
        "last_run": None,
        "edls_count": 0,
        "forces_count": 0,
        "edls_last_id": None,
        "forces_last_id": None
    }

def save_tracker(tracker: Dict[str, Any]) -> None:
    """Sauvegarde le fichier de suivi d'indexation"""
    tracker["last_run"] = datetime.now().isoformat()
    try:
        with open(INDEXING_TRACKER_FILE, 'w', encoding='utf-8') as f:
            json.dump(tracker, f, indent=2, ensure_ascii=False)
    except Exception as e:
        logger.error(f"Erreur lors de la sauvegarde du fichier de suivi: {e}")

def load_edls_data() -> List[Dict[str, Any]]:
    """
    Charge les données EDLS depuis le stockage
    Dans un environnement de production, cela pourrait être une base de données
    """
    try:
        # Chemin vers le fichier de données EDLS
        edls_file = os.path.join(os.path.dirname(__file__), "data", "edls.json")
        
        if os.path.exists(edls_file):
            with open(edls_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        else:
            logger.warning(f"Fichier de données EDLS non trouvé: {edls_file}")
            # Créer un fichier vide si inexistant
            with open(edls_file, 'w', encoding='utf-8') as f:
                json.dump([], f)
            return []
    except Exception as e:
        logger.error(f"Erreur lors du chargement des données EDLS: {e}")
        return []

def index_edls_data(rag_engine: RAGEngine, tracker: Dict[str, Any]) -> int:
    """
    Indexe les données EDLS dans le moteur RAG
    Retourne le nombre de documents indexés
    """
    edls_data = load_edls_data()
    count = 0
    
    logger.info(f"Indexation de {len(edls_data)} documents EDLS...")
    
    for edls_item in edls_data:
        # Vérifier si l'élément a déjà été indexé
        if tracker.get("edls_last_id") and edls_item["id"] <= tracker["edls_last_id"]:
            continue
        
        # Indexer l'élément
        result = rag_engine.add_edls_document(edls_item)
        
        if result.get("status") == "success":
            count += 1
            # Mettre à jour le dernier ID indexé
            if not tracker.get("edls_last_id") or edls_item["id"] > tracker["edls_last_id"]:
                tracker["edls_last_id"] = edls_item["id"]
        else:
            logger.error(f"Erreur lors de l'indexation de l'EDLS {edls_item['id']}: {result.get('error')}")
    
    # Mettre à jour le compteur
    tracker["edls_count"] += count
    
    logger.info(f"{count} documents EDLS indexés avec succès.")
    return count

def index_forces_faiblesses_data(rag_engine: RAGEngine, tracker: Dict[str, Any]) -> int:
    """
    Indexe les données Forces/Faiblesses dans le moteur RAG
    Retourne le nombre de documents indexés
    """
    count = 0
    
    # Récupérer tous les partis politiques
    parties = list_parties()
    
    logger.info(f"Indexation des données Forces/Faiblesses pour {len(parties)} partis...")
    
    for party in parties:
        party_id = party.id
        party_name = party.nom
        
        # Récupérer les forces et faiblesses du parti
        strengths_weaknesses = list_strengths_weaknesses(party_id)
        
        logger.info(f"Indexation de {len(strengths_weaknesses)} éléments pour le parti '{party_name}'...")
        
        for item in strengths_weaknesses:
            # Vérifier si l'élément a déjà été indexé
            if tracker.get("forces_last_id") and item.id <= tracker["forces_last_id"]:
                continue
            
            # Convertir l'objet Pydantic en dictionnaire
            item_dict = item.model_dump()
            
            # Indexer l'élément
            result = rag_engine.add_forces_faiblesses_document(item_dict, party_name)
            
            if result.get("status") == "success":
                count += 1
                # Mettre à jour le dernier ID indexé
                if not tracker.get("forces_last_id") or item.id > tracker["forces_last_id"]:
                    tracker["forces_last_id"] = item.id
            else:
                logger.error(f"Erreur lors de l'indexation de l'élément Forces/Faiblesses {item.id}: {result.get('error')}")
    
    # Mettre à jour le compteur
    tracker["forces_count"] += count
    
    logger.info(f"{count} documents Forces/Faiblesses indexés avec succès.")
    return count

def main():
    """Fonction principale"""
    parser = argparse.ArgumentParser(description="Indexation des données pour le moteur RAG")
    parser.add_argument("--all", action="store_true", help="Indexer toutes les données")
    parser.add_argument("--edls", action="store_true", help="Indexer uniquement les données EDLS")
    parser.add_argument("--forces", action="store_true", help="Indexer uniquement les données Forces/Faiblesses")
    parser.add_argument("--reset", action="store_true", help="Réinitialiser le suivi d'indexation")
    
    args = parser.parse_args()
    
    # Vérifier qu'au moins une option est spécifiée
    if not (args.all or args.edls or args.forces or args.reset):
        parser.print_help()
        sys.exit(1)
    
    # Charger le fichier de suivi
    tracker = load_tracker()
    
    # Réinitialiser le suivi si demandé
    if args.reset:
        logger.info("Réinitialisation du suivi d'indexation...")
        tracker = {
            "last_run": None,
            "edls_count": 0,
            "forces_count": 0,
            "edls_last_id": None,
            "forces_last_id": None
        }
        save_tracker(tracker)
        logger.info("Suivi d'indexation réinitialisé.")
        if not (args.all or args.edls or args.forces):
            return
    
    # Initialiser le moteur RAG
    rag_engine = RAGEngine()
    
    total_indexed = 0
    
    # Indexer les données EDLS si demandé
    if args.all or args.edls:
        logger.info("Début de l'indexation des données EDLS...")
        edls_count = index_edls_data(rag_engine, tracker)
        total_indexed += edls_count
    
    # Indexer les données Forces/Faiblesses si demandé
    if args.all or args.forces:
        logger.info("Début de l'indexation des données Forces/Faiblesses...")
        forces_count = index_forces_faiblesses_data(rag_engine, tracker)
        total_indexed += forces_count
    
    # Sauvegarder le fichier de suivi
    save_tracker(tracker)
    
    logger.info(f"Indexation terminée. {total_indexed} documents indexés au total.")
    logger.info(f"Total cumulé: {tracker['edls_count']} EDLS, {tracker['forces_count']} Forces/Faiblesses.")

if __name__ == "__main__":
    main()
