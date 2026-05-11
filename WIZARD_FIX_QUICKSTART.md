# 🚀 QUICK START - Test Wizard Submission Fix

## 5-Minute Quick Test

### Option 1: Full Integration Test (Recommended)

**Windows (PowerShell)**:

```powershell
cd c:\Users\HP\Desktop\PFE
.\run_wizard_tests.ps1
```

**Linux/Mac (Bash)**:

```bash
cd /path/to/PFE
bash run_wizard_tests.sh
```

Expected output:

```
✅ Services are ready
✅ Migrations completed
✅ Test data initialized
✅ ALL TESTS PASSED!
```

---

### Option 2: Manual Testing

**Step 1: Start Services**

```bash
cd isimm-platform
docker-compose up -d
```

**Step 2: Run Migrations**

```bash
docker-compose exec auth-service python manage.py migrate --noinput
docker-compose exec user-service python manage.py migrate --noinput
docker-compose exec candidature-service python manage.py migrate --noinput
```

**Step 3: Initialize Test Data**

```bash
docker-compose exec candidature-service python /app/init_test_data.py
```

**Step 4: Run API Test**

```bash
cd ..
python test_wizard_submission.py
```

**Step 5: Manual UI Test**

1. Open browser: http://localhost:4200
2. Login with: test@example.com / TestPassword123
3. Navigate to dashboard
4. Click "Nouvelle candidature"
5. Fill Step 1 (personal info)
6. Fill Step 2 (academic data):
   - Année 1: 15.5
   - Année 2: 16.0
   - Année 3: 14.5
   - BAC moyenne: 15.5
   - Math: 16.0
   - French: 15.5
   - English: 14.5
7. Click "Soumettre"
8. Watch console (F12) for logs:
   - 🧮 calculateWizardScoreFromBackend() called
   - ✅ Score calculation succeeded
   - 📤 proceedWithSubmission() called
9. Candidature should submit with score ✅

---

## 🔍 Console Logs to Expect

When submitting the form, you should see in browser F12 console:

```
🧮 calculateWizardScoreFromBackend() called
  Step 2 valid: true
📤 Sending score calculation request: {
  formation_code: "MPGL",
  master_id: 1,
  academic_data_keys: [...],
  ...
}
⏳ Waiting for score calculation to complete...
✅ Score calculation succeeded: {score: 15.36, master_id: 1, ...}
  Score set to: 15.36
✅ Score calculated: 15.36
📤 proceedWithSubmission() called {score: 15.36, ...}
  Payload keys: ['nature_candidature', 'academic_data', 'score_previsualisation', ...]
```

---

## ✅ What Changed

**File Modified**:

- `isimm-platform/frontend/src/app/components/candidat/dashboard-candidat/dashboard-candidat.ts`

**Key Changes**:

1. `submitWizardCandidature()` now **waits** for score calculation (max 5s)
2. New method `proceedWithSubmission()` handles actual submission
3. Added detailed console logging for debugging
4. No more double-click needed by user

---

## 🐛 If Tests Fail

### Error: "Services did not start in time"

```bash
# Check Docker status
docker ps
# If empty, Docker Compose failed to start
docker-compose logs
```

### Error: "Connection refused" on test

```bash
# Check if services are running
curl http://localhost:8001/api/auth/health
curl http://localhost:8003/api/candidature/offres/

# If not responding, check logs
docker-compose logs auth-service
docker-compose logs candidature-service
```

### Error: "Test user creation failed"

```bash
# Manually create test user
docker-compose exec auth-service python manage.py shell
>>> from auth_app.models import User
>>> user = User.objects.create_user('test@example.com', 'TestPassword123')
>>> user.nom = 'Test'
>>> user.prenom = 'User'
>>> user.save()
>>> exit()
```

### Error: "FormuleScore not found"

```bash
# Initialize test data
docker-compose exec candidature-service python init_test_data.py

# Or manually check
docker-compose exec candidature-service python manage.py shell
>>> from candidature_app.models import Master, FormuleScore
>>> Master.objects.all()
>>> FormuleScore.objects.all()
```

---

## 📊 Testing Checklist

- [ ] Services started successfully
- [ ] Migrations completed
- [ ] Test user created
- [ ] Test data initialized
- [ ] API test passed (python test_wizard_submission.py)
- [ ] Can login to UI
- [ ] Can fill wizard form
- [ ] Console shows score calculation logs
- [ ] Candidature submitted successfully

---

## 🔗 Related Files

- `WIZARD_SUBMISSION_FIX_SUMMARY.md` - Full technical details
- `test_wizard_submission.py` - API test script
- `init_test_data.py` - Test data initialization
- `run_wizard_tests.sh` - Linux/Mac integration script
- `run_wizard_tests.ps1` - Windows integration script

---

**Status**: ✅ Ready for Testing
**Duration**: ~5-10 minutes
