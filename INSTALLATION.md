# Guide d'installation de l'application ImmiPro

Ce guide vous aidera à installer et configurer l'application ImmiPro pour la gestion des dossiers d'immigration.

## Prérequis

- Node.js (v14 ou supérieur)
- npm (v6 ou supérieur)
- MongoDB (v4.4 ou supérieur)

## Structure du package

Le package d'installation contient les éléments suivants :
- `/frontend` : Application React pour l'interface utilisateur
- `/backend` : API Node.js/Express pour le serveur
- `/screenshots` : Captures d'écran de l'application
- `/tests` : Tests automatisés
- Fichiers de documentation (*.md)

## Installation du backend

1. Ouvrez un terminal et naviguez vers le dossier backend :
   ```
   cd immigration-app-v5/backend
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Configurez la base de données :
   - Créez un fichier `.env` dans le dossier backend
   - Ajoutez les variables d'environnement suivantes :
     ```
     PORT=5000
     MONGO_URI=mongodb://localhost:27017/immigration-app
     JWT_SECRET=votre_clé_secrète
     ```

4. Démarrez le serveur :
   ```
   npm start
   ```
   Le serveur devrait démarrer sur le port 5000.

## Installation du frontend

1. Ouvrez un nouveau terminal et naviguez vers le dossier frontend :
   ```
   cd immigration-app-v5/frontend
   ```

2. Installez les dépendances :
   ```
   npm install
   ```

3. Configurez l'URL de l'API :
   - Ouvrez le fichier `src/config.js`
   - Vérifiez que l'URL de l'API pointe vers votre serveur backend :
     ```javascript
     export const API_URL = 'http://localhost:5000/api';
     ```

4. Démarrez l'application :
   ```
   npm start
   ```
   L'application devrait s'ouvrir automatiquement dans votre navigateur à l'adresse http://localhost:3000.

## Configuration des utilisateurs

Par défaut, un compte administrateur est créé avec les identifiants suivants :
- Email : admin@immipro.com
- Mot de passe : admin123

Connectez-vous avec ce compte pour créer d'autres utilisateurs avec différents rôles (conseillère, secrétaire, comptable).

## Déploiement en production

Pour un déploiement en production :

1. Construisez la version de production du frontend :
   ```
   cd immigration-app-v5/frontend
   npm run build
   ```

2. Configurez un serveur web (comme Nginx ou Apache) pour servir les fichiers statiques du dossier `build`.

3. Configurez le backend avec les variables d'environnement appropriées pour la production.

4. Utilisez un gestionnaire de processus comme PM2 pour exécuter le backend :
   ```
   npm install -g pm2
   cd immigration-app-v5/backend
   pm2 start server.js
   ```

## Support

Si vous rencontrez des problèmes lors de l'installation ou de l'utilisation de l'application, veuillez consulter la documentation ou contacter notre équipe de support.
