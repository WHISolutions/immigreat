@echo off
echo 🚀 Démarrage du système de journaux d'activité...
echo.

echo 📋 Étape 1: Initialisation de la base de données...
cd backend
node init-activity-logs.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'initialisation
    pause
    exit /b 1
)

echo.
echo 🧪 Étape 2: Test du système...
node test-activity-logs.js
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du test
    pause
    exit /b 1
)

echo.
echo ✅ Système initialisé avec succès!
echo.
echo 🎯 Instructions pour utiliser les journaux d'activité:
echo.
echo 1. Démarrez le backend:
echo    cd backend ^&^& npm run dev
echo.
echo 2. Démarrez le frontend (dans un autre terminal):
echo    cd frontend ^&^& npm start
echo.
echo 3. Connectez-vous en tant qu'administrateur:
echo    Email: admin@test.com
echo    Mot de passe: admin123
echo.
echo 4. Cliquez sur "Journaux d'activité" dans le menu de gauche
echo.
echo 5. Testez les fonctionnalités:
echo    - Filtres par action/entité/date
echo    - Pagination
echo    - Export CSV
echo    - Expansion des détails
echo.
echo 💡 Les logs sont automatiquement créés lors des actions CRUD sur les clients et leads.
echo.
pause
