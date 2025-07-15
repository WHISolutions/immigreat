# API Backend Express.js + Sequelize pour la Gestion des Leads d'Immigration

## ✅ Système Complet Fonctionnel

### 🔧 Backend API (Express.js + Sequelize)

**Configuration de Base de Données :**
- 📄 `config/db.config.js` : Configuration MySQL avec fallback automatique vers SQLite
- 🗄️ Support MySQL en production, SQLite en développement
- 🔄 Détection automatique et basculement en cas d'indisponibilité MySQL

**Modèle Lead :**
- 📄 `models/lead.model.js` : Modèle Sequelize complet avec validations
- 📋 Champs : nom, prenom, email, telephone, source, interet, conseillere, notes, statut, date_creation
- ✅ Validations : emails uniques, formats, valeurs autorisées
- 🕒 Valeurs par défaut : statut="Nouveau", date_creation=maintenant

**Contrôleur :**
- 📄 `controllers/lead.controller.js` : Logique métier
- 🆕 `createLead()` : Validation + insertion en base
- 📋 `getAllLeads()` : Récupération de tous les leads triés par date
- 🔍 `getLeadById()` : Récupération par ID

**Routes API :**
- 📄 `routes/lead.routes.js` : Routes REST
- `POST /api/leads` : Créer un nouveau lead
- `GET /api/leads` : Récupérer tous les leads
- `GET /api/leads/:id` : Récupérer un lead par ID

**Serveur Principal :**
- 📄 `server.js` : Configuration Express
- 🌐 CORS configuré pour http://localhost:3000
- 📡 Port 5001 (configurable via .env)
- 🔄 Middleware de gestion d'erreurs

### 🎨 Frontend React TypeScript

**Composant de Création :**
- 📄 `CreateLeadForm.tsx` : Formulaire complet en TypeScript
- 📋 Tous les champs du modèle avec validation côté client
- 🎛️ Selects pour source, intérêt, et conseillère
- 📝 Textarea pour les notes
- 🚀 Soumission via Axios avec gestion d'erreurs

**Configuration :**
- 📡 API endpoint : `http://localhost:5001/api/leads`
- ⚡ Alertes de succès/erreur
- 🔄 Réinitialisation du formulaire après succès

## 🚀 Utilisation

### Démarrage du Backend
```bash
cd backend
npm start
# Serveur sur http://localhost:5001
```

### Démarrage du Frontend
```bash
cd frontend
npm start
# Application sur http://localhost:3000
```

### Tests API via Terminal
```powershell
# Récupérer tous les leads
Invoke-WebRequest -Uri "http://localhost:5001/api/leads" -Method GET

# Créer un nouveau lead
Invoke-WebRequest -Uri "http://localhost:5001/api/leads" -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"nom":"Dupont","prenom":"Jean","email":"jean.dupont@email.com","telephone":"514-555-0123","source":"Site web","interet":"Permis de travail","conseillere":"Marie Tremblay","notes":"Demande d'\''information pour permis de travail temporaire"}'
```

## 📊 Base de Données

### Structure Table `leads`
| Champ | Type | Contraintes |
|-------|------|-------------|
| id | INTEGER | PRIMARY KEY, AUTO_INCREMENT |
| nom | STRING(100) | NOT NULL, 2-100 caractères |
| prenom | STRING(100) | NOT NULL, 2-100 caractères |
| email | STRING(255) | NOT NULL, UNIQUE, format email |
| telephone | STRING(20) | NOT NULL |
| source | STRING(50) | NOT NULL, valeurs: Site web, LinkedIn, Facebook, Référence, Autre |
| interet | STRING(100) | NOT NULL, valeurs: Permis d'études, Permis de travail, Résidence permanente, Visa visiteur, Citoyenneté, Autre |
| conseillere | STRING(100) | NULLABLE, valeurs: Marie Tremblay, Sophie Martin, Julie Lefebvre |
| notes | TEXT | NULLABLE |
| statut | STRING(50) | NOT NULL, défaut: "Nouveau" |
| date_creation | DATE | NOT NULL, défaut: NOW() |
| date_modification | DATE | AUTO UPDATE |

### 🔧 Configuration MySQL
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=immigration_leads
```

## ✅ Fonctionnalités Testées et Validées

1. ✅ **Connexion Base de Données** : MySQL avec fallback SQLite
2. ✅ **Création de Leads** : Validation + insertion réussie
3. ✅ **Persistance des Données** : Leads sauvegardés et récupérables
4. ✅ **API REST** : Endpoints POST/GET fonctionnels
5. ✅ **Formulaire React** : Interface complète avec TypeScript
6. ✅ **Gestion d'Erreurs** : Validation côté serveur et client
7. ✅ **CORS** : Communication frontend-backend configurée

## 📈 Statut du Projet
🟢 **SYSTÈME COMPLET ET FONCTIONNEL**

Les leads sont effectivement créés, sauvegardés en base de données (SQLite/MySQL) et récupérables via l'API. Le formulaire React TypeScript communique correctement avec le backend Express.js.

**Derniers Tests Réussis :**
- Lead créé via API : ✅
- Lead récupéré via GET : ✅
- 3 leads total en base : ✅
- Interface web accessible : ✅
