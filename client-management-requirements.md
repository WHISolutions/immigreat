# Analyse des besoins pour la gestion des clients

## Vue d'ensemble
Ce document détaille les exigences pour le module de gestion des clients du bureau d'immigration, incluant la page principale de gestion et les fiches détaillées des clients avec leurs différentes procédures.

## 1. Page principale de gestion des clients

### 1.1 Présentation générale
La page de gestion des clients permet de visualiser et gérer l'ensemble des clients du bureau d'immigration. Elle présente un tableau récapitulatif avec les informations essentielles et donne accès aux fiches détaillées de chaque client.

### 1.2 Fonctionnalités principales
- **Barre de recherche avancée** pour retrouver rapidement un client par:
  - Nom
  - Prénom
  - Email
  - Téléphone
  - Numéro de dossier

- **Filtres** pour affiner les résultats par:
  - Type de procédure (Études, Travail, Résidence permanente, etc.)
  - Statut du dossier (En cours, Terminé, En attente, etc.)
  - Conseillère assignée

- **Bouton "Nouveau client"** pour créer manuellement une nouvelle fiche client

- **Tableau principal** affichant:
  - Nom complet
  - Coordonnées
  - Type de procédure
  - Date de création du dossier
  - Statut actuel
  - Conseillère assignée
  - Indicateurs visuels (icônes et codes couleur)

## 2. Fiche client détaillée

### 2.1 Structure en onglets
La fiche client détaillée est organisée en plusieurs onglets:

1. **Informations personnelles**
   - Coordonnées complètes
   - Informations d'identité
   - Situation familiale

2. **Procédure**
   - Type de procédure d'immigration
   - Formulaires spécifiques selon le type choisi

3. **Documents**
   - Liste des documents fournis et à fournir
   - Système de téléversement

4. **Historique**
   - Journal chronologique de toutes les interactions et modifications

5. **Factures**
   - Liste des factures émises pour ce client avec leur statut

6. **Rendez-vous**
   - Historique et planification des rendez-vous

7. **Notes**
   - Espace pour les remarques et observations des conseillères

### 2.2 Informations administratives communes
- Type de procédure (à sélectionner parmi les options)
- Date d'inscription
- Conseillère assignée

### 2.3 Informations personnelles communes
- Nom
- Prénom
- Date de naissance
- Coordonnées (téléphone, email, adresse complète)
- Coordonnées d'une personne de contact alternative
- Nationalité
- Login client
- Mot de passe client

### 2.4 Fonctionnalités associées
- Bouton "Facture": Permet de créer/modifier une facture pour le client
- Bouton "Contrat": Permet de générer/modifier un contrat pour le client

## 3. Types de procédures spécifiques

### 3.1 Visa Visiteur
#### Informations spécifiques
- Fonds disponibles en compte
- Situation familiale
- Nombre de personnes dans la demande
- Date prévue du voyage
- Emploi (Salarié, Entrepreneur, Retraité, Autre)
- Invitation du Canada (Oui/Non)
- Lien de parenté avec l'invitant (si applicable)
- Représentant principal (si famille/groupe)
- Voyages antérieurs à l'étranger
- Visas/refus antérieurs

#### Documents à téléverser
- Copie de CIN
- Copie du passeport et visas antérieurs
- Invitation (si applicable)
- Statut de l'invitant (si applicable)
- Dossier financier
- Dossier emploi
- Photo d'identité
- Documents supplémentaires pour autres membres
- Documents spécifiques pour enfants à charge

### 3.2 Permis de travail
#### Informations spécifiques
- Informations personnelles supplémentaires
- Informations professionnelles détaillées
- Offre d'emploi au Canada (si applicable)
- Type de permis de travail visé
- Province visée
- Date prévue de départ
- Fonds disponibles
- Antécédents de voyage

#### Documents à téléverser
- Documents d'identité
- Dossier financier
- Dossier d'emploi
- Contrat de travail (si applicable)
- Certificats et examens médicaux
- Documents pour membres de la famille

### 3.3 Permis d'étude
#### Informations spécifiques
- Informations académiques détaillées
- Programme d'études souhaité
- Établissement(s) visé(s)
- Province visée
- Date prévue de début
- Informations sur le(s) garant(s)
- Antécédents de voyage

#### Documents à téléverser
- Documents d'identité
- Dossier financier
- Diplômes et relevés de notes
- Lettre d'admission
- Documents académiques supplémentaires
- Certificats et documents provinciaux

### 3.4 Investisseur
#### Informations spécifiques
- Informations professionnelles et entrepreneuriales
- Type de programme d'investisseur visé
- Plan d'affaires et investissement prévu
- Informations financières détaillées
- Antécédents de voyage

#### Documents à téléverser
- Documents d'identité
- Dossier financier complet
- Documents d'entreprise
- Plan d'affaires
- Certificats et examens médicaux
- Documents pour membres de la famille

### 3.5 Regroupement familial
#### Informations spécifiques
- Lien de parenté avec le répondant
- Informations complètes sur le répondant
- Type de parrainage
- Province de destination
- Capacité financière du répondant
- Antécédents de voyage

#### Documents à téléverser
- Documents d'identité pour chaque demandeur
- Documents prouvant le lien familial
- Documents du répondant
- Certificats et examens médicaux
- Documents pour enfants à charge

### 3.6 Résidence permanente
#### Informations spécifiques
- Procédure visée (Arrima, Entrée Express, etc.)
- Informations professionnelles et académiques détaillées
- Compétences linguistiques et tests
- Programme spécifique visé
- Informations financières
- Antécédents de voyage
- Famille au Canada

#### Documents à téléverser
- Documents d'identité
- Diplômes et évaluations
- Preuves d'expérience professionnelle
- Résultats des tests de langue
- Certificats et examens médicaux
- Documents pour membres de la famille

## 4. Gestion des documents
- Possibilité d'ajouter des documents "Autre" avec description
- Champ de commentaire associé pour préciser la nature du document
- Fonctionnalités de gestion (visualisation, téléchargement, suppression)
- Identification claire dans la liste des documents du client
- Inclusion dans les exports et rapports documentaires

## 5. Exigences techniques
- Interface intuitive et réactive
- Validation des champs obligatoires
- Sauvegarde automatique des modifications
- Gestion des permissions selon le rôle utilisateur
- Système de notification pour documents manquants ou expirés
