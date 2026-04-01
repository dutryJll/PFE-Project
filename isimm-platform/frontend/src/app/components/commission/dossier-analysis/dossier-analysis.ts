import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface OCRAnomaly {
  type: string;
  champ?: string;
  message: string;
  saisi?: string;
  officiel?: string;
  manquants?: string[];
  line?: number;
  declared?: string;
  extracted?: string;
}

interface OCRDiagnostic {
  module: string;
  validation_auto: boolean;
  confiance: number;
  anomalies: OCRAnomaly[];
  external_provider: string;
  external_used: boolean;
  decision: string;
}

interface Candidature {
  id: number;
  candidat_nom: string;
  email: string;
  master_nom: string;
  statut: string;
  date_depot_dossier: string;
  score?: number;
}

@Component({
  selector: 'app-dossier-analysis',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './dossier-analysis.html',
  styleUrls: ['./dossier-analysis.css'],
})
export class DossierAnalysisComponent implements OnInit {
  private readonly apiBaseUrl = 'http://localhost:8003/api/candidatures';

  private buildAuthOptions(): { headers: Record<string, string> } | {} {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return {};
    }
    return { headers: { Authorization: `Bearer ${token}` } };
  }
  /** @description Liste des dossiers déposés (statut dossier_depose) */
  candidaturesList: Candidature[] = [];

  /** @description Candidature sélectionnée pour analyse */
  selectedCandidature: Candidature | null = null;

  /** @description Diagnostic OCR de la candidature sélectionnée */
  ocrDiagnostic: OCRDiagnostic | null = null;

  /** @description État de chargement */
  isLoading = false;
  isAnalyzing = false;

  /** @description Messages d'erreur/succès */
  errorMessage = '';
  successMessage = '';
  analyzedCount = 0;
  requiresLogin = false;

  searchTerm = '';
  selectedMasterFilter = 'all';

  /** @description Formulaire de simulation pour test OCR */
  formulaireSimulation = {
    cin: '',
    moyenne_generale: '',
    documents: [] as string[],
    declared_lines: [] as string[],
    extracted_lines: [] as string[],
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadCandidatures();
  }

  goToDashboard(): void {
    this.router.navigate(['/commission/dashboard']);
  }

  reconnect(): void {
    this.authService.logout();
  }

  get totalDossiers(): number {
    return this.candidaturesList.length;
  }

  get filteredCandidatures(): Candidature[] {
    const search = this.searchTerm.trim().toLowerCase();
    return this.candidaturesList.filter((c) => {
      const masterName = (c.master_nom || '').toLowerCase();
      const isIngenieur =
        masterName.includes('ingenieur') ||
        masterName.includes('ingénieur') ||
        masterName.includes('genie logiciel') ||
        masterName.includes('génie logiciel');

      const matchMaster =
        this.selectedMasterFilter === 'all' ||
        (this.selectedMasterFilter === 'ingenieur'
          ? isIngenieur
          : c.master_nom === this.selectedMasterFilter);
      if (!matchMaster) {
        return false;
      }

      if (!search) {
        return true;
      }

      return [c.candidat_nom, c.email, c.master_nom, String(c.id)]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }

  get uniqueMasters(): string[] {
    return Array.from(
      new Set(this.candidaturesList.map((c) => c.master_nom).filter(Boolean)),
    ).sort();
  }

  get lastAnomalyCount(): number {
    return this.ocrDiagnostic?.anomalies?.length || 0;
  }

  /**
   * Charge la liste des candidatures avec statut 'dossier_depose'
   * @description Récupère les dossiers en attente d'analyse OCR
   */
  loadCandidatures(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.requiresLogin = false;

    this.http
      .get<Candidature[] | { results: Candidature[] }>(`${this.apiBaseUrl}/dossiers-ocr/`)
      .subscribe({
        next: (data) => {
          const list = Array.isArray(data)
            ? data
            : Array.isArray(data?.results)
              ? data.results
              : [];
          this.candidaturesList = list.filter((c: Candidature) => c.statut === 'dossier_depose');
          this.isLoading = false;

          if (this.selectedCandidature) {
            const stillExists = this.candidaturesList.find(
              (c) => c.id === this.selectedCandidature?.id,
            );
            if (!stillExists) {
              this.selectedCandidature = null;
              this.ocrDiagnostic = null;
            }
          }

          if (this.candidaturesList.length === 0) {
            this.errorMessage = "Aucun dossier en attente d'analyse OCR pour le moment.";
          }
        },
        error: (err) => {
          this.isLoading = false;
          if (err?.status === 401) {
            this.requiresLogin = true;
            this.errorMessage =
              'Session expirée ou invalide (401). Reconnectez-vous puis rechargez la page.';
          } else if (err?.status === 403) {
            this.errorMessage =
              'Acces refuse (403). Verifiez votre session et reconnectez-vous en compte commission.';
          } else {
            this.errorMessage = 'Erreur lors du chargement des dossiers: ' + err.message;
          }
          console.error('Erreur API:', err);
        },
      });
  }

  /**
   * Sélectionne une candidature et réinitialise le diagnostic
   * @param candidature Candidature à analyser
   */
  selectCandidature(candidature: Candidature): void {
    this.selectedCandidature = candidature;
    this.ocrDiagnostic = null;
    this.errorMessage = '';
    this.successMessage = '';
    this.initFormulaireSynthese();
  }

  /**
   * Initialise le formulaire de synthèse avec les données de la candidature
   * @description Prépare les données de test pour l'analyse OCR
   */
  initFormulaireSynthese(): void {
    this.formulaireSimulation = {
      cin: this.selectedCandidature?.id.toString() || '',
      moyenne_generale: '',
      documents: ['releve_notes', 'diplome'],
      declared_lines: [],
      extracted_lines: [],
    };
  }

  /**
   * Lance l'analyse OCR pour la candidature sélectionnée
   * @description Appelle /api/candidatures/ocr/test/ avec le diagnostic
   */
  lancerAnalyseOCR(): void {
    if (!this.selectedCandidature) {
      this.errorMessage = 'Veuillez sélectionner une candidature.';
      return;
    }

    this.isAnalyzing = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      candidature_id: this.selectedCandidature.id,
      formulaire: this.formulaireSimulation,
    };

    this.http
      .post<{
        success: boolean;
        ocr_diagnostic: OCRDiagnostic;
      }>(`${this.apiBaseUrl}/ocr/test/`, payload, this.buildAuthOptions())
      .subscribe({
        next: (response) => {
          this.isAnalyzing = false;
          if (response.ocr_diagnostic) {
            this.ocrDiagnostic = response.ocr_diagnostic;
            this.analyzedCount += 1;
            this.successMessage =
              'Analyse OCR complétée: ' +
              (response.ocr_diagnostic.decision === 'auto_valide'
                ? 'Dossier AUTO-VALIDÉ ✅'
                : 'Révision manuelle requise ⚠️');
          }
        },
        error: (err) => {
          this.isAnalyzing = false;
          if (err?.status === 401) {
            this.requiresLogin = true;
            this.errorMessage =
              "Session expirée pendant l'analyse OCR. Reconnectez-vous puis relancez.";
          } else {
            this.errorMessage = "Erreur lors de l'analyse OCR: " + err.message;
          }
          console.error('Erreur analyse OCR:', err);
        },
      });
  }

  /**
   * Retourne le style CSS pour afficher la confiance OCR
   * @param confiance Score de confiance (0-100)
   * @returns Classe CSS appropriée (good, warning, danger)
   */
  getConfianceClass(confiance: number): string {
    if (confiance >= 80) {
      return 'confiance-good';
    } else if (confiance >= 50) {
      return 'confiance-warning';
    } else {
      return 'confiance-danger';
    }
  }

  /**
   * Formate le type d'anomalie en texte lisible
   * @param type Type d'anomalie détecté par OCR
   * @returns Description lisible du type
   */
  formatAnomalyType(type: string): string {
    const typeMap: Record<string, string> = {
      cin_mismatch: '❌ Incoherence CIN',
      moyenne_mismatch: '❌ Incoherence moyenne',
      moyenne_format: '⚠️ Format moyenne incorrect',
      documents_manquants: '❌ Documents manquants',
      line_mismatch: '⚠️ Divergence ligne',
    };
    return typeMap[type] || type;
  }

  /**
   * Valide le diagnostic et met à jour le statut de la candidature
   * @description Marque comme validée pour l'étape suivante (admission)
   */
  validerDossier(): void {
    if (!this.selectedCandidature || !this.ocrDiagnostic?.validation_auto) {
      this.errorMessage = 'Impossible de valider: anomalies détectées.';
      return;
    }

    // Appelle un endpoint pour mettre à jour le statut
    this.http
      .patch(
        `${this.apiBaseUrl}/${this.selectedCandidature.id}/changer-statut/`,
        {
          nouveau_statut: 'en_attente',
        },
        this.buildAuthOptions(),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Dossier marqué comme validé!';
          setTimeout(() => this.loadCandidatures(), 1500);
        },
        error: (err) => {
          if (err?.status === 401) {
            this.requiresLogin = true;
            this.errorMessage =
              'Session expirée pendant la validation. Reconnectez-vous puis réessayez.';
          } else {
            this.errorMessage = 'Erreur validation dossier: ' + err.message;
          }
        },
      });
  }

  /**
   * Demande une révision manuelle du dossier
   * @description Change le statut pour demander examen commission
   */
  demanderRevisionManuelle(): void {
    if (!this.selectedCandidature) {
      this.errorMessage = 'Veuillez sélectionner une candidature.';
      return;
    }

    this.http
      .patch(
        `${this.apiBaseUrl}/${this.selectedCandidature.id}/changer-statut/`,
        {
          nouveau_statut: 'rejete',
        },
        this.buildAuthOptions(),
      )
      .subscribe({
        next: () => {
          this.successMessage = 'Dossier marqué pour examen commission!';
          setTimeout(() => this.loadCandidatures(), 1500);
        },
        error: (err) => {
          if (err?.status === 401) {
            this.requiresLogin = true;
            this.errorMessage =
              'Session expirée pendant la révision. Reconnectez-vous puis réessayez.';
          } else {
            this.errorMessage = 'Erreur revision dossier: ' + err.message;
          }
        },
      });
  }

  /**
   * Ajoute une ligne de données déclarée pour comparaison
   */
  ajouterLigneDeclaree(): void {
    this.formulaireSimulation.declared_lines.push('');
  }

  /**
   * Ajoute une ligne de données extraites pour comparaison
   */
  ajouterLigneExtractee(): void {
    this.formulaireSimulation.extracted_lines.push('');
  }

  /**
   * Supprime une ligne déclarée
   * @param index Index de la ligne à supprimer
   */
  supprimerLigneDeclaree(index: number): void {
    this.formulaireSimulation.declared_lines.splice(index, 1);
  }

  /**
   * Supprime une ligne extraite
   * @param index Index de la ligne à supprimer
   */
  supprimerLigneExtractee(index: number): void {
    this.formulaireSimulation.extracted_lines.splice(index, 1);
  }

  preloadConsistentData(): void {
    const safeCin = this.formulaireSimulation.cin || '12345678';
    this.formulaireSimulation = {
      cin: safeCin,
      moyenne_generale: '15.20',
      documents: ['releve_notes', 'diplome'],
      declared_lines: ['Algo: 15', 'BD: 14', 'Moyenne S5: 15.2'],
      extracted_lines: ['Algo: 15', 'BD: 14', 'Moyenne S5: 15.2'],
    };
  }

  preloadAnomalyData(): void {
    const safeCin = this.formulaireSimulation.cin || '12345678';
    this.formulaireSimulation = {
      cin: safeCin,
      moyenne_generale: '11.00',
      documents: ['diplome'],
      declared_lines: ['Algo: 15', 'BD: 14', 'Moyenne S5: 15.2'],
      extracted_lines: ['Algo: 10', 'BD: 8', 'Moyenne S5: 11.0'],
    };
  }

  resetSimulation(): void {
    this.initFormulaireSynthese();
  }
}
