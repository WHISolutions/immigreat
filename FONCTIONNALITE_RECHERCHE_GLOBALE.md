# Fonctionnalité de Recherche Globale

## Vue d'ensemble

La recherche globale permet aux utilisateurs de rechercher rapidement dans toutes les entités du système (leads, clients, dossiers, factures, conseillères) depuis n'importe quelle page de l'application.

## Fonctionnalités

### 🔍 Recherche Globale
- **Localisation** : Barre de recherche en haut à droite de l'interface
- **Activation** : Saisir du texte et appuyer sur "Entrée" ou cliquer sur l'icône loupe
- **Recherche dans** :
  - Leads (nom, prénom, email, téléphone)
  - Clients (nom, prénom, email, téléphone, numéro de dossier)
  - Dossiers (numéro de dossier, type de procédure)
  - Factures (numéro, client, description)
  - Conseillères (nom, prénom, email) - pour admin/directeur uniquement

### 💡 Auto-complétion
- **Activation** : Suggestions automatiques dès 2 caractères saisis
- **Navigation** : Utiliser les flèches ↑↓ et Entrée pour sélectionner
- **Échappement** : Touche Échap pour fermer les suggestions

### 📊 Affichage des Résultats
- **Modal dédiée** : Résultats organisés par catégorie
- **Navigation directe** : Clic sur un résultat pour naviguer vers l'entité
- **Compteur** : Nombre total de résultats affichés
- **Mise en surbrillance** : Élément trouvé mis en avant dans la page cible

## Permissions et Filtrage

### 👩‍💼 Conseillères
- Voient uniquement leurs propres leads, clients, factures
- Accès aux dossiers de leurs clients assignés
- Pas d'accès aux informations des autres conseillères

### 🔧 Administrateurs/Directeurs
- Accès complet à toutes les entités
- Peuvent rechercher dans les comptes conseillères
- Aucune restriction de filtrage

### 📝 Secrétaires/Comptables
- Accès aux clients et dossiers (selon permissions)
- Accès aux factures pour la comptabilité
- Leads visibles selon configuration

## API Endpoints

### Recherche Globale
```
GET /api/search/global?query={terme}
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "leads": [...],
    "clients": [...],
    "dossiers": [...],
    "factures": [...],
    "conseillers": [...]
  },
  "total": 25,
  "query": "marie"
}
```

### Auto-complétion
```
GET /api/search/autocomplete?query={terme}
```

**Réponse :**
```json
{
  "success": true,
  "suggestions": [
    {
      "text": "Marie Dupont",
      "type": "client"
    },
    {
      "text": "Marie Tremblay",
      "type": "lead"
    }
  ]
}
```

## Structure des Fichiers

### Backend
- `backend/routes/search.js` - Routes de recherche
- Intégration dans `backend/server.js`

### Frontend
- `frontend/src/components/GlobalSearch.js` - Composant principal
- `frontend/src/services/searchAPI.js` - Service API
- `frontend/src/styles/GlobalSearch.css` - Styles CSS
- Intégration dans `frontend/src/components/Dashboard.js`

## Utilisation

### Pour les Utilisateurs

1. **Recherche Simple**
   - Cliquer dans la barre de recherche
   - Taper le nom, email, ou numéro recherché
   - Appuyer sur Entrée

2. **Avec Auto-complétion**
   - Commencer à taper
   - Sélectionner une suggestion avec les flèches
   - Appuyer sur Entrée pour confirmer

3. **Navigation dans les Résultats**
   - Modal s'ouvre avec les résultats organisés
   - Cliquer sur un élément pour y naviguer
   - Fermer avec le X ou en cliquant en dehors

### Pour les Développeurs

1. **Ajouter un nouveau type d'entité**
   ```javascript
   // Dans backend/routes/search.js
   // Ajouter la logique de recherche pour le nouveau type
   
   // Dans frontend/services/searchAPI.js
   // Ajouter l'icône et la couleur dans getEntityIcon/getEntityColor
   ```

2. **Modifier les critères de recherche**
   ```javascript
   // Dans backend/routes/search.js
   // Modifier les conditions Op.or pour chaque type d'entité
   ```

3. **Personnaliser l'affichage**
   ```css
   /* Dans frontend/styles/GlobalSearch.css */
   /* Modifier les styles des résultats */
   ```

## Performances et Optimisations

### Backend
- **Limitation des résultats** : 10 par type d'entité
- **Index de base de données** : Sur les champs de recherche fréquents
- **Filtrage par rôle** : Limite les requêtes aux données autorisées

### Frontend
- **Débouncing** : 300ms de délai pour l'auto-complétion
- **Cache** : Résultats mis en cache temporairement
- **Lazy loading** : Modal ne se charge qu'à l'ouverture

## Sécurité

### Authentification
- Token JWT requis pour toutes les requêtes
- Vérification des permissions côté serveur

### Filtrage des Données
- Application stricte des règles métier
- Conseillères ne voient que leurs données
- Validation des paramètres d'entrée

### Protection contre les Injections
- Utilisation de Sequelize ORM
- Paramètres échappés automatiquement
- Validation des entrées utilisateur

## Tests et Debugging

### Logs Backend
```bash
# Console serveur affiche :
🔍 Recherche globale: marie par utilisateur: Dupont Marie (conseillere)
✅ Recherche globale terminée: 5 résultats trouvés
   - Leads: 2
   - Clients: 2
   - Dossiers: 1
   - Factures: 0
   - Conseillers: 0
```

### Debug Frontend
```javascript
// Dans la console navigateur
console.log('🔍 Résultats de recherche:', data.data);
```

## Configuration

### Variables d'Environnement
```bash
# .env
REACT_APP_API_URL=http://localhost:5000/api
```

### Personnalisation
```javascript
// Modifier les limites dans backend/routes/search.js
limit: 10 // Changer selon les besoins
```

## Support et Maintenance

### Problèmes Courants

1. **Aucun résultat trouvé**
   - Vérifier les permissions utilisateur
   - Contrôler l'orthographe du terme
   - Vérifier la connexion à la base de données

2. **Auto-complétion lente**
   - Réduire le délai de débouncing
   - Optimiser les requêtes de base de données
   - Ajouter des index sur les colonnes de recherche

3. **Modal ne s'ouvre pas**
   - Vérifier les erreurs console navigateur
   - Contrôler le token d'authentification
   - Vérifier la connectivité backend

### Évolutions Futures

- [ ] Recherche avancée avec filtres
- [ ] Historique des recherches
- [ ] Recherche dans les documents/fichiers
- [ ] Export des résultats de recherche
- [ ] Recherche par mots-clés dans les notes
- [ ] Suggestions intelligentes basées sur l'historique
