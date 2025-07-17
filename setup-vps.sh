#!/bin/bash

# Script de préparation du VPS Ubuntu pour Docker
# Usage: ./setup-vps.sh

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

log "🔧 Configuration du VPS Ubuntu pour Docker"

# Mise à jour du système
log "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# Installation des dépendances
log "🛠️ Installation des dépendances..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    nano \
    htop \
    ufw

# Installation de Docker
log "🐳 Installation de Docker..."
if ! command -v docker &> /dev/null; then
    # Ajouter la clé GPG officielle de Docker
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Ajouter le repository Docker
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Installer Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Ajouter l'utilisateur au groupe docker
    sudo usermod -aG docker $USER
    
    log "✅ Docker installé avec succès"
else
    log "✅ Docker déjà installé"
fi

# Installation de Docker Compose
log "🔧 Installation de Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    log "✅ Docker Compose installé avec succès"
else
    log "✅ Docker Compose déjà installé"
fi

# Configuration du firewall
log "🔒 Configuration du firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4000/tcp  # Port de l'application
sudo ufw allow 3306/tcp  # Port MySQL (si accès externe nécessaire)

# Création du répertoire pour l'application
log "📁 Création du répertoire de l'application..."
sudo mkdir -p /opt/immigreat
sudo chown $USER:$USER /opt/immigreat

# Configuration des logs
log "📝 Configuration des logs..."
sudo mkdir -p /var/log/immigreat
sudo chown $USER:$USER /var/log/immigreat

# Configuration de swap (si pas assez de RAM)
if [ $(free -m | awk 'NR==2{printf "%.0f", $2}') -lt 2048 ]; then
    log "💾 Configuration du swap (RAM < 2GB)..."
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

log "🎉 Configuration du VPS terminée !"
log "📋 Prochaines étapes:"
info "1. Déconnectez-vous et reconnectez-vous pour appliquer les groupes Docker"
info "2. Clonez votre repository Git"
info "3. Configurez les variables d'environnement"
info "4. Déployez l'application avec Docker Compose"

log "🔄 Redémarrage recommandé pour finaliser l'installation..."
warning "Voulez-vous redémarrer maintenant ? (y/N)"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    sudo reboot
fi
