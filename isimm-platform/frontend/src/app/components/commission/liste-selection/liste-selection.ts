import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CandidaturesConsultationModalComponent } from '../candidatures-master/candidatures-consultation-modal.component';
import { SpecialitesService } from '../../../services/specialites.service';
import { AuthService } from '../../../services/auth.service';
import { CandidatureService } from '../../../services/candidature.service';

interface Candidat {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  cin: string;
  type: 'master' | 'ingenieur';
  formation: string;
  voeux?: string[];
  specialite?: string;
  score: number;
  avisFavorables: number; // pour barres dans tableau
  statut: 'principale' | 'attente';
}

type FinalSelectionDecision = '' | 'lp' | 'la' | 'refuse';
type FinalSelectionPresel = 'oui' | 'non';
type FinalSelectionTypeFilter = 'all' | 'interne' | 'externe';

interface FinalSelectionCandidate {
  id: number;
  rang: number;
  num: string;
  nom: string;
  spec: string;
  score: number;
  interne: boolean;
  presel: FinalSelectionPresel;
  statut: FinalSelectionDecision;
  obs: string;
}

interface DossierDocumentView {
  id: number | string;
  nom: string;
  statut: string;
  commentaire?: string;
  date_upload?: string;
  fichier_url?: string;
  type_document_detail?: {
    type_document?: string;
    description?: string;
  };
}
interface FinalSelectionFilters {
  session: string;
  type: FinalSelectionTypeFilter;
  specialite: string;
  scoreMin: number;
  scoreMax: number;
  search: string;
  hideValides: boolean;
}

@Component({
  selector: 'app-liste-selection',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './liste-selection.html',
  styleUrl: './liste-selection.css',
})
export class ListeSelection implements OnInit {
  listePrincipale: Candidat[] = [];
  listeAttente: Candidat[] = [];
  activeTab: 'principale' | 'attente' | 'toutes' = 'principale';
  recherche: string = '';
  scoreMinimum: number = 14;
  avisFavorables: number = 85;

  showCommentModal: boolean = false;
  candidatSelectionne: Candidat | null = null;
  commentaire: string = '';

  // Final selection state (moved from dashboard)
  finalSelectionQuotaLpTotal: number = 55;
  finalSelectionQuotaLaTotal: number = 20;
  finalSelectionCandidates: FinalSelectionCandidate[] = [];
  finalSelectionFiltered: FinalSelectionCandidate[] = [];
  finalSelectionSelectedIds: Set<number> = new Set();
  finalSelectionTop100On: boolean = false;
  finalSelectionBulkAction: FinalSelectionDecision = '';
  finalSelectionExportOpen: boolean = false;
  finalSelectionConfirmOpen: boolean = false;
  dossierModalOpen: boolean = false;
  dossierModalLoading: boolean = false;
  dossierModalError = '';
  dossierModalCandidate: FinalSelectionCandidate | null = null;
  dossierModalData: any = null;
  dossierModalDocuments: DossierDocumentView[] = [];
  finalSelectionToast: { message: string; type: string; visible: boolean } = {
    message: '0 candidats mis a jour',
    type: 't-success',
    visible: false,
  };
  private finalSelectionToastTimer: number | null = null;
  finalSelectionFilters: FinalSelectionFilters = {
    session: '2025/2026',
    type: 'all',
    specialite: 'all',
    scoreMin: 0,
    scoreMax: 20,
    search: '',
    hideValides: false,
  };

  userRole: string | null = null;
  showDossierButton = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private candidatureService: CandidatureService,
    private dialog: MatDialog,
    private specialitesService: SpecialitesService,
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || null;
    this.showDossierButton =
      this.userRole === 'commission' || this.userRole === 'responsable_commission';
    this.loadListes();
    // load specialties options from service
    this.specialitesService.getSpecialitesData().subscribe((data) => {
      if (data) {
        // trigger recompute of options via getter
        this.updateFinalSelectionFiltered();
      }
    });
  }

  loadListes(): void {
    this.candidatureService.getCandidaturesCommissionClassees().subscribe({
      next: (response: any) => {
        const rows = Array.isArray(response)
          ? response
          : response?.value || response?.results || [];
        this.finalSelectionCandidates = rows.map((row: any, index: number) => {
          const isSelected = String(row?.statut || '').toLowerCase() === 'preselectionne';
          return {
            id: Number(row?.id),
            rang: Number(row?.classement || index + 1),
            num: row?.numero || `C-${index + 1}`,
            nom: row?.candidat_nom || 'Candidat',
            spec: row?.master_nom || row?.specialite || '-',
            score: Number(row?.score || 0),
            interne: String(row?.parcours || '')
              .toLowerCase()
              .includes('interne'),
            presel: isSelected ? 'oui' : 'non',
            statut: isSelected ? 'lp' : '',
            obs: '',
          };
        });
        this.updateFinalSelectionFiltered();
      },
      error: () => {
        const tousLesCandidates: Candidat[] = [
          {
            id: 1,
            first_name: 'Ahmed',
            last_name: 'Ben Ali',
            email: 'ahmed@example.com',
            cin: '12345678',
            type: 'master',
            formation: 'Master Génie Logiciel',
            voeux: ['Master Génie Logiciel', 'Master Data Science'],
            score: 17.5,
            avisFavorables: 85,
            statut: 'principale',
          },
          {
            id: 2,
            first_name: 'Fatma',
            last_name: 'Trabelsi',
            email: 'fatma@example.com',
            cin: '87654321',
            type: 'ingenieur',
            formation: 'Génie Informatique',
            specialite: 'Génie Informatique',
            score: 15.2,
            avisFavorables: 90,
            statut: 'principale',
          },
          {
            id: 3,
            first_name: 'Mohammed',
            last_name: 'Saidi',
            email: 'mohammed@example.com',
            cin: '11223344',
            type: 'master',
            formation: 'Master Microélectronique',
            voeux: ['Master Microélectronique'],
            score: 16.8,
            avisFavorables: 92,
            statut: 'principale',
          },
          {
            id: 4,
            first_name: 'Zaineb',
            last_name: 'Khaled',
            email: 'zaineb@example.com',
            cin: '55665544',
            type: 'master',
            formation: 'Master Data Science',
            voeux: ['Master Data Science'],
            score: 14.5,
            avisFavorables: 40,
            statut: 'attente',
          },
          {
            id: 5,
            first_name: 'Ali',
            last_name: 'Amine',
            email: 'ali@example.com',
            cin: '99887766',
            type: 'ingenieur',
            formation: 'Génie Mécanique',
            specialite: 'Génie Mécanique',
            score: 14.1,
            avisFavorables: 30,
            statut: 'attente',
          },
        ];
        this.listePrincipale = tousLesCandidates.filter((c) => c.statut === 'principale');
        this.listeAttente = tousLesCandidates.filter((c) => c.statut === 'attente');
        this.finalSelectionCandidates = [
          {
            id: 1,
            rang: 1,
            num: '2603-00001-GL',
            nom: 'Fatma Gharbi',
            spec: 'Master Data Science',
            score: 17.2,
            interne: true,
            presel: 'oui',
            statut: 'lp',
            obs: '',
          },
        ];
        this.updateFinalSelectionFiltered();
      },
    });
  }

  filtrer(): void {
    // TODO: Filtrer les listes selon la recherche
  }

  imprimerListe(): void {
    window.print();
  }

  voirDossier(id: number): void {
    this.router.navigate(['/consultation-dossier', id], {
      queryParams: { source: 'selection' },
    });
  }

  voirDossierSelection(candidate: FinalSelectionCandidate): void {
    if (!candidate) return;
    this.dossierModalCandidate = candidate;
    this.dossierModalLoading = true;
    this.dossierModalError = '';
    this.dossierModalOpen = true;
    this.candidatureService.getCommissionDossier(candidate.id).subscribe({
      next: (response: any) => {
        this.dossierModalData = response?.dossier || response || null;
        this.dossierModalDocuments = Array.isArray(this.dossierModalData?.documents)
          ? this.dossierModalData.documents
          : [];
        this.dossierModalLoading = false;
      },
      error: (error: any) => {
        this.dossierModalError = error?.error?.error || 'Impossible de charger le dossier.';
        this.dossierModalLoading = false;
      },
    });
  }

  closeDossierModal(): void {
    this.dossierModalOpen = false;
    this.dossierModalCandidate = null;
    this.dossierModalData = null;
    this.dossierModalDocuments = [];
    this.dossierModalError = '';
    this.dossierModalLoading = false;
  }

  getDossierTitle(candidate: FinalSelectionCandidate | null): string {
    if (!candidate) return 'Détail dossier';
    return `Détail dossier - ${candidate.nom}`;
  }

  isPdf(url?: string): boolean {
    return !!url && /\.pdf($|\?)/i.test(url);
  }

  ajouterCommentaire(candidat: Candidat): void {
    this.candidatSelectionne = candidat;
    this.showCommentModal = true;
  }

  fermerModal(): void {
    this.showCommentModal = false;
    this.candidatSelectionne = null;
    this.commentaire = '';
  }

  sauvegarderCommentaire(): void {
    if (this.candidatSelectionne) this.fermerModal();
  }

  /********* Final selection helpers (moved) *********/
  get finalSelectionSpecialiteOptions(): string[] {
    // prefer using specialites service if available
    const all = this.specialitesService.getAllSpecialties();
    if (all && all.length > 0) return all;
    const uniques = new Set(this.finalSelectionCandidates.map((c) => c.spec));
    return Array.from(uniques).sort();
  }

  updateFinalSelectionFiltered(): void {
    const scoreMin = Number(this.finalSelectionFilters.scoreMin) || 0;
    const scoreMax = Number(this.finalSelectionFilters.scoreMax) || 20;
    const search = (this.finalSelectionFilters.search || '').toLowerCase();
    const type = this.finalSelectionFilters.type;
    const specialite = this.finalSelectionFilters.specialite;
    const hideValides = this.finalSelectionFilters.hideValides;
    let rows = this.finalSelectionCandidates.slice();
    rows = rows.filter((c) => c.score >= scoreMin && c.score <= scoreMax);
    if (search)
      rows = rows.filter(
        (c) =>
          (c.nom || '').toLowerCase().includes(search) ||
          (c.num || '').toLowerCase().includes(search),
      );
    if (type === 'interne') rows = rows.filter((c) => c.interne);
    else if (type === 'externe') rows = rows.filter((c) => !c.interne);
    if (specialite && specialite !== 'all') rows = rows.filter((c) => c.spec === specialite);
    if (hideValides) rows = rows.filter((c) => !c.statut);
    if (this.finalSelectionTop100On)
      rows = rows
        .slice()
        .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
        .slice(0, 100);
    this.finalSelectionFiltered = rows;
  }

  isFinalSelectionRowSelected(id: number): boolean {
    return this.finalSelectionSelectedIds.has(id);
  }
  areAllFinalSelectionRowsSelected(): boolean {
    const rows = this.finalSelectionFiltered;
    return rows.length > 0 && rows.every((row) => this.finalSelectionSelectedIds.has(row.id));
  }
  toggleFinalSelectionRow(id: number, checked: boolean): void {
    if (checked) this.finalSelectionSelectedIds.add(id);
    else this.finalSelectionSelectedIds.delete(id);
  }
  toggleFinalSelectionAll(checked: boolean): void {
    this.finalSelectionFiltered.forEach((row) => {
      if (checked) this.finalSelectionSelectedIds.add(row.id);
      else this.finalSelectionSelectedIds.delete(row.id);
    });
  }
  getFinalSelectionSelectedCountLabel(): string {
    const count = this.finalSelectionSelectedIds.size;
    const plural = count > 1 ? 's' : '';
    return `${count} candidat${plural} selectionne${plural}`;
  }

  getFinalSelectionScoreClass(score: number): string {
    if (score > 15) return 'sf-green';
    if (score >= 10) return 'sf-amber';
    return 'sf-red';
  }
  getFinalSelectionScorePercent(score: number): number {
    return Math.min(100, Math.round((Number(score) / 20) * 100));
  }
  getFinalSelectionStatusClass(status: FinalSelectionDecision): string {
    if (status === 'lp') return 's-lp';
    if (status === 'la') return 's-la';
    if (status === 'refuse') return 's-refuse';
    return 's-empty';
  }
  onFinalSelectionStatusChange(): void {
    this.updateFinalSelectionFiltered();
  }
  onFinalSelectionObservationChange(): void {
    this.updateFinalSelectionFiltered();
  }

  getFinalSelectionLpCount(): number {
    return this.finalSelectionCandidates.filter((c) => c.statut === 'lp').length;
  }
  getFinalSelectionLaCount(): number {
    return this.finalSelectionCandidates.filter((c) => c.statut === 'la').length;
  }
  getFinalSelectionRefuseCount(): number {
    return this.finalSelectionCandidates.filter((c) => c.statut === 'refuse').length;
  }
  getFinalSelectionValidatedCount(): number {
    return this.getFinalSelectionLpCount() + this.getFinalSelectionLaCount();
  }

  getFinalSelectionAverageScore(): number {
    if (!this.finalSelectionCandidates.length) return 0;
    const total = this.finalSelectionCandidates.reduce((sum, c) => sum + Number(c.score || 0), 0);
    return total / this.finalSelectionCandidates.length;
  }

  getFinalSelectionLpPercent(): number {
    if (!this.finalSelectionQuotaLpTotal) return 0;
    return Math.min(
      100,
      Math.round((this.getFinalSelectionLpCount() / this.finalSelectionQuotaLpTotal) * 100),
    );
  }
  getFinalSelectionLaPercent(): number {
    if (!this.finalSelectionQuotaLaTotal) return 0;
    return Math.min(
      100,
      Math.round((this.getFinalSelectionLaCount() / this.finalSelectionQuotaLaTotal) * 100),
    );
  }

  getFinalSelectionQuotaFillClass(kind: 'lp' | 'la'): string {
    const count = kind === 'lp' ? this.getFinalSelectionLpCount() : this.getFinalSelectionLaCount();
    const total = kind === 'lp' ? this.finalSelectionQuotaLpTotal : this.finalSelectionQuotaLaTotal;
    const warnThreshold = kind === 'lp' ? 50 : 18;
    if (count > total) return 'qf-full';
    if (count >= warnThreshold) return 'qf-warn';
    return kind === 'lp' ? 'qf-lp' : 'qf-la';
  }

  getFinalSelectionQuotaHint(kind: 'lp' | 'la'): string {
    const count = kind === 'lp' ? this.getFinalSelectionLpCount() : this.getFinalSelectionLaCount();
    const total = kind === 'lp' ? this.finalSelectionQuotaLpTotal : this.finalSelectionQuotaLaTotal;
    if (count > total) return 'Quota depasse !';
    const remaining = total - count;
    return `${remaining} place(s) restante(s) - ${kind.toUpperCase()}`;
  }

  getFinalSelectionQuotaHintClass(kind: 'lp' | 'la'): string {
    const count = kind === 'lp' ? this.getFinalSelectionLpCount() : this.getFinalSelectionLaCount();
    const total = kind === 'lp' ? this.finalSelectionQuotaLpTotal : this.finalSelectionQuotaLaTotal;
    const warnThreshold = kind === 'lp' ? 50 : 18;
    if (count > total) return 'qh-full';
    if (count >= warnThreshold) return 'qh-warn';
    return 'qh-ok';
  }

  toggleFinalSelectionTop100(): void {
    this.finalSelectionTop100On = !this.finalSelectionTop100On;
    this.updateFinalSelectionFiltered();
  }
  resetFinalSelectionFilters(): void {
    this.finalSelectionFilters = {
      session: '2025/2026',
      type: 'all',
      specialite: 'all',
      scoreMin: 0,
      scoreMax: 20,
      search: '',
      hideValides: false,
    };
    this.finalSelectionTop100On = false;
    this.updateFinalSelectionFiltered();
  }

  applyFinalSelectionBulkAction(): void {
    if (!this.finalSelectionBulkAction) return;
    const selectedIds = Array.from(this.finalSelectionSelectedIds);
    selectedIds.forEach((id) => {
      const candidate = this.finalSelectionCandidates.find((c) => c.id === id);
      if (candidate) candidate.statut = this.finalSelectionBulkAction;
    });
    this.finalSelectionSelectedIds.clear();
    this.finalSelectionBulkAction = '';
    this.updateFinalSelectionFiltered();
    this.showFinalSelectionToast(`${selectedIds.length} candidat(s) mis a jour`, 't-success');
  }

  finalSelectionConsult(candidate: FinalSelectionCandidate): void {
    if (!candidate) return;
    this.showFinalSelectionToast(`Ouverture du dossier de ${candidate.nom}`, 't-info');
  }

  toggleFinalSelectionExportMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.finalSelectionExportOpen = !this.finalSelectionExportOpen;
  }
  onFinalSelectionPageClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target?.closest('.export-wrap')) this.finalSelectionExportOpen = false;
  }
  openFinalSelectionConfirm(): void {
    this.finalSelectionConfirmOpen = true;
    this.finalSelectionExportOpen = false;
  }
  hideFinalSelectionConfirm(): void {
    this.finalSelectionConfirmOpen = false;
  }
  confirmFinalSelectionNotify(): void {
    this.hideFinalSelectionConfirm();
    this.showFinalSelectionToast(
      'Resultats publies - notifications envoyees aux candidats',
      't-success',
    );
  }
  finalSelectionExportPdf(): void {
    this.finalSelectionExportOpen = false;
    this.showFinalSelectionToast('Generation du PV final (demo)', 't-info');
  }
  finalSelectionExportExcel(): void {
    this.finalSelectionExportOpen = false;
    this.showFinalSelectionToast('Export Excel (demo)', 't-info');
  }

  private showFinalSelectionToast(message: string, type: string): void {
    this.finalSelectionToast = { message, type, visible: true };
    if (this.finalSelectionToastTimer) window.clearTimeout(this.finalSelectionToastTimer);
    this.finalSelectionToastTimer = window.setTimeout(() => {
      this.finalSelectionToast.visible = false;
    }, 3500);
  }
}
