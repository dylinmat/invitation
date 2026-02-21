# EIOS Deployment Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "EIOS Deployment to Railway" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

# Check Railway login status
Write-Host "Checking Railway status..." -ForegroundColor Yellow
$railwayStatus = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Not logged into Railway. Please run: railway login" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Logged into Railway" -ForegroundColor Green
Write-Host ""

# Step 1: Build API
Write-Host "Step 1: Building API..." -ForegroundColor Yellow
Set-Location apps/api
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ API build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ API built successfully" -ForegroundColor Green
Set-Location ..\..
Write-Host ""

# Step 2: Deploy API
Write-Host "Step 2: Deploying API Service..." -ForegroundColor Yellow
railway up --service api
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ API deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ API deployed" -ForegroundColor Green
Write-Host ""

# Step 3: Deploy Web
Write-Host "Step 3: Deploying Web Service..." -ForegroundColor Yellow
railway up --service web
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Web deployment failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Web deployed" -ForegroundColor Green
Write-Host ""

# Step 4: Run migrations
Write-Host "Step 4: Running Database Migrations..." -ForegroundColor Yellow
railway run --service api npm run migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Migration failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Migrations complete" -ForegroundColor Green
Write-Host ""

# Step 5: Verify
Write-Host "Step 5: Verifying deployment..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $response = Invoke-RestMethod -Uri "https://invitation-production-db10.up.railway.app/health" -Method GET -TimeoutSec 30
    Write-Host "✓ API health check passed" -ForegroundColor Green
} catch {
    Write-Host "⚠ API health check failed (may still be starting up)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Deployment Complete!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your application is now live at:" -ForegroundColor Cyan
Write-Host "  https://invitation-production-db10.up.railway.app" -ForegroundColor White
Write-Host ""
Write-Host "New Features Deployed:" -ForegroundColor Cyan
Write-Host "  ✓ Events Management API" -ForegroundColor White
Write-Host "  ✓ Clients Management API" -ForegroundColor White
Write-Host "  ✓ Team & Invites API" -ForegroundColor White
Write-Host "  ✓ Invoices API" -ForegroundColor White
Write-Host "  ✓ CSV Import System" -ForegroundColor White
Write-Host "  ✓ Visual Editor" -ForegroundColor White
Write-Host "  ✓ Analytics Dashboard" -ForegroundColor White
Write-Host ""
