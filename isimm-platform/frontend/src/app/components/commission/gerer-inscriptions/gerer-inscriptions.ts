import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

interface Inscrit {
  id: number;
  prenom: string;
  nom: string;
  cin: string;
  email: string;
  telephone?: string;
  type: 'master' | 'ingenieur';
  master_id?: number;
  master_nom?: string;
  specialite?: string;
  score: number;
  rang: number;
  date_inscription: string;
  date_confirmation?: string;
  statut: 'en_attente' | 'confirme' | 'annule';
  selected?: boolean;
}

@Component({
  selector: 'app-gerer-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './gerer-inscriptions.html',
  styleUrl: './gerer-inscriptions.css',
})
export class GererInscriptionsComponent implements OnInit {
  inscrits: Inscrit[] = [];
  inscritsFiltres: Inscrit[] = [];
  masters: any[] = [];

  recherche: string = '';
  filtreType: string = '';
  filtreMaster: string = '';
  filtreStatut: string = '';

  showModalAjouter: boolean = false;
  showModalDetails: boolean = false;
  inscritSelectionne: Inscrit | null = null;

  nouveauInscrit: any = {
    prenom: '',
    nom: '',
    cin: '',
    email: '',
    type: '',
    master_id: '',
    specialite: '',
    score: null,
    rang: null,
    statut: 'en_attente',
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadMasters();
    this.loadInscrits();
  }

  loadMasters(): void {
    // TODO: Charger depuis l'API
    this.masters = [
      { id: 1, nom: 'Master Recherche Génie Logiciel' },
      { id: 2, nom: 'Master Professionnel Data Science' },
      { id: 3, nom: 'Master Recherche Microélectronique' },
      { id: 4, nom: 'Master Professionnel Intelligence Artificielle' },
    ];
  }

  loadInscrits(): void {
    // TODO: Charger depuis l'API
    // this.commissionService.getInscriptions().subscribe({...})

    // Données simulées
    this.inscrits = [
      {
        id: 1,
        prenom: 'Ahmed',
        nom: 'Ben Ali',
        cin: '12345678',
        email: 'ahmed@example.com',
        telephone: '+216 98 765 432',
        type: 'master',
        master_id: 1,
        master_nom: 'Master Recherche Génie Logiciel',
        score: 17.5,
        rang: 1,
        date_inscription: '2026-03-01T10:30:00',
        date_confirmation: '2026-03-02',
        statut: 'confirme',
      },
      {
        id: 2,
        prenom: 'Fatma',
        nom: 'Trabelsi',
        cin: '87654321',
        email: 'fatma@example.com',
        type: 'master',
        master_id: 2,
        master_nom: 'Master Professionnel Data Science',
        score: 16.8,
        rang: 2,
        date_inscription: '2026-03-01T11:15:00',
        statut: 'en_attente',
      },
      {
        id: 3,
        prenom: 'Mohamed',
        nom: 'Karoui',
        cin: '11223344',
        email: 'mohamed@example.com',
        type: 'ingenieur',
        specialite: 'Génie Informatique',
        score: 16.2,
        rang: 3,
        date_inscription: '2026-03-01T14:20:00',
        date_confirmation: '2026-03-02',
        statut: 'confirme',
      },
      {
        id: 4,
        prenom: 'Sarra',
        nom: 'Mansouri',
        cin: '99887766',
        email: 'sarra@example.com',
        type: 'master',
        master_id: 3,
        master_nom: 'Master Recherche Microélectronique',
        score: 15.9,
        rang: 4,
        date_inscription: '2026-03-02T09:00:00',
        statut: 'en_attente',
      },
      {
        id: 5,
        prenom: 'Youssef',
        nom: 'Bouzid',
        cin: '55443322',
        email: 'youssef@example.com',
        type: 'ingenieur',
        specialite: 'Génie Électrique',
        score: 15.5,
        rang: 5,
        date_inscription: '2026-03-02T10:30:00',
        statut: 'annule',
      },
    ];

    this.inscritsFiltres = [...this.inscrits];
    console.log('✅ Inscrits chargés:', this.inscrits.length);
  }

  filtrerInscrits(): void {
    this.inscritsFiltres = this.inscrits.filter((i) => {
      const matchRecherche =
        !this.recherche ||
        i.prenom.toLowerCase().includes(this.recherche.toLowerCase()) ||
        i.nom.toLowerCase().includes(this.recherche.toLowerCase()) ||
        i.cin.includes(this.recherche) ||
        i.email.toLowerCase().includes(this.recherche.toLowerCase());

      const matchType = !this.filtreType || i.type === this.filtreType;
      const matchMaster = !this.filtreMaster || i.master_id?.toString() === this.filtreMaster;
      const matchStatut = !this.filtreStatut || i.statut === this.filtreStatut;

      return matchRecherche && matchType && matchMaster && matchStatut;
    });
  }

  countByType(type: string): number {
    return this.inscrits.filter((i) => i.type === type).length;
  }

  countByStatut(statut: string): number {
    return this.inscrits.filter((i) => i.statut === statut).length;
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      en_attente: 'En attente',
      confirme: 'Confirmé',
      annule: 'Annulé',
    };
    return labels[statut] || statut;
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.inscritsFiltres.forEach((i) => (i.selected = checked));
  }

  hasSelection(): boolean {
    return this.inscritsFiltres.some((i) => i.selected);
  }

  countSelected(): number {
    return this.inscritsFiltres.filter((i) => i.selected).length;
  }

  ouvrirModalAjouter(): void {
    this.nouveauInscrit = {
      prenom: '',
      nom: '',
      cin: '',
      email: '',
      type: '',
      master_id: '',
      specialite: '',
      score: null,
      rang: null,
      statut: 'en_attente',
    };
    this.showModalAjouter = true;
  }

  fermerModal(): void {
    this.showModalAjouter = false;
    this.showModalDetails = false;
    this.inscritSelectionne = null;
  }

  onTypeChange(): void {
    this.nouveauInscrit.master_id = '';
    this.nouveauInscrit.specialite = '';
  }

  isFormValid(): boolean {
    const base =
      this.nouveauInscrit.prenom &&
      this.nouveauInscrit.nom &&
      this.nouveauInscrit.cin &&
      this.nouveauInscrit.email &&
      this.nouveauInscrit.type &&
      this.nouveauInscrit.score;

    if (this.nouveauInscrit.type === 'master') {
      return base && this.nouveauInscrit.master_id;
    } else if (this.nouveauInscrit.type === 'ingenieur') {
      return base && this.nouveauInscrit.specialite;
    }

    return false;
  }

  ajouterInscrit(): void {
    if (!this.isFormValid()) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    console.log('➕ Ajout inscription:', this.nouveauInscrit);

    // TODO: Appeler l'API
    // this.commissionService.ajouterInscription(this.nouveauInscrit).subscribe({...})

    // Simuler l'ajout
    const masterNom =
      this.nouveauInscrit.type === 'master'
        ? this.masters.find((m) => m.id == this.nouveauInscrit.master_id)?.nom
        : null;

    const nouvelInscrit: Inscrit = {
      id: this.inscrits.length + 1,
      ...this.nouveauInscrit,
      master_nom: masterNom,
      date_inscription: new Date().toISOString(),
    };

    this.inscrits.unshift(nouvelInscrit);
    this.filtrerInscrits();

    alert('Inscription ajoutée avec succès !');
    this.fermerModal();
  }

  voirDetails(inscrit: Inscrit): void {
    this.inscritSelectionne = inscrit;
    this.showModalDetails = true;
  }

  editerInscrit(inscrit: Inscrit): void {
    console.log('✏️ Éditer:', inscrit);
    // TODO: Ouvrir modal d'édition
    alert("Fonctionnalité d'édition à implémenter");
  }

  supprimerInscrit(inscrit: Inscrit): void {
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer l'inscription de ${inscrit.prenom} ${inscrit.nom} ?`,
      )
    ) {
      console.log('🗑️ Supprimer:', inscrit);

      // TODO: Appeler l'API

      const index = this.inscrits.findIndex((i) => i.id === inscrit.id);
      if (index > -1) {
        this.inscrits.splice(index, 1);
        this.filtrerInscrits();
        alert('Inscription supprimée');
      }
    }
  }

  confirmerSelection(): void {
    const selection = this.inscritsFiltres.filter((i) => i.selected);
    if (confirm(`Confirmer ${selection.length} inscription(s) ?`)) {
      selection.forEach((i) => {
        i.statut = 'confirme';
        i.date_confirmation = new Date().toISOString().split('T')[0];
      });
      alert(`${selection.length} inscription(s) confirmée(s)`);
    }
  }

  annulerSelection(): void {
    const selection = this.inscritsFiltres.filter((i) => i.selected);
    if (confirm(`Annuler ${selection.length} inscription(s) ?`)) {
      selection.forEach((i) => (i.statut = 'annule'));
      alert(`${selection.length} inscription(s) annulée(s)`);
    }
  }

  envoyerEmailSelection(): void {
    const selection = this.inscritsFiltres.filter((i) => i.selected);
    console.log('📧 Envoyer email à', selection.length, 'inscrits');
    alert(`Email envoyé à ${selection.length} inscrit(s)`);
  }

  supprimerSelection(): void {
    const selection = this.inscritsFiltres.filter((i) => i.selected);
    if (confirm(`Supprimer définitivement ${selection.length} inscription(s) ?`)) {
      selection.forEach((i) => {
        const index = this.inscrits.findIndex((inscrit) => inscrit.id === i.id);
        if (index > -1) this.inscrits.splice(index, 1);
      });
      this.filtrerInscrits();
      alert(`${selection.length} inscription(s) supprimée(s)`);
    }
  }

  exporterExcel(): void {
    console.log('📊 Export Excel');
    // TODO: Générer fichier Excel
    alert('Export Excel lancé !');
  }

  exporterPDF(): void {
    console.log('📄 Export PDF');
    // TODO: Générer fichier PDF
    alert('Export PDF lancé !');
  }
}
