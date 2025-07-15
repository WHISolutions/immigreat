# 🔧 Guide de dépannage - Leads vides

## Problème résolu

Le problème des leads vides a été corrigé. Les conseillers peuvent maintenant voir :

1. **Leurs propres leads** (assignés via `conseiller_id` ou `conseillere`)
2. **Les leads non assignés** (disponibles pour tous les conseillers)

## 🚀 Actions de dépannage rapide

### 1. Diagnostic complet
```bash
cd backend
node debug-leads.js
```

**Ou sur Windows PowerShell :**
```powershell
cd backend
.\debug-leads.ps1
```

### 2. Créer des leads de test
```bash
cd backend
node debug-leads.js --create-test
```

### 3. Tester le filtrage pour un conseiller spécifique
```bash
cd backend
node debug-leads.js --test-filter [ID_CONSEILLER]
```

## 🔍 Vérifications à effectuer

### 1. Vérifier la base de données
- Y a-t-il des leads dans la table `leads` ?
- Les conseillers existent-ils dans la table `users` ?
- Les champs `conseiller_id` et `conseillere` sont-ils correctement renseignés ?

### 2. Vérifier l'authentification
- L'utilisateur est-il bien connecté ?
- Le token JWT est-il valide ?
- Le rôle de l'utilisateur est-il correct ?

### 3. Vérifier les logs du serveur
Recherchez dans les logs :
- `🔒 Filtrage pour conseillère:` - montre les conditions de filtrage
- `✅ X leads récupérés` - montre le nombre de leads trouvés
- `🔍 Conditions de recherche:` - montre la requête SQL générée

## 📊 Structure des données attendue

### Table `leads`
```sql
-- Lead assigné à un conseiller (ID 5)
INSERT INTO leads (nom, prenom, email, conseiller_id, conseillere) 
VALUES ('Dupont', 'Jean', 'jean@test.com', 5, 'Marie Conseiller');

-- Lead non assigné (disponible pour tous)
INSERT INTO leads (nom, prenom, email, conseiller_id, conseillere) 
VALUES ('Martin', 'Paul', 'paul@test.com', NULL, NULL);
```

### Table `users` (conseillers)
```sql
-- Conseiller avec ID 5
INSERT INTO users (nom, prenom, email, role) 
VALUES ('Conseiller', 'Marie', 'marie@cabinet.com', 'conseillere');
```

## 🔧 Solutions aux problèmes courants

### Problème : "Aucun lead trouvé"
**Solutions :**
1. Créer des leads de test avec le script
2. Vérifier que des leads existent dans la base
3. Vérifier l'assignation des leads aux conseillers

### Problème : "Erreur d'authentification"
**Solutions :**
1. Vérifier que l'utilisateur est connecté
2. Vérifier la validité du token JWT
3. Vérifier les middlewares d'authentification

### Problème : "Filtrage trop restrictif"
**Solution :** La logique a été corrigée pour inclure les leads non assignés

## 🎯 Logique de filtrage corrigée

### Pour les conseillers (`role = 'conseillere'`)
Un conseiller peut voir :
- Leads où `conseiller_id = user.id`
- Leads où `conseillere = "Prenom Nom"`
- Leads non assignés (`conseiller_id` ET `conseillere` sont NULL/vides)

### Pour les autres rôles
- **Admins, secrétaires, comptables** : Tous les leads

## 🧪 Test rapide

1. **Connectez-vous en tant que conseiller**
2. **Appelez GET `/api/leads`**
3. **Vérifiez les logs pour :**
   ```
   🔒 Filtrage pour conseillère: Marie Conseiller (ID: 5)
   🔍 Conditions de recherche: { "$or": [...] }
   ✅ 3 leads récupérés depuis la base de données
   ```

## 📞 Support

Si le problème persiste :
1. Exécutez le diagnostic complet
2. Vérifiez les logs du serveur
3. Consultez la documentation technique dans `SECURISATION_LEADS_CONSEILLERS.md`
