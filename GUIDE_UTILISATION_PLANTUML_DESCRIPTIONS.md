# Guide d'Utilisation - Diagrammes Sprint3 (PlantUML + Descriptions)

## 📋 Fichiers Créés

### 1. **Sprint3_Theme1_Preselection_5.1-5.3.puml**

- Diagramme complet: US 5.1 (Générer listes), US 5.2 (Modifier listes), US 5.3 (Exporter)
- Format: PlantUML (texte brut)
- Résultat attendu: Sequence diagram avec 8 participants (Commission, Dashboard, Controller, Service, Repository, DB, Storage, Notifications)

### 2. **Sprint3_Theme2_Selection_Inscription_6.1-6.5.puml**

- Diagramme complet: US 6.1 (S'inscrire), US 6.2 (Étudier dossiers), US 6.3 (Classer), US 6.4 (Import EXCEL), US 6.5 (Liste complémentaire)
- Format: PlantUML (texte brut)
- Résultat attendu: Sequence diagram détaillé avec tous les flux

### 3. **Sprint3_Descriptions_Completes_Tableau_Word.md**

- Descriptions formatées en tableaux Markdown/Word
- Colonnes: Titre | Acteurs | Précondition | Scénario nominal | Scénario optionnel | Scénario d'exception | Postcondition
- Copyable directement dans Microsoft Word ou Google Docs

---

## 🔄 CONVERTIR LES FICHIERS .PUML EN PDF

### **Option 1: PlantUML Online (Rapide, sans installation)**

1. Ouvrir: https://www.plantuml.com/plantuml/uml/
2. Copier le contenu du fichier `.puml` dans l'éditeur
3. La prévisualisation s'affiche automatiquement
4. Clic droit → "Save as" ou menu **File → Export → PDF**

### **Option 2: VS Code Extension (Recommandé)**

1. Installer extension: **PlantUML** (jgraph.drawio) ou **PlantUML (Official)**
   ```
   Ctrl+Shift+X → Rechercher "PlantUML" → Install
   ```
2. Ouvrir le fichier `.puml` dans VS Code
3. Clic droit dans l'éditeur → **PlantUML: Export Current Diagram → PDF**
   (ou utiliser le raccourci clavier affiché)
4. Fichier PDF généré dans le même dossier

### **Option 3: Command Line (Avancé)**

1. Installer PlantUML:
   ```bash
   choco install plantuml
   # ou
   apt-get install plantuml  # Linux
   brew install plantuml      # macOS
   ```
2. Générer PDF:
   ```bash
   plantuml -Tpdf Sprint3_Theme1_Preselection_5.1-5.3.puml
   plantuml -Tpdf Sprint3_Theme2_Selection_Inscription_6.1-6.5.puml
   ```
3. Fichiers PDF générés automatiquement

### **Option 4: Utiliser Docker (Si PlantUML non installé)**

```bash
docker run --rm -v "C:\Users\HP\Desktop\PFE:/data" \
  plantuml/plantuml -Tpdf /data/Sprint3_Theme1_Preselection_5.1-5.3.puml
```

---

## 📄 INTÉGRER LES DESCRIPTIONS DANS WORD

### **Copier les tableaux depuis le fichier .md:**

1. Ouvrir `Sprint3_Descriptions_Completes_Tableau_Word.md` (ou lire le contenu depuis VS Code)
2. Copier une section tableau (ex. US 5.1) entre les deux lignes `| **Élément** |`
3. Ouvrir Microsoft Word
4. Créer un tableau 2 colonnes × 7 lignes
5. Coller les données, puis "Table Design → Convertir en tableau" si besoin
6. Ajuster largeurs colonnes pour lisibilité

### **Alternative: Markdown to Word Conversion**

1. Installer `pandoc`:
   ```bash
   choco install pandoc
   ```
2. Convertir MD → DOCX:
   ```bash
   pandoc Sprint3_Descriptions_Completes_Tableau_Word.md -o Sprint3_Descriptions.docx
   ```
3. Ouvrir le fichier Word généré et ajuster mise en forme

---

## 🎯 STRUCTURE COMPLÈTE FOURNIE

### **Architecture MVC mappée:**

```
┌─────────────────────────────────────────────────────────────┐
│                        ANGULAR UI                           │
│   (candidature-form.component,                              │
│    preparer-preselection.ts, liste-selection.ts, ...)       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST API
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    DJANGO CONTROLLER                        │
│              (candidature_app/views.py)                     │
│   POST /preselection/generate                              │
│   PATCH /preselection/{id}/move                            │
│   POST /dossiers/{id}/decision                             │
│   POST /classification/create-lists                        │
│   POST /import/excel-inscrits                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   SERVICE LAYER (Métier)                    │
│   (candidature_app/services.py)                            │
│   - PreselectionService                                    │
│   - ClassificationService                                  │
│   - ImportPaiementService                                  │
│   - StatutService                                          │
│   - emails.py (envoyer_email_*)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              MODEL / REPOSITORY (ORM Django)                │
│   (candidature_app/models.py)                              │
│   Candidature, ListeAdmission, CandidatListe,              │
│   InscriptionEnLigne, DossierCandidature, Document, ...    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE (SQLite/PostgreSQL)              │
│   - candidature_app_candidature                            │
│   - candidature_app_listeadmission                          │
│   - candidature_app_candidatliste                          │
│   - candidature_app_inscriptionenligne                     │
│   - candidature_app_dossier                                │
│   - candidature_app_document                               │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST UTILISATION

### **Pour présenter les diagrammes:**

- [ ] Convertir `.puml` → PDF (Option 1-4 ci-dessus)
- [ ] Vérifier rendus PDF (dimensions, lisibilité)
- [ ] Importer PDFs dans votre présentation/document

### **Pour documenter les use-cases:**

- [ ] Copier tableaux depuis `.md` vers Word/Google Docs
- [ ] Adapter format et styles selon votre template
- [ ] Ajouter logos, en-têtes, pieds de page

### **Pour implémentation:**

- [ ] Vérifier fichiers déjà existants (views.py, services.py, models.py)
- [ ] Ajouter management command `init_parcours.py` (déjà créé)
- [ ] Valider endpoints API listés dans les diagrammes
- [ ] Tester flux avec données réelles

---

## 📞 SUPPORT TECHNIQUE

### **PlantUML ne s'affiche pas:**

- Vérifier syntaxe: pas d'accents non-échappés
- Vérifier équilibre parenthèses/accolades
- Tester avec version online d'abord

### **Conversion PDF lente:**

- PlantUML peut être gourmand en RAM pour gros diagrammes
- Solution: diviser en sous-diagrammes (déjà fait par thème)

### **Tableau Word mal formaté après copie-colle:**

- Utiliser `Ctrl+Maj+V` (Paste Special) → Unformatted Text
- Puis reconstituer tableau dans Word

---

## 📌 FICHIERS CRÉÉS RÉSUMÉ

| Fichier                                             | Type     | Contenu                       | Taille approx. |
| --------------------------------------------------- | -------- | ----------------------------- | -------------- |
| `Sprint3_Theme1_Preselection_5.1-5.3.puml`          | PlantUML | Seq. diagram US 5.1-5.3       | ~200 lignes    |
| `Sprint3_Theme2_Selection_Inscription_6.1-6.5.puml` | PlantUML | Seq. diagram US 6.1-6.5       | ~400 lignes    |
| `Sprint3_Descriptions_Completes_Tableau_Word.md`    | Markdown | Tableaux détaillés (7 thèmes) | ~500 lignes    |
| `init_parcours.py` (bonus)                          | Python   | Management command Django     | 150 lignes     |

---

## 🚀 PROCHAINES ÉTAPES

1. **Générer PDFs** des diagrammes (instructions ci-dessus)
2. **Adapter descriptions** dans Word selon besoins internes
3. **Valider architecture** avec l'équipe dev
4. **Intégrer management command** pour initialiser parcours/critères
5. **Planifier tests E2E** pour chaque US

---

**Créé le:** 11/05/2026  
**Version:** Sprint 3 Final  
**État:** Prêt pour validation et intégration
