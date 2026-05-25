import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SpecialitesService } from '../../../services/specialites.service';
import { CommissionStateService } from '../../../services/commission-state.service';

interface Reclamation {
  id: number;
  candidat_id: number;
  candidat_prenom: string;
  candidat_nom: string;
  candidat_email: string;
  master_id: number;
  master_nom: string;
  commissionCategory: 'ingenieur' | 'master-ds' | 'master-gl';
  objet: string;
  motif: string;
  date: string;
  statut: 'en_attente' | 'acceptee' | 'rejetee';
  reponse?: string;
  traite_par?: string;
  date_traitement?: string;
  pieces_jointes?: { nom: string; url: string }[];
}

@Component({
  selector: 'app-traiter-reclamations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './traiter-reclamations.html',
  styleUrl: './traiter-reclamations.css',
})
export class TraiterReclamationsComponent implements OnInit {
  reclamations: Reclamation[] = [];
  reclamationsFiltrees: Reclamation[] = [];
  masters: any[] = [];
  availableSpecialites: string[] = [];

  selectedSpecialite: string = '';

  recherche: string = '';
  filtreStatut: string = '';
  filtreMaster: string = '';

  showModalAccepter: boolean = false;
  showModalRejeter: boolean = false;
  reclamationSelectionnee: Reclamation | null = null;

  reponseTexte: string = '';
  motifRejet: string = '';
  prolongerDelai: boolean = false;
  nouvelleDeadline: string = '';
  private activeCommissionCategory: 'ingenieur' | 'master-ds' | 'master-gl' | null = null;

  constructor(
    private router: Router,
    private specialitesService: SpecialitesService,
    private commissionStateService: CommissionStateService,
  ) {}

  ngOnInit(): void {
    this.commissionStateService.activeCommissionId$.subscribe((commissionId) => {
      this.activeCommissionCategory = this.getCommissionCategoryFromId(commissionId);
      this.filtrerReclamations();
    });
    this.loadMasters();
    this.specialitesService.getSpecialitesData().subscribe((data) => {
      this.availableSpecialites = this.specialitesService.getAllSpecialties();
    });
    this.loadReclamations();
  }

  loadMasters(): void {
    // Prefer using SpecialitesService program list when available
    const progs = this.specialitesService.getPrograms();
    if (progs && progs.length) {
      this.masters = progs.map((p) => ({ id: p.code, nom: p.name }));
      return;
    }
    // Fallback static list
    this.masters = [
      { id: 1, nom: 'Master Recherche Génie Logiciel' },
      { id: 2, nom: 'Master Professionnel Data Science' },
      { id: 3, nom: 'Master Recherche Microélectronique' },
      { id: 4, nom: 'Cycle Ingénieur Génie Logiciel' },
    ];
  }

  loadReclamations(): void {
    // TODO: Charger depuis l'API
    // this.commissionService.getAllReclamations().subscribe({...})

    // Données simulées
    this.reclamations = [
      {
        id: 1,
        candidat_id: 1,
        candidat_prenom: 'Ahmed',
        candidat_nom: 'Ben Ali',
        candidat_email: 'ahmed@example.com',
        master_id: 1,
        master_nom: 'Master Recherche Génie Logiciel',
        commissionCategory: 'master-gl',
        objet: 'Erreur dans le calcul du score',
        motif:
          'Le score affiché ne correspond pas à mes notes. Mes relevés montrent une moyenne de 16.5 mais le score calculé est de 15.2. Je demande une révision.',
        date: '2026-02-25T10:30:00',
        statut: 'en_attente',
        pieces_jointes: [{ nom: 'Releves_Notes.pdf', url: '/assets/docs/sample.pdf' }],
      },
      {
        id: 2,
        candidat_id: 2,
        candidat_prenom: 'Fatma',
        candidat_nom: 'Trabelsi',
        candidat_email: 'fatma@example.com',
        master_id: 2,
        master_nom: 'Master Professionnel Data Science',
        commissionCategory: 'master-ds',
        objet: 'Document rejeté par erreur',
        motif:
          'Mon diplôme a été rejeté avec la mention "tampon manquant" alors que le tampon est clairement visible sur le document. Je demande une révision.',
        date: '2026-02-26T14:20:00',
        statut: 'en_attente',
        pieces_jointes: [{ nom: 'Diplome_Licence.pdf', url: '/assets/docs/sample.pdf' }],
      },
      {
        id: 3,
        candidat_id: 3,
        candidat_prenom: 'Mohamed',
        candidat_nom: 'Karoui',
        candidat_email: 'mohamed@example.com',
        master_id: 1,
        master_nom: 'Master Recherche Génie Logiciel',
        commissionCategory: 'master-gl',
        objet: 'Problème technique lors du dépôt',
        motif:
          "Le système a planté lors du dépôt de mes documents. Certains documents n'ont pas été uploadés correctement.",
        date: '2026-02-24T09:15:00',
        statut: 'acceptee',
        reponse:
          'Nous avons vérifié votre dossier et constaté effectivement un problème technique. Nous avons prolongé votre délai de dépôt de 7 jours. Vous pouvez maintenant re-déposer vos documents.',
        traite_par: 'Dr. Fatma Ben Ali',
        date_traitement: '2026-02-25T11:00:00',
      },
      {
        id: 4,
        candidat_id: 4,
        candidat_prenom: 'Sarra',
        candidat_nom: 'Mansouri',
        candidat_email: 'sarra@example.com',
        master_id: 4,
        master_nom: 'Cycle Ingénieur Génie Logiciel',
        commissionCategory: 'ingenieur',
        objet: 'Contestation du rejet',
        motif:
          'Ma candidature a été rejetée sans motif clair. Je demande des explications détaillées.',
        date: '2026-02-23T16:45:00',
        statut: 'rejetee',
        reponse:
          "Après examen approfondi, votre candidature ne répond pas aux critères d'admission (moyenne générale inférieure à 12/20 sur les 3 années de licence, comme indiqué dans le règlement). Le rejet est maintenu.",
        traite_par: 'Dr. Fatma Ben Ali',
        date_traitement: '2026-02-24T10:30:00',
      },
    ];

    this.filtrerReclamations();
    console.log('✅ Réclamations chargées:', this.reclamations.length);
  }

  filtrerReclamations(): void {
    this.reclamationsFiltrees = this.reclamations.filter((r) => {
      const matchCommission = this.matchesCommissionScope(r);
      const matchRecherche =
        !this.recherche ||
        r.candidat_prenom.toLowerCase().includes(this.recherche.toLowerCase()) ||
        r.candidat_nom.toLowerCase().includes(this.recherche.toLowerCase()) ||
        r.candidat_email.toLowerCase().includes(this.recherche.toLowerCase()) ||
        r.master_nom.toLowerCase().includes(this.recherche.toLowerCase()) ||
        r.objet.toLowerCase().includes(this.recherche.toLowerCase());

      const matchStatut = !this.filtreStatut || r.statut === this.filtreStatut;
      const matchMaster = !this.filtreMaster || r.master_id.toString() === this.filtreMaster;
      const matchSpecialite = !this.selectedSpecialite || r.master_nom === this.selectedSpecialite;

      return matchCommission && matchRecherche && matchStatut && matchMaster && matchSpecialite;
    });
  }

  private matchesCommissionScope(reclamation: Reclamation): boolean {
    const scope = this.activeCommissionCategory;
    if (!scope) {
      return true;
    }

    return reclamation.commissionCategory === scope;
  }

  private getCommissionCategoryFromId(
    commissionId: number | null,
  ): 'ingenieur' | 'master-ds' | 'master-gl' | null {
    if (commissionId === 1) return 'ingenieur';
    if (commissionId === 2) return 'master-ds';
    if (commissionId === 3) return 'master-gl';
    return null;
  }

  resetFiltres(): void {
    this.recherche = '';
    this.filtreStatut = '';
    this.filtreMaster = '';
    this.reclamationsFiltrees = [...this.reclamations];
  }

  countByStatut(statut: string): number {
    return this.reclamations.filter((r) => r.statut === statut).length;
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      en_attente: 'En attente',
      acceptee: 'Acceptée',
      rejetee: 'Rejetée',
    };
    return labels[statut] || statut;
  }

  ouvrirModalAccepter(reclamation: Reclamation): void {
    this.reclamationSelectionnee = reclamation;
    this.reponseTexte = '';
    this.prolongerDelai = false;
    this.nouvelleDeadline = '';
    this.showModalAccepter = true;
  }

  ouvrirModalRejeter(reclamation: Reclamation): void {
    this.reclamationSelectionnee = reclamation;
    this.motifRejet = '';
    this.showModalRejeter = true;
  }

  fermerModal(): void {
    this.showModalAccepter = false;
    this.showModalRejeter = false;
    this.reclamationSelectionnee = null;
    this.reponseTexte = '';
    this.motifRejet = '';
  }

  accepterReclamation(): void {
    if (!this.reponseTexte) {
      alert('Veuillez saisir une réponse');
      return;
    }

    console.log('✅ Acceptation réclamation:', {
      id: this.reclamationSelectionnee?.id,
      reponse: this.reponseTexte,
      prolongerDelai: this.prolongerDelai,
      nouvelleDeadline: this.nouvelleDeadline,
    });

    // TODO: Appeler l'API
    // this.commissionService.traiterReclamation(id, 'acceptee', this.reponseTexte).subscribe({...})

    // Simuler la mise à jour
    if (this.reclamationSelectionnee) {
      this.reclamationSelectionnee.statut = 'acceptee';
      this.reclamationSelectionnee.reponse = this.reponseTexte;
      this.reclamationSelectionnee.traite_par = 'Dr. Fatma Ben Ali'; // User actuel
      this.reclamationSelectionnee.date_traitement = new Date().toISOString();
    }

    alert('Réclamation acceptée avec succès !\nUn email a été envoyé au candidat.');
    this.fermerModal();
  }

  rejeterReclamation(): void {
    if (!this.motifRejet) {
      alert('Veuillez saisir un motif de rejet');
      return;
    }

    console.log('❌ Rejet réclamation:', {
      id: this.reclamationSelectionnee?.id,
      motif: this.motifRejet,
    });

    // TODO: Appeler l'API
    // this.commissionService.traiterReclamation(id, 'rejetee', this.motifRejet).subscribe({...})

    // Simuler la mise à jour
    if (this.reclamationSelectionnee) {
      this.reclamationSelectionnee.statut = 'rejetee';
      this.reclamationSelectionnee.reponse = this.motifRejet;
      this.reclamationSelectionnee.traite_par = 'Dr. Fatma Ben Ali';
      this.reclamationSelectionnee.date_traitement = new Date().toISOString();
    }

    alert('Réclamation rejetée.\nUn email a été envoyé au candidat.');
    this.fermerModal();
  }

  traiterReclamation(reclamation: Reclamation): void {
    this.ouvrirModalAccepter(reclamation);
  }

  voirDossier(reclamation: Reclamation): void {
    console.log('📁 Voir dossier:', reclamation.candidat_nom);
    this.router.navigate(['/consultation-dossier', reclamation.candidat_id], {
      queryParams: { source: 'reclamations', reclamation: reclamation.id },
    });
  }

  voirPiece(piece: any): void {
    console.log('📎 Voir pièce jointe:', piece.nom);
    window.open(piece.url, '_blank');
  }
}
