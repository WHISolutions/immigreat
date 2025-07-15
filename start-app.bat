@echo off
echo ========================================
echo   APPLICATION DE GESTION D'IMMIGRATION
echo ========================================
echo.
echo Nouvelle fonctionnalite : CONVERSION LEAD EN CLIENT
echo - Bouton "Convertir en client" dans le menu d'actions (⋮)
echo - Generation automatique du numero de dossier (CL-AAAA-NNN)
echo - Historique des conversions disponible
echo.
echo Demarrage de l'application...
echo.

echo [1/2] Demarrage du serveur backend (port 5000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Demarrage du frontend React (port 3000)...
start "Frontend React" cmd /k "cd frontend && npm start"

echo.
echo ========================================
echo   APPLICATIONS DEMARREES
echo ========================================
echo.
echo Backend API : http://localhost:5000
echo Frontend    : http://localhost:3000
echo.
echo Pour tester la conversion de leads :
echo 1. Allez sur http://localhost:3000
echo 2. Naviguez vers "Gestion des Leads"
echo 3. Cliquez sur le menu (⋮) d'un lead
echo 4. Selectionnez "Convertir en client"
echo 5. Consultez l'historique dans l'onglet "Historique des Conversions"
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul 