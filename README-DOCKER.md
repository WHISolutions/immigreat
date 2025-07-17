# Guide de déploiement Docker - Application Immigreat

## 📋 Vue d'ensemble

Cette configuration Docker permet de déployer facilement l'application Immigreat avec une base de données MySQL en utilisant Docker Compose.

## 🏗️ Architecture

```
├── app/               # Application Node.js (port 3000)
├── db/                # Base de données MySQL (port 3306)
└── nginx/             # Reverse proxy (ports 80/443) [optionnel]
```

## 📁 Structure des fichiers

```
app2/
├── Dockerfile                    # Image Docker pour l'app Node.js
├── docker-compose.yml           # Configuration des services
├── .env.example                 # Variables d'environnement exemple
├── .dockerignore               # Fichiers à ignorer lors du build
├── wait-for-it.sh              # Script d'attente pour MySQL
├── init.sql                    # Script d'initialisation MySQL
├── nginx.conf                  # Configuration Nginx (optionnel)
├── deploy.sh                   # Script de déploiement Linux/Mac
├── deploy.ps1                  # Script de déploiement Windows
├── mysql-connection-example.js # Exemple de connexion MySQL
└── backend/                    # Code source de l'application
    ├── server.js
    ├── package.json
    └── ...
```

## 🚀 Déploiement rapide

### 1. Prérequis
- Docker et Docker Compose installés
- Ports 3000 et 3306 disponibles

### 2. Configuration
```bash
# Copier le fichier d'environnement
cp .env.example .env

# Modifier les variables (IMPORTANT !)
nano .env  # ou votre éditeur préféré
```

### 3. Démarrage

**Windows PowerShell:**
```powershell
.\deploy.ps1 dev
```

**Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh dev
```

**Ou manuellement:**
```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f app
```

## ⚙️ Variables d'environnement

### Variables essentielles dans `.env`:

```env
# Base de données MySQL
DB_HOST=db
DB_USER=immigreat_user
DB_PASSWORD=immigreat_secure_password_2024  # ⚠️ À changer !
DB_NAME=immigration_production
DB_ROOT_PASSWORD=root_secure_password_2024  # ⚠️ À changer !

# Application
APP_PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production  # ⚠️ À changer !
FRONTEND_URL=http://localhost:3000
```

## 🔧 Commandes utiles

### Gestion des services
```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service
docker-compose restart app

# Reconstruire et redémarrer
docker-compose up -d --build
```

### Logs et debug
```bash
# Voir les logs de l'application
docker-compose logs -f app

# Voir les logs de la base de données
docker-compose logs -f db

# Voir tous les logs
docker-compose logs -f

# Entrer dans le conteneur de l'app
docker-compose exec app sh

# Entrer dans le conteneur MySQL
docker-compose exec db mysql -u root -p
```

### Base de données
```bash
# Exporter la base de données
docker-compose exec db mysqldump -u root -p immigration_production > backup.sql

# Importer une base de données
docker-compose exec -T db mysql -u root -p immigration_production < backup.sql

# Voir l'état de la base de données
docker-compose exec db mysql -u root -p -e "SHOW DATABASES;"
```

## 🔒 Sécurité en production

### 1. Modifier les mots de passe
- `DB_PASSWORD` : Mot de passe utilisateur MySQL
- `DB_ROOT_PASSWORD` : Mot de passe root MySQL
- `JWT_SECRET` : Clé secrète JWT (minimum 32 caractères)

### 2. Configuration HTTPS
```bash
# Générer des certificats SSL
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# Décommenter la section HTTPS dans nginx.conf
```

### 3. Variables d'environnement
```env
NODE_ENV=production
FRONTEND_URL=https://votre-domaine.com
```

## 📊 Monitoring

### Vérifier l'état des services
```bash
# Statut des conteneurs
docker-compose ps

# Utilisation des ressources
docker stats

# Santé de l'application
curl http://localhost:3000/

# Test de la base de données
docker-compose exec db mysql -u immigreat_user -p -e "SELECT 1;"
```

## 🐛 Dépannage

### Problèmes courants

**1. Erreur de connexion MySQL**
```bash
# Vérifier que MySQL est démarré
docker-compose logs db

# Redémarrer MySQL
docker-compose restart db
```

**2. Port déjà utilisé**
```bash
# Voir qui utilise le port 3000
netstat -tulpn | grep 3000

# Changer le port dans .env
APP_PORT=3001
```

**3. Problème de permissions**
```bash
# Changer les permissions du dossier uploads
sudo chown -R 1000:1000 backend/uploads
```

**4. MySQL ne démarre pas**
```bash
# Supprimer le volume MySQL et recommencer
docker-compose down -v
docker-compose up -d
```

### Logs détaillés
```bash
# Debug complet
docker-compose up --verbose

# Logs avec timestamps
docker-compose logs -f -t

# Logs uniquement les erreurs
docker-compose logs app 2>&1 | grep -i error
```

## 🔄 Mise à jour

### Mise à jour de l'application
```bash
# Arrêter l'application
docker-compose stop app

# Reconstruire l'image
docker-compose build --no-cache app

# Redémarrer
docker-compose up -d app
```

### Mise à jour complète
```bash
# Sauvegarder la base de données
docker-compose exec db mysqldump -u root -p immigration_production > backup_$(date +%Y%m%d).sql

# Arrêter tous les services
docker-compose down

# Mettre à jour le code source
git pull

# Reconstruire et redémarrer
docker-compose up -d --build
```

## 📞 Support

### En cas de problème:
1. Vérifiez les logs: `docker-compose logs -f`
2. Vérifiez la configuration `.env`
3. Redémarrez les services: `docker-compose restart`
4. En dernier recours: `docker-compose down -v && docker-compose up -d`

### Fichiers de configuration importants:
- `.env` : Variables d'environnement
- `docker-compose.yml` : Configuration des services
- `Dockerfile` : Construction de l'image Node.js
- `init.sql` : Initialisation de la base de données
