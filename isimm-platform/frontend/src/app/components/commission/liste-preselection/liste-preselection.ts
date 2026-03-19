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
  voeux?: string[];
  specialite?: string;
  score: number;
  monAvis?: 'favorable' | 'neutre' | 'defavorable' | null;
  commentaire?: string;
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

  filtreType: string = '';
  filtreAvis: string = '';

  avisChanged: { [key: number]: 'favorable' | 'neutre' | 'defavorable' | null } = {};

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadCandidats();
  }

  loadCandidats(): void {
    // TODO: Charger depuis l'API
    this.candidats = [
      {
        id: 1,
        first_name: 'Ahmed',
        last_name: 'Ben Ali',
        email: 'ahmed@example.com',
        cin: '12345678',
        type: 'master',
        voeux: ['Master Génie Logiciel', 'Master Data Science'],
        score: 17.5,
        monAvis: null,
        commentaire: '',
      },
      {
        id: 2,
        first_name: 'Fatma',
        last_name: 'Trabelsi',
        email: 'fatma@example.com',
        cin: '87654321',
        type: 'ingenieur',
        specialite: 'Génie Informatique',
        score: 15.2,
        monAvis: null,
        commentaire: '',
      },
      {
        id: 3,
        first_name: 'Mohammed',
        last_name: 'Saidi',
        email: 'mohammed@example.com',
        cin: '11223344',
        type: 'master',
        voeux: ['Master Microélectronique'],
        score: 16.8,
        monAvis: null,
        commentaire: '',
      },
    ];

    this.candidatsFiltres = [...this.candidats];
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
  }

  donnerAvis(candidat: Candidat, avis: 'favorable' | 'neutre' | 'defavorable'): void {
    candidat.monAvis = avis;
    this.avisChanged[candidat.id] = avis;
  }

  voirDossier(id: number): void {
    this.router.navigate(['/commission/dossier', id]);
  }

  voirDetails(id: number): void {
    console.log('Voir détails candidat:', id);
    // TODO: Ouvrir modal ou naviguer vers détails
  }

  sauvegarderAvis(): void {
    console.log('Sauvegarde des avis:', this.avisChanged);
    // TODO: Appel API pour sauvegarder
    this.avisChanged = {};
  }

  hasAvisChanged(): boolean {
    return Object.keys(this.avisChanged).length > 0;
  }
}
