import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

interface Candidature {
  id: number;
  numero: string;
  candidat_nom: string;
  candidat_email: string;
  candidat_cin?: string;
  specialite: string;
  score: number;
  dossier_depose: boolean;
  statut: string;
  avis?: string;
  type_concours?: string;
  parcours?: string;
  nouveau_statut?: string;
}

interface Specialite {
  id: number;
  nom: string;
  statut: 'actuel' | 'ancien';
  nb_candidatures: number;
  nb_dossiers: number;
}

interface Liste {
  id: number;
  nom: string;
  specialite: string;
  type: 'preselection' | 'selection';
  statut: 'active' | 'archivee';
  nb_candidats: number;
  date_creation: string;
}

interface Reclamation {
  id: number;
  candidat_nom: string;
  objet: string;
  motif: string;
  date: string;
  statut: string;
  reponse?: string;
}

interface DossierOCR {
  id: number;
  candidat_nom: string;
  fichier: string;
  statut_ocr: string;
  date_upload: string;
  resultats?: any;
}

interface ProcesVerbal {
  id: number;
  titre: string;
  date_reunion: string;
  master_nom: string;
  nb_participants: number;
  nb_candidatures: number;
  nb_admis: number;
  nb_rejetes: number;
  statut: string;
}

type CommissionView =
  | 'dashboard'
  | 'profil'
  | 'specialites'
  | 'candidatures'
  | 'valider-dossier'
  | 'dossiers'
  | 'listes'
  | 'membres'
  | 'ocr'
  | 'reclamations'
  | 'inscriptions'
  | 'statistiques'
  | 'deliberations';

interface CommissionActionPermissions {
  consultationCandidature: boolean;
  consultationDossier: boolean;
  verifierDossiers: boolean;
  preselection: boolean;
  selectionFinale: boolean;
  publierListes: boolean;
  traiterReclamations: boolean;
  gererInscriptions: boolean;
  consulterStatistiques: boolean;
}

@Component({
  selector: 'app-dashboard-commission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-commission.html',
  styleUrl: './dashboard-commission.css',
})
export class DashboardCommissionComponent implements OnInit {
  currentView: CommissionView = 'dashboard';
  currentUser: any = null;
  currentDate: Date = new Date();
  isResponsable: boolean = false;

  actionPermissions: CommissionActionPermissions = {
    consultationCandidature: true,
    consultationDossier: true,
    verifierDossiers: true,
    preselection: true,
    selectionFinale: true,
    publierListes: true,
    traiterReclamations: true,
    gererInscriptions: true,
    consulterStatistiques: true,
  };

  // Menu Kebab
  actionMenuOpen: number | null = null;

  // Filtres principaux
  filtreSpecialite: 'actuel' | 'ancien' = 'actuel';
  filtreSpecialiteActive: string = '';
  filtreStatut: string = '';
  typeListe: 'preselection' | 'selection' = 'preselection';

  // Filtres avancés
  filtres: any = {
    concours: '',
    statut: '',
    parcours: '',
    recherche: '',
  };
  candidaturesFiltrees: Candidature[] = [];

  // Profil
  profileData: any = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
  };

  passwordForm: any = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  };

  // Données
  specialites: Specialite[] = [
    {
      id: 1,
      nom: 'Master Génie Logiciel',
      statut: 'actuel',
      nb_candidatures: 45,
      nb_dossiers: 42,
    },
    {
      id: 2,
      nom: 'Master Data Science',
      statut: 'actuel',
      nb_candidatures: 50,
      nb_dossiers: 48,
    },
    {
      id: 3,
      nom: 'Master Réseaux',
      statut: 'ancien',
      nb_candidatures: 30,
      nb_dossiers: 30,
    },
  ];

  candidatures: Candidature[] = [
    {
      id: 1,
      numero: '2603-00001-GL',
      candidat_nom: 'Ahmed Ben Ali',
      candidat_email: 'ahmed@example.com',
      candidat_cin: '12345678',
      specialite: 'Master Génie Logiciel',
      score: 16.5,
      dossier_depose: true,
      statut: 'sous_examen',
      avis: 'Très bon dossier',
      type_concours: 'masters',
      parcours: 'ia',
    },
    {
      id: 2,
      numero: '2603-00002-DS',
      candidat_nom: 'Fatma Gharbi',
      candidat_email: 'fatma@example.com',
      candidat_cin: '87654321',
      specialite: 'Master Data Science',
      score: 17.2,
      dossier_depose: true,
      statut: 'preselectionne',
      type_concours: 'masters',
      parcours: 'data',
    },
    {
      id: 3,
      numero: '2603-00003-ING',
      candidat_nom: 'Mohamed Trabelsi',
      candidat_email: 'mohamed@example.com',
      candidat_cin: '11223344',
      specialite: 'Cycle Ingénieur',
      score: 15.8,
      dossier_depose: false,
      statut: 'soumis',
      type_concours: 'ingenieur',
      parcours: 'web',
    },
  ];

  listes: Liste[] = [
    {
      id: 1,
      nom: 'Présélection GL 2026',
      specialite: 'Master Génie Logiciel',
      type: 'preselection',
      statut: 'active',
      nb_candidats: 30,
      date_creation: '15/02/2026',
    },
  ];

  reclamations: Reclamation[] = [
    {
      id: 1,
      candidat_nom: 'Ahmed Ben Ali',
      objet: 'Score incorrect',
      motif: 'Le score affiché ne correspond pas',
      date: '2026-03-01',
      statut: 'en_cours',
    },
  ];

  dossiersOCR: DossierOCR[] = [
    {
      id: 1,
      candidat_nom: 'Mohamed Trabelsi',
      fichier: 'releve_notes.pdf',
      statut_ocr: 'en_attente',
      date_upload: '2026-03-10',
    },
  ];

  procesVerbaux: ProcesVerbal[] = [
    {
      id: 1,
      titre: 'Délibération Master Génie Logiciel - Session 2026',
      date_reunion: '2026-03-10',
      master_nom: 'Master Génie Logiciel',
      nb_participants: 5,
      nb_candidatures: 45,
      nb_admis: 30,
      nb_rejetes: 5,
      statut: 'publie',
    },
  ];

  // Modal avis
  showModalAvis: boolean = false;
  candidatureSelectionnee: Candidature | null = null;
  avisText: string = '';
  avisRecommandation: string = 'favorable';

  // Modal OCR
  showModalOCR: boolean = false;
  fichierOCR: File | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };
    this.isResponsable = this.currentUser?.role === 'responsable_commission';
    this.loadActionPermissions();
    this.candidaturesFiltrees = [...this.candidatures];
  }

  private loadActionPermissions(): void {
    this.authService.getMyEnabledActions().subscribe({
      next: () => {
        this.actionPermissions = {
          consultationCandidature: this.authService.hasMyAction('Consultation de candidature'),
          consultationDossier: this.authService.hasMyAction('Consultation de dossier'),
          verifierDossiers: this.authService.hasMyAction('Vérifier dossiers'),
          preselection: this.authService.hasMyAction('Préselection'),
          selectionFinale: this.authService.hasMyAction('Sélection finale'),
          publierListes: this.authService.hasMyAction([
            'Publier liste principale',
            'Publier liste attente',
          ]),
          traiterReclamations: this.authService.hasMyAction('Traiter réclamations'),
          gererInscriptions: this.authService.hasMyAction('Gérer inscriptions'),
          consulterStatistiques: this.authService.hasMyAction('Consulter statistiques'),
        };

        if (!this.canAccessView(this.currentView)) {
          this.currentView = 'dashboard';
        }
      },
      error: () => {
        console.warn('Permissions indisponibles, maintien du mode permissif local.');
      },
    });
  }

  canAccessView(view: CommissionView): boolean {
    if (view === 'dashboard' || view === 'profil' || view === 'specialites') {
      return true;
    }

    if (view === 'candidatures') {
      return this.actionPermissions.consultationCandidature;
    }

    if (view === 'valider-dossier') {
      return this.actionPermissions.verifierDossiers;
    }

    if (view === 'dossiers') {
      return this.actionPermissions.consultationDossier;
    }

    if (view === 'listes') {
      return (
        this.isResponsable &&
        (this.actionPermissions.preselection || this.actionPermissions.selectionFinale)
      );
    }

    if (view === 'ocr') {
      return this.isResponsable && this.actionPermissions.verifierDossiers;
    }

    if (view === 'reclamations') {
      return this.isResponsable && this.actionPermissions.traiterReclamations;
    }

    if (view === 'inscriptions') {
      return this.isResponsable && this.actionPermissions.gererInscriptions;
    }

    if (view === 'statistiques') {
      return this.isResponsable && this.actionPermissions.consulterStatistiques;
    }

    if (view === 'deliberations') {
      return (
        this.isResponsable &&
        (this.actionPermissions.selectionFinale || this.actionPermissions.publierListes)
      );
    }

    if (view === 'membres') {
      return this.isResponsable;
    }

    return true;
  }

  private notifyActionBlocked(message: string): void {
    this.toastService.show(message, 'warning');
  }

  // ========================================
  // MENU KEBAB
  // ========================================
  toggleActionMenu(candidatureId: number): void {
    if (this.actionMenuOpen === candidatureId) {
      this.actionMenuOpen = null;
    } else {
      this.actionMenuOpen = candidatureId;
    }
  }

  closeActionMenu(): void {
    this.actionMenuOpen = null;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.action-menu-container')) {
      this.closeActionMenu();
    }
  }

  telechargerDossier(candidature: Candidature): void {
    if (!this.actionPermissions.consultationDossier) {
      this.notifyActionBlocked("Consultation dossier désactivée par l'administration.");
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .get(`http://localhost:8003/api/candidatures/${candidature.id}/telecharger-dossier/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `dossier_${candidature.numero}.zip`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors du téléchargement');
        },
      });

    this.closeActionMenu();
  }

  modifierScore(candidature: Candidature): void {
    if (!this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked("Vérification dossier désactivée par l'administration.");
      return;
    }

    const nouveauScore = prompt(
      `Modifier le score de ${candidature.candidat_nom}\nScore actuel: ${candidature.score}`,
    );

    if (nouveauScore) {
      const score = parseFloat(nouveauScore);

      if (isNaN(score) || score < 0 || score > 20) {
        alert('❌ Score invalide (doit être entre 0 et 20)');
        return;
      }

      const token = this.authService.getAccessToken();

      this.http
        .put(
          `http://localhost:8003/api/candidatures/${candidature.id}/modifier-score/`,
          { score: score },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .subscribe({
          next: () => {
            alert('✅ Score modifié');
            candidature.score = score;
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de la modification');
          },
        });
    }

    this.closeActionMenu();
  }

  rejeterCandidature(candidature: Candidature): void {
    if (!this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked("Rejet candidature désactivé par l'administration.");
      return;
    }

    if (
      !confirm(`Êtes-vous sûr de vouloir rejeter la candidature de ${candidature.candidat_nom} ?`)
    ) {
      return;
    }

    const motif = prompt('Motif du rejet :');

    if (!motif) {
      alert('❌ Le motif est obligatoire');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        `http://localhost:8003/api/candidatures/${candidature.id}/rejeter/`,
        { motif: motif },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ Candidature rejetée');
          candidature.statut = 'rejete';
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors du rejet');
        },
      });

    this.closeActionMenu();
  }

  // ========================================
  // GESTION PROCÈS-VERBAUX
  // ========================================
  creerPV(): void {
    if (!this.actionPermissions.selectionFinale) {
      this.notifyActionBlocked("Création PV désactivée par l'administration.");
      return;
    }

    alert('Créer un nouveau PV de délibération');
  }

  voirPV(pv: ProcesVerbal): void {
    alert(`Consulter PV: ${pv.titre}`);
  }

  telechargerPV(pv: ProcesVerbal): void {
    const token = this.authService.getAccessToken();

    this.http
      .get(`http://localhost:8003/api/deliberations/${pv.id}/export-pdf/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `PV_${pv.id}.pdf`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors du téléchargement');
        },
      });
  }

  publierPV(pv: ProcesVerbal): void {
    if (!this.actionPermissions.publierListes) {
      this.notifyActionBlocked("Publication désactivée par l'administration.");
      return;
    }

    if (!confirm('Publier ce PV ? Il ne sera plus modifiable.')) {
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        `http://localhost:8003/api/deliberations/${pv.id}/publier/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ PV publié');
          pv.statut = 'publie';
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de la publication');
        },
      });
  }

  // ========================================
  // NAVIGATION & TITRES
  // ========================================
  get candidaturesAvecDossier(): Candidature[] {
    return this.candidatures.filter((c) => c.dossier_depose);
  }

  get nbDossiersDeposes(): number {
    return this.candidatures.filter((c) => c.dossier_depose).length;
  }

  switchView(view: CommissionView): void {
    if (!this.canAccessView(view)) {
      this.notifyActionBlocked("Cette section n'est pas active pour votre rôle.");
      return;
    }
    this.currentView = view;
  }

  allerCandidaturesPage(): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Consultation candidature désactivée par l'administration.");
      return;
    }

    this.router.navigate(['/commission/candidatures']);
  }

  getViewTitle(): string {
    const titles: any = {
      dashboard: 'Tableau de bord',
      profil: 'Mon Profil',
      specialites: 'Mes Spécialités',
      candidatures: 'Candidatures à évaluer',
      'valider-dossier': 'Dossiers à valider',
      dossiers: 'Tous les dossiers soumis',
      listes: "Listes d'admission",
      membres: 'Membres de la commission',
      ocr: 'Analyse automatique (OCR)',
      reclamations: 'Gestion des réclamations',
      inscriptions: 'Validation des inscriptions',
      statistiques: 'Statistiques et rapports',
      deliberations: 'Procès-verbaux de délibération',
    };
    return titles[this.currentView] || 'Tableau de bord';
  }

  getSpecialitesFiltrees(): Specialite[] {
    return this.specialites.filter((s) => s.statut === this.filtreSpecialite);
  }

  consulterSpecialite(spec: Specialite): void {
    this.filtreSpecialiteActive = spec.id.toString();
    this.switchView('candidatures');
  }

  getCandidaturesFiltrees(): Candidature[] {
    let filtered = [...this.candidatures];

    if (this.filtreSpecialiteActive) {
      const spec = this.specialites.find((s) => s.id.toString() === this.filtreSpecialiteActive);
      if (spec) {
        filtered = filtered.filter((c) => c.specialite === spec.nom);
      }
    }

    if (this.filtreStatut) {
      filtered = filtered.filter((c) => c.statut === this.filtreStatut);
    }

    return filtered;
  }

  // ========================================
  // FILTRES AVANCÉS
  // ========================================
  appliquerFiltres(): void {
    this.candidaturesFiltrees = this.candidatures.filter((candidature) => {
      if (this.filtres.concours && candidature.type_concours !== this.filtres.concours) {
        return false;
      }

      if (this.filtres.statut && candidature.statut !== this.filtres.statut) {
        return false;
      }

      if (this.filtres.parcours) {
        const parcours = (candidature.parcours || candidature.specialite || '').toLowerCase();
        if (!parcours.includes(this.filtres.parcours.toLowerCase())) {
          return false;
        }
      }

      if (this.filtres.recherche) {
        const recherche = this.filtres.recherche.toLowerCase();
        const matchNom = candidature.candidat_nom.toLowerCase().includes(recherche);
        const matchEmail = candidature.candidat_email.toLowerCase().includes(recherche);
        const matchCIN = (candidature.candidat_cin || '').toLowerCase().includes(recherche);

        if (!matchNom && !matchEmail && !matchCIN) {
          return false;
        }
      }

      return true;
    });
  }

  resetFiltres(): void {
    this.filtres = {
      concours: '',
      statut: '',
      parcours: '',
      recherche: '',
    };
    this.candidaturesFiltrees = [...this.candidatures];
  }

  voirDossier(candidature: Candidature): void {
    if (!this.actionPermissions.consultationDossier) {
      this.notifyActionBlocked("Consultation dossier désactivée par l'administration.");
      return;
    }

    if (!candidature.dossier_depose) {
      alert('❌ Aucun dossier déposé pour cette candidature');
      return;
    }

    this.router.navigate(['/commission/dossier', candidature.id]);
    this.closeActionMenu();
  }

  // ========================================
  // MODAL AVIS
  // ========================================
  ouvrirModalAvis(candidature: Candidature): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Consultation candidature désactivée par l'administration.");
      return;
    }

    this.candidatureSelectionnee = candidature;
    this.avisText = candidature.avis || '';
    this.avisRecommandation = 'favorable';
    this.showModalAvis = true;
  }

  fermerModalAvis(): void {
    this.showModalAvis = false;
    this.candidatureSelectionnee = null;
    this.avisText = '';
  }

  enregistrerAvis(): void {
    if (!this.avisText.trim()) {
      alert('❌ Veuillez saisir un avis');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        `http://localhost:8003/api/candidatures/${this.candidatureSelectionnee?.id}/avis/`,
        {
          avis: this.avisText,
          recommandation: this.avisRecommandation,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ Avis enregistré avec succès !');

          if (this.candidatureSelectionnee) {
            const index = this.candidatures.findIndex(
              (c) => c.id === this.candidatureSelectionnee!.id,
            );
            if (index !== -1) {
              this.candidatures[index].avis = this.avisText;
            }
          }

          this.fermerModalAvis();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert("❌ Erreur lors de l'enregistrement de l'avis");
        },
      });
  }

  onStatutChange(candidature: Candidature): void {
    console.log('Nouveau statut sélectionné:', candidature.nouveau_statut);
  }

  changerStatut(candidature: Candidature): void {
    if (!this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked("Changement de statut désactivé par l'administration.");
      return;
    }

    if (!candidature.nouveau_statut) {
      alert('❌ Veuillez sélectionner un statut');
      return;
    }

    let motif_rejet = '';

    if (candidature.nouveau_statut === 'rejete') {
      motif_rejet = prompt('Motif du rejet :') || '';
      if (!motif_rejet) {
        alert('❌ Le motif de rejet est obligatoire');
        return;
      }
    }

    if (!confirm(`Confirmer le changement de statut vers "${candidature.nouveau_statut}" ?`)) {
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        `http://localhost:8003/api/candidatures/${candidature.id}/changer-statut/`,
        {
          statut: candidature.nouveau_statut,
          motif_rejet: motif_rejet,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ Statut changé avec succès !');
          candidature.statut = candidature.nouveau_statut!;
          candidature.nouveau_statut = '';
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors du changement de statut');
        },
      });
  }

  // ========================================
  // LISTES
  // ========================================
  getListesByType(): Liste[] {
    return this.listes.filter((l) => l.type === this.typeListe);
  }

  nouvelleListe(type: 'preselection' | 'selection'): void {
    if (type === 'preselection' && !this.actionPermissions.preselection) {
      this.notifyActionBlocked("Préselection désactivée par l'administration.");
      return;
    }

    if (type === 'selection' && !this.actionPermissions.selectionFinale) {
      this.notifyActionBlocked("Sélection finale désactivée par l'administration.");
      return;
    }

    alert(`Créer une nouvelle liste de ${type}`);
  }

  modifierListe(liste: Liste): void {
    alert(`Modifier la liste: ${liste.nom}`);
  }

  exporterListe(liste: Liste): void {
    if (!this.actionPermissions.publierListes) {
      this.notifyActionBlocked("Export des listes désactivé par l'administration.");
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .get(`http://localhost:8003/api/listes/${liste.id}/export/`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      })
      .subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${liste.nom}.xlsx`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Erreur export:', error);
          alert("❌ Erreur lors de l'export");
        },
      });
  }

  archiverListe(liste: Liste): void {
    if (!this.actionPermissions.publierListes) {
      this.notifyActionBlocked("Archivage des listes désactivé par l'administration.");
      return;
    }

    const action = liste.statut === 'active' ? 'archiver' : 'désarchiver';

    if (confirm(`Voulez-vous ${action} cette liste ?`)) {
      const token = this.authService.getAccessToken();

      this.http
        .post(
          `http://localhost:8003/api/listes/${liste.id}/archiver/`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .subscribe({
          next: () => {
            liste.statut = liste.statut === 'active' ? 'archivee' : 'active';
            alert(`✅ Liste ${action}e avec succès`);
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert("❌ Erreur lors de l'archivage");
          },
        });
    }
  }

  // ========================================
  // OCR
  // ========================================
  ouvrirModalOCR(): void {
    if (!this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked("Analyse dossier désactivée par l'administration.");
      return;
    }

    this.fichierOCR = null;
    this.showModalOCR = true;
  }

  fermerModalOCR(): void {
    this.showModalOCR = false;
    this.fichierOCR = null;
  }

  onFileOCRSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        alert('❌ Format non supporté. Utilisez PDF ou images');
        return;
      }
      this.fichierOCR = file;
    }
  }

  lancerAnalyseOCR(): void {
    if (!this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked("Analyse dossier désactivée par l'administration.");
      return;
    }

    if (!this.fichierOCR) {
      alert('❌ Veuillez sélectionner un fichier');
      return;
    }

    const token = this.authService.getAccessToken();
    const formData = new FormData();
    formData.append('fichier', this.fichierOCR);

    this.http
      .post('http://localhost:8003/api/ocr/analyser/', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          alert('✅ Analyse OCR lancée avec succès !');
          this.dossiersOCR.unshift({
            id: Date.now(),
            candidat_nom: 'En cours...',
            fichier: this.fichierOCR!.name,
            statut_ocr: 'en_cours',
            date_upload: new Date().toISOString(),
            resultats: response,
          });
          this.fermerModalOCR();
        },
        error: (error) => {
          console.error('Erreur OCR:', error);
          alert("❌ Erreur lors de l'analyse OCR");
        },
      });
  }

  voirResultatsOCR(dossier: DossierOCR): void {
    alert(`Voir les résultats OCR pour ${dossier.candidat_nom}`);
  }

  // ========================================
  // RÉCLAMATIONS
  // ========================================
  traiterReclamation(reclamation: Reclamation): void {
    if (!this.actionPermissions.traiterReclamations) {
      this.notifyActionBlocked("Traitement réclamations désactivé par l'administration.");
      return;
    }

    const reponse = prompt('Saisir la réponse à la réclamation :');
    if (reponse) {
      const token = this.authService.getAccessToken();

      this.http
        .post(
          `http://localhost:8003/api/reclamations/${reclamation.id}/repondre/`,
          { reponse },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .subscribe({
          next: () => {
            reclamation.statut = 'traitee';
            reclamation.reponse = reponse;
            alert('✅ Réclamation traitée');
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors du traitement');
          },
        });
    }
  }

  // ========================================
  // PROFIL
  // ========================================
  updateProfile(): void {
    const token = this.authService.getAccessToken();

    this.http
      .put('http://localhost:8001/api/auth/profile/update/', this.profileData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          alert('✅ Profil mis à jour avec succès !');
          this.currentUser = { ...this.currentUser, ...this.profileData };
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de la mise à jour du profil');
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (this.passwordForm.new_password.length < 8) {
      alert('❌ Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        'http://localhost:8001/api/auth/change-password/',
        {
          current_password: this.passwordForm.current_password,
          new_password: this.passwordForm.new_password,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ Mot de passe modifié avec succès !');
          this.passwordForm = {
            current_password: '',
            new_password: '',
            confirm_password: '',
          };
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors du changement de mot de passe');
        },
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
