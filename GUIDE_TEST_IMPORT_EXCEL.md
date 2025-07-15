# Guide de Test - Importation Excel des Leads

## 📋 Fonctionnalités implémentées

### ✅ Backend
- Route API `POST /api/leads/import-excel` 
- Support des formats: Excel (.xlsx, .xls) et CSV (.csv)
- Validation des colonnes requises: Nom, Prénom, Email, Téléphone, Ville
- Distribution manuelle des leads aux conseillers
- Vérification que le total de distribution = nombre de leads
- Gestion des erreurs et validation

### ✅ Frontend
- Composant `ImportExcelModal` avec interface moderne
- Lecture des fichiers Excel/CSV côté client avec prévisualisation
- Interface de distribution avec validation en temps réel
- Messages d'erreur détaillés
- Integration dans le composant Leads principal

## 🧪 Tests à effectuer

### 1. Accès au modal d'importation
1. Se connecter en tant qu'administrateur, directeur ou secrétaire
2. Aller dans "Gestion des Leads"
3. Cliquer sur le bouton "Importer Excel"
4. ✅ Le modal s'ouvre avec le design conservé de la capture

### 2. Sélection de fichier
1. Utiliser le fichier exemple: `exemple_leads.csv` créé dans le projet
2. ✅ Le fichier est accepté et prévisualisé (8 leads détectés)
3. Tester avec un mauvais format (ex: .txt)
4. ✅ Message d'erreur affiché

### 3. Distribution manuelle
1. Voir la liste des conseillers disponibles
2. Saisir des nombres pour distribuer les 8 leads:
   - hamza adile: 3
   - HASSNA HAJJI: 2  
   - wafaa chaouby: 2
   - yassine el jamali: 1
3. ✅ Total affiché: 8/8 avec indicateur vert ✅
4. Tester avec un total incorrect (ex: 6)
5. ✅ Message d'erreur et bouton "Importer" désactivé

### 4. Importation réussie
1. Configuration correcte avec total = 8
2. Cliquer "Importer"
3. ✅ Message de succès affiché
4. ✅ Liste des leads actualisée automatiquement
5. ✅ Vérifier que les leads sont bien assignés aux bonnes conseillères

### 5. Gestion des erreurs
1. Tester avec un fichier sans les bonnes colonnes
2. ✅ Message d'erreur explicite
3. Tester avec un fichier vide
4. ✅ Message d'erreur approprié

## 📁 Structure des fichiers modifiés

```
backend/
├── routes/lead.routes.js           # Route d'importation ajoutée
├── uploads/                        # Dossier créé pour les fichiers temporaires
└── package.json                    # Nouvelles dépendances: multer, xlsx, csv-parser

frontend/
├── components/
│   └── ImportExcelModal.js         # Nouveau composant modal
├── styles/
│   └── Modal.css                   # Nouveaux styles pour le modal  
├── components/Leads.js             # Integration du modal
└── package.json                    # Nouvelle dépendance: xlsx
```

## 🔑 Points clés de l'implémentation

### Sécurité
- Validation des types de fichiers côté backend et frontend
- Limitation de taille des fichiers (5MB max)
- Permissions vérifiées (admin/directeur/secrétaire uniquement)
- Nettoyage automatique des fichiers temporaires

### UX/UI
- Prévisualisation des données avant importation
- Validation en temps réel de la distribution
- Messages d'erreur clairs et détaillés
- Indicateurs visuels (✅/❌) pour la validation
- Design responsive et moderne

### Performance
- Lecture des fichiers côté client pour la prévisualisation
- Traitement efficace côté serveur
- Gestion des gros fichiers avec limitation de taille

## 🎯 Colonnes requises dans le fichier

| Colonne | Obligatoire | Variations acceptées |
|---------|-------------|---------------------|
| Nom | ✅ | nom, Nom, NOM, lastName, last_name |
| Prénom | ✅ | prenom, prénom, Prénom, firstName, first_name |
| Email | ✅ | email, Email, EMAIL, e-mail, mail |
| Téléphone | ✅ | telephone, téléphone, phone, tel |
| Ville | ✅ | ville, Ville, city |
| Intérêt | ❌ | interet, intérêt, interest (facultatif) |

## 🚀 Pour tester maintenant

1. L'application est lancée sur http://localhost:3000
2. Le fichier exemple `exemple_leads.csv` est créé avec 8 leads
3. Se connecter et aller dans "Gestion des Leads"
4. Tester l'importation selon les étapes ci-dessus
