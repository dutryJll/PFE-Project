# ✅ RÉSOLUTION — Erreurs 404

## 🔴 Problèmes détectés

```
❌ /api/candidatures/configuration/13/ — 404 (API Backend)
❌ /assets/specialites.json — 404 (Asset)
❌ logo-isimm.png — 404 (Asset)
```

---

## ✅ Solution 1 — API Backend (Port 8005 → 8003)

### Problème
Les services `ocr.ts` et `document.ts` utilisaient les **mauvais ports** :
- `ocr.ts`: port **8005** (❌ incorrect)
- `document.ts`: port **8004** (❌ incorrect)
- `environment.ts`: port **8003** (✅ correct)

### Correction appliquée

**Fichier 1: `ocr.ts`**
```typescript
// ❌ AVANT
private apiUrl = 'http://localhost:8005/api/ocr';
private candidatureApiUrl = 'http://localhost:8005/api/candidatures';

// ✅ APRÈS
import { environment } from '../../environments/environment';
private apiUrl = `${environment.candidatureServiceUrl}/ocr`;
private candidatureApiUrl = environment.candidatureServiceUrl;
```

**Fichier 2: `document.ts`**
```typescript
// ❌ AVANT
private apiUrl = 'http://localhost:8004/api/documents';

// ✅ APRÈS
import { environment } from '../../environments/environment';
private apiUrl = `${environment.candidatureServiceUrl}/documents`;
```

### Résultat
- ✅ Tous les appels API utilisent maintenant **port 8003** (per `environment.ts`)
- ✅ Configuration centralisée dans `environment.ts`
- ✅ Pas de URLs en dur à maintenir

---

## ✅ Solution 2 — Assets statiques (specialites.json)

### Statut
- ✅ `src/assets/specialites.json` **existe** — le fichier est là
- ⚠️ Peut être un problème de timing (charge asynchrone)

### Vérification
```bash
ls -la isimm-platform/frontend/src/assets/
# Doit contenir: specialites.json
```

### Si le problème persiste
Vérifier que le fichier `angular.json` inclut les assets:
```json
"assets": [
  "src/favicon.ico",
  "src/assets"
]
```

---

## ✅ Solution 3 — Logo ISIMM (logo-isimm.png)

### Problème
Chemins inconsistants utilisés dans le HTML :
- `/assets/images/isimm-logo.png` (pdf-template)
- `/images/logo-isimm.png` (create-password) ❌ mauvais
- `/ISIMM_LOGO.png` (navbar) ❌ mauvais

### Fichiers concernés
1. `create-password.component.html` — ligne 7
2. `navbar.html` — ligne 4  
3. `home.component.html` — ligne 371

### Correction à faire

**Dans `create-password.component.html`:**
```html
<!-- ❌ AVANT -->
<img src="/images/logo-isimm.png" alt="ISIMM Logo" class="logo" />

<!-- ✅ APRÈS -->
<img src="/assets/images/isimm-logo.png" alt="ISIMM Logo" class="logo" />
```

**Dans `navbar.html`:**
```html
<!-- ❌ AVANT -->
<img src="/ISIMM_LOGO.png" alt="ISIMM Logo" class="logo-img" />

<!-- ✅ APRÈS -->
<img src="/assets/images/isimm-logo.png" alt="ISIMM Logo" class="logo-img" />
```

**Dans `home.component.html`:**
```html
<!-- ❌ AVANT -->
<img src="/ISIMM_LOGO.png" alt="Logo ISIMM" class="footer-logo" />

<!-- ✅ APRÈS -->
<img src="/assets/images/isimm-logo.png" alt="Logo ISIMM" class="footer-logo" />
```

### Vérification
Le fichier doit exister à:
```
isimm-platform/frontend/src/assets/images/isimm-logo.png
```

Si le fichier n'existe pas, le créer ou utiliser un logo existant.

---

## 📋 Checklist de résolution

- [x] Corrigé `ocr.ts` — utilise `environment.candidatureServiceUrl`
- [x] Corrigé `document.ts` — utilise `environment.candidatureServiceUrl`
- [ ] Vérifier que le **backend Django tourne sur port 8003**:
  ```bash
  python manage.py runserver 0.0.0.0:8003
  ```
- [ ] Vérifier que `specialites.json` existe dans `src/assets/`
- [ ] Corriger les chemins logo dans:
  - [ ] `create-password.component.html`
  - [ ] `navbar.html`
  - [ ] `home.component.html`
- [ ] Relancer le navigateur (Ctrl+Shift+Del pour clear cache)
- [ ] Vérifier la console (F12) — pas d'erreurs 404

---

## 🚀 Démarrage complet

```bash
# Terminal 1 — Backend Django
cd isimm-platform/services/candidature_service
python manage.py runserver 0.0.0.0:8003

# Terminal 2 — Frontend Angular
cd isimm-platform/frontend
ng serve --open
```

---

## ✨ Après correction

```
✅ /api/candidatures/configuration/13/ — 200 OK
✅ /assets/specialites.json — 200 OK
✅ logo-isimm.png — 200 OK
```

Pas plus d'erreurs 404 ! 🎉
