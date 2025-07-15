# Sécurisation de l'accès aux leads par conseiller

## Résumé des modifications

Ce document décrit les modifications apportées pour sécuriser l'accès aux leads, garantissant que chaque conseiller ne peut accéder qu'à ses propres leads.

## Modifications apportées

### 1. Middleware de vérification d'accès (`leads-temp.js`)

**Fichier**: `backend/routes/leads-temp.js`

- **Amélioration du middleware `checkLeadAccess`**:
  - Authentification obligatoire (plus d'accès anonyme)
  - Vérification basée principalement sur `conseiller_id` (clé étrangère)
  - Fallback sur le champ `conseillere` pour la compatibilité
  - Messages de log détaillés pour le debugging

- **Mise à jour des routes**:
  - Remplacement de `optionalAuth` par `authenticate` sur toutes les routes
  - Application du middleware `checkLeadAccess` sur toutes les routes d'accès individuel
  - Protection de la route d'assignation (admin seulement)

### 2. Contrôleur principal (`lead.controller.js`)

**Fichier**: `backend/controllers/lead.controller.js`

- **Nouvelle fonction helper `checkConseillerAccess`**:
  - Centralise la logique de vérification d'accès
  - Supporte les administrateurs (accès total) et conseillers (accès filtré)

- **Modifications des méthodes**:
  - `getAllLeads`: Filtrage automatique par conseiller
  - `getLeadById`: Vérification d'accès avant retour
  - `updateLead`: Vérification d'accès avant modification
  - `deleteLead`: Vérification d'accès avant suppression

### 3. Routes alternatives (`lead.routes.js`)

**Fichier**: `backend/routes/lead.routes.js`

- Ajout du middleware `authenticate` sur toutes les routes
- Les contrôleurs utilisés incluent déjà la logique de sécurité

## Logique de sécurité

### Pour les conseillers (`role = 'conseillere'`)

Un conseiller peut accéder à un lead si :
1. `lead.conseiller_id === user.id` (priorité - clé étrangère)
2. OU si `conseiller_id` est null ET `conseillere` correspond au nom complet
3. OU si le lead n'est assigné à personne (`conseiller_id` null et `conseillere` vide/null)

### Pour les autres rôles

- **Administrateurs** (`admin`): Accès total à tous les leads
- **Secrétaires** (`secretaire`): Accès total à tous les leads
- **Comptables** (`comptable`): Accès total à tous les leads

## Codes d'erreur

- **401 Unauthorized**: Authentification requise
- **403 Forbidden**: Accès refusé (lead assigné à un autre conseiller)
- **404 Not Found**: Lead inexistant

## Structure des données

### Modèle Lead

```javascript
{
  id: INTEGER,
  conseiller_id: INTEGER, // Clé étrangère vers users.id (priorité)
  conseillere: STRING,    // Nom complet du conseiller (legacy)
  // ... autres champs
}
```

### Réponses d'erreur

```javascript
// Accès refusé
{
  "success": false,
  "message": "Accès refusé: vous ne pouvez accéder qu'à vos propres leads"
}

// Authentification requise
{
  "success": false,
  "message": "Authentification requise"
}
```

## Tests de sécurité

Un script de test a été créé : `backend/test-lead-security.js`

**Pour exécuter les tests** :
```bash
cd backend
node test-lead-security.js
```

**Le script teste** :
- Connexion des différents types d'utilisateurs
- Accès autorisé pour le propriétaire du lead
- Accès refusé pour les autres conseillers
- Accès total pour les administrateurs
- Filtrage correct de la liste des leads
- Refus d'accès sans authentification

## Recommandations

### Migration des données
Il est recommandé de migrer progressivement les leads existants pour utiliser `conseiller_id` au lieu de `conseillere` :

```sql
UPDATE leads 
SET conseiller_id = (
  SELECT id FROM users 
  WHERE CONCAT(prenom, ' ', nom) = leads.conseillere 
  AND role IN ('admin', 'conseillere')
) 
WHERE conseiller_id IS NULL AND conseillere IS NOT NULL;
```

### Monitoring
Surveillez les logs pour identifier :
- Les tentatives d'accès non autorisé (🚫)
- Les accès autorisés (✅)
- Les erreurs de vérification d'accès

### Performance
Pour de grandes bases de données, ajoutez un index sur `conseiller_id` :

```sql
CREATE INDEX idx_leads_conseiller_id ON leads(conseiller_id);
```

## Compatibilité

Ces modifications maintiennent la compatibilité avec :
- Les leads existants utilisant le champ `conseillere`
- Les clients frontend existants
- Les autres parties du système

La transition vers `conseiller_id` peut être faite progressivement sans impact sur les fonctionnalités existantes.
