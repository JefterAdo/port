#!/bin/bash
# Script pour préparer le dépôt Git pour le déploiement sur Hostinger

set -e  # Arrêter le script en cas d'erreur

echo "Préparation du dépôt Git pour déploiement sur Hostinger..."

# Vérifier si Git est déjà initialisé
if [ -d ".git" ]; then
    echo "Dépôt Git déjà initialisé."
else
    echo "Initialisation du dépôt Git..."
    git init
fi

# Configurer le dépôt distant
echo "Configuration du dépôt distant..."
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/JefterAdo/port.git

# Vérifier que les fichiers JSON sont bien initialisés
if [ ! -f "parties.json" ] || [ "$(cat parties.json)" != "{}" ]; then
    echo "Création/réinitialisation du fichier parties.json..."
    echo "{}" > parties.json
fi

if [ ! -f "strengths_weaknesses.json" ] || [ "$(cat strengths_weaknesses.json)" != "{}" ]; then
    echo "Création/réinitialisation du fichier strengths_weaknesses.json..."
    echo "{}" > strengths_weaknesses.json
fi

# Rendre le script de déploiement exécutable
chmod +x deploy.sh

# Ajouter les fichiers au dépôt Git
echo "Ajout des fichiers au dépôt Git..."
git add .

echo "Préparation terminée!"
echo "Pour finaliser, exécutez les commandes suivantes:"
echo "git commit -m \"Préparation pour déploiement sur Hostinger\""
echo "git push -u origin main"