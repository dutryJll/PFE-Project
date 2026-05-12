# SPRINT 3 - INDEX DES DIAGRAMMES ET DOCUMENTATION

## 📁 Structure de fichiers

```
isimm-platform/docs/
├── diagrams/
│   ├── sprint3-sequence-complete.puml    ✅ 8 diagrammes de séquence (5.1-6.5)
│   ├── sprint3-activity-diagrams.puml    ✅ 7 diagrammes d'activité
│   ├── sprint3-state-diagrams.puml       ✅ 5 machines d'état
│   └── [autres diagrammes Sprint 1/2]
├── SPRINT3_SEQUENCE_DIAGRAMS.md          ✅ Doc détaillée (4000+ lignes)
├── SPRINT3_INTEGRATION_COMPLETE.md       ✅ Guide intégration complet
└── [autres doc Sprint 1/2]
```

---

## 🎯 Vue d'ensemble Sprint 3

```
┌─────────────────────────────────────────────────────────────────┐
│                     SPRINT 3 - FLUX COMPLET                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  BLOC 5: PRÉSÉLECTION DES CANDIDATURES                           │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ US 5.1: Générer listes                                  │    │
│  │ ├─ Récupérer candidats (score >= seuil)               │    │
│  │ ├─ Tri DESC par score                                 │    │
│  │ ├─ Application quotas par spécialité                  │    │
│  │ └─ Création ListeAdmission (principale + attente)     │    │
│  │                                                         │    │
│  │ US 5.2: Modifier liste (optionnel)                     │    │
│  │ ├─ PROMOUVOIR (attente → principale)                 │    │
│  │ ├─ RÉTROGRADER (principale → attente)                │    │
│  │ └─ RETIRER (supprimer)                               │    │
│  │                                                         │    │
│  │ US 5.3: Exporter liste                                 │    │
│  │ ├─ CSV (texte)                                        │    │
│  │ ├─ XLSX (Excel)                                       │    │
│  │ └─ PDF (rapport)                                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                               ↓                                   │
│  BLOC 6: INSCRIPTION ET SÉLECTION                                │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ US 6.1: Candidat s'inscrit                              │    │
│  │ ├─ Vérifier statut sélectionné                        │    │
│  │ ├─ Upload preuve paiement                             │    │
│  │ └─ Statut: inscription_soumise                         │    │
│  │                                                         │    │
│  │ US 6.2: Étudier dossiers et décider                    │    │
│  │ ├─ Lecture fichiers PDF                               │    │
│  │ ├─ Décision: ACCEPTER / REJETER                       │    │
│  │ └─ Notification candidat                              │    │
│  │                                                         │    │
│  │ US 6.3: Classer et publier listes finales             │    │
│  │ ├─ Tri final des acceptés                             │    │
│  │ ├─ Création principale_finale + attente_finale        │    │
│  │ └─ PUBLICATION → Notifications tous candidats         │    │
│  │                                                         │    │
│  │ US 6.4: Importer Excel et vérifier                     │    │
│  │ ├─ Upload fichier XLSX                                │    │
│  │ ├─ Parsing + normalisation                            │    │
│  │ ├─ Matching: Excel vs BD (CIN, nom)                   │    │
│  │ ├─ Rapport: inscrits, non-inscrits, incohérences     │    │
│  │ └─ Audit trail complet                                │    │
│  │                                                         │    │
│  │ US 6.5: Générer liste complémentaire                  │    │
│  │ ├─ Calcul vacances                                    │    │
│  │ ├─ Promotion meilleurs attente                        │    │
│  │ ├─ Nouvelle deadline pour promus                      │    │
│  │ └─ Publication (optionnel)                            │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Matrice de documentation

| US  | Séquence   | Activité   | État        | Documentation | Checklist |
| --- | ---------- | ---------- | ----------- | ------------- | --------- |
| 5.1 | ✅ [Seq]() | ✅ [Act]() | -           | ✅ [Doc]()    | ✅        |
| 5.2 | ✅ [Seq]() | ✅ [Act]() | -           | ✅ [Doc]()    | ✅        |
| 5.3 | ✅ [Seq]() | -          | -           | ✅ [Doc]()    | ✅        |
| 6.1 | ✅ [Seq]() | ✅ [Act]() | ✅ [État]() | ✅ [Doc]()    | ✅        |
| 6.2 | ✅ [Seq]() | ✅ [Act]() | ✅ [État]() | ✅ [Doc]()    | ✅        |
| 6.3 | ✅ [Seq]() | ✅ [Act]() | ✅ [État]() | ✅ [Doc]()    | ✅        |
| 6.4 | ✅ [Seq]() | ✅ [Act]() | -           | ✅ [Doc]()    | ✅        |
| 6.5 | ✅ [Seq]() | ✅ [Act]() | -           | ✅ [Doc]()    | ✅        |

---

## 🔍 Guide de lecture par rôle

### 👨‍💼 Pour la Commission (5.1-5.3)

**Commencer par:**

1. [Diagramme séquence US 5.1](SPRINT3_SEQUENCE_DIAGRAMS.md#us-51--présélectionner-les-meilleures-candidatures)
2. [Diagramme activité US 5.1](sprint3-activity-diagrams.puml)
3. [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-51--générer-listes-de-présélection)

**Puis explorer:**

- US 5.2 pour modifications
- US 5.3 pour exports

### 👨‍🎓 Pour le Candidat (6.1)

**Commencer par:**

1. [Diagramme séquence US 6.1](SPRINT3_SEQUENCE_DIAGRAMS.md#us-61--candidat-sinscrit)
2. [Machine d'état Candidature](sprint3-state-diagrams.puml)
3. [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-61--candidat-sinscrit)

### 👨‍💻 Pour le Responsable Commission (6.2-6.5)

**Lire dans cet ordre:**

1. US 6.2: [Séquence](SPRINT3_SEQUENCE_DIAGRAMS.md#us-62--étudier-dossiers-et-décider) → [Activité](sprint3-activity-diagrams.puml)
2. US 6.3: [Séquence](SPRINT3_SEQUENCE_DIAGRAMS.md#us-63--classer-candidatures) → [Activité](sprint3-activity-diagrams.puml)
3. US 6.4: [Séquence](SPRINT3_SEQUENCE_DIAGRAMS.md#us-64--importer-excel) → [Activité](sprint3-activity-diagrams.puml) (complexe!)
4. US 6.5: [Séquence](SPRINT3_SEQUENCE_DIAGRAMS.md#us-65--liste-complémentaire) → [Activité](sprint3-activity-diagrams.puml)

### 👨‍💻 Pour le Développeur Backend

**Tous les diagrammes + Guide intégration:**

1. Lire [SPRINT3_INTEGRATION_COMPLETE.md](SPRINT3_INTEGRATION_COMPLETE.md) - vue d'ensemble
2. Consulter [SPRINT3_SEQUENCE_DIAGRAMS.md](SPRINT3_SEQUENCE_DIAGRAMS.md) - détails technique
3. Implémenter endpoints en suivant [checklist](SPRINT3_INTEGRATION_COMPLETE.md#-checklist-dintégration)

### 👨‍💻 Pour le Développeur Frontend

**Focus Angular:**

1. [Diagrammes séquence](sprint3-sequence-complete.puml) - flux utilisateur
2. [Machines d'état](sprint3-state-diagrams.puml) - gestion statuts
3. [API Endpoints](SPRINT3_INTEGRATION_COMPLETE.md#api-endpoints) à intégrer
4. [Templates notifications](SPRINT3_INTEGRATION_COMPLETE.md#email-templates)

### 📊 Pour l'Architecte / Lead technique

**Lire complètement:**

1. [Résumé des use cases](SPRINT3_INTEGRATION_COMPLETE.md#-résumé-des-use-cases)
2. [Modèles de données](SPRINT3_INTEGRATION_COMPLETE.md#-modèles-de-données)
3. [Sécurité et audit](SPRINT3_INTEGRATION_COMPLETE.md#-sécurité)
4. [Performance](SPRINT3_INTEGRATION_COMPLETE.md#-performance)
5. Tous les diagrammes pour vision globale

---

## 🎯 Quick Links par Use Case

### US 5.1 - Présélectionner

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-51--présélectionner-les-meilleures-candidatures)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-51)
- 🔄 [Flux activité](sprint3-activity-diagrams.puml#us-51)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-51--générer-listes-de-présélection)
- 📝 [Test checklist](SPRINT3_INTEGRATION_COMPLETE.md#tests)

### US 5.2 - Modifier liste

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-52--modifier-liste-présélectionnée)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-52)
- 🔄 [Flux activité](sprint3-activity-diagrams.puml#us-52)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-52--modifier-liste-présélectionnée)

### US 5.3 - Exporter

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-53--exporter-liste)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-53)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-53--exporter-liste)
- 💾 [Formats supportés](SPRINT3_SEQUENCE_DIAGRAMS.md#-colonnes-export)

### US 6.1 - Candidat s'inscrit

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-61--candidat-sinscrit)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-61)
- 🔄 [Flux activité](sprint3-activity-diagrams.puml#us-61)
- 🔄 [Machine d'état](sprint3-state-diagrams.puml#machine-détat--inscriptionenligne)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-61--candidat-sinscrit)
- 📧 [Email template](SPRINT3_INTEGRATION_COMPLETE.md#email-templates)

### US 6.2 - Étudier dossiers

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-62--étudier-dossiers-et-décider)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-62)
- 🔄 [Flux activité](sprint3-activity-diagrams.puml#us-62)
- 🔄 [Machine d'état](sprint3-state-diagrams.puml#machine-détat--candidature)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-62--étudier-dossiers-et-décider)

### US 6.3 - Classer et publier

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-63--classer-candidatures)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-63)
- 🔄 [Flux activité](sprint3-activity-diagrams.puml#us-63)
- 🔄 [Machine d'état](sprint3-state-diagrams.puml#machine-détat--listeadmission)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-63--classer-candidatures-et-publier)

### US 6.4 - Importer Excel

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-64--importer-excel)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-64)
- 🔄 [Flux activité - TRÈS DÉTAILLÉ](sprint3-activity-diagrams.puml#us-64)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-64--importer-excel)
- 📊 [Exemple rapport](SPRINT3_SEQUENCE_DIAGRAMS.md#-exemple-rapport)

### US 6.5 - Liste complémentaire

- 📋 [Description](SPRINT3_SEQUENCE_DIAGRAMS.md#us-65--liste-complémentaire)
- 📊 [Séquence détaillée](sprint3-sequence-complete.puml#us-65)
- 🔄 [Flux activité](sprint3-activity-diagrams.puml#us-65)
- ⚙️ [Points techniques](SPRINT3_INTEGRATION_COMPLETE.md#us-65--générer-liste-complémentaire)

---

## 📈 Flux global en 6 étapes

```
Étape 1: PRÉSÉLECTION (Semaine 1)
┌─────────────────────────────┐
│ Commission genère listes    │
│ [US 5.1]                    │
│ - Tri par score             │
│ - Application quotas        │
│ - Création principales+att. │
└──────────┬──────────────────┘
           ↓
Optionnel: Modifications manuelles [US 5.2]
Optionnel: Exports [US 5.3]

Étape 2: INSCRIPTION (Semaines 2-3)
┌─────────────────────────────┐
│ Candidat s'inscrit [US 6.1] │
│ - Upload preuve paiement    │
│ - Statut: en_attente        │
└──────────┬──────────────────┘
           ↓
Responsable vérifie paiements

Étape 3: ÉTUDE DOSSIERS (Semaines 4-5)
┌─────────────────────────────┐
│ Étudier dossiers [US 6.2]   │
│ - Lecture PDF               │
│ - Décision: accepte/rejete  │
│ - Notification candidats    │
└──────────┬──────────────────┘
           ↓
Étape 4: CLASSEMENT (Semaine 6)
┌─────────────────────────────┐
│ Classer & Publier [US 6.3]  │
│ - Tri final                 │
│ - Création listes finales   │
│ - PUBLICATION = notifications
└──────────┬──────────────────┘
           ↓
Étape 5: VÉRIFICATION (Semaines 7-8)
┌─────────────────────────────┐
│ Importer Excel [US 6.4]     │
│ - Upload inscrits Excel     │
│ - Matching vs BD            │
│ - Rapport non-inscrits      │
└──────────┬──────────────────┘
           ↓
Étape 6: COMPLÉMENTAIRE (Semaine 9)
┌─────────────────────────────┐
│ Liste complémentaire [US 6.5]│
│ - Calcul vacances           │
│ - Promotion attente         │
│ - Nouvelle deadline         │
└─────────────────────────────┘
```

---

## 🔒 Points de sécurité critiques

1. **5.1**: Transaction atomique (tout ou rien)
2. **5.2**: Audit trail sur chaque modification
3. **6.1**: Deadline stricte + validation fichier
4. **6.2**: Immuabilité des décisions
5. **6.3**: Publication atomique + notifications
6. **6.4**: Réconciliation robuste (normalization, fuzzy matching)
7. **6.5**: Calcul correct des vacances

---

## 🎓 Utilisation pour la soutenance

### Ordre de présentation recommandé:

1. **Vue d'ensemble** (3 min)
   - Sprint3_Integration_Complete.md - résumé
   - Diagramme flux global

2. **Détail par US** (25 min)
   - Pour chaque US 5.1 → 6.5:
     - Séquence
     - Points techniques
     - Exemple de données

3. **Sécurité et Performance** (5 min)
   - Authentification / Autorisation
   - Indexes BD
   - Notifications async

4. **Démonstration (si possible)** (10 min)
   - Présélection (UI)
   - Inscription candidat
   - Étude dossiers
   - Import Excel

---

## ✅ Fichiers à joindre au rapport

```
📁 Documentation/
├── 📄 SPRINT3_SEQUENCE_DIAGRAMS.md
├── 📄 SPRINT3_INTEGRATION_COMPLETE.md
├── 📁 Diagrams/
│   ├── 📊 sprint3-sequence-complete.png (export)
│   ├── 📊 sprint3-activity-diagrams.png (export)
│   └── 📊 sprint3-state-diagrams.png (export)
├── 📋 SPRINT3_INDEX.md (ce fichier)
└── 📊 Data models (SQL scripts)
```

---

## 🚀 Points clés pour la soutenance

✅ **8 US complètement documentés** (5.1-6.5)
✅ **3 types de diagrammes** (Séquence, Activité, État)
✅ **Modèles de données** (SQL complet)
✅ **Sécurité et audit** (complet)
✅ **Performance** (indexes, bulk operations)
✅ **Notifications asynchrones** (queue RabbitMQ)
✅ **Checklist d'intégration** (30+ items)
✅ **Timeline réaliste** (10 semaines)

---

## 📞 Support et questions

Pour clarifications sur:

- **Séquences**: Voir SPRINT3_SEQUENCE_DIAGRAMS.md
- **Architecture**: Voir SPRINT3_INTEGRATION_COMPLETE.md
- **Diagrammes**: Voir sprint3-\*.puml files
- **Implémentation**: Voir checklist d'intégration

---

**Dernière mise à jour**: Mai 2026
**Prêt pour soutenance**: ✅ OUI
