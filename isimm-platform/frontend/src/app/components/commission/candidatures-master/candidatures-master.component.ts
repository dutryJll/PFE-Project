import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SpecialitesService } from '../../../services/specialites.service';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { CandidaturesConsultationModalComponent } from './candidatures-consultation-modal.component';
import { trigger, transition, style, animate } from '@angular/animations';

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
  master: string;
  score: number;
  etat_dossier: 'Complet' | 'Incomplet';
  statut: 'En attente' | 'Admis' | 'Rejeté';
  pieces: PieceJustificative[];
  email?: string;
  cin?: string;
  date_candidature?: string;
}

interface StatistiqueCard {
  label: string;
  nombre: number;
  couleur: string;
  icon: string;
}

// ========================================
// COMPOSANT
// ========================================
@Component({
  selector: 'app-candidatures-master',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule, MatDialogModule],
  templateUrl: './candidatures-master.component.html',
  styleUrls: ['./candidatures-master.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(10px)' }),
        animate('300ms ease-in', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CandidaturesMasterComponent implements OnInit {
  constructor(
    private dialog: MatDialog,
    private specialitesService: SpecialitesService, private http: HttpClient
  ) {}

  @Input() availableCommissions: { id: number; nom: string }[] = [];
  @Input() activeCommissionId: number | null = null;

  // selected commission used for filtering inside the component
  selectedCommissionId: number | null = null;
  // year filter
  distinctYears: string[] = [];
  selectedYear: string = '';
  // specialites
  specialitesData: any = null;
  availableSpecialites: string[] = [];
  selectedSpecialite: string = '';
  // ========================================
  // DONNÉES
  // ========================================
  candidatsList: Candidat[] = [
    {
      id: 1,
      nom: 'Ahmed Ben Ali',
      master: 'Master GL',
      score: 16.5,
      etat_dossier: 'Complet',
      statut: 'En attente',
      email: 'ahmed@example.com',
      cin: '12345678',
      date_candidature: '2026-01-15',
      pieces: [
        { nom: 'Diplôme Licence', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'missing' },
        { nom: 'Certificat de Scolarité', statut: 'ok' },
      ],
    },
    {
      id: 2,
      nom: 'Fatima Karim',
      master: 'Master DS',
      score: 14.2,
      etat_dossier: 'Incomplet',
      statut: 'En attente',
      email: 'fatima@example.com',
      cin: '87654321',
      date_candidature: '2026-01-16',
      pieces: [
        { nom: 'Diplôme Licence', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'missing' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'missing' },
      ],
    },
    {
      id: 3,
      nom: 'Mohamed Saidi',
      master: 'Master 3I',
      score: 17.8,
      etat_dossier: 'Complet',
      statut: 'En attente',
      email: 'mohamed@example.com',
      cin: '11111111',
      date_candidature: '2026-01-17',
      pieces: [
        { nom: 'Diplôme Licence', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'ok' },
      ],
    },
    {
      id: 4,
      nom: 'Zahra Moussa',
      master: 'Master GL',
      score: 12.5,
      etat_dossier: 'Incomplet',
      statut: 'En attente',
      email: 'zahra@example.com',
      cin: '22222222',
      date_candidature: '2026-01-18',
      pieces: [
        { nom: 'Diplôme Licence', statut: 'missing' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'missing' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'ok' },
      ],
    },
    {
      id: 5,
      nom: 'Karim Nasri',
      master: 'Master DS',
      score: 15.3,
      etat_dossier: 'Complet',
      statut: 'Admis',
      email: 'karim@example.com',
      cin: '33333333',
      date_candidature: '2026-01-10',
      pieces: [
        { nom: 'Diplôme Licence', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'ok' },
      ],
    },
  ];

  // ========================================
  // STATE
  // ========================================
  currentIndex: number = 0;
  filtreStatut: string = '';
  filtreEtatDossier: string = '';
  recherche: string = '';

  candidatsFiltres: Candidat[] = [];
  // selection for table -> ids
  selectionSet: Set<number> = new Set<number>();
  selectAll: boolean = false;

  // viewing mode for consulter selection
  viewingSelection: boolean = false;
  viewingList: Candidat[] = [];

  // ========================================
  // LIFECYCLE
  // ========================================
  ngOnInit(): void {
    this.appliquerFiltres();
    // subscribe to SpecialitesService for specialties mapping
    this.specialitesService.getSpecialitesData().subscribe((data: any) => {
      this.specialitesData = data || {};
      this.recomputeAvailableSpecialites();
    });
    // initialize selected commission from input
    if (!this.selectedCommissionId && this.activeCommissionId) {
      this.selectedCommissionId = this.activeCommissionId;
    }
    // build year list from candidats
    const years = new Set<string>();
    this.candidatsList.forEach((c) => {
      if (c.date_candidature) {
        const y = new Date(c.date_candidature).getFullYear();
        if (Number.isFinite(y)) years.add(String(y));
      }
    });
    this.distinctYears = Array.from(years).sort((a, b) => Number(b) - Number(a));
    // load specialties via SpecialitesService if available
    this.http.get('/assets/specialites.json').subscribe((data: any) => {
      this.specialitesData = data || {};
      this.recomputeAvailableSpecialites();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeCommissionId'] && !changes['activeCommissionId'].isFirstChange()) {
      this.selectedCommissionId = this.activeCommissionId;
      this.appliquerFiltres();
    }
    if (changes['availableCommissions'] && !changes['availableCommissions'].isFirstChange()) {
      // keep selection consistent
      if (!this.selectedCommissionId && this.availableCommissions.length > 0) {
        this.selectedCommissionId = this.activeCommissionId || this.availableCommissions[0].id;
      }
      this.appliquerFiltres();
    }
  }

  private recomputeAvailableSpecialites(): void {
    const set = new Set<string>();
    if (!this.specialitesData) return;
    // prefer using currently filtered masters to derive specialities
    const source = this.candidatsList;
    source.forEach((c) => {
      const arr = this.specialitesData.master?.[c.master];
      if (Array.isArray(arr)) arr.forEach((s: string) => set.add(s));
    });
    this.availableSpecialites = Array.from(set).sort();
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
    const c = this.candidatActuel;
    if (c) {
      c.statut = 'Admis';
      this.nextCandidat();
    }
  }

  refuserCandidat(): void {
    const c = this.candidatActuel;
    if (c) {
      c.statut = 'Rejeté';
      this.nextCandidat();
    }
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
          c.cin?.includes(terme),
      );
    }

    // Filtre par année de candidature
    if (this.selectedYear) {
      resultats = resultats.filter((c) => {
        if (!c.date_candidature) return false;
        const y = new Date(c.date_candidature).getFullYear();
        return String(y) === String(this.selectedYear);
      });
    }

    // Filtre par commission si une est sélectionnée (si disponible)
    if (
      this.selectedCommissionId &&
      Array.isArray(this.availableCommissions) &&
      this.availableCommissions.length > 0
    ) {
      const comm = this.availableCommissions.find(
        (co) => Number(co.id) === Number(this.selectedCommissionId),
      );
      const commName = comm ? String(comm.nom || '').toLowerCase() : '';
      if (commName) {
        resultats = resultats.filter((c) =>
          String(c.master || '')
            .toLowerCase()
            .includes(commName),
        );
      }
    }

    // Filtre par spécialité
    if (this.selectedSpecialite) {
      resultats = resultats.filter((c) => {
        const arr = this.specialitesData?.master?.[c.master] || [];
        return arr.includes(this.selectedSpecialite);
      });
    }

    this.candidatsFiltres = resultats;

    // Réinitialiser l'index si nécessaire
    if (this.currentIndex >= this.candidatsFiltres.length && this.candidatsFiltres.length > 0) {
      this.currentIndex = 0;
    }
  }

  // ========================================
  // SELECTION TABLE
  // ========================================
  toggleSelect(c: Candidat): void {
    if (this.selectionSet.has(c.id)) {
      this.selectionSet.delete(c.id);
    } else {
      this.selectionSet.add(c.id);
    }
    this.selectAll =
      this.selectionSet.size === this.candidatsFiltres.length && this.candidatsFiltres.length > 0;
  }

  toggleSelectAll(): void {
    if (this.selectAll) {
      // unselect all
      this.selectionSet.clear();
      this.selectAll = false;
      return;
    }
    // select all visible
    this.candidatsFiltres.forEach((c) => this.selectionSet.add(c.id));
    this.selectAll = true;
  }

  // Consulter sélection ou tout
  consulterSelection(): void {
    let list: Candidat[] = [];
    if (this.selectAll || this.selectionSet.size === 0) {
      // empty selection -> consult all filtered
      list = [...this.candidatsFiltres];
    } else {
      list = this.candidatsFiltres.filter((c) => this.selectionSet.has(c.id));
    }
    if (list.length === 0) return;
    // open modal dialog for mass consultation
    const dialogRef = this.dialog.open(CandidaturesConsultationModalComponent, {
      data: { list, startIndex: 0 },
      width: '760px',
    });
    dialogRef.afterClosed().subscribe((res) => {
      // refresh local filters in case statuses changed in modal
      this.appliquerFiltres();
      this.selectionSet.clear();
      this.selectAll = false;
    });
  }

  consulterUn(c: Candidat): void {
    this.viewingList = [c];
    this.viewingSelection = true;
    this.currentIndex = 0;
  }

  fermerConsultation(): void {
    this.viewingSelection = false;
    this.viewingList = [];
    this.currentIndex = 0;
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
        label: 'Total Candidatures',
        nombre: this.candidatsList.length,
        couleur: '#378ADD',
        icon: '📋',
      },
      {
        label: 'Dossiers Complets',
        nombre: this.candidatsList.filter((c) => c.etat_dossier === 'Complet').length,
        couleur: '#22C55E',
        icon: '✓',
      },
      {
        label: 'À Vérifier',
        nombre: this.candidatsList.filter((c) => c.statut === 'En attente').length,
        couleur: '#F59E0B',
        icon: '⏳',
      },
      {
        label: 'Rejetés',
        nombre: this.candidatsList.filter((c) => c.statut === 'Rejeté').length,
        couleur: '#EF4444',
        icon: '✕',
      },
    ];
  }

  // ========================================
  // GETTERS
  // ========================================
  get candidatActuel(): Candidat | undefined {
    return this.candidatsFiltres[this.currentIndex];
  }

  get totalCandidatures(): number {
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
    switch (statut) {
      case 'Admis':
        return 'badge-admis';
      case 'Rejeté':
        return 'badge-rejete';
      default:
        return 'badge-attente';
    }
  }

  getScoreColor(): string {
    const score = this.candidatActuel?.score || 0;
    if (score >= 16) return '#22C55E';
    if (score >= 13) return '#F59E0B';
    return '#EF4444';
  }

  getStatutBoutons(): { accepter: boolean; refuser: boolean } {
    const statut = this.candidatActuel?.statut;
    return {
      accepter: statut === 'En attente',
      refuser: statut === 'En attente',
    };
  }
}
