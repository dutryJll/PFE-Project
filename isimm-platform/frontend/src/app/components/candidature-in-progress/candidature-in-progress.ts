import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface DiplomeRow {
  intitule: string;
  etablissement: string;
  annee: string;
}

interface ReleveRow {
  semestre: string;
  module: string;
  note: string;
}

interface RequiredDocumentField {
  key: string;
  label: string;
  hint: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
}

@Component({
  selector: 'app-candidature-in-progress',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './candidature-in-progress.html',
  styleUrl: './candidature-in-progress.css',
})
export class CandidatureInProgressComponent implements OnInit {
  currentStep = 1;
  maxUnlockedStep = 1;

  typeCandidature: 'master' | 'ingenieur' = 'master';
  offreId: number | null = null;
  candidatureId: number | null = null;
  titreOffre = '';

  personal = {
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    cin: '',
  };

  diplomes: DiplomeRow[] = [{ intitule: '', etablissement: '', annee: '' }];
  parcoursDescription = '';
  releves: ReleveRow[] = [{ semestre: 'S1', module: '', note: '' }];
  confirmation = false;

  isSubmitting = false;

  requiredDocumentFields: RequiredDocumentField[] = [
    {
      key: 'demande_candidature',
      label: 'Demande de candidature',
      hint: 'Formulaire joint au communique',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
    {
      key: 'fiche_candidature_signee',
      label: 'Fiche de candidature signee',
      hint: 'Fiche imprimee depuis le site',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
    {
      key: 'cv',
      label: 'CV (1 page)',
      hint: 'Adresse, telephone, email',
      accept: '.pdf,.doc,.docx',
      required: true,
    },
    {
      key: 'cin',
      label: 'Copie CIN',
      hint: 'Carte identite nationale',
      accept: '.pdf,.jpg,.jpeg,.png',
      required: true,
    },
    {
      key: 'diplomes',
      label: 'Copies diplomes (bac inclus)',
      hint: 'Vous pouvez importer plusieurs fichiers',
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: true,
      required: true,
    },
    {
      key: 'releves_notes',
      label: 'Copies releves de notes (bac inclus)',
      hint: 'Un ou plusieurs fichiers',
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: true,
      required: true,
    },
    {
      key: 'justificatifs_report',
      label: 'Justificatifs report/reorientation',
      hint: 'Facultatif, selon votre situation',
      accept: '.pdf,.jpg,.jpeg,.png',
      multiple: true,
      required: false,
    },
  ];

  uploadedRequiredDocuments: Record<string, File[]> = {};

  steps = [
    { no: 1, label: 'Informations personnelles' },
    { no: 2, label: 'Diplômes et documents requis' },
    { no: 3, label: 'Mon parcours' },
    { no: 4, label: 'Relevés de notes (tableau)' },
    { no: 5, label: 'Revue & Soumission' },
  ];

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser() || {};

    this.personal = {
      prenom: user.first_name || '',
      nom: user.last_name || '',
      email: user.email || '',
      telephone: user.phone || '',
      cin: user.cin || '',
    };

    this.route.queryParamMap.subscribe((params) => {
      const type = params.get('type');
      const offerId = params.get('offerId');
      const candidatureId = params.get('candidatureId');
      const title = params.get('title');

      if (type === 'ingenieur' || type === 'master') {
        this.typeCandidature = type;
      }

      this.offreId = offerId ? Number(offerId) : null;
      this.candidatureId = candidatureId ? Number(candidatureId) : null;
      this.titreOffre = title || '';

      if (this.isStep1AutoValid()) {
        this.maxUnlockedStep = Math.max(this.maxUnlockedStep, 2);
      }
    });
  }

  isStepAccessible(step: number): boolean {
    return step >= 1 && step <= this.maxUnlockedStep;
  }

  goToStep(step: number): void {
    if (this.isStepAccessible(step)) {
      this.currentStep = step;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep -= 1;
    }
  }

  nextStep(): void {
    if (!this.isCurrentStepValid()) {
      alert('❌ Veuillez compléter les informations requises avant de continuer.');
      return;
    }

    if (this.currentStep < this.steps.length) {
      this.currentStep += 1;
      this.maxUnlockedStep = Math.max(this.maxUnlockedStep, this.currentStep);
    }
  }

  private isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      return this.isStep1AutoValid();
    }

    if (this.currentStep === 2) {
      const diplomeOk = this.diplomes.some(
        (d) => !!d.intitule.trim() && !!d.etablissement.trim() && !!d.annee.trim(),
      );
      return diplomeOk && this.hasAllRequiredDocumentsUploaded();
    }

    if (this.currentStep === 3) {
      return !!this.parcoursDescription.trim();
    }

    if (this.currentStep === 4) {
      return this.releves.some((r) => !!r.module.trim() && !!r.note.trim());
    }

    if (this.currentStep === 5) {
      return this.confirmation;
    }

    return true;
  }

  private isStep1AutoValid(): boolean {
    return (
      !!this.personal.prenom.trim() && !!this.personal.nom.trim() && !!this.personal.email.trim()
    );
  }

  addDiplomeRow(): void {
    this.diplomes.push({ intitule: '', etablissement: '', annee: '' });
  }

  removeDiplomeRow(index: number): void {
    if (this.diplomes.length > 1) {
      this.diplomes.splice(index, 1);
    }
  }

  onRequiredDocumentChange(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    this.uploadedRequiredDocuments[key] = files;
  }

  getUploadedDocumentNames(key: string): string {
    const files = this.uploadedRequiredDocuments[key] || [];
    if (!files.length) {
      return 'Aucun fichier importé';
    }
    return files.map((f) => f.name).join(', ');
  }

  hasAllRequiredDocumentsUploaded(): boolean {
    const requiredKeys = this.requiredDocumentFields.filter((d) => d.required).map((d) => d.key);

    return requiredKeys.every((key) => (this.uploadedRequiredDocuments[key] || []).length > 0);
  }

  addReleveRow(): void {
    this.releves.push({ semestre: `S${this.releves.length + 1}`, module: '', note: '' });
  }

  removeReleveRow(index: number): void {
    if (this.releves.length > 1) {
      this.releves.splice(index, 1);
    }
  }

  submitFinalCandidature(): void {
    if (!this.isCurrentStepValid()) {
      alert('❌ Veuillez confirmer la revue avant de soumettre.');
      return;
    }

    if (!this.offreId) {
      alert('✅ Formulaire complété (mode démonstration).');
      this.router.navigate(['/candidat/dashboard'], { queryParams: { view: 'candidatures' } });
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      alert('❌ Session expirée. Veuillez vous reconnecter.');
      return;
    }

    this.isSubmitting = true;

    this.http
      .post(
        'http://localhost:8003/api/candidatures/create/',
        { master_id: this.offreId },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ Candidature soumise avec succès.');
          this.isSubmitting = false;
          this.router.navigate(['/candidat/dashboard'], { queryParams: { view: 'candidatures' } });
        },
        error: (error) => {
          console.error('Erreur soumission candidature:', error);
          this.isSubmitting = false;
          alert('❌ Erreur lors de la soumission finale.');
        },
      });
  }
}
