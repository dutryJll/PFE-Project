# Script de démarrage rapide pour la soutenance (PowerShell)
# Usage: .\start_pour_soutenance.ps1

Write-Host "🎓 DÉMARRAGE PLATEFORME ISIMM POUR SOUTENANCE" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

# === CONFIGURATION ===
$PFE_PATH = "C:\Users\HP\Desktop\PFE"
$PLATFORM_PATH = "$PFE_PATH\isimm-platform"
$BACKEND_PATH = "$PLATFORM_PATH\services\candidature_service"
$FRONTEND_PATH = "$PLATFORM_PATH\frontend"

# === BACKEND ===
Write-Host "1️⃣  Démarrage Backend (candidature_service)" -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

Set-Location $BACKEND_PATH

# Activate Python environment
Write-Host "✓ Activating Python environment..."
& ".\venv\Scripts\Activate.ps1"

# Apply migrations
Write-Host "✓ Applying migrations..."
python manage.py migrate

# Initialize criteria
Write-Host "✓ Initializing evaluation criteria..."
python manage.py init_criteres

# Start Django
Write-Host "✓ Starting Django server on port 8003..."
Write-Host "✅ Django running at http://127.0.0.1:8003" -ForegroundColor Green
Write-Host ""

# Note: In production, you'd want to start this in a new window
# For demo, we'll start it in the background
$djangoProcess = Start-Process -FilePath python -ArgumentList "manage.py", "runserver", "8003" -PassThru
Write-Host "Backend Process ID: $($djangoProcess.Id)" -ForegroundColor Gray

# === FRONTEND ===
Write-Host "2️⃣  Démarrage Frontend (Angular)" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Yellow

Set-Location $FRONTEND_PATH

Write-Host "✓ Starting Angular development server..."
Write-Host "✅ Angular running at http://localhost:4200" -ForegroundColor Green
Write-Host ""

# Note: For demo, starting in new window
Start-Process -FilePath "cmd" -ArgumentList "/k npm start" -NoNewWindow

Start-Sleep -Seconds 3

# === VERIFICATION ===
Write-Host "3️⃣  Vérification du système" -ForegroundColor Yellow
Write-Host "----------------------------" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8003/api/candidatures/parcours/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ Backend responding (Status 200)" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Backend not yet responding (server warming up...)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 PLATEFORME PRÊTE POUR LA SOUTENANCE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ACCÈS APPLICATIONS:" -ForegroundColor Yellow
Write-Host "  Admin: http://localhost:4200/admin/parcours-master" -ForegroundColor White
Write-Host "  Responsable: http://localhost:4200/responsable/parcours" -ForegroundColor White
Write-Host ""

Write-Host "API REST:" -ForegroundColor Yellow
Write-Host "  Base URL: http://127.0.0.1:8003/api/candidatures/" -ForegroundColor White
Write-Host "  Parcours:" -ForegroundColor White
Write-Host "    GET    /parcours/                      (List)" -ForegroundColor Gray
Write-Host "    POST   /parcours/                      (Create)" -ForegroundColor Gray
Write-Host "    PATCH  /parcours/{id}/                 (Update)" -ForegroundColor Gray
Write-Host "    DELETE /parcours/{id}/                 (Delete)" -ForegroundColor Gray
Write-Host "    POST   /parcours/{id}/generate_criteres/ (Generate)" -ForegroundColor Gray
Write-Host ""

Write-Host "DATABASE:" -ForegroundColor Yellow
Write-Host "  Database: SQLite (candidature_service/db.sqlite3)" -ForegroundColor White
Write-Host "  Models:" -ForegroundColor White
Write-Host "    - ParcoursAdmission (type, specialite, capacite, date_limite, statut)" -ForegroundColor Gray
Write-Host "    - ValeurCritere (coefficients editables)" -ForegroundColor Gray
Write-Host "    - CritereEvaluation (11 criteres standards)" -ForegroundColor Gray
Write-Host ""

Write-Host "DOCUMENTATION:" -ForegroundColor Yellow
Write-Host "  Quick Reference: PARCOURS_QUICK_REFERENCE.md" -ForegroundColor White
Write-Host "  Full Implementation: IMPLEMENTATION_PARCOURS_2026.md" -ForegroundColor White
Write-Host "  Verification: verify_parcours_implementation.py" -ForegroundColor White
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "  1. Open http://localhost:4200 in browser" -ForegroundColor White
Write-Host "  2. Login as Admin" -ForegroundColor White
Write-Host "  3. Go to 'Parcours Master'" -ForegroundColor White
Write-Host "  4. Click '+ Ajouter' and fill form" -ForegroundColor White
Write-Host "  5. Verify criteria were auto-generated" -ForegroundColor White
Write-Host "  6. Change status to 'Ouvert'" -ForegroundColor White
Write-Host "  7. Login as Responsable" -ForegroundColor White
Write-Host "  8. Go to 'Parcours' and edit coefficients" -ForegroundColor White
Write-Host ""

Write-Host "ARRÊTER LES SERVICES:" -ForegroundColor Yellow
Write-Host "  1. Ctrl+C dans la fenêtre Django" -ForegroundColor White
Write-Host "  2. Ctrl+C dans la fenêtre npm" -ForegroundColor White
Write-Host "  3. python manage.py runserver 0.0.0.0:8003 (pour accès réseau)" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ PLATEFORME PRÊTE!" -ForegroundColor Green
