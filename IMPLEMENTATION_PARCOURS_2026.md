# 🎯 Implémentation CRUD Parcours - Guide Complet

## 📋 Résumé des Modifications (Sprint 2026-05)

### 1. **Backend - Django (candidature_service)**

#### A. Modèle ParcoursAdmission (Enrichi)

**Fichier:** `candidature_app/models.py`

Nouveaux champs ajoutés:

```python
class ParcoursAdmission(models.Model):
    STATUS_CHOICES = [
        ('brouillon', 'Brouillon'),      # Draft mode (Admin config)
        ('ouvert', 'Ouvert'),             # Visible to all candidates
        ('ferme', 'Fermé'),               # Closed (no submissions)
    ]

    TYPE_CHOICES = [
        ('pro', 'Professionnel'),
        ('recherche', 'Recherche'),
        ('ingenieur', 'Ingénieur'),
    ]

    # Nouveaux champs:
    type = CharField(choices=TYPE_CHOICES)        # Détermine les critères par défaut
    specialite = CharField(max_length=200)
    capacite = IntegerField(default=30)           # Max candidats
    date_limite = DateField()                      # Deadline pour candidatures
    statut = CharField(choices=STATUS_CHOICES)    # Controls visibility
```

**Migration appliquée:** `0016_parcoursadmission_capacite_and_more`

#### B. Critères d'Évaluation Initialisés

**Fichier:** `candidature_app/init_criteres.py`

Les critères sont créés automatiquement:

```
Professionnel:    moyenne_licence, moyenne_bac, redoublements
Recherche:        + note_math_bac, bonus_langue, bonus_diplome
Ingénieur:        moyenne_m1, moyenne_m2, moyenne_m3, rang1, rang2
```

**Initialisation:** `python manage.py init_criteres`

#### C. ViewSet CRUD Parcours

**Fichier:** `candidature_app/views_parcours.py`

Endpoints disponibles:

```
GET    /api/candidatures/parcours/              # Liste (public = que 'ouvert')
POST   /api/candidatures/parcours/              # Créer (admin only)
GET    /api/candidatures/parcours/{id}/         # Détail
PATCH  /api/candidatures/parcours/{id}/         # Modifier (admin)
DELETE /api/candidatures/parcours/{id}/         # Supprimer (admin)
POST   /api/candidatures/parcours/{id}/generate_criteres/  # Créer ValeurCritere
POST   /api/candidatures/parcours/{id}/changer_statut/     # Change status
```

**Logique clé:**

- Quand un parcours est créé → les ValeurCritere sont générées automatiquement selon le type
- Les candidats ne voient que les parcours avec statut='ouvert'
- Les admin/responsables voient tous les statuts

#### D. Serializers

**Fichier:** `candidature_app/serializers.py`

Nouveaux serializers:

- `ParcoursAdmissionSerializer` - CRUD complet
- `ValeurCritereSerializer` - Gestion des coefficients
- `CritereEvaluationSerializer` - Lecture seule

---

### 2. **Frontend - Angular**

#### A. Composant Admin: Gestion des Parcours Master

**Fichier:** `frontend/src/app/components/admin/parcours-master/parcours-master.component.ts`

Fonctionnalités:

- ✅ Lister tous les parcours
- ✅ Ajouter (modal form)
- ✅ Modifier
- ✅ Supprimer
- ✅ Générer critères (button)
- ✅ Changer statut (Brouillon → Ouvert → Fermé)

**Utilisation:**

```html
<app-parcours-master></app-parcours-master>
```

#### B. Composant Admin: Gestion des Parcours Ingénieur

**Fichier:** `frontend/src/app/components/admin/parcours-ingenieur/parcours-ingenieur.component.ts`

Identique au composant Master, mais:

- Filtre sur `type='ingenieur'` par défaut
- Affiche que les parcours ingénieur

#### C. Composant Responsable: Synchronisation

**Fichier:** `frontend/src/app/components/responsable/parcours/responsable-parcours.component.ts`

Fonctionnalités:

- 📂 Onglets: Ouverts | Brouillons | Fermés
- 👁️ Voir les parcours assignés à leur master
- ⚙️ Éditer les coefficients des ValeurCritere
- 📊 Affichage en grid (parcours) + table (coefficients)

**Utilisation:**

```html
<app-responsable-parcours></app-responsable-parcours>
```

---

### 3. **Nettoyage Code Frontend**

**Résultat:**

- ❌ Supprimé: 64 lignes de `console.log/warn/info/debug`
- ✅ Conservé: 25 lignes de `console.error` (déboggage API)
- 📁 Fichiers touchés: 14 services/components/guards

**Pattern Final:**

```typescript
// ✅ Gardé (erreurs API)
console.error('Erreur chargement masters:', error);

// ❌ Supprimé (debug)
console.log('Master loaded:', data);
```

---

## 🚀 Flux Complet: Admin → Responsable → Candidat

### **1️⃣ Admin crée un Parcours**

```
Admin > Espace Admin > "Parcours Master"
└─ Clique "+ Ajouter un parcours"
   ├─ Remplit: Nom, Type (Pro/Recherche/Ingénieur), Spécialité, Capacité, Date Limite
   └─ Clique "Sauvegarder"
      ├─ POST /api/parcours/ → ParcoursAdmission créé
      └─ ValeurCritere générées automatiquement (11 lignes vides selon type)
```

### **2️⃣ Admin change le statut en "Ouvert"**

```
Admin > [Parcours] > "Modifier"
└─ Change "Brouillon" → "Ouvert"
   └─ PATCH /api/parcours/{id}/ → Statut = 'ouvert'
```

### **3️⃣ Responsable voit le parcours ouvert**

```
Responsable > Espace Responsable > "Parcours"
└─ Onglet "Parcours Ouverts"
   ├─ Voir liste des parcours (master correspondant)
   └─ Clique "Voir Coefficients"
      └─ Modal affiche les 11 ValeurCritere (lecture seule)
```

### **4️⃣ Responsable édite les coefficients**

```
Responsable > (Si parcours en brouillon)
└─ "Configurer Coefficients"
   ├─ Édite chaque coefficient (ex: 0.4, 0.6, 1.0, etc.)
   └─ "Sauvegarder" pour chaque ligne
      └─ PATCH /api/valeurs-critere/{id}/ → coefficient mis à jour
```

### **5️⃣ Candidat voit que le parcours**

```
Candidat > Formulaire de candidature
└─ Sélectionne Master → Affiche que les parcours 'ouvert'
   └─ Soumet candidature
      ├─ Score calculé via ParcoursAdmission.calculer_score()
      └─ Utilise les coefficients configurés par le Responsable
```

---

## 🎮 Exemples de Tests

### **Test 1: Créer un Parcours (Admin)**

```bash
curl -X POST http://127.0.0.1:8003/api/candidatures/parcours/ \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "master": 2,
    "nom": "Parcours Master DS 2026",
    "type": "pro",
    "specialite": "Data Science",
    "capacite": 25,
    "date_limite": "2026-06-30",
    "statut": "brouillon"
  }'
```

**Réponse (201 Created):**

```json
{
  "id": 1,
  "nom": "Parcours Master DS 2026",
  "type": "pro",
  "statut": "brouillon",
  "master": 2,
  ...
}
```

### **Test 2: Générer Critères Automatiquement**

```bash
curl -X POST http://127.0.0.1:8003/api/candidatures/parcours/1/generate_criteres/ \
  -H "Authorization: Bearer <admin_token>" \
  -d '{}'
```

**Réponse:**

```json
{
  "success": true,
  "message": "3 critères créés",
  "total_criteres": 3
}
```

### **Test 3: Lister les Parcours Ouverts (Candidat)**

```bash
curl http://127.0.0.1:8003/api/candidatures/parcours/
```

**Réponse (candidat voit que 'ouvert'):**

```json
[
  {
    "id": 1,
    "nom": "Parcours Master DS 2026",
    "statut": "ouvert",
    "capacite": 25,
    ...
  }
]
```

---

## 📊 Structure Base de Données

### **Nouvelle relation:**

```
Master (1) ──→ ParcoursAdmission (N)
                    │
                    ├─→ ValeurCritere (N)
                    │       │
                    │       └─→ CritereEvaluation (1)
                    │
                    └─→ Candidature (N)
```

### **Exemple de données:**

```
Master: "Master Data Science"
└─ ParcoursAdmission #1:
   ├─ nom: "Parcours 2026"
   ├─ type: "pro"
   ├─ statut: "ouvert"
   ├─ capacite: 25
   └─ ValeurCritere:
      ├─ [moyenne_licence, coef=0.6]
      ├─ [moyenne_bac, coef=0.4]
      └─ [redoublements, coef=-1.0]
```

---

## 🔐 Permissions

| Action              | Admin | Responsable | Candidat          |
| ------------------- | ----- | ----------- | ----------------- |
| Lister (tous)       | ✅    | ✅          | ✅ (que 'ouvert') |
| Créer               | ✅    | ❌          | ❌                |
| Modifier            | ✅    | ❌          | ❌                |
| Supprimer           | ✅    | ❌          | ❌                |
| Voir coefficients   | ✅    | ✅          | ❌                |
| Éditer coefficients | ✅    | ✅\*        | ❌                |

\*Responsable: uniquement si parcours en 'brouillon'

---

## 📝 Notes d'Implémentation

1. **Auto-génération des critères:**
   - Quand un parcours est créé, `creer_valeurs_critere_pour_parcours()` génère les lignes vides
   - Les coefficients sont fixés à 1.0 par défaut (le Responsable les ajuste)

2. **Statut et Visibilité:**
   - `brouillon`: Visible admin/responsable, CACHÉ aux candidats
   - `ouvert`: VISIBLE à TOUS (candidats peuvent postuler)
   - `ferme`: Visible admin/responsable, CACHÉ aux candidats

3. **Calcul de Score:**
   - ParcoursAdmission.calculer_score() utilise les ValeurCritere configurées
   - Chaque candidature reçoit un score basé sur les coefficients du Responsable
   - Fallback automatique si aucun critère n'est défini

4. **Mode Soutenance:**
   - Console.log supprimés: code "propre" pour la soutenance
   - Console.error conservés: débogage rapide si besoin (500, 404, etc.)

---

## ✅ Checklist Soutenance

- [x] CRUD Parcours (Admin)
- [x] Auto-génération ValeurCritere
- [x] Synchronisation Responsable
- [x] Statut Brouillon/Ouvert/Fermé
- [x] Interface Admin (2 composants)
- [x] Interface Responsable
- [x] Nettoyage console.log
- [x] Tests API manuels
- [x] Migrations appliquées

---

**Prêt pour la soutenance! 🎓**
