@echo off
REM ═══════════════════════════════════════════════════════════════════════════
REM SCRIPT D'INTEGRATION AUTOMATIQUE - SPRINT 2 DÉPÔT DE DOSSIER (WINDOWS)
REM ═══════════════════════════════════════════════════════════════════════════

setlocal enabledelayedexpansion
set PROJECT_ROOT=c:\Users\HP\Desktop\PFE
set CANDIDATURE_SERVICE=%PROJECT_ROOT%\isimm-platform\services\candidature_service

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 1: VÉRIFICATIONS PRÉALABLES
REM ─────────────────────────────────────────────────────────────────────────

cls
echo ═══════════════════════════════════════════════════════════
echo ► PHASE 1: VÉRIFICATIONS PRÉALABLES
echo ═══════════════════════════════════════════════════════════
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas trouvé. Installez Python d'abord.
    pause
    exit /b 1
)
echo [OK] Python trouvé
echo.

if not exist "%CANDIDATURE_SERVICE%" (
    echo [ERREUR] Dossier candidature_service not found: %CANDIDATURE_SERVICE%
    pause
    exit /b 1
)
echo [OK] Répertoire candidature_service trouvé
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 2: INSTALLATION DES DÉPENDANCES
REM ─────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════
echo ► PHASE 2: INSTALLATION DES DÉPENDANCES
echo ═══════════════════════════════════════════════════════════
echo.

cd /d "%CANDIDATURE_SERVICE%"

if exist "requirements_depot_dossier.txt" (
    echo Installation en cours (cela peut prendre quelques minutes)...
    pip install -r requirements_depot_dossier.txt --quiet
    if errorlevel 0 (
        echo [OK] Dépendances installées
    ) else (
        echo [ATTENTION] Certaines dépendances n'ont pu être installées
    )
) else (
    echo [ERREUR] Fichier requirements_depot_dossier.txt not found
    pause
    exit /b 1
)
echo.

REM Vérifier les dépendances clés
echo Vérification des dépendances clés...
python -c "import rest_framework" >nul 2>&1 && echo [OK] REST Framework
python -c "import celery" >nul 2>&1 && echo [OK] Celery
python -c "import PyPDF2" >nul 2>&1 && echo [OK] PyPDF2
python -c "import PIL" >nul 2>&1 && echo [OK] Pillow
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 3: MIGRATIONS DJANGO
REM ─────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════
echo ► PHASE 3: MIGRATIONS DJANGO
echo ═══════════════════════════════════════════════════════════
echo.

echo Création des migrations...
python manage.py makemigrations candidature_app
echo [OK] Migrations créées
echo.

echo Application des migrations...
python manage.py migrate candidature_app
echo [OK] Migrations appliquées
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 4: VÉRIFICATION DE LA SYNTAXE
REM ─────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════
echo ► PHASE 4: VÉRIFICATION DE LA SYNTAXE
echo ═══════════════════════════════════════════════════════════
echo.

if exist "candidature_app\models_new_documents.py" (
    python -m py_compile candidature_app\models_new_documents.py
    if errorlevel 0 (
        echo [OK] Modèles OK
    ) else (
        echo [ERREUR] Erreur dans les modèles
    )
)

if exist "serializers_documents.py" (
    python -m py_compile serializers_documents.py
    if errorlevel 0 (
        echo [OK] Serializers OK
    ) else (
        echo [ERREUR] Erreur dans les serializers
    )
)

if exist "views_depot_dossier.py" (
    python -m py_compile views_depot_dossier.py
    if errorlevel 0 (
        echo [OK] Views OK
    ) else (
        echo [ERREUR] Erreur dans les views
    )
)
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 5: CRÉATION SUPERUSER (OPTIONNEL)
REM ─────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════
echo ► PHASE 5: SUPERUSER ADMIN
echo ═══════════════════════════════════════════════════════════
echo.

python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.get(username='admin')" >nul 2>&1
if errorlevel 1 (
    echo Création du superuser admin...
    python manage.py shell << %%EOF%% >nul 2>&1
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
%%EOF%%
    echo [OK] Superuser 'admin' créé
    echo     Username: admin
    echo     Password: admin123
) else (
    echo [INFO] Superuser 'admin' existe déjà
)
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 6: DONNÉES DE TEST
REM ─────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════
echo ► PHASE 6: INITIALISATION DONNÉES DE TEST
echo ═══════════════════════════════════════════════════════════
echo.

python manage.py shell << %%EOF%% >nul 2>&1
from django.contrib.auth import get_user_model
from candidature_app.models import Master, Commission
from datetime import datetime, timedelta

User = get_user_model()

master, created = Master.objects.get_or_create(
    nom='Master Informatique',
    defaults={
        'type_master': 'professionnel',
        'specialite': 'Cloud ^& DevOps',
        'places_disponibles': 30,
        'date_limite_candidature': (datetime.now() + timedelta(days=30)).date(),
        'annee_universitaire': '2025-2026',
        'actif': True
    }
)

commission, created = Commission.objects.get_or_create(
    master=master,
    defaults={
        'nom': 'Commission Informatique',
        'actif': True,
        'delai_preselection': 7,
        'delai_depot_dossier': 14,
        'delai_paiement': 7
    }
)
%%EOF%%

echo [OK] Données de test initialisées
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 7: VÉRIFICATIONS FINALES
REM ─────────────────────────────────────────────────────────────────────────

echo ═══════════════════════════════════════════════════════════
echo ► PHASE 7: VÉRIFICATIONS FINALES
echo ═══════════════════════════════════════════════════════════
echo.

python manage.py shell << %%EOF%% >nul 2>&1
from django.db import connection
connection.ensure_connection()
print("[OK] Connexion base de données OK")
%%EOF%%

python manage.py showmigrations candidature_app --list | find "[X]" >nul 2>&1
if errorlevel 0 (
    echo [OK] Migrations appliquées
)
echo.

REM ─────────────────────────────────────────────────────────────────────────
REM PHASE 8: INSTRUCTIONS FINALES
REM ─────────────────────────────────────────────────────────────────────────

cls
echo.
echo ═══════════════════════════════════════════════════════════
echo ✓ INTÉGRATION TERMINÉE AVEC SUCCÈS
echo ═══════════════════════════════════════════════════════════
echo.
echo PROCHAINES ÉTAPES:
echo.
echo 1. Démarrer Redis (Docker ou Local):
echo    docker run -d -p 6379:6379 redis:latest
echo.
echo 2. Dans un PREMIER Terminal PowerShell:
echo    cd "%CANDIDATURE_SERVICE%"
echo    celery -A candidature_service worker -l info
echo.
echo 3. Dans un DEUXIÈME Terminal PowerShell:
echo    cd "%CANDIDATURE_SERVICE%"
echo    celery -A candidature_service beat -l info
echo.
echo 4. Dans un TROISIÈME Terminal PowerShell:
echo    cd "%CANDIDATURE_SERVICE%"
echo    python manage.py runserver 8003
echo.
echo ACCÈS À L'APPLICATION:
echo.
echo   API:      http://localhost:8003/api/
echo   Admin:    http://localhost:8003/admin/
echo   Login:    admin / admin123
echo.
echo DOCUMENTATION:
echo.
echo   - PROCESSUS_INTEGRATION_SPRINT2.md
echo   - SPRINT2_DEPOT_DOSSIER_GUIDE.md
echo   - DEPOT_DOSSIER_SPRINT2_RESUME.md
echo.
echo ═══════════════════════════════════════════════════════════
echo.
pause
endlocal
