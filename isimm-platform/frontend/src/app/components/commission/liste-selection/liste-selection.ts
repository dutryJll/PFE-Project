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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadListes();
  }

  loadListes(): void {
    // TODO: Charger depuis l'API
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
    console.log('Recherche:', this.recherche);
    // TODO: Filtrer les listes selon la recherche
  }

  imprimerListe(): void {
    console.log('Impression de la liste');
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
    if (this.candidatSelectionne) {
      console.log('Sauvegarde commentaire pour:', this.candidatSelectionne.id, this.commentaire);
      // TODO: Appel API pour sauvegarder
      this.fermerModal();
    }
  }
}
