#!/bin/bash

# Script de déploiement pour VPS production
# Usage: ./deploy-vps.sh

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
BACKUP_DIR="/opt/immigreat/backups"
LOG_FILE="/var/log/immigreat/deploy.log"

# Fonction de sauvegarde
backup_database() {
    log "💾 Sauvegarde de la base de données..."
    mkdir -p $BACKUP_DIR
    
    if docker-compose ps | grep -q "immigreat_mysql"; then
        BACKUP_FILE="$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql"
        docker-compose exec -T db mysqldump -u root -p${DB_ROOT_PASSWORD} immigration_production > $BACKUP_FILE
        log "✅ Sauvegarde créée: $BACKUP_FILE"
        
        # Garder seulement les 5 dernières sauvegardes
        ls -t $BACKUP_DIR/backup_*.sql | tail -n +6 | xargs -r rm
    else
        warning "Base de données non trouvée, sauvegarde ignorée"
    fi
}

# Vérification des prérequis
check_prerequisites() {
    log "🔍 Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        error "Fichier .env non trouvé"
        exit 1
    fi
    
    log "✅ Prérequis vérifiés"
}

# Chargement des variables d'environnement
load_env() {
    log "📄 Chargement des variables d'environnement..."
    set -a
    source .env
    set +a
}

log "🚀 Démarrage du déploiement en production"

# Aller dans le répertoire de l'application
cd $APP_DIR

# Vérifications
check_prerequisites
load_env

# Sauvegarde avant déploiement
backup_database

# Mise à jour du code source
log "📥 Mise à jour du code source..."
if [ -d ".git" ]; then
    git pull origin main
    log "✅ Code source mis à jour"
else
    warning "Repository Git non initialisé"
fi

# Arrêt des services existants
log "🛑 Arrêt des services existants..."
docker-compose down || true

# Nettoyage des images non utilisées
log "🧹 Nettoyage des images Docker..."
docker system prune -f

# Construction des nouvelles images
log "🔨 Construction des images..."
docker-compose build --no-cache --pull

# Démarrage des services
log "🌟 Démarrage des services..."
docker-compose up -d

# Attente que les services soient prêts
log "⏳ Vérification de l'état des services..."
sleep 30

# Vérification de la santé des services
check_health() {
    log "🏥 Vérification de la santé des services..."
    
    # Vérifier MySQL
    if docker-compose exec -T db mysqladmin ping -h localhost --silent; then
        log "✅ MySQL opérationnel"
    else
        error "❌ MySQL ne répond pas"
        return 1
    fi
    
    # Vérifier l'application
    sleep 10
    if curl -f http://localhost:3000/ > /dev/null 2>&1; then
        log "✅ Application opérationnelle"
    else
        error "❌ Application ne répond pas"
        return 1
    fi
}

# Migration de la base de données (si nécessaire)
run_migrations() {
    log "🔄 Exécution des migrations..."
    if docker-compose exec -T app npm run migrate > /dev/null 2>&1; then
        log "✅ Migrations exécutées avec succès"
    else
        warning "⚠️ Pas de migrations à exécuter ou erreur"
    fi
}

# Test de santé
if check_health; then
    log "🎉 Déploiement réussi !"
    
    # Exécuter les migrations
    run_migrations
    
    # Informations de connexion
    log "📋 Informations de déploiement:"
    info "Application: http://$(curl -s ifconfig.me):3000"
    info "Status: $(docker-compose ps --format table)"
    
    # Logs des dernières erreurs
    error_count=$(docker-compose logs app 2>&1 | grep -i error | wc -l)
    if [ $error_count -gt 0 ]; then
        warning "⚠️ $error_count erreurs détectées dans les logs"
        docker-compose logs --tail=20 app | grep -i error
    fi
    
else
    error "❌ Échec du déploiement"
    
    log "📝 Logs des services:"
    docker-compose logs --tail=50
    
    # Rollback automatique
    warning "🔄 Tentative de rollback..."
    docker-compose down
    docker-compose up -d
    
    exit 1
fi

# Nettoyage final
log "🧹 Nettoyage final..."
docker image prune -f

log "✅ Déploiement terminé avec succès!"

# Log du déploiement
echo "[$(date)] Déploiement réussi" >> $LOG_FILE
