# ÉTAPE 3 - TESTING GUIDE ✅

**Status**: Implementation Complete - Ready for Testing
**Date**: 2025-01-15

---

## 🎯 Quick Start Testing (5 minutes)

### Prerequisites
Ensure both services are running:
```bash
# Terminal 1: Auth Service (port 8001)
cd services/auth-service
python manage.py runserver 8001

# Terminal 2: Candidature Service (port 8003)
cd services/candidature_service
python manage.py runserver 8003
```

### Step 1: Verify Users Exist

```bash
cd c:\Users\HP\Desktop\PFE
python diagnostic_users.py
```

This script will:
- ✅ List all users in the system
- ✅ Show commission/responsable users
- ✅ Check commission setup
- ✅ Provide test credentials

### Step 2: Update Test Credentials

Edit `test_commission_endpoints.py` and update these lines:
```python
TEST_USER_EMAIL = "commission@isimm.tn"  # <- Use real user from diagnostic
TEST_USER_PASSWORD = "TestPassword123!"   # <- Use real password
```

### Step 3: Run the Tests

```bash
python test_commission_endpoints.py
```

Expected output:
```
✅ PASS - Authentication
✅ PASS - Fetch Commissions (auth-service)
✅ PASS - Get Commission Members
✅ PASS - Select Commission
✅ PASS - Direct Candidature Service Call

All tests passed! ✨
```

---

## 🔧 Manual Testing (Advanced)

If you prefer to test manually with curl:

### 1. Get Authentication Token

```bash
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "commission@isimm.tn",
    "password": "TestPassword123!"
  }' | jq .
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 42,
    "email": "commission@isimm.tn",
    "role": "responsable_commission"
  }
}
```

Save the `access` token:
```bash
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGc..."
```

### 2. Test: Get My Commissions (Auth Service)

```bash
curl -X GET "http://localhost:8001/api/auth/my-commissions/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
```

Expected response:
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
      "master_nom": "MPGL",
      "actif": true,
      "role": "responsable"
    },
    {
      "id": 2,
      "nom": "Commission MPI",
      "description": "Commission Master Professionnel Informatique",
      "master_id": 6,
      "master_nom": "MPI",
      "actif": true,
      "role": "membre"
    }
  ]
}
```

### 3. Test: Get My Commissions (Direct Candidature Service)

```bash
curl -X GET "http://localhost:8003/api/commissions/my-commissions/?user_id=42" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
```

Should return same data as auth-service (since auth-service calls this).

### 4. Test: Get Commission Members

```bash
curl -X GET "http://localhost:8003/api/commissions/commission-members/?commission_id=1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" | jq .
```

Expected response:
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
      "email": "ahmed.benali@isimm.tn",
      "role": "responsable",
      "date_nomination": "2024-01-15"
    },
    {
      "id": 2,
      "user_id": 43,
      "first_name": "Fatima",
      "last_name": "Trabelsi",
      "email": "fatima.trabelsi@isimm.tn",
      "role": "membre",
      "date_nomination": "2024-01-20"
    },
    {
      "id": 3,
      "user_id": 44,
      "first_name": "Mohamed",
      "last_name": "Karim",
      "email": "mohamed.karim@isimm.tn",
      "role": "membre",
      "date_nomination": "2024-02-01"
    }
  ]
}
```

### 5. Test: Select Commission

```bash
curl -X POST http://localhost:8001/api/auth/select-commission/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "commission_id": 1
  }' | jq .
```

Expected response:
```json
{
  "success": true,
  "message": "Commission sélectionnée avec succès",
  "commission_id": 1,
  "commission_nom": "Commission MPGL",
  "members_count": 3,
  "members": [...]
}
```

---

## 📊 Testing Scenarios

### Scenario 1: Responsable Commission Workflow

1. Login as responsable_commission
2. Get list of commissions → Should see 1+ commissions
3. Select one commission → Should see members
4. (Next step: Dashboard filters by commission_id)

**Expected Status Codes**: 200, 200, 200

### Scenario 2: Regular Commission Member

1. Login as commission (not responsable)
2. Get list of commissions → Should see 1+ commissions
3. Try to select commission → Should see members

**Expected Status Codes**: 200, 200, 200

### Scenario 3: Admin User

1. Login as admin
2. Get list of commissions → Should see all commissions
3. Select any commission → Should work (admin bypass)

**Expected Status Codes**: 200, 200, 200

### Scenario 4: Non-Commission User

1. Login as candidat (no commission role)
2. Try to get commissions → Should get 403 Forbidden

**Expected Status Codes**: 403

### Scenario 5: Service Unavailability

1. Stop candidature_service
2. Login as commission user
3. Call GET /api/auth/my-commissions/ → Should get 503 with empty list
4. Call POST /api/auth/select-commission/ → Should get 200 with warning

**Expected Status Codes**: 503, 200 (fallback)

---

## 🐛 Troubleshooting

### Issue: "Email or password incorrect" (401)

**Solution**: Update TEST_USER_EMAIL and TEST_USER_PASSWORD in test script
```bash
python diagnostic_users.py  # See available users
```

### Issue: "Commission not found" (404)

**Solution**: Create test commission and commission members
```bash
python manage.py shell

# From candidature_service shell:
from isimm_platform.models import Commission, Master, MembreCommission
from django.contrib.auth import get_user_model

# Create test commission
master = Master.objects.first()  # Get existing master
commission = Commission.objects.create(
    nom="Test Commission",
    description="For testing",
    master=master,
    actif=True
)

# Add user as member
User = get_user_model()
user = User.objects.get(email="commission@isimm.tn")
MembreCommission.objects.create(
    user=user,
    commission=commission,
    role='responsable',
    actif=True
)
```

### Issue: "Service Unavailable" (503)

**Solution**: Ensure both services are running
```bash
# Check port 8001
curl http://localhost:8001/api/auth/login/ -X OPTIONS

# Check port 8003
curl http://localhost:8003/api/commissions/my-commissions/ -X OPTIONS
```

### Issue: CORS Error

**Solution**: Ensure CORS is configured in both services

In `services/auth-service/config/settings.py`:
```python
INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Add before CommonMiddleware
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",  # Angular frontend
    "http://localhost:8003",  # Candidature service
]
```

---

## ✅ Validation Checklist

After running tests, verify:

- [ ] Authentication works (login returns token)
- [ ] my_commissions endpoint returns 200
- [ ] Commission list is not empty
- [ ] commission-members endpoint returns 200
- [ ] Members list includes first_name, last_name, email
- [ ] select-commission endpoint returns 200
- [ ] Session stores selected_commission_id
- [ ] Error handling works (try with invalid commission_id)
- [ ] Fallback works (stop service, verify 503 response)

---

## 📈 Performance Notes

**Expected response times**:
- Login: 50-200ms
- Get commissions: 100-300ms (includes HTTP call)
- Get members: 80-250ms
- Select commission: 150-400ms (includes validation)

**If slower**:
1. Check database indexes
2. Check network latency between services
3. Check service logs for slow queries

---

## 🔐 Security Validation

Before deploying, verify:

- [x] JWT token required for all endpoints
- [x] Role-based access control (commission/responsable_commission/admin)
- [x] User can only select commissions they're member of
- [x] Admin bypasses member check
- [x] Proper HTTP timeout (5s)
- [x] Error messages don't leak sensitive data
- [x] Authorization header properly forwarded

---

## 📝 Summary

| Endpoint | Method | Auth | Role Check | Status |
|----------|--------|------|-----------|--------|
| /api/auth/my-commissions/ | GET | ✅ | ✅ | Ready |
| /api/auth/select-commission/ | POST | ✅ | ✅ | Ready |
| /api/commissions/my-commissions/ | GET | ✅ | ✅ | Ready |
| /api/commissions/commission-members/ | GET | ✅ | ✅ | Ready |

**All endpoints are fully implemented and ready for testing!** ✨

---

**Generated**: 2025-01-15
**Version**: 1.0
