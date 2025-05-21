#!/bin/bash
# Script d'initialisation pour le serveur Hostinger après clonage du dépôt Git

set -e  # Arrêter le script en cas d'erreur

echo "Initialisation de l'environnement sur le serveur Hostinger..."

# Vérifier que les fichiers JSON de base de données existent
if [ ! -f "parties.json" ]; then
    echo "Création du fichier parties.json..."
    echo "{}" > parties.json
    chmod 644 parties.json
fi

if [ ! -f "strengths_weaknesses.json" ]; then
    echo "Création du fichier strengths_weaknesses.json..."
    echo "{}" > strengths_weaknesses.json
    chmod 644 strengths_weaknesses.json
fi

# Création du fichier .env à partir du modèle
if [ ! -f ".env" ] && [ -f ".env.production" ]; then
    echo "Création du fichier .env à partir du modèle .env.production..."
    cp .env.production .env
    echo "ATTENTION: Veuillez éditer le fichier .env pour ajouter vos clés API réelles."
fi

# Rendre les scripts exécutables
chmod +x deploy.sh

echo "Installation des dépendances Node.js..."
npm install

echo "Build du frontend..."
npm run build

echo "Création d'un environnement virtuel Python..."
python3 -m venv venv
source venv/bin/activate

echo "Installation des dépendances Python..."
pip install -r requirements.txt

echo "Initialisation terminée!"
echo "Pour démarrer le backend, exécutez: cd rag_backend && uvicorn main:app --host 0.0.0.0 --port 8000"
echo "Pour configurer le service systemd, suivez les instructions dans le fichier hostinger-cloudpanel-config.md"