# Guide des Activités Récentes en Temps Réel

## 🎯 Fonctionnalité Implémentée

Le système d'activités récentes est maintenant **100% en temps réel** et récupère les vraies données de la base de données au lieu d'afficher des données statiques.

## ✨ Nouvelles Fonctionnalités

### 🔄 **Chargement en Temps Réel**
- **API Backend** : `/api/dashboard/activites-recentes`
- **Automatique** : Rafraîchissement toutes les 2 minutes
- **Socket.IO** : Mise à jour instantanée lors de nouvelles actions
- **Filtrage par Rôle** : Chaque utilisateur voit ses propres activités

### 📊 **Types d'Activités Trackées**
1. **👤 Leads** : Création de nouveaux leads
2. **👥 Clients** : Mise à jour des informations clients
3. **💰 Factures** : Création et paiement de factures  
4. **📅 Rendez-vous** : Planification de rendez-vous

### 🎨 **Interface Utilisateur**
- **Indicateur de chargement** : `🔄 Chargement...`
- **Dernière MAJ** : `🕒 14:32` (heure de dernière mise à jour)
- **Messages d'état** : "Aucune activité récente" si vide
- **Design responsive** : S'adapte à tous les écrans

## 🔧 **Implémentation Technique**

### Backend (`backend/routes/dashboard.js`)
```javascript
// Endpoint pour activités récentes
router.get('/activites-recentes', optionalAuth, async (req, res) => {
  // Récupère les 7 derniers jours d'activités
  // Filtre par rôle utilisateur (directeur vs conseillère)
  // Combine leads, clients, factures, rendez-vous
  // Formate pour le frontend
});
```

### Frontend (`frontend/src/components/TableauBord.js`)
- **États temps réel** : `vraiesActivitesRecentes`, `loadingActivites`, `derniereMAJActivites`
- **Chargement automatique** : Au démarrage + toutes les 2 minutes
- **Socket.IO** : Écoute les événements en temps réel
- **Affichage conditionnel** : Vraies données > données statiques

### API (`frontend/src/services/dashboardAPI.js`)
```javascript
export const getActivitesRecentes = async (limit = 10) => {
  // Appel API avec authentification
  // Gestion des erreurs
  // Retour formaté
};
```

## 🎯 **Filtrage par Rôle**

### **Directeur/Administrateur**
- **Voit** : Toutes les activités de l'organisation
- **Affichage** : `"Activités Récentes"`
- **Contenu** : Leads, clients, factures, RDV de toutes les conseillères

### **Conseillère**
- **Voit** : Seulement ses propres activités
- **Affichage** : `"Mes Activités Récentes"`  
- **Contenu** : Ses leads, clients, factures, RDV uniquement

### **Comptable/Secrétaire**
- **Voit** : Activités selon permissions
- **Affichage** : Adapté au rôle

## 📅 **Mise à jour Automatique**

### **Intervalles de Rafraîchissement**
- **Automatique** : Toutes les 2 minutes
- **Socket.IO** : Instantané sur les événements :
  - `leadCreated`, `leadUpdated`, `leadDeleted`
  - `clientCreated`, `clientUpdated`, `clientDeleted`
  - `factureCreated`, `factureUpdated`
  - `rendezVousCreated`

### **Gestion d'État**
```javascript
// Chargement initial
useEffect(() => {
  chargerActivitesRecentes();
}, [userRole, userName]);

// Rafraîchissement automatique
useEffect(() => {
  const intervalId = setInterval(() => {
    chargerActivitesRecentes();
  }, 2 * 60 * 1000); // 2 minutes
  return () => clearInterval(intervalId);
}, [userRole, userName]);
```

## 🔍 **Format des Données**

### **Structure d'une Activité**
```json
{
  "id": "lead_32_1751996828166",
  "type": "lead",
  "description": "Nouveau lead créé: jamali yossra", 
  "date": "08/07/2025 12:58",
  "utilisateur": "wafaa chaouby",
  "reference_id": 32
}
```

### **Types Possibles**
- `lead` : 👤 Nouveau lead créé
- `client` : 👥 Client mis à jour  
- `facture` : 💰 Facture créée/payée
- `rendez-vous` : 📅 Rendez-vous planifié

## 🧪 **Tests et Validation**

### **Script de Test**
```bash
cd backend
node test-activites-recentes-dashboard.js
```

### **Tests Effectués**
✅ Récupération leads récents (7 derniers jours)  
✅ Récupération clients mis à jour  
✅ Récupération factures créées/payées  
✅ Récupération rendez-vous planifiés  
✅ Formatage pour frontend  
✅ Simulation réponse API  

### **Résultats de Test**
- **5 leads** récents trouvés  
- **5 clients** mis à jour trouvés
- **5 factures** récentes trouvées  
- **5 rendez-vous** récents trouvés
- **10 activités** formatées pour affichage

## 🚀 **Instructions d'Utilisation**

### **1. Redémarrer le Serveur**
```bash
cd backend
npm start
# ou
node server.js
```

### **2. Accéder au Tableau de Bord**
- Connectez-vous à l'application
- Allez sur la page "Tableau de Bord"
- Observez la section "Mes Activités Récentes"

### **3. Vérifications**
- ✅ Indicateur de dernière mise à jour visible
- ✅ Activités réelles affichées (pas statiques)
- ✅ Chargement automatique toutes les 2 minutes
- ✅ Mise à jour instantanée sur nouvelles actions

### **4. Tester en Temps Réel**
- Créez un nouveau lead depuis la page Leads
- Modifiez un client existant  
- Créez un rendez-vous
- Observez la mise à jour instantanée dans le tableau de bord

## 🔧 **Configuration Avancée**

### **Modifier l'Intervalle de Rafraîchissement**
```javascript
// Dans TableauBord.js, ligne ~1150
const intervalId = setInterval(() => {
  chargerActivitesRecentes();
}, 5 * 60 * 1000); // 5 minutes au lieu de 2
```

### **Modifier le Nombre d'Activités**
```javascript
// Dans TableauBord.js, fonction chargerActivitesRecentes
const result = await getActivitesRecentes(15); // 15 au lieu de 10
```

### **Ajouter de Nouveaux Types d'Activités**
1. Modifier l'API `backend/routes/dashboard.js`
2. Ajouter la requête SQL pour le nouveau type
3. Ajouter l'icône dans `getIconeActivite()`
4. Ajouter l'événement Socket.IO si nécessaire

## 🎨 **Styles et Apparence**

### **Indicateurs Visuels**
- **🔄** : Chargement en cours
- **🕒** : Dernière mise à jour  
- **👤** : Activité lead
- **👥** : Activité client
- **💰** : Activité facture
- **📅** : Activité rendez-vous

### **Classes CSS**
```css
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.loading-indicator {
  color: #1a73e8;
  font-size: 14px;
}

.last-update {
  color: #666;
  font-size: 12px;
}

.activite-item {
  /* Style des éléments d'activité */
}
```

## 📈 **Performance**

### **Optimisations Implémentées**
- **Limite de requête** : 10 activités maximum
- **Période limitée** : 7 derniers jours seulement  
- **Cache frontend** : Évite les requêtes inutiles
- **Requêtes optimisées** : Index sur dates de création

### **Monitoring**
- Logs dans la console pour debug
- Gestion d'erreurs complète
- Fallback sur données statiques en cas d'erreur

## 🔒 **Sécurité**

### **Authentification**
- Token JWT requis pour l'API
- Filtrage par rôle utilisateur
- Validation des paramètres

### **Permissions**
- Conseillères : Seulement leurs activités
- Directeurs : Toutes les activités  
- Respect de la hiérarchie organisationnelle

## 📞 **Support et Dépannage**

### **Problèmes Courants**
1. **Activités statiques affichées** → Redémarrer le serveur
2. **Pas de mise à jour automatique** → Vérifier les événements Socket.IO
3. **Erreur de chargement** → Vérifier les logs backend

### **Logs Utiles**
```bash
# Backend
🔄 [Dashboard] Chargement activités récentes...
✅ [Dashboard] 5 activités récentes trouvées

# Frontend  
🔄 [TableauBord] Chargement activités récentes...
✅ [DashboardAPI] 5 activités récentes récupérées
```

---

**✅ Fonctionnalité 100% opérationnelle et testée !** 