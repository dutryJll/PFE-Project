# ÉTAPE 3: Système Multi-Commissions - Implémentation Backend

## 📋 Vue d'ensemble

Cette étape met en place le système de multi-commissions permettant aux responsables et membres de commission de gérer plusieurs commissions simultanément.

**Statut**: ✅ Backend endpoints implémentés et prêts pour test

## 🎯 Architecture

### Flux de communication

```
Frontend (Angular)
    ↓
    └─→ auth-service (8001)
           ├─ GET /api/auth/my-commissions/
           │   └─→ Appelle candidature_service
           │       └─ GET /api/commissions/my-commissions/?user_id=X
           │
           └─ POST /api/auth/select-commission/
               └─→ Appelle candidature_service
                   └─ GET /api/commissions/commission-members/?commission_id=X
                       (pour validation)
```

## 🔧 Endpoints Implémentés

### 1. **auth-service** - Endpoints Publics

#### `GET /api/auth/my-commissions/`
**Récupère les commissions de l'utilisateur authentifié**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8001/api/auth/my-commissions/
```

**Réponse (200):**
```json
{
  "success": true,
  "count": 2,
  "user_id": 42,
  "commissions": [
    {
      "id": 1,
      "nom": "Commission MPGL",
      "description": "Commission Master Professionnel Génie Logiciel",
      "master_id": 5,
      "master_nom": "Master Professionnel en Ingenierie Logicielle",
      "actif": true,
      "role": "responsable"
    }
  ]
}
```

#### `POST /api/auth/select-commission/`
**Sélectionne la commission active pour l'utilisateur**

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"commission_id": 1}' \
  http://localhost:8001/api/auth/select-commission/
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Commission sélectionnée avec succès",
  "commission_id": 1,
  "commission_nom": "Commission MPGL",
  "members_count": 3,
  "members": [
    {
      "id": 1,
      "user_id": 42,
      "first_name": "Ahmed",
      "last_name": "Ben Ali",
      "email": "ahmed@isimm.tn",
      "role": "responsable",
      "date_nomination": "2024-01-15"
    }
  ]
}
```

---

### 2. **candidature_service** - Endpoints Internes

#### `GET /api/commissions/my-commissions/?user_id=X`
**Retourne les commissions liées à un utilisateur (appelé par auth-service)**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8003/api/commissions/my-commissions/?user_id=42"
```

**Réponse (200):**
```json
{
  "success": true,
  "user_id": 42,
  "count": 2,
  "commissions": [
    {
      "id": 1,
      "nom": "Commission MPGL",
      "description": "Commission Master Professionnel Génie Logiciel",
      "master_id": 5,
      "master_nom": "Master Professionnel en Ingenierie Logicielle",
      "actif": true,
      "role": "responsable"
    }
  ]
}
```

#### `GET /api/commissions/commission-members/?commission_id=X`
**Retourne les membres d'une commission**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8003/api/commissions/commission-members/?commission_id=1"
```

**Réponse (200):**
```json
{
  "success": true,
  "commission_id": 1,
  "commission_nom": "Commission MPGL",
  "count": 3,
  "members": [
    {
      "id": 1,
      "user_id": 42,
      "first_name": "Ahmed",
      "last_name": "Ben Ali",
      "email": "ahmed@isimm.tn",
      "role": "responsable",
      "date_nomination": "2024-01-15"
    }
  ]
}
```

## 📁 Fichiers Modifiés

### Backend

#### 1. `services/auth-service/auth_app/views.py`
- ✅ **Implémentation complète** des deux endpoints:
  - `my_commissions(request)` - Appel HTTP à candidature_service
  - `select_commission(request)` - Validation et sélection
- Gestion des erreurs avec fallback
- Stockage en session

#### 2. `services/candidature_service/candidature_app/views.py`
- ✅ **Implémentation complète** des deux endpoints:
  - `get_my_commissions_from_candidature(request)` - Récupération via MembreCommission
  - `get_commission_members_list(request)` - Liste des membres
- Requêtes optimisées avec select_related/prefetch_related
- Gestion des permissions

#### 3. `services/candidature_service/candidature_app/urls.py`
- ✅ Routes enregistrées (lignes 102-103):
  ```python
  path('commissions/my-commissions/', views.get_my_commissions_from_candidature, ...),
  path('commissions/commission-members/', views.get_commission_members_list, ...),
  ```

#### 4. `services/auth-service/auth_app/urls.py`
- ✅ Routes enregistrées (lignes 27-28):
  ```python
  path('my-commissions/', views.my_commissions, name='my_commissions'),
  path('select-commission/', views.select_commission, name='select_commission'),
  ```

#### 5. `services/auth-service/config/settings.py`
- ✅ Configuration:
  ```python
  CANDIDATURE_SERVICE_URL = config('CANDIDATURE_SERVICE_URL', default='http://localhost:8003')
  ```

## 🧪 Test

### Utiliser le script de test fourni

```bash
cd c:\Users\HP\Desktop\PFE\
python test_commission_endpoints.py
```

Ce script teste:
1. ✅ Login utilisateur
2. ✅ Récupération des commissions
3. ✅ Appel direct à candidature_service
4. ✅ Sélection d'une commission
5. ✅ Récupération des membres

### Test manuel avec curl

```bash
# 1. Login
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@isimm.tn","password":"pass123"}'

# 2. Récupérer les commissions
curl -H "Authorization: Bearer <token>" \
  http://localhost:8001/api/auth/my-commissions/

# 3. Sélectionner une commission
curl -X POST http://localhost:8001/api/auth/select-commission/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"commission_id":1}'
```

## 🔐 Sécurité & Permissions

### Authentification
- ✅ Tous les endpoints nécessitent `IsAuthenticated`
- ✅ Token JWT forwardé à candidature_service
- ✅ Fallback en cas d'indisponibilité du service

### Autorisations
- **my_commissions**: Requis `['commission', 'responsable_commission', 'admin']`
- **select_commission**: Requis `['commission', 'responsable_commission', 'admin']`
- **get_my_commissions_from_candidature**: Requis `IsAuthenticated`
- **get_commission_members_list**: Requis `IsAuthenticated`

### Validation
- ✅ Vérification que l'utilisateur est membre de la commission
- ✅ Gestion des commissions actives/inactives
- ✅ Protection contre l'accès non autorisé

## 📊 Modèle de données utilisé

```
User
  ├─ id
  ├─ email
  ├─ role (candidat, commission, responsable_commission, admin)
  └─ is_active

Commission
  ├─ id
  ├─ nom
  ├─ description
  ├─ master_id (FK)
  ├─ actif
  └─ created_at, updated_at

MembreCommission
  ├─ id
  ├─ user (FK → User)
  ├─ commission (FK → Commission) [legacy]
  ├─ commissions (M2M → Commission) [multi-commission support]
  ├─ role ('responsable' | 'membre')
  ├─ date_nomination
  ├─ actif
  └─ created_at, updated_at
```

## 🚀 Prochaines étapes

### Frontend (Priorité 1)
- [ ] Créer composant dropdown de sélection commission
- [ ] Afficher la liste des commissions à la connexion
- [ ] Sauvegarder la sélection en localStorage
- [ ] Afficher la commission active dans la navbar

### Backend (Priorité 2)
- [ ] Ajouter filtre `commission_id` à tous les endpoints candidature
- [ ] Adapter `GET /api/candidatures/responsable/` pour filtrer par commission
- [ ] Implémenter les filtres par commission dans le dashboard

### Tests (Priorité 3)
- [ ] Tests unitaires pour les endpoints
- [ ] Tests d'intégration complète
- [ ] Tests de performance

## 📝 Notes d'implémentation

### Points clés
1. **Inter-service communication**: Les appels HTTP utilisent `requests` avec timeout=5s
2. **Fallback resilience**: Si candidature_service est down, auth-service accepte quand même la sélection
3. **Session storage**: La sélection est stockée en `request.session['selected_commission_id']`
4. **Token forwarding**: L'Authorization header est forwardé depuis le request client
5. **Error handling**: Codes HTTP appropriés (403, 404, 503) avec messages explicites

### Pattern utilisé
```python
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def endpoint(request):
    try:
        # Logique
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Error message")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

## 📞 Support & Debugging

### Vérifier la configuration
```python
# Dans Django shell
from django.conf import settings
print(settings.CANDIDATURE_SERVICE_URL)
```

### Logs
```bash
# auth-service
tail -f logs/auth_service.log | grep "commission"

# candidature_service  
tail -f logs/candidature_service.log | grep "commission"
```

### Requêtes de debug
```bash
# Vérifier la connectivité
curl http://localhost:8003/api/commissions/my-commissions/ -v

# Voir les headers
curl -v -H "Authorization: Bearer <token>" \
  http://localhost:8001/api/auth/my-commissions/
```

---

**Développeur**: GitHub Copilot
**Date**: 2025-01-15
**Version**: 1.0 - Backend endpoints prêts pour intégration frontend
