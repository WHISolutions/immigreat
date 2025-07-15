@echo off
echo.
echo ======================================
echo Test d'integration de la base de donnees
echo ======================================
echo.

echo Demarrage des tests...
echo.

echo Test 1: Informations specifiques Permis de travail
node test-informations-specifiques.js
echo.

echo Test 2: Toutes les procedures
node test-all-procedures.js
echo.

echo Tests termines!
pause 