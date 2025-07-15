# 📋 Système de Journaux d'Activité

## 🎯 Objectif

Le système de journaux d'activité permet de tracer toutes les actions effectuées par les utilisateurs dans l'application. Il enregistre automatiquement les créations, modifications et suppressions d'entités (clients, leads, utilisateurs) avec un historique complet des changements.

## 🏗️ Architecture

### Backend

1. **Modèle ActivityLog** (`backend/models/activity-log.model.js`)
   - Table `activity_logs` avec les champs :
     - `id` : Identifiant unique
     - `utilisateur_id` : Référence vers l'utilisateur
     - `action` : Type d'action (create_client, update_client, etc.)
     - `entite` : Type d'entité modifiée (Client, Lead, User)
     - `entite_id` : ID de l'entité modifiée
     - `anciennes_valeurs` : Valeurs avant modification (JSON)
     - `nouvelles_valeurs` : Valeurs après modification (JSON)
     - `adresse_ip` : Adresse IP de l'utilisateur
     - `user_agent` : User agent du navigateur
     - `date_action` : Date et heure de l'action

2. **Routes API** (`backend/routes/logs.js`)
   - `GET /api/logs` : Récupérer les logs avec pagination et filtres
   - `GET /api/logs/actions` : Liste des actions disponibles
   - `GET /api/logs/entites` : Liste des entités disponibles
   - `GET /api/logs/export` : Export CSV des logs

3. **Middleware d'activité** (`backend/middleware/activity-logger.js`)
   - `logActivity()` : Fonction pour enregistrer une activité
   - `logMiddleware()` : Middleware Express automatique
   - `logCustomActivity()` : Pour les logs personnalisés

### Frontend

1. **Composant React** (`frontend/src/components/JournalActivite.tsx`)
   - Interface utilisateur complète
   - Filtres par action, entité et dates
   - Pagination avec navigation
   - Export CSV
   - Détails expandables des modifications

2. **Styles CSS** (`frontend/src/styles/JournalActivite.css`)
   - Design responsive
   - Tableaux stylisés
   - Codes couleur par type d'action

## 🔧 Installation et Configuration

### 1. Initialisation automatique

Exécutez le script de setup :
```bash
./setup-activity-logs.bat
```

### 2. Initialisation manuelle

```bash
# Backend - Initialiser la base de données
cd backend
node init-activity-logs.js

# Tester le système
node test-activity-logs.js

# Créer des logs de démonstration
node create-test-logs.js
```

### 3. Vérification

1. Démarrez le backend : `npm run dev`
2. Démarrez le frontend : `npm start`
3. Connectez-vous en tant qu'administrateur
4. Accédez à "Journaux d'activité"

## 🚀 Utilisation

### Accès à la page

La page "Journaux d'activité" est accessible uniquement aux **administrateurs** via le menu de navigation principal.

### Fonctionnalités disponibles

#### 1. **Consultation des logs**
- Affichage chronologique des actions
- Informations utilisateur complètes
- Détails des entités modifiées

#### 2. **Filtrage avancé**
- **Par action** : create_client, update_client, delete_client, etc.
- **Par entité** : Client, Lead, User
- **Par période** : Date début et date fin
- **Réinitialisation** : Bouton pour effacer tous les filtres

#### 3. **Pagination**
- Navigation par pages
- Contrôle du nombre d'éléments par page
- Informations de pagination

#### 4. **Détails des modifications**
- Clic sur "Détails" pour voir les changements
- Comparaison avant/après
- Format JSON lisible

#### 5. **Export CSV**
- Export de tous les logs visibles
- Nom de fichier avec date automatique
- Format compatible Excel

## 🔍 Types d'actions trackées

### Actions automatiques
- `create_client` : Création d'un nouveau client
- `update_client` : Modification d'un client existant
- `delete_client` : Suppression d'un client
- `create_lead` : Création d'un nouveau lead
- `update_lead` : Modification d'un lead existant
- `delete_lead` : Suppression d'un lead
- `login` : Connexion utilisateur
- `logout` : Déconnexion utilisateur

### Actions personnalisées
Vous pouvez ajouter des logs personnalisés dans votre code :

```javascript
const { logActivity } = require('../middleware/activity-logger');

// Dans une route ou fonction
await logActivity(
  'custom_action',           // Action
  'CustomEntity',           // Entité
  entityId,                // ID de l'entité
  oldValues,               // Anciennes valeurs (optionnel)
  newValues,               // Nouvelles valeurs (optionnel)
  req                      // Objet request Express
);
```

## 🎨 Interface utilisateur

### Codes couleur
- **Création** (create) : Vert - Nouvelles entrées
- **Modification** (update) : Bleu - Changements
- **Suppression** (delete) : Rouge - Suppressions
- **Connexion** (login) : Jaune - Authentification
- **Déconnexion** (logout) : Gris - Fin de session

### Responsive Design
- Adaptation automatique mobile/tablette
- Tableaux scrollables horizontalement
- Filtres empilés sur petits écrans

## 🔒 Sécurité et Permissions

### Contrôle d'accès
- **Administrateurs uniquement** : Accès complet aux logs
- **Autres rôles** : Accès refusé avec redirection
- **Authentification requise** : Token JWT obligatoire

### Protection des données
- **Pas de mots de passe** : Les mots de passe ne sont jamais loggés
- **Données sensibles** : Possibilité d'exclure certains champs
- **Anonymisation** : IP et user agent stockés mais non obligatoires

## 📊 Maintenance et Performance

### Optimisations
- **Index de base de données** : Sur utilisateur_id, action, entité, date
- **Pagination** : Limite de 50 entrées par page par défaut
- **Filtrage côté serveur** : Réduction du trafic réseau

### Maintenance recommandée
```sql
-- Nettoyer les logs anciens (exemple : plus de 1 an)
DELETE FROM activity_logs 
WHERE date_action < DATE('now', '-1 year');

-- Optimiser la base de données
VACUUM;
```

### Monitoring
- Vérifiez régulièrement la taille de la table `activity_logs`
- Surveillez les performances des requêtes de logs
- Ajustez les index selon les patterns d'utilisation

## 🚨 Dépannage

### Problèmes courants

1. **Page vide ou erreur 403**
   - Vérifiez que l'utilisateur est administrateur
   - Contrôlez le token d'authentification

2. **Pas de logs affichés**
   - Vérifiez que la table `activity_logs` existe
   - Créez des logs de test avec `create-test-logs.js`

3. **Erreur de base de données**
   - Exécutez `init-activity-logs.js` pour recréer la structure
   - Vérifiez les associations dans `models/index.js`

4. **Export CSV vide**
   - Vérifiez les permissions d'écriture
   - Testez avec un petit nombre de logs

### Logs de débogage
Activez les logs détaillés en ajoutant dans votre `.env` :
```
DEBUG=activity-logs
LOG_LEVEL=debug
```

## 🔮 Extensions possibles

### Fonctionnalités avancées
- **Restauration** : Annuler des modifications depuis les logs
- **Notifications** : Alertes sur actions critiques
- **Tableau de bord** : Statistiques d'utilisation
- **Audit complet** : Logs système et applicatifs
- **Recherche textuelle** : Recherche dans les valeurs JSON

### Intégrations
- **Webhook** : Notification externe des actions critiques
- **SIEM** : Export vers des systèmes de sécurité
- **BI** : Analyse des données d'usage
- **Backup** : Archivage automatique des logs anciens

---

## 📞 Support

En cas de problème :
1. Consultez les logs du serveur
2. Exécutez les scripts de test
3. Vérifiez la documentation technique
4. Contactez l'équipe de développement

**Date de création** : 9 juillet 2025  
**Version** : 1.0.0  
**Compatibilité** : Node.js 16+, React 18+
