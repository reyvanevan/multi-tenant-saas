# Generate JWT Secrets for Railway

Write-Host "Generating JWT Secrets for Railway Deployment..." -ForegroundColor Cyan
Write-Host ""

# Generate JWT_SECRET
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Generate JWT_REFRESH_SECRET
$jwtRefreshSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

Write-Host "Generated Secrets:" -ForegroundColor Green
Write-Host ""
Write-Host "Copy these to Railway Environment Variables:" -ForegroundColor Yellow
Write-Host ""
Write-Host "JWT_SECRET=" -NoNewline -ForegroundColor White
Write-Host $jwtSecret -ForegroundColor Green
Write-Host ""
Write-Host "JWT_REFRESH_SECRET=" -NoNewline -ForegroundColor White
Write-Host $jwtRefreshSecret -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Go to Railway dashboard" -ForegroundColor White
Write-Host "2. Select your backend service" -ForegroundColor White
Write-Host "3. Go to Variables tab" -ForegroundColor White
Write-Host "4. Add the secrets above" -ForegroundColor White
Write-Host "5. Click Deploy button" -ForegroundColor White
Write-Host ""
