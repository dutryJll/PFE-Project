import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { CandidatureService } from '../../../services/candidature.service';
import { SpecialitesService } from '../../../services/specialites.service';

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

  // Responsable modal state
  showResponsableModal = false;
  modalCandidature: any = null;
  avisStatsLoading = false;
  avisStats: any = null;
  avisList: any[] = [];
  modalDecision: 'en_attente' | 'valide' | 'rejete' = 'en_attente';

  // Carousel state
  showCarousel = false;
  carIdx = 0;
  carList: any[] = [];

  // Filter state
  filtered: any[] = [];
  nameFilter = '';
  top100Only = false;
  scoreMinFilter = 0;
  scoreMaxFilter = 20;
  statusFilter = 'tous';
  globalAvisLoading = false;
  globalAvisSummary: any = null;
  globalAvisResponses: any[] = [];
  finalDecisionApplying = false;
  // spécialités
  availableSpecialites: string[] = [];
  selectedSpecialite: string = '';

  constructor(
    private candidatureService: CandidatureService,
    private specialitesService: SpecialitesService,
  ) {}

  ngOnInit(): void {
    this.loadPreselectionCandidates();
    this.loadCommissionGlobalAvisSummary();
    this.specialitesService.getSpecialitesData().subscribe(() => {
      this.availableSpecialites = this.specialitesService.getAllSpecialties();
    });
  }

  loadPreselectionCandidates(): void {
    this.candidatureService.getCandidaturesCommissionClassees().subscribe({
      next: (res: any) => {
        this.candidatures = res || [];
        this.applyFilter();
      },
      error: () => {
        this.candidatures = [];
      },
    });
  }

  private getActiveCommissionId(): number | null {
    const raw = localStorage.getItem('active_commission_id');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  loadCommissionGlobalAvisSummary(): void {
    const commissionId = this.getActiveCommissionId();
    if (!commissionId) {
      this.globalAvisSummary = null;
      this.globalAvisResponses = [];
      return;
    }

    this.globalAvisLoading = true;
    this.candidatureService.getCommissionGlobalAvisSummary(commissionId).subscribe({
      next: (res: any) => {
        this.globalAvisSummary = res?.summary || null;
        this.globalAvisResponses = Array.isArray(res?.responses) ? res.responses : [];
        this.globalAvisLoading = false;
      },
      error: () => {
        this.globalAvisSummary = null;
        this.globalAvisResponses = [];
        this.globalAvisLoading = false;
      },
    });
  }

  canShowDecisionFinalButton(): boolean {
    return !!this.globalAvisSummary?.can_decide_final;
  }

  applyFinalDecisionTop100(): void {
    if (!this.canShowDecisionFinalButton()) {
      alert('La décision finale est disponible après tous les avis ou expiration du délai.');
      return;
    }
    if (!this.candidatures.length) {
      alert('Aucune candidature à traiter.');
      return;
    }

    const majority = this.globalAvisSummary?.majority_recommendation;
    const finalDecision: 'valide' | 'rejete' = majority === 'defavorable' ? 'rejete' : 'valide';
    const topCandidates = [...this.candidatures]
      .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
      .slice(0, 100);

    if (!topCandidates.length) {
      alert('Aucun candidat à traiter dans le Top 100.');
      return;
    }

    const confirmMsg = `Appliquer la décision finale '${finalDecision}' au Top ${topCandidates.length} selon l'avis collégial ?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    this.finalDecisionApplying = true;
    const requests = topCandidates.map((c) =>
      this.candidatureService.setDecisionResponsable(c.id, finalDecision),
    );

    forkJoin(requests).subscribe({
      next: () => {
        this.finalDecisionApplying = false;
        this.showToast(
          `Décision finale appliquée sur ${topCandidates.length} candidats.`,
          't-success',
        );
        this.loadPreselectionCandidates();
      },
      error: (error) => {
        this.finalDecisionApplying = false;
        const message =
          error?.error?.error || "Erreur lors de l'application de la décision finale.";
        alert(message);
      },
    });
  }

  // ═══════════════════════════════════════
  // Statistics Helpers
  // ═══════════════════════════════════════

  getInternalCount(): number {
    return this.candidatures.filter((c) => c.candidat_interne === true).length;
  }

  getAverageScore(): number {
    if (this.candidatures.length === 0) return 0;
    const sum = this.candidatures.reduce((acc, c) => acc + (c.score || 0), 0);
    return sum / this.candidatures.length;
  }

  getPreselectedCount(): number {
    return this.candidatures.filter(
      (c) => c.decision_preselection === 'preselectionne' || c.decision_preselection === 'valide',
    ).length;
  }

  // ═══════════════════════════════════════
  // Selection Helpers
  // ═══════════════════════════════════════

  toggleRow(id: number, event: any): void {
    event.stopPropagation();
    const i = this.selectedIds.indexOf(id);
    if (i >= 0) {
      this.selectedIds.splice(i, 1);
    } else {
      this.selectedIds.push(id);
    }
  }

  toggleAll(event: any): void {
    const allIds = this.candidatures.map((c) => c.id);
    if (event.target.checked) {
      this.selectedIds = [...new Set([...this.selectedIds, ...allIds])];
    } else {
      this.selectedIds = [];
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  // ═══════════════════════════════════════
  // Filter Helpers
  // ═══════════════════════════════════════

  filterByName(event: any): void {
    this.nameFilter = event.target.value.toLowerCase();
    this.applyFilter();
  }

  applyFilter(): void {
    this.filtered = this.candidatures.filter((c) => {
      const matchName =
        !this.nameFilter ||
        (c.nom_complet || c.candidat_nom || '').toLowerCase().includes(this.nameFilter);
      const matchScore =
        (c.score || 0) >= this.scoreMinFilter && (c.score || 0) <= this.scoreMaxFilter;
      const matchStatus =
        this.statusFilter === 'tous' ||
        (this.statusFilter === 'preselectionne' &&
          (c.decision_preselection === 'preselectionne' || c.decision_preselection === 'valide')) ||
        (this.statusFilter === 'exam' && c.decision_preselection === 'sous_examen');
      const matchTop100 = !this.top100Only || (c.rang && c.rang <= 100);
      const matchSpecialite =
        !this.selectedSpecialite ||
        (c.specialite || c.master_nom || '') === this.selectedSpecialite;

      return matchName && matchScore && matchStatus && matchTop100 && matchSpecialite;
    });
  }

  resetAll(): void {
    this.nameFilter = '';
    this.scoreMinFilter = 0;
    this.scoreMaxFilter = 20;
    this.statusFilter = 'tous';
    this.top100Only = false;
    this.selectedIds = [];
    this.applyFilter();
  }

  toggleTop100(): void {
    this.top100Only = !this.top100Only;
    this.applyFilter();
  }

  // ═══════════════════════════════════════
  // Scoring Display Helpers
  // ═══════════════════════════════════════

  getScoreClass(score: number): string {
    if (score >= 16) return 'sf-g'; // Green
    if (score >= 12) return 'sf-a'; // Amber
    return 'sf-r'; // Red
  }

  getScorePct(score: number): number {
    // Normalize score to 0-100 (assuming max score is 20)
    return Math.max(0, Math.min(100, (score / 20) * 100));
  }

  getBadgeClass(status: string): string {
    if (status === 'preselectionne' || status === 'valide') return 'b-admis';
    if (status === 'sous_examen') return 'b-exam';
    return 'b-nonlu';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      preselectionne: 'Présélectionné',
      valide: 'Admis',
      sous_examen: 'Sous examen',
      rejete: 'Rejeté',
    };
    return labels[status] || status;
  }

  // ═══════════════════════════════════════
  // Export Functions
  // ═══════════════════════════════════════

  telechargerZIP(): void {
    if (this.selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un candidat');
      return;
    }
    // TODO: Implement ZIP download (would need backend support)
    alert(`ZIP download pour ${this.selectedIds.length} candidat(s) - À implémenter`);
    this.closeExp(null);
  }

  exportExcel(): void {
    if (this.selectedIds.length === 0) {
      alert('Veuillez sélectionner au least un candidat');
      return;
    }
    // TODO: Implement Excel export (would need backend support)
    alert(`Export Excel pour ${this.selectedIds.length} candidat(s) - À implémenter`);
    this.closeExp(null);
  }

  toggleExp(event: any): void {
    if (event) event.stopPropagation();
    const menu = document.getElementById('exp-menu');
    if (menu) {
      menu.classList.toggle('open');
    }
  }

  closeExp(event: any): void {
    if (event) {
      event.stopPropagation();
    }
    const menu = document.getElementById('exp-menu');
    if (menu) {
      menu.classList.remove('open');
    }
  }

  showToast(msg: string, cls: string = 't-success'): void {
    const toast = document.getElementById('toast');
    const txt = document.getElementById('toast-txt');
    if (toast && txt) {
      txt.textContent = msg;
      toast.className = `toast show ${cls}`;
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3000);
    }
  }

  // ═══════════════════════════════════════
  // Carousel Functions
  // ═══════════════════════════════════════

  openCarousel(): void {
    if (this.selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un candidat');
      return;
    }
    this.carList = this.selectedIds
      .map((id) => this.candidatures.find((c) => c.id === id))
      .filter((c) => c);
    this.carIdx = 0;
    this.showCarousel = true;
    this.refreshCarNav();
  }

  closeCarousel(): void {
    this.showCarousel = false;
    this.carIdx = 0;
    this.carList = [];
  }

  carPrev(): void {
    if (this.carIdx > 0) {
      this.carIdx--;
      this.refreshCarNav();
    }
  }

  carNext(): void {
    if (this.carIdx < this.carList.length - 1) {
      this.carIdx++;
      this.refreshCarNav();
    }
  }

  setCarIdx(idx: number): void {
    if (idx >= 0 && idx < this.carList.length) {
      this.carIdx = idx;
      this.refreshCarNav();
    }
  }

  refreshCarNav(): void {
    const posElem = document.getElementById('car-pos');
    if (posElem) {
      posElem.textContent = `Position ${this.carIdx + 1} / ${this.carList.length}`;
    }
    this.renderCarContent();
  }

  renderCarContent(): void {
    // This method updates the carousel content based on current index
    // The HTML binding will automatically update via Angular change detection
    const carMain = document.querySelector('.car-main');
    if (carMain && this.carList[this.carIdx]) {
      const c = this.carList[this.carIdx];
      // Content will be rendered via Angular binding in the template
    }
  }

  // ═══════════════════════════════════════
  // Misc Functions
  // ═══════════════════════════════════════

  marquerLus(): void {
    if (this.selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un candidat');
      return;
    }
    // Mark selected candidates as "lu" (read)
    // This would require a backend endpoint
    alert(`Marquer ${this.selectedIds.length} candidat(s) comme lus - À implémenter`);
  }

  // ═══════════════════════════════════════
  // Original Methods (Existing)
  // ═══════════════════════════════════════

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
    this.candidatureService
      .bulkUpdateCandidatureStatus(this.selectedIds, 'preselectionne', reason)
      .subscribe({
        next: (response) => {
          console.log('✅ Validation réussie:', response);
          alert(`✅ ${response.updated_count} candidat(s) présélectionné(s) avec succès`);
          this.selectedIds = [];
          this.loadPreselectionCandidates();
        },
        error: (error) => {
          console.error('❌ Erreur validation:', error);
          const message =
            error?.error?.error || error?.error?.message || 'Erreur lors de la validation';
          alert(`❌ Erreur: ${message}`);
        },
      });
  }

  fullAutoValidate(): void {
    if (this.candidatures.length === 0) {
      alert('Aucun candidat à valider');
      return;
    }

    const allIds = this.candidatures.map((c) => c.id);
    const confirmMsg = `Êtes-vous sûr de vouloir marquer ${allIds.length} candidat(s) comme présélectionné(s) automatiquement avec un seuil de ${this.validationScoreThreshold}/20 ?`;
    if (!confirm(confirmMsg)) {
      return;
    }

    const reason = `Présélectionné automatiquement avec seuil de ${this.validationScoreThreshold}`;
    this.candidatureService
      .bulkUpdateCandidatureStatus(allIds, 'preselectionne', reason)
      .subscribe({
        next: (response) => {
          console.log('✅ Validation auto réussie:', response);
          alert(`✅ ${response.updated_count} candidat(s) présélectionné(s) automatiquement`);
          this.selectedIds = [];
          this.loadPreselectionCandidates();
        },
        error: (error) => {
          console.error('❌ Erreur validation auto:', error);
          const message =
            error?.error?.error ||
            error?.error?.message ||
            'Erreur lors de la validation automatique';
          alert(`❌ Erreur: ${message}`);
        },
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

    this.candidatureService
      .bulkUpdateCandidatureStatus([c.id], 'preselectionne', 'Présélectionné manuellement')
      .subscribe({
        next: (response) => {
          console.log('✅ Validation rapide réussie:', response);
          alert(`✅ Candidat présélectionné avec succès`);
          this.loadPreselectionCandidates();
        },
        error: (error) => {
          console.error('❌ Erreur validation rapide:', error);
          const message =
            error?.error?.error || error?.error?.message || 'Erreur lors de la validation';
          alert(`❌ Erreur: ${message}`);
        },
      });
  }

  openAvisModal(candidature: any): void {
    this.modalCandidature = candidature;
    this.modalDecision = candidature.decision_finale_responsable || 'en_attente';
    this.showResponsableModal = true;
    this.loadAvisStats(candidature.id);
  }

  closeResponsableModal(): void {
    this.showResponsableModal = false;
    this.modalCandidature = null;
    this.avisStats = null;
    this.avisList = [];
  }

  loadAvisStats(candidatureId: number): void {
    this.avisStatsLoading = true;
    this.candidatureService.getAvisStats(candidatureId).subscribe({
      next: (res: any) => {
        this.avisStats = res || {};
        this.avisList = res?.avis || [];
        this.avisStatsLoading = false;
      },
      error: () => {
        this.avisStatsLoading = false;
        this.avisStats = { total: 0, favorables: 0, defavorables: 0, pourcentage_favorable: 0 };
        this.avisList = [];
      },
    });
  }

  saveDecision(): void {
    if (!this.modalCandidature) return;
    this.candidatureService
      .setDecisionResponsable(this.modalCandidature.id, this.modalDecision)
      .subscribe({
        next: () => {
          alert('Décision enregistrée');
          this.loadPreselectionCandidates();
        },
        error: (err) => {
          alert('Erreur enregistrement décision: ' + (err?.error?.error || ''));
        },
      });
  }

  sendReminder(): void {
    if (!this.modalCandidature) return;
    const activeCommission = localStorage.getItem('active_commission_id');
    const commissionId = activeCommission ? Number(activeCommission) : null;
    if (!commissionId) {
      alert('Aucune commission active sélectionnée');
      return;
    }
    if (!confirm('Envoyer un rappel aux membres de la commission ?')) return;
    this.candidatureService
      .sendAppelAvis(commissionId, `Demande d'avis pour le parcours actif.`)
      .subscribe({
        next: (res) => {
          alert(`Rappel envoyé (${res.sent} envoyés, ${res.failed} échoués)`);
          this.loadCommissionGlobalAvisSummary();
        },
        error: (err) => alert('Erreur envoi rappel: ' + (err?.error?.error || '')),
      });
  }
}
