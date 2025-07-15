# Analyse des besoins pour le Tableau de Bord personnalisé

## Vue d'ensemble
Le tableau de bord doit être personnalisé selon le profil de l'utilisateur connecté, avec des informations et fonctionnalités spécifiques à chaque rôle.

## Profils utilisateurs et besoins spécifiques

### 1. Administrateur et Directeur
- **Compteurs principaux**:
  - Nombre total de clients
  - Nombre de leads
  - Nombre de dossiers actifs
  - Nombre de factures impayées
  - Total des ventes pour tout le bureau
  - Total des ventes par conseillère
- **Indicateurs d'évolution** pour chaque compteur
- **Section "Rendez-vous à venir"** pour toutes les conseillères
- **Section "Activités récentes"** de tout le système
- **Filtres de données**: semaine, mois, trimestre, année

### 2. Conseillères
- **Compteurs personnels** (cliquables pour redirection):
  - Nombre de clients personnels
  - Nombre de leads personnels
  - Nombre de dossiers personnels en cours
  - Nombre de factures impayées de ses clients
- **Section "Mes rendez-vous à venir"**
- **Section "Mes activités récentes"**
- **Indicateurs de performance**:
  - Nombre de consultations réalisées
  - Nombre de ventes conclues
- **Notifications** pour les tâches en attente

### 3. Comptable
- **Compteurs financiers**:
  - Total des ventes
  - Factures impayées
  - Revenus par période
- **Section "Dernières factures"**
- **Section "Paiements récents"**
- **Section "Charges"** (factures de charges téléversées par le directeur)

### 4. Secrétaire
- **Compteurs**:
  - Leads à traiter
  - Rendez-vous du jour pour tout le bureau
- **Section "Rendez-vous du jour"** pour tout le bureau
- **Section "Nouveaux leads"**

## Fonctionnalités communes
- Navigation via menu latéral
- Compteurs cliquables redirigeant vers les pages correspondantes
- Affichage adapté au rôle de l'utilisateur

## Interactions et navigation
- Clic sur un compteur: redirection vers la page correspondante
- Filtres temporels: mise à jour dynamique des données affichées
- Notifications: alertes visuelles pour les tâches en attente

## Considérations techniques
- Détection du rôle utilisateur à la connexion
- Chargement conditionnel des composants selon le rôle
- Requêtes API filtrées selon le rôle et les permissions
- Mise en cache des données fréquemment consultées
