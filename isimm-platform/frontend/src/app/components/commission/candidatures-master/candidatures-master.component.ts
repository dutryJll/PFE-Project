import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  CommissionContextService,
  CommissionContextOption,
} from '../../../services/commission-context.service';
import { PdfExportService } from '../../../services/pdf-export.service';

interface PieceJustificative {
  nom: string;
  statut: 'ok' | 'missing';
}

type MasterStatus = 'Présélectionné' | 'Refusé';

interface Candidat {
  id: number;
  numeroCandidature: string;
  nom: string;
  master: string;
  score: number;
  etatDossier: 'Complet' | 'Incomplet';
  statut: MasterStatus;
  pieces: PieceJustificative[];
  email: string;
  cin: string;
  dateCandidature: string;
  commentaire?: string;
}

interface StatistiqueCard {
  label: string;
  nombre: number;
  theme: 'blue' | 'green' | 'amber' | 'red';
  icon: string;
}

@Component({
  selector: 'app-candidatures-master',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatures-master.component.html',
  styleUrls: ['./candidatures-master.component.css'],
})
export class CandidaturesMasterComponent implements OnInit, OnChanges {
  @Input() availableCommissions: { id: number; nom: string }[] = [];
  @Input() activeCommissionId: number | null = null;

  candidatsList: Candidat[] = [];
  candidatsFiltres: Candidat[] = [];
  selectedIds: number[] = [];
  activeKebab: number | null = null;
  generateListOpen = false;

  selectedCommissionId: number | null = null;
  private activeCommissionCategory: CommissionContextOption['category'] | null = null;
  selectedYear = '';
  selectedSpecialite = '';
  filtreStatut = '';
  recherche = '';
  distinctYears: string[] = [];
  availableSpecialites: string[] = [];

  consultationModalOpen = false;
  consultationCandidates: Candidat[] = [];
  consultationIndex = 0;
  // consultation UI state
  activeConsultationTab: 'details' | 'documents' | 'timeline' = 'details';
  timelineEntries: Array<{ date: string; author: string; note: string }> = [];
  newTimelineNote = '';

  avisModalOpen = false;
  avisCandidate: Candidat | null = null;
  avisStatut: MasterStatus = 'Présélectionné';
  avisCommentaire = '';

  constructor(
    private commissionContext: CommissionContextService,
    private router: Router,
    private pdfExport: PdfExportService,
  ) {}

  private onDocumentClickBound: any = null;

  ngOnInit(): void {
    this.selectedCommissionId = this.activeCommissionId;
    this.candidatsList = this.buildMockCandidates();
    this.rebuildDerivedLists();
  }

  ngAfterViewInit(): void {
    this.onDocumentClickBound = () => (this.activeKebab = null);
    document.addEventListener('click', this.onDocumentClickBound);
  }

  ngOnDestroy(): void {
    if (this.onDocumentClickBound) {
      document.removeEventListener('click', this.onDocumentClickBound);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeCommissionId'] && !changes['activeCommissionId'].firstChange) {
      this.selectedCommissionId = this.activeCommissionId;
      this.appliquerFiltres();
    }
    if (changes['availableCommissions'] && !changes['availableCommissions'].firstChange) {
      this.appliquerFiltres();
    }
  }

  private buildMockCandidates(): Candidat[] {
    const base: Array<[string, string, string, number, 'Complet' | 'Incomplet', MasterStatus]> = [
      ['Amira', 'Ben Salah', 'GL', 18.7, 'Complet', 'Présélectionné'],
      ['Yassine', 'Trabelsi', 'DSI', 17.9, 'Complet', 'Présélectionné'],
      ['Meriem', 'Khaldi', 'TI', 17.1, 'Complet', 'Présélectionné'],
      ['Omar', 'Jaziri', 'RS', 16.2, 'Complet', 'Présélectionné'],
      ['Nour', 'Cherif', 'GL', 15.8, 'Complet', 'Présélectionné'],
      ['Mahdi', 'Bouzid', 'DSI', 15.1, 'Incomplet', 'Présélectionné'],
      ['Salma', 'Haddad', 'TI', 14.6, 'Incomplet', 'Refusé'],
      ['Anis', 'Gharbi', 'RS', 14.1, 'Complet', 'Refusé'],
      ['Asma', 'Masmoudi', 'GL', 13.8, 'Incomplet', 'Refusé'],
      ['Riadh', 'Hamdi', 'DSI', 13.2, 'Incomplet', 'Refusé'],
      ['Wiem', 'Sassi', 'TI', 12.9, 'Complet', 'Refusé'],
      ['Hassen', 'Mnif', 'RS', 12.4, 'Incomplet', 'Refusé'],
      ['Nesrine', 'Brahmi', 'GL', 18.2, 'Complet', 'Présélectionné'],
      ['Sami', 'Ammar', 'DSI', 17.4, 'Complet', 'Présélectionné'],
      ['Imen', 'Ben Youssef', 'TI', 16.8, 'Complet', 'Présélectionné'],
      ['Fares', 'Ouertani', 'RS', 15.6, 'Incomplet', 'Présélectionné'],
      ['Rania', 'Sfar', 'GL', 14.9, 'Complet', 'Refusé'],
      ['Mehdi', 'Zidi', 'DSI', 13.6, 'Incomplet', 'Refusé'],
      ['Ines', 'Karray', 'TI', 18.0, 'Complet', 'Présélectionné'],
      ['Bassem', 'Mansouri', 'RS', 12.2, 'Incomplet', 'Refusé'],
    ];

    return base.map((item, index) => ({
      id: index + 1,
      numeroCandidature: `2603-${String(index + 1).padStart(5, '0')}-${item[2]}`,
      nom: `${item[0]} ${item[1]}`,
      master: `Master ${item[2]}`,
      score: item[3],
      etatDossier: item[4],
      statut: item[5],
      email: `${item[0].toLowerCase()}.${item[1].toLowerCase().replace(/\s+/g, '.')}@example.com`,
      cin: `${24000000 + index}`,
      dateCandidature: `2026-01-${String(10 + (index % 18)).padStart(2, '0')}`,
      commentaire: '',
      pieces: [
        { nom: 'Diplôme Licence', statut: index % 4 === 0 ? 'missing' : 'ok' },
        { nom: 'Relevé de Notes', statut: index % 5 === 0 ? 'missing' : 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: index % 6 === 0 ? 'missing' : 'ok' },
      ],
    }));
  }

  private rebuildDerivedLists(): void {
    this.distinctYears = Array.from(
      new Set(
        this.candidatsList.map((candidat) => new Date(candidat.dateCandidature).getFullYear()),
      ),
    )
      .map((year) => String(year))
      .sort((a, b) => Number(b) - Number(a));
    this.availableSpecialites = Array.from(
      new Set(this.candidatsList.map((candidat) => candidat.master.replace('Master ', ''))),
    ).sort();
    this.appliquerFiltres();
  }

  appliquerFiltres(): void {
    const search = this.recherche.trim().toLowerCase();
    this.candidatsFiltres = this.candidatsList.filter((candidat) => {
      const scope = this.activeCommissionCategory;
      const matchesCommission =
        !scope ||
        (scope === 'master-ds' && candidat.master.includes('DSI')) ||
        (scope === 'master-gl' && candidat.master.includes('GL'));
      const matchesYear =
        !this.selectedYear ||
        String(new Date(candidat.dateCandidature).getFullYear()) === String(this.selectedYear);
      const matchesSpecialite =
        !this.selectedSpecialite ||
        candidat.master.replace('Master ', '') === this.selectedSpecialite;
      const matchesStatus = !this.filtreStatut || candidat.statut === this.filtreStatut;
      const matchesSearch =
        !search ||
        candidat.numeroCandidature.toLowerCase().includes(search) ||
        candidat.nom.toLowerCase().includes(search) ||
        candidat.email.toLowerCase().includes(search) ||
        candidat.cin.toLowerCase().includes(search) ||
        candidat.master.toLowerCase().includes(search) ||
        candidat.statut.toLowerCase().includes(search);
      return (
        matchesCommission && matchesYear && matchesSpecialite && matchesStatus && matchesSearch
      );
    });

    this.selectedIds = this.selectedIds.filter((id) =>
      this.candidatsFiltres.some((candidat) => candidat.id === id),
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

  reinitialiserFiltres(): void {
    this.selectedCommissionId = this.activeCommissionId;
    this.selectedYear = '';
    this.selectedSpecialite = '';
    this.filtreStatut = '';
    this.recherche = '';
    this.appliquerFiltres();
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      this.selectedIds = this.candidatsFiltres.map((candidat) => candidat.id);
    } else {
      this.selectedIds = [];
    }
  }

  toggleSelect(id: number): void {
    if (this.selectedIds.includes(id)) {
      this.selectedIds = this.selectedIds.filter((selectedId) => selectedId !== id);
      return;
    }
    this.selectedIds = [...this.selectedIds, id];
  }

  isSelected(id: number): boolean {
    return this.selectedIds.includes(id);
  }

  isAllVisibleSelected(): boolean {
    return (
      this.candidatsFiltres.length > 0 &&
      this.candidatsFiltres.every((candidat) => this.isSelected(candidat.id))
    );
  }

  toggleGenerateListMenu(): void {
    this.generateListOpen = !this.generateListOpen;
  }

  genererListe(mode: 'all' | 'selection'): void {
    const count = mode === 'all' ? this.candidatsFiltres.length : this.selectedCandidates.length;
    window.alert(`Génération de la liste (${mode}) — ${count} éléments`);
    this.generateListOpen = false;
  }

  telechargerZIP(): void {
    const count = this.selectedCandidates.length || this.candidatsFiltres.length;
    window.alert(`Téléchargement ZIP lancé pour ${count} candidature(s)`);
  }

  get selectedCandidates(): Candidat[] {
    return this.candidatsFiltres.filter((candidat) => this.isSelected(candidat.id));
  }

  get canOpenMassConsultation(): boolean {
    return this.selectedIds.length > 0;
  }

  openMassConsultation(): void {
    const list = this.selectedCandidates;
    if (list.length === 0) {
      return;
    }
    this.consultationCandidates = list;
    this.consultationIndex = 0;
    this.consultationModalOpen = true;
    this.closeActionMenu();
  }

  openConsultation(candidate: Candidat): void {
    this.closeActionMenu();
    this.router.navigate(['/commission/dossier', candidate.id], {
      queryParams: { source: 'commission', type: 'master' },
    });
  }

  openAvis(candidate: Candidat): void {
    this.avisCandidate = candidate;
    this.avisStatut = candidate.statut;
    this.avisCommentaire = candidate.commentaire || '';
    this.avisModalOpen = true;
    this.closeActionMenu();
  }

  closeConsultation(): void {
    this.consultationModalOpen = false;
    this.consultationCandidates = [];
    this.consultationIndex = 0;
  }

  prevConsultation(): void {
    if (this.consultationIndex > 0) {
      this.consultationIndex -= 1;
    }
  }

  nextConsultation(): void {
    if (this.consultationIndex < this.consultationCandidates.length - 1) {
      this.consultationIndex += 1;
    }
  }

  get consultationCurrent(): Candidat | undefined {
    return this.consultationCandidates[this.consultationIndex];
  }

  saveAvis(): void {
    if (!this.avisCandidate) {
      return;
    }
    this.avisCandidate.statut = this.avisStatut;
    this.avisCandidate.commentaire = this.avisCommentaire.trim();
    this.avisModalOpen = false;
    this.avisCandidate = null;
    this.appliquerFiltres();
  }

  closeAvisModal(): void {
    this.avisModalOpen = false;
    this.avisCandidate = null;
    this.avisCommentaire = '';
    this.avisStatut = 'Présélectionné';
  }

  massValider(): void {
    this.selectedCandidates.forEach((c) => {
      c.statut = 'Présélectionné';
    });
    this.clearSelection();
    this.appliquerFiltres();
  }

  clearSelection(): void {
    this.selectedIds = [];
  }

  // Consultation UI helpers
  switchConsultationTab(tab: 'details' | 'documents' | 'timeline'): void {
    this.activeConsultationTab = tab;
  }

  validateDocument(pieceName: string): void {
    this.showToast(`Validation du document: ${pieceName}`);
  }

  addTimelineNote(): void {
    if (!this.newTimelineNote.trim()) return;
    this.timelineEntries.unshift({
      date: new Date().toISOString(),
      author: 'Vous',
      note: this.newTimelineNote.trim(),
    });
    this.newTimelineNote = '';
    this.showToast('Entrée ajoutée à la timeline');
  }

  toggleActionMenu(candidateId: number, event?: Event): void {
    event?.stopPropagation();
    this.activeKebab = this.activeKebab === candidateId ? null : candidateId;
  }

  closeActionMenu(): void {
    this.activeKebab = null;
  }

  onTableClick(): void {
    this.closeActionMenu();
  }

  onPageClick(): void {
    this.closeActionMenu();
  }

  get statistiques(): StatistiqueCard[] {
    return [
      {
        label: 'Total candidatures',
        nombre: this.candidatsList.length,
        theme: 'blue',
        icon: 'fas fa-folder-open',
      },
      {
        label: 'Présélectionnés',
        nombre: this.candidatsList.filter((c) => c.statut === 'Présélectionné').length,
        theme: 'green',
        icon: 'fas fa-circle-check',
      },
      {
        label: 'Refusés',
        nombre: this.candidatsList.filter((c) => c.statut === 'Refusé').length,
        theme: 'red',
        icon: 'fas fa-xmark',
      },
      {
        label: 'Dossiers complets',
        nombre: this.candidatsList.filter((c) => c.etatDossier === 'Complet').length,
        theme: 'amber',
        icon: 'fas fa-folder-check',
      },
    ];
  }

  getStatutBadgeClass(statut: MasterStatus): string {
    const s = (statut || '').toString().toLowerCase();
    // normalize and map to visual classes
    if (
      [
        'validé',
        'validé',
        'admis',
        'preselectionne',
        'pre-sélectionné',
        'pre-selectionne',
        'preselectionné',
        'preselectionné',
        'préselectionné',
        'préselectionne',
        'preselectionne',
      ].includes(s) ||
      s.includes('valid')
    ) {
      return 'status-pill status-pill--ok';
    }
    if (['rejeté', 'rejete', 'rejete', 'rejet', 'rejeté'].includes(s) || s.includes('rej')) {
      return 'status-pill status-pill--danger';
    }
    if (
      ['en attente', 'sous_examen', 'sous-examen', 'en_attente', 'en_attente_dossier'].includes(
        s,
      ) ||
      s.includes('attente') ||
      s.includes('examen')
    ) {
      return 'status-pill status-pill--warn';
    }
    if (['soumis', 'dossier_depose', 'dossier déposé', 'dossier_deposé'].includes(s)) {
      return 'status-pill status-pill--info';
    }
    if (['inscrit', 'inscription'].includes(s)) {
      return 'status-pill status-pill--ok';
    }
    // fallback
    return 'status-pill status-pill--info';
  }

  // -------------------------
  // Dossier consultation helpers (skeletons)
  // -------------------------
  toggleDoc(docName: string): void {
    this.showToast(`Basculer document: ${docName}`);
  }

  validerDoc(docName: string): void {
    this.showToast(`Valider le document: ${docName}`);
  }

  updateProgress(percent: number): void {
    this.showToast(`Progression mise à jour: ${percent}%`);
  }

  addToTimeline(entry: string): void {
    this.showToast(`Ajout timeline: ${entry}`);
  }

  priseDecision(decision: string): void {
    this.showToast(`Décision prise: ${decision}`);
  }

  switchTab(tab: string): void {
    this.showToast(`Onglet: ${tab}`);
  }

  showToast(message: string): void {
    // simple UI feedback for now
    window.alert(message);
  }

  // Export helpers
  genererExcel(): void {
    // Try to use global XLSX if available (lib present in app), otherwise fallback to CSV
    const data = this.candidatsFiltres.map((c) => ({
      numeroCandidature: c.numeroCandidature,
      nom: c.nom,
      master: c.master,
      score: c.score,
      statut: c.statut,
      etatDossier: c.etatDossier,
      email: c.email,
      cin: c.cin,
      dateCandidature: c.dateCandidature,
    }));

    const XLSX = (window as any).XLSX;
    if (XLSX && typeof XLSX.utils !== 'undefined') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidatures');
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'candidatures.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // Fallback CSV
    const headers = Object.keys(data[0] || {});
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const vals = headers.map((h) => {
        const v = (row as any)[h] ?? '';
        return '"' + String(v).replace(/"/g, '""') + '"';
      });
      csvRows.push(vals.join(','));
    }
    const csv = csvRows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidatures.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  genererPDF(): void {
    // Try to use html2canvas + jsPDF when available, otherwise fallback to print
    const jsPDF = (window as any).jsPDF;
    const html2canvas = (window as any).html2canvas || (window as any).html2canvas;

    const table = document.querySelector('.selection-table');
    if (!table) {
      this.showToast('Aucun tableau trouvé pour exporter en PDF.');
      return;
    }

    if (html2canvas && jsPDF) {
      html2canvas(table as HTMLElement, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = (pdf as any).getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('candidatures.pdf');
      });
      return;
    }

    // Fallback: open printable window
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write('<html><head><title>Export PDF</title>');
    w.document.write(
      '<style>table{width:100%;border-collapse:collapse;}td,th{border:1px solid #ddd;padding:8px;}</style>',
    );
    w.document.write('</head><body>');
    w.document.write((table as HTMLElement).outerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    w.print();
  }

  getScoreClass(score: number): string {
    if (score >= 16) return 'score-pill score-pill--green';
    if (score >= 13) return 'score-pill score-pill--amber';
    return 'score-pill score-pill--red';
  }

  getStatusPercent(score: number): number {
    return Math.min(100, Math.max(0, (score / 20) * 100));
  }

  getSpecialiteBadgeLabel(master: string): string {
    if (master.includes('GL')) return 'GL';
    if (master.includes('DSI')) return 'DSI';
    if (master.includes('TI')) return 'TI';
    return master.replace('Master ', '').toUpperCase();
  }
}
