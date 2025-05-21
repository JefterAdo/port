#!/bin/bash
# Script d'indexation automatique pour le moteur de recherche RAG
# Ce script est conçu pour être exécuté par cron

# Chemin vers le répertoire du projet
PROJECT_DIR="/home/demoiassistant/htdocs/www.demoiassistant.online/port"
RAG_DIR="$PROJECT_DIR/rag_backend"
LOG_DIR="$RAG_DIR/logs"

# Créer le répertoire de logs s'il n'existe pas
mkdir -p "$LOG_DIR"

# Nom du fichier de log avec date et heure
LOG_FILE="$LOG_DIR/indexation_$(date +%Y%m%d_%H%M%S).log"

# Chemin vers l'environnement Python virtuel
PYTHON_ENV="$PROJECT_DIR/rag_venv/bin/python"
# Activer l'environnement virtuel pour les commandes qui en ont besoin
source "$PROJECT_DIR/rag_venv/bin/activate"

# Fonction pour logger les messages
log() {
    echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1" | tee -a "$LOG_FILE"
}

# Aller dans le répertoire du backend RAG
cd "$RAG_DIR" || {
    log "ERREUR: Impossible d'accéder au répertoire $RAG_DIR"
    exit 1
}

log "Début de l'indexation automatique"

# Exécuter le script d'indexation
log "Indexation des données EDLS..."
$PYTHON_ENV indexer.py --edls >> "$LOG_FILE" 2>&1
EDLS_STATUS=$?

log "Indexation des données Forces/Faiblesses..."
$PYTHON_ENV indexer.py --forces >> "$LOG_FILE" 2>&1
FORCES_STATUS=$?

# Vérifier les statuts
if [ $EDLS_STATUS -eq 0 ] && [ $FORCES_STATUS -eq 0 ]; then
    log "Indexation terminée avec succès"
else
    log "ERREUR: L'indexation a échoué. Vérifiez les logs pour plus de détails."
    if [ $EDLS_STATUS -ne 0 ]; then
        log "Échec de l'indexation EDLS (code: $EDLS_STATUS)"
    fi
    if [ $FORCES_STATUS -ne 0 ]; then
        log "Échec de l'indexation Forces/Faiblesses (code: $FORCES_STATUS)"
    fi
fi

# Nettoyer les anciens logs (garder seulement les 30 derniers)
find "$LOG_DIR" -name "indexation_*.log" -type f | sort -r | tail -n +31 | xargs -r rm

log "Script terminé"

exit 0
