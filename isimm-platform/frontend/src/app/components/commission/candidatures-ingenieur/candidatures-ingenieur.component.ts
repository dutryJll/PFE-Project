import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  specialite: string;
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
  selector: 'app-candidatures-ingenieur',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
  // ========================================
  // DONNÉES
  // ========================================
  candidatsList: Candidat[] = [
    {
      id: 1,
      nom: 'Amina Boucher',
      specialite: 'Génie Logiciel',
      score: 17.2,
      etat_dossier: 'Complet',
      statut: 'En attente',
      email: 'amina@example.com',
      cin: '11223344',
      date_candidature: '2026-02-01',
      pieces: [
        { nom: 'Diplôme BAC', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'missing' },
      ],
    },
    {
      id: 2,
      nom: 'Riyad Khalil',
      specialite: 'Système Embarqué',
      score: 15.8,
      etat_dossier: 'Incomplet',
      statut: 'En attente',
      email: 'riyad@example.com',
      cin: '44556677',
      date_candidature: '2026-02-02',
      pieces: [
        { nom: 'Diplôme BAC', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'missing' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'ok' },
      ],
    },
    {
      id: 3,
      nom: 'Nadia Mansour',
      specialite: 'Architecture Logicielle',
      score: 18.5,
      etat_dossier: 'Complet',
      statut: 'Admis',
      email: 'nadia@example.com',
      cin: '77889900',
      date_candidature: '2026-01-28',
      pieces: [
        { nom: 'Diplôme BAC', statut: 'ok' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'ok' },
        { nom: 'CV', statut: 'ok' },
        { nom: 'Certificat de Scolarité', statut: 'ok' },
      ],
    },
    {
      id: 4,
      nom: 'Issam Ould',
      specialite: 'DevOps et Cloud',
      score: 14.1,
      etat_dossier: 'Incomplet',
      statut: 'En attente',
      email: 'issam@example.com',
      cin: '99001122',
      date_candidature: '2026-02-03',
      pieces: [
        { nom: 'Diplôme BAC', statut: 'missing' },
        { nom: 'Relevé de Notes', statut: 'ok' },
        { nom: 'Lettre de Motivation', statut: 'missing' },
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
  selectionSet: Set<number> = new Set<number>();
  selectAll: boolean = false;
  viewingSelection: boolean = false;
  viewingList: Candidat[] = [];

  // ========================================
  // LIFECYCLE
  // ========================================
  ngOnInit(): void {
    this.appliquerFiltres();
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
      this.candidatActuel.statut = 'Admis';
      this.nextCandidat();
    }
  }

  refuserCandidat(): void {
    if (this.candidatActuel) {
      this.candidatActuel.statut = 'Rejeté';
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
    let list: Candidat[] = [];
    if (this.selectAll || this.selectionSet.size === 0) {
      list = [...this.candidatsFiltres];
    } else {
      list = this.candidatsFiltres.filter((c) => this.selectionSet.has(c.id));
    }

    if (list.length === 0) {
      return;
    }

    this.viewingList = list;
    this.viewingSelection = true;
    this.currentIndex = 0;
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
        couleur: '#8b5cf6',
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
    const list = this.viewingSelection ? this.viewingList : this.candidatsFiltres;
    return list[this.currentIndex];
  }

  get totalCandidatures(): number {
    return this.viewingSelection ? this.viewingList.length : this.candidatsFiltres.length;
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
