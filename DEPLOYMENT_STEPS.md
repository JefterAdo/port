# Étapes de déploiement sur Hostinger avec CloudPanel

Ce document résume les étapes à suivre pour déployer votre application sur un VPS Hostinger avec CloudPanel.

## 1. Préparation locale et envoi vers GitHub

1. Exécutez le script de préparation Git :
   ```bash
   ./prepare-git-repo.sh
   ```

2. Faites un commit et poussez vers GitHub :
   ```bash
   git commit -m "Préparation pour déploiement sur Hostinger"
   git push -u origin main
   ```

## 2. Configuration sur le VPS Hostinger

1. Connectez-vous à votre VPS via SSH :
   ```bash
   ssh utilisateur@adresse-ip-vps
   ```

2. Installez les dépendances système nécessaires :
   ```bash
   sudo apt update
   sudo apt install -y python3 python3-pip python3-venv git
   
   # Installation de Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. Configurez votre site dans CloudPanel :
   - Créez un nouveau site pour votre domaine
   - Configurez les certificats SSL

4. Clonez le dépôt GitHub dans le répertoire du site :
   ```bash
   cd /var/www/votre-domaine.com
   git clone https://github.com/JefterAdo/port.git .
   ```

5. Exécutez le script d'initialisation :
   ```bash
   chmod +x hostinger-init.sh
   ./hostinger-init.sh
   ```

6. Configurez les variables d'environnement :
   ```bash
   nano .env
   # Ajoutez vos vraies clés API
   ```

7. Configurez le service systemd pour le backend :
   ```bash
   sudo cp rhdp-backend.service.example /etc/systemd/system/rhdp-backend.service
   sudo nano /etc/systemd/system/rhdp-backend.service
   # Modifiez les chemins selon votre configuration
   
   sudo systemctl daemon-reload
   sudo systemctl enable rhdp-backend
   sudo systemctl start rhdp-backend
   ```

8. Configurez Nginx pour le proxy inverse :
   - Dans CloudPanel, allez dans Sites > votre-domaine > Vhost
   - Remplacez la configuration par celle du fichier `nginx.conf.example`
   - Adaptez les chemins et le nom de domaine
   - Redémarrez Nginx : `sudo systemctl restart nginx`

## 3. Vérification du déploiement

1. Vérifiez que le service backend fonctionne :
   ```bash
   sudo systemctl status rhdp-backend
   ```

2. Vérifiez les logs en cas de problème :
   ```bash
   sudo journalctl -u rhdp-backend
   sudo tail -f /var/log/nginx/votre-domaine.com.error.log
   ```

3. Accédez à votre site via votre navigateur : `https://votre-domaine.com`

## 4. Mises à jour futures

Pour mettre à jour l'application après des modifications du code :

1. Poussez les modifications vers GitHub

2. Sur le VPS, tirez les dernières modifications :
   ```bash
   cd /var/www/votre-domaine.com
   git pull
   ```

3. Réexécutez le script de déploiement :
   ```bash
   ./deploy.sh
   ```

4. Redémarrez le service backend :
   ```bash
   sudo systemctl restart rhdp-backend
   ```

## Points importants à retenir

- Les fichiers JSON (`parties.json` et `strengths_weaknesses.json`) doivent exister et être initialisés avec `{}` pour éviter les erreurs 500.
- La configuration du proxy dans Nginx est essentielle pour rediriger correctement les requêtes API vers le backend.
- Les clés API sensibles ne doivent jamais être incluses dans votre dépôt Git.
- Vérifiez toujours les logs en cas de problème pour identifier la source de l'erreur.