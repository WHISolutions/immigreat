# Analyse des besoins pour la Gestion des Leads

## Vue d'ensemble
La page de gestion des leads permet de suivre les prospects depuis leur premier contact jusqu'à leur conversion en client. Cette fonctionnalité est cruciale pour le suivi commercial et la conversion des prospects.

## Fonctionnalités principales

### 1. Recherche et filtrage
- **Barre de recherche** permettant de retrouver rapidement un lead par:
  - Nom
  - Prénom
  - Email
  - Téléphone
- **Filtres** pour affiner les résultats par:
  - Statut (Nouveau, Contacté, À recontacter, Rendez-vous pris, Consultation effectuée, Qualifié, Non intéressé)
  - Source (Site web, LinkedIn, Facebook, Référence, etc.)
  - Conseillère assignée

### 2. Ajout de leads selon le rôle
- **Conseillères et Secrétaire**:
  - Ajout manuel de leads un par un via formulaire
- **Directeur et Administrateur**:
  - Ajout manuel de leads un par un
  - Téléversement de fichier Excel contenant une liste de leads
  - Spécification de la source pour les leads importés
  - Dispatching des leads par nombre aux conseillères et à la secrétaire

### 3. Affichage des leads
- **Tableau principal** avec les informations essentielles:
  - Nom complet
  - Adresse email
  - Numéro de téléphone
  - Source d'acquisition
  - Statut actuel
  - Date de création
  - Conseillère assignée
  - Actions possibles

### 4. Informations détaillées
- **Vue détaillée** pour chaque lead avec:
  - Toutes les informations de base
  - Intérêt principal (type de procédure d'immigration envisagée)
  - Conseillère assignée
  - Historique des interactions

### 5. Actions sur les leads
- **Actions communes**:
  - Modification des informations
  - Changement de statut
  - Ajout de notes/commentaires
- **Actions spécifiques**:
  - Suppression (réservée à l'administrateur et au directeur)
  - Assignation à une conseillère (pour les leads au nom de la secrétaire)
  - Planification de rappel (pour les leads "À recontacter")
  - Prise de rendez-vous (intégration avec le module Rendez-vous)

### 6. Statuts des leads
- **Nouveau**: Lead récemment ajouté
- **Contacté**: Premier contact établi
- **À recontacter**: Nécessite un suivi ultérieur (avec option de rappel dans le calendrier)
- **Rendez-vous pris**: Consultation planifiée
- **Consultation effectuée**: Entretien réalisé
- **Qualifié**: Prospect intéressé et éligible
- **Non intéressé**: Prospect ne souhaitant pas poursuivre

## Permissions selon les rôles

### Administrateur et Directeur
- Accès complet à tous les leads
- Ajout manuel et import Excel
- Dispatching des leads aux conseillères
- Modification et suppression de leads
- Visualisation de statistiques globales

### Conseillères
- Accès à leurs propres leads
- Ajout manuel de leads
- Modification de leurs leads
- Changement de statut
- Planification de rappels et rendez-vous

### Secrétaire
- Accès à tous les leads non assignés
- Ajout manuel de leads
- Assignation des leads aux conseillères
- Planification de rendez-vous

## Considérations techniques
- Validation des données lors de l'ajout manuel et de l'import Excel
- Gestion des doublons lors de l'import
- Intégration avec le module de rendez-vous pour la planification
- Notifications pour les rappels planifiés
- Historique des modifications pour chaque lead
- Exportation des données filtrées au format Excel/CSV
