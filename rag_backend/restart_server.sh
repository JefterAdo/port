#!/bin/bash
# Script pour redémarrer le serveur FastAPI

echo "Arrêt des processus Uvicorn existants..."
pkill -f "uvicorn main:app" || echo "Aucun processus Uvicorn en cours d'exécution"

echo "Démarrage du serveur FastAPI..."
cd /home/demoiassistant/htdocs/www.demoiassistant.online/port/rag_backend/
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > uvicorn.log 2>&1 &

echo "Serveur démarré en arrière-plan. Logs disponibles dans uvicorn.log"
echo "PID du processus: $!"
