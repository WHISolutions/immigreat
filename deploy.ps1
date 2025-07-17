# Script PowerShell de déploiement Docker pour Windows
# Usage: .\deploy.ps1 [dev|prod]

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "prod")]
    [string]$Environment = "dev"
)

# Couleurs pour les logs
function Write-Log {
    param([string]$Message, [string]$Color = "Green")
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Color
}

function Write-Error-Log {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Info-Log {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

# Vérifier que Docker est installé
try {
    docker --version | Out-Null
    docker-compose --version | Out-Null
} catch {
    Write-Error-Log "Docker ou Docker Compose n'est pas installé ou n'est pas dans le PATH !"
    exit 1
}

# Vérifier que le fichier .env existe
if (-not (Test-Path ".env")) {
    Write-Warning-Log "Fichier .env non trouvé. Copie du fichier .env.example..."
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Warning-Log "⚠️  IMPORTANT: Modifiez le fichier .env avec vos vraies valeurs avant de continuer !"
        Write-Warning-Log "Notamment les mots de passe et les secrets JWT !"
        Read-Host "Appuyez sur Entrée quand c'est fait"
    } else {
        Write-Error-Log "Fichier .env.example non trouvé !"
        exit 1
    }
}

Write-Log "🚀 Démarrage du déploiement en mode $Environment"

# Arrêter les conteneurs existants
Write-Log "🛑 Arrêt des conteneurs existants..."
try {
    docker-compose down
} catch {
    Write-Warning-Log "Aucun conteneur à arrêter"
}

# Nettoyer les images non utilisées (optionnel)
if ($Environment -eq "prod") {
    Write-Log "🧹 Nettoyage des images non utilisées..."
    docker system prune -f
}

# Construire les images
Write-Log "🔨 Construction de l'image de l'application..."
docker-compose build --no-cache app

# Démarrer les services
Write-Log "🌟 Démarrage des services..."
if ($Environment -eq "prod") {
    docker-compose up -d
} else {
    docker-compose up -d db
    Write-Log "⏳ Attente que MySQL soit prêt..."
    Start-Sleep -Seconds 15
    docker-compose up -d app
}

# Attendre que les services soient prêts
Write-Log "⏳ Vérification que les services sont prêts..."
Start-Sleep -Seconds 10

# Vérifier le statut des conteneurs
Write-Log "📊 Statut des conteneurs:"
docker-compose ps

# Test de santé
Write-Log "🏥 Test de santé de l'application..."
Start-Sleep -Seconds 5
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Log "✅ Application accessible sur http://localhost:3000"
    }
} catch {
    Write-Warning-Log "⚠️  L'application ne répond pas encore, vérifiez les logs"
}

# Lire les informations du fichier .env
$envContent = Get-Content ".env" | Where-Object { $_ -match "^DB_NAME=" }
$dbName = ($envContent -split "=")[1]

# Afficher les informations de connexion
Write-Log "📋 Informations de connexion:"
Write-Info-Log "Application: http://localhost:3000"
Write-Info-Log "Base de données: localhost:3306"
Write-Info-Log "Nom de la BDD: $dbName"

# Afficher les commandes utiles
Write-Log "🛠️  Commandes utiles:"
Write-Info-Log "Voir les logs de l'app: docker-compose logs -f app"
Write-Info-Log "Voir les logs de la BDD: docker-compose logs -f db"
Write-Info-Log "Arrêter les services: docker-compose down"
Write-Info-Log "Redémarrer l'app: docker-compose restart app"

Write-Log "🎉 Déploiement terminé !"

# En mode dev, suivre les logs
if ($Environment -eq "dev") {
    Write-Log "📝 Suivi des logs en temps réel (Ctrl+C pour quitter):"
    docker-compose logs -f app
}
