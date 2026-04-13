"""
Configuration d'intégration - Dépôt de Dossier Sprint2
À ajouter à settings.py et urls.py du projet
"""

# ============================================================================
# 1. SETTINGS.PY - Configuration Django
# ============================================================================

# Media Files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
FILE_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10485760  # 10 MB

# Stockage personnalisé
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'

# ============================================================================
# 2. INSTALLED_APPS - Ajouter les dépendances
# ============================================================================

INSTALLED_APPS = [
    ...
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django_celery_beat',
    'django_celery_results',
    'candidature_app',
]

# ============================================================================
# 3. MIDDLEWARE - CORS et autres
# ============================================================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "http://localhost:3000",
    "https://isimm.rnu.tn",
]

# ============================================================================
# 4. REST Framework Configuration
# ============================================================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    }
}

# ============================================================================
# 5. Celery Configuration
# ============================================================================

CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_TASK_SOFT_TIME_LIMIT = 25 * 60  # 25 minutes
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True

# Celery Beat Schedule
from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {
    'verifier-delais-depot': {
        'task': 'candidature_app.tasks_documents.verifier_delais_depot_dossier',
        'schedule': crontab(hour=0, minute=0),  # Chaque jour à minuit
    },
    'nettoyer-fichiers-orphelins': {
        'task': 'candidature_app.tasks_documents.nettoyer_fichiers_orphelins',
        'schedule': crontab(hour=2, minute=0),  # Chaque jour à 2h du matin
    },
}

# ============================================================================
# 6. Email Configuration
# ============================================================================

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', True)
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', 'your-email@gmail.com')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', 'your-app-password')
DEFAULT_FROM_EMAIL = 'noreply@isimm.rnu.tn'

# ============================================================================
# 7. Logging Configuration
# ============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {asctime} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'dossier_depot.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'candidature_app.views_depot_dossier': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'candidature_app.tasks_documents': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# ============================================================================
# 8. URLS.PY - Ajouter les routes
# ============================================================================

# config/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from candidature_app.views_depot_dossier import (
    DepotDossierViewSet,
    liste_mes_dossiers,
    statut_dossier
)

router = DefaultRouter()
router.register(r'dossier', DepotDossierViewSet, basename='dossier')

urlpatterns = [
    ...
    # API Dossier
    path('api/', include(router.urls)),
    path('api/dossier/mes-dossiers/', liste_mes_dossiers, name='mes_dossiers'),
    path('api/dossier/<int:candidature_id>/status/', statut_dossier, name='statut_dossier'),
    
    # Auth
    path('api-auth/', include('rest_framework.urls')),
]

# ============================================================================
# 9. REQUIREMENTS.TXT - Dépendances
# ============================================================================

"""
# Ajouter à requirements.txt

# REST API
djangorestframework>=3.14.0
django-cors-headers>=4.0.0

# Async
celery>=5.3.0
django-celery-beat>=2.5.0
django-celery-results>=2.5.0
redis>=4.5.0

# OCR et traitement fichier
PyPDF2>=3.0.0
Pillow>=10.0.0
pytesseract>=0.3.10

# Utilities
python-dotenv>=1.0.0
requests>=2.31.0

# Production
gunicorn>=21.2.0
psycopg2-binary>=2.9.0  # PostgreSQL
"""

# ============================================================================
# 10. DOCKERFILE - Déploiement
# ============================================================================

"""
FROM python:3.11-slim

WORKDIR /app

# Installer tesseract OCR
RUN apt-get update && apt-get install -y \\
    tesseract-ocr \\
    tesseract-ocr-fra \\
    postgresql-client \\
    redis-tools \\
    && rm -rf /var/lib/apt/lists/*

# Installer Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code
COPY . .

# Créer les dossiers nécessaires
RUN mkdir -p /app/logs /app/media

# Commandes de démarrage
CMD ["gunicorn", "candidature_service.wsgi:application", "--bind", "0.0.0.0:8003"]
"""

# ============================================================================
# 11. DOCKER-COMPOSE.YML - Architecture complète
# ============================================================================

"""
version: '3.8'

services:
  # Base de données
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: candidature_db
      POSTGRES_USER: candidature_user
      POSTGRES_PASSWORD: secure_password_123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  # Cache et message broker
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # API Django
  candidature-api:
    build: .
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8003"
    environment:
      DEBUG: 'False'
      SECRET_KEY: 'your-secret-key-here'
      DATABASE_URL: 'postgresql://candidature_user:secure_password_123@db:5432/candidature_db'
      CELERY_BROKER_URL: 'redis://redis:6379/0'
      EMAIL_HOST: 'smtp.gmail.com'
      EMAIL_HOST_USER: 'your-email@gmail.com'
      EMAIL_HOST_PASSWORD: 'your-app-password'
    ports:
      - "8003:8003"
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - media_files:/app/media
      - logs:/app/logs

  # Celery Worker
  celery-worker:
    build: .
    command: celery -A candidature_service worker -l info -c 4
    environment:
      DEBUG: 'False'
      DATABASE_URL: 'postgresql://candidature_user:secure_password_123@db:5432/candidature_db'
      CELERY_BROKER_URL: 'redis://redis:6379/0'
      CELERY_RESULT_BACKEND: 'redis://redis:6379/0'
    depends_on:
      - db
      - redis
    volumes:
      - .:/app
      - media_files:/app/media

  # Celery Beat
  celery-beat:
    build: .
    command: celery -A candidature_service beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
    environment:
      DEBUG: 'False'
      DATABASE_URL: 'postgresql://candidature_user:secure_password_123@db:5432/candidature_db'
      CELERY_BROKER_URL: 'redis://redis:6379/0'
    depends_on:
      - db
      - redis
    volumes:
      - .:/app

volumes:
  postgres_data:
  redis_data:
  media_files:
  logs:
"""

# ============================================================================
# 12. FICHIER .ENV - Variables d'environnement
# ============================================================================

"""
Debug=True
SECRET_KEY=your-django-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1,isimm.rnu.tn

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/candidature_db
DATABASE_TIMEOUT=20

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_TASK_TIME_LIMIT=1800

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-specific-password

# OCR
TESSERACT_PATH=/usr/bin/tesseract
LANGUAGE_OCR=fra+eng

# Storage
MEDIA_ROOT=/app/media
MEDIA_URL=/media/

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:3000,https://isimm.rnu.tn
"""

# ============================================================================
# 13. Management Command - Initialiser les données de test
# ============================================================================

"""
# candidature_app/management/commands/setup_depot_dossier.py
from django.core.management.base import BaseCommand
from candidature_app.models import DocumentType, Master

class Command(BaseCommand):
    def handle(self, *args, **options):
        masters = Master.objects.filter(actif=True)
        
        for master in masters:
            types_documents = [
                {'type': 'cv', 'obligatoire': True, 'max_mb': 5},
                {'type': 'diplome', 'obligatoire': True, 'max_mb': 10},
                {'type': 'releve_notes', 'obligatoire': True, 'max_mb': 5},
                {'type': 'lettre_motivation', 'obligatoire': True, 'max_mb': 5},
                {'type': 'certificat_langue', 'obligatoire': False, 'max_mb': 5},
            ]
            
            for doc_type in types_documents:
                DocumentType.objects.get_or_create(
                    master=master,
                    type_document=doc_type['type'],
                    defaults={
                        'obligatoire': doc_type['obligatoire'],
                        'taille_max_mb': doc_type['max_mb'],
                        'formats_acceptes': ['pdf', 'jpg', 'jpeg', 'png'],
                    }
                )
            
            self.stdout.write(f"Types de documents créés pour {master.nom}")
"""

# ============================================================================
# 14. Test Runner Script
# ============================================================================

"""
#!/bin/bash
# run_tests.sh

set -e

echo "🧪 Exécution des tests du dépôt de dossier..."

# Tests unitaires
python manage.py test candidature_app.tests_depot_dossier.DocumentModelTest -v 2
python manage.py test candidature_app.tests_depot_dossier.DossierModelTest -v 2

# Tests d'intégration
python manage.py test candidature_app.tests_depot_dossier.DepotDossierIntegrationTest -v 2

# Coverage
coverage run --source='candidature_app.views_depot_dossier' manage.py test
coverage report --fail-under=85
coverage html

echo "✅ Tous les tests réussis!"
echo "📊 Rapport coverage disponible: htmlcov/index.html"
"""

print("""
╔════════════════════════════════════════════════════════════════════╗
║   Configuration complète du dépôt de dossier Sprint 2              ║
║   Tous les fichiers de configuration sont prêts!                  ║
╚════════════════════════════════════════════════════════════════════╝

📝 FICHIERS CRÉÉS:
   1. models_new_documents.py - Modèles Document, DocumentType, etc.
   2. serializers_documents.py - Serializers pour l'API
   3. views_depot_dossier.py - ViewSet et endpoints
   4. tasks_documents.py - Tâches Celery pour OCR
   5. tests_depot_dossier.py - Tests complets
   6. SPRINT2_DEPOT_DOSSIER_GUIDE.md - Documentation

🚀 PROCHAINE ÉTAPE:
   1. Copier models_new_documents.py dans candidature_app/models.py
   2. Exécuter: python manage.py makemigrations
   3. Exécuter: python manage.py migrate
   4. Ajouter les URLs à config/urls.py
   5. Démarrer Celery: celery -A candidature_service worker
   6. Tester les endpoints API
""")
