# Système de Filtrage par Utilisateur

## 📋 Vue d'ensemble

Le système de filtrage par utilisateur a été implémenté pour assurer que chaque conseiller ne voit que les données qui lui sont associées lorsqu'il se connecte à son compte. Les administrateurs et autres rôles continuent de voir toutes les données.

## 🔐 Authentification et Autorisation

### Middleware d'authentification
- Utilise `optionalAuth` pour permettre l'accès même sans authentification
- Les utilisateurs non authentifiés voient toutes les données (comportement par défaut)
- Les utilisateurs authentifiés voient des données filtrées selon leur rôle

### Rôles et permissions
- **Admin** : Voit toutes les données (pas de filtrage)
- **Conseillère** : Ne voit que ses propres données
- **Secrétaire/Comptable** : Voit toutes les données (pas de filtrage)

## 🎯 APIs Modifiées

### 1. Route Leads (`/api/leads`)
**Fichier**: `backend/routes/leads-temp.js`

**Filtrage pour conseillers** :
```javascript
whereConditions = {
  conseillere: {
    [Op.in]: [
      fullName,              // "chaouby wafaa"
      fullName.toLowerCase(), // "chaouby wafaa"
      user.nom,              // "chaouby"
      user.prenom,           // "wafaa"
      ''                     // Leads sans conseillère assignée
    ]
  }
};
```

**Résultat** :
- Admin/Non-auth : 17 leads
- Conseillère (wafaa) : 7 leads filtrés

### 2. Route Clients (`/api/clients`)
**Fichier**: `backend/routes/clients-temp.js`

**Filtrage identique** au système leads sur le champ `conseillere`

**Résultat** :
- Admin/Non-auth : 30 clients
- Conseillère (wafaa) : 10 clients filtrés

### 3. Routes Dashboard (`/api/dashboard/*`)
**Fichier**: `backend/routes/dashboard.js`

#### `/ventes-conseilleres`
- **Conseillers** : Ne voient que leurs propres ventes
- **Autres rôles** : Voient toutes les ventes

#### `/stats`
- Filtre les statistiques (clients, leads, factures) selon l'utilisateur connecté
- Utilise la fonction `addUserFilter()` pour appliquer le filtrage de manière cohérente

#### `/mes-ventes`
- Route existante qui demande explicitement le paramètre `conseillere`

## 📊 Exemple de Test

### Test avec Conseillère wafaa@gmail.com
```
👤 Utilisateur: chaouby wafaa
🔑 Rôle: conseillere
📧 Email: wafaa@gmail.com

📊 Résultats filtrés:
- Leads: 7/17 (filtré par: chaouby wafaa)
- Clients: 10/30 (filtré par: chaouby wafaa) 
- Dashboard: 0 ventes visibles
```

### Test avec Admin (mock-token)
```
👤 Utilisateur: Admin
🔑 Rôle: admin

📊 Résultats complets:
- Leads: 17/17 (filtré par: Tous)
- Clients: 30/30 (filtré par: Tous)
- Dashboard: 2 conseillers avec ventes
```

## 🔧 Modifications Techniques

### 1. Authentification ajoutée
```javascript
const { authenticate, optionalAuth } = require('../middleware/auth');

// Routes modifiées avec optionalAuth
router.get('/', optionalAuth, async (req, res) => {
  const user = req.user;
  // ...
});
```

### 2. Suppression des validations hardcodées
- **Lead Model** : Supprimé la validation `isIn` pour le champ `conseillere`
- **Client Model** : Supprimé la validation `isIn` pour le champ `conseillere`

### 3. Filtrage conditionnel
```javascript
let whereConditions = {};

if (user && user.role === 'conseillere') {
  const fullName = `${user.nom} ${user.prenom}`;
  whereConditions = {
    conseillere: {
      [Op.in]: [fullName, fullName.toLowerCase(), user.nom, user.prenom, '']
    }
  };
}
```

## 📈 Réponses API Enrichies

Toutes les réponses incluent maintenant un champ `filteredBy` :
```json
{
  "success": true,
  "data": {
    "leads": [...],
    "count": 7,
    "filteredBy": "chaouby wafaa"
  }
}
```

## ✅ Fonctionnalités Validées

1. **Authentification** : Connexion et récupération de l'utilisateur ✅
2. **Filtrage Leads** : Conseillers ne voient que leurs leads ✅
3. **Filtrage Clients** : Conseillers ne voient que leurs clients ✅
4. **Filtrage Dashboard** : Ventes filtrées par conseiller ✅
5. **Statistiques** : Stats filtrées par utilisateur ✅
6. **Permissions** : Admins voient tout, conseillers filtré ✅

## 🚨 Points d'attention

### Inclusion des données "Non assignées"
Le filtrage inclut actuellement les leads/clients sans conseillère assignée (`''`). 
Cela peut être modifié selon les besoins métier :

```javascript
// Pour exclure les données non assignées :
whereConditions = {
  conseillere: {
    [Op.in]: [fullName, fullName.toLowerCase(), user.nom, user.prenom]
    // Retirer: ''
  }
};
```

### Correspondance des noms
Le système compare plusieurs variations du nom :
- Nom complet : "chaouby wafaa"
- Nom seul : "chaouby"  
- Prénom seul : "wafaa"
- Version minuscule : "chaouby wafaa"

## 🔮 Améliorations futures

1. **Cache** : Mettre en cache les permissions utilisateur
2. **Logs** : Tracer les accès aux données sensibles
3. **Interface** : Indicateur visuel du filtrage actif
4. **Tests automatisés** : Suite de tests pour tous les scénarios

## 🎯 Utilisation

Le système est **automatiquement actif**. Quand un conseiller se connecte :

1. **Frontend** : Stocke le token dans localStorage
2. **Backend** : Identifie l'utilisateur via le token
3. **Filtrage** : Applique automatiquement les restrictions
4. **Réponses** : Retourne uniquement les données autorisées

**Résultat** : Chaque conseiller ne voit que ses propres leads, clients et ventes ! 🎉 