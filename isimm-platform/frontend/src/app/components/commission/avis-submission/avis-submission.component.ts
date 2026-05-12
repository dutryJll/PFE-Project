import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CandidatureService } from '../../../services/candidature.service';

interface AvisHistoryItem {
  id: number;
  membre_name?: string;
  member_name?: string;
  commission_name?: string;
  avis: boolean;
  avis_type?: 'favorable' | 'defavorable';
  argument?: string;
  date?: string;
  date_avis?: string;
}

@Component({
  selector: 'app-avis-submission',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './avis-submission.component.html',
  styleUrls: ['./avis-submission.component.css'],
})
export class AvisSubmissionComponent implements OnInit {
  @Input() candidatureId: number | null = null;

  avisForm: FormGroup;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  avisStatistics: any = null;
  avisHistory: AvisHistoryItem[] = [];
  loadingStats = false;

  constructor(
    private candidatureService: CandidatureService,
    private formBuilder: FormBuilder,
  ) {
    this.avisForm = this.formBuilder.group({
      avis: [null, Validators.required],
      argument: ['', [Validators.required, Validators.minLength(10)]],
      commission_id: [null],
    });
  }

  ngOnInit(): void {
    if (this.candidatureId) {
      this.loadAvisStatistics();
    }
  }

  loadAvisStatistics(): void {
    if (!this.candidatureId) return;

    this.loadingStats = true;
    this.candidatureService.getAvisStatistiques(this.candidatureId).subscribe({
      next: (res: any) => {
        this.avisStatistics = res;
        this.avisHistory = (res.avis || []).map((item: any) => this.normalizeAvis(item));
        this.loadingStats = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des statistiques', err);
        this.loadingStats = false;
      },
    });
  }

  submitAvis(): void {
    if (!this.avisForm.valid || !this.candidatureId) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    const avisValue = this.avisForm.get('avis')?.value;
    if (avisValue === false && !this.avisForm.get('argument')?.value.trim()) {
      this.errorMessage = 'Un argument est requis pour un avis défavorable';
      return;
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      avis: avisValue,
      argument: this.avisForm.get('argument')?.value || '',
      commission_id: this.avisForm.get('commission_id')?.value || null,
    };

    this.candidatureService.submitAvis(this.candidatureId, payload).subscribe({
      next: (res: any) => {
        this.successMessage = res?.message || 'Avis soumis avec succès';
        this.avisForm.reset();
        this.loadAvisStatistics();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Erreur lors de la soumission';
        this.submitting = false;
      },
    });
  }

  deleteAvis(avisId: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      this.submitting = true;
      this.candidatureService.deleteAvis(this.candidatureId || 0, avisId).subscribe({
        next: () => {
          this.successMessage = 'Avis supprimé avec succès';
          this.loadAvisStatistics();
          this.submitting = false;
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression';
          this.submitting = false;
        },
      });
    }
  }

  updateAvis(avisId: number): void {
    if (!this.avisForm.valid) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    this.submitting = true;
    const payload = {
      avis: this.avisForm.get('avis')?.value,
      argument: this.avisForm.get('argument')?.value || '',
    };

    this.candidatureService.updateAvis(this.candidatureId || 0, avisId, payload).subscribe({
      next: () => {
        this.successMessage = 'Avis modifié avec succès';
        this.avisForm.reset();
        this.loadAvisStatistics();
        this.submitting = false;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors de la modification';
        this.submitting = false;
      },
    });
  }

  resetForm(): void {
    this.avisForm.reset();
    this.errorMessage = '';
    this.successMessage = '';
  }

  private normalizeAvis(item: any): AvisHistoryItem {
    return {
      id: item.id,
      membre_name: item.membre_name || item.member_name,
      member_name: item.member_name || item.membre_name,
      commission_name: item.commission_name,
      avis: !!item.avis,
      avis_type: item.avis_type,
      argument: item.argument,
      date: item.date || item.date_avis,
      date_avis: item.date_avis || item.date,
    };
  }
}
