#!/bin/bash

# Script de déploiement Docker pour l'application Immigreat
# Usage: ./deploy.sh [dev|prod]

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction de log
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
ENV=${1:-dev}
COMPOSE_FILE="docker-compose.yml"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé !"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose n'est pas installé !"
    exit 1
fi

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    warning "Fichier .env non trouvé. Copie du fichier .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        warning "⚠️  IMPORTANT: Modifiez le fichier .env avec vos vraies valeurs avant de continuer !"
        warning "Notamment les mots de passe et les secrets JWT !"
        read -p "Appuyez sur Entrée quand c'est fait..."
    else
        error "Fichier .env.example non trouvé !"
        exit 1
    fi
fi

log "🚀 Démarrage du déploiement en mode $ENV"

# Arrêter les conteneurs existants
log "🛑 Arrêt des conteneurs existants..."
docker-compose down || docker compose down || true

# Nettoyer les images non utilisées (optionnel)
if [ "$ENV" = "prod" ]; then
    log "🧹 Nettoyage des images non utilisées..."
    docker system prune -f
fi

# Construire les images
log "🔨 Construction de l'image de l'application..."
docker-compose build --no-cache app || docker compose build --no-cache app

# Démarrer les services
log "🌟 Démarrage des services..."
if [ "$ENV" = "prod" ]; then
    docker-compose up -d || docker compose up -d
else
    docker-compose up -d db || docker compose up -d db
    log "⏳ Attente que MySQL soit prêt..."
    sleep 15
    docker-compose up -d app || docker compose up -d app
fi

# Attendre que les services soient prêts
log "⏳ Vérification que les services sont prêts..."
sleep 10

# Vérifier le statut des conteneurs
log "📊 Statut des conteneurs:"
docker-compose ps || docker compose ps

# Vérifier les logs pour détecter les erreurs
log "🔍 Vérification des logs..."
if docker-compose logs app 2>&1 | grep -i error; then
    warning "Des erreurs ont été détectées dans les logs de l'application"
fi

# Test de santé
log "🏥 Test de santé de l'application..."
sleep 5
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    log "✅ Application accessible sur http://localhost:3000"
else
    warning "⚠️  L'application ne répond pas encore, vérifiez les logs"
fi

# Afficher les informations de connexion
log "📋 Informations de connexion:"
info "Application: http://localhost:3000"
info "Base de données: localhost:3306"
info "Nom de la BDD: $(grep DB_NAME .env | cut -d '=' -f2)"

# Afficher les commandes utiles
log "🛠️  Commandes utiles:"
info "Voir les logs de l'app: docker-compose logs -f app"
info "Voir les logs de la BDD: docker-compose logs -f db"
info "Arrêter les services: docker-compose down"
info "Redémarrer l'app: docker-compose restart app"

log "🎉 Déploiement terminé !"

# En mode dev, suivre les logs
if [ "$ENV" = "dev" ]; then
    log "📝 Suivi des logs en temps réel (Ctrl+C pour quitter):"
    docker-compose logs -f app
fi
