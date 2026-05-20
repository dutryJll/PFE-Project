import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface PieceJustificative {
  nom: string;
  statut: 'ok' | 'missing';
}

type MasterStatus = 'Validé' | 'En attente' | 'Rejeté';

interface Candidat {
  id: number;
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
  couleur: string;
  icon: string;
}

@Component({
  selector: 'app-candidatures-master',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candidatures-master.component.html',
  styleUrls: ['./candidatures-master.component.css'],
})
export class CandidaturesMasterComponent implements OnInit, OnChanges {
  @Input() availableCommissions: { id: number; nom: string }[] = [];
  @Input() activeCommissionId: number | null = null;

  candidatsList: Candidat[] = [];
  candidatsFiltres: Candidat[] = [];
  selectedIds: number[] = [];
  actionMenuOpenId: number | null = null;

  selectedCommissionId: number | null = null;
  selectedYear = '';
  selectedSpecialite = '';
  filtreStatut = '';
  recherche = '';
  distinctYears: string[] = [];
  availableSpecialites: string[] = [];

  consultationModalOpen = false;
  consultationCandidates: Candidat[] = [];
  consultationIndex = 0;

  avisModalOpen = false;
  avisCandidate: Candidat | null = null;
  avisStatut: MasterStatus = 'Validé';
  avisCommentaire = '';

  ngOnInit(): void {
    this.candidatsList = this.buildMockCandidates();
    this.rebuildDerivedLists();
    this.selectedCommissionId = this.activeCommissionId;
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
      ['Amira', 'Ben Salah', 'GL', 18.7, 'Complet', 'Validé'],
      ['Yassine', 'Trabelsi', 'DSI', 17.9, 'Complet', 'Validé'],
      ['Meriem', 'Khaldi', 'TI', 17.1, 'Complet', 'Validé'],
      ['Omar', 'Jaziri', 'RS', 16.2, 'Complet', 'Validé'],
      ['Nour', 'Cherif', 'GL', 15.8, 'Complet', 'En attente'],
      ['Mahdi', 'Bouzid', 'DSI', 15.1, 'Incomplet', 'En attente'],
      ['Salma', 'Haddad', 'TI', 14.6, 'Incomplet', 'En attente'],
      ['Anis', 'Gharbi', 'RS', 14.1, 'Complet', 'En attente'],
      ['Asma', 'Masmoudi', 'GL', 13.8, 'Incomplet', 'Rejeté'],
      ['Riadh', 'Hamdi', 'DSI', 13.2, 'Incomplet', 'Rejeté'],
      ['Wiem', 'Sassi', 'TI', 12.9, 'Complet', 'Rejeté'],
      ['Hassen', 'Mnif', 'RS', 12.4, 'Incomplet', 'Rejeté'],
      ['Nesrine', 'Brahmi', 'GL', 18.2, 'Complet', 'Validé'],
      ['Sami', 'Ammar', 'DSI', 17.4, 'Complet', 'Validé'],
      ['Imen', 'Ben Youssef', 'TI', 16.8, 'Complet', 'Validé'],
      ['Fares', 'Ouertani', 'RS', 15.6, 'Incomplet', 'En attente'],
      ['Rania', 'Sfar', 'GL', 14.9, 'Complet', 'En attente'],
      ['Mehdi', 'Zidi', 'DSI', 13.6, 'Incomplet', 'Rejeté'],
      ['Ines', 'Karray', 'TI', 18.0, 'Complet', 'Validé'],
      ['Bassem', 'Mansouri', 'RS', 12.2, 'Incomplet', 'Rejeté'],
    ];

    return base.map((item, index) => ({
      id: index + 1,
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
      const matchesCommission = true;
      const matchesYear =
        !this.selectedYear ||
        String(new Date(candidat.dateCandidature).getFullYear()) === String(this.selectedYear);
      const matchesSpecialite =
        !this.selectedSpecialite ||
        candidat.master.replace('Master ', '') === this.selectedSpecialite;
      const matchesStatus = !this.filtreStatut || candidat.statut === this.filtreStatut;
      const matchesSearch =
        !search ||
        candidat.nom.toLowerCase().includes(search) ||
        candidat.email.toLowerCase().includes(search) ||
        candidat.cin.toLowerCase().includes(search);
      return (
        matchesCommission && matchesYear && matchesSpecialite && matchesStatus && matchesSearch
      );
    });

    this.selectedIds = this.selectedIds.filter((id) =>
      this.candidatsFiltres.some((candidat) => candidat.id === id),
    );
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

  get selectedCandidates(): Candidat[] {
    return this.candidatsFiltres.filter((candidat) => this.isSelected(candidat.id));
  }

  get canOpenMassConsultation(): boolean {
    return this.selectedIds.length > 1;
  }

  openMassConsultation(): void {
    const list = this.selectedCandidates;
    if (list.length <= 1) {
      return;
    }
    this.consultationCandidates = list;
    this.consultationIndex = 0;
    this.consultationModalOpen = true;
    this.closeActionMenu();
  }

  openConsultation(candidate: Candidat): void {
    this.consultationCandidates = [candidate];
    this.consultationIndex = 0;
    this.consultationModalOpen = true;
    this.closeActionMenu();
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
    this.avisStatut = 'Validé';
  }

  toggleActionMenu(candidateId: number, event?: Event): void {
    event?.stopPropagation();
    this.actionMenuOpenId = this.actionMenuOpenId === candidateId ? null : candidateId;
  }

  closeActionMenu(): void {
    this.actionMenuOpenId = null;
  }

  onPageClick(): void {
    this.closeActionMenu();
  }

  get statistiques(): StatistiqueCard[] {
    return [
      {
        label: 'Total candidatures',
        nombre: this.candidatsList.length,
        couleur: '#2563eb',
        icon: '👥',
      },
      {
        label: 'Validés',
        nombre: this.candidatsList.filter((candidat) => candidat.statut === 'Validé').length,
        couleur: '#16a34a',
        icon: '✓',
      },
      {
        label: 'En attente',
        nombre: this.candidatsList.filter((candidat) => candidat.statut === 'En attente').length,
        couleur: '#d97706',
        icon: '⏳',
      },
      {
        label: 'Rejetés',
        nombre: this.candidatsList.filter((candidat) => candidat.statut === 'Rejeté').length,
        couleur: '#ef4444',
        icon: '✕',
      },
    ];
  }

  getStatutBadgeClass(statut: MasterStatus): string {
    switch (statut) {
      case 'Validé':
        return 'status-badge status-badge--valid';
      case 'Rejeté':
        return 'status-badge status-badge--reject';
      default:
        return 'status-badge status-badge--pending';
    }
  }

  getScoreClass(score: number): string {
    if (score >= 16) return 'score-pill score-pill--green';
    if (score >= 13) return 'score-pill score-pill--amber';
    return 'score-pill score-pill--red';
  }

  getStatusPercent(score: number): number {
    return Math.min(100, Math.max(0, (score / 20) * 100));
  }
}
