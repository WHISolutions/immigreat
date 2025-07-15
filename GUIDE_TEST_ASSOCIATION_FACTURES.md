# 🧪 GUIDE DE TEST - Association automatique des factures

## 🎯 OBJECTIF
Tester que les factures créées manuellement s'associent automatiquement à la conseillère qui les crée.

## 📋 ÉTAPES DE TEST

### 1. Prérequis
- ✅ Backend démarré (`npm run dev` dans /backend)
- ✅ Frontend démarré (`npm start` dans /frontend)
- ✅ Utilisateur conseillère connecté

### 2. Test de création de facture

#### 2.1 Accéder au formulaire
1. Se connecter en tant que conseillère
2. Aller dans la section "Facturation"
3. Cliquer sur "Créer une nouvelle facture"

#### 2.2 Remplir le formulaire
1. **Client :** Utiliser l'autocomplete pour sélectionner un client
   - Taper quelques lettres du nom
   - Sélectionner dans les suggestions
   - Vérifier que le client est sélectionné

2. **Montant :** Saisir un montant (ex: 1250.00)

3. **Description :** Saisir une description (ex: "Test association automatique")

4. **Dates :** Laisser les dates par défaut ou les modifier

5. **Statut :** Laisser "brouillon" ou choisir "payable"

#### 2.3 Créer la facture
1. Cliquer sur "CRÉER"
2. Vérifier le message de succès
3. La facture doit apparaître dans la liste

### 3. Vérification de l'association

#### 3.1 Dans la liste des factures
1. Vérifier que la facture apparaît dans la liste de la conseillère
2. Vérifier que la facture a le bon numéro (F2025-XXX)
3. Vérifier que le statut est correct

#### 3.2 Vérification base de données (optionnel)
```bash
# Exécuter depuis le dossier racine
node verify-factures-association.js
```

### 4. Test avec un autre utilisateur

#### 4.1 Connexion admin/secrétaire
1. Se connecter avec un compte admin ou secrétaire
2. Aller dans la section "Facturation"
3. Vérifier que toutes les factures sont visibles

#### 4.2 Connexion autre conseillère
1. Se connecter avec une autre conseillère
2. Aller dans la section "Facturation"
3. Vérifier que seules ses factures sont visibles

## ✅ RÉSULTATS ATTENDUS

### Comportement normal :
- ✅ Facture créée avec succès
- ✅ Facture visible dans la liste de la conseillère
- ✅ Champ `validePar` rempli avec le nom de la conseillère
- ✅ Client automatiquement assigné si non assigné

### Problèmes potentiels :
- ❌ Facture non visible dans la liste
- ❌ Erreur lors de la création
- ❌ Problème d'autocomplete client

## 🐛 DÉBOGAGE

### Si la facture n'apparaît pas :
1. Vérifier la console du navigateur (F12)
2. Vérifier les logs du backend
3. Exécuter le script de vérification

### Si l'autocomplete ne fonctionne pas :
1. Vérifier que le backend est démarré
2. Vérifier l'API clients : `GET /api/clients?search=test`
3. Vérifier la console du navigateur

### Si la création échoue :
1. Vérifier que tous les champs sont remplis
2. Vérifier l'authentification (token JWT)
3. Vérifier les logs du backend

## 📞 CONTACTS

En cas de problème, vérifier :
- Les logs du backend (console serveur)
- Les logs du frontend (console navigateur)
- Le fichier `CORRECTION_ASSOCIATION_FACTURES.md`
