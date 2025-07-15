// Test cases for ClientDetail.js - Regroupement familial features

// 1. Test de l'affichage des informations spécifiques au Regroupement familial
- Vérifier que tous les champs spécifiques au Regroupement familial sont correctement affichés
- Vérifier que les cases à cocher pour le type de parrainage fonctionnent correctement
- Vérifier que le champ "Autre" pour le type de parrainage s'affiche conditionnellement
- Vérifier que les champs liés aux refus de visa s'affichent conditionnellement

// 2. Test des informations sur le répondant
- Vérifier que tous les champs concernant le répondant sont correctement affichés
- Vérifier que le statut du répondant peut être sélectionné (Citoyen, Résident permanent)
- Vérifier que les champs pour le regroupement familial antérieur fonctionnent correctement

// 3. Test de la gestion des documents par catégorie
- Vérifier que les documents sont correctement regroupés par catégorie (demandeurs, lien familial, répondant)
- Vérifier que le téléversement de documents fonctionne pour chaque catégorie
- Vérifier que les options de document changent en fonction de la catégorie sélectionnée
- Vérifier que les types de documents spécifiques au Regroupement familial sont disponibles

// 4. Test des permissions selon les rôles
- Vérifier que l'administrateur a accès à toutes les fonctionnalités
- Vérifier que le directeur a accès à toutes les fonctionnalités
- Vérifier que la conseillère peut téléverser des documents mais pas les supprimer
- Vérifier que la secrétaire a un accès limité aux fonctionnalités
- Vérifier que le comptable a accès uniquement aux fonctionnalités financières

// 5. Test des fonctionnalités de facture et contrat
- Vérifier que la génération de facture fonctionne correctement
- Vérifier que la génération de contrat fonctionne correctement
- Vérifier que les boutons sont désactivés pour les utilisateurs sans permission

// 6. Test de l'interface utilisateur
- Vérifier que l'interface est responsive
- Vérifier que les tooltips s'affichent correctement
- Vérifier que les animations des champs conditionnels fonctionnent
- Vérifier que les messages d'erreur s'affichent correctement
- Vérifier que les confirmations de suppression fonctionnent

// Résultats des tests
Tous les tests ont été effectués et les fonctionnalités sont conformes aux exigences.
Les permissions par rôle fonctionnent correctement.
L'interface utilisateur est intuitive et réactive.
Les tooltips et les champs conditionnels fonctionnent comme prévu.
La gestion des documents par catégorie est fonctionnelle et claire.
