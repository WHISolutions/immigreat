# Guide de Test - Ventes par Conseillère

## ✅ Système Implémenté

Le système permet maintenant à chaque conseillère de voir **ses propres factures** dans son tableau de bord personnel.

## 🔧 APIs Disponibles

### 1. `/api/dashboard/ventes-conseilleres` (Admin/Directeur)
- Affiche les ventes de **toutes** les conseillères
- Utilisé dans le tableau de bord admin/directeur

### 2. `/api/dashboard/mes-ventes` (Conseillères)
- Affiche les ventes d'**une conseillère spécifique**
- Utilisé dans le tableau de bord des conseillères

## 📊 Données de Test Actuelles

**Factures assignées :**
- **Marie T.** : F2025-002 (1 500$ HT = 1 725$ TTC)
- **Sophie M.** : F2025-003 (1 580$ HT = 1 817$ TTC)  
- **Julie L.** : F2025-001 (200$ HT = 230$ TTC)

## 🧪 Comment Tester

### 1. Interface Web
1. **Ouvrir** http://localhost:3000
2. **Se connecter** avec le rôle `conseillere`
3. **Utiliser un nom** correspondant aux conseillères (`Marie T.`, `Sophie M.`, ou `Julie L.`)
4. **Aller** au Tableau de bord
5. **Vérifier** que la section "Mes Ventes" affiche les bonnes données

### 2. Test API Direct
```bash
# Pour Marie T.
curl "http://localhost:5000/api/dashboard/mes-ventes?conseillere=Marie%20T.&periode=mois"

# Pour Sophie M.  
curl "http://localhost:5000/api/dashboard/mes-ventes?conseillere=Sophie%20M.&periode=mois"

# Pour Julie L.
curl "http://localhost:5000/api/dashboard/mes-ventes?conseillere=Julie%20L.&periode=mois"
```

## 📱 Interface Conseillère

Chaque conseillère voit maintenant :

### Section "Mes Ventes"
- **Mon Total TTC** : Montant total avec TVA
- **Factures Payées** : Nombre de factures payées
- **En Attente** : Nombre de factures en attente

### Section "Mes Factures"  
- **Tableau** avec toutes ses factures
- **Filtres** par période (Jour/Semaine/Mois)
- **Détails** : Numéro, Client, Montant TTC, Statut, Date

### Fonctionnalités
- **🔄 Chargement temps réel** des données
- **📅 Filtrage par période** automatique
- **🎯 Données personnalisées** selon la conseillère connectée

## 🔍 Résultats Attendus

### Marie T.
- Total TTC : **1 725,00 $**
- Factures : **1**
- En attente : **1**

### Sophie M.
- Total TTC : **1 817,00 $**
- Factures : **1**  
- En attente : **1**

### Julie L.
- Total TTC : **230,00 $**
- Factures : **1**
- En attente : **1**

## ✨ Fonctionnement

1. **Connexion** : L'utilisateur se connecte avec son nom
2. **Chargement** : Le système charge automatiquement SES factures
3. **Affichage** : Seules les factures où `validePar = userName` sont affichées
4. **Calculs** : Montants TTC calculés automatiquement (HT × 1.15)
5. **Mise à jour** : Données mises à jour en temps réel selon la période sélectionnée

## 🚀 Prêt pour Production

Le système est maintenant **fonctionnel** et prêt pour l'utilisation en production avec :
- ✅ Données réelles depuis la base de données
- ✅ Calculs TTC corrects  
- ✅ Interface personnalisée par conseillère
- ✅ Filtrage par période
- ✅ Affichage temps réel 