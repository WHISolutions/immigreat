# 📝 Guide d'utilisation des Notes Client

## 🎯 Fonctionnalité implémentée

L'onglet "Notes" a été ajouté au modal de détails du client. Maintenant, quand vous cliquez sur "Voir détails" dans la gestion des clients, vous verrez toutes les informations du client **ET** ses notes.

## 🔧 Comment démarrer le serveur

Au lieu d'utiliser `node server.js` depuis le dossier racine, utilisez :

```bash
# Option 1 : Démarrer depuis le dossier backend
cd backend
node server.js

# Option 2 : Utiliser le script batch
start-server.bat
```

## 📋 Format des notes

Les notes sont stockées en format JSON dans la base de données avec cette structure :

```json
[
  {
    "id": 1,
    "date": "2025-01-05",
    "type": "Suivi",
    "auteur": "Marie Tremblay",
    "contenu": "Première consultation avec le client..."
  },
  {
    "id": 2,
    "date": "2025-01-08",
    "type": "Important",
    "auteur": "Sophie Martin",
    "contenu": "Vérification des documents soumis..."
  }
]
```

## 🏷️ Types de notes supportés

- **Général** : Notes standard (gris)
- **Important** : Notes importantes (orange)
- **Urgent** : Notes urgentes (rouge)
- **Suivi** : Notes de suivi (bleu)

## 🧪 Tester avec des notes d'exemple

Pour ajouter des notes de test à un client existant :

```bash
cd backend
node add-test-notes.js
```

## 🔄 Comment ça fonctionne

1. Les notes sont récupérées automatiquement avec les données du client via l'API
2. Le modal affiche les notes triées par date (plus récentes en premier)
3. Si aucune note n'existe, un message informatif est affiché
4. Les notes sont formatées avec couleurs selon leur type

## 💡 Prochaines améliorations possibles

- Ajouter la possibilité d'ajouter des notes depuis l'interface
- Modifier ou supprimer des notes existantes
- Notifications automatiques lors de l'ajout de notes
- Filtres par type ou auteur de notes

## 🎉 Résultat

Maintenant, quand vous cliquez sur "Voir détails" dans la gestion des clients, vous verrez **toutes** les informations du client y compris ses notes dans un affichage professionnel et organisé ! 