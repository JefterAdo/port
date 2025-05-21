# Configuration pour Hostinger avec CloudPanel

Ce document contient les instructions spécifiques pour configurer votre application sur un VPS Hostinger utilisant CloudPanel.

## Configuration du site dans CloudPanel

1. Connectez-vous à votre panneau CloudPanel
2. Allez dans "Sites" et cliquez sur "Add Site"
3. Entrez votre nom de domaine
4. Sélectionnez "Node.js" comme type d'application
5. Configurez les paramètres suivants :
   - **Document Root**: `/dist` (pour servir les fichiers statiques du frontend)
   - **Node.js Version**: 18.x (ou la version compatible avec votre projet)
   - **Application Port**: 8000 (pour le backend FastAPI)

## Configuration Nginx pour le proxy inverse

Dans CloudPanel, allez dans "Sites" > votre-domaine > "Vhost" et remplacez la configuration par celle du fichier `nginx.conf.example` (en adaptant les chemins et le nom de domaine).

## Configuration du service backend

1. Créez un service systemd pour exécuter votre backend FastAPI :
   ```bash
   sudo cp /var/www/votre-domaine.com/rhdp-backend.service.example /etc/systemd/system/rhdp-backend.service
   sudo nano /etc/systemd/system/rhdp-backend.service
   # Modifiez les chemins selon votre configuration
   ```

2. Activez et démarrez le service :
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable rhdp-backend
   sudo systemctl start rhdp-backend
   ```

## Vérification des fichiers JSON

Assurez-vous que les fichiers de base de données JSON existent et sont correctement initialisés :
```bash
cd /var/www/votre-domaine.com
cat parties.json  # Devrait afficher {}
cat strengths_weaknesses.json  # Devrait afficher {}
```

## Variables d'environnement

Créez un fichier `.env` dans le répertoire racine de votre application avec vos clés API :
```bash
cd /var/www/votre-domaine.com
cp .env.production .env
nano .env  # Ajoutez vos vraies clés API
```

## Commandes utiles pour le dépannage

- Vérifier l'état du service backend :
  ```bash
  sudo systemctl status rhdp-backend
  ```

- Consulter les logs du service backend :
  ```bash
  sudo journalctl -u rhdp-backend
  ```

- Consulter les logs Nginx :
  ```bash
  sudo tail -f /var/log/nginx/votre-domaine.com.error.log
  ```

- Redémarrer le service backend après des modifications :
  ```bash
  sudo systemctl restart rhdp-backend
  ```

- Redémarrer Nginx après des modifications de configuration :
  ```bash
  sudo systemctl restart nginx
  ```