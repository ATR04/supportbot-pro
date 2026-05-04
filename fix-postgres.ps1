# Run this script as Administrator in PowerShell
# Right-click PowerShell -> "Run as Administrator", then:
# cd D:\Info\Profile\supportbot-pro
# .\fix-postgres.ps1

$pgBin = "C:\Program Files\PostgreSQL\18\bin"
$psql  = "$pgBin\psql.exe"

Write-Host "`n=== Step 1: Adding PostgreSQL to system PATH ===" -ForegroundColor Cyan
$currentPath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*PostgreSQL*") {
    [System.Environment]::SetEnvironmentVariable("Path", "$currentPath;$pgBin", "Machine")
    $env:Path += ";$pgBin"
    Write-Host "PATH updated. PostgreSQL bin added." -ForegroundColor Green
} else {
    Write-Host "PostgreSQL already in PATH." -ForegroundColor Yellow
}

Write-Host "`n=== Step 2: Testing psql connection ===" -ForegroundColor Cyan
$testResult = & $psql -U postgres -h localhost -c "SELECT version();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Connected successfully!" -ForegroundColor Green
    Write-Host $testResult

    Write-Host "`n=== Step 3: Setting password to 'admin' ===" -ForegroundColor Cyan
    & $psql -U postgres -h localhost -c "ALTER USER postgres WITH PASSWORD 'admin';"

    Write-Host "`n=== Step 4: Creating supportbot_db ===" -ForegroundColor Cyan
    & $psql -U postgres -h localhost -c "CREATE DATABASE supportbot_db;" 2>&1
    Write-Host "Done! (ignore 'already exists' warning)" -ForegroundColor Green
} else {
    Write-Host "Connection failed. Output:" -ForegroundColor Red
    Write-Host $testResult

    Write-Host "`nTry running this manually to find the password:" -ForegroundColor Yellow
    Write-Host "  & '$psql' -U postgres -h localhost"
}

Write-Host "`n=== Done! Now run: npm run db:setup ===" -ForegroundColor Cyan
