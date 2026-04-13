# Guide Complet - Dépôt de Dossier Sprint 2

**Date**: 9 Avril 2026  
**Statut**: ✅ Complet et fonctionnel  
**Version**: 1.0

---

## 1. Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Angular)                        │
│                  Formulaire Upload                           │
└────────────────────────────┬────────────────────────────────┘
                             │
                    HTTP Multipart Upload
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Django REST                            │
│              DepotDossierViewSet                             │
│    - /dossier/upload/<candidature_id>/                       │
│    - /dossier/dossier/<candidature_id>/                      │
│    - /dossier/soumettre/<candidature_id>/                    │
│    - /dossier/document/<document_id>/ (delete)               │
└────────────────────────────┬────────────────────────────────┘
                             │
                    Sauvegarde Fichier
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
      FileField          Celery Queue      Database
   (Media Django)       (Async Tasks)     (Models)
          │                  │                  │
          │              OCR Processing    Models:
          │              Validation        - Document
       Stockage            Email notify     - Dossier
       Sécurisé          Score OCR        - Validation
                                          - DocumentType
```

---

## 2. Modèles de Données

### DocumentType

```python
master -> Master (ForeignKey)
type_document -> [diplome, releve_notes, cv, ...]
obligatoire -> Boolean (default=True)
taille_max_mb -> Integer (default=5)
formats_acceptes -> JSON (e.g., ['pdf', 'jpg'])
```

### Document

```python
candidature -> ForeignKey(Candidature)
type_document -> ForeignKey(DocumentType)
fichier -> FileField (upload_to='candidatures/%Y/%m/%d/')
statut -> [en_attente, en_cours_ocr, valide, rejete, erreur_ocr]
donnees_extraites -> JSON (texte OCR)
score_ocr -> Decimal (0-1)
checksum_sha256 -> String (empêcher doublons)
```

### Dossier

```python
candidature -> OneToOneField(Candidature)
statut -> [en_cours, soumis, en_verification, incomplet, complet, rejete]
nb_documents_attendus -> Integer
nb_documents_soumis -> Integer
score_completude -> Decimal (0-100%)
date_depot -> DateTime
date_limite_depot -> DateTime
```

---

## 3. Endpoints API

### 3.1 GET /api/dossier/requetes/{candidature_id}/

**Obtenir les types de documents requis**

```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  https://api.isimm.rnu.tn/api/dossier/requetes/123/
```

**Response 200:**

```json
{
  "candidature_numero": "2604-00001-MI",
  "master_nom": "Master Informatique",
  "types_documents": [
    {
      "id": 1,
      "type_document": "cv",
      "obligatoire": true,
      "taille_max_mb": 5,
      "formats_acceptes": ["pdf", "doc", "docx"]
    },
    {
      "id": 2,
      "type_document": "diplome",
      "obligatoire": true,
      "taille_max_mb": 10,
      "formats_acceptes": ["pdf", "jpg"]
    }
  ],
  "nombre_requis": 2
}
```

---

### 3.2 POST /api/dossier/upload/{candidature_id}/

**Uploader un document**

```bash
curl -X POST -H "Authorization: Token YOUR_TOKEN" \
  -F "type_document=1" \
  -F "fichier=@/path/to/cv.pdf" \
  -F "description=Mon CV professionnel" \
  https://api.isimm.rnu.tn/api/dossier/upload/123/
```

**Request (multipart/form-data):**

```
type_document: 1 (ID du DocumentType)
fichier: [file]
description: (optionnel)
```

**Response 201:**

```json
{
  "success": true,
  "document": {
    "id": 456,
    "type_document": 1,
    "type_document_detail": {
      "id": 1,
      "type_document": "cv",
      "obligatoire": true,
      "taille_max_mb": 5,
      "formats_acceptes": ["pdf", "doc", "docx"]
    },
    "fichier": "/media/candidatures/2026/04/09/cv.pdf",
    "fichier_url": "https://api.isimm.rnu.tn/media/candidatures/2026/04/09/cv.pdf",
    "nom_fichier_original": "cv.pdf",
    "format_fichier": "pdf",
    "taille_bytes": 2048,
    "statut": "en_attente",
    "description": "Mon CV professionnel",
    "score_ocr": null,
    "date_upload": "2026-04-09T14:30:00Z",
    "date_traitement_ocr": null
  },
  "message": "Document uploadé avec succès. Traitement OCR en cours..."
}
```

**Erreurs possibles:**

```json
// 400: Candidature pas dans le bon statut
{
  "error": "La candidature doit être présélectionnée pour soumettre un dossier. Statut actuel: soumis"
}

// 400: Date limite dépassée
{
  "error": "La date limite de dépôt de dossier est dépassée"
}

// 400: Fichier trop gros
{
  "type_document": ["Erreur"],
  "fichier": ["Le fichier ne doit pas dépasser 10MB"]
}

// 400: Fichier en doublon
{
  "type_document": ["Erreur"],
  "fichier": ["Ce fichier a déjà été soumis: 2604-00001-MI"]
}
```

---

### 3.3 GET /api/dossier/dossier/{candidature_id}/

**Consulter l'état du dossier**

```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  https://api.isimm.rnu.tn/api/dossier/dossier/123/
```

**Response 200:**

```json
{
  "id": 789,
  "candidature_numero": "2604-00001-MI",
  "candidat_nom": "Jean Dupont",
  "master_nom": "Master Informatique",
  "statut": "incomplet",
  "date_depot": null,
  "date_limite_depot": "2026-04-23T14:30:00Z",
  "nb_documents_attendus": 3,
  "nb_documents_soumis": 2,
  "score_completude": 66.67,
  "documents_par_type": {
    "CV": [
      {
        "id": 1,
        "nom": "cv.pdf",
        "statut": "valide",
        "date_upload": "2026-04-09T10:00:00Z",
        "score_ocr": 0.85
      }
    ],
    "Diplôme": [
      {
        "id": 2,
        "nom": "diplome.jpg",
        "statut": "en_cours_ocr",
        "date_upload": "2026-04-09T11:00:00Z",
        "score_ocr": null
      }
    ],
    "Lettre de motivation": []
  },
  "evaluation": {
    "total_expected": 3,
    "validated": 1,
    "rejected": 1,
    "pending": 0,
    "percentage": "66%",
    "is_complete": false
  },
  "feedback": "Manque lettre de motivation et le diplôme a été rejeté (score OCR faible)",
  "created_at": "2026-04-09T08:00:00Z",
  "updated_at": "2026-04-09T14:30:00Z"
}
```

---

### 3.4 POST /api/dossier/soumettre/{candidature_id}/

**Soumettre le dossier**

```bash
curl -X POST -H "Authorization: Token YOUR_TOKEN" \
  https://api.isimm.rnu.tn/api/dossier/soumettre/123/
```

**Response 200 (Succès):**

```json
{
  "success": true,
  "message": "Dossier soumis avec succès",
  "dossier": { ... }
}
```

**Response 400 (Incomplet):**

```json
{
  "error": "Le dossier est incomplet (66% complété)",
  "details": {
    "documents_attendus": 3,
    "documents_soumis": 2,
    "documents_valides": 1
  }
}
```

---

### 3.5 DELETE /api/dossier/document/{document_id}/

**Supprimer un document**

```bash
curl -X DELETE -H "Authorization: Token YOUR_TOKEN" \
  https://api.isimm.rnu.tn/api/dossier/document/456/
```

**Response 200:**

```json
{
  "success": true,
  "message": "Document supprimé avec succès",
  "dossier": { ... }
}
```

---

### 3.6 GET /api/dossier/mes-dossiers/

**Lister tous les dossiers de l'utilisateur**

```bash
curl -H "Authorization: Token YOUR_TOKEN" \
  https://api.isimm.rnu.tn/api/dossier/mes-dossiers/
```

**Response 200:**

```json
{
  "count": 2,
  "dossiers": [
    {
      "id": 789,
      "candidature_numero": "2604-00001-MI",
      "candidat_nom": "Jean Dupont",
      "master_nom": "Master Informatique",
      "statut": "complet",
      "score_completude": 100.0,
      ...
    }
  ]
}
```

---

## 4. Flux d'Utilisation Complet

### Étape 1: Candidat obtient la présélection

```
Candidature statut: preselectionne
Commission décide: candidat est présélectionné
Délai défini: 14 jours pour déposer dossier
```

### Étape 2: Consulter les documents requis

```javascript
// Frontend Angular
GET /api/dossier/requetes/123/
// Afficher liste des documents obligatoires/optionnels
```

### Étape 3: Télécharger les documents un par un

```javascript
// Upload CV
POST /api/dossier/upload/123/ avec CV.pdf

// Upload Diplôme
POST /api/dossier/upload/123/ avec diplome.jpg

// Upload Lettre
POST /api/dossier/upload/123/ avec lettre.pdf
```

### Étape 4: Vérifier la complétude

```javascript
// Consulter l'état du dossier
GET /api/dossier/dossier/123/
// Score automatiquement calculé et mis à jour
```

### Étape 5: Soumettre le dossier

```javascript
// Une fois tous les documents validés (OCR réussi)
POST /api/dossier/soumettre/123/
// Candidature passe au statut: dossier_depose
```

---

## 5. Traitement OCR Asynchrone

### Flux OCR

```
1. Upload fichier
   ↓
2. Créer Document (statut: en_attente)
   ↓
3. Lancer tâche Celery: traiter_ocr_document()
   ↓
4. Mise à jour: statut = en_cours_ocr
   ├─ Extraire texte (PDF via PyPDF2)
   ├─ Extraire texte (Image via Tesseract)
   ├─ Calculer score OCR
   │
5. Résultat OCR:
   ├─ score_ocr >= 0.7 → statut = valide ✓
   └─ score_ocr < 0.7 → statut = rejete ✗
   ↓
6. Créer notification au candidat
7. Envoyer email notification
8. Recalculer complétude du dossier
```

### Configuration Celery

**settings.py:**

```python
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'

# Tâche périodique pour vérifier les délais
CELERY_BEAT_SCHEDULE = {
    'verifier-delais-depot': {
        'task': 'candidature_app.tasks_documents.verifier_delais_depot_dossier',
        'schedule': crontab(hour=0, minute=0),  # Chaque jour à minuit
    },
}
```

### Démarrer Celery

```bash
# Terminal 1: Worker
celery -A candidature_service worker -l info

# Terminal 2: Beat (tâches périodiques)
celery -A candidature_service beat -l info
```

---

## 6. Installation et Setup

### Étape 1: Ajouter les modèles

Copier le contenu de `models_new_documents.py` dans `candidature_app/models.py`:

```python
# Ajouter à la fin de models.py
class DocumentType(models.Model):
    ...

class Document(models.Model):
    ...

class ValidationDocument(models.Model):
    ...

class Dossier(models.Model):
    ...
```

### Étape 2: Créer les migrations

```bash
cd candidature_service
python manage.py makemigrations candidature_app
python manage.py migrate
```

### Étape 3: Ajouter les URLs

```python
# candidature_app/urls.py
from rest_framework.routers import DefaultRouter
from .views_depot_dossier import DepotDossierViewSet, liste_mes_dossiers, statut_dossier

router = DefaultRouter()
router.register(r'dossier', DepotDossierViewSet, basename='dossier')

urlpatterns = [
    ...
    path('', include(router.urls)),
    path('api/dossier/mes-dossiers/', liste_mes_dossiers, name='mes_dossiers'),
    path('api/dossier/<int:candidature_id>/', statut_dossier, name='statut_dossier'),
]
```

### Étape 4: Configurer le stockage des fichiers

```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Permissions de fichier
FILE_UPLOAD_PERMISSIONS = 0o644
FILE_UPLOAD_DIRECTORY_PERMISSIONS = 0o755
```

### Étape 5: Installer les dépendances OCR

```bash
pip install PyPDF2 Pillow pytesseract

# Sur Linux/Mac
brew install tesseract  # Mac
sudo apt-get install tesseract-ocr  # Ubuntu
```

---

## 7. Sécurité

### Sécurisations implémentées

- ✅ **Authentification**: IsAuthenticated obligatoire
- ✅ **Autorisation**: Vérification que candidat == request.user
- ✅ **Checksum**: SHA256 contre les doublons
- ✅ **Limite taille**: 10MB max par fichier
- ✅ **Format**: Validation des extensions acceptées
- ✅ **Uploads**: Chemin d'upload isolé et datéd
- ✅ **Dates**: Vérification délai de dépôt

### À ajouter en production

```python
# Antivirus (ClamAV)
CLAM_AV_ENABLED = True
CLAM_AV_PATH = '/usr/bin/clamscan'

# Rate limiting
from rest_framework.throttling import UserRateThrottle

class UploadRateThrottle(UserRateThrottle):
    scope = 'upload'
    THROTTLE_RATES = {'upload': '100/day'}  # 100 uploads par jour max

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/log/isimm/uploads.log',
            'maxBytes': 1024 * 1024 * 10,  # 10 MB
            'backupCount': 5,
        },
    },
    'loggers': {
        'candidature_app.views_depot_dossier': {
            'handlers': ['file'],
            'level': 'INFO',
        },
    },
}
```

---

## 8. Tests

### Exécuter les tests

```bash
python manage.py test candidature_app.tests_depot_dossier

# Avec couverture
coverage run --source='candidature_app' manage.py test
coverage report
coverage html
```

### Coverage Expected

- ✅ 95%+ couverture des views
- ✅ 90%+ couverture des modèles
- ✅ 13 tests d'intégration (test_01 à test_13)
- ✅ Tests unitaires (DocumentModelTest, DossierModelTest)

---

## 9. Problèmes et Solutions

| Problème                       | Cause                     | Solution                                  |
| ------------------------------ | ------------------------- | ----------------------------------------- |
| OCR ne marche pas              | Tesseract pas installé    | `sudo apt-get install tesseract-ocr`      |
| Fichier uploadé mais pas en bd | Permissions dossier media | `chmod 755 media/`                        |
| Tâche Celery timeout           | Gros fichier PDF          | Augmenter `CELERY_TASK_TIME_LIMIT = 3600` |
| Email non envoyé               | Backend SMTP mauvais      | Vérifier `EMAIL_HOST`, `EMAIL_PORT`       |
| Score OCR toujours 0           | Donnees_extraites vide    | Vérifier formats de fichier               |

---

## 10. Maintenance

### Nettoyer les fichiers orphelins

```python
# management/commands/cleanup_orphaned_files.py
@shared_task
def nettoyer_fichiers_orphelins():
    docs_deleted = Document.objects.filter(
        created_at__lt=timezone.now() - timedelta(days=30),
        statut='erreur_ocr'
    ).delete()
    return docs_deleted
```

### Vérifier l'intégrité

```bash
# Vérifier les checksums
python manage.py shell
>>> from candidature_app.models import Document
>>> docs = Document.objects.all()
>>> for doc in docs:
...     # Calculer le checksum réel
...     # et le comparer avec le stocké
...     pass
```

---

## 11. Métriques et Monitoring

```python
@api_view(['GET'])
def statistiques_dossiers(request):
    """Dashboard de monitoring"""
    return Response({
        'total_dossiers': Dossier.objects.count(),
        'dossiers_complets': Dossier.objects.filter(statut='complet').count(),
        'documents_traites': Document.objects.filter(statut='valide').count(),
        'moyenne_completude': Dossier.objects.aggregate(Avg('score_completude')),
        'erreurs_ocr': Document.objects.filter(statut='erreur_ocr').count(),
    })
```

---

## 12. Prochaines Améliorations

- 🔄 Version mobile natif (React Native)
- 🔐 Signature numérique des documents
- 📊 Dashboard de commission pour audit
- 🌍 Support multilingue
- 📧 Templates email personnalisables
- 🔍 Recherche et filtrage avancés

---

**Fin du Guide - Documents complets et tests validés! 🎉**
