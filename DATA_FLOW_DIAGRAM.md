# 📊 Data Flow Diagram - Wizard Submission

## Frontend to Backend Communication

```
┌─────────────────────────────────────────────────────────────────────┐
│                     USER INTERACTION                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Step 1: Fill Personal Info                                       │
│  ├─ Name, Surname, Email, Phone, CIN                              │
│  └─ wizardData.nom, wizardData.prenom, etc. ✅                   │
│                                                                     │
│  Step 2: Fill Academic Data                                       │
│  ├─ BAC Average: moyenneBacPrincipale = "15.5"                   │
│  ├─ Bac Math: noteMathBac = "16.0"                                │
│  ├─ Bac French: noteFrancaisBac = "15.5"                         │
│  ├─ Bac English: noteAnglaisBac = "14.5"                         │
│  ├─ Year 1 Average: moyenne1Annee = "15.5"                       │
│  ├─ Year 2 Average: moyenne2Annee = "16.0"                       │
│  └─ Year 3 Average: moyenne3Annee = "14.5"                       │
│                                                                     │
│  Step 3: Select Offer & Submit                                    │
│  └─ Click "Soumettre" Button                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│            submitWizardCandidature() CALLED                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Validate all steps are complete ✅                            │
│     isWizardSubmissionAllowed() → true                             │
│                                                                     │
│  2. Check if score already calculated                              │
│     wizardComputedScoreBackend = null? → YES                      │
│     isWizardStepValid(2)? → YES                                   │
│                                                                     │
│  3. Trigger score calculation                                      │
│     calculateWizardScoreFromBackend()                              │
│                                                                     │
│  4. Poll for score with 300ms interval (max 5s)                  │
│     while (wizardComputedScoreBackend === null)                   │
│                                                                     │
│  5. Once score arrives → proceedWithSubmission()                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│       calculateWizardScoreFromBackend() BUILDS PAYLOAD               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Build Academic Data Structure                                  │
│     buildWizardAcademicDataPayload()                               │
│                                                                     │
│     Returns:                                                        │
│     {                                                               │
│       common: {                                                     │
│         session: "Principale",                                      │
│         redoublements: 0                                            │
│       },                                                            │
│       glDs: {                                                       │
│         moy1: 15.5,                                                │
│         moy2: 16.0,                                                │
│         moy3: 14.5                                                 │
│       },                                                            │
│       i3: { ... },  // MP3I specific                               │
│       mrglLicence: { ... },  // MRGL specific                      │
│       // ... other formation types ...                              │
│     }                                                               │
│                                                                     │
│  2. Get Formation Code                                             │
│     getWizardFormationCode(offre)                                  │
│     Returns: "MPGL" | "MPDS" | "MP3I" | etc.                      │
│                                                                     │
│  3. Parse Numeric Values                                           │
│     parseWizardNumeric("15,5") → 15.5                              │
│     parseWizardNumeric("16.0") → 16.0                              │
│                                                                     │
│  4. Build Complete Payload                                         │
│     {                                                               │
│       master_id: 1,                                                │
│       formation_code: "MPGL",                                      │
│       academic_data: { ... },  // ← Structure from step 1          │
│       moyenneBac: 15.5,                                            │
│       noteMathBac: 16.0,                                           │
│       noteFrancaisBac: 15.5,                                       │
│       noteAnglaisBac: 14.5,                                        │
│       moyenne1: 15.5,                                              │
│       moyenne2: 16.0,                                              │
│       moyenne3: 14.5,                                              │
│       nombreRedoublement: 0,                                       │
│       session1: "Principale",                                      │
│       ... more fields ...                                          │
│     }                                                               │
│                                                                     │
│  5. Send POST to /api/candidature/preview-score/                  │
│     Headers: { Authorization: "Bearer {token}" }                   │
│     Body: payload (from step 4)                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           HTTP POST /api/candidature/preview-score/                 │
│                   (Django Backend)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Incoming Payload:                                                  │
│  {                                                                   │
│    master_id: 1,                                                    │
│    formation_code: "MPGL",                                          │
│    academic_data: { common, glDs, ... },                           │
│    payloadExtra fields...                                           │
│  }                                                                   │
│                                                                     │
│  Backend Processing:                                                │
│  1. Get Master(id=1)                                                │
│     if not exists → return 404                                      │
│                                                                     │
│  2. Get FormuleScore for Master                                     │
│     if not exists → return 400 "No formula defined"                │
│                                                                     │
│  3. Parse academic_data structure                                   │
│     Extract formation-specific values:                              │
│     - If MPGL/MPDS: use glDs.moy1, moy2, moy3                     │
│     - If MP3I: use i3.moyL1, moyL2, moyL3                         │
│     - If MRGL: use mrglLicence or mrglMaitrise                     │
│     - If MRMI: use mrmiCas1 or mrmiCas2                            │
│     - If ING_*: use ingCas1 or ingCas2                             │
│                                                                     │
│  4. Calculate moyenne_generale                                      │
│     _avg([moy1, moy2, moy3]) with null filtering                   │
│                                                                     │
│  5. Build payload for FormuleScore.calculer_score()               │
│     {                                                               │
│       payload: { full academic_data dict },                        │
│       moyenne_generale: 15.33,                                     │
│       moyenne_specialite: 15.50,                                   │
│       nb_redoublements: 0,                                         │
│       session_reussite: "Principale",                              │
│       ... more fields ...                                          │
│     }                                                               │
│                                                                     │
│  6. Call FormuleScore.calculer_score(payload)                      │
│     This evaluates the formula and returns a numeric score         │
│                                                                     │
│  7. Build Response                                                  │
│     {                                                               │
│       success: true,                                                │
│       score: 15.36,  ← ✅ THE SCORE                                │
│       master_id: 1,                                                 │
│       master_nom: "Master MPGL"                                    │
│     }                                                               │
│                                                                     │
│  8. Return JSON 200 OK                                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│      HTTP Response Received (HTTP 200)                              │
│      {                                                               │
│        success: true,                                                │
│        score: 15.36,                                               │
│        master_id: 1,                                                │
│        master_nom: "Master MPGL"                                   │
│      }                                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Frontend Processing:                                               │
│  1. Subscribe callback → response.json()                            │
│                                                                     │
│  2. Extract score from response                                     │
│     wizardComputedScoreBackend = 15.36                             │
│                                                                     │
│  3. Set loading flag to false                                       │
│     wizardComputedScoreLoading = false                             │
│                                                                     │
│  4. Polling interval detects change                                 │
│     if (wizardComputedScoreBackend !== null) → MATCH!              │
│                                                                     │
│  5. Clear polling interval & call proceedWithSubmission()           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│      proceedWithSubmission() BUILDS FINAL PAYLOAD                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  wizardPayload = {                                                   │
│    nature_candidature: "Étudiant ISIMM",                           │
│    etablissement_externe: null,                                     │
│    specialite_externe: null,                                        │
│    etablissement_origine: "ISIMM",                                 │
│    selected_diplome: "Licence",                                    │
│    diplome_reference: "Informatique",                              │
│    formation_code: "MPGL",                                         │
│    score_previsualisation: 15.36,  ← ✅ SCORE INCLUDED!          │
│    academic_data: { ... }  ← Structured academic data              │
│  }                                                                   │
│                                                                     │
│  Call: this.postuler(offre, wizardPayload)                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│      HTTP POST /api/candidature/create/                             │
│                   (Django Backend)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Incoming Payload:                                                  │
│  {                                                                   │
│    nature_candidature: "Étudiant ISIMM",                           │
│    formation_code: "MPGL",                                         │
│    score_previsualisation: 15.36,                                  │
│    academic_data: { ... }                                           │
│    ... other fields ...                                             │
│  }                                                                   │
│                                                                     │
│  Backend Processing:                                                │
│  1. Validate payload                                                │
│  2. Create Candidature object with all fields                       │
│  3. Save to database ✅                                             │
│  4. Return HTTP 201 Created                                         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│           USER SEES SUCCESS MESSAGE ✅                              │
│                                                                     │
│  "Candidature créée avec succès!"                                  │
│                                                                     │
│  Candidature stored with:                                           │
│  ├─ ID: 12345                                                      │
│  ├─ Score: 15.36                                                   │
│  ├─ Status: Pending Review                                         │
│  ├─ Academic Data: Structured JSON                                 │
│  └─ Creation Date: 2024-XX-XX                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 State Changes During Submission

### wizardComputedScoreBackend State

```
Initial State: null
    ↓
User clicks "Soumettre"
    ↓
calculateWizardScoreFromBackend() called
    ↓
API Request sent to /preview-score/
    ↓
wizardComputedScoreLoading = true
    ↓
[Waiting for response...]
    ↓
Response received: {score: 15.36}
    ↓
wizardComputedScoreBackend = 15.36  ← ✅ UPDATED
    ↓
wizardComputedScoreLoading = false
    ↓
Polling detects change → proceedWithSubmission()
    ↓
Final submission with score ✅
```

---

## 📝 Data Structure Reference

### buildWizardAcademicDataPayload() Output

For **MPGL/MPDS**:

```json
{
  "common": {"session": "Principale", "redoublements": 0},
  "glDs": {"moy1": 15.5, "moy2": 16.0, "moy3": 14.5},
  "i3": {...},
  "mrglLicence": {...},
  ...
}
```

For **MP3I**:

```json
{
  "common": {...},
  "glDs": {...},
  "i3": {"moyBac": 15.5, "moyL1": 15.5, "moyL2": 16.0, "moyL3": 14.5, ...},
  ...
}
```

For **MRGL**:

```json
{
  "common": {...},
  "mrglLicence": {"moy1": 15.5, "moy2": 16.0, "moy3": 14.5, "moyBac": 15.5},
  "mrglMaitrise": {"moy1": ..., "moy2": ..., "moy3": ..., "moy4": ..., "moyBac": ...},
  ...
}
```

---

## ✅ Validation Points

```
Request Data:
├─ master_id exists? ✅
├─ formation_code recognized? ✅
├─ academic_data is dict? ✅
├─ academic_data has required keys? ✅
└─ Numeric values parse correctly? ✅
       │
       ▼
Backend Processing:
├─ Master(id) exists? ✅
├─ Master.formule_score exists? ✅
├─ Payload structure valid? ✅
├─ Formation code matches? ✅
└─ Score calculation succeeds? ✅
       │
       ▼
Response:
├─ HTTP 200 OK? ✅
├─ JSON has 'score' key? ✅
├─ Score is numeric? ✅
└─ Score > 0? ✅
```

---

**This diagram shows the complete data flow from user interaction to successful submission with score included.**
