from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-auth-service-secret-key'

DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1']

# ========================================
# APPLICATIONS
# ========================================
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Apps tierces
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    
    # App locale
    'auth_app',
]

# ========================================
# MIDDLEWARE
# ========================================
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

# ========================================
# TEMPLATES
# ========================================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# ========================================
# BASE DE DONNÉES
# ========================================
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'auth_db',
        'USER': 'pfe_user',
        'PASSWORD': 'motdepasse123',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'client_encoding': 'UTF8',
        },
    }
}

# ========================================
# VALIDATION MOT DE PASSE
# ========================================
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

# ========================================
# INTERNATIONALISATION
# ========================================
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Tunis'
USE_I18N = True
USE_TZ = True

# ========================================
# FICHIERS STATIQUES
# ========================================
STATIC_URL = 'static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ========================================
# MODÈLE USER PERSONNALISÉ
# ========================================
AUTH_USER_MODEL = 'auth_app.User'

# ========================================
# CORS
# ========================================
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
]
CORS_ALLOW_CREDENTIALS = True

# ========================================
# REST FRAMEWORK
# ========================================
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}

# ========================================
# JWT
# ========================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=5),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}

# ========================================
# CONFIGURATION EMAIL
# ========================================
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'jellalidonia06@gmail.com'  # ✅ VOTRE EMAIL
EMAIL_HOST_PASSWORD = 'zatr wdaz dqoy xtrz'  # ✅ À REMPLIR
DEFAULT_FROM_EMAIL = 'ISIMM Admission <jellalidonia06@gmail.com>'
EMAIL_SUBJECT_PREFIX = '[ISIMM] '
FRONTEND_URL = 'http://localhost:4200'

# Pour production (Gmail - décommenter quand prêt)
# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = 'votre-email@gmail.com'
# EMAIL_HOST_PASSWORD = 'votre-app-password'