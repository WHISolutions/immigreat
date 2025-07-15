## Plan de test manuel - Fonctionnalités Visa Visiteur

### 1. Test des informations spécifiques au Visa Visiteur

#### Affichage des champs
- [ ] Vérifier que tous les champs spécifiques sont affichés correctement
- [ ] Vérifier que les fonds disponibles sont affichés
- [ ] Vérifier que la situation familiale est affichée
- [ ] Vérifier que le nombre de personnes dans la demande est affiché
- [ ] Vérifier que la date prévue du voyage est affichée

#### Cases à cocher pour l'emploi
- [ ] Vérifier que les options Salarié, Entrepreneur, Retraité et Autre sont présentes
- [ ] Vérifier que les cases cochées reflètent correctement les données du client
- [ ] Vérifier que le champ "Autre" affiche le détail si cette option est sélectionnée

#### Champs conditionnels
- [ ] Vérifier que le champ "Lien de parenté avec l'invitant" s'affiche uniquement si "Invitation du Canada" = Oui
- [ ] Vérifier que le champ "Représentant principal" s'affiche uniquement si "Nombre de personnes dans la demande" > 1
- [ ] Vérifier que le champ "Détails des refus" s'affiche uniquement si "Visas ou refus antérieurs" = Oui

### 2. Test de la gestion des documents par membre

#### Organisation des documents
- [ ] Vérifier que les documents généraux sont affichés dans une section distincte
- [ ] Vérifier que les documents de chaque membre sont regroupés dans des sections distinctes
- [ ] Vérifier que le nom et le rôle du membre sont clairement indiqués dans l'en-tête de chaque section

#### Téléversement de documents
- [ ] Vérifier que le sélecteur "Pour qui ?" permet de choisir entre document général et documents par membre
- [ ] Vérifier que les types de documents proposés changent en fonction du membre sélectionné
- [ ] Vérifier que l'option "Autre" permet d'ajouter une description personnalisée
- [ ] Vérifier que le téléversement ajoute correctement le document à la section appropriée

#### Infobulles et aides
- [ ] Vérifier que l'infobulle pour "Dossier financier" s'affiche au survol
- [ ] Vérifier que le contenu de l'infobulle est complet et lisible

### 3. Test des permissions selon les rôles

#### Administrateur et Directeur
- [ ] Vérifier qu'ils peuvent téléverser des documents
- [ ] Vérifier qu'ils peuvent supprimer des documents
- [ ] Vérifier qu'ils peuvent générer des factures
- [ ] Vérifier qu'ils peuvent générer des contrats

#### Conseillère
- [ ] Vérifier qu'elle peut téléverser des documents
- [ ] Vérifier qu'elle ne peut pas supprimer des documents
- [ ] Vérifier qu'elle peut générer des contrats
- [ ] Vérifier qu'elle ne peut pas générer des factures

#### Comptable
- [ ] Vérifier qu'il peut générer des factures
- [ ] Vérifier qu'il ne peut pas générer des contrats
- [ ] Vérifier qu'il ne peut pas téléverser ou supprimer des documents

#### Secrétaire
- [ ] Vérifier qu'elle a un accès en lecture seule
- [ ] Vérifier qu'elle ne peut pas téléverser ou supprimer des documents
- [ ] Vérifier qu'elle ne peut pas générer des factures ou des contrats

### 4. Test des fonctionnalités de facture et contrat

#### Génération de facture
- [ ] Vérifier que le formulaire de facture s'affiche correctement
- [ ] Vérifier que tous les champs peuvent être remplis
- [ ] Vérifier que la facture générée contient toutes les informations saisies
- [ ] Vérifier que la facture est ajoutée à la liste des factures du client

#### Génération de contrat
- [ ] Vérifier que le formulaire de contrat s'affiche correctement
- [ ] Vérifier que tous les champs peuvent être remplis
- [ ] Vérifier que le contrat généré contient toutes les informations saisies
- [ ] Vérifier que le contrat est mentionné dans l'historique du client

### 5. Test des cas particuliers

#### Multiples membres dans la demande
- [ ] Vérifier le comportement avec 2 membres (couple)
- [ ] Vérifier le comportement avec une famille (parents + enfants)
- [ ] Vérifier que les documents spécifiques aux enfants à charge sont disponibles

#### Documents personnalisés
- [ ] Vérifier que les documents de type "Autre" sont correctement affichés avec leur description
- [ ] Vérifier que la description est obligatoire pour les documents de type "Autre"
- [ ] Vérifier que plusieurs documents "Autre" peuvent être ajoutés

### 6. Test de l'interface utilisateur

#### Responsive design
- [ ] Vérifier l'affichage sur un écran large
- [ ] Vérifier l'affichage sur un écran moyen (tablette)
- [ ] Vérifier l'affichage sur un petit écran (mobile)

#### Interactions utilisateur
- [ ] Vérifier que les tooltips s'affichent au survol
- [ ] Vérifier que les animations des champs conditionnels sont fluides
- [ ] Vérifier que les messages de confirmation de suppression s'affichent
- [ ] Vérifier que les messages d'erreur s'affichent en cas de formulaire incomplet
