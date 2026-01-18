# Script de configuration de la clé API Anthropic
# Usage: .\setup-api-key.ps1
# Ou depuis n'importe où: .\backend\setup-api-key.ps1

$ErrorActionPreference = "Stop"

# Trouver le répertoire backend
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendPath = if ($scriptPath -match "backend$") { $scriptPath } else { Join-Path $scriptPath "backend" }

if (-not (Test-Path $backendPath)) {
    Write-Host "Erreur: Le répertoire backend n'existe pas à: $backendPath" -ForegroundColor Red
    exit 1
}

$envFile = Join-Path $backendPath ".env"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Configuration de la clé API Anthropic" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour obtenir votre clé API :" -ForegroundColor Yellow
Write-Host "  1. Allez sur https://console.anthropic.com/" -ForegroundColor White
Write-Host "  2. Connectez-vous ou créez un compte" -ForegroundColor White
Write-Host "  3. Allez dans 'API Keys'" -ForegroundColor White
Write-Host "  4. Créez une nouvelle clé ou copiez une clé existante" -ForegroundColor White
Write-Host ""
Write-Host "La clé doit commencer par 'sk-ant-'" -ForegroundColor Yellow
Write-Host ""

# Vérifier si une clé existe déjà
$existingKey = $null
if (Test-Path $envFile) {
    $content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    if ($content -match "ANTHROPIC_API_KEY\s*=\s*(.+)") {
        $existingKey = $matches[1].Trim()
        # Nettoyer les guillemets et espaces
        $existingKey = $existingKey.Trim('"').Trim("'").Trim()
        if ($existingKey -and $existingKey -ne "sk-ant-api03-..." -and $existingKey -ne "sk-ant-api03-REMPLACEZ-PAR-VOTRE-CLE-ICI" -and $existingKey.StartsWith("sk-ant-")) {
            Write-Host "Une clé existe déjà : $($existingKey.Substring(0, [Math]::Min(25, $existingKey.Length)))..." -ForegroundColor Yellow
            $replace = Read-Host "Voulez-vous la remplacer ? (o/N)"
            if ($replace -ne "o" -and $replace -ne "O") {
                Write-Host ""
                Write-Host "Configuration annulée. La clé existante est conservée." -ForegroundColor Green
                exit 0
            }
        }
    }
}

# Demander la nouvelle clé
Write-Host ""
$apiKey = Read-Host "Collez votre clé API Anthropic ici"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host ""
    Write-Host "Aucune clé fournie. Configuration annulée." -ForegroundColor Red
    exit 1
}

# Nettoyer la clé
$apiKey = $apiKey.Trim().Trim('"').Trim("'")

# Valider le format
if (-not $apiKey.StartsWith("sk-ant-")) {
    Write-Host ""
    Write-Host "ERREUR: Format invalide. La clé doit commencer par 'sk-ant-'" -ForegroundColor Red
    Write-Host "Clé fournie commence par : $($apiKey.Substring(0, [Math]::Min(20, $apiKey.Length)))..." -ForegroundColor Red
    exit 1
}

# Lire le contenu existant
$envContent = @()
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile
}

# Mettre à jour ou ajouter ANTHROPIC_API_KEY
$updated = $false
$newContent = @()
foreach ($line in $envContent) {
    if ($line -match "^ANTHROPIC_API_KEY\s*=") {
        $newContent += "ANTHROPIC_API_KEY=$apiKey"
        $updated = $true
    } elseif ($line.Trim() -ne "" -or $newContent.Count -eq 0 -or $newContent[-1].Trim() -ne "") {
        $newContent += $line
    }
}

if (-not $updated) {
    # Ajouter la clé à la fin
    if ($newContent.Count -gt 0 -and $newContent[-1].Trim() -ne "") {
        $newContent += ""
    }
    if ($newContent.Count -eq 0) {
        $newContent += "# Configuration AURA AVA V3"
        $newContent += ""
        $newContent += "# Anthropic Claude API (pour interview conversationnelle)"
        $newContent += "# Obtenez votre clé sur https://console.anthropic.com/"
    }
    $newContent += "ANTHROPIC_API_KEY=$apiKey"
}

# Écrire le fichier
$newContent | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
# Ajouter un saut de ligne à la fin si nécessaire
$finalContent = Get-Content $envFile -Raw
if (-not $finalContent.EndsWith("`n") -and -not $finalContent.EndsWith("`r`n")) {
    Add-Content -Path $envFile -Value ""
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Clé API configurée avec succès !" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Fichier : $envFile" -ForegroundColor Gray
Write-Host "Clé : $($apiKey.Substring(0, [Math]::Min(25, $apiKey.Length)))...$($apiKey.Substring([Math]::Max(0, $apiKey.Length - 10)))" -ForegroundColor Gray
Write-Host ""
Write-Host "IMPORTANT: Redémarrez le serveur backend pour que les changements prennent effet" -ForegroundColor Yellow
Write-Host ""
Write-Host "  cd backend" -ForegroundColor White
Write-Host "  uvicorn ava.main:app --reload --port 8000" -ForegroundColor White
Write-Host ""

