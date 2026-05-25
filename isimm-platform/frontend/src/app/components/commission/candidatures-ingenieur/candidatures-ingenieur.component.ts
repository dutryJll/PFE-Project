import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { trigger, transition, style, animate } from '@angular/animations';
import {
  CommissionContextService,
  CommissionContextOption,
} from '../../../services/commission-context.service';

// ========================================
// INTERFACES
// ========================================
interface PieceJustificative {
  nom: string;
  statut: 'ok' | 'missing';
}

interface Candidat {
  id: number;
  nom: string;
  numeroCandidature: string;
  numeroInscription: string;
  specialite: string;
  score: number;
  etat_dossier: 'Complet' | 'Incomplet';
  statut: 'Présélectionné' | 'Refusé';
  pieces: PieceJustificative[];
  email?: string;
  cin?: string;
  date_candidature?: string;
}

interface StatistiqueCard {
  label: string;
  nombre: number;
  theme: 'blue' | 'green' | 'amber' | 'red';
  icon: string;
}

// ========================================
// COMPOSANT
// ========================================
@Component({
  selector: 'app-candidatures-ingenieur',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candidatures-ingenieur.component.html',
  styleUrls: ['./candidatures-ingenieur.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CandidaturesIngenieurComponent implements OnInit {
  availableSpecialites: string[] = [];
  selectedSpecialite: string = '';
  filtreStatut: string = '';
  filtreEtatDossier: string = '';
  recherche = '';
  private activeCommissionCategory: CommissionContextOption['category'] | null = null;
  // ========================================
  // DONNÉES
  // ========================================
  candidatsList: Candidat[] = [];

  // ========================================
  // STATE
  // ========================================
  currentIndex: number = 0;
  candidatsFiltres: Candidat[] = [];
  selectionSet: Set<number> = new Set<number>();
  selectAll: boolean = false;
  viewingSelection: boolean = false;
  viewingList: Candidat[] = [];
  activeKebab: number | null = null;
  // consultation UI
  activeConsultationTab: 'details' | 'documents' | 'timeline' = 'details';
  timelineEntries: Array<{ date: string; author: string; note: string }> = [];
  newTimelineNote = '';
  generateListOpen = false;

  // ========================================
  // LIFECYCLE
  // ========================================
  constructor(
    private commissionContext: CommissionContextService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.candidatsList = this.buildMockCandidates();
    this.availableSpecialites = Array.from(
      new Set(this.candidatsList.map((c) => c.specialite)),
    ).sort();
    this.appliquerFiltres();
    this.commissionContext.activeCommissionId$.subscribe((commissionId) => {
      this.activeCommissionCategory = this.getCommissionCategoryFromId(commissionId);
      this.appliquerFiltres();
    });
  }

  private buildMockCandidates(): Candidat[] {
    const base: Array<
      [
        string,
        string,
        'GL' | 'TI' | 'DSI',
        number,
        'Complet' | 'Incomplet',
        'Présélectionné' | 'Refusé',
      ]
    > = [
      ['Amina', 'Boucher', 'GL', 17.8, 'Complet', 'Présélectionné'],
      ['Riyad', 'Khalil', 'TI', 15.8, 'Incomplet', 'Présélectionné'],
      ['Nadia', 'Mansour', 'DSI', 18.5, 'Complet', 'Présélectionné'],
      ['Issam', 'Ould', 'GL', 14.1, 'Incomplet', 'Présélectionné'],
      ['Meriem', 'Sassi', 'TI', 16.4, 'Complet', 'Présélectionné'],
      ['Yassine', 'Ben Amor', 'DSI', 13.8, 'Incomplet', 'Refusé'],
      ['Sara', 'Brahmi', 'GL', 18.2, 'Complet', 'Présélectionné'],
      ['Anis', 'Gharbi', 'TI', 12.9, 'Incomplet', 'Refusé'],
      ['Wiem', 'Karray', 'DSI', 15.3, 'Complet', 'Présélectionné'],
      ['Omar', 'Jaziri', 'GL', 17.1, 'Complet', 'Présélectionné'],
      ['Asma', 'Masmoudi', 'TI', 14.7, 'Incomplet', 'Présélectionné'],
      ['Bassem', 'Mansouri', 'DSI', 11.8, 'Incomplet', 'Refusé'],
      ['Ines', 'Khelifi', 'GL', 16.9, 'Complet', 'Présélectionné'],
      ['Fares', 'Haddad', 'TI', 15.1, 'Complet', 'Présélectionné'],
      ['Nour', 'Miled', 'DSI', 18.7, 'Complet', 'Présélectionné'],
      ['Mehdi', 'Zidi', 'GL', 13.4, 'Incomplet', 'Refusé'],
      ['Rania', 'Trabelsi', 'TI', 16.1, 'Complet', 'Présélectionné'],
      ['Khalil', 'Hamdi', 'DSI', 14.3, 'Incomplet', 'Refusé'],
      ['Lina', 'Ben Youssef', 'GL', 17.4, 'Complet', 'Présélectionné'],
      ['Sami', 'Ouertani', 'TI', 12.6, 'Incomplet', 'Refusé'],
    ];

    return base.map((item, index) => ({
      id: index + 1,
      nom: `${item[0]} ${item[1]}`,
      numeroCandidature: `2603-${String(index + 1).padStart(5, '0')}-${item[2]}`,
      numeroInscription: `2603-${String(index + 21).padStart(5, '0')}-ING-${item[2]}`,
      specialite: item[2],
      score: item[3],
      etat_dossier: item[4],
      statut: item[5],
      email: `${item[0].toLowerCase()}.${item[1].toLowerCase().replace(/\s+/g, '.')}@example.com`,
      cin: `${33000000 + index}`,
      date_candidature: `2026-02-${String(1 + (index % 18)).padStart(2, '0')}`,
      pieces: [
        { nom: 'Diplôme BAC', statut: index % 4 === 0 ? 'missing' : 'ok' },
        { nom: 'Relevé de Notes', statut: index % 5 === 0 ? 'missing' : 'ok' },
        { nom: 'Lettre de Motivation', statut: index % 6 === 0 ? 'missing' : 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: index % 3 === 0 ? 'missing' : 'ok' },
      ],
    }));
  }

  // ========================================
  // NAVIGATION CAROUSEL
  // ========================================
  nextCandidat(): void {
    const list = this.viewingSelection ? this.viewingList : this.candidatsFiltres;
    if (list.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % list.length;
    }
  }

  prevCandidat(): void {
    const list = this.viewingSelection ? this.viewingList : this.candidatsFiltres;
    if (list.length > 0) {
      this.currentIndex = (this.currentIndex - 1 + list.length) % list.length;
    }
  }

  // ========================================
  // ACTIONS DE VALIDATION
  // ========================================
  accepterCandidat(): void {
    if (this.candidatActuel) {
      this.candidatActuel.statut = 'Présélectionné';
      this.nextCandidat();
    }
  }

  refuserCandidat(): void {
    if (this.candidatActuel) {
      this.candidatActuel.statut = 'Refusé';
      this.nextCandidat();
    }
  }

  massValider(): void {
    this.candidatsFiltres
      .filter((c) => this.selectionSet.has(c.id))
      .forEach((c) => { c.statut = 'Présélectionné'; });
    this.clearSelection();
    this.appliquerFiltres();
  }

  clearSelection(): void {
    this.selectionSet.clear();
    this.selectAll = false;
  }

  // ========================================
  // FILTRES
  // ========================================
  appliquerFiltres(): void {
    let resultats = [...this.candidatsList];

    // Filtre par statut
    if (this.filtreStatut) {
      resultats = resultats.filter((c) => c.statut === this.filtreStatut);
    }

    // Filtre par état dossier
    if (this.filtreEtatDossier) {
      resultats = resultats.filter((c) => c.etat_dossier === this.filtreEtatDossier);
    }

    // Filtre par recherche (nom, email, cin)
    if (this.recherche.trim()) {
      const terme = this.recherche.toLowerCase();
      resultats = resultats.filter(
        (c) =>
          c.nom.toLowerCase().includes(terme) ||
          c.email?.toLowerCase().includes(terme) ||
          c.cin?.includes(terme) ||
          c.numeroCandidature?.toLowerCase().includes(terme) ||
          c.numeroInscription?.toLowerCase().includes(terme) ||
          c.specialite?.toLowerCase().includes(terme) ||
          c.etat_dossier?.toLowerCase().includes(terme),
      );
    }

    // Filtre par spécialité
    if (this.selectedSpecialite) {
      resultats = resultats.filter((c) => c.specialite === this.selectedSpecialite);
    }

    this.candidatsFiltres = resultats;

    // Réinitialiser l'index si nécessaire
    if (this.currentIndex >= this.candidatsFiltres.length && this.candidatsFiltres.length > 0) {
      this.currentIndex = 0;
    }

    this.selectAll =
      this.selectionSet.size === this.candidatsFiltres.length && this.candidatsFiltres.length > 0;
  }

  toggleSelect(c: Candidat): void {
    if (this.selectionSet.has(c.id)) {
      this.selectionSet.delete(c.id);
    } else {
      this.selectionSet.add(c.id);
    }
    this.selectAll =
      this.selectionSet.size === this.candidatsFiltres.length && this.candidatsFiltres.length > 0;
  }

  isSelected(id: number): boolean {
    return this.selectionSet.has(id);
  }

  isAllVisibleSelected(): boolean {
    return (
      this.candidatsFiltres.length > 0 && this.selectionSet.size === this.candidatsFiltres.length
    );
  }

  toggleGenerateListMenu(): void {
    this.generateListOpen = !this.generateListOpen;
  }

  genererListe(mode: 'all' | 'selection'): void {
    const count =
      mode === 'all'
        ? this.candidatsFiltres.length
        : this.viewingSelection
          ? this.viewingList.length
          : this.candidatsFiltres.filter((c) => this.selectionSet.has(c.id)).length;
    window.alert(`Génération de la liste (${mode}) — ${count} éléments`);
    this.generateListOpen = false;
  }

  telechargerZIP(): void {
    const count = this.selectionSet.size || this.candidatsFiltres.length;
    window.alert(`Téléchargement ZIP lancé pour ${count} candidature(s)`);
  }

  // showToast utility
  showToast(message: string): void {
    window.alert(message);
  }

  // Export helpers
  genererExcel(): void {
    const data = this.candidatsFiltres.map((c) => ({
      numeroCandidature: c.numeroCandidature,
      nom: c.nom,
      specialite: c.specialite,
      score: c.score,
      statut: c.statut,
      etatDossier: c.etat_dossier,
      email: c.email,
      cin: c.cin,
      dateCandidature: c.date_candidature,
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
    const headers = Object.keys(data[0] || {});
    const csvRows = [headers.join(',')];
    for (const row of data) {
      const vals = headers.map(
        (h) => '"' + String((row as any)[h] ?? '').replace(/"/g, '""') + '"',
      );
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

  toggleSelectAll(): void {
    if (this.selectAll) {
      this.selectionSet.clear();
      this.selectAll = false;
      return;
    }

    this.candidatsFiltres.forEach((c) => this.selectionSet.add(c.id));
    this.selectAll = true;
  }

  consulterSelection(): void {
    const list = this.selectionSet.size
      ? this.candidatsFiltres.filter((c) => this.selectionSet.has(c.id))
      : [...this.candidatsFiltres];
    if (list.length === 0) return;
    this.viewingSelection = true;
    this.viewingList = list;
    this.currentIndex = 0;
  }

  consulterUn(c: Candidat): void {
    this.viewingSelection = true;
    this.viewingList = [c];
    this.currentIndex = 0;
    this.activeKebab = null;
  }

  fermerConsultation(): void {
    this.viewingSelection = false;
    this.viewingList = [];
    this.currentIndex = 0;
  }

  openConsultation(c: Candidat): void {
    this.activeKebab = null;
    this.router.navigate(['/commission/dossier', c.id], {
      queryParams: { source: 'commission', type: 'ingenieur' },
    });
  }

  closeConsultation(): void {
    this.fermerConsultation();
  }

  toggleActionMenu(candidatId: number, event: MouseEvent): void {
    event.stopPropagation();
    this.activeKebab = this.activeKebab === candidatId ? null : candidatId;
  }

  onPageClick(): void {
    this.activeKebab = null;
  }

  get canOpenMassConsultation(): boolean {
    return this.selectionSet.size > 0;
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
    this.filtreStatut = '';
    this.filtreEtatDossier = '';
    this.recherche = '';
    this.currentIndex = 0;
    this.appliquerFiltres();
  }

  // ========================================
  // STATISTIQUES DYNAMIQUES
  // ========================================
  get statistiques(): StatistiqueCard[] {
    return [
      {
        label: 'Total candidatures',
        nombre: this.candidatsFiltres.length,
        theme: 'blue',
        icon: 'fas fa-folder-open',
      },
      {
        label: 'Présélectionnés',
        nombre: this.candidatsFiltres.filter((c) => c.statut === 'Présélectionné').length,
        theme: 'green',
        icon: 'fas fa-circle-check',
      },
      {
        label: 'Refusés',
        nombre: this.candidatsFiltres.filter((c) => c.statut === 'Refusé').length,
        theme: 'red',
        icon: 'fas fa-xmark',
      },
      {
        label: 'Dossiers complets',
        nombre: this.candidatsFiltres.filter((c) => c.etat_dossier === 'Complet').length,
        theme: 'amber',
        icon: 'fas fa-folder-check',
      },
    ];
  }

  // ========================================
  // GETTERS
  // ========================================
  get candidatActuel(): Candidat | undefined {
    const list = this.viewingSelection ? this.viewingList : this.candidatsFiltres;
    return list[this.currentIndex];
  }

  get totalCandidatures(): number {
    return this.viewingSelection ? this.viewingList.length : this.candidatsFiltres.length;
  }

  get filteredCount(): number {
    return this.candidatsFiltres.length;
  }

  get numeroActuel(): number {
    return this.currentIndex + 1;
  }

  get piecesOk(): number {
    return this.candidatActuel?.pieces.filter((p) => p.statut === 'ok').length || 0;
  }

  get piecesTotales(): number {
    return this.candidatActuel?.pieces.length || 0;
  }

  get scorePercentage(): number {
    return ((this.candidatActuel?.score || 0) / 20) * 100;
  }

  // ========================================
  // STYLE DYNAMIQUE
  // ========================================
  getEtatBadgeClass(etat: string): string {
    return etat === 'Complet' ? 'badge-complet' : 'badge-incomplet';
  }

  getStatutBadgeClass(statut: string): string {
    if (statut === 'Présélectionné') return 'status-pill status-pill--ok';
    if (statut === 'Refusé') return 'status-pill status-pill--danger';
    return 'status-pill status-pill--info';
  }

  getScoreClass(score: number): string {
    if (score >= 16) return 's-good';
    if (score >= 13) return 's-mid';
    return 's-low';
  }

  getStatusPercent(score: number): number {
    return Math.max(0, Math.min(100, (score / 20) * 100));
  }

  getSpecialiteBadgeLabel(specialite: string): string {
    return specialite;
  }

  getScoreColor(): string {
    const score = this.candidatActuel?.score || 0;
    if (score >= 16) return '#22C55E';
    if (score >= 13) return '#F59E0B';
    return '#EF4444';
  }

  getStatutBoutons(): { accepter: boolean; refuser: boolean } {
    return { accepter: true, refuser: true };
  }

  // Consultation helpers
  toggleDoc(docName: string): void {
    this.showToast(`Basculer document: ${docName}`);
  }

  validateDocument(docName: string): void {
    this.showToast(`Validation du document: ${docName}`);
  }

  addTimelineNote(): void {
    if (!this.newTimelineNote || !this.newTimelineNote.trim()) return;
    this.timelineEntries.unshift({
      date: new Date().toISOString(),
      author: 'Vous',
      note: this.newTimelineNote.trim(),
    });
    this.newTimelineNote = '';
    this.showToast('Entrée ajoutée à la timeline');
  }
}
