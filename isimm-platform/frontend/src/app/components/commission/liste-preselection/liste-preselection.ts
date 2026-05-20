import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ToastService } from '../../../services/toast.service';
import { AuthService } from '../../../services/auth.service';
import {
  CommissionContextService,
  CommissionContextOption,
} from '../../../services/commission-context.service';

interface Candidat {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  cin: string;
  type: 'master' | 'ingenieur';
  voeux?: string[];
  specialite?: string;
  score: number;
  statut: 'En attente' | 'Admis' | 'Refusé';
  monAvis?: 'favorable' | 'defavorable' | null;
  commentaire?: string;
}

interface CommissionOption {
  id: number;
  nom: string;
  description?: string;
  is_active?: boolean;
}

@Component({
  selector: 'app-liste-preselection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './liste-preselection.html',
  styleUrl: './liste-preselection.css',
})
export class ListePreselection implements OnInit {
  candidats: Candidat[] = [];
  candidatsFiltres: Candidat[] = [];
  commissions: CommissionOption[] = [];
  activeCommissionId: number | null = null;
  loading = false;

  filtreNom = '';
  filtreType: string = '';
  filtreAvis: string = '';
  selectedSpecialite: string = '';
  availableSpecialites: string[] = [];
  globalAvisStatut: 'favorable' | 'defavorable' = 'favorable';
  globalAvisCommentaire = '';
  showGlobalAvisModal = false;
  globalAvisSubmitting = false;
  globalAvisSummary: any = null;

  avisChanged: { [key: number]: 'favorable' | 'defavorable' | null } = {};
  avisCandidatSelectionne: Candidat | null = null;
  avisCandidatStatut: 'En attente' | 'Admis' | 'Refusé' = 'En attente';
  avisCandidatCommentaire = '';

  // User and role
  userRole: string | null = null;
  private activeCommissionCategory: CommissionContextOption['category'] | null = null;

  showCommentModal = false;
  candidatSelectionne: Candidat | null = null;
  commentaire = '';

  // Responsable selection state
  selectedIds: number[] = [];
  actionMenuOpenId: number | null = null;
  // Dossier modal state
  dossierModalOpen = false;
  dossierModalCandidate: Candidat | null = null;
  dossierModalData: { grades?: { label: string; value: number }[] } | null = null;
  bulkDossierIndex = -1; // For navigating through bulk dossier view

  constructor(
    private router: Router,
    private authService: AuthService,
    private toastService: ToastService,
    private commissionContext: CommissionContextService,
  ) {}

  ngOnInit(): void {
    const me = this.authService.getCurrentUser();
    this.userRole = me?.role || me?.type || null;
    this.loadCommissionsAndData();
    this.commissionContext.activeCommissionId$.subscribe((commissionId) => {
      this.activeCommissionCategory = this.getCommissionCategoryFromId(commissionId);
      this.appliquerFiltres();
    });
  }

  loadCommissionsAndData(): void {
    this.loadCandidats();
    this.globalAvisSummary = {
      favorables: this.candidats.filter((c) => c.statut === 'Admis').length,
      defavorables: this.candidats.filter((c) => c.statut === 'Refusé').length,
    };
  }

  getCommissionLabel(commission: CommissionOption): string {
    const details = (commission.description || '').trim();
    return details ? `${commission.nom} (${details})` : commission.nom;
  }

  loadCandidats(): void {
    this.loading = true;
    this.candidats = this.buildMockCandidats();
    this.availableSpecialites = Array.from(new Set(this.candidats.map((c) => c.specialite || '')))
      .filter(Boolean)
      .sort();
    this.appliquerFiltres();
    this.loading = false;
  }

  private buildMockCandidats(): Candidat[] {
    const base = [
      ['Amina', 'Ben Salah', 'TI', 18.6, 'Admis'],
      ['Yassine', 'Trabelsi', 'DSI', 17.9, 'Admis'],
      ['Meriem', 'Khaldi', 'GL', 16.8, 'Admis'],
      ['Omar', 'Jaziri', 'RS', 15.4, 'Admis'],
      ['Nour', 'Cherif', 'TI', 14.7, 'En attente'],
      ['Mahdi', 'Bouzid', 'DSI', 13.8, 'En attente'],
      ['Salma', 'Haddad', 'GL', 12.9, 'Refusé'],
      ['Anis', 'Gharbi', 'RS', 15.9, 'Admis'],
      ['Asma', 'Masmoudi', 'TI', 14.2, 'En attente'],
      ['Riadh', 'Hamdi', 'DSI', 11.6, 'Refusé'],
      ['Wiem', 'Sassi', 'GL', 17.1, 'Admis'],
      ['Hassen', 'Mnif', 'RS', 13.4, 'En attente'],
      ['Nesrine', 'Brahmi', 'TI', 16.2, 'Admis'],
      ['Sami', 'Ammar', 'DSI', 12.4, 'Refusé'],
      ['Imen', 'Ben Youssef', 'GL', 15.2, 'En attente'],
      ['Fares', 'Ouertani', 'RS', 18.1, 'Admis'],
      ['Rania', 'Sfar', 'TI', 14.9, 'En attente'],
      ['Mehdi', 'Zidi', 'DSI', 10.8, 'Refusé'],
      ['Ines', 'Karray', 'GL', 17.4, 'Admis'],
      ['Bassem', 'Mansouri', 'RS', 13.2, 'En attente'],
    ] as Array<[string, string, string, number, 'Admis' | 'En attente' | 'Refusé']>;

    return base.map((item, index) => ({
      id: index + 1,
      first_name: item[0],
      last_name: item[1],
      email: `${item[0].toLowerCase()}.${item[1].toLowerCase().replace(/\s+/g, '.')}@example.com`,
      cin: `${24000000 + index}`,
      type: index % 3 === 1 ? 'ingenieur' : 'master',
      voeux: index % 3 === 1 ? undefined : [`Master ${item[2]}`, `Master ${item[2]} Avancé`],
      specialite: item[2],
      score: item[3],
      statut: item[4],
      monAvis: item[4] === 'Admis' ? 'favorable' : item[4] === 'Refusé' ? 'defavorable' : null,
      commentaire: '',
    }));
  }

  calculateAverage(): number {
    if (this.candidats.length === 0) return 0;
    const sum = this.candidats.reduce((acc, c) => acc + c.score, 0);
    return Math.round((sum / this.candidats.length) * 10) / 10;
  }

  countByType(type: string): number {
    return this.candidats.filter((c) => c.type === type).length;
  }

  countAvis(avis: string): number {
    return this.candidats.filter((c) => c.monAvis === avis).length;
  }

  countStatut(statut: Candidat['statut']): number {
    return this.candidats.filter((c) => c.statut === statut).length;
  }

  getCandidatStatusClass(statut: Candidat['statut']): string {
    return statut === 'Refusé'
      ? 'status-refuse'
      : `status-${statut.toLowerCase().replace(/\s+/g, '-')}`;
  }

  appliquerFiltres(): void {
    const query = this.filtreNom.trim().toLowerCase();
    this.candidatsFiltres = this.candidats.filter((c) => {
      const scope = this.activeCommissionCategory;
      const matchCommission =
        !scope ||
        (scope === 'ingenieur' && c.type === 'ingenieur') ||
        (scope === 'master-ds' && c.type === 'master' && c.specialite === 'DSI') ||
        (scope === 'master-gl' && c.type === 'master' && c.specialite === 'GL');
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
      const matchType = !this.filtreType || c.type === this.filtreType;
      const matchAvis = !this.filtreAvis || c.monAvis === this.filtreAvis;
      const matchSpecialite = !this.selectedSpecialite || c.specialite === this.selectedSpecialite;
      const matchName = !query || fullName.includes(query) || c.cin.toLowerCase().includes(query);
      return matchCommission && matchType && matchAvis && matchSpecialite && matchName;
    });
    // keep selection in sync with filtered list
    this.selectedIds = this.selectedIds.filter((id) =>
      this.candidatsFiltres.some((c) => c.id === id),
    );
  }

  private getCommissionCategoryFromId(
    commissionId: number | null,
  ): CommissionContextOption['category'] | null {
    if (commissionId === null) return null;
    if (commissionId === 1) return 'ingenieur';
    if (commissionId === 2) return 'master-ds';
    if (commissionId === 3) return 'master-gl';
    return null;
  }

  // Responsable selection helpers
  toggleSelect(id: number, event?: Event): void {
    if (event) event.stopPropagation();
    const i = this.selectedIds.indexOf(id);
    if (i >= 0) this.selectedIds.splice(i, 1);
    else this.selectedIds.push(id);
  }

  toggleAll(event: any): void {
    const allIds = this.candidatsFiltres.map((c) => c.id);
    if (event.target.checked) {
      this.selectedIds = [...new Set([...this.selectedIds, ...allIds])];
    } else {
      this.selectedIds = [];
    }
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  toggleActionMenu(candidateId: number, event?: Event): void {
    event?.stopPropagation();
    this.actionMenuOpenId = this.actionMenuOpenId === candidateId ? null : candidateId;
  }

  closeActionMenu(): void {
    this.actionMenuOpenId = null;
  }

  validateSelection(): void {
    if (this.selectedIds.length === 0) {
      this.toastService.show('Veuillez sélectionner au moins un candidat', 'warning');
      return;
    }
    const confirmMsg = `Êtes-vous sûr de vouloir marquer ${this.selectedIds.length} candidat(s) comme présélectionné(s) ?`;
    if (!confirm(confirmMsg)) return;

    this.selectedIds.forEach((id) => {
      const candidat = this.candidats.find((item) => item.id === id);
      if (candidat) {
        candidat.statut = 'Admis';
        candidat.monAvis = 'favorable';
      }
    });

    this.selectedIds = [];
    this.appliquerFiltres();
    this.loadGlobalAvisSummary();
    this.toastService.show('Candidat(s) présélectionné(s) avec succès.', 'success');
  }

  donnerAvis(candidat: Candidat, avis: 'favorable' | 'defavorable'): void {
    candidat.monAvis = avis;
    this.avisChanged[candidat.id] = avis;
  }

  ouvrirAvisCandidat(candidat: Candidat): void {
    this.candidatSelectionne = candidat;
    this.commentaire = candidat.commentaire || '';
    this.avisCandidatSelectionne = candidat;
    this.avisCandidatStatut = candidat.statut;
    this.avisCandidatCommentaire = candidat.commentaire || '';
    this.showCommentModal = true;
  }

  voirDossier(candidateOrId: Candidat | number): void {
    let candidat: Candidat | undefined;
    if (typeof candidateOrId === 'number') {
      candidat = this.candidats.find((c) => c.id === candidateOrId);
    } else {
      candidat = candidateOrId;
    }
    if (!candidat) return;
    // Prepare lightweight dossier summary (no PDFs)
    this.dossierModalCandidate = candidat;
    const base = candidat.score || 0;
    const g1 = Math.max(0, Math.round((base - 1.2) * 10) / 10);
    const g2 = Math.max(0, Math.round((base - 0.4) * 10) / 10);
    const g3 = Math.max(0, Math.round((base + 0.6) * 10) / 10);
    this.dossierModalData = {
      grades: [
        { label: 'Mathématiques', value: g1 },
        { label: 'Algorithmique', value: g2 },
        { label: 'Anglais', value: g3 },
      ],
    };
    this.dossierModalOpen = true;
    this.closeActionMenu();
  }

  closeDossierModal(): void {
    this.dossierModalOpen = false;
    this.dossierModalCandidate = null;
    this.dossierModalData = null;
    this.bulkDossierIndex = -1;
  }

  openBulkDossierView(): void {
    if (this.selectedIds.length === 0) return;
    this.bulkDossierIndex = 0;
    this.loadBulkDossierAtIndex(0);
  }

  private loadBulkDossierAtIndex(index: number): void {
    if (index < 0 || index >= this.selectedIds.length) return;
    const candidateId = this.selectedIds[index];
    const candidat = this.candidats.find((c) => c.id === candidateId);
    if (!candidat) return;

    this.dossierModalCandidate = candidat;
    const base = candidat.score || 0;
    const g1 = Math.max(0, Math.round((base - 1.2) * 10) / 10);
    const g2 = Math.max(0, Math.round((base - 0.4) * 10) / 10);
    const g3 = Math.max(0, Math.round((base + 0.6) * 10) / 10);
    this.dossierModalData = {
      grades: [
        { label: 'Mathématiques', value: g1 },
        { label: 'Algorithmique', value: g2 },
        { label: 'Anglais', value: g3 },
      ],
    };
    this.dossierModalOpen = true;
  }

  prevBulkDossier(): void {
    if (this.bulkDossierIndex > 0) {
      this.bulkDossierIndex--;
      this.loadBulkDossierAtIndex(this.bulkDossierIndex);
    }
  }

  nextBulkDossier(): void {
    if (this.bulkDossierIndex < this.selectedIds.length - 1) {
      this.bulkDossierIndex++;
      this.loadBulkDossierAtIndex(this.bulkDossierIndex);
    }
  }

  onPageClick(): void {
    this.closeActionMenu();
  }

  voirDetails(id: number): void {
    this.router.navigate(['/consultation-dossier', id]);
  }

  sauvegarderAvis(): void {
    const changedIds = Object.keys(this.avisChanged);
    if (!changedIds.length) {
      this.toastService.show('Aucun avis à sauvegarder.', 'info');
      return;
    }

    this.avisChanged = {};
    this.toastService.show('Avis sauvegardés avec succès.', 'success');
  }

  hasAvisChanged(): boolean {
    return Object.keys(this.avisChanged).length > 0;
  }

  openGlobalAvisModal(): void {
    this.globalAvisStatut = 'favorable';
    this.globalAvisCommentaire = '';
    this.showGlobalAvisModal = true;
  }

  closeGlobalAvisModal(): void {
    this.showGlobalAvisModal = false;
  }

  submitGlobalAvis(): void {
    if (this.globalAvisStatut === 'defavorable' && !this.globalAvisCommentaire.trim()) {
      this.toastService.show(
        'Argumentaire obligatoire pour un avis global défavorable.',
        'warning',
      );
      return;
    }
    this.globalAvisSubmitting = true;
    const newStatus: Candidat['statut'] =
      this.globalAvisStatut === 'favorable' ? 'Admis' : 'Refusé';
    this.candidats.forEach((candidat) => {
      candidat.statut = newStatus;
      candidat.monAvis = this.globalAvisStatut;
      candidat.commentaire = this.globalAvisCommentaire.trim();
    });
    this.appliquerFiltres();
    this.globalAvisSummary = {
      favorables: this.countStatut('Admis'),
      defavorables: this.countStatut('Refusé'),
    };
    this.globalAvisSubmitting = false;
    this.showGlobalAvisModal = false;
    this.toastService.show('Avis global enregistré.', 'success');
  }

  loadGlobalAvisSummary(): void {
    this.globalAvisSummary = {
      favorables: this.countStatut('Admis'),
      defavorables: this.countStatut('Refusé'),
    };
  }

  fermerModal(): void {
    this.showCommentModal = false;
    this.candidatSelectionne = null;
    this.commentaire = '';
    this.avisCandidatSelectionne = null;
    this.avisCandidatStatut = 'En attente';
    this.avisCandidatCommentaire = '';
  }

  sauvegarderCommentaire(): void {
    if (!this.candidatSelectionne) {
      return;
    }

    const candidat = this.candidatSelectionne;
    candidat.statut = this.avisCandidatStatut;
    candidat.commentaire = this.avisCandidatCommentaire.trim();
    this.commentaire = candidat.commentaire;
    candidat.monAvis =
      this.avisCandidatStatut === 'Admis'
        ? 'favorable'
        : this.avisCandidatStatut === 'Refusé'
          ? 'defavorable'
          : null;
    this.avisChanged[candidat.id] = candidat.monAvis;
    this.appliquerFiltres();
    this.fermerModal();
    this.loadGlobalAvisSummary();
    this.toastService.show('Statut du candidat mis à jour.', 'success');
  }
}
