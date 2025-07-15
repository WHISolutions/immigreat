# Script PowerShell de test rapide pour vérifier la sécurisation des leads

Write-Host "🔒 Test de sécurisation des leads - Conseillers" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Variables de configuration
$BASE_URL = "http://localhost:3001/api"

# Fonction pour tester une requête
function Test-Request {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Token,
        [string]$Description,
        [string]$ExpectedStatus
    )
    
    Write-Host "📝 Test: $Description" -ForegroundColor Yellow
    
    try {
        $headers = @{
            'Content-Type' = 'application/json'
        }
        
        if ($Token) {
            $headers['Authorization'] = "Bearer $Token"
        }
        
        $response = Invoke-WebRequest -Uri "$BASE_URL$Url" -Method $Method -Headers $headers -ErrorAction Stop
        $statusCode = $response.StatusCode
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ Succès - Status: $statusCode" -ForegroundColor Green
        } else {
            Write-Host "❌ Échec - Status attendu: $ExpectedStatus, reçu: $statusCode" -ForegroundColor Red
        }
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($statusCode -eq $ExpectedStatus) {
            Write-Host "✅ Succès - Status: $statusCode" -ForegroundColor Green
        } else {
            Write-Host "❌ Échec - Status attendu: $ExpectedStatus, reçu: $statusCode" -ForegroundColor Red
            if ($_.Exception.Response) {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $responseBody = $reader.ReadToEnd()
                if ($responseBody.Length -gt 0 -and $responseBody.Length -lt 200) {
                    Write-Host "   Réponse: $responseBody" -ForegroundColor Gray
                }
            }
        }
    }
    Write-Host ""
}

Write-Host "ℹ️  Ce script teste les points de terminaison d'API pour vérifier la sécurité." -ForegroundColor Blue
Write-Host "   Assurez-vous que le serveur est démarré sur le port 3001." -ForegroundColor Blue
Write-Host ""

# Test 1: Accès sans authentification (doit échouer)
Test-Request -Method "GET" -Url "/leads" -Token "" -Description "Accès à la liste sans authentification" -ExpectedStatus "401"

# Test 2: Accès à un lead spécifique sans authentification (doit échouer)
Test-Request -Method "GET" -Url "/leads/1" -Token "" -Description "Accès à un lead spécifique sans authentification" -ExpectedStatus "401"

# Test 3: Création de lead sans authentification (doit échouer)
Test-Request -Method "POST" -Url "/leads" -Token "" -Description "Création de lead sans authentification" -ExpectedStatus "401"

Write-Host "🔍 Pour des tests complets avec authentification, utilisez:" -ForegroundColor Magenta
Write-Host "   node test-lead-security.js" -ForegroundColor White
Write-Host ""
Write-Host "📚 Pour plus d'informations, consultez:" -ForegroundColor Magenta
Write-Host "   SECURISATION_LEADS_CONSEILLERS.md" -ForegroundColor White
