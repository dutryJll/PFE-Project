import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidatureService } from '../../../services/candidature.service';

@Component({
  selector: 'app-preselection-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preselection-dashboard.component.html',
  styleUrls: ['./preselection-dashboard.component.css'],
})
export class PreselectionDashboardComponent implements OnInit {
  candidatures: any[] = [];
  selectedIds: number[] = [];
  validationScoreThreshold = 10;

  constructor(private candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.loadPreselectionCandidates();
  }

  loadPreselectionCandidates(): void {
    this.candidatureService.getCandidaturesCommissionClassees().subscribe({
      next: (res: any) => (this.candidatures = res || []),
      error: () => (this.candidatures = []),
    });
  }

  toggleSelect(id: number): void {
    const i = this.selectedIds.indexOf(id);
    if (i >= 0) this.selectedIds.splice(i, 1);
    else this.selectedIds.push(id);
  }

  validateSelection(): void {
    if (this.selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un candidat');
      return;
    }

    const confirmMsg = `Êtes-vous sûr de vouloir marquer ${this.selectedIds.length} candidat(s) comme présélectionné(s) avec un seuil de ${this.validationScoreThreshold}/20 ?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    const reason = `Présélectionné avec seuil de ${this.validationScoreThreshold}`;
    this.candidatureService.bulkUpdateCandidatureStatus(
      this.selectedIds,
      'preselectionne',
      reason
    ).subscribe({
      next: (response) => {
        console.log('✅ Validation réussie:', response);
        alert(`✅ ${response.updated_count} candidat(s) présélectionné(s) avec succès`);
        this.selectedIds = [];
        this.loadPreselectionCandidates();
      },
      error: (error) => {
        console.error('❌ Erreur validation:', error);
        const message = error?.error?.error || error?.error?.message || 'Erreur lors de la validation';
        alert(`❌ Erreur: ${message}`);
      }
    });
  }

  fullAutoValidate(): void {
    if (this.candidatures.length === 0) {
      alert('Aucun candidat à valider');
      return;
    }

    const allIds = this.candidatures.map(c => c.id);
    const confirmMsg = `Êtes-vous sûr de vouloir marquer ${allIds.length} candidat(s) comme présélectionné(s) automatiquement avec un seuil de ${this.validationScoreThreshold}/20 ?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    const reason = `Présélectionné automatiquement avec seuil de ${this.validationScoreThreshold}`;
    this.candidatureService.bulkUpdateCandidatureStatus(
      allIds,
      'preselectionne',
      reason
    ).subscribe({
      next: (response) => {
        console.log('✅ Validation auto réussie:', response);
        alert(`✅ ${response.updated_count} candidat(s) présélectionné(s) automatiquement`);
        this.selectedIds = [];
        this.loadPreselectionCandidates();
      },
      error: (error) => {
        console.error('❌ Erreur validation auto:', error);
        const message = error?.error?.error || error?.error?.message || 'Erreur lors de la validation automatique';
        alert(`❌ Erreur: ${message}`);
      }
    });
  }

  quickValidate(c: any): void {
    if (!c || !c.id) {
      alert('Candidat invalide');
      return;
    }

    const confirmMsg = `Êtes-vous sûr de vouloir marquer ${c.nom_complet || c.candidat_nom} comme présélectionné ?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.candidatureService.bulkUpdateCandidatureStatus(
      [c.id],
      'preselectionne',
      'Présélectionné manuellement'
    ).subscribe({
      next: (response) => {
        console.log('✅ Validation rapide réussie:', response);
        alert(`✅ Candidat présélectionné avec succès`);
        this.loadPreselectionCandidates();
      },
      error: (error) => {
        console.error('❌ Erreur validation rapide:', error);
        const message = error?.error?.error || error?.error?.message || 'Erreur lors de la validation';
        alert(`❌ Erreur: ${message}`);
      }
    });
  }
}
