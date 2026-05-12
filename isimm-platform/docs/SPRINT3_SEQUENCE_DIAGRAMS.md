# Sprint 3 - Diagrammes de Séquence Détaillés

## 📋 Table des matières

1. [US 5.1 - Présélectionner les meilleures candidatures](#us-51--présélectionner-les-meilleures-candidatures)
2. [US 5.2 - Modifier liste présélectionnée](#us-52--modifier-liste-présélectionnée)
3. [US 5.3 - Exporter liste](#us-53--exporter-liste)
4. [US 6.1 - Candidat s'inscrit](#us-61--candidat-sinscrit)
5. [US 6.2 - Étudier dossiers et décider](#us-62--étudier-dossiers-et-décider)
6. [US 6.3 - Classer candidatures](#us-63--classer-candidatures)
7. [US 6.4 - Importer Excel](#us-64--importer-excel)
8. [US 6.5 - Liste complémentaire](#us-65--liste-complémentaire)

---

## US 5.1 : Présélectionner les meilleures candidatures

### 📝 Description

La commission génère automatiquement les listes de présélection selon des critères définis :

- Seuil minimum (ex: 10.5/20)
- Quotas par spécialité (GL: 30, IA: 20)
- Ratio principal/attente (ex: 0.7)

### 🔄 Flux détaillé

1. **Déclenchement** : Commission clique "Générer listes"
2. **Validation** : Token Bearer validé via Auth Service
3. **Récupération des données** :
   - Tous les candidats avec statut `dossier_depose`
   - Scores >= seuil minimum
4. **Traitement** :
   - **Étape 1** : Tri descendant par score
   - **Étape 2** : Application quotas par spécialité
   - **Étape 3** : Création ListeAdmission (principale + attente)
5. **Insertion** : BulkInsert CandidatListe avec rang et score
6. **Notification** : Async - Emails aux candidats présélectionnés

### 📊 Données créées

```
ListeAdmission
├── ID: 101
├── Type: 'principale'
├── Master ID: 123
├── Itération: 1
└── 30 CandidatListe

ListeAdmission
├── ID: 102
├── Type: 'attente'
├── Master ID: 123
├── Itération: 1
└── 21 CandidatListe
```

### ⚙️ Points techniques

- **Performance** : BulkInsert pour > 100 candidats
- **Atomicité** : Transaction BD (tout ou rien)
- **Audit** : Création loggée avec timestamp
- **Index** : `(master_id, statut, score DESC)`

---

## US 5.2 : Modifier liste présélectionnée

### 📝 Description

La commission peut ajuster manuellement la présélection :

- **PROMOUVOIR** : Attente → Principale
- **RÉTROGRADER** : Principale → Attente
- **RETIRER** : Supprimer de liste

### 🔄 Flux détaillé

1. **Interface** : Drag-drop ou formulaire modification
2. **Sélection** : Commission sélectionne candidat + action
3. **Validation** : Token + accès commission validé
4. **Traitement** :
   - Récupérer CandidatListe actuel
   - Mettre à jour `liste_id` et `rang`
   - Recalculer rangs pour stabilité
5. **Audit** : Enregistrer modification avec audit trail
6. **Notification** : Optionnelle aux candidats impactés

### 📊 Exemple : PROMOUVOIR

```sql
-- Avant
candidat_id=5, liste_id=102 (attente), rang=5

-- Après
candidat_id=5, liste_id=101 (principale), rang=15

-- Recalcul rangs attente (102)
rang: 5→4, 6→5, 7→6, ...
```

### ⚙️ Points techniques

- **Idempotence** : Même requête 2x = même résultat
- **Recalcul** : Stable et efficace (NOT FULL TABLE SCAN)
- **Audit Trail** : Qui, quand, ancien_rang, nouveau_rang

---

## US 5.3 : Exporter liste

### 📝 Description

Exporter la liste présélectionnée dans plusieurs formats :

- **CSV** : Tableau texte (import Excel)
- **XLSX** : Excel formaté (filtres, colonnes larges)
- **PDF** : Rapport professionnel (en-tête, footer, pagination)

### 🔄 Flux détaillé

1. **Sélection format** : Commission choisit CSV/XLSX/PDF
2. **Récupération** : Tous CandidatListe avec JOIN données candidat
3. **Formatage** :
   - **CSV** : Délimiteurs `,` , encodage UTF-8
   - **XLSX** : Workbook avec Sheet "Principale", formatage gras header
   - **PDF** : Rapport avec logo, titre, tableau, statistiques
4. **Téléchargement** : Stream fichier au client

### 📊 Colonnes export

```
Rang | Nom | Prénom | CIN | Email | Score | Spécialité | Statut
-----|------|--------|-----|-------|-------|------------|-------
1    | BEN ALI | Ahmed | 12345 | ahmed@... | 18.5 | GL | Sélectionné
2    | TRABELSI | Fatma | 54321 | fatma@... | 17.2 | IA | Sélectionné
...
```

### ⚙️ Points techniques

- **Stream** : Pas de stockage fichier temporaire
- **Encodage** : UTF-8 BOM pour Excel (caractères spéciaux)
- **Content-Type** : `application/octet-stream` + `Content-Disposition`
- **Nom fichier** : `liste_principale_20260511.xlsx`

---

## US 6.1 : Candidat s'inscrit

### 📝 Description

Le candidat sélectionné s'inscrit en soumettant :

- Preuve de paiement (PDF)
- Acceptation conditions

### 🔄 Flux détaillé

1. **Statut** : Candidat vérifie son statut (sélectionné ou attente)
   - GET `/api/candidatures/{candidatId}/statut-final`
   - Retourne : `{statut: 'SELECTIONE', deadline: '2026-06-30', rang: 15}`

2. **Formulaire** : Si sélectionné ET délai valide
   - Afficher formulaire inscription
   - Affichage deadline + rang

3. **Soumission** : Candidat upload preuve paiement + confirme
   - POST `/api/candidatures/inscriptions-administratives`
   - FormData : fichier PDF + acceptation

4. **Validation** :
   - ✓ Deadline pas dépassée ?
   - ✓ Candidat en liste principale ?
   - ✓ Fichier valide (PDF, < 5MB) ?

5. **Création** :
   - Upload fichier → `/uploads/paiements/2026/05/candidat_123_...`
   - Créer `InscriptionEnLigne` : statut = `en_attente_verification`
   - Mettre à jour `Candidature` : statut = `inscription_soumise`

6. **Notification** : Email responsable commission
   - "Nouvelle inscription à vérifier"
   - Lien vérification paiement

### 📊 Données créées

```
InscriptionEnLigne
├── ID: 999
├── Candidat ID: 123
├── Statut: 'en_attente_verification'
├── Montant: 250 TND
├── Reference paiement: file_id
├── Date inscription: 2026-05-11
└── Date paiement: 2026-05-11

Candidature (UPDATE)
└── Statut: 'inscription_soumise'
```

### ⚙️ Points techniques

- **Deadline strict** : `TODAY <= deadline` sinon 403 Forbidden
- **Upload sécurisé** : Scan virus, type validation, quota storage
- **Idempotence** : 2 submissions du même candidat = update
- **Notification async** : Non-bloquant pour l'utilisateur

---

## US 6.2 : Étudier dossiers et décider

### 📝 Description

Le responsable commission examine chaque dossier déposé et accepte/rejette avec motif optionnel.

### 🔄 Flux détaillé

1. **Chargement interface** :
   - GET `/api/candidatures/dossiers-etude`
   - Retourne candidats avec statut `dossier_depose`
   - Include fichiers dossier + scores

2. **Affichage tableau** :
   - Tableau interactif (rang, nom, score, statut)
   - Colonne "Actions" : bouton "Ouvrir"

3. **Ouverture dossier** :
   - Modal avec infos candidat
   - Viewer PDF pour chaque fichier
   - Zone "Décision" en bas (radio buttons)

4. **Lecture et décision** :
   - Responsable lit dossier (PDF viewer)
   - Choisit : ACCEPTER ou REJETER
   - Optionnel : entre motif (si rejet)

5. **Soumission** :
   - POST `/api/candidatures/{candidatId}/commission-decision`
   - Body : `{decision: 'ACCEPTER', motif: ''}`

6. **Traitement** :
   - Update `Candidature` : statut = `accepte` ou `rejete`
   - Log audit avec user_id + timestamp
   - Notification asynchrone candidat

7. **Affichage** :
   - Tableau rafraîchi
   - Candidat déplacé dans colonne appropriée
   - Focus automatique sur dossier suivant

### 📊 Transitions statut

```
dossier_depose
    ↓
    ├─→ ACCEPTER → accepte → (inscription)
    └─→ REJETER → rejete → (fin parcours)
```

### ⚙️ Points techniques

- **PDF Viewer** : Intégré Angular (pdfjs library)
- **Notification** : Async (queue RabbitMQ, email background)
- **Audit** : Table AuditLog avec decision_date, responsable_id
- **Statut** : Immutable une fois décidé (no override possible)

---

## US 6.3 : Classer candidatures

### 📝 Description

Créer les listes finales (principale + attente) parmi les acceptés, puis publier pour notifier tous les candidats.

### 🔄 Flux détaillé

1. **Chargement** :
   - GET `/api/candidatures/master/{masterId}/classification`
   - Récupère candidats avec statut = `accepte`

2. **Tri** :
   - Sort descendant par score (stable sort)
   - Tie-breaker : date inscription ASC

3. **Création listes** :
   - Créer `ListeAdmission` (type: `principale_finale`)
   - Créer `ListeAdmission` (type: `attente_finale`)
   - BulkInsert CandidatListe pour chaque

4. **Calcul stats** :
   - Total principale, attente
   - Score min/max
   - Distribution par spécialité

5. **Validation** :
   - Commission vérifie classement
   - Click "Valider et Publier"

6. **Publication** :
   - POST `/api/candidatures/listes/{listeId}/publier`
   - Update `ListeAdmission` : `est_publiee = true`

7. **Notification** : Async - Email TOUS les candidats
   - **Admis** : "Félicitations! Vous êtes classé 15ème"
   - **Attente** : "Vous êtes en liste d'attente, rang 5"
   - Include : rang, score final, prochaines étapes

### 📊 Exemple listes finales

```
PRINCIPALE_FINALE (52 candidats)
1. Ahmed (18.5)
2. Fatma (17.2)
...
52. Mohamed (16.2)

ATTENTE_FINALE (18 candidats)
1. Karim (15.8)
2. Sana (15.7)
...
18. Ali (14.1)
```

### ⚙️ Points techniques

- **Atomicité** : Transaction pour publication (all-or-nothing)
- **Bulk notify** : Queue job pour email batch
- **Immutabilité** : Une fois publiée, liste finalisée
- **Trigger** : Publish déclenche notifications async

---

## US 6.4 : Importer Excel

### 📝 Description

Importer fichier Excel contenant les candidats qui ont réellement payé l'inscription, puis réconcilier avec la BD.

### 🔄 Flux détaillé

1. **Upload fichier** :
   - Interface : zone upload fichier XLSX/XLS
   - Validation : extension `.xlsx` ou `.xls`

2. **Parsing** :
   - Lire première feuille
   - Colonnes attendues : CIN, NOM, PRENOM, EMAIL, MASTER
   - Normaliser (trim, uppercase)
   - Résultat : tableau `extraits_excel[]`

3. **Récupération BD** :
   - Query : candidats acceptés + acceptés_complémentaires
   - Include : id, cin, nom, prenom, email
   - Résultat : tableau `candidats_db[]`

4. **Matching** :
   - Pour chaque ligne Excel :
     - Chercher match dans DB
     - Logique : exact match (CIN + nom + prenom)
     - Fallback : CIN seul (fuzzy)
   - Marquer : INSCRIT, NON_TROUVE, ou DOUBLON

5. **Calcul stats** :

   ```
   nb_total_acceptes = 52
   nb_inscrits = 45 ✓
   nb_non_inscrits = 5 ⚠️
   nb_doublons = 2 ❌
   taux = 45/52 = 86.5%
   ```

6. **Rapport détaillé** :
   - Tableau "Non-inscrits" : candidats acceptés pas dans Excel
   - Tableau "Incohérences" : doublons, erreurs format

7. **Audit** :
   - Créer `InscriptionRapprochementAudit`
   - Stocker fichier original + résultats matching
   - Log créateur + timestamp

### 📊 Exemple rapport

```
RÉSUMÉ
========
Total acceptés:     52
Inscrits (Excel):   45 ✓
Non-inscrits:       5 ⚠️
Incohérences:       2 ❌
Taux inscription:   86.5%

NON-INSCRITS (Acceptés pas dans Excel)
=========================================
| CIN   | NOM      | PRENOM | EMAIL     | ACTION   |
|-------|----------|--------|-----------|----------|
| 99999 | KAROUI   | Mohamed| med@...   | Rappeler |
| 88888 | SAIDI    | Aïcha  | aicha@... | Rappeler |
...

INCOHÉRENCES (Problèmes détectés)
===================================
| CIN   | MOTIF                  |
|-------|------------------------|
| 11111 | Doublon CIN            |
| 22222 | Nom ne correspond pas   |
```

### ⚙️ Points techniques

- **Robustesse** : Gère espaces, majuscules, caractères spéciaux
- **Détection doublon** : CIN en doublon dans Excel
- **Matching** : Algorithme stable (priorité CIN > nom)
- **Audit Trail** : Tous imports loggés + traçabilité

---

## US 6.5 : Liste complémentaire

### 📝 Description

Générer liste complémentaire pour remplir les places vacantes laissées par les non-inscrits, en promouvant candidats de la liste d'attente.

### 🔄 Flux détaillé

1. **Calcul des vacances** :

   ```
   quota_principal = 52
   inscrits_confirmés = 45
   vacances = 52 - 45 = 7

   candidats_non_inscrits = 5
   promotions_possibles = 7 - 5 = 2
   ```

2. **Vérification** :
   - Si vacances > 0 ET candidats_non_inscrits < vacances :
     - `nb_promotions = vacances - candidats_non_inscrits`
   - Sinon : message "Pas de place vacante"

3. **Sélection candidats** :
   - Query : meilleurs de liste d'attente
   - Limit : `nb_promotions` (ex: 2)
   - Order by : `rang ASC` (rang 1, 2, ...)
   - Résultat : [Karim (15.8), Sana (15.7)]

4. **Création liste** :
   - Créer `ListeAdmission` (type: `complementaire`)
   - BulkInsert promus avec rang 1, 2, ...

5. **Update statut** :
   - Update `Candidature` : statut = `accepte_complementaire`
   - Pour chaque promu

6. **Notification** : Async - Email promus
   - "Bonne nouvelle!"
   - "Admis suite à des désistements"
   - "Nouvelles étapes : inscription"
   - **IMPORTANT** : Nouveau délai (ex: 10 jours)

7. **Publication** :
   - Commission publie liste complémentaire
   - Update `ListeAdmission` : `est_publiee = true`

### 📊 Exemple processus

```
AVANT
======
Principale: 52 places
  ├─ Inscrits: 45 ✓
  └─ Vacances: 7 ⚠️

Attente: 18 candidats
  ├─ Rang 1: Karim (15.8)
  ├─ Rang 2: Sana (15.7)
  └─ Rang 3-18: autres

Non-inscrits: 5
  (acceptés mais pas inscrit)

APRÈS
======
Principale: 52 places
  ├─ Inscrits: 45 ✓
  └─ Vacances: 2 ⚠️

Complémentaire: 2 places
  ├─ Karim (15.8) → PROMOUVOIR
  └─ Sana (15.7) → PROMOUVOIR

Attente: 16 candidats restants
  (Karim, Sana enlevés)
```

### ⚙️ Points techniques

- **Recalcul dynamique** : Basé sur inscriptions réelles
- **Deadline nouvelle** : Différente de principale (ex: +10 jours)
- **Async notifications** : Haute priorité (candidats attendus)
- **Optionnel** : Peut être répétée si désistements supplémentaires

---

## 🔐 Sécurité et Audit

### Authentification

- **Token Bearer** obligatoire sur TOUTES les endpoints
- Validé via `AuthService.validateAccessToken()`
- Claim `role: 'commission'` ou `role: 'candidat'` selon contexte

### Autorisation

- **Commission** : Endpoints 5.1-5.3, 6.2-6.5
- **Candidat** : Endpoints 6.1 (autorisé uniquement pour son propre ID)
- **Responsable** : Endpoints 6.2-6.5 (étude dossiers, publication)

### Audit Trail

Chaque action créé log dans table `AuditLog` :

```sql
{
  action: 'create_preselection' | 'modify_liste' | 'decision_accepte' | ...
  user_id: ID utilisateur
  master_id: Contexte master
  candidat_id: Si applicable
  ancien_rang, nouveau_rang: Si modification
  timestamp: NOW()
  ip_address: FROM request
}
```

### Immuabilité

- Listes publiées : **pas de modification**
- Décisions commission : **pas de révision**
- Inscriptions confirmées : **pas d'annulation** (sauf admin)

---

## 📊 Flux de données - Vue d'ensemble

```
Candidatures (dossier_depose)
    ↓ [5.1]
ListeAdmission (principale + attente)
    ↓ [5.2] (modifications manuelles)
ListeAdmission (ajustée)
    ↓ [5.3] (export)
Fichiers (CSV/XLSX/PDF)

Candidatures acceptés
    ↓ [6.1]
InscriptionEnLigne (en_attente_verification)
    ↓ [6.2]
Candidature (accepte/rejete)
    ↓ [6.3]
ListeAdmission (principale_finale + attente_finale)
    ↓ [6.4]
Rapport matching Excel
    ↓ [6.5]
ListeAdmission (complementaire)
```

---

## 🎯 Résumé intégration

| US  | Acteur      | Action                 | Données créées                  | Notifications         |
| --- | ----------- | ---------------------- | ------------------------------- | --------------------- |
| 5.1 | Commission  | Générer listes         | 2 ListeAdmission                | Email présélectionnés |
| 5.2 | Commission  | Modifier rangs         | AuditLog                        | Optionnel             |
| 5.3 | Commission  | Exporter               | Fichier (CSV/XLSX/PDF)          | Aucune                |
| 6.1 | Candidat    | S'inscrire             | InscriptionEnLigne              | Email responsable     |
| 6.2 | Responsable | Décider dossier        | Candidature (accepte/rejete)    | Email candidat        |
| 6.3 | Responsable | Classer & publier      | ListeAdmission finales          | Email tous candidats  |
| 6.4 | Responsable | Importer Excel         | AuditRapprochement              | Aucune (rapport)      |
| 6.5 | Responsable | Générer complémentaire | ListeAdmission (complementaire) | Email promus          |

---

## 📈 Performance & Optimisation

### Requêtes critiques

```sql
-- Index requis
CREATE INDEX idx_candidatures_master_statut ON Candidature(master_id, statut);
CREATE INDEX idx_candidature_liste_liste ON CandidatListe(liste_id, rang);
CREATE INDEX idx_candidatures_master_score ON Candidature(master_id, score DESC);

-- BulkInsert (US 5.1, 6.3, 6.5)
INSERT INTO CandidatListe (candidat_id, liste_id, rang, score)
VALUES (...), (...), ...
-- Performance: 1000 records en <100ms

-- Pagination (US 6.2)
SELECT * FROM Candidature WHERE master_id = ? AND statut = 'dossier_depose'
LIMIT 50 OFFSET 0
```

### Asynchrone

- **Email** : Queue RabbitMQ (non-bloquant)
- **Notifications** : Worker service (5-10 secondes latence acceptable)
- **Excel parsing** : Pour fichiers > 10MB, job asynchrone

---

## 📝 Notes de dépôt

Tous les diagrammes et documentation sont dans :

- `/docs/diagrams/sprint3-sequence-complete.puml`
- `/docs/SPRINT3_SEQUENCE_DIAGRAMS.md` (ce fichier)

Pour affichage/impression :

- Ouvrir `.puml` dans PlantUML viewer
- Exporter en PNG/SVG si besoin
- Intégrer dans rapport soutenance
