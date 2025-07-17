# Dockerfile pour l'application Node.js
FROM node:18-alpine

# Créer le répertoire de l'application
WORKDIR /usr/src/app

# Copier les fichiers package.json et package-lock.json
COPY backend/package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source de l'application
COPY backend/ .

# Créer le répertoire uploads pour les fichiers uploadés
RUN mkdir -p uploads

# Exposer le port de l'application
EXPOSE 4000

# Script de démarrage qui attend que MySQL soit prêt
COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Commande de démarrage
CMD ["sh", "-c", "wait-for-it.sh db:3306 --timeout=60 --strict -- npm run prod"]
