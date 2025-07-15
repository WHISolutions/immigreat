#!/bin/bash

# Script de test rapide pour vérifier la sécurisation des leads

echo "🔒 Test de sécurisation des leads - Conseillers"
echo "=============================================="
echo ""

# Variables de configuration
BASE_URL="http://localhost:3001/api"

# Fonction pour tester une requête
test_request() {
    local method=$1
    local url=$2
    local token=$3
    local description=$4
    local expected_status=$5
    
    echo "📝 Test: $description"
    
    if [ -n "$token" ]; then
        response=$(curl -s -w "%{http_code}" -X $method \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            "$BASE_URL$url")
    else
        response=$(curl -s -w "%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            "$BASE_URL$url")
    fi
    
    status_code="${response: -3}"
    body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ Succès - Status: $status_code"
    else
        echo "❌ Échec - Status attendu: $expected_status, reçu: $status_code"
        if [ ${#body} -gt 0 ] && [ ${#body} -lt 200 ]; then
            echo "   Réponse: $body"
        fi
    fi
    echo ""
}

echo "ℹ️  Ce script teste les points de terminaison d'API pour vérifier la sécurité."
echo "   Assurez-vous que le serveur est démarré sur le port 3001."
echo ""

# Test 1: Accès sans authentification (doit échouer)
test_request "GET" "/leads" "" "Accès à la liste sans authentification" "401"

# Test 2: Accès à un lead spécifique sans authentification (doit échouer)
test_request "GET" "/leads/1" "" "Accès à un lead spécifique sans authentification" "401"

# Test 3: Création de lead sans authentification (doit échouer)
test_request "POST" "/leads" "" "Création de lead sans authentification" "401"

echo "🔍 Pour des tests complets avec authentification, utilisez:"
echo "   node test-lead-security.js"
echo ""
echo "📚 Pour plus d'informations, consultez:"
echo "   SECURISATION_LEADS_CONSEILLERS.md"
