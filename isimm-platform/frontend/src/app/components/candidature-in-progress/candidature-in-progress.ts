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
  attestations: string[] = [''];
  parcoursDescription = '';
  releves: ReleveRow[] = [{ semestre: 'S1', module: '', note: '' }];
  confirmation = false;

  isSubmitting = false;

  steps = [
    { no: 1, label: 'Informations personnelles' },
    { no: 2, label: 'Diplômes' },
    { no: 3, label: 'Attestations' },
    { no: 4, label: 'Mon parcours' },
    { no: 5, label: 'Relevés de notes (tableau)' },
    { no: 6, label: 'Revue & Soumission' },
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
      return this.diplomes.some(
        (d) => !!d.intitule.trim() && !!d.etablissement.trim() && !!d.annee.trim(),
      );
    }

    if (this.currentStep === 3) {
      return this.attestations.some((a) => !!a.trim());
    }

    if (this.currentStep === 4) {
      return !!this.parcoursDescription.trim();
    }

    if (this.currentStep === 5) {
      return this.releves.some((r) => !!r.module.trim() && !!r.note.trim());
    }

    if (this.currentStep === 6) {
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

  addAttestationRow(): void {
    this.attestations.push('');
  }

  removeAttestationRow(index: number): void {
    if (this.attestations.length > 1) {
      this.attestations.splice(index, 1);
    }
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
