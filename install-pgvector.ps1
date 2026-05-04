# ─────────────────────────────────────────────────────────────
#  install-pgvector.ps1
#  Run as Administrator:
#    Right-click PowerShell -> "Run as Administrator"
#    Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#    cd D:\Info\Profile\supportbot-pro
#    .\install-pgvector.ps1
# ─────────────────────────────────────────────────────────────

$pgVersion  = "18"
$pgBase     = "C:\Program Files\PostgreSQL\$pgVersion"
$pgLib      = "$pgBase\lib"
$pgExt      = "$pgBase\share\extension"
$tmpDir     = "$env:TEMP\pgvector-install"
$serviceName = "postgresql-x64-$pgVersion"

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  pgvector installer for PostgreSQL $pgVersion" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# ── 1. Check PostgreSQL directories exist ────────────────────
if (-not (Test-Path $pgLib)) {
    Write-Host "ERROR: Cannot find $pgLib" -ForegroundColor Red
    Write-Host "Make sure PostgreSQL $pgVersion is installed at $pgBase"
    exit 1
}
Write-Host "Found PostgreSQL at: $pgBase" -ForegroundColor Green

# ── 2. Fetch latest pgvector release from GitHub API ─────────
Write-Host "`nFetching latest pgvector release info..." -ForegroundColor Yellow
try {
    $release = Invoke-RestMethod -Uri "https://api.github.com/repos/pgvector/pgvector/releases/latest" -UseBasicParsing
    $version = $release.tag_name
    Write-Host "Latest pgvector version: $version" -ForegroundColor Green
} catch {
    Write-Host "Could not fetch from GitHub. Using fallback version v0.8.0" -ForegroundColor Yellow
    $version = "v0.8.0"
    $release = @{ assets = @() }
}

# ── 3. Find the right Windows asset for PG18 ─────────────────
$assetName = "pgvector-$version-pg$pgVersion-windows-x86_64.zip"
$asset = $release.assets | Where-Object { $_.name -eq $assetName }

if ($asset) {
    $downloadUrl = $asset.browser_download_url
} else {
    # Fallback: construct URL manually
    $downloadUrl = "https://github.com/pgvector/pgvector/releases/download/$version/$assetName"
    Write-Host "Asset not found in API response, trying direct URL..." -ForegroundColor Yellow
}

Write-Host "Downloading: $assetName" -ForegroundColor Yellow
Write-Host "URL: $downloadUrl"

# ── 4. Download the zip ───────────────────────────────────────
New-Item -ItemType Directory -Force -Path $tmpDir | Out-Null
$zipPath = "$tmpDir\pgvector.zip"

try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    Write-Host "Download complete." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Download failed: $_" -ForegroundColor Red
    Write-Host "`nManual option: Go to https://github.com/pgvector/pgvector/releases"
    Write-Host "Download: $assetName"
    Write-Host "Extract and copy:"
    Write-Host "  lib\vector.dll  ->  $pgLib\vector.dll"
    Write-Host "  share\extension\*  ->  $pgExt\"
    exit 1
}

# ── 5. Extract zip ────────────────────────────────────────────
Write-Host "`nExtracting..." -ForegroundColor Yellow
$extractDir = "$tmpDir\extracted"
Expand-Archive -Path $zipPath -DestinationPath $extractDir -Force
Write-Host "Extracted." -ForegroundColor Green

# ── 6. Copy files into PostgreSQL directories ─────────────────
Write-Host "`nCopying files into PostgreSQL..." -ForegroundColor Yellow

# Copy vector.dll to lib/
$dllSrc = Get-ChildItem -Path $extractDir -Recurse -Filter "vector.dll" | Select-Object -First 1
if ($dllSrc) {
    Copy-Item $dllSrc.FullName -Destination "$pgLib\vector.dll" -Force
    Write-Host "  Copied: vector.dll -> $pgLib" -ForegroundColor Green
} else {
    Write-Host "  WARNING: vector.dll not found in zip" -ForegroundColor Red
}

# Copy extension files (*.control, *.sql) to share/extension/
$extFiles = Get-ChildItem -Path $extractDir -Recurse | Where-Object { $_.Name -match "\.(control|sql)$" }
foreach ($f in $extFiles) {
    Copy-Item $f.FullName -Destination "$pgExt\" -Force
    Write-Host "  Copied: $($f.Name) -> $pgExt" -ForegroundColor Green
}

# ── 7. Restart PostgreSQL service ─────────────────────────────
Write-Host "`nRestarting PostgreSQL service ($serviceName)..." -ForegroundColor Yellow
try {
    Restart-Service -Name $serviceName -Force
    Start-Sleep -Seconds 3
    $svc = Get-Service -Name $serviceName
    Write-Host "Service status: $($svc.Status)" -ForegroundColor Green
} catch {
    Write-Host "Could not restart via Restart-Service, trying net commands..." -ForegroundColor Yellow
    net stop $serviceName
    Start-Sleep -Seconds 2
    net start $serviceName
}

# ── 8. Verify extension is available ─────────────────────────
Write-Host "`nVerifying pgvector is available..." -ForegroundColor Yellow
$psqlExe = "$pgBase\bin\psql.exe"
$verifyResult = & $psqlExe -U postgres -h localhost -c "SELECT * FROM pg_available_extensions WHERE name = 'vector';" 2>&1
Write-Host $verifyResult

# ── 9. Cleanup ────────────────────────────────────────────────
Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "  Now run:  npm run db:setup" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan
