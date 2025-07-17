#!/bin/bash

# Script de déploiement direct (sans Docker)
# Usage: ./deploy-direct.sh

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
BACKEND_DIR="$APP_DIR/backend"

log "🚀 Déploiement de l'application Immigreat (mode direct)"

# Vérifier que l'utilisateur root ou sudo
if [[ $EUID -ne 0 ]]; then
    error "Ce script doit être exécuté en tant que root ou avec sudo"
    exit 1
fi

# Aller dans le répertoire de l'application
cd $APP_DIR

# Arrêter l'application si elle tourne
log "🛑 Arrêt de l'application..."
sudo -u $APP_USER pm2 stop immigreat-app || true

# Mise à jour du code source
log "📥 Mise à jour du code source..."
if [ -d ".git" ]; then
    sudo -u $APP_USER git pull origin main
else
    warning "Repository Git non initialisé. Assurez-vous que le code est à jour."
fi

# Installation des dépendances
log "📦 Installation des dépendances..."
cd $BACKEND_DIR
sudo -u $APP_USER npm install --production

# Sauvegarde de la base de données
log "💾 Sauvegarde de la base de données..."
mkdir -p $APP_DIR/backups
mysqldump -u immigreat_user -p immigration_production > $APP_DIR/backups/backup_$(date +%Y%m%d_%H%M%S).sql || warning "Sauvegarde échouée"

# Exécution des migrations
log "🔄 Exécution des migrations..."
cd $BACKEND_DIR
sudo -u $APP_USER npm run migrate || warning "Pas de migrations à exécuter"

# Configuration PM2
log "⚙️ Configuration PM2..."
sudo -u $APP_USER pm2 delete immigreat-app || true

# Créer le fichier ecosystem PM2
cat > $APP_DIR/ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'immigreat-app',
    script: 'backend/server.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/immigreat/error.log',
    out_file: '/var/log/immigreat/out.log',
    log_file: '/var/log/immigreat/combined.log',
    time: true
  }]
};
EOF

chown $APP_USER:www-data $APP_DIR/ecosystem.config.js

# Démarrer l'application avec PM2
log "🌟 Démarrage de l'application..."
cd $APP_DIR
sudo -u $APP_USER pm2 start ecosystem.config.js

# Sauvegarder la configuration PM2
sudo -u $APP_USER pm2 save
sudo -u $APP_USER pm2 startup | grep -E '^sudo.*pm2' | sudo bash || true

# Test de santé
log "🏥 Test de santé de l'application..."
sleep 10
if curl -f http://localhost:3000/ > /dev/null 2>&1; then
    log "✅ Application opérationnelle"
else
    error "❌ Application ne répond pas"
    sudo -u $APP_USER pm2 logs immigreat-app --lines 20
    exit 1
fi

# Configuration Nginx
log "🌐 Configuration Nginx..."
cat > /etc/nginx/sites-available/immigreat << 'EOF'
server {
    listen 80;
    server_name _;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    location / {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Servir les fichiers statiques
    location /uploads/ {
        alias $APP_DIR/backend/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}
EOF

# Activer le site Nginx
ln -sf /etc/nginx/sites-available/immigreat /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester et redémarrer Nginx
nginx -t && systemctl reload nginx

# Informations finales
log "🎉 Déploiement terminé avec succès !"
log "📋 Informations:"
info "Application: http://$(curl -s ifconfig.me)/"
info "Logs PM2: pm2 logs immigreat-app"
info "Status PM2: pm2 status"
info "Redémarrer: pm2 restart immigreat-app"

log "🛠️ Commandes utiles:"
info "Voir les logs: tail -f /var/log/immigreat/combined.log"
info "Status Nginx: systemctl status nginx"
info "Status MySQL: systemctl status mysql"
info "PM2 monitoring: pm2 monit"
