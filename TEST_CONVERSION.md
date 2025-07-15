# 🧪 Guide de Test - Conversion Lead en Client

## 🚀 Démarrage rapide

1. **Démarrer l'application**
   ```bash
   # Méthode 1: Script automatique
   start-app.bat
   
   # Méthode 2: Manuel
   # Terminal 1 (Backend)
   cd backend
   npm run dev
   
   # Terminal 2 (Frontend) 
   cd frontend
   npm start
   ```

2. **Accéder à l'interface**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🎯 Test de la conversion

### Étape 1: Accéder aux leads
1. Ouvrir http://localhost:3000
2. Naviguer vers la section "Leads" ou "Gestion des Leads"
3. Vérifier que la liste des leads s'affiche

### Étape 2: Localiser un lead à convertir
1. Dans la liste des leads, trouver un lead avec un statut autre que "Client"
2. Cliquer sur le bouton d'actions (⋮) dans la colonne "Actions"
3. **Vérifier que le bouton "🔄 Convertir en client" est présent**

### Étape 3: Tester la conversion
1. Cliquer sur "🔄 Convertir en client"
2. **Vérifier que le modal de conversion s'ouvre**
3. Le modal doit afficher :
   - ✅ Informations du lead (nom, email, téléphone, etc.)
   - ✅ Sélecteur d'utilisateur 
   - ✅ Zone de notes optionnelles
   - ✅ Liste des actions qui seront effectuées

### Étape 4: Effectuer la conversion
1. Sélectionner un utilisateur dans la liste déroulante
2. (Optionnel) Ajouter des notes
3. Cliquer sur "🔄 Convertir en client"
4. **Vérifier les résultats** :
   - ✅ Message de succès avec numéro de dossier
   - ✅ Lead passe au statut "Client" 
   - ✅ Bouton "Convertir en client" disparaît du menu

### Étape 5: Vérifier en base de données
1. Accéder à phpMyAdmin ou votre outil de DB
2. Vérifier les tables :
   - `leads` : statut mis à jour vers "Client"
   - `clients` : nouveau client créé
   - `conversion_logs` : enregistrement de la conversion

## 🔍 Points de vérification

### Interface utilisateur
- [ ] Bouton de conversion visible dans le menu d'actions
- [ ] Bouton masqué pour les leads déjà convertis
- [ ] Modal s'ouvre correctement
- [ ] Données du lead affichées correctement
- [ ] Formulaire fonctionnel

### Fonctionnalité backend
- [ ] API de conversion répond (POST /api/leads/:id/convert-to-client)
- [ ] Numéro de dossier généré au bon format (CL-2025-XXX)
- [ ] Transaction complète (lead + client + log)
- [ ] Gestion d'erreurs appropriée

### Base de données
- [ ] Table `leads` : statut mis à jour
- [ ] Table `clients` : nouveau client créé
- [ ] Table `conversion_logs` : historique enregistré
- [ ] Numéros de dossier uniques

## 🚨 Tests d'erreur

### Test 1: Lead déjà converti
1. Essayer de convertir un lead avec statut "Client"
2. **Résultat attendu** : Bouton non visible

### Test 2: Données manquantes
1. Ouvrir le modal sans sélectionner d'utilisateur
2. Cliquer sur "Convertir"
3. **Résultat attendu** : Message d'erreur

### Test 3: Problème réseau
1. Arrêter le backend
2. Essayer de convertir un lead
3. **Résultat attendu** : Message d'erreur réseau

## 📊 Données de test

Si vous n'avez pas de leads, vous pouvez en créer via l'API :

```bash
curl -X POST http://localhost:5000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Test",
    "prenom": "Lead",
    "email": "test.lead@example.com",
    "telephone": "514-555-0123",
    "source": "Site web",
    "interet": "Permis d'\''études",
    "conseillere": "Marie Tremblay",
    "notes": "Lead de test pour conversion"
  }'
```

## 🎉 Résultat attendu

Après une conversion réussie :

1. **Message de confirmation** :
   ```
   ✅ Lead converti avec succès!
   
   Numéro de dossier: CL-2025-001
   Client créé: Test Lead
   ```

2. **Changements visibles** :
   - Lead affiché avec statut "Client" (badge bleu)
   - Bouton de conversion retiré du menu
   - Données synchronisées

3. **Base de données** :
   - Nouveau client avec numéro CL-2025-XXX
   - Log de conversion avec date/utilisateur
   - Lead marqué comme "Client"

## 🔧 Dépannage

### Problème: Bouton de conversion non visible
- Vérifier que le lead n'a pas déjà le statut "Client"
- Actualiser la page
- Vérifier la console pour erreurs JavaScript

### Problème: Modal ne s'ouvre pas
- Vérifier que ConvertLeadModal.tsx existe
- Vérifier les imports dans Leads.js
- Consulter la console navigateur

### Problème: Erreur de conversion
- Vérifier que le backend fonctionne (http://localhost:5000)
- Vérifier la connexion à la base de données
- Consulter les logs du serveur backend

### Problème: Numéro de dossier incorrect
- Vérifier la table `clients` pour les numéros existants
- Vérifier la logique de génération dans ConversionService

## 📞 Support

En cas de problème :
1. Vérifier les logs du serveur backend
2. Vérifier la console du navigateur
3. Tester l'API directement avec curl/Postman
4. Redémarrer l'application complètement 