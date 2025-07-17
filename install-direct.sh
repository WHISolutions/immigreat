#!/bin/bash

# Script d'installation directe sur Ubuntu (sans Docker)
# Usage: ./install-direct.sh

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Variables
APP_DIR="/opt/immigreat"
APP_USER="immigreat"
NODE_VERSION="18"

log "🚀 Installation directe de l'application Immigreat sur Ubuntu"

# Mise à jour du système
log "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Installation des dépendances système
log "🛠️ Installation des dépendances système..."
sudo apt install -y \
    curl \
    git \
    nginx \
    mysql-server \
    mysql-client \
    ufw \
    htop \
    nano \
    certbot \
    python3-certbot-nginx

# Installation de Node.js
log "📦 Installation de Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérification des versions
log "✅ Versions installées:"
node --version
npm --version
mysql --version

# Création de l'utilisateur pour l'application
log "👤 Création de l'utilisateur $APP_USER..."
if ! id "$APP_USER" &>/dev/null; then
    sudo adduser --system --home $APP_DIR --shell /bin/bash $APP_USER
    sudo usermod -aG www-data $APP_USER
fi

# Création du répertoire de l'application
log "📁 Configuration du répertoire de l'application..."
sudo mkdir -p $APP_DIR
sudo chown $APP_USER:www-data $APP_DIR
sudo chmod 755 $APP_DIR

# Configuration MySQL
log "🗄️ Configuration de MySQL..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Sécurisation de MySQL
log "🔒 Sécurisation de MySQL..."
sudo mysql -e "CREATE DATABASE IF NOT EXISTS immigration_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'immigreat_user'@'localhost' IDENTIFIED BY 'immigreat_secure_password_2024';"
sudo mysql -e "GRANT ALL PRIVILEGES ON immigration_production.* TO 'immigreat_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Configuration du firewall
log "🔒 Configuration du firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000/tcp

# Installation PM2 pour la gestion des processus
log "⚙️ Installation de PM2..."
sudo npm install -g pm2

# Configuration des logs
log "📝 Configuration des logs..."
sudo mkdir -p /var/log/immigreat
sudo chown $APP_USER:www-data /var/log/immigreat

log "✅ Installation des dépendances terminée !"
log "📋 Prochaines étapes:"
info "1. Cloner le code source dans $APP_DIR"
info "2. Installer les dépendances npm"
info "3. Configurer les variables d'environnement"
info "4. Configurer Nginx"
info "5. Démarrer l'application avec PM2"

warning "⚠️ N'oubliez pas de changer le mot de passe MySQL par défaut !"
warning "Mot de passe actuel: immigreat_secure_password_2024"
