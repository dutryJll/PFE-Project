import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CandidatureService } from '../../../services/candidature.service';
import { AuthService } from '../../../services/auth.service';

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

  filtreType: string = '';
  filtreAvis: string = '';
  globalAvisStatut: 'favorable' | 'defavorable' = 'favorable';
  globalAvisCommentaire = '';
  showGlobalAvisModal = false;
  globalAvisSubmitting = false;
  globalAvisSummary: any = null;

  avisChanged: { [key: number]: 'favorable' | 'defavorable' | null } = {};

  // User and role
  userRole: string | null = null;

  // Responsable selection state
  selectedIds: number[] = [];

  constructor(
    private router: Router,
    private candidatureService: CandidatureService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const me = this.authService.getCurrentUser();
    this.userRole = me?.role || me?.type || null;
    this.loadCommissionsAndData();
  }

  loadCommissionsAndData(): void {
    this.candidatureService.getMyCommissions().subscribe({
      next: (res: any) => {
        this.commissions = Array.isArray(res?.commissions) ? res.commissions : [];
        const stored = localStorage.getItem('active_commission_id');
        const storedId = stored && !Number.isNaN(Number(stored)) ? Number(stored) : null;

        this.activeCommissionId =
          storedId ||
          (Number.isFinite(Number(res?.active_commission_id))
            ? Number(res.active_commission_id)
            : null) ||
          this.commissions[0]?.id ||
          null;

        if (this.activeCommissionId) {
          localStorage.setItem('active_commission_id', String(this.activeCommissionId));
        }

        this.loadCandidats();
        this.loadGlobalAvisSummary();
      },
      error: () => {
        this.loadCandidats();
      },
    });
  }

  onCommissionChange(value: string | number): void {
    const parsed = Number(value);
    this.activeCommissionId = Number.isFinite(parsed) ? parsed : null;
    if (this.activeCommissionId) {
      localStorage.setItem('active_commission_id', String(this.activeCommissionId));
    } else {
      localStorage.removeItem('active_commission_id');
    }
    this.loadCandidats();
    this.loadGlobalAvisSummary();
  }

  getCommissionLabel(commission: CommissionOption): string {
    const details = (commission.description || '').trim();
    return details ? `${commission.nom} (${details})` : commission.nom;
  }

  loadCandidats(): void {
    this.loading = true;
    this.candidatureService.getCandidaturesCommissionClassees().subscribe({
      next: (res: any) => {
        const rows = Array.isArray(res) ? res : [];
        this.candidats = rows.map((row: any) => {
          const fullName = String(row?.nom_complet || row?.candidat_nom || '').trim();
          const parts = fullName.split(/\s+/).filter(Boolean);
          const firstName = parts[0] || 'Candidat';
          const lastName = parts.slice(1).join(' ') || '';
          const rawType = String(row?.type_concours || '').toLowerCase();
          const type: 'master' | 'ingenieur' =
            rawType.includes('ingenieur') || rawType.includes('ing') ? 'ingenieur' : 'master';

          return {
            id: row.id,
            first_name: firstName,
            last_name: lastName,
            email: row.candidat_email || '',
            cin: row.candidat_cin || '-',
            type,
            voeux: row.master_nom ? [row.master_nom] : [],
            specialite: row.specialite || row.master_nom || '',
            score: Number(row.score || 0),
            monAvis: null,
            commentaire: '',
          } as Candidat;
        });
        this.appliquerFiltres();
        this.loading = false;
      },
      error: () => {
        this.candidats = [];
        this.candidatsFiltres = [];
        this.loading = false;
      },
    });
  }

  calculateAverage(): number {
    if (this.candidatsFiltres.length === 0) return 0;
    const sum = this.candidatsFiltres.reduce((acc, c) => acc + c.score, 0);
    return Math.round((sum / this.candidatsFiltres.length) * 10) / 10;
  }

  countByType(type: string): number {
    return this.candidatsFiltres.filter((c) => c.type === type).length;
  }

  countAvis(avis: string): number {
    return this.candidatsFiltres.filter((c) => c.monAvis === avis).length;
  }

  appliquerFiltres(): void {
    this.candidatsFiltres = this.candidats.filter((c) => {
      const matchType = !this.filtreType || c.type === this.filtreType;
      const matchAvis = !this.filtreAvis || c.monAvis === this.filtreAvis;
      return matchType && matchAvis;
    });
    // keep selection in sync with filtered list
    this.selectedIds = this.selectedIds.filter((id) =>
      this.candidatsFiltres.some((c) => c.id === id),
    );
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

  validateSelection(): void {
    if (this.selectedIds.length === 0) {
      alert('Veuillez sélectionner au moins un candidat');
      return;
    }
    const confirmMsg = `Êtes-vous sûr de vouloir marquer ${this.selectedIds.length} candidat(s) comme présélectionné(s) ?`;
    if (!confirm(confirmMsg)) return;

    const reason = `Présélectionné manuellement`;
    this.candidatureService
      .bulkUpdateCandidatureStatus(this.selectedIds, 'preselectionne', reason)
      .subscribe({
        next: (response: any) => {
          alert(
            `✅ ${response?.updated_count || this.selectedIds.length} candidat(s) présélectionné(s) avec succès`,
          );
          this.selectedIds = [];
          this.loadCandidats();
        },
        error: (error: any) => {
          const message =
            error?.error?.error || error?.error?.message || 'Erreur lors de la validation';
          alert(`❌ Erreur: ${message}`);
        },
      });
  }

  donnerAvis(candidat: Candidat, avis: 'favorable' | 'defavorable'): void {
    candidat.monAvis = avis;
    this.avisChanged[candidat.id] = avis;
  }

  voirDossier(id: number): void {
    this.router.navigate(['/consultation-dossier', id]);
  }

  voirDetails(id: number): void {
    this.router.navigate(['/consultation-dossier', id]);
  }

  sauvegarderAvis(): void {
    const requests: any[] = [];
    const changedIds = Object.keys(this.avisChanged).map((key) => Number(key));

    changedIds.forEach((id) => {
      const candidat = this.candidats.find((c) => c.id === id);
      if (!candidat || !candidat.monAvis) {
        return;
      }
      if (candidat.monAvis === 'defavorable' && !(candidat.commentaire || '').trim()) {
        alert(
          `Argumentaire obligatoire pour un avis défavorable (${candidat.first_name} ${candidat.last_name}).`,
        );
        return;
      }

      requests.push(
        this.candidatureService.submitAvis(id, {
          avis: candidat.monAvis === 'favorable',
          argument: candidat.commentaire || '',
          commission_id: this.activeCommissionId || undefined,
        }),
      );
    });

    if (!requests.length) {
      alert('Aucun avis à sauvegarder.');
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.avisChanged = {};
        alert('Avis sauvegardés avec succès.');
      },
      error: (error) => {
        const message = error?.error?.error || 'Erreur lors de la sauvegarde des avis.';
        alert(message);
      },
    });
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
    if (!this.activeCommissionId) {
      alert('Veuillez sélectionner une commission active.');
      return;
    }
    if (this.globalAvisStatut === 'defavorable' && !this.globalAvisCommentaire.trim()) {
      alert('Argumentaire obligatoire pour un avis global défavorable.');
      return;
    }

    this.globalAvisSubmitting = true;
    this.candidatureService
      .submitGlobalAvis(this.activeCommissionId, {
        statut: this.globalAvisStatut,
        commentaire: this.globalAvisCommentaire,
        is_global: true,
      })
      .subscribe({
        next: () => {
          this.globalAvisSubmitting = false;
          this.showGlobalAvisModal = false;
          this.loadGlobalAvisSummary();
          alert('Avis global enregistré.');
        },
        error: (error) => {
          this.globalAvisSubmitting = false;
          const message = error?.error?.error || "Erreur lors de la soumission de l'avis global.";
          alert(message);
        },
      });
  }

  loadGlobalAvisSummary(): void {
    if (!this.activeCommissionId) {
      this.globalAvisSummary = null;
      return;
    }
    this.candidatureService.getCommissionGlobalAvisSummary(this.activeCommissionId).subscribe({
      next: (res: any) => {
        this.globalAvisSummary = res?.summary || null;
      },
      error: () => {
        // Member can still submit even if summary is restricted
        this.globalAvisSummary = null;
      },
    });
  }
}
