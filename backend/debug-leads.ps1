# Script PowerShell pour debugger les leads vides

Write-Host "🔍 Debug des leads vides" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""

$BackendPath = "c:\Users\jamal\Downloads\teste 2 application\app2\app2\backend"

# Vérifier si on est dans le bon répertoire
if (-not (Test-Path "$BackendPath\debug-leads.js")) {
    Write-Host "❌ Erreur: Impossible de trouver le script debug-leads.js" -ForegroundColor Red
    Write-Host "   Assurez-vous d'être dans le répertoire backend" -ForegroundColor Yellow
    exit 1
}

Set-Location $BackendPath

Write-Host "📁 Répertoire de travail: $BackendPath" -ForegroundColor Blue
Write-Host ""

# Fonction pour exécuter le debug
function Invoke-Debug {
    Write-Host "🔍 Exécution du diagnostic des leads..." -ForegroundColor Yellow
    try {
        node debug-leads.js
    } catch {
        Write-Host "❌ Erreur lors de l'exécution du debug:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Fonction pour créer des leads de test
function New-TestLeads {
    Write-Host "🛠️  Création de leads de test..." -ForegroundColor Yellow
    try {
        node debug-leads.js --create-test
    } catch {
        Write-Host "❌ Erreur lors de la création des leads de test:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Fonction pour tester le filtrage
function Test-Filter {
    param($ConseillerId)
    
    if (-not $ConseillerId) {
        Write-Host "❌ ID du conseiller requis pour le test de filtrage" -ForegroundColor Red
        return
    }
    
    Write-Host "🧪 Test du filtrage pour le conseiller ID $ConseillerId..." -ForegroundColor Yellow
    try {
        node debug-leads.js --test-filter $ConseillerId
    } catch {
        Write-Host "❌ Erreur lors du test de filtrage:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
}

# Menu principal
Write-Host "Choisissez une option:" -ForegroundColor Magenta
Write-Host "1. 🔍 Diagnostic complet des leads" -ForegroundColor White
Write-Host "2. 🛠️  Créer des leads de test" -ForegroundColor White
Write-Host "3. 🧪 Tester le filtrage pour un conseiller" -ForegroundColor White
Write-Host "4. 📊 Tout faire (diagnostic + création + test)" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Votre choix (1-4)"

switch ($choice) {
    "1" {
        Invoke-Debug
    }
    "2" {
        New-TestLeads
        Write-Host ""
        Write-Host "✅ Relancer le diagnostic pour voir les nouveaux leads:" -ForegroundColor Green
        Invoke-Debug
    }
    "3" {
        $conseillerId = Read-Host "Entrez l'ID du conseiller à tester"
        Test-Filter $conseillerId
    }
    "4" {
        Write-Host "🔄 Exécution complète..." -ForegroundColor Cyan
        Invoke-Debug
        Write-Host ""
        New-TestLeads
        Write-Host ""
        
        # Demander l'ID du conseiller pour le test
        $conseillerId = Read-Host "Entrez l'ID du conseiller à tester pour le filtrage (ou appuyez sur Entrée pour ignorer)"
        if ($conseillerId) {
            Test-Filter $conseillerId
        }
        
        Write-Host ""
        Write-Host "🔄 Diagnostic final..." -ForegroundColor Cyan
        Invoke-Debug
    }
    default {
        Write-Host "❌ Choix invalide" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📝 Conseils de dépannage:" -ForegroundColor Magenta
Write-Host "- Si aucun lead n'est trouvé, créez d'abord des leads de test" -ForegroundColor White
Write-Host "- Vérifiez que le serveur est démarré et que la base de données est accessible" -ForegroundColor White
Write-Host "- Consultez les logs du serveur pour plus d'informations" -ForegroundColor White
