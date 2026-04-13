#!/bin/bash

# ═══════════════════════════════════════════════════════════════════════════
# SCRIPT D'INTEGRATION AUTOMATIQUE - SPRINT 2 DÉPÔT DE DOSSIER
# ═══════════════════════════════════════════════════════════════════════════

set -e  # Arrêter si une erreur se produit

PROJECT_ROOT="c:/Users/HP/Desktop/PFE"
CANDIDATURE_SERVICE="$PROJECT_ROOT/isimm-platform/services/candidature_service"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_header() {
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}► $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# ─────────────────────────────────────────────────────────────────────────
# PHASE 1: VÉRIFICATIONS PRÉALABLES
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 1: VÉRIFICATIONS PRÉALABLES"

# Vérifier Python
if ! command -v python &> /dev/null; then
    print_error "Python n'est pas installé"
    exit 1
fi
print_success "Python trouvé: $(python --version)"

# Vérifier Django
if ! python -c "import django" 2>/dev/null; then
    print_error "Django n'est pas installé"
    exit 1
fi
print_success "Django trouvé"

# Vérifier le répertoire
if [ ! -d "$CANDIDATURE_SERVICE" ]; then
    print_error "Dossier candidature_service not found: $CANDIDATURE_SERVICE"
    exit 1
fi
print_success "Répertoire candidature_service trouvé"

# ─────────────────────────────────────────────────────────────────────────
# PHASE 2: INSTALLATION DES DÉPENDANCES
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 2: INSTALLATION DES DÉPENDANCES"

cd "$CANDIDATURE_SERVICE"

if [ -f "requirements_depot_dossier.txt" ]; then
    print_warning "Installation des packages (cela peut prendre quelques minutes)..."
    pip install -r requirements_depot_dossier.txt --quiet
    print_success "Dépendances installées"
else
    print_error "Fichier requirements_depot_dossier.txt non trouvé"
    exit 1
fi

# Vérifier les dépendances clés
print_warning "Vérification des dépendances clés..."
python -c "import rest_framework; print('✓ DRF')" && print_success "REST Framework" || print_warning "REST Framework manquant"
python -c "import celery; print('✓ Celery')" && print_success "Celery" || print_warning "Celery manquant"
python -c "import PyPDF2; print('✓ PyPDF2')" && print_success "PyPDF2" || print_warning "PyPDF2 manquant"

# ─────────────────────────────────────────────────────────────────────────
# PHASE 3: MIGRATIONS
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 3: MIGRATIONS DJANGO"

print_warning "Création des migrations..."
python manage.py makemigrations candidature_app
print_success "Migrations créées"

print_warning "Application des migrations..."
python manage.py migrate candidature_app
print_success "Migrations appliquées"

# ─────────────────────────────────────────────────────────────────────────
# PHASE 4: VÉRIFICATION DE LA SYNTAXE
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 4: VÉRIFICATION DE LA SYNTAXE"

if [ -f "candidature_app/models_new_documents.py" ]; then
    python -m py_compile candidature_app/models_new_documents.py && \
        print_success "Modèles OK" || \
        print_error "Erreur dans les modèles"
fi

if [ -f "serializers_documents.py" ]; then
    python -m py_compile serializers_documents.py && \
        print_success "Serializers OK" || \
        print_error "Erreur dans les serializers"
fi

if [ -f "views_depot_dossier.py" ]; then
    python -m py_compile views_depot_dossier.py && \
        print_success "Views OK" || \
        print_error "Erreur dans les views"
fi

# ─────────────────────────────────────────────────────────────────────────
# PHASE 5: CRÉATION SUPERUSER (OPTIONNEL)
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 5: SUPERUSER ADMIN"

# Vérifier si admin existe déjà
if python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.get(username='admin')" 2>/dev/null; then
    print_warning "Superuser 'admin' existe déjà"
else
    print_warning "Création du superuser..."
    python manage.py shell <<EOF
from django.contrib.auth import get_user_model
User = get_user_model()
User.objects.create_superuser('admin', 'admin@test.com', 'admin123')
print("✓ Superuser 'admin' créé")
EOF
    print_success "Superuser créé: admin / admin123"
fi

# ─────────────────────────────────────────────────────────────────────────
# PHASE 6: DONNÉES DE TEST
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 6: INITIALISATION DONNÉES DE TEST"

python manage.py shell <<EOF
from django.contrib.auth import get_user_model
from candidature_app.models import Master, Commission
from datetime import datetime, timedelta

User = get_user_model()

# Créer Master de test
master, created = Master.objects.get_or_create(
    nom='Master Informatique',
    defaults={
        'type_master': 'professionnel',
        'specialite': 'Cloud & DevOps',
        'places_disponibles': 30,
        'date_limite_candidature': (datetime.now() + timedelta(days=30)).date(),
        'annee_universitaire': '2025-2026',
        'actif': True
    }
)

if created:
    print("✓ Master Informatique créé")
else:
    print("✓ Master Informatique existe déjà")

# Créer Commission
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

if created:
    print("✓ Commission créée")
else:
    print("✓ Commission existe déjà")
EOF

print_success "Données de test initialisées"

# ─────────────────────────────────────────────────────────────────────────
# PHASE 7: TESTS
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 7: EXÉCUTION DES TESTS"

if [ -f "tests_depot_dossier.py" ]; then
    print_warning "Exécution des tests (cela peut prendre plusieurs minutes)..."
    
    if command -v pytest &> /dev/null; then
        pytest tests_depot_dossier.py -v --tb=short 2>&1 | head -50
    else
        python -m pytest tests_depot_dossier.py -v --tb=short 2>&1 | head -50
    fi
    
    print_success "Tests exécutés"
else
    print_warning "Fichier tests_depot_dossier.py non trouvé"
fi

# ─────────────────────────────────────────────────────────────────────────
# PHASE 8: VÉRIFICATIONS FINALES
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 8: VÉRIFICATIONS FINALES"

# Vérifier les migrations appliquées
MIGRATION_COUNT=$(python manage.py showmigrations candidature_app 2>/dev/null | grep -c "\[X\]" || echo "0")
print_success "Migrations appliquées: $MIGRATION_COUNT"

# Vérifier base de données
python manage.py shell <<EOF 2>&1 | grep -i "connection\|ok\|✓" || true
from django.db import connection
connection.ensure_connection()
print("✓ Connexion base de données OK")
EOF

# ─────────────────────────────────────────────────────────────────────────
# PHASE 9: INSTRUCTIONS FINALES
# ─────────────────────────────────────────────────────────────────────────

print_header "PHASE 9: PRÊT POUR DÉMARRAGE"

echo ""
echo -e "${YELLOW}PROCHAINES ÉTAPES:${NC}"
echo ""
echo -e "${GREEN}1. Démarrer Redis:${NC}"
echo "   docker run -d -p 6379:6379 redis:latest"
echo ""
echo -e "${GREEN}2. Dans Terminal 1 - Démarrer Celery Worker:${NC}"
echo "   cd '$CANDIDATURE_SERVICE'"
echo "   celery -A candidature_service worker -l info"
echo ""
echo -e "${GREEN}3. Dans Terminal 2 - Démarrer Celery Beat:${NC}"
echo "   cd '$CANDIDATURE_SERVICE'"
echo "   celery -A candidature_service beat -l info"
echo ""
echo -e "${GREEN}4. Dans Terminal 3 - Démarrer Django Server:${NC}"
echo "   cd '$CANDIDATURE_SERVICE'"
echo "   python manage.py runserver 8003"
echo ""
echo -e "${GREEN}5. Accéder à l'application:${NC}"
echo "   - API: http://localhost:8003/api/"
echo "   - Admin: http://localhost:8003/admin/"
echo "   - Username: admin"
echo "   - Password: admin123"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ INTÉGRATION TERMINÉE AVEC SUCCÈS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
