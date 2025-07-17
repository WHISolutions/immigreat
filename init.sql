-- Script d'initialisation pour la base de données MySQL
-- Ce fichier sera exécuté automatiquement lors du premier démarrage du conteneur MySQL

-- Créer la base de données si elle n'existe pas
CREATE DATABASE IF NOT EXISTS immigration_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Créer l'utilisateur si il n'existe pas
CREATE USER IF NOT EXISTS 'immigreat_user'@'%' IDENTIFIED BY 'immigreat_secure_password_2024';

-- Accorder tous les privilèges sur la base de données
GRANT ALL PRIVILEGES ON immigration_production.* TO 'immigreat_user'@'%';

-- Actualiser les privilèges
FLUSH PRIVILEGES;

-- Message de confirmation
SELECT 'Base de données initialisée avec succès !' as message;
