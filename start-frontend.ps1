# Script pour démarrer l'application frontend avec gestion d'erreurs
Write-Host "🚀 Démarrage de l'application Frontend..." -ForegroundColor Green

# Aller dans le répertoire frontend
Set-Location "frontend"

# Vérifier si node_modules existe
if (-Not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Vérifier si le port 3000 est libre
$port3000 = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($port3000) {
    Write-Host "⚠️  Port 3000 occupé, utilisation du port 3002" -ForegroundColor Yellow
    $env:PORT = "3002"
} else {
    $env:PORT = "3000"
}

Write-Host "🌐 Démarrage sur le port $($env:PORT)..." -ForegroundColor Cyan

# Démarrer l'application
try {
    npm start
} catch {
    Write-Host "❌ Erreur lors du démarrage: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "🔧 Tentative avec react-scripts directement..." -ForegroundColor Yellow
    npx react-scripts start
}
