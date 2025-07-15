## Plan de test manuel - Fonctionnalités Permis de travail

### 1. Test des informations spécifiques au Permis de travail

#### Informations personnelles supplémentaires
- [ ] Vérifier que la situation familiale est correctement affichée
- [ ] Vérifier que le nombre de personnes dans la demande est affiché
- [ ] Vérifier que le champ "Représentant principal" s'affiche uniquement si "Nombre de personnes dans la demande" > 1

#### Informations professionnelles
- [ ] Vérifier que les options d'emploi actuel (Salarié, Entrepreneur, Retraité, Autre) sont présentes
- [ ] Vérifier que le champ "Autre" affiche le détail si cette option est sélectionnée
- [ ] Vérifier que la liste des postes occupés s'affiche correctement
- [ ] Vérifier que l'ajout d'un nouveau poste fonctionne
- [ ] Vérifier que la suppression d'un poste fonctionne
- [ ] Vérifier que la liste des diplômes s'affiche correctement
- [ ] Vérifier que l'ajout d'un nouveau diplôme fonctionne
- [ ] Vérifier que la suppression d'un diplôme fonctionne
- [ ] Vérifier que les compétences linguistiques sont affichées
- [ ] Vérifier que la liste des tests de langue s'affiche correctement
- [ ] Vérifier que l'ajout d'un nouveau test de langue fonctionne
- [ ] Vérifier que la suppression d'un test de langue fonctionne

#### Offre d'emploi au Canada
- [ ] Vérifier que le champ "Offre d'emploi au Canada" est affiché
- [ ] Vérifier que les détails de l'employeur s'affichent uniquement si "Offre d'emploi au Canada" = Oui
- [ ] Vérifier que tous les champs de détails de l'employeur sont présents (nom, adresse, poste, province, durée, numéro d'offre)

#### Informations spécifiques au programme
- [ ] Vérifier que les options de type de permis (fermé, ouvert, post-diplôme, autre) sont présentes
- [ ] Vérifier que le champ "Autre" affiche le détail si cette option est sélectionnée
- [ ] Vérifier que la province visée est affichée
- [ ] Vérifier que la date prévue de départ est affichée

#### Informations financières et antécédents
- [ ] Vérifier que les fonds disponibles sont affichés
- [ ] Vérifier que les voyages antérieurs sont affichés
- [ ] Vérifier que les visas précédemment obtenus sont affichés
- [ ] Vérifier que le champ "Refus antérieurs" est affiché
- [ ] Vérifier que le champ "Détails des refus" s'affiche uniquement si "Refus antérieurs" = Oui
- [ ] Vérifier que le champ "Remarques" est affiché

### 2. Test de la gestion des documents par membre

#### Organisation des documents
- [ ] Vérifier que les documents généraux sont affichés dans une section distincte
- [ ] Vérifier que les documents de chaque membre sont regroupés dans des sections distinctes
- [ ] Vérifier que le nom et le rôle du membre sont clairement indiqués dans l'en-tête de chaque section

#### Téléversement de documents
- [ ] Vérifier que le sélecteur "Pour qui ?" permet de choisir entre document général et documents par membre
- [ ] Vérifier que les types de documents proposés changent en fonction du membre sélectionné
- [ ] Vérifier que les types de documents spécifiques au Permis de travail sont disponibles
- [ ] Vérifier que l'option "Autre" permet d'ajouter une description personnalisée
- [ ] Vérifier que le téléversement ajoute correctement le document à la section appropriée

#### Infobulles et aides
- [ ] Vérifier que l'infobulle pour "Dossier financier" s'affiche au survol
- [ ] Vérifier que le contenu de l'infobulle est complet et lisible

### 3. Test des permissions selon les rôles

#### Administrateur et Directeur
- [ ] Vérifier qu'ils peuvent ajouter/supprimer des postes, diplômes et tests de langue
- [ ] Vérifier qu'ils peuvent téléverser des documents
- [ ] Vérifier qu'ils peuvent supprimer des documents
- [ ] Vérifier qu'ils peuvent générer des factures
- [ ] Vérifier qu'ils peuvent générer des contrats

#### Conseillère
- [ ] Vérifier qu'elle peut ajouter/supprimer des postes, diplômes et tests de langue
- [ ] Vérifier qu'elle peut téléverser des documents
- [ ] Vérifier qu'elle ne peut pas supprimer des documents
- [ ] Vérifier qu'elle peut générer des contrats
- [ ] Vérifier qu'elle ne peut pas générer des factures

#### Comptable
- [ ] Vérifier qu'il ne peut pas ajouter/supprimer des postes, diplômes et tests de langue
- [ ] Vérifier qu'il peut générer des factures
- [ ] Vérifier qu'il ne peut pas générer des contrats
- [ ] Vérifier qu'il ne peut pas téléverser ou supprimer des documents

#### Secrétaire
- [ ] Vérifier qu'elle a un accès en lecture seule
- [ ] Vérifier qu'elle ne peut pas ajouter/supprimer des postes, diplômes et tests de langue
- [ ] Vérifier qu'elle ne peut pas téléverser ou supprimer des documents
- [ ] Vérifier qu'elle ne peut pas générer des factures ou des contrats

### 4. Test des cas particuliers

#### Multiples éléments
- [ ] Vérifier le comportement avec plusieurs postes occupés
- [ ] Vérifier le comportement avec plusieurs diplômes
- [ ] Vérifier le comportement avec plusieurs tests de langue
- [ ] Vérifier le comportement avec plusieurs membres dans la demande

#### Documents personnalisés
- [ ] Vérifier que les documents de type "Autre" sont correctement affichés avec leur description
- [ ] Vérifier que la description est obligatoire pour les documents de type "Autre"
- [ ] Vérifier que plusieurs documents "Autre" peuvent être ajoutés

### 5. Test de l'interface utilisateur

#### Responsive design
- [ ] Vérifier l'affichage sur un écran large
- [ ] Vérifier l'affichage sur un écran moyen (tablette)
- [ ] Vérifier l'affichage sur un petit écran (mobile)

#### Interactions utilisateur
- [ ] Vérifier que les tooltips s'affichent au survol
- [ ] Vérifier que les animations des champs conditionnels sont fluides
- [ ] Vérifier que les messages de confirmation de suppression s'affichent
- [ ] Vérifier que les messages d'erreur s'affichent en cas de formulaire incomplet
