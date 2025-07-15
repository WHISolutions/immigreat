# Guide de Préparation pour la Production

Ce guide vous explique comment préparer votre application d'immigration pour la mise en production en supprimant les utilisateurs de test et en optimisant la configuration.

## 🎯 Objectifs

- Supprimer tous les utilisateurs de test/démonstration
- Désactiver les routes de développement
- Nettoyer les fichiers temporaires
- Vérifier la configuration pour la production

## 📋 Utilisateurs de Test Identifiés

Les utilisateurs suivants sont des comptes de test créés pour le développement :

1. **admin@immigration.ca** - Admin Système (mot de passe: admin123)
2. **marie.tremblay@immigration.ca** - Marie Tremblay, Conseillère (mot de passe: conseillere123)
3. **sophie.martin@immigration.ca** - Sophie Martin, Conseillère (mot de passe: conseillere123)
4. **julie.dupont@immigration.ca** - Julie Dupont, Secrétaire (mot de passe: secretaire123)
5. **pierre.lavoie@immigration.ca** - Pierre Lavoie, Comptable (mot de passe: comptable123)

## 🛠️ Scripts Disponibles

### 1. Script Principal de Préparation

```bash
cd backend
node prepare-production.js
```

Ce script exécute automatiquement toutes les étapes de préparation.

### 2. Scripts Individuels

#### Gestion des Utilisateurs

```bash
# Lister tous les utilisateurs (test et réels)
node cleanup-test-users.js list

# Processus interactif complet de nettoyage
node cleanup-test-users.js

# Supprimer uniquement les utilisateurs de test
node cleanup-test-users.js delete

# Créer un nouvel administrateur de production
node cleanup-test-users.js create-admin
```

#### Gestion des Routes de Test

```bash
# Désactiver les routes de test
node disable-test-routes.js disable

# Réactiver les routes de test (pour développement)
node disable-test-routes.js enable

# Voir l'état actuel des routes
node disable-test-routes.js status
```

## 📝 Procédure Recommandée

### Étape 1: Sauvegarde

```bash
# Sauvegarder votre base de données
mysqldump -u votre_user -p votre_base > backup_avant_production.sql
```

### Étape 2: Vérifier les Utilisateurs Actuels

```bash
node cleanup-test-users.js list
```

Cette commande affichera :
- Les utilisateurs de test à supprimer
- Les utilisateurs réels à conserver

### Étape 3: Créer un Administrateur de Production (si nécessaire)

Si vous n'avez pas encore d'administrateur réel :

```bash
node cleanup-test-users.js create-admin
```

### Étape 4: Exécuter la Préparation Complète

```bash
node prepare-production.js
```

Ce script va :
1. Lister les utilisateurs actuels
2. Supprimer les utilisateurs de test
3. Désactiver les routes de test
4. Nettoyer les fichiers temporaires
5. Vérifier la configuration
6. Générer un rapport de préparation

## ⚠️ Points d'Attention

### Avant de Supprimer les Utilisateurs de Test

1. **Assurez-vous d'avoir au moins un administrateur réel**
   - Si vous n'en avez pas, utilisez `node cleanup-test-users.js create-admin`

2. **Vérifiez les données liées**
   - Les factures, clients, leads créés par les utilisateurs de test seront conservés
   - Seuls les comptes utilisateurs seront supprimés

3. **Testez la connexion**
   - Vérifiez que vous pouvez vous connecter avec votre compte administrateur réel

### Configuration de Production Requise

```bash
# Variables d'environnement importantes
NODE_ENV=production
DB_HOST=votre_serveur_mysql
DB_NAME=votre_base_production  
DB_USER=votre_utilisateur_mysql
DB_PASSWORD=votre_mot_de_passe_mysql
JWT_SECRET=votre_secret_jwt_très_sécurisé
```

## 🔄 Annulation/Récupération

### Réactiver les Routes de Test

```bash
node disable-test-routes.js enable
```

### Restaurer les Utilisateurs de Test

Si vous avez une sauvegarde :

```bash
mysql -u votre_user -p votre_base < backup_avant_production.sql
```

Ou recréer manuellement avec :

```bash
# Dans le répertoire backend
npm run db:seed  # Si vous avez des seeders configurés
```

## 📊 Vérification Post-Déploiement

### 1. Connexion Administrateur
- Testez la connexion avec votre compte administrateur de production
- Vérifiez que tous les menus sont accessibles

### 2. Fonctionnalités Principales
- Création de leads/clients
- Gestion des documents
- Génération de factures
- Rapports

### 3. Routes de Test Inaccessibles
- Vérifiez que `/api/test-users` retourne une erreur 404

## 📞 Support

Si vous rencontrez des problèmes :

1. Consultez le fichier `production-preparation-report.txt` généré
2. Vérifiez les logs du serveur
3. Assurez-vous que toutes les variables d'environnement sont configurées

## 🚀 Déploiement

Une fois la préparation terminée :

1. Déployez votre code sur le serveur de production
2. Configurez les variables d'environnement
3. Démarrez l'application avec `NODE_ENV=production`
4. Configurez HTTPS
5. Mettez en place des sauvegardes automatiques

---

**Important** : Ce guide suppose que vous utilisez MySQL en production. Adaptez les commandes selon votre configuration de base de données. 