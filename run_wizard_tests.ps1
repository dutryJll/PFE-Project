# Complete test of the wizard submission flow for Windows

$ErrorActionPreference = "Stop"

Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Wizard Submission Flow" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# Check if Docker is running
Write-Host "`n1️⃣  Checking Docker..." -ForegroundColor Blue
try {
    docker ps > $null 2>&1
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running" -ForegroundColor Red
    exit 1
}

# Change to isimm-platform directory
Push-Location isimm-platform

try {
    # Start services with Docker Compose
    Write-Host "`n2️⃣  Starting services with Docker Compose..." -ForegroundColor Blue
    docker-compose down -v 2>&1 | Out-Null
    docker-compose up -d
    
    # Wait for services to be ready
    Write-Host "`n3️⃣  Waiting for services to be ready..." -ForegroundColor Blue
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        try {
            if ((Invoke-WebRequest -Uri "http://localhost:8001/api/auth/health" -ErrorAction Stop).StatusCode -eq 200) {
                Write-Host "✅ Services are ready" -ForegroundColor Green
                $ready = $true
                break
            }
        } catch {
            Write-Host "  Waiting... ($($i+1)/30)"
            Start-Sleep -Seconds 1
        }
    }
    
    if (-not $ready) {
        Write-Host "❌ Services did not start in time" -ForegroundColor Red
        exit 1
    }
    
    # Run migrations
    Write-Host "`n4️⃣  Running migrations..." -ForegroundColor Blue
    docker-compose exec -T auth-service python manage.py migrate --noinput
    docker-compose exec -T user-service python manage.py migrate --noinput
    docker-compose exec -T candidature-service python manage.py migrate --noinput
    Write-Host "✅ Migrations completed" -ForegroundColor Green
    
    # Initialize test data
    Write-Host "`n5️⃣  Initializing test data..." -ForegroundColor Blue
    docker-compose exec -T candidature-service python /app/init_test_data.py
    Write-Host "✅ Test data initialized" -ForegroundColor Green
    
    # Run Python test
    Write-Host "`n6️⃣  Running wizard submission test..." -ForegroundColor Blue
    Pop-Location
    python test_wizard_submission.py
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n===========================================" -ForegroundColor Green
        Write-Host "✅ ALL TESTS PASSED!" -ForegroundColor Green
        Write-Host "===========================================" -ForegroundColor Green
    } else {
        Write-Host "`n===========================================" -ForegroundColor Red
        Write-Host "❌ TESTS FAILED" -ForegroundColor Red
        Write-Host "===========================================" -ForegroundColor Red
        exit 1
    }

} finally {
    Pop-Location
}
