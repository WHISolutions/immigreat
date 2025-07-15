# 🎯 GUIDE TEST - Correction Consultation Finale

## ✅ Corrections appliquées

### **1. Ajout du userId lors de la connexion**
- Tous les comptes mock stockent maintenant un `userId` unique dans localStorage
- Le backend login stocke également le `userId` pour les vraies connexions

### **2. Amélioration de la correspondance conseiller**
- Recherche par `userId` en priorité
- Fallback par nom si userId non trouvé
- Logs détaillés pour diagnostic

## 🧪 **Test à effectuer**

### **Étape 1 : Connexion**
1. Ouvrir l'application : http://localhost:3000
2. Se connecter avec : `marie@example.com` / `password`
3. Vérifier dans la console (F12) :
   ```javascript
   console.log('userId:', localStorage.getItem('userId'));
   console.log('userName:', localStorage.getItem('userName'));
   ```
   - **Résultat attendu** : `userId: "5"`, `userName: "Marie T."`

### **Étape 2 : Test de consultation**
1. Aller dans la section **Leads**
2. Ouvrir un lead existant ou créer un nouveau lead
3. Changer le statut vers **"Consultation effectuée"**
4. **Sauvegarder**

### **Étape 3 : Vérification**
1. Revenir au lead
2. Vérifier que le **nombre de consultations** n'est plus 0
3. Dans la console, chercher les logs :
   - `✅ Consultation créée automatiquement`
   - `🔍 Conseiller trouvé par userId:`

## 🔍 **Logs de diagnostic**

### **Logs attendus lors de la mise à jour du statut :**
```
👤 Utilisateur connecté - userName: Marie T., userId: 5
🔍 Liste des conseillers: [...]
🔍 Recherche par userName: Marie T. userId: 5
🔍 Conseiller trouvé par userId: { id: 5, ... }
📝 Création de la consultation pour le conseiller ID: 5
✅ Consultation créée automatiquement
```

### **Si des erreurs persistent :**
```
⚠️ Impossible de trouver le conseiller pour créer la consultation
⚠️ Lead.conseillere: Marie T.
⚠️ userName: Marie T.
⚠️ userId: 5
⚠️ Conseillers disponibles: [...]
```

## 🚨 **En cas de problème**

### **Problème 1 : userId undefined**
**Solution :**
1. Se déconnecter
2. Se reconnecter
3. Vérifier que userId est maintenant stocké

### **Problème 2 : Conseiller non trouvé**
**Vérification :**
```javascript
// Dans la console du navigateur
console.log('localStorage complet:', localStorage);
console.log('userId type:', typeof localStorage.getItem('userId'));
```

### **Problème 3 : Consultation toujours à 0**
1. Vérifier dans l'onglet **Network** (F12) que la requête POST vers `/api/consultations` s'effectue
2. Vérifier la réponse de cette requête

## 🎯 **Résultat attendu**

- ✅ Le champ "conseillère" est prérempli avec le nom de l'utilisateur connecté
- ✅ Lors du changement de statut vers "Consultation effectuée", une consultation est créée automatiquement
- ✅ Le nombre de consultations s'incrémente et s'affiche correctement
- ✅ Pas d'erreurs dans la console concernant l'assignation des conseillères

---

**Note :** Cette correction résout le problème de correspondance entre l'utilisateur connecté et les conseillers en base de données en utilisant l'ID utilisateur plutôt que seulement le nom, ce qui est plus fiable.
