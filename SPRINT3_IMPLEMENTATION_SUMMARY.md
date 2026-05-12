# Sprint 3 - Feature Implementation Summary

## Overview

Completed comprehensive implementation of Sprint 3 requirements:

1. ✅ Backend endpoints for re-application rules and context-aware specialité filtering
2. ✅ Notification trigger system for duplicate attempts, deadline warnings, and reapplication opportunities
3. ✅ Frontend components and services to consume new endpoints

---

## 1. Backend Implementation (Django/DRF)

### A. New Endpoints in `candidature_app/views.py`

#### 1. `can_reapply_to_master(request, master_id)` - GET

**Purpose:** Checks if candidate can reapply to a master
**Business Logic:**

- TERMINAL_STATUSES: ['rejete', 'annule'] - allows immediate reapplication
- BLOCKING_STATUSES: ['soumis', 'sous_examen', 'preselectionne', 'en_attente_dossier', 'dossier_depose', 'inscrit']
- Returns `can_reapply: boolean` with reason and cooldown info

**Response Example:**

```json
{
  "can_reapply": true,
  "reason": "Vous avez ete rejete precedemment, vous pouvez repostuler",
  "previous_status": "rejete",
  "cooldown_days": 0
}
```

#### 2. `get_specialites_for_preselection(request, master_id)` - GET

**Purpose:** Returns specialités for preselection section with parcours context
**Context:** 'preselection'
**Returns:** List of specialités with parcours details for filtering

#### 3. `get_specialites_for_dossier(request, candidature_id)` - GET

**Purpose:** Returns specialités available for dossier deposit
**Context:** 'dossier_deposit'
**Validation:** Only allows statuses 'preselectionne' or 'en_attente_dossier'
**Returns:** Current specialité + allow_change flag (true only if status is 'en_attente_dossier')

#### 4. `get_specialites_for_inscription(request, master_id)` - GET

**Purpose:** Returns specialités for online inscription section
**Context:** 'inscription'
**Returns:** Specialités + candidate's current selection status

#### 5. Notification Trigger Helper Functions

**a) `_trigger_notification_on_duplicate_attempt(user, master, existing_candidature)`**

- Triggered when user attempts to apply twice to same master
- Dedup key: `f'duplicate-attempt-{existing_candidature.id}-{date.isoformat()}'`
- Type: 'warning'

**b) `_trigger_notification_on_deadline_approaching(candidature, days_remaining=7)`**

- Triggered when application deadline is within N days (default: 7)
- Dedup key: `f'deadline-warning-{candidature.master.id}-{date.isoformat()}'`
- Type: 'warning'

**c) `_trigger_notification_on_reapplication_allowed(user, master)`**

- Triggered when candidature status changes to 'rejete' or 'annule'
- Dedup key: `f'reapply-allowed-{master.id}-{date.isoformat()}'`
- Type: 'info'

### B. URL Routes in `candidature_app/urls.py`

```python
path('masters/<int:master_id>/can-reapply/', views.can_reapply_to_master)
path('masters/<int:master_id>/specialites-preselection/', views.get_specialites_for_preselection)
path('<int:candidature_id>/specialites-dossier/', views.get_specialites_for_dossier)
path('masters/<int:master_id>/specialites-inscription/', views.get_specialites_for_inscription)
```

### C. Integration Points

**Notification triggers integrated into workflow:**

1. `create_candidature()` - Line ~513: Duplicate check now triggers `_trigger_notification_on_duplicate_attempt()`
2. `create_candidature()` - Line ~780: Success response now triggers `_trigger_notification_on_deadline_approaching()`

---

## 2. Frontend Implementation (Angular)

### A. Service Methods in `candidature.service.ts`

```typescript
// Check if candidate can reapply to a master
getCanReapply(masterId: number): Observable<any>

// Get specialites for preselection section
getSpecialitesForPreselection(masterId: number): Observable<any>

// Get specialites for dossier section
getSpecialitesForDossier(candidatureId: number): Observable<any>

// Get specialites for inscription section
getSpecialitesForInscription(masterId: number): Observable<any>
```

### B. New Components

#### 1. `OffersListingComponent` (Standalone)

**Path:** `frontend/src/app/components/candidat/offers-listing/`
**Files:**

- `offers-listing.component.ts` - Main component logic
- `offers-listing.component.html` - Template with Material components
- `offers-listing.component.css` - Responsive styling

**Features:**

- Load all available offers with specialités
- Filter by master type (master recherche, professionnel, ingenieur)
- Filter by specialité
- Display deadline approaching warnings (red styling for < 7 days)
- Show "Already Applied" status for candidatures already submitted
- Load/refresh functionality with error handling
- Toast notifications for user feedback

**Displays:**

- Offers in responsive grid (3 columns on desktop, 2 on tablet, 1 on mobile)
- Master name, specialité, type, deadline, application status
- Dynamic action button (enabled for new offers, disabled for already applied)

#### 2. `CandidatureSpecialiteFormComponent` (Standalone)

**Path:** `frontend/src/app/components/candidat/candidature-specialite-form/`
**Files:**

- `candidature-specialite-form.component.ts` - Form logic
- `candidature-specialite-form.component.html` - Template with Material form controls
- `candidature-specialite-form.component.css` - Form styling

**Features:**

- Context-aware component (preselection, dossier, inscription modes)
- Load specialités based on context and master/candidature ID
- Display current specialité (in edit modes)
- Show change restrictions with explanatory messages
- Form validation with Material form field errors
- Loading, error, and success states
- Toast notifications

**Inputs:**

- `@Input() masterId: number | null` - Master ID (for preselection/inscription)
- `@Input() candidatureId: number | null` - Candidature ID (for dossier mode)
- `@Input() context: 'preselection' | 'dossier' | 'inscription'` - Display context

**Context-specific behavior:**

- **Preselection:** Load and select specialité for initial candidature
- **Dossier:** Show current specialité + allow change only if status is 'en_attente_dossier'
- **Inscription:** Show candidate's current selection with available specialités

---

## 3. Data Flows

### Re-application Flow

```
User clicks "Apply" → create_candidature() →
  Check existing status →
    TERMINAL_STATUS (rejete/annule) → can_reapply_to_master endpoint returns true →
    Can submit new candidature
```

### Specialité Selection Flow

```
Preselection: get_specialites_for_preselection() → User selects → Save with candidature
Dossier: get_specialites_for_dossier() → Show current + allow change if in attente → Update
Inscription: get_specialites_for_inscription() → Show final selection options
```

### Notification Trigger Flow

```
Create Candidature:
  1. Check duplicate → trigger warning notification
  2. Validate deadline → trigger warning if < 7 days remaining
  3. Save → success response with notification data
```

---

## 4. Error Handling

### Backend Error Responses

- **404 Not Found:** Master or candidature doesn't exist
- **400 Bad Request:** Invalid status for dossier operations, deadline exceeded
- **409 Conflict:** Duplicate candidature attempt (returns allow_edit flag)

### Frontend Error Handling

- Service method errors caught in components
- Toast error notifications displayed to user
- Loading/error states managed per component
- Graceful fallbacks for missing data

---

## 5. Testing Endpoints

### Quick Test Commands

```bash
# Check if can reapply to a master
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/candidatures/masters/1/can-reapply/

# Get specialites for preselection
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/candidatures/masters/1/specialites-preselection/

# Get specialites for dossier
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/candidatures/1/specialites-dossier/

# Get specialites for inscription
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/candidatures/masters/1/specialites-inscription/

# Get available offers with specialites
curl -H "Authorization: Bearer {token}" \
  http://localhost:8000/api/candidatures/offers-available/
```

---

## 6. Implementation Status

### ✅ Complete

- [x] Backend: All 5 new endpoint functions implemented
- [x] Backend: All 3 notification trigger helpers implemented
- [x] Backend: URL routes for all new endpoints added
- [x] Backend: Notification triggers integrated into candidature workflow
- [x] Frontend: Service methods for all new endpoints
- [x] Frontend: OffersListingComponent (full UI with filters and deadline warnings)
- [x] Frontend: CandidatureSpecialiteFormComponent (context-aware specialité selector)
- [x] Error handling in all components
- [x] Loading states and user feedback (toasts)
- [x] Syntax validation (no errors reported)

### 🟡 Ready for Next Steps

- [ ] Frontend component integration into existing dashboard/workflows
- [ ] E2E testing of full workflows (apply → preselection → dossier → inscription)
- [ ] Email templates for notifications
- [ ] Real-time WebSocket updates for deadline warnings

---

## 7. Key Design Decisions

1. **Dedup Keys for Notifications:** Using date-based keys to prevent duplicate notifications per day per resource
2. **Allow Edit Flag:** Return 409 with `allow_edit` flag to let frontend decide if user can modify existing candidature
3. **Context-aware Specialité Loading:** Different endpoints for different stages because they have different requirements and filters
4. **Status-based Change Restrictions:** Only allow specialité changes in 'en_attente_dossier' status, read-only for others
5. **Material Components:** Consistent UI with Angular Material across all new components

---

## 8. Files Modified/Created

### Backend

- `candidature_app/views.py` - Added 5 endpoints + 3 notification helpers
- `candidature_app/urls.py` - Added 4 URL routes

### Frontend

- `candidature.service.ts` - Added 4 new service methods
- `candidat/offers-listing/` (new component)
  - `offers-listing.component.ts`
  - `offers-listing.component.html`
  - `offers-listing.component.css`
- `candidat/candidature-specialite-form/` (new component)
  - `candidature-specialite-form.component.ts`
  - `candidature-specialite-form.component.html`
  - `candidature-specialite-form.component.css`

---

## 9. Usage Examples

### For Frontend Developers

```typescript
// In your component
import { OffersListingComponent } from './components/candidat/offers-listing/offers-listing.component';
import { CandidatureSpecialiteFormComponent } from './components/candidat/candidature-specialite-form/candidature-specialite-form.component';

// Use offers listing in a dashboard/page component
<app-offers-listing></app-offers-listing>

// Use specialité form in candidature flow
<app-candidature-specialite-form
  [masterId]="selectedMasterId"
  [context]="'preselection'">
</app-candidature-specialite-form>

// Or for dossier deposit
<app-candidature-specialite-form
  [candidatureId]="currentCandidatureId"
  [context]="'dossier'">
</app-candidature-specialite-form>
```

### For API Consumers

All new endpoints return JSON responses with:

- List of available specialités
- Context-specific metadata (current selection, allow_change flags, etc.)
- Master/candidature details for reference

See section 5 (Testing Endpoints) for curl examples.

---

## 10. Notes for Maintenance

1. **Notification Dedup Keys:** The dedup key pattern uses date.isoformat() to create one notification per day per resource. If you need finer granularity, adjust the key format.

2. **Deadline Calculation:** Default threshold is 7 days. Adjust `days_remaining` parameter in `_trigger_notification_on_deadline_approaching()` if needed.

3. **Status Restrictions:** BLOCKING_STATUSES and TERMINAL_STATUSES are defined in `can_reapply_to_master()`. Update if candidature workflow changes.

4. **Component Modules:** All frontend components are standalone (Angular 14+), no NgModule registration needed.

5. **Material Dependencies:** Ensure @angular/material is installed and configured in your project.
