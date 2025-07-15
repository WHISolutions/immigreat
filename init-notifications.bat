@echo off
echo 🚀 Initialisation du systeme de notifications...
echo.

cd /d "%~dp0"

echo 📦 Installation des dependances (si necessaire)...
npm install

echo 📱 Creation de la table notifications et des donnees de test...
node init-notifications.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Systeme de notifications initialise avec succes !
    echo.
    echo 🔔 Le systeme de notifications est maintenant pret:
    echo    - Table notifications creee dans la base de donnees
    echo    - Notifications de demonstration ajoutees
    echo    - API notifications disponible sur /api/notifications
    echo.
    echo 💡 Vous pouvez maintenant:
    echo    1. Demarrer le serveur backend: npm run dev
    echo    2. Demarrer le frontend: npm start
    echo    3. Ouvrir l'application et voir les notifications en temps reel
    echo.
) else (
    echo.
    echo ❌ Erreur lors de l'initialisation
    echo Verifiez les logs ci-dessus pour plus de details
    echo.
)

pause
