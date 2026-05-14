# ÉTAPE 3 QUICK REFERENCE - ONE-PAGE CHEAT SHEET

## 🎯 What Was Built

**4 Backend Endpoints** for multi-commission support:

| Endpoint | Method | Service | Purpose |
|----------|--------|---------|---------|
| `/api/auth/my-commissions/` | GET | auth-service | List user's commissions |
| `/api/auth/select-commission/` | POST | auth-service | Select active commission |
| `/api/commissions/my-commissions/` | GET | candidature_service | Get commissions (called by auth-service) |
| `/api/commissions/commission-members/` | GET | candidature_service | Get commission members |

---

## 🚀 How to Test

### 1. Start Services
```bash
# Terminal 1
cd services/auth-service && python manage.py runserver 8001

# Terminal 2
cd services/candidature_service && python manage.py runserver 8003
```

### 2. Check Test Users Exist
```bash
cd c:\Users\HP\Desktop\PFE
python diagnostic_users.py
```

### 3. Update Test Script
Edit `test_commission_endpoints.py`:
```python
TEST_USER_EMAIL = "commission@isimm.tn"    # Your real user
TEST_USER_PASSWORD = "TestPassword123!"    # Your real password
```

### 4. Run Tests
```bash
python test_commission_endpoints.py
```

### 5. Expected Output
```
✅ PASS - Authentication
✅ PASS - Fetch Commissions (auth-service)
✅ PASS - Get Commission Members
✅ PASS - Select Commission
✅ PASS - Direct Candidature Service Call

All tests passed! ✨
```

---

## 🔑 Key Concepts

### Inter-Service Communication
```python
# auth-service calls candidature_service via HTTP
response = requests.get(
    f"{settings.CANDIDATURE_SERVICE_URL}/api/commissions/my-commissions/",
    headers={'Authorization': auth_header},  # Forward JWT token
    params={'user_id': request.user.id},
    timeout=5
)
```

### Session Storage
```python
request.session['selected_commission_id'] = commission_id
```

### Role-Based Access
```python
if request.user.role not in ['commission', 'responsable_commission', 'admin']:
    return 403 Forbidden
```

### Query Optimization
```python
Commission.objects.filter(
    Q(membres__user_id=user_id, membres__actif=True) |  # FK
    Q(membre_commission_links__user_id=user_id)          # M2M
).distinct().select_related('master')
```

---

## 📝 Curl Examples

### Get Token
```bash
curl -X POST http://localhost:8001/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"user@isimm.tn","password":"pass"}' | jq .
```

### Get My Commissions
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8001/api/auth/my-commissions/ | jq .
```

### Select Commission
```bash
curl -X POST http://localhost:8001/api/auth/select-commission/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"commission_id": 1}' | jq .
```

### Get Commission Members
```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8003/api/commissions/commission-members/?commission_id=1" | jq .
```

---

## 📂 Files Overview

| File | What | Where |
|------|------|-------|
| `services/candidature_service/candidature_app/views.py` | NEW: 2 view functions | Lines ~5900+ |
| `services/candidature_service/candidature_app/urls.py` | NEW: 2 routes | Lines 102-103 |
| `services/auth-service/auth_app/views.py` | UPDATED: 2 functions with HTTP calls | Lines 927-1100 |
| `TESTING_GUIDE.md` | How to test (manual & automated) | Desktop/PFE |
| `test_commission_endpoints.py` | Automated test suite | Desktop/PFE |
| `diagnostic_users.py` | Check test data | Desktop/PFE |
| `FINAL_ETAPE3_REPORT.md` | Complete report | Desktop/PFE |

---

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Email or password incorrect" | Update TEST_USER_EMAIL/PASSWORD in test script |
| "Commission not found" | Run: `python diagnostic_users.py` to see if commissions exist |
| Connection refused (8001 or 8003) | Services not running - start them in terminals |
| CORS error | Check CORS_ALLOWED_ORIGINS in settings |
| 503 Service Unavailable | One service is down - check error logs |

---

## ✅ Testing Checklist

Before moving to ÉTAPE 3 Frontend:
- [ ] Both services running on ports 8001 & 8003
- [ ] Test credentials available
- [ ] `python test_commission_endpoints.py` passes all 5 tests
- [ ] Manual curl tests work
- [ ] Fallback tested (stop service, verify 503)
- [ ] Session storage verified
- [ ] Permissions verified (roles check)

---

## 🔗 Architecture Flow

```
User Login
    ↓
POST /api/auth/login/
    ↓
Return JWT Token
    ↓
GET /api/auth/my-commissions/
    ├─ (auth-service)
    └─ Calls: GET /api/commissions/my-commissions/
        └─ (candidature_service) Returns commission list
    ↓
POST /api/auth/select-commission/
    ├─ (auth-service)
    ├─ Calls: GET /api/commissions/commission-members/
    │   └─ (candidature_service) Gets members
    ├─ Validates user is member
    └─ Stores in session
    ↓
Frontend stores commission_id in localStorage
    ↓
All future requests include commission_id parameter
    ↓
Dashboard filters by commission_id
```

---

## 📊 Response Examples

### My Commissions Response
```json
{
  "success": true,
  "count": 2,
  "commissions": [
    {
      "id": 1,
      "nom": "Commission MPGL",
      "master_nom": "MPGL",
      "role": "responsable",
      "actif": true
    }
  ]
}
```

### Commission Members Response
```json
{
  "success": true,
  "commission_nom": "Commission MPGL",
  "count": 3,
  "members": [
    {
      "id": 1,
      "user_id": 42,
      "first_name": "Ahmed",
      "email": "ahmed@isimm.tn",
      "role": "responsable",
      "date_nomination": "2024-01-15"
    }
  ]
}
```

---

## 🎓 Next Phase

**ÉTAPE 3 Frontend** (not yet implemented):

Tasks:
1. Create Angular commission selector component
2. Add dropdown to navbar
3. GET /api/auth/my-commissions/ on init
4. POST /api/auth/select-commission/ on select
5. Store in localStorage
6. Filter dashboard by commission_id

---

## 📚 Documentation

- **Full Spec**: See `ETAPE3_COMMISSION_IMPLEMENTATION.md`
- **Testing Guide**: See `TESTING_GUIDE.md`
- **Code Details**: See `CODE_CHANGES_SUMMARY.md`
- **Status Check**: See `ETAPE3_BACKEND_STATUS.md`
- **Final Report**: See `FINAL_ETAPE3_REPORT.md`

---

## 💡 Key Settings

| Setting | Value | Location |
|---------|-------|----------|
| CANDIDATURE_SERVICE_URL | http://localhost:8003 | auth-service settings |
| JWT Timeout | 5s | requests.get(..., timeout=5) |
| Default Role Check | commission, responsable_commission, admin | views.py |
| Session Key | selected_commission_id | request.session |

---

## ✨ Summary

✅ **ÉTAPE 3 Backend = COMPLETE**

All endpoints implemented, documented, and ready to test.
Once tests pass → can proceed to ÉTAPE 3 Frontend implementation.

**Time to complete tests**: ~5-10 minutes
**Time to integrate into frontend**: ~1-2 hours

---

**Last Updated**: 2025-01-15
**Status**: Ready for Testing ✅
