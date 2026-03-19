@echo off
cls
echo ========================================
echo    DEMARRAGE PLATEFORME ISIMM
echo ========================================
echo.

echo [1/3] Demarrage Auth Service (port 8001)...
start "Auth Service" cmd /k "cd services\auth-service && python manage.py runserver 8001"

timeout /t 3 >nul

echo [2/3] Demarrage Candidature Service (port 8003)...
start "Candidature Service" cmd /k "cd services\candidature_service && python manage.py runserver 8003"

timeout /t 3 >nul

echo [3/3] Demarrage Frontend Angular (port 4200)...
start "Angular Frontend" cmd /k "cd frontend && ng serve"

echo.
echo ========================================
echo    TOUS LES SERVICES SONT DEMARRES
echo ========================================
echo.
echo URLs:
echo - Frontend:         http://localhost:4200
echo - Auth API:         http://localhost:8001
echo - Candidature API:  http://localhost:8003
echo.
echo Pour arreter les services, fermez les fenetres.
echo.
pause