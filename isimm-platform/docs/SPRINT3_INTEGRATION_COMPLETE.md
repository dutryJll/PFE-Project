# SPRINT 3 - GUIDE D'INTÉGRATION COMPLET

## 📑 Fichiers de Documentation

### Diagrammes disponibles:

1. **sprint3-sequence-complete.puml** - Diagrammes de séquence détaillés (5.1 à 6.5)
2. **sprint3-activity-diagrams.puml** - Flux d'activité pour chaque US
3. **sprint3-state-diagrams.puml** - Machines d'état (Candidature, ListeAdmission, Inscription)
4. **SPRINT3_SEQUENCE_DIAGRAMS.md** - Documentation détaillée

---

## 🎯 Résumé des Use Cases

### BLOC 5: Présélection des candidatures

#### **US 5.1 : Générer listes de présélection**

```
Entrée: Commission lance génération
↓
Configuration: {seuil: 10.5, quotas: {GL: 30, IA: 20}, ratio: 0.7}
↓
Processus:
1. Query candidats (score >= seuil)
2. Tri DESC par score
3. Application quotas par spécialité
4. Création ListeAdmission (principale + attente)
5. BulkInsert CandidatListe avec rang
6. Notifications async
↓
Sortie: 2 listes publiées
- Principale: 30 candidats
- Attente: 21 candidats
```

**Points techniques:**

- 🔒 Token Bearer obligatoire
- 📊 BulkInsert pour performance (< 100ms)
- 📝 Audit trail création
- 📧 Async email (queue RabbitMQ)

---

#### **US 5.2 : Modifier liste présélectionnée**

```
Actions:
├─ PROMOUVOIR (attente → principale)
├─ RÉTROGRADER (principale → attente)
└─ RETIRER (supprimer de liste)

Processus:
1. Récupérer CandidatListe actuel
2. Mettre à jour liste_id + rang
3. Recalculer rangs (stable)
4. Créer AuditLog (audit trail)
5. Optionnel: notifier candidat

Validations:
- ✓ Quota non dépassé
- ✓ Candidat existe
- ✓ Modification logique
```

**Points techniques:**

- 🔐 Idempotence (même requête 2x = même résultat)
- 📊 Recalcul rang stable (performance)
- 📝 AuditLog complet
- 🔄 Transactions BD

---

#### **US 5.3 : Exporter liste**

```
Formats supportés:
├─ CSV (texte délimité)
├─ XLSX (Excel formaté)
└─ PDF (rapport professionnel)

Colonnes:
Rang | Nom | Prénom | CIN | Email | Score | Spécialité | Statut

Processus:
1. Query CandidatListe avec JOIN candidat
2. Formatage selon format demandé
3. Stream au client (pas stockage temporaire)
4. Download automatique
```

**Points techniques:**

- 🔐 Stream (pas de fichier temp)
- 📝 UTF-8 BOM pour Excel
- 🎯 Content-Type: application/octet-stream
- 💾 Nom fichier: liste_principale_YYYYMMDD.xlsx

---

### BLOC 6: Inscription et Sélection

#### **US 6.1 : Candidat s'inscrit**

```
Pré-requis:
- Candidat sélectionné EN PRINCIPALE
- Deadline valide (TODAY <= deadline)
- Token candidat valide

Flux:
1. Candidat accède "Mon inscription"
2. Vérification statut (GET /statut-final)
3. Si sélectionné: afficher formulaire
4. Upload preuve paiement (PDF, <5MB)
5. Accepter conditions
6. Click "Confirmer"
↓
Validation:
- ✓ Deadline
- ✓ Fichier (type + taille)
- ✓ Candidat en principale
↓
Création:
- StorageFile (upload sécurisé)
- InscriptionEnLigne (en_attente_verification)
- Update Candidature (inscription_soumise)
↓
Notification:
- Email responsable: "À vérifier paiement"
```

**Points techniques:**

- 🔒 Token Bearer candidate
- 📁 Upload sécurisé (scan, quota)
- ✅ Deadline stricte
- 📧 Notification async responsable
- 🔄 Idempotence (2 submissions = update)

---

#### **US 6.2 : Étudier dossiers et décider**

```
Interface:
- Tableau dossiers (50 par page)
- Modal lecture (PDF viewer)
- Zone décision (radio ACCEPTER/REJETER + motif)

Flux:
1. Responsable sélectionne dossier
2. Lecture fichiers PDF
3. Analyse candidature
4. Sélection ACCEPTER ou REJETER
5. Entrée motif (obligatoire si rejet)
6. Soumission
↓
Traitement:
- Update Candidature (statut: accepte/rejete)
- AuditLog (who, when, decision)
- Notification candidat (async):
  ├─ Si ACCEPTER: "Félicitations, prochaines étapes"
  └─ Si REJETER: "Motif du rejet"
↓
Affichage:
- Candidat déplacé colonne appropriée
- Focus dossier suivant
```

**Points techniques:**

- 🔐 Rôle: responsable_commission
- 📄 PDF Viewer intégré Angular
- 📝 AuditLog immutable
- 📧 Email async (haute priorité)
- ⚠️ Statut immutable (pas de révision)

---

#### **US 6.3 : Classer candidatures et Publier**

```
Pré-requis:
- Tous dossiers étudiés (statut accepte/rejete)
- Commission présente

Flux:
1. Query candidats (statut='accepte')
2. Tri DESC par score (stable sort)
3. Créer ListeAdmission (principale_finale + attente_finale)
4. BulkInsert CandidatListe avec rang
5. Afficher statistiques
6. Commission valide classement
↓
Si validation:
7. Update ListeAdmission (est_publiee=true)
8. Notification TOUS candidats (async):
   ├─ Admis: "Félicitations, vous êtes 15ème"
   └─ Attente: "Liste d'attente, rang 5"
↓
Résultat:
- 2 listes publiées (immuables)
- ~100 emails envoyés
```

**Points techniques:**

- 📊 BulkInsert (performance)
- 🔄 Transaction publication
- ⚠️ Une fois publiée = immuable
- 📧 Queue job email (batch)
- 📈 Notifications haute priorité

---

#### **US 6.4 : Importer Excel**

```
Fichier Excel attendu:
Colonnes: CIN | NOM | PRENOM | EMAIL

Processus:
1. Upload fichier XLSX/XLS
2. Parse: extract données + normalisation
3. Query BD: candidats acceptés
4. Matching: Excel vs BD
   └─ Logique: CIN exact, fuzzy nom
5. Classification:
   ├─ INSCRIT: trouvé dans Excel
   ├─ NON_INSCRIT: accepté pas dans Excel
   └─ INCOHÉRENCE: doublon, erreur
6. Calcul statistiques:
   ├─ Taux inscription: 45/52 = 86.5%
   ├─ Non-inscrits: 5 ⚠️
   └─ Incohérences: 2 ❌
7. Rapport détaillé (tableaux)
↓
Audit:
- InscriptionRapprochementAudit créé
- Fichier original conservé
- Traçabilité complète
```

**Points techniques:**

- 🔄 Matching robuste (normalisation)
- 🔍 Détection doublons
- 📝 Rapport structuré
- 📊 BulkAnalysis (pas insert)
- 📈 Performance: < 10s pour 5000 lignes

---

#### **US 6.5 : Générer liste complémentaire**

```
Calcul vacances:
vacances = quota_principal - inscrits_confirmés
         = 52 - 45 = 7 places

Calcul promotions:
candidats_non_inscrits = 5
promotions = MAX(vacances - candidats_non_inscrits, 0)
           = MAX(7 - 5, 0) = 2 places

Si promotions > 0:
1. Query: top N meilleurs attente (rang 1, 2, ...)
2. Créer ListeAdmission (type: complementaire)
3. BulkInsert promus
4. Update Candidature (accepte_complementaire)
5. Notification promus (async):
   └─ "Admis suite à désistements, nouvelle deadline: +10 jours"
6. Commission publie liste
↓
Résultat:
- 2 candidats promus
- Nouvelles places comblées
- Équité: meilleurs de l'attente
```

**Points techniques:**

- 📊 Calcul dynamique
- ⏰ Nouvelle deadline (différente)
- 📧 Email haute priorité
- 🔄 Peut être répétée (si plus de désistements)
- 📝 Audit trail complet

---

## 🔐 Sécurité

### Authentification

```
Tous endpoints:
✓ Header Authorization: Bearer {token}
✓ Token validé via AuthService
✓ Claim: role (commission/candidat/responsable)
```

### Autorisation

```
Endpoints Commission (5.1-5.3):
- Rôle: commission
- Master_id: validé

Endpoints Candidat (6.1):
- Rôle: candidat
- Accès: propre ID uniquement

Endpoints Responsable (6.2-6.5):
- Rôle: responsable_commission
- Master_id: validé
```

### Audit Trail

```
Table AuditLog:
┌─ action: create_preselection|modify_liste|decision_accepte|...
├─ user_id: ID utilisateur
├─ candidat_id: Si applicable
├─ ancien_rang, nouveau_rang: Si modification
├─ timestamp: NOW()
└─ ip_address: FROM request

Immuabilité:
❌ Listes publiées: pas de modification
❌ Décisions commission: pas de révision
❌ Inscriptions confirmées: pas d'annulation
```

---

## 📊 Modèles de données

### ListeAdmission

```sql
CREATE TABLE ListeAdmission (
  id INT PRIMARY KEY AUTO_INCREMENT,
  master_id INT NOT NULL,
  type ENUM('principale', 'attente', 'principale_finale',
            'attente_finale', 'complementaire') NOT NULL,
  iteration INT NOT NULL,
  est_publiee BOOLEAN DEFAULT false,
  date_creation DATETIME DEFAULT NOW(),
  date_publication DATETIME NULL,
  FOREIGN KEY (master_id) REFERENCES Master(id),
  INDEX idx_master_type (master_id, type),
  INDEX idx_publiee (est_publiee)
);
```

### CandidatListe

```sql
CREATE TABLE CandidatListe (
  id INT PRIMARY KEY AUTO_INCREMENT,
  candidat_id INT NOT NULL,
  liste_id INT NOT NULL,
  rang INT NOT NULL,
  score DECIMAL(5,2),
  date_ajout DATETIME DEFAULT NOW(),
  FOREIGN KEY (candidat_id) REFERENCES Candidature(id),
  FOREIGN KEY (liste_id) REFERENCES ListeAdmission(id),
  UNIQUE KEY uk_candidat_liste (candidat_id, liste_id),
  INDEX idx_liste_rang (liste_id, rang)
);
```

### InscriptionEnLigne

```sql
CREATE TABLE InscriptionEnLigne (
  id INT PRIMARY KEY AUTO_INCREMENT,
  candidat_id INT NOT NULL,
  master_id INT NOT NULL,
  statut ENUM('en_attente_verification', 'paiement_accepte',
              'paiement_rejete', 'confirmee', 'abandonnee') NOT NULL,
  montant DECIMAL(10,2),
  reference_paiement VARCHAR(255),
  date_inscription DATETIME DEFAULT NOW(),
  date_paiement DATETIME,
  date_verification DATETIME NULL,
  FOREIGN KEY (candidat_id) REFERENCES Candidature(id),
  FOREIGN KEY (master_id) REFERENCES Master(id),
  INDEX idx_candidat_master (candidat_id, master_id),
  INDEX idx_statut (statut)
);
```

### AuditLog

```sql
CREATE TABLE AuditLog (
  id INT PRIMARY KEY AUTO_INCREMENT,
  action VARCHAR(100) NOT NULL,
  user_id INT NOT NULL,
  master_id INT,
  candidat_id INT,
  ancien_rang INT NULL,
  nouveau_rang INT NULL,
  timestamp DATETIME DEFAULT NOW(),
  ip_address VARCHAR(45),
  INDEX idx_action_timestamp (action, timestamp),
  INDEX idx_user_timestamp (user_id, timestamp)
);
```

---

## 📈 Performance

### Indexes essentiels

```sql
CREATE INDEX idx_candidatures_master_statut
  ON Candidature(master_id, statut);

CREATE INDEX idx_candidature_liste_rang
  ON CandidatListe(liste_id, rang);

CREATE INDEX idx_candidatures_score
  ON Candidature(master_id, score DESC);

CREATE INDEX idx_inscription_candidat
  ON InscriptionEnLigne(candidat_id);

CREATE INDEX idx_audit_user_timestamp
  ON AuditLog(user_id, timestamp);
```

### BulkInsert Performance

```
1000 candidats: < 100ms
5000 candidats: < 500ms
10000 candidats: < 1s

Technique:
INSERT INTO table (col1, col2, ...)
VALUES (...), (...), ...
(Batch de 500 max par requête)
```

### Pagination (US 6.2)

```
Dossiers par page: 50
Query avec LIMIT 50 OFFSET 0
Performance: < 200ms
```

---

## 🔄 Notifications (Async)

### Queue RabbitMQ

```
Exchange: notifications
├─ preselection.created
├─ inscription.submitted
├─ decision.accepted
├─ decision.rejected
├─ lists.published
├─ complementary.promoted
└─ inscription.verified
```

### Email Templates

```
preselection.html:
- Candidat présenté dans liste principale
- Informations essentielles

inscription.requested.html:
- Responsable: nouvelle inscription à vérifier
- Lien d'action

decision.accepted.html:
- Candidat accepté
- Prochaines étapes

decision.rejected.html:
- Candidat rejeté
- Motif expliqué

lists.published.html:
- Rang final
- Prochaines étapes
- Lien inscription

complementary.promoted.html:
- Admis suite à désistements
- NOUVELLE DEADLINE
```

---

## ✅ Checklist d'intégration

### Base de données

- [ ] Tables créées (ListeAdmission, CandidatListe, InscriptionEnLigne, AuditLog)
- [ ] Indexes créés
- [ ] Relations FK validées
- [ ] Migrations Django appliquées

### Backend - Services

- [ ] SelectionService (US 5.1, 5.2, 6.3, 6.5)
- [ ] ExportService (US 5.3)
- [ ] InscriptionService (US 6.1)
- [ ] ClassificationService (US 6.3)
- [ ] ReconciliationService (US 6.4)
- [ ] NotificationService (async queues)

### API Endpoints

- [ ] POST /api/candidatures/master/{id}/generer-listes (5.1)
- [ ] PATCH /api/candidatures/listes/{listeId} (5.2)
- [ ] GET /api/candidatures/listes/{listeId}/export/{format} (5.3)
- [ ] GET /api/candidatures/{candidatId}/statut-final (6.1)
- [ ] POST /api/candidatures/inscriptions-administratives (6.1)
- [ ] GET /api/candidatures/dossiers-etude (6.2)
- [ ] POST /api/candidatures/{candidatId}/commission-decision (6.2)
- [ ] GET /api/candidatures/master/{masterId}/classification (6.3)
- [ ] POST /api/candidatures/listes/{listeId}/publier (6.3)
- [ ] POST /api/candidatures/inscriptions/rapprochement (6.4)
- [ ] POST /api/candidatures/master/{masterId}/liste-complementaire (6.5)

### Frontend

- [ ] Dashboard Commission (5.1-5.3)
- [ ] Dashboard Candidat (6.1)
- [ ] Interface Responsable (6.2-6.5)
- [ ] PDF Viewer intégré
- [ ] Upload fichiers
- [ ] Tableaux interactifs

### Tests

- [ ] US 5.1: Présélection avec quotas
- [ ] US 5.2: Modification rangs
- [ ] US 5.3: Export CSV/XLSX/PDF
- [ ] US 6.1: Inscription candidat
- [ ] US 6.2: Étude dossiers
- [ ] US 6.3: Classement et publication
- [ ] US 6.4: Import Excel + matching
- [ ] US 6.5: Liste complémentaire

### Documentations

- [ ] Diagrammes de séquence
- [ ] Diagrammes d'activité
- [ ] Diagrammes d'état
- [ ] Guide d'intégration (ce fichier)
- [ ] Dataflow diagrams
- [ ] API documentation

---

## 📞 Points de contact

### Support technique

- **Base de données**: DBA / DevOps
- **Backend**: Équipe candidature_service
- **Frontend**: Équipe Angular
- **Notifications**: Équipe RabbitMQ / Email

### Escalade

- Bugs critiques (5.1, 6.3): Lead technique
- Problèmes perf: DevOps
- Issues sécurité: CISO

---

## 📅 Timeline d'intégration

```
Semaine 1: BD + Backend base (5.1)
Semaine 2: Frontend 5.1 + Tests
Semaine 3: US 5.2-5.3 + Frontend
Semaine 4: US 6.1 + Tests intégration
Semaine 5: US 6.2 + Frontend (dossiers)
Semaine 6: US 6.3 + Publication
Semaine 7: US 6.4 + Excel matching
Semaine 8: US 6.5 + Notifications
Semaine 9: E2E Tests + Perf
Semaine 10: Documentation + Soutenance
```

---

## 🎓 Prêt pour la soutenance!

Tous les diagrammes, documentations et guides sont maintenant complets pour présenter Sprint 3 de manière professionnelle et détaillée.
