# RHDP AI Communication Platform

## Guide de déploiement sur VPS Hostinger avec CloudPanel

Ce guide détaille les étapes nécessaires pour déployer l'application RHDP AI Communication Platform sur un VPS Hostinger utilisant CloudPanel.

### Prérequis

- Un VPS Hostinger avec CloudPanel installé
- Un nom de domaine configuré pour pointer vers votre VPS
- Accès SSH à votre VPS
- Un compte GitHub pour héberger le code source

### 1. Préparation du dépôt GitHub

1. Créez un nouveau dépôt privé sur GitHub
2. Poussez le code source vers ce dépôt :
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/votre-username/votre-repo.git
   git push -u origin main
   ```

### 2. Configuration du VPS avec CloudPanel

1. Connectez-vous à CloudPanel
2. Créez un nouveau site web pour votre domaine
3. Configurez les certificats SSL pour votre domaine

### 3. Installation des dépendances système

Connectez-vous à votre VPS via SSH et installez les dépendances requises :

```bash
# Mise à jour du système
sudo apt update
sudo apt upgrade -y

# Installation de Python et pip
sudo apt install -y python3 python3-pip python3-venv

# Installation de Node.js et npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérification des versions
python3 --version
node --version
npm --version
```

### 4. Clonage du dépôt

```bash
# Naviguez vers le répertoire du site web (ajustez selon votre configuration CloudPanel)
cd /var/www/votre-domaine.com

# Clonez le dépôt
git clone https://github.com/votre-username/votre-repo.git .

# Rendez le script de déploiement exécutable
chmod +x deploy.sh
```

### 5. Configuration des fichiers de base de données JSON

Assurez-vous que les fichiers JSON de base de données existent et sont initialisés :

```bash
# Si les fichiers n'existent pas déjà
echo "{}" > parties.json
echo "{}" > strengths_weaknesses.json

# Assurez-vous que les permissions sont correctes
chmod 644 parties.json strengths_weaknesses.json
```

### 6. Configuration des variables d'environnement

Créez un fichier `.env` avec vos clés API :

```bash
cp .env.production .env
nano .env  # Modifiez le fichier pour ajouter vos vraies clés API
```

### 7. Exécution du script de déploiement

```bash
./deploy.sh
```

### 8. Configuration du service systemd pour le backend

```bash
# Copiez le fichier de service vers systemd
sudo cp rhdp-backend.service.example /etc/systemd/system/rhdp-backend.service

# Modifiez le fichier pour l'adapter à votre configuration
sudo nano /etc/systemd/system/rhdp-backend.service

# Activez et démarrez le service
sudo systemctl daemon-reload
sudo systemctl enable rhdp-backend
sudo systemctl start rhdp-backend

# Vérifiez que le service fonctionne
sudo systemctl status rhdp-backend
```

### 9. Configuration de Nginx

1. Dans CloudPanel, allez dans Sites > votre-domaine.com > Nginx Vhost
2. Remplacez la configuration par celle fournie dans le fichier `nginx.conf.example` (adaptez les chemins et le nom de domaine)
3. Redémarrez Nginx :
   ```bash
   sudo systemctl restart nginx
   ```

### 10. Vérification du déploiement

Accédez à votre site via votre navigateur : `https://votre-domaine.com`

### Maintenance et mises à jour

Pour mettre à jour l'application après des modifications du code :

```bash
# Connectez-vous à votre VPS
ssh user@votre-vps

# Naviguez vers le répertoire du site
cd /var/www/votre-domaine.com

# Tirez les dernières modifications
git pull

# Réexécutez le script de déploiement
./deploy.sh

# Redémarrez le service backend
sudo systemctl restart rhdp-backend
```

## Dépannage

### Problèmes courants et solutions

1. **Erreur 502 Bad Gateway**
   - Vérifiez que le service backend est en cours d'exécution : `sudo systemctl status rhdp-backend`
   - Vérifiez les logs : `sudo journalctl -u rhdp-backend`

2. **Erreur 404 pour les routes API**
   - Vérifiez la configuration Nginx pour vous assurer que les routes API sont correctement proxifiées

3. **Erreurs lors de la création de partis**
   - Vérifiez que les fichiers JSON existent et ont les bonnes permissions
   - Vérifiez les logs du backend pour plus de détails

4. **Problèmes de CORS**
   - Assurez-vous que votre domaine est correctement listé dans les origines autorisées dans `main.py`

Pour tout autre problème, consultez les logs du backend et de Nginx :
```bash
sudo journalctl -u rhdp-backend
sudo tail -f /var/log/nginx/votre-domaine.com.error.log
```