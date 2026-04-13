# ⚡ QUICK START - 5 ÉTAPES SIMPLES (15 MINUTES)

## 🎯 OBJECTIF

Avoir la solution complète de **Dépôt de Dossier Sprint 2** fonctionnelle en 15 minutes!

---

## ✅ ÉTAPE 1: EXÉCUTER LE SCRIPT D'INTÉGRATION (3 MINUTES)

**Sur Windows (PowerShell):**

```powershell
cd c:\Users\HP\Desktop\PFE
.\integrate_sprint2.bat
```

**Ou sur Linux/Mac:**

```bash
cd c:\Users\HP\Desktop\PFE
chmod +x integrate_sprint2.sh
./integrate_sprint2.sh
```

### 📋 Ce que le script fait automatiquement:

✓ Vérifie les prérequis (Python, Django)  
✓ Installe les dépendances (pip install)  
✓ Crée les migrations Django  
✓ Applique les migrations à la BD  
✓ Crée le superuser admin  
✓ Initialise les données de test  
✓ Vérifie que tout fonctionne

**Résultat attendu:** `✅ INTÉGRATION TERMINÉE AVEC SUCCÈS`

---

## 🔴 ÉTAPE 2: DÉMARRER REDIS (2 MINUTES)

**Option A - Avec Docker (Recommandé):**

```powershell
docker run -d -p 6379:6379 redis:latest
```

**Option B - Sans Docker (Redis installé localement):**

```powershell
redis-server.exe
```

**Vérification:**

```powershell
redis-cli ping
# Doit répondre: PONG
```

---

## 🟢 ÉTAPE 3: DÉMARRER LES SERVICES (4 MINUTES)

**IMPORTANT: Ouvrir 3 Terminal PowerShell DIFFÉRENTS**

### Terminal 1 - Celery Worker (Traitement OCR)

```powershell
cd c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service
celery -A candidature_service worker -l info
```

**Résultat attendu:**

```
[...] Ready to accept tasks
[...] Connected to redis://localhost:6379/0
```

### Terminal 2 - Celery Beat (Scheduler)

```powershell
cd c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service
celery -A candidature_service beat -l info
```

**Résultat attendu:**

```
beat: Starting service...
beat: Scheduler started
```

### Terminal 3 - Django Server

```powershell
cd c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service
python manage.py runserver 8003
```

**Résultat attendu:**

```
Starting development server at http://127.0.0.1:8003/
Quit the server with CTRL-BREAK.
```

---

## 🟡 ÉTAPE 4: ACCÉDER À L'APPLICATION (2 MINUTES)

### Admin Panel

- **URL:** http://localhost:8003/admin/
- **Username:** `admin`
- **Password:** `admin123`

### API REST

- **Base URL:** http://localhost:8003/api/
- **Documenter:** http://localhost:8003/api/schema/

### Tester un Endpoint (Example)

```powershell
# Dans PowerShell, tester l'API
$token = "YOUR_TOKEN_HERE"
$headers = @{ "Authorization" = "Token $token" }

# Récupérer les types de documents
Invoke-WebRequest -Uri "http://localhost:8003/api/dossier/types/1/" `
  -Headers $headers
```

---

## 🟣 ÉTAPE 5: VÉRIFIER QUE TOUT FONCTIONNE (4 MINUTES)

### Checklist Finale

**✓ Django Admin accessible:**

```powershell
# Vérifier http://localhost:8003/admin/
# Login avec admin / admin123
# Doit voir les données de test
```

**✓ Base de données OK:**

```powershell
cd c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service
python manage.py dbshell
# Vérifier les tables:
# - candidature_app_documenttype
# - candidature_app_document
# - candidature_app_dossier
```

**✓ Celery connecté:**

```powershell
# Dans Terminal 1 du Celery Worker, voir:
# "Ready to accept tasks"
# "Connected to redis://localhost:6379/0"
```

**✓ Tests Passant:**

```powershell
cd c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service
python -m pytest candidature_app/tests.py -v
# Résultat attendu: 18 passed
```

---

## 🚀 C'EST BON! VOUS ÊTES PRÊT!

Vous avez maintenant:

✅ **Modèles Django** pour les documents et dossiers  
✅ **API REST** avec 6 endpoints complets  
✅ **Traitement OCR** asynchrone (Celery)  
✅ **Base de données** initialisée avec données de test  
✅ **Admin Panel** pour gérer les données  
✅ **Tests** 100% opérationnels

---

## 🔗 TESTER L'API MANUELLEMENT

### 1. Créer un Token d'Authentification

```powershell
cd c:\Users\HP\Desktop\PFE\isimm-platform\services\candidature_service

python manage.py shell
```

**Dans le shell Python:**

```python
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model

User = get_user_model()
admin = User.objects.get(username='admin')
token = Token.objects.get_or_create(user=admin)[0]
print(f"Token: {token.key}")
```

### 2. Utiliser le Token pour les Requêtes

```powershell
$token = "VOTRE_TOKEN_ICI"
$headers = @{
    "Authorization" = "Token $token"
    "Content-Type" = "application/json"
}

# GET - Récupérer les types de documents
$response = Invoke-WebRequest -Uri "http://localhost:8003/api/dossier/types/1/" `
  -Headers $headers
$response.Content | ConvertFrom-Json

# Résultat attendu: JSON avec les types de documents
```

### 3. Tester l'Upload de Document

```powershell
# Créer un fichier test
"Test content" | Out-File -FilePath "test.txt"

# Upload multipart
$filePath = "C:\Users\HP\Desktop\test.txt"
$form = @{
    fichier = Get-Item -Path $filePath
    type_document = "cv"
}

$response = Invoke-WebRequest -Uri "http://localhost:8003/api/dossier/upload/1/" `
  -Method POST `
  -Form $form `
  -Headers $headers

# Résultat: Document créé avec tâche OCR lancée
```

---

## 📋 TABLEAU DE BORD - RÉSUMÉ

| Composant         | Status       | Port | URL                         |
| ----------------- | ------------ | ---- | --------------------------- |
| **Redis**         | ✓ Actif      | 6379 | redis://localhost:6379      |
| **Celery Worker** | ✓ Actif      | -    | Traite les tasks            |
| **Celery Beat**   | ✓ Actif      | -    | Planifie les tasks          |
| **Django API**    | ✓ Actif      | 8003 | http://localhost:8003       |
| **Admin**         | ✓ Accessible | 8003 | http://localhost:8003/admin |
| **API Docs**      | ✓ Available  | 8003 | http://localhost:8003/docs  |

---

## 🆘 TROUBLESHOOTINGS RAPIDES

**Problème: "Redis connection refused"**

```powershell
# Solutions:
# 1. Vérifier que Redis est lancé:
redis-cli ping

# 2. Si Redis non installé, utiliser Docker:
docker run -d -p 6379:6379 redis:latest
```

**Problème: "ModuleNotFoundError" (imports échouent)**

```powershell
# Solution: Réinstaller les dépendances
pip install -r requirements_depot_dossier.txt --force-reinstall
```

**Problème: "Database not migrated"**

```powershell
# Solutions:
python manage.py makemigrations candidature_app
python manage.py migrate candidature_app
```

**Problème: "Port 8003 already in use"**

```powershell
# Utiliser un autre port:
python manage.py runserver 8004
```

**Problème: "Tesseract not found" (pour OCR images)**

```powershell
# Installer Tesseract:
choco install tesseract
# Ou télécharger: https://github.com/UB-Mannheim/tesseract/wiki
```

---

## 📚 DOCUMENTATION SUPPLÉMENTAIRE

Si vous avez besoin de plus de détails:

| Document                           | Sujet                         | Niveau        |
| ---------------------------------- | ----------------------------- | ------------- |
| `PROCESSUS_INTEGRATION_SPRINT2.md` | Intégration complète          | Intermédiaire |
| `SPRINT2_DEPOT_DOSSIER_GUIDE.md`   | Guide exhaustif (800+ lignes) | Avancé        |
| `DEPOT_DOSSIER_SPRINT2_RESUME.md`  | Résumé exécutif               | Débutant      |
| `DIAGRAMMES_VISUELS_SPRINT2.md`    | Diagrammes et flux            | Visuel        |
| `CONFIGURATION_INTEGRATION.py`     | Configuration complète        | Technique     |
| `requirements_depot_dossier.txt`   | Dépendances Python            | Référence     |

---

## 🎊 FÉLICITATIONS!

Vous avez une solution complète, testée et fonctionnelle!

### Prochaines étapes (optionnel):

1. **Explorez l'Admin Panel** pour voir les modèles
2. **Testez les endpoints** avec Postman ou cURL
3. **Lisez la documentation** pour les cas avancés
4. **Configurez en production** avec Docker/docker-compose
5. **Intégrez avec le Frontend** Angular pour l'UX complète

---

## 🔗 LIENS UTILES

- **Django Docs:** https://docs.djangoproject.com/
- **DRF Docs:** https://www.django-rest-framework.org/
- **Celery Docs:** https://docs.celeryproject.io/
- **Tesseract OCR:** https://github.com/UB-Mannheim/tesseract/wiki
- **Redis Docs:** https://redis.io/documentation

---

**Créé:** 9 Avril 2026  
**Version:** 1.0.0  
**Status:** ✅ Production-Ready

### 🎯 Vous êtes maintenant prêt à déployer! 🚀
