# Script PowerShell pour initialiser le système de notifications
Write-Host "🚀 Initialisation du système de notifications..." -ForegroundColor Cyan
Write-Host ""

# Changer vers le répertoire du script
Set-Location $PSScriptRoot

try {
    Write-Host "📦 Vérification des dépendances..." -ForegroundColor Yellow
    
    # Vérifier que Node.js est installé
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Node.js n'est pas installé ou pas dans le PATH" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Node.js détecté: $nodeVersion" -ForegroundColor Green

    Write-Host "📱 Création de la table notifications et des données de test..." -ForegroundColor Yellow
    node init-notifications.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Système de notifications initialisé avec succès !" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔔 Le système de notifications est maintenant prêt:" -ForegroundColor Cyan
        Write-Host "   - Table notifications créée dans la base de données" -ForegroundColor White
        Write-Host "   - Notifications de démonstration ajoutées" -ForegroundColor White
        Write-Host "   - API notifications disponible sur /api/notifications" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Vous pouvez maintenant:" -ForegroundColor Yellow
        Write-Host "   1. Démarrer le serveur backend: npm run dev" -ForegroundColor White
        Write-Host "   2. Démarrer le frontend: npm start" -ForegroundColor White
        Write-Host "   3. Ouvrir l'application et voir les notifications en temps réel" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Erreur lors de l'initialisation" -ForegroundColor Red
        Write-Host "Vérifiez les logs ci-dessus pour plus de détails" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "❌ Erreur inattendue: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
