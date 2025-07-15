# Analyse du Processus de Gestion des Leads

## Vue d'ensemble
Ce document détaille le processus complet de gestion des leads, depuis leur création jusqu'à leur conversion en clients, en précisant les responsabilités de chaque rôle et les automatisations nécessaires.

## Étapes du processus

### 1. Création du lead
**Méthodes de création:**
- **Formulaire web** (automatique)
- **Ajout manuel** (par conseillère ou secrétaire)
- **Import Excel** (par directeur ou administrateur)

**Automatisations requises:**
- Création automatique depuis le formulaire web
- Interface d'import Excel avec distribution par lot

### 2. Attribution du lead
**Processus:**
- Lead créé avec statut "Nouveau"
- Notification envoyée à l'administrateur
- Attribution possible:
  - Individuelle (par lead)
  - Par lot (10, 20 leads à la fois)
  - Distribution par nombre aux conseillères/secrétaire

**Automatisations requises:**
- Système de notifications
- Interface de sélection multiple pour attribution par lot
- Mécanisme de distribution automatique

### 3. Premier contact
**Actions possibles:**
- Mise à jour du statut selon le résultat:
  - "Contacté" (personne a répondu)
  - "À recontacter" (pas de réponse ou rappel demandé)
  - "Pas intéressé" (lead ne souhaite pas poursuivre)
  - "Rendez-vous pris" (lead souhaite un rendez-vous)

**Automatisations requises:**
- Historique des tentatives de contact
- Planification de rappels dans le calendrier

### 4. Prise de rendez-vous
**Processus:**
- Changement de statut en "Rendez-vous pris"
- Création automatique d'un événement dans le calendrier
- Enregistrement des détails (date, heure, type de consultation)

**Automatisations requises:**
- Intégration avec le module de rendez-vous
- Création automatique d'événements calendrier

### 5. Rappel avant rendez-vous
**Processus:**
- Notification envoyée à la conseillère la veille du rendez-vous
- Rappel d'envoyer un SMS de confirmation au lead

**Automatisations requises:**
- Système de notifications programmées
- Modèles de SMS pré-rédigés

### 6. Consultation
**Actions possibles:**
- Changement de statut en "Consultation effectuée" (vert) si présent
- Changement de statut en "Consultation manquée" (rouge) si absent

**Automatisations requises:**
- Mise à jour du statut avec code couleur
- Suivi des consultations effectuées/manquées

### 7. Évaluation post-consultation
**Processus:**
- Évaluation de l'admissibilité aux procédures d'immigration
- Mise à jour du statut en "Qualifié" ou "Non qualifié"
- Ajout de notes détaillées sur les procédures recommandées

**Automatisations requises:**
- Champs pour documenter l'évaluation
- Lien vers les procédures recommandées

### 8. Conversion en client
**Processus:**
- Changement de statut en "Client" après paiement initial
- Ajout automatique à la liste des clients
- Conservation dans l'historique des leads

**Automatisations requises:**
- Transfert automatique vers le module clients
- Lien entre l'enregistrement client et l'historique lead

### 9. Dispatch après consultation (cas spécifique)
**Processus:**
- Pour les consultations gérées par la secrétaire
- Attribution obligatoire à une conseillère après consultation
- La secrétaire ne doit pas avoir de clients assignés

**Automatisations requises:**
- Rappel/alerte pour l'attribution post-consultation
- Validation empêchant la secrétaire de conserver des clients

## Statuts des leads
1. **Nouveau** - Lead récemment créé
2. **Contacté** - Premier contact établi
3. **À recontacter** - Nécessite un suivi ultérieur
4. **Rendez-vous pris** - Consultation planifiée
5. **Consultation effectuée** - Entretien réalisé
6. **Consultation manquée** - Lead absent au rendez-vous
7. **Qualifié** - Éligible aux procédures d'immigration
8. **Non qualifié** - Non éligible aux procédures
9. **Pas intéressé** - Ne souhaite pas poursuivre
10. **Client** - Converti en client payant

## Notifications requises
1. Nouveau lead créé
2. Lead assigné à une conseillère
3. Rappel de rendez-vous (veille)
4. Consultation manquée
5. Lead converti en client

## Intégrations nécessaires
1. Module de rendez-vous (calendrier)
2. Module de clients
3. Système de SMS
4. Système de notifications
