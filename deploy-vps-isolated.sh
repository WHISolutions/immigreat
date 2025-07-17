#!/bin/bash

# Script de déploiement isolé pour VPS partagé
# Usage: ./deploy-vps-isolated.sh

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

# Variables pour isolation
APP_NAME="immigreat"
APP_PORT="4000"
APP_DIR="/opt/${APP_NAME}-${APP_PORT}"
BACKUP_DIR="${APP_DIR}/backups"
LOG_FILE="/var/log/${APP_NAME}-${APP_PORT}/deploy.log"

log "🚀 Déploiement de ${APP_NAME} sur port ${APP_PORT} (mode isolé)"

# Créer le répertoire de l'application s'il n'existe pas
if [ ! -d "$APP_DIR" ]; then
    log "📁 Création du répertoire isolé: $APP_DIR"
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
fi

# Créer le répertoire de logs
sudo mkdir -p /var/log/${APP_NAME}-${APP_PORT}
sudo chown $USER:$USER /var/log/${APP_NAME}-${APP_PORT}

# Aller dans le répertoire de l'application
cd $APP_DIR

# Vérifier si c'est un nouveau déploiement ou une mise à jour
if [ ! -f "docker-compose.prod.yml" ]; then
    log "📥 Premier déploiement - Clonage du repository..."
    git clone https://github.com/WHISolutions/immigreat.git .
else
    log "🔄 Mise à jour du code source..."
    git pull origin main
fi

# Vérification des prérequis
if [ ! -f ".env" ]; then
    log "⚙️ Configuration des variables d'environnement..."
    cp .env.production .env
    warning "⚠️  IMPORTANT: Modifiez le fichier .env avec vos vraies valeurs !"
    warning "Fichier: $APP_DIR/.env"
    warning "Notamment: DB_PASSWORD, DB_ROOT_PASSWORD, JWT_SECRET"
    info "Port MySQL isolé: 3307"
    info "Port application: $APP_PORT"
    read -p "Appuyez sur Entrée quand la configuration est terminée..."
fi

# Chargement des variables d'environnement
set -a
source .env
set +a

# Sauvegarde avant déploiement (si DB existe)
if docker ps | grep -q "${APP_NAME}_mysql_prod_${APP_PORT}"; then
    log "💾 Sauvegarde de la base de données..."
    mkdir -p $BACKUP_DIR
    BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
    docker exec ${APP_NAME}_mysql_prod_${APP_PORT} mysqldump -u root -p${DB_ROOT_PASSWORD} immigration_production > $BACKUP_FILE || warning "Sauvegarde échouée"
    
    # Garder seulement les 5 dernières sauvegardes
    ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs -r rm
fi

# Arrêt des services existants
log "🛑 Arrêt des services existants..."
docker-compose -f docker-compose.prod.yml down || true

# Nettoyage des images non utilisées
log "🧹 Nettoyage des images Docker..."
docker system prune -f

# Construction des nouvelles images
log "🔨 Construction des images..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull

# Démarrage des services
log "🌟 Démarrage des services..."
docker-compose -f docker-compose.prod.yml up -d

# Attente que les services soient prêts
log "⏳ Vérification de l'état des services..."
sleep 30

# Vérification de la santé des services
check_health() {
    log "🏥 Vérification de la santé des services..."
    
    # Vérifier MySQL
    if docker exec ${APP_NAME}_mysql_prod_${APP_PORT} mysqladmin ping -h localhost --silent 2>/dev/null; then
        log "✅ MySQL opérationnel (port 3307)"
    else
        error "❌ MySQL ne répond pas"
        return 1
    fi
    
    # Vérifier l'application
    sleep 10
    if curl -f http://localhost:${APP_PORT}/ > /dev/null 2>&1; then
        log "✅ Application opérationnelle (port ${APP_PORT})"
    else
        error "❌ Application ne répond pas sur le port ${APP_PORT}"
        return 1
    fi
}

# Test de santé
if check_health; then
    log "🎉 Déploiement réussi !"
    
    # Informations de connexion
    log "📋 Informations de déploiement isolé:"
    info "Application: http://$(curl -s ifconfig.me):${APP_PORT}"
    info "Nginx: http://$(curl -s ifconfig.me):8080"
    info "MySQL (interne): localhost:3307"
    info "Répertoire: $APP_DIR"
    info "Logs: /var/log/${APP_NAME}-${APP_PORT}/"
    
    # Afficher les conteneurs
    log "📊 Conteneurs actifs:"
    docker-compose -f docker-compose.prod.yml ps
    
else
    error "❌ Échec du déploiement"
    
    log "📝 Logs des services:"
    docker-compose -f docker-compose.prod.yml logs --tail=50
    
    exit 1
fi

# Nettoyage final
log "🧹 Nettoyage final..."
docker image prune -f

log "✅ Déploiement isolé terminé avec succès!"
log "🔗 Votre application est accessible sur:"
info "   - Direct: http://$(curl -s ifconfig.me):${APP_PORT}"
info "   - Via Nginx: http://$(curl -s ifconfig.me):8080"

# Log du déploiement
echo "[$(date)] Déploiement isolé réussi sur port ${APP_PORT}" >> $LOG_FILE
