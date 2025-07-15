@echo off
echo 🧾 Test du serveur avec système de facturation
echo =============================================

echo.
echo 📊 Étape 1: Exécution des migrations...
call npx sequelize-cli db:migrate
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la migration
    pause
    exit /b 1
)

echo.
echo ✅ Migrations terminées !

echo.
echo 🚀 Étape 2: Démarrage du serveur...
echo 💡 Le serveur va démarrer avec le système de facturation automatique
echo 💡 Surveillez les logs pour voir les messages de facturation
echo.

node server.js 