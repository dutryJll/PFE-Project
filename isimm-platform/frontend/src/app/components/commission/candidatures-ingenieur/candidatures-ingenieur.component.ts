import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  numeroInscription: string;
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

  // ========================================
  // LIFECYCLE
  // ========================================
  constructor(private commissionContext: CommissionContextService) {}

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
        'Génie Logiciel' | 'Informatique Industrielle' | 'Réseaux',
        number,
        'Complet' | 'Incomplet',
        'En attente' | 'Admis' | 'Rejeté',
      ]
    > = [
      ['Amina', 'Boucher', 'Génie Logiciel', 17.8, 'Complet', 'En attente'],
      ['Riyad', 'Khalil', 'Informatique Industrielle', 15.8, 'Incomplet', 'En attente'],
      ['Nadia', 'Mansour', 'Réseaux', 18.5, 'Complet', 'Admis'],
      ['Issam', 'Ould', 'Génie Logiciel', 14.1, 'Incomplet', 'En attente'],
      ['Meriem', 'Sassi', 'Informatique Industrielle', 16.4, 'Complet', 'Admis'],
      ['Yassine', 'Ben Amor', 'Réseaux', 13.8, 'Incomplet', 'Rejeté'],
      ['Sara', 'Brahmi', 'Génie Logiciel', 18.2, 'Complet', 'Admis'],
      ['Anis', 'Gharbi', 'Informatique Industrielle', 12.9, 'Incomplet', 'Rejeté'],
      ['Wiem', 'Karray', 'Réseaux', 15.3, 'Complet', 'En attente'],
      ['Omar', 'Jaziri', 'Génie Logiciel', 17.1, 'Complet', 'Admis'],
      ['Asma', 'Masmoudi', 'Informatique Industrielle', 14.7, 'Incomplet', 'En attente'],
      ['Bassem', 'Mansouri', 'Réseaux', 11.8, 'Incomplet', 'Rejeté'],
      ['Ines', 'Khelifi', 'Génie Logiciel', 16.9, 'Complet', 'Admis'],
      ['Fares', 'Haddad', 'Informatique Industrielle', 15.1, 'Complet', 'En attente'],
      ['Nour', 'Miled', 'Réseaux', 18.7, 'Complet', 'Admis'],
      ['Mehdi', 'Zidi', 'Génie Logiciel', 13.4, 'Incomplet', 'Rejeté'],
      ['Rania', 'Trabelsi', 'Informatique Industrielle', 16.1, 'Complet', 'Admis'],
      ['Khalil', 'Hamdi', 'Réseaux', 14.3, 'Incomplet', 'En attente'],
      ['Lina', 'Ben Youssef', 'Génie Logiciel', 17.4, 'Complet', 'Admis'],
      ['Sami', 'Ouertani', 'Informatique Industrielle', 12.6, 'Incomplet', 'Rejeté'],
    ];

    return base.map((item, index) => ({
      id: index + 1,
      nom: `${item[0]} ${item[1]}`,
      numeroInscription: `2603-${String(index + 21).padStart(5, '0')}-ING-${
        item[2] === 'Génie Logiciel' ? 'GL' : item[2] === 'Informatique Industrielle' ? 'II' : 'RES'
      }`,
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
  }

  fermerConsultation(): void {
    this.viewingSelection = false;
    this.viewingList = [];
    this.currentIndex = 0;
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
        label: 'Total Ingénieurs',
        nombre: this.candidatsFiltres.length,
        couleur: '#8b5cf6',
        icon: '📋',
      },
      {
        label: 'Dossiers Complets',
        nombre: this.candidatsFiltres.filter((c) => c.etat_dossier === 'Complet').length,
        couleur: '#22C55E',
        icon: '✓',
      },
      {
        label: 'À Vérifier',
        nombre: this.candidatsFiltres.filter((c) => c.statut === 'En attente').length,
        couleur: '#F59E0B',
        icon: '⏳',
      },
      {
        label: 'Rejetés',
        nombre: this.candidatsFiltres.filter((c) => c.statut === 'Rejeté').length,
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
