#!/bin/bash
# Script de déploiement pour RHDP AI Communication Platform
# À exécuter sur le serveur VPS après avoir cloné le dépôt

set -e  # Arrêter le script en cas d'erreur

echo "Démarrage du déploiement de RHDP AI Communication Platform..."

# Vérifier que les fichiers JSON de base de données existent
if [ ! -f "parties.json" ]; then
    echo "Création du fichier parties.json..."
    echo "{}" > parties.json
fi

if [ ! -f "strengths_weaknesses.json" ]; then
    echo "Création du fichier strengths_weaknesses.json..."
    echo "{}" > strengths_weaknesses.json
fi

# Installation des dépendances frontend
echo "Installation des dépendances frontend..."
npm install

# Build du frontend
echo "Build du frontend..."
npm run build

# Création d'un environnement virtuel Python
echo "Création de l'environnement virtuel Python..."
python3 -m venv venv
source venv/bin/activate

# Installation des dépendances backend
echo "Installation des dépendances backend..."
pip install -r requirements.txt

# Configuration des variables d'environnement
if [ ! -f ".env" ]; then
    echo "ATTENTION: Fichier .env non trouvé. Veuillez créer un fichier .env avec vos clés API."
    echo "Vous pouvez utiliser .env.production comme modèle."
    exit 1
fi

echo "Déploiement terminé avec succès!"
echo "Pour démarrer le backend, exécutez: cd rag_backend && uvicorn main:app --host 0.0.0.0 --port 8000"
echo "Pour configurer le service systemd, copiez le fichier rhdp-backend.service.example vers /etc/systemd/system/rhdp-backend.service"
echo "Puis exécutez: sudo systemctl enable rhdp-backend && sudo systemctl start rhdp-backend"