# Guide des Restrictions d'Accès aux Activités Récentes

## 📋 Vue d'ensemble

Ce guide explique comment les restrictions d'accès ont été implémentées pour la section "Mes Activités Récentes" selon les rôles des utilisateurs.

## 🔒 Règles d'Accès

### Conseillères
- ✅ **Voient uniquement leurs propres activités**
- ✅ Leads qu'elles ont créés ou qui leur sont assignés
- ✅ Clients qu'elles ont modifiés
- ✅ Factures qu'elles ont validées
- ✅ Rendez-vous qu'elles ont planifiés
- ❌ **Ne voient PAS les activités des autres conseillères**

### Administrateurs/Directeurs
- ✅ **Voient TOUTES les activités de toutes les conseillères**
- ✅ Accès complet à tous les journaux d'activité
- ✅ Capacité de filtrer par conseillère spécifique
- ✅ Accès aux rapports globaux

## 🛠️ Implémentation Technique

### Backend (API)

#### Route : `/api/dashboard/activites-recentes`
- **Authentification obligatoire** (`authenticate` middleware)
- **Filtrage automatique** selon le rôle de l'utilisateur

```javascript
// Exemple de filtrage pour les conseillères
${userRole === 'conseillere' ? 
  'AND (conseillere LIKE CONCAT(\'%\', :userName, \'%\') OR conseillere IS NULL OR conseillere = \'\')' : 
  ''}
```

#### Types d'Activités Filtrées

1. **Nouveaux Leads**
   ```sql
   SELECT * FROM leads 
   WHERE date_creation >= :dateDepuis
   AND (conseillere LIKE '%username%' OR conseillere IS NULL) -- Pour conseillères seulement
   ```

2. **Clients Mis à Jour**
   ```sql
   SELECT * FROM clients 
   WHERE date_modification >= :dateDepuis
   AND conseillere LIKE '%username%' -- Pour conseillères seulement
   ```

3. **Factures Créées/Payées**
   ```sql
   SELECT * FROM factures 
   WHERE dateEmission >= :dateDepuis
   AND validePar LIKE '%username%' -- Pour conseillères seulement
   ```

4. **Rendez-vous Planifiés**
   ```sql
   SELECT * FROM rendezvous 
   WHERE createdAt >= :dateDepuis
   AND conseillere_nom LIKE '%username%' -- Pour conseillères seulement
   ```

### Frontend

#### Service API
```javascript
export const getActivitesRecentes = async (limit = 10) => {
  const response = await fetch(`${API_BASE_URL}/dashboard/activites-recentes?limit=${limit}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}` // Token obligatoire
    }
  });
}
```

## 🔍 Validation et Tests

### Script d'Analyse
Un script d'analyse a été créé : `analyser-activite-suspecte.js`

```bash
# Exécuter l'analyse
node analyser-activite-suspecte.js
```

Le script vérifie :
- ✅ Distribution des activités par conseillère
- ✅ Cohérence des données assignées
- ✅ Détection des données orphelines
- ✅ Simulation des restrictions d'accès

### Tests à Effectuer

1. **Test Conseillère**
   - Se connecter avec un compte conseillère
   - Vérifier que seules ses propres activités apparaissent
   - Vérifier que l'utilisateur affiché est "Vous" pour ses activités

2. **Test Admin**
   - Se connecter avec un compte admin
   - Vérifier que toutes les activités de toutes les conseillères apparaissent
   - Vérifier l'affichage correct du nom de la conseillère responsable

3. **Test Sécurité**
   - Tester l'accès sans token → Doit être rejeté
   - Tester avec un token expiré → Doit être rejeté
   - Vérifier les logs d'accès dans les journaux d'activité

## 📊 Monitoring et Audit

### Logs d'Accès
Chaque requête aux activités récentes est loggée avec :
- Utilisateur connecté (rôle, nom)
- Nombre d'activités retournées
- Horodatage de la requête

### Métriques à Surveiller
- Nombre de requêtes par rôle d'utilisateur
- Activités consultées par conseillère
- Erreurs d'authentification

## 🚨 Points d'Attention

### Données Orphelines
- Leads sans conseillère assignée → Visibles par toutes les conseillères
- Clients sans conseillère → Visibles par toutes les conseillères
- Solution : Assigner automatiquement ou masquer ces données

### Performance
- Requêtes SQL avec LIKE peuvent être lentes sur de gros volumes
- Considérer l'indexation des champs `conseillere`, `validePar`, etc.
- Limiter la période d'activités récentes (actuellement 7 jours)

### Sécurité
- ✅ Token JWT obligatoire
- ✅ Validation du rôle côté serveur
- ✅ Filtrage SQL au niveau base de données
- ✅ Pas de fuite d'informations entre conseillères

## 🔧 Configuration

### Variables d'Environnement
```env
# Période par défaut pour les activités récentes (en jours)
ACTIVITES_RECENTES_PERIODE=7

# Limite par défaut du nombre d'activités
ACTIVITES_RECENTES_LIMITE=10
```

### Personnalisation
Pour modifier les règles d'accès, éditer :
- `backend/routes/dashboard.js` : Logique de filtrage
- `backend/middleware/auth.js` : Authentification
- `frontend/src/services/dashboardAPI.js` : Appels API

## 📝 Changelog

### Version 1.0 (Aujourd'hui)
- ✅ Implémentation des restrictions par rôle
- ✅ Filtrage automatique des activités
- ✅ Authentification obligatoire
- ✅ Script d'analyse et de validation
- ✅ Documentation complète

---

**Note importante** : Ces restrictions garantissent que chaque conseillère ne voit que ses propres activités, respectant ainsi la confidentialité des données client et la séparation des responsabilités dans l'application.
