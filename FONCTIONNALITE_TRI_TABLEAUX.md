# Fonctionnalité de Tri Interactif des Tableaux

## Aperçu

Cette fonctionnalité ajoute un système de tri interactif aux tableaux de gestion des leads et des clients. Les utilisateurs peuvent maintenant cliquer sur les en-têtes des colonnes pour trier les données de manière intuitive.

## Composants Modifiés

### 1. LeadsList.tsx
- **Localisation** : `frontend/src/components/LeadsList.tsx`
- **Description** : Composant de liste des leads avec tri interactif
- **Fonctionnalités ajoutées** :
  - Tri par nom complet (alphabétique)
  - Tri par conseillère (alphabétique)
  - Tri par date de création (chronologique)
  - Tri par source (alphabétique)
  - Tri par statut (alphabétique)
  - Tri par intérêt (alphabétique)
  - Sélecteur de vue (Tableau/Grille)

### 2. Clients.js
- **Localisation** : `frontend/src/components/Clients.js`
- **Description** : Composant de liste des clients avec tri interactif
- **Fonctionnalités ajoutées** :
  - Tri par numéro de dossier (alphanumérique)
  - Tri par nom complet (alphabétique)
  - Tri par email (alphabétique)
  - Tri par téléphone (numérique)
  - Tri par type de procédure (alphabétique)
  - Tri par date de création (chronologique)
  - Tri par statut (alphabétique)
  - Tri par conseillère (alphabétique)

## Fonctionnalités Implémentées

### 1. Tri Bidirectionnel
- **Premier clic** : Tri croissant (A→Z, ancien→récent)
- **Deuxième clic** : Tri décroissant (Z→A, récent→ancien)
- **Troisième clic** : Retour au tri croissant (cycle continu)

### 2. Indicateurs Visuels
- **Icône ↕️** : Colonne non triée (état neutre)
- **Icône ↑** : Tri croissant actif
- **Icône ↓** : Tri décroissant actif
- **Effet hover** : Mise en évidence des colonnes triables

### 3. Persistance du Tri
- Le tri reste actif lors de :
  - Actualisation des données
  - Application de filtres
  - Recherche textuelle
  - Changement de vue (tableau/grille)

## Interface Utilisateur

### Sélecteur de Vue (LeadsList uniquement)
```jsx
📊 Tableau | 🔲 Grille
```
- Permet de basculer entre la vue tableau (avec tri) et la vue grille (cartes)
- La vue tableau est sélectionnée par défaut

### En-têtes Interactifs
- **Cursor pointer** : Indique que la colonne est cliquable
- **User-select: none** : Empêche la sélection de texte lors du clic
- **Tooltips** : "Cliquer pour trier"
- **Animations** : Feedback visuel lors du clic

## Logique de Tri

### Types de Tri Supportés
1. **Alphabétique** : Nom, email, source, statut, conseillère
2. **Chronologique** : Date de création
3. **Numérique** : Téléphone, numéro de dossier
4. **Mixte** : Nom complet (prénom + nom)

### Algorithme de Tri
```javascript
const getSortedData = () => {
  const sortedData = [...data].sort((a, b) => {
    let aValue, bValue;
    
    // Extraction des valeurs selon le type de champ
    switch (sortField) {
      case 'nom':
        aValue = `${a.prenom} ${a.nom}`.toLowerCase();
        bValue = `${b.prenom} ${b.nom}`.toLowerCase();
        break;
      case 'date_creation':
        aValue = new Date(a.date_creation).getTime();
        bValue = new Date(b.date_creation).getTime();
        break;
      // ... autres cas
    }
    
    // Application de l'ordre de tri
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sortedData;
};
```

## Styles CSS

### Fichier Principal
- **Localisation** : `frontend/src/styles/TableSorting.css`
- **Description** : Styles dédiés aux fonctionnalités de tri

### Classes CSS Importantes
- `.sortable-header` : En-têtes de tableau triables
- `.sort-indicator` : Indicateurs de tri
- `.view-selector` : Sélecteur de vue
- `.sortable-table` : Tableau avec tri
- `.actions-dropdown` : Menus d'actions

### Animations
- **sortPulse** : Animation de l'indicateur lors du changement de tri
- **fadeInDown** : Animation d'apparition des dropdowns

## Compatibilité

### Navigateurs
- Chrome 70+
- Firefox 65+
- Safari 12+
- Edge 79+

### Responsive Design
- **Mobile** : Adaptation des tailles de police et espaces
- **Tablette** : Optimisation des interactions tactiles
- **Desktop** : Expérience complète avec hover effects

## Installation et Utilisation

### 1. Fichiers Modifiés
```
frontend/src/components/LeadsList.tsx
frontend/src/components/Clients.js
frontend/src/styles/TableSorting.css
```

### 2. Import des Styles
```javascript
import '../styles/TableSorting.css';
```

### 3. États Nécessaires
```javascript
const [sortField, setSortField] = useState('date_creation');
const [sortOrder, setSortOrder] = useState('desc');
```

### 4. Fonctions de Tri
```javascript
const handleSort = (field) => {
  if (sortField === field) {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  } else {
    setSortField(field);
    setSortOrder('asc');
  }
};
```

## Avantages

### 1. Expérience Utilisateur
- **Intuitive** : Clic sur en-tête pour trier
- **Visuelle** : Indicateurs clairs de l'état du tri
- **Flexible** : Tri sur toutes les colonnes pertinentes

### 2. Performance
- **Côté client** : Tri instantané sans requête serveur
- **Mémoire** : Tri en place sans duplication des données
- **Optimisé** : Tri uniquement lors du changement de critère

### 3. Maintenabilité
- **Modulaire** : Fonctions de tri réutilisables
- **Extensible** : Facile d'ajouter de nouvelles colonnes
- **Testable** : Logique de tri isolée

## Limitations

### 1. Données Volumineuses
- Le tri côté client peut être lent avec +1000 éléments
- Recommandation : Pagination ou tri côté serveur

### 2. Tri Complexe
- Pas de tri multi-colonnes
- Pas de tri personnalisé par utilisateur

### 3. Persistance
- Le tri n'est pas sauvegardé entre les sessions
- Réinitialisé au rechargement de la page

## Améliorations Futures

### 1. Tri Côté Serveur
- Implémentation pour les grandes données
- Tri combiné avec pagination

### 2. Tri Multi-Colonnes
- Possibilité de trier par plusieurs critères
- Interface pour gérer les priorités

### 3. Préférences Utilisateur
- Sauvegarde du tri préféré
- Paramètres de tri par défaut

### 4. Tri Avancé
- Tri par plage de dates
- Tri par status avec priorité
- Tri alphanumérique intelligent

## Tests

### 1. Tests Unitaires
```javascript
describe('Tri des données', () => {
  it('devrait trier par nom de A à Z', () => {
    // Test du tri alphabétique croissant
  });
  
  it('devrait trier par date du plus récent au plus ancien', () => {
    // Test du tri chronologique décroissant
  });
});
```

### 2. Tests d'Intégration
- Vérification du tri avec filtres actifs
- Test de la persistance lors du changement de vue
- Validation des interactions utilisateur

### 3. Tests d'Accessibilité
- Navigation au clavier
- Compatibilité avec les lecteurs d'écran
- Contraste des indicateurs de tri

## Conclusion

Cette fonctionnalité améliore considérablement l'expérience utilisateur en permettant un tri intuitif et rapide des données. Elle respecte les standards d'accessibilité et offre une interface moderne et responsive.

L'implémentation est modulaire et extensible, permettant d'ajouter facilement de nouvelles fonctionnalités de tri selon les besoins futurs de l'application.

# Fonctionnalité d'Affichage/Masquage du Mot de Passe

## Vue d'ensemble
Cette fonctionnalité permet aux utilisateurs de basculer entre l'affichage masqué et visible du mot de passe client dans les formulaires d'édition et de création de clients.

## Composants Implémentés

### 1. ClientEdit.js
- **Localisation**: `frontend/src/components/ClientEdit.js`
- **Fonction**: Affichage/masquage du mot de passe dans le formulaire d'édition de client
- **Emplacement**: Section "Informations de compte"

### 2. AddClient.js
- **Localisation**: `frontend/src/components/AddClient.js`
- **Fonction**: Affichage/masquage du mot de passe dans le formulaire d'ajout de client
- **Emplacement**: Onglet "Informations personnelles"

### 3. NewClient.js
- **Localisation**: `frontend/src/components/NewClient.js`
- **Fonction**: Affichage/masquage du mot de passe dans le formulaire de nouveau client
- **Emplacement**: Étape 2 - "Informations personnelles"

## Fonctionnalité Technique

### État de Contrôle
```javascript
// État pour contrôler la visibilité du mot de passe
const [showPassword, setShowPassword] = useState(false);

// Fonction pour basculer la visibilité du mot de passe
const togglePasswordVisibility = () => {
  setShowPassword(!showPassword);
};
```

### Structure HTML
```jsx
<div className="form-group password-group">
  <label>Mot de passe client:</label>
  <input
    type={showPassword ? 'text' : 'password'}
    name="motDePasseClient"
    value={clientData.motDePasseClient}
    onChange={handleInputChange}
  />
  <button
    type="button"
    className="btn-icon"
    onClick={togglePasswordVisibility}
    title={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
  >
    {showPassword ? <i className="fas fa-eye-slash"></i> : <i className="fas fa-eye"></i>}
  </button>
</div>
```

### Styles CSS
```css
.form-group.password-group {
  position: relative;
}

.form-group.password-group .btn-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6c757d;
  font-size: 1.1em;
  padding: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s ease;
  z-index: 2;
}

.form-group.password-group .btn-icon:hover {
  color: #007bff;
  background: #f8f9fa;
}

.form-group.password-group input {
  padding-right: 45px; /* Espace pour le bouton d'icône */
}
```

## Caractéristiques

### Icônes
- **Mot de passe masqué**: `fas fa-eye` (œil ouvert)
- **Mot de passe visible**: `fas fa-eye-slash` (œil barré)
- **Bibliothèque**: FontAwesome

### Comportement
- **État par défaut**: Mot de passe masqué (`type="password"`)
- **Clic sur l'icône**: Bascule entre `type="password"` et `type="text"`
- **Titre dynamique**: Change selon l'état (Afficher/Masquer)

### Sécurité
- **Temporaire**: La visibilité est réinitialisée à chaque rechargement
- **Local**: Aucune donnée de mot de passe n'est stockée ou transmise
- **Contrôlé**: Basculement uniquement par interaction utilisateur

## Utilisation
1. Remplir le champ mot de passe (masqué par défaut)
2. Cliquer sur l'icône œil pour afficher le mot de passe
3. Cliquer sur l'icône œil barré pour masquer le mot de passe
4. Le titre du bouton change pour indiquer l'action disponible

## Compatibilité
- ✅ Tous les navigateurs modernes
- ✅ Responsive design
- ✅ Accessibilité (title attribut)
- ✅ Cohérence visuelle avec l'application

## Améliorations Futures
- Indicateur de force du mot de passe
- Générateur de mot de passe automatique
- Validation en temps réel
- Confirmation de mot de passe

---

# Fonctionnalité Visa Visiteur - Champs Dynamiques

## Vue d'ensemble
Cette fonctionnalité ajoute des champs spécifiques et dynamiques pour la procédure "Visa visiteur" avec une logique conditionnelle avancée selon les spécifications métier.

## Composants Implémentés

### 1. ClientEdit.js
- **Localisation**: `frontend/src/components/ClientEdit.js`
- **Fonction**: `renderSpecificFields()` - Cas "Visa visiteur"
- **Emplacement**: Onglet "Procédure"

### 2. AddClient.js
- **Localisation**: `frontend/src/components/AddClient.js`
- **Fonction**: `renderSpecificFields()` - Cas "Visa visiteur"
- **Emplacement**: Onglet "Procédure"

## Champs Implémentés

### 1. **Champs Obligatoires**
```javascript
// Fonds disponibles en compte (requis)
fondsDisponibles: {
  type: 'number',
  required: true,
  label: 'Fonds disponibles en compte (CAD)'
}

// Situation familiale (requis)
situationFamiliale: {
  type: 'select',
  required: true,
  options: ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait']
}
```

### 2. **Champs Informatifs**
```javascript
// Nombre de personnes dans la demande
nombrePersonnes: {
  type: 'number',
  default: 1,
  min: 1
}

// Date prévue du voyage
dateVoyage: {
  type: 'date'
}
```

### 3. **Emploi (Cases à Cocher)**
```javascript
emploiTypes: {
  type: 'checkbox-group',
  options: ['Salarié', 'Entrepreneur', 'Retraité', 'Autre'],
  multiple: true
}

// Champ conditionnel si "Autre" sélectionné
autreEmploiPrecision: {
  type: 'text',
  conditional: 'emploiTypes includes "Autre"'
}
```

### 4. **Invitation du Canada**
```javascript
invitationCanada: {
  type: 'select',
  options: ['Oui', 'Non']
}

// Champ conditionnel si "Oui"
lienParenteInvitant: {
  type: 'text',
  conditional: 'invitationCanada === "Oui"'
}
```

### 5. **Représentant de Famille**
```javascript
// Champ conditionnel si situation familiale ≠ célibataire
representantFamille: {
  type: 'text',
  conditional: 'situationFamiliale !== "Célibataire"'
}
```

### 6. **Voyages à l'Étranger**
```javascript
voyageEtranger: {
  type: 'select',
  options: ['Oui', 'Non']
}

// Champ conditionnel si "Oui"
detailsVoyages: {
  type: 'textarea',
  conditional: 'voyageEtranger === "Oui"',
  placeholder: 'Pays, dates, durées'
}
```

### 7. **Visa/Refus Antérieurs**
```javascript
visaRefus: {
  type: 'select',
  options: ['Oui', 'Non']
}

// Champ conditionnel si "Oui"
detailsVisaRefus: {
  type: 'textarea',
  conditional: 'visaRefus === "Oui"',
  placeholder: 'Pays, type de visa, dates, accepté/refusé'
}
```

## Fonctionnalité Technique

# Fonctionnalité Permis de Travail - Champs Dynamiques Avancés

## Vue d'ensemble
Cette fonctionnalité ajoute un formulaire complet et dynamique pour la procédure "Permis de travail" avec 6 sections principales, des champs conditionnels, des listes dynamiques et une génération automatique de documents.

## Composants Implémentés

### 1. ClientEdit.js
- **Localisation**: `frontend/src/components/ClientEdit.js`
- **Fonction**: `renderSpecificFields()` - Cas "Permis de travail"
- **Fonctions**: `generatePermisTravailDocuments()`, `getFinancialTooltipContent()` mise à jour

### 2. AddClient.js
- **Localisation**: `frontend/src/components/AddClient.js`
- **Fonction**: `renderSpecificFields()` - Cas "Permis de travail"
- **Fonctions**: `generatePermisTravailDocuments()`, `getFinancialTooltipContent()` mise à jour

## Architecture des Sections

### Section 1: Informations personnelles supplémentaires
```javascript
🔹 1. Informations personnelles supplémentaires
├── Situation familiale (required, select)
│   └── Options: ['Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve', 'Union de fait']
├── Nombre de personnes dans la demande (number)
└── Qui sera le représentant ? (conditional, text)
    └── Condition: nombrePersonnes > 1
```

### Section 2: Informations professionnelles
```javascript
🔹 2. Informations professionnelles
├── Emploi actuel (checkbox-group)
│   └── Options: ['Salarié', 'Entrepreneur', 'Retraité', 'Autre']
├── Précisez le type d'emploi actuel (conditional, text)
│   └── Condition: emploiActuelTypes.includes('Autre')
├── Postes occupés (dynamic array)
│   ├── Nom du poste (text)
│   ├── Mois d'expérience (number)
│   └── Actions: [Ajouter, Supprimer]
├── Diplômes obtenus (dynamic array)
│   ├── Diplôme (text)
│   ├── Établissement (text)
│   └── Actions: [Ajouter, Supprimer]
├── Compétences linguistiques
│   ├── Compétences en français (select)
│   └── Compétences en anglais (select)
└── Tests de langue
    ├── Tests de langue passés (select: Oui/Non)
    └── Détails conditionnels si "Oui"
        ├── Type de test (select)
        └── Scores obtenus (text)
```

### Section 3: Offre d'emploi au Canada
```javascript
🔹 3. Offre d'emploi au Canada
├── Avez-vous une offre d'emploi au Canada ? (select: Oui/Non)
└── Détails conditionnels si "Oui"
    ├── Nom de l'employeur canadien (text)
    ├── Type de poste (text)
    ├── Province d'emploi (select - toutes provinces Canada)
    ├── Durée prévue du contrat (text)
    └── Numéro d'offre d'emploi ou EIMT (text, optional)
```

### Section 4: Informations spécifiques au programme
```javascript
🔹 4. Informations spécifiques au programme
├── Type de permis de travail visé (checkbox-group)
│   └── Options: ['Permis fermé', 'Permis ouvert', 'Permis post-diplôme', 'Autre']
├── Précisez le type de permis (conditional, text)
│   └── Condition: typePermisTypes.includes('Autre')
├── Province visée (select - toutes provinces Canada)
└── Date prévue de départ (date)
```

### Section 5: Informations financières
```javascript
🔹 5. Informations financières
└── Fonds disponibles en compte (CAD) (number)
```

### Section 6: Antécédents de voyage
```javascript
🔹 6. Antécédents de voyage
├── Avez-vous voyagé à l'étranger ? (select: Oui/Non)
├── Détails voyages (conditional, textarea)
│   └── Condition: voyageEtrangerPT === 'Oui'
├── Avez-vous déjà eu un visa ? (select: Oui/Non)
├── Détails visa antérieurs (conditional, textarea)
│   └── Condition: visaAnterieursOui === 'Oui'
├── Avez-vous déjà eu un refus de visa ? (select: Oui/Non)
└── Détails refus visa (conditional, textarea)
    └── Condition: refusVisaOui === 'Oui'
```

## Fonctionnalités Avancées

### 1. Sections Dynamiques avec Gestion d'État
```javascript
// Gestion des postes occupés
const [postesOccupes, setPostesOccupes] = useState([]);

const addPoste = () => {
  const newPostes = [...postesOccupes, { nom: '', moisExperience: '' }];
  handleSpecificInfoChange('postesOccupes', newPostes);
};

const removePoste = (index) => {
  const newPostes = postesOccupes.filter((_, i) => i !== index);
  handleSpecificInfoChange('postesOccupes', newPostes);
};
```

### 2. Génération Automatique de Documents
```javascript
const generatePermisTravailDocuments = () => {
  const situationFamiliale = informationsSpecifiques.situationFamilialePermis || '';
  const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnesPermis) || 1;
  const offreEmploiCanada = informationsSpecifiques.offreEmploiCanada || '';
  
  const categories = {};
  
  // Documents de base pour le demandeur principal
  const documentsBase = [
    'Copie de la CIN',
    'Copie du passeport et visas antérieurs',
    'Photo d\'identité',
    'Dossier financier',
    'Dossier emploi'
  ];
  
  // Si offre d'emploi confirmée
  if (offreEmploiCanada === 'Oui') {
    documentsBase.push('Contrat de travail');
  }
  
  // Documents conditionnels
  documentsBase.push('Certificat de police (si requis)');
  documentsBase.push('Résultats d\'examen médical (si requis)');
  
  // Logique familiale
  const aFamille = nombrePersonnes > 1 || (situationFamiliale && situationFamiliale !== 'Célibataire');
  
  if (aFamille) {
    categories['Demandeur principal'] = documentsBase;
    
    // Documents pour les autres membres de la famille
    if (nombrePersonnes > 1) {
      for (let i = 2; i <= nombrePersonnes; i++) {
        categories[`Membre ${i} de la famille`] = [
          'Preuve de lien',
          'Passeport',
          'CIN',
          'Photo',
          'Prise en charge'
        ];
      }
    }
  } else {
    categories['Documents requis'] = documentsBase;
  }
  
  return categories;
};
```

### 3. Info-bulle Contextuelle pour Dossier Financier
```javascript
const getFinancialTooltipContent = () => {
  const typeProcedure = clientData.typeProcedure;
  
  if (typeProcedure === 'Permis de travail') {
    const emploiActuelTypes = informationsSpecifiques.emploiActuelTypes || [];
    
    let content = [];
    
    if (emploiActuelTypes.includes('Salarié')) {
      content.push({
        title: 'Salarié :',
        items: [
          'Bulletins de paie',
          'Attestation de travail',
          'Relevés bancaires',
          'Contrat de travail actuel'
        ]
      });
    }
    
    if (emploiActuelTypes.includes('Entrepreneur')) {
      content.push({
        title: 'Entrepreneur :',
        items: [
          'Registre de commerce',
          'Statuts',
          'Justificatifs impôts',
          'Contrat de location',
          'Relevés bancaires'
        ]
      });
    }
    
    if (emploiActuelTypes.includes('Retraité')) {
      content.push({
        title: 'Retraité :',
        items: [
          'Attestation de retraite',
          'Preuves de revenus',
          'Relevés bancaires'
        ]
      });
    }
    
    return content;
  }
};
```

## Structure des Données
```javascript
const informationsSpecifiques = {
  // Section 1: Informations personnelles
  situationFamilialePermis: 'Marié(e)',
  nombrePersonnesPermis: 3,
  representantFamillePermis: 'Jean Dupont',
  
  // Section 2: Informations professionnelles
  emploiActuelTypes: ['Salarié', 'Entrepreneur'],
  autreEmploiActuelPrecision: '',
  postesOccupes: [
    { nom: 'Développeur web', moisExperience: 24 },
    { nom: 'Chef de projet', moisExperience: 18 }
  ],
  diplomesObtenus: [
    { nom: 'Master en informatique', etablissement: 'Université de Montréal' },
    { nom: 'Licence en informatique', etablissement: 'ENSAM Casablanca' }
  ],
  competencesFrancais: 'Avancé',
  competencesAnglais: 'Intermédiaire',
  testsLanguePassesPT: 'Oui',
  typeTestLangue: 'TEF',
  scoresObtenus: 'B2',
  
  // Section 3: Offre d'emploi au Canada
  offreEmploiCanada: 'Oui',
  nomEmployeurCanadien: 'TechCorp Inc.',
  typePosteCanada: 'Développeur Senior',
  provinceEmploi: 'Québec',
  dureeContrat: '2 ans',
  numeroOffreEIMT: 'EIMT-2025-001234',
  
  // Section 4: Informations spécifiques au programme
  typePermisTypes: ['Permis fermé', 'Permis post-diplôme'],
  autreTypePermisPrecision: '',
  provinceViseePermis: 'Québec',
  datePrevueDepart: '2025-09-01',
  
  // Section 5: Informations financières
  fondsDisponiblesPermis: 25000,
  
  // Section 6: Antécédents de voyage
  voyageEtrangerPT: 'Oui',
  detailsVoyagesPT: 'France (2023, 2 semaines), Espagne (2022, 1 semaine)',
  visaAnterieursOui: 'Oui',
  detailsVisaAnterieurs: 'Visa Schengen France 2023, approuvé',
  refusVisaOui: 'Non',
  detailsRefusVisa: ''
};
```

## Validation et Logique Métier

### 1. Champs Obligatoires
- `situationFamilialePermis` : Requis
- `fondsDisponiblesPermis` : Requis, minimum 10,000 CAD recommandé

### 2. Validation Conditionnelle
```javascript
const validatePermisTravail = (data) => {
  const errors = {};
  
  // Validation du représentant si famille
  if (parseInt(data.nombrePersonnesPermis) > 1 && !data.representantFamillePermis) {
    errors.representantFamillePermis = 'Le représentant de la famille est requis';
  }
  
  // Validation des détails de tests si passés
  if (data.testsLanguePassesPT === 'Oui') {
    if (!data.typeTestLangue) {
      errors.typeTestLangue = 'Le type de test est requis';
    }
    if (!data.scoresObtenus) {
      errors.scoresObtenus = 'Les scores sont requis';
    }
  }
  
  // Validation des détails d'emploi si offre confirmée
  if (data.offreEmploiCanada === 'Oui') {
    if (!data.nomEmployeurCanadien) {
      errors.nomEmployeurCanadien = 'Le nom de l\'employeur est requis';
    }
    if (!data.typePosteCanada) {
      errors.typePosteCanada = 'Le type de poste est requis';
    }
  }
  
  return errors;
};
```

### 3. Auto-complétion et Suggestions
- **Provinces canadiennes** : Liste complète des 13 provinces/territoires
- **Types de tests** : IELTS, TEF, CELPIP, TCF standardisés
- **Niveaux de compétences** : Échelle européenne (A1-C2)

## Intégration avec Autres Systèmes

### 1. Génération de Documents
- **Déclenchement** : Automatique lors de la sélection "Permis de travail"
- **Mise à jour** : En temps réel selon les changements de formulaire
- **Catégorisation** : Par membre de famille et type de document

### 2. Calcul de Score CRS (futur)
```javascript
const calculateCRSScore = (data) => {
  let score = 0;
  
  // Âge (maximum 110 points)
  // Éducation (maximum 150 points)
  // Langues (maximum 160 points)
  // Expérience (maximum 80 points)
  
  return score;
};
```

### 3. Workflow de Traitement
```javascript
const workflowSteps = [
  'Collecte des informations',
  'Validation des données',
  'Génération des documents',
  'Vérification de l\'éligibilité',
  'Préparation du dossier',
  'Soumission'
];
```

## Performance et Optimisation

### 1. Rendu Conditionnel Optimisé
```javascript
// Utilisation de useMemo pour les listes lourdes
const provincesList = useMemo(() => 
  provinces.map(p => ({ value: p.code, label: p.name })), 
  []
);

// useCallback pour les handlers complexes
const handleDynamicChange = useCallback((arrayName, index, field, value) => {
  setInformationsSpecifiques(prev => {
    const newArray = [...(prev[arrayName] || [])];
    newArray[index] = { ...newArray[index], [field]: value };
    return { ...prev, [arrayName]: newArray };
  });
}, []);
```

### 2. Sauvegarde Automatique
```javascript
// Auto-save toutes les 30 secondes
useEffect(() => {
  const autoSaveInterval = setInterval(() => {
    if (hasUnsavedChanges) {
      handleSaveDraft();
    }
  }, 30000);
  
  return () => clearInterval(autoSaveInterval);
}, [hasUnsavedChanges]);
```

## Conclusion Permis de Travail

Cette implémentation du formulaire "Permis de travail" offre :

### ✅ Fonctionnalités Complètes
- **6 sections organisées** selon les spécifications métier
- **Logique conditionnelle avancée** avec 15+ champs conditionnels
- **Listes dynamiques** pour postes et diplômes
- **Génération automatique** de documents personnalisés
- **Info-bulles contextuelles** selon le type d'emploi

### ✅ Expérience Utilisateur
- **Interface intuitive** avec sections numérotées et emojis
- **Validation en temps réel** avec messages d'erreur clairs
- **Responsive design** adaptatif mobile/desktop
- **Performance optimisée** avec React hooks avancés

### ✅ Conformité Métier
- **Exactitude des données** selon les exigences IRCC
- **Workflow complet** de collecte à soumission
- **Extensibilité** pour futures procédures
- **Maintenabilité** du code avec architecture modulaire

Cette fonctionnalité transforme la gestion des demandes de permis de travail en un processus guidé, efficient et conforme aux standards canadiens d'immigration.
  // Champs obligatoires
  fondsDisponibles: 15000,
  situationFamiliale: 'Marié(e)',
  
  // Champs informatifs
  nombrePersonnes: 2,
  dateVoyage: '2025-08-15',
  
  // Emploi (array)
  emploiTypes: ['Salarié', 'Autre'],
  autreEmploiPrecision: 'Consultant freelance',
  
  // Invitation
  invitationCanada: 'Oui',
  lienParenteInvitant: 'Frère',
  
  // Représentant famille
  representantFamille: 'Jean Dupont',
  
  // Voyages
  voyageEtranger: 'Oui',
  detailsVoyages: 'France (2020-2021, 6 mois), Espagne (2019, 2 semaines)',
  
  // Visa/Refus
  visaRefus: 'Non',
  detailsVisaRefus: ''
};
```

### Logique Conditionnelle
```javascript
// Exemple de rendu conditionnel
const situationFamiliale = informationsSpecifiques.situationFamiliale || '';
const invitationCanada = informationsSpecifiques.invitationCanada || '';
const emploiTypes = informationsSpecifiques.emploiTypes || [];
const autreEmploi = emploiTypes.includes('Autre');

// Affichage conditionnel des champs
{autreEmploi && (
  <div className="form-row">
    {renderField('autreEmploiPrecision', 'Précisez le type d\'emploi', 'text')}
  </div>
)}

{invitationCanada === 'Oui' && (
  <div className="form-row">
    {renderField('lienParenteInvitant', 'Lien de parenté avec l\'invitant', 'text')}
  </div>
)}

{situationFamiliale && situationFamiliale !== 'Célibataire' && (
  <div className="form-row">
    {renderField('representantFamille', 'Qui sera le représentant de la famille ?', 'text')}
  </div>
)}
```

### Gestion des Cases à Cocher
```javascript
// Fonction pour gérer les arrays dans les cases à cocher
const handleCheckboxChange = (option, currentValues) => {
  let newValues;
  if (currentValues.includes(option)) {
    newValues = currentValues.filter(v => v !== option);
  } else {
    newValues = [...currentValues, option];
  }
  return newValues;
};
```

## Styles CSS

### Classes Spécifiques
```css
.specific-fields {
  margin-top: 20px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.checkbox-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 5px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.checkbox-label:hover {
  background-color: #f8f9fa;
}
```

### Responsive Design
```css
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
  
  .checkbox-group {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 15px;
  }
}
```

## Validation

### Champs Requis
- **Fonds disponibles**: Obligatoire, type numérique
- **Situation familiale**: Obligatoire, liste déroulante

### Validation Conditionnelle
```javascript
// Validation spécifique selon le type de procédure
if (clientData.typeProcedure === 'Visa visiteur') {
  if (!clientData.informationsSpecifiques.fondsDisponibles) {
    newErrors['informationsSpecifiques.fondsDisponibles'] = 'Les fonds disponibles sont requis';
  }
  if (!clientData.informationsSpecifiques.situationFamiliale) {
    newErrors['informationsSpecifiques.situationFamiliale'] = 'La situation familiale est requise';
  }
}
```

## Utilisation

### Pour l'Utilisateur
1. **Sélectionner** "Visa visiteur" comme type de procédure
2. **Remplir** les champs obligatoires (fonds, situation familiale)
3. **Compléter** les informations additionnelles selon les besoins
4. **Cocher** les types d'emploi applicables
5. **Répondre** aux questions Oui/Non pour déclencher les champs conditionnels
6. **Préciser** les détails dans les champs texte/textarea qui apparaissent

### Logique de Progression
- Les champs apparaissent/disparaissent en temps réel
- Aucun rechargement de page nécessaire
- Validation en temps réel des champs requis
- Sauvegarde automatique des données saisies

## Compatibilité
- ✅ React.js (hooks useState)
- ✅ Responsive design complet
- ✅ Accessibilité (labels, required)
- ✅ Validation front-end et back-end
- ✅ Sauvegarde en base de données (JSON)

## Améliorations Futures
- **Auto-complétion** pour les pays et adresses
- **Validation avancée** des dates et montants
- **Upload de documents** directement liés aux champs
- **Calcul automatique** des fonds requis selon le nombre de personnes
- **Intégration API** pour vérification des informations
- **Template de documents** pré-remplis
- **Notifications de rappel** pour documents manquants

---

# Génération Automatique de Documents - Visa Visiteur

## Vue d'ensemble
Cette fonctionnalité génère automatiquement la liste des documents requis pour la procédure "Visa visiteur" en fonction de la situation familiale, du nombre de personnes et de l'invitation du Canada.

## Fonctionnement

### Logique de Génération
```javascript
const generateVisaVisiteurDocuments = () => {
  const situationFamiliale = informationsSpecifiques.situationFamiliale || '';
  const nombrePersonnes = parseInt(informationsSpecifiques.nombrePersonnes) || 1;
  const invitationCanada = informationsSpecifiques.invitationCanada || '';
  
  // Documents de base pour le représentant
  const documentsRepresentant = [
    'Copie de CIN',
    'Copie du passeport et des visas',
    'Photo d\'identité',
    'Dossier financier',
    'Dossier emploi'
  ];
  
  // Ajouter l'invitation si sélectionnée
  if (invitationCanada === 'Oui') {
    documentsRepresentant.push('Invitation');
    documentsRepresentant.push('Statut de l\'invitant');
  }
  
  // Logique familiale
  const aFamille = nombrePersonnes > 1 || (situationFamiliale !== 'Célibataire');
  
  if (aFamille) {
    // Générer documents pour chaque membre de la famille
    // + documents spéciaux pour enfants à charge
  }
};
```

### Structure des Documents

#### Pour le Représentant
- ✅ **Copie de CIN**
- ✅ **Copie du passeport et des visas**
- ✅ **Photo d'identité**
- ✅ **Dossier financier** (avec info-bulle contextuelle)
- ✅ **Dossier emploi**
- ✅ **Invitation** (si invitation du Canada = Oui)
- ✅ **Statut de l'invitant** (si invitation du Canada = Oui)

#### Pour les Autres Membres
- ✅ **Mêmes documents que le représentant**
- ✅ **Prise en charge** (si enfant à charge)
- ✅ **Attestation de scolarité** (si enfant à charge)

### Conditions de Génération

1. **Famille détectée si** :
   - Nombre de personnes > 1 **OU**
   - Situation familiale ≠ "Célibataire"

2. **Documents d'invitation ajoutés si** :
   - "Invitation du Canada" = "Oui"

3. **Documents enfant ajoutés si** :
   - Membre de famille (position 2 ou 3 dans l'exemple)

## Info-bulle Dossier Financier

### Icône d'Alerte
- **Symbole** : "!" rouge
- **Position** : À côté du nom "Dossier financier"
- **Comportement** : Apparaît au survol

### Contenu Contextuel
Le contenu de l'info-bulle change selon le type d'emploi sélectionné :

#### Pour Salarié
```
• Attestation de travail
• Attestation de salaire
• Attestation de congé
• Bulletins de paie
• Autres preuves de revenus (ex : contrat de bail)
```

#### Pour Entrepreneur/Investisseur
```
• Registre de commerce
• Statuts
• Justificatif de paiement des impôts
• Contrat de bail ou autres preuves de revenus
```

#### Pour Retraité
```
• Attestation de retraite
• Contrat de bail ou autres preuves de revenus
```

### Implémentation Technique

#### État de l'Info-bulle
```javascript
const [showFinancialTooltip, setShowFinancialTooltip] = useState(false);
```

#### Fonction de Contenu
```javascript
const getFinancialTooltipContent = () => {
  const emploiTypes = informationsSpecifiques.emploiTypes || [];
  let content = [];
  
  if (emploiTypes.includes('Salarié')) {
    content.push({
      title: 'Salarié :',
      items: ['Attestation de travail', 'Attestation de salaire', ...]
    });
  }
  
  // Logique pour autres types d'emploi...
  return content;
};
```

#### Affichage Conditionnel
```jsx
{documentName === 'Dossier financier' && clientData.typeProcedure === 'Visa visiteur' && (
  <div className="financial-tooltip-container">
    <span 
      className="financial-warning-icon"
      onMouseEnter={() => setShowFinancialTooltip(true)}
      onMouseLeave={() => setShowFinancialTooltip(false)}
    >
      !
    </span>
    {showFinancialTooltip && (
      <div className="financial-tooltip">
        {/* Contenu de l'info-bulle */}
      </div>
    )}
  </div>
)}
```

## Styles CSS de l'Info-bulle

### Icône d'Alerte
```css
.financial-warning-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: help;
  transition: all 0.3s ease;
}

.financial-warning-icon:hover {
  background: #c82333;
  transform: scale(1.1);
}
```

### Info-bulle
```css
.financial-tooltip {
  position: absolute;
  top: -10px;
  left: 25px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 320px;
  max-width: 400px;
  animation: fadeInTooltip 0.3s ease forwards;
}

.tooltip-content {
  padding: 15px;
  max-height: 300px;
  overflow-y: auto;
}

.tooltip-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 4px;
}

.tooltip-section ul {
  margin: 0;
  padding-left: 16px;
  list-style-type: disc;
}

.tooltip-section li {
  font-size: 13px;
  color: #555;
  line-height: 1.4;
  margin-bottom: 4px;
}
```

## Avantages

### Pour les Conseillers
- ✅ **Gain de temps** : Documents générés automatiquement
- ✅ **Réduction d'erreurs** : Plus d'oubli de documents
- ✅ **Guidage contextuel** : Info-bulle aide à la préparation
- ✅ **Adaptation familiale** : Documents ajustés selon la situation

### Pour les Clients
- ✅ **Liste claire** : Tous les documents requis visibles
- ✅ **Pas de surprise** : Documents supplémentaires pour famille
- ✅ **Détails financiers** : Info-bulle explique les pièces requises

## Exemples Pratiques

### Cas 1 : Personne Seule, Salarié, Sans Invitation
```
Documents générés :
• Copie de CIN
• Copie du passeport et des visas
• Photo d'identité
• Dossier financier (avec info-bulle Salarié)
• Dossier emploi
```

### Cas 2 : Famille de 3, Entrepreneur, Avec Invitation
```
Documents générés :
• Copie de CIN (x3)
• Copie du passeport et des visas (x3)
• Photo d'identité (x3)
• Dossier financier (avec info-bulle Entrepreneur)
• Dossier emploi (x3)
• Invitation
• Statut de l'invitant
• Prise en charge (pour enfants)
• Attestation de scolarité (pour enfants)
```

## Améliorations Futures
- **Auto-complétion** pour les pays et adresses
- **Validation avancée** des dates et montants
- **Upload de documents** directement liés aux champs
- **Calcul automatique** des fonds requis selon le nombre de personnes
- **Intégration API** pour vérification des informations
- **Template de documents** pré-remplis
- **Notifications de rappel** pour documents manquants 