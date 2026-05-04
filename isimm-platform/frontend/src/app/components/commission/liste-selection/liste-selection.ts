import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

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
  imports: [CommonModule, FormsModule, RouterLink],
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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadListes();
    // populate demo finalSelectionCandidates for now
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
      {
        id: 2,
        rang: 2,
        num: '2603-00002-DS',
        nom: 'Ahmed Ben Ali',
        spec: 'Master Genie Logiciel',
        score: 16.5,
        interne: true,
        presel: 'oui',
        statut: 'lp',
        obs: '',
      },
      {
        id: 3,
        rang: 3,
        num: '2603-00003-GL',
        nom: 'Sana Trabelsi',
        spec: 'Master Genie Logiciel',
        score: 15.8,
        interne: false,
        presel: 'oui',
        statut: 'lp',
        obs: '',
      },
      {
        id: 4,
        rang: 4,
        num: '2603-00004-DS',
        nom: 'Youssef Mahjoub',
        spec: 'Master Data Science',
        score: 14.3,
        interne: true,
        presel: 'non',
        statut: 'lp',
        obs: '',
      },
      {
        id: 5,
        rang: 5,
        num: '2603-00005-GL',
        nom: 'Nour Khelif',
        spec: 'Master Reseaux',
        score: 12.7,
        interne: false,
        presel: 'non',
        statut: 'lp',
        obs: '',
      },
      {
        id: 6,
        rang: 6,
        num: '2603-00006-DS',
        nom: 'Mariem Zouari',
        spec: 'Master Data Science',
        score: 11.2,
        interne: true,
        presel: 'non',
        statut: 'lp',
        obs: '',
      },
    ];
    this.updateFinalSelectionFiltered();
  }

  loadListes(): void {
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
  }

  filtrer(): void {
    // TODO: Filtrer les listes selon la recherche
  }

  imprimerListe(): void {
    window.print();
  }

  voirDossier(id: number): void {
    this.router.navigate(['/commission/dossier', id]);
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
