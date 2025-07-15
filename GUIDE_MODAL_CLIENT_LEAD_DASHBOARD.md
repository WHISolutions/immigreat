# Guide Modal Client/Lead dans le Tableau de Bord

## 🎯 Fonctionnalité Implémentée

Le tableau de bord peut maintenant afficher des informations détaillées pour les **clients** et les **leads** directement depuis la section "Mes Rendez-vous à Venir".

## ✨ Nouvelles Fonctionnalités

### 1. Distinction Visuelle Client vs Lead

Dans la section "Mes Rendez-vous à Venir" :
- **👤 Clients** : Icône personne + bordure/badge vert
- **🎯 Leads** : Icône cible + bordure/badge orange

### 2. Modal Adaptatif

Le modal s'adapte automatiquement selon le type :
- **ClientDetailModal** pour les clients (avec toutes les sections)
- **ClientDetailModal** adapté pour les leads (sections pertinentes uniquement)

### 3. Détection Automatique du Type

Le système détermine automatiquement s'il s'agit d'un client ou d'un lead :
```javascript
const contactType = rdv.client_type || (rdv.client_id ? 'client' : 'lead');
```

## 📋 Modifications Apportées

### Frontend

#### `TableauBord.js`
```javascript
// Nouveaux états pour gérer leads et clients
const [selectedLead, setSelectedLead] = useState(null);
const [modalType, setModalType] = useState('client'); // 'client' ou 'lead'

// Fonction unifiée pour afficher contacts
const afficherInfosContact = async (contactId, contactNom, contactType = 'client') => {
  // Recherche dans les leads ou clients selon le type
  // Affichage du modal approprié
}
```

#### `ClientDetailModal.js`
```javascript
// Support des props lead et modalType
function ClientDetailModal({ 
  client, 
  lead, 
  modalType = 'client', 
  isOpen = true, 
  onClose, 
  readOnly = false, 
  onEdit, 
  showAll = false 
}) {
  const data = modalType === 'lead' ? lead : client;
  const titre = modalType === 'lead' ? 'Détails du Lead' : 'Détails du Client';
  const iconeType = modalType === 'lead' ? '🎯' : '👤';
}
```

### Backend

#### Support des Types de Rendez-vous
Le backend identifie les types automatiquement :
- `client_id` non null = client
- `client_id` null = lead

#### API Dashboard
```javascript
// Endpoint: /api/dashboard/rendez-vous-a-venir
// Retourne les rendez-vous avec type automatique
SELECT 
  rv.*,
  CASE WHEN rv.client_id IS NULL THEN 'lead' ELSE 'client' END as client_type,
  COALESCE(c.prenom, l.prenom) as prenom,
  COALESCE(c.nom, l.nom) as nom
FROM rendezvous rv
LEFT JOIN clients c ON rv.client_id = c.id
LEFT JOIN leads l ON rv.client_id IS NULL
```

## 🎨 Interface Utilisateur

### Apparence dans le Tableau de Bord

```
┌─────────────────────────────────────────────────────┐
│ Mes Rendez-vous à Venir                             │
├─────────────────────────────────────────────────────┤
│ Client          │ Date       │ Type                 │
├─────────────────────────────────────────────────────┤
│ 👤 Jean Dupont  │ 2025-02-01 │ Consultation         │
│ 🎯 Marie Martin │ 2025-02-01 │ Premier contact      │
│ 👤 Paul Durand  │ 2025-02-02 │ Suivi dossier       │
└─────────────────────────────────────────────────────┘
```

### Modal Client
- Toutes les sections disponibles
- Informations complètes du dossier
- Documents et contrats
- Historique complet

### Modal Lead  
- Sections pertinentes uniquement
- Informations de contact
- Source du lead
- Statut de conversion
- Notes de prospection

## 🔧 Utilisation

### Pour l'Utilisateur

1. **Aller au Tableau de Bord**
2. **Section "Mes Rendez-vous à Venir"**
3. **Cliquer sur un nom** :
   - 👤 **Client** : Modal complet avec toutes les informations
   - 🎯 **Lead** : Modal adapté avec informations pertinentes

### Indications Visuelles

- **Titre du modal** : "Détails du Client" ou "Détails du Lead"
- **Icône d'en-tête** : 👤 pour client, 🎯 pour lead
- **Badge de type** : "Client" ou "Lead" dans l'en-tête
- **Tooltip** : "Cliquer pour voir les informations du client/lead"

## 🧪 Tests

### Test Manuel

1. **Créer des rendez-vous** avec des clients et des leads
2. **Vérifier les icônes** dans le tableau de bord
3. **Cliquer sur chaque nom** et vérifier le modal approprié
4. **Vérifier le contenu** selon le type

### Script de Test Automatique

```bash
cd backend
node test-dashboard-client-lead-modal.js
```

Le script vérifie :
- ✅ Connexion base de données
- ✅ Récupération des rendez-vous avec types
- ✅ Distinction client vs lead
- ✅ Structure des données pour le frontend

## 📊 Données de Test

### Rendez-vous Exemple

```javascript
[
  {
    id: 1,
    client_id: 123,
    client_type: 'client',
    client_nom: 'Jean Dupont',
    date_rdv: '2025-02-01 10:00:00',
    type_rdv: 'Consultation initiale'
  },
  {
    id: 2,
    client_id: null,
    client_type: 'lead',
    client_nom: 'Marie Martin',
    date_rdv: '2025-02-01 14:00:00',
    type_rdv: 'Premier contact'
  }
]
```

## 🔍 Débogage

### Problèmes Courants

1. **Modal ne s'ouvre pas**
   - Vérifier que `getAllLeads` est bien importé
   - Vérifier les états `selectedClient`/`selectedLead`

2. **Type incorrect affiché**
   - Vérifier la logique de détection : `client_id ? 'client' : 'lead'`
   - Vérifier les données retournées par l'API

3. **Erreur "Lead non trouvé"**
   - Vérifier que l'API leads fonctionne
   - Vérifier la correspondance des noms

### Logs de Débogage

```javascript
console.log('🔄 Récupération contact:', contactType, contactId, contactNom);
console.log('✅ Contact trouvé:', data);
console.log('🎯 Type modal:', modalType);
```

## 🚀 Améliorations Futures

### Possibles Extensions

1. **Recherche par Email** en plus du nom/téléphone
2. **Historique des RDV** lors de la sélection
3. **Conversion Lead → Client** directe depuis le modal
4. **Statistiques** de conversion dans le dashboard
5. **Notifications** pour les leads en attente

### Optimisations

1. **Cache des données** leads/clients
2. **Chargement différé** des informations détaillées
3. **Pagination** pour les listes importantes
4. **Recherche temps réel** dans les modals

## ✅ Résumé des Avantages

- **🎯 Vision unifiée** : Clients et leads dans le même interface
- **👁️ Distinction claire** : Icônes et couleurs pour différencier
- **⚡ Accès rapide** : Un clic pour voir les détails
- **🔄 Cohérence** : Même modal adapté selon le contexte
- **📱 Réactivité** : Interface moderne et intuitive

---

*Cette fonctionnalité améliore considérablement l'expérience utilisateur en permettant un accès unifié aux informations clients et prospects directement depuis le tableau de bord principal.* 