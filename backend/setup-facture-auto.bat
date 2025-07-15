@echo off
echo 🧾 Configuration du système de facturation automatique
echo ================================================

echo.
echo 📊 Étape 1: Exécution de la migration pour améliorer la structure des factures...
npx sequelize-cli db:migrate
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la migration
    pause
    exit /b 1
)

echo.
echo ✅ Migration terminée avec succès !

echo.
echo 🧪 Étape 2: Test du système de création automatique de factures...
node test-facture-auto.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du test
    pause
    exit /b 1
)

echo.
echo ✅ Test terminé avec succès !

echo.
echo 🎉 Le système de facturation automatique est prêt !
echo.
echo 📋 Prochaines étapes:
echo   - Créer un nouveau client via l'API
echo   - Vérifier qu'une facture est automatiquement générée
echo   - Consulter la documentation: FACTURE_AUTOMATIQUE_README.md
echo.
echo 🔧 Commandes utiles:
echo   - Voir les factures: SELECT * FROM Factures;
echo   - Voir les clients: SELECT * FROM Clients;
echo   - Tester manuellement: node test-facture-auto.js
echo.
pause 