import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';

interface Candidature {
  id: number;
  numero: string;
  master_nom: string;
  master?: number;
  master_id?: number;
  statut: string;
  date_soumission: string;
  etat_candidature?: string;
  dossier_valide: boolean;
  date_depot_dossier?: string;
  dossier_depose: boolean;
  score?: number;
  classement?: string | number;
  total_candidats?: number;
  statut_inscription?: string;
  annee_universitaire?: string;
}

interface Master {
  id: number;
  nom: string;
  type: string;
  description: string;
  date_limite: string;
  places: number;
  statut?: 'ouvert' | 'ferme';
  specialite?: string;
}

interface Offre {
  id: number;
  titre: string;
  type: 'master' | 'cycle_ingenieur';
  sous_type?: string;
  specialite?: string;
  description: string;
  date_limite: string;
  places?: number;
  statut: 'ouvert' | 'ferme';
}

interface DossierCandidature {
  id: number;
  numero_dossier: string;
  candidature_id: number;
  numero_candidature: string;
  master_nom: string;
  statut: string;
  dossier_depose?: boolean;
  dossier_valide?: boolean;
  date_soumission?: string;
}

interface Document {
  id: number;
  nom: string;
  icon: string;
  depose: boolean;
  date_depot?: string;
}

interface Reclamation {
  id: number;
  identifiant: string;
  objet: string;
  master_nom: string;
  master_id: number;
  motif: string;
  date: string;
  statut: string;
  reponse?: string | null;
}

interface FichierHistorique {
  nom: string;
  date: string;
  id: number;
}

// ✅ CORRECTION - Interface HistoriqueItem complète
interface HistoriqueItem {
  id?: number;
  titre?: string;
  description?: string;
  date?: string;
  color?: string;
  // Nouvelles propriétés pour l'historique des candidatures
  annee_universitaire?: string;
  numero?: string;
  master_nom?: string;
  score?: number;
  classement?: string;
  statut_final?: string;
  date_soumission?: string;
}

type CandidatView =
  | 'dashboard'
  | 'profil'
  | 'offres-inscription'
  | 'candidatures'
  | 'mon-dossier'
  | 'inscription'
  | 'suivi'
  | 'historique'
  | 'reclamations'
  | 'importer';

interface CandidatActionPermissions {
  preinscription: boolean;
  consultationCandidature: boolean;
  consultationDossier: boolean;
  depotDossier: boolean;
  suiviCandidature: boolean;
  deposerReclamation: boolean;
}

@Component({
  selector: 'app-dashboard-candidat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-candidat.html',
  styleUrl: './dashboard-candidat.css',
})
export class DashboardCandidatComponent implements OnInit {
  currentUser: any = null;
  currentView: CandidatView = 'dashboard';
  currentDate: Date = new Date();

  showAlert: boolean = true;

  // ✅ AJOUT - Filtre année pour historique
  filtreAnnee: string = '';
  selectedDossierNumber: string | null = null;
  selectedCandidatureForInscription: Candidature | null = null;
  openActionMenuId: number | null = null;

  mesCandidatures: Candidature[] = [
    {
      id: 1,
      numero: '2603-00001-GL',
      master_nom: 'Master Recherche Génie Logiciel',
      master_id: 1,
      statut: 'selectionne',
      date_soumission: '2026-02-15',
      etat_candidature: 'Sélectionné',
      dossier_valide: true,
      date_depot_dossier: '2026-02-20',
      dossier_depose: true,
      score: 16.5,
      classement: '3',
      total_candidats: 45,
      statut_inscription: 'en_attente',
    },
    {
      id: 2,
      numero: '2603-00002-DS',
      master_nom: 'Master Professionnel Data Science',
      master_id: 2,
      statut: 'en_attente',
      date_soumission: '2026-02-15',
      etat_candidature: 'En attente',
      dossier_valide: true,
      date_depot_dossier: '2026-02-20',
      dossier_depose: true,
      score: 15.2,
      classement: '12',
      total_candidats: 50,
    },
    {
      id: 3,
      numero: '2603-00003-ING',
      master_nom: 'Cycle Ingénieur Informatique',
      master_id: 3,
      statut: 'soumis',
      date_soumission: '2026-02-16',
      etat_candidature: 'En cours',
      dossier_valide: false,
      date_depot_dossier: '',
      dossier_depose: false,
    },
  ];

  offresInscription: Offre[] = [
    // Masters Recherche
    {
      id: 1,
      titre: 'Master Recherche - Génie Logiciel',
      type: 'master',
      sous_type: 'recherche',
      description:
        'Master Recherche en Génie Logiciel - Formation approfondie en développement et architecture logicielle',
      date_limite: '2026-03-31',
      places: 30,
      statut: 'ouvert',
    },
    {
      id: 2,
      titre: 'Master Recherche - Intelligence Artificielle',
      type: 'master',
      sous_type: 'recherche',
      description: 'Spécialisation en IA, Machine Learning et applications avancées',
      date_limite: '2026-04-15',
      places: 25,
      statut: 'ouvert',
    },
    {
      id: 3,
      titre: 'Master Recherche - Réseaux et Télécommunications',
      type: 'master',
      sous_type: 'recherche',
      description: 'Technologies des réseaux, protocoles modernes et télécommunications',
      date_limite: '2026-04-20',
      places: 20,
      statut: 'ferme',
    },
    // Masters Professionnels
    {
      id: 4,
      titre: 'Master Professionnel - Génie Logiciel',
      type: 'master',
      sous_type: 'professionnel',
      description: "Master Professionnel orienté vers l'industrie et les métiers du développement",
      date_limite: '2026-03-31',
      places: 40,
      statut: 'ouvert',
    },
    {
      id: 5,
      titre: 'Master Professionnel - Infrastructure et Cloud',
      type: 'master',
      sous_type: 'professionnel',
      description: 'Gestion des infrastructures, Cloud Computing et DevOps',
      date_limite: '2026-04-10',
      places: 30,
      statut: 'ouvert',
    },
    // Cycle Ingénieur
    {
      id: 6,
      titre: "Cycle d'Ingénieur en Informatique",
      type: 'cycle_ingenieur',
      specialite: 'Génie Logiciel',
      description:
        "Cycle 3 ans - Formation d'ingénieur en informatique spécialisée en Génie Logiciel",
      date_limite: '2026-05-31',
      places: 50,
      statut: 'ouvert',
    },
  ];

  dossiersCandidature: DossierCandidature[] = [
    {
      id: 1,
      numero_dossier: '2603-00001',
      candidature_id: 1,
      numero_candidature: '2603-00001-GL',
      master_nom: 'Master Génie Logiciel',
      statut: 'accepte',
      date_soumission: '2026-02-10',
    },
    {
      id: 2,
      numero_dossier: '2603-00002',
      candidature_id: 2,
      numero_candidature: '2603-00002-GL',
      master_nom: 'Master Intelligence Artificielle',
      statut: 'en_attente',
      date_soumission: '2026-02-12',
    },
  ];

  documentsRequis: Document[] = [
    {
      id: 1,
      nom: "Carte d'identité nationale",
      icon: 'fa-id-card',
      depose: true,
      date_depot: '2026-02-10',
    },
    {
      id: 2,
      nom: 'Diplôme de licence',
      icon: 'fa-graduation-cap',
      depose: true,
      date_depot: '2026-02-10',
    },
    { id: 3, nom: 'Relevés de notes', icon: 'fa-file-alt', depose: true, date_depot: '2026-02-12' },
    { id: 4, nom: 'CV détaillé', icon: 'fa-file-pdf', depose: false },
    { id: 5, nom: 'Lettre de motivation', icon: 'fa-envelope', depose: false },
  ];

  reclamations: Reclamation[] = [
    {
      id: 1,
      identifiant: 'RECL-2026-00001',
      objet: 'score',
      master_nom: 'Master Génie Logiciel',
      master_id: 1,
      motif: 'Mon score affiché ne correspond pas à mes notes',
      date: '2026-03-15T10:30:00',
      statut: 'en_cours',
      reponse: null,
    },
  ];

  profileData: any = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
  };

  passwordForm: any = {
    current_password: '',
    new_password: '',
    confirm_password: '',
  };

  fichierInscription: File | null = null;
  fichiersHistorique: FichierHistorique[] = [
    { id: 1, nom: 'fiche_inscription_2026.pdf', date: '15/02/2026' },
    { id: 2, nom: 'releve_notes.pdf', date: '16/02/2026' },
  ];

  // ✅ CORRECTION - Historique avec données complètes
  historique: HistoriqueItem[] = [
    {
      id: 1,
      titre: 'Candidature acceptée',
      description: 'Votre candidature pour Master GL a été acceptée',
      date: '20/02/2026',
      color: '#10b981',
      annee_universitaire: '2025-2026',
      numero: '2603-00001-GL',
      master_nom: 'Master Génie Logiciel',
      score: 16.5,
      classement: '3',
      statut_final: 'selectionne',
      date_soumission: '2026-02-15',
    },
    {
      id: 2,
      titre: 'Dossier déposé',
      description: 'Vous avez déposé votre dossier complet',
      date: '18/02/2026',
      color: '#3b82f6',
      annee_universitaire: '2025-2026',
      numero: '2603-00002-DS',
      master_nom: 'Master Data Science',
      score: 15.2,
      classement: '12',
      statut_final: 'en_attente',
      date_soumission: '2026-02-15',
    },
    {
      id: 3,
      titre: 'Candidature soumise',
      description: 'Candidature Master GL soumise avec succès',
      date: '15/02/2026',
      color: '#8b5cf6',
      annee_universitaire: '2024-2025',
      numero: '2502-00123-GL',
      master_nom: 'Master Génie Logiciel',
      score: 14.8,
      classement: '25',
      statut_final: 'rejete',
      date_soumission: '2025-02-10',
    },
  ];

  showModalReclamation: boolean = false;
  nouvelleReclamation: any = {
    master_id: '',
    objet: '',
    motif: '',
  };

  actionPermissions: CandidatActionPermissions = {
    preinscription: true,
    consultationCandidature: true,
    consultationDossier: true,
    depotDossier: true,
    suiviCandidature: true,
    deposerReclamation: true,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };

    const requestedView = this.route.snapshot.queryParamMap.get('view') as CandidatView | null;
    if (requestedView && this.canAccessView(requestedView)) {
      this.currentView = requestedView;
    }

    this.loadActionPermissions();
    this.loadMesCandidatures();
    this.loadOffresInscription();
    this.loadMesDossiers();
  }

  ouvrirFormulaireReclamation(): void {
    if (!this.actionPermissions.deposerReclamation) {
      this.notifyActionBlocked("Dépôt de réclamation désactivé par l'administration.");
      return;
    }

    this.router.navigate(['/candidat/reclamations/nouvelle']);
  }

  switchView(view: CandidatView): void {
    if (!this.canAccessView(view)) {
      this.notifyActionBlocked("Cette section n'est pas active pour votre rôle.");
      return;
    }
    this.closeActionMenu();
    this.currentView = view;
  }

  private loadActionPermissions(): void {
    this.authService.getMyEnabledActions().subscribe({
      next: () => {
        this.actionPermissions = {
          preinscription: this.authService.hasMyAction('Préinscription'),
          consultationCandidature: this.authService.hasMyAction('Consultation de candidature'),
          consultationDossier: this.authService.hasMyAction('Consultation de dossier'),
          depotDossier: this.authService.hasMyAction('Dépôt de dossier'),
          suiviCandidature: this.authService.hasMyAction('Suivi de candidature'),
          deposerReclamation: this.authService.hasMyAction('Déposer réclamation'),
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

  canAccessView(view: CandidatView): boolean {
    if (view === 'dashboard' || view === 'profil') {
      return true;
    }

    if (view === 'offres-inscription') {
      return this.actionPermissions.preinscription;
    }

    if (view === 'candidatures' || view === 'inscription') {
      return this.actionPermissions.consultationCandidature;
    }

    if (view === 'mon-dossier' || view === 'importer') {
      return this.actionPermissions.consultationDossier || this.actionPermissions.depotDossier;
    }

    if (view === 'suivi' || view === 'historique') {
      return this.actionPermissions.suiviCandidature;
    }

    if (view === 'reclamations') {
      return this.actionPermissions.deposerReclamation;
    }

    return true;
  }

  private notifyActionBlocked(message: string): void {
    this.toastService.show(message, 'warning');
  }

  getViewTitle(): string {
    const titles: any = {
      dashboard: 'Tableau de bord',
      profil: 'Mon Profil',
      'offres-inscription': "Offres d'inscription",
      candidatures: 'Mes Candidatures',
      'mon-dossier': 'Mon Dossier',
      reclamations: 'Mes Réclamations',
      importer: 'Importer un fichier',
      inscription: 'Inscription en ligne',
      suivi: 'Suivi de candidature',
      historique: 'Historique des candidatures',
    };
    return titles[this.currentView] || 'Tableau de bord';
  }

  closeAlert(): void {
    this.showAlert = false;
  }

  countByStatut(statut: string): number {
    return this.mesCandidatures.filter((c) => c.statut === statut).length;
  }

  get documentsDeposes(): number {
    return this.documentsRequis.filter((d) => d.depose).length;
  }

  getStatutLabel(statut?: string): string {
    const labels: any = {
      selectionne: 'Sélectionné',
      en_attente: 'En attente',
      soumis: 'Soumis',
      rejete: 'Rejeté',
      preselectionne: 'Présélectionné',
      sous_examen: 'Sous examen',
      dossier_depose: 'Dossier déposé',
      inscrit: 'Inscrit',
      paiement_soumis: 'Paiement soumis',
      valide: 'Validé',
      traitee: 'Traitée',
    };
    if (!statut) {
      return '-';
    }
    return labels[statut] || statut;
  }

  loadMesCandidatures(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<Candidature[]>('http://localhost:8003/api/candidatures/mes-candidatures/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data) => {
          this.mesCandidatures = (data || []).map((item) => ({
            ...item,
            master_id: item.master_id ?? item.master,
            etat_candidature: item.etat_candidature ?? this.getStatutLabel(item.statut),
            date_depot_dossier: item.date_depot_dossier ?? '',
            annee_universitaire: item.annee_universitaire ?? this.currentAcademicYear(),
          }));
        },
        error: (error) => {
          console.error('Erreur chargement candidatures:', error);
        },
      });
  }

  loadOffresInscription(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<Offre[]>('http://localhost:8003/api/candidatures/offres-inscription/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data) => {
          this.offresInscription = (data || []).map((offre: any) => ({
            id: Number(offre.id),
            titre: offre.titre,
            type: offre.type,
            sous_type: offre.sous_type,
            specialite: offre.specialite,
            description: offre.description,
            date_limite: offre.date_limite,
            places: offre.places,
            statut: offre.statut,
          }));
        },
        error: (error) => {
          console.error('Erreur chargement offres:', error);
        },
      });
  }

  loadMesDossiers(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<DossierCandidature[]>('http://localhost:8003/api/candidatures/mes-dossiers/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data) => {
          this.dossiersCandidature = data || [];
        },
        error: (error) => {
          console.error('Erreur chargement dossiers:', error);
        },
      });
  }

  // ✅ AJOUT - Méthode chargerHistorique
  chargerHistorique(): void {
    const token = this.authService.getAccessToken();

    const params: any = {};
    if (this.filtreAnnee) {
      params.annee = this.filtreAnnee;
    }

    this.http
      .get('http://localhost:8003/api/candidatures/historique/', {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      })
      .subscribe({
        next: (data: any) => {
          this.historique = data;
        },
        error: (error) => {
          console.error('Erreur chargement historique:', error);
        },
      });
  }

  // ✅ NOUVELLES MÉTHODES - Filtrer les offres par type
  mastersRecherche(): Offre[] {
    return this.offresInscription.filter((o) => o.type === 'master' && o.sous_type === 'recherche');
  }

  mastersProfessionnels(): Offre[] {
    return this.offresInscription.filter(
      (o) => o.type === 'master' && o.sous_type === 'professionnel',
    );
  }

  cyclesIngenieur(): Offre[] {
    return this.offresInscription.filter((o) => o.type === 'cycle_ingenieur');
  }

  dejaCandidature(masterId: number): boolean {
    const offre = this.offresInscription.find((o) => o.id === masterId);
    if (!offre) return false;
    return this.mesCandidatures.some((c) => c.master_id === offre.id);
  }

  postuler(offre: Offre): void {
    if (!this.actionPermissions.preinscription) {
      this.notifyActionBlocked("Action préinscription désactivée par l'administration.");
      return;
    }

    if (this.dejaCandidature(offre.id)) {
      alert('Vous avez déjà candidaté pour cette offre');
      return;
    }

    if (offre.statut === 'ferme') {
      alert('❌ Cette offre est fermée');
      return;
    }

    const titre = offre.type === 'cycle_ingenieur' ? offre.titre : offre.titre;

    if (confirm(`Postuler pour ${titre} ?`)) {
      const token = this.authService.getAccessToken();

      this.http
        .post(
          'http://localhost:8003/api/candidatures/create/',
          { master_id: offre.id },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .subscribe({
          next: (response: any) => {
            alert('✅ Candidature soumise avec succès !');
            this.mesCandidatures.push({
              id: response.id,
              numero: response.numero,
              master_nom: offre.titre,
              master: response.master,
              master_id: offre.id,
              statut: 'soumis',
              date_soumission: new Date().toISOString(),
              etat_candidature: 'En cours',
              dossier_valide: false,
              date_depot_dossier: '',
              dossier_depose: false,
            });
            this.loadMesCandidatures();
            this.loadMesDossiers();
            this.switchView('candidatures');
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de la soumission');
          },
        });
    }
  }

  postulerOffre(offre: Offre): void {
    this.postuler(offre);
  }

  accederAuDossier(candidature: Candidature): void {
    if (!this.actionPermissions.consultationDossier && !this.actionPermissions.depotDossier) {
      this.notifyActionBlocked("Accès dossier désactivé par l'administration.");
      return;
    }

    const dossier = this.dossiersCandidature.find(
      (d) => d.numero_candidature === candidature.numero,
    );
    if (dossier) {
      this.selectedDossierNumber = dossier.numero_dossier;
      this.switchView('mon-dossier');
    } else {
      alert('Dossier non trouvé');
    }
  }

  getDossierNumber(candidatureNumero: string): string | null {
    const dossier = this.dossiersCandidature.find(
      (d) => d.numero_candidature === candidatureNumero,
    );
    return dossier ? dossier.numero_dossier : null;
  }

  dossiersAffiches(): DossierCandidature[] {
    if (!this.selectedDossierNumber) {
      return this.dossiersCandidature;
    }
    return this.dossiersCandidature.filter((d) => d.numero_dossier === this.selectedDossierNumber);
  }

  currentAcademicYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const start = now.getMonth() >= 8 ? year : year - 1;
    return `${start}/${start + 1}`;
  }

  candidaturesMaster(): Candidature[] {
    return this.mesCandidatures.filter((c) => !this.isCycleIngenieur(c));
  }

  candidaturesIngenieur(): Candidature[] {
    return this.mesCandidatures.filter((c) => this.isCycleIngenieur(c));
  }

  isCycleIngenieur(candidature: Candidature): boolean {
    const nom = (candidature.master_nom || '').toLowerCase();
    return nom.includes('ingénieur') || nom.includes('ingenieur');
  }

  workflowSteps(candidature: Candidature): Array<{ key: string; label: string; done: boolean }> {
    const submitted = candidature.statut === 'soumis' || !!candidature.date_soumission;
    const preselected = ['sous_examen', 'preselectionne', 'selectionne', 'inscrit'].includes(
      candidature.statut,
    );
    const dossierDone =
      !!candidature.dossier_depose ||
      ['dossier_depose', 'selectionne', 'inscrit'].includes(candidature.statut);
    const selected = ['selectionne', 'inscrit'].includes(candidature.statut);
    const confirmed =
      candidature.statut_inscription === 'valide' || candidature.statut === 'inscrit';

    return [
      { key: 'preinscription', label: 'Préinscription', done: submitted },
      { key: 'preselection', label: 'Présélection', done: preselected },
      { key: 'depot_dossier', label: 'Dépôt de dossier', done: dossierDone },
      { key: 'selection', label: 'Sélection de candidature', done: selected },
      { key: 'confirmation', label: 'Confirmation inscription en ligne', done: confirmed },
    ];
  }

  workflowProcessGuide(): Array<{ title: string; description: string }> {
    return [
      {
        title: 'Préinscription',
        description: 'Création du compte candidat et soumission de la candidature.',
      },
      {
        title: 'Présélection',
        description: 'Classement préliminaire automatique selon votre dossier académique.',
      },
      {
        title: 'Dépôt de dossier',
        description: 'Téléversement et contrôle des pièces justificatives demandées.',
      },
      {
        title: 'Sélection de candidature',
        description: 'Étude finale par la commission et publication du résultat.',
      },
      {
        title: 'Inscription en ligne',
        description: 'Validation finale après paiement sur inscription.tn.',
      },
    ];
  }

  toggleActionMenu(candidatureId: number): void {
    this.openActionMenuId = this.openActionMenuId === candidatureId ? null : candidatureId;
  }

  closeActionMenu(): void {
    this.openActionMenuId = null;
  }

  consulterCandidature(candidature: Candidature): void {
    this.closeActionMenu();
    this.router.navigate(['/candidat/candidature', candidature.id]);
  }

  ouvrirDepotDossier(candidature: Candidature): void {
    if (!this.actionPermissions.depotDossier) {
      this.notifyActionBlocked("Dépôt de dossier désactivé par l'administration.");
      return;
    }

    this.closeActionMenu();
    this.accederAuDossier(candidature);
  }

  ouvrirInscriptionDepuisCandidature(candidature: Candidature): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Consultation candidature désactivée par l'administration.");
      return;
    }

    this.closeActionMenu();
    this.selectedCandidatureForInscription = candidature;
    this.switchView('inscription');
  }

  ouvrirInscription(candidature: Candidature, fileInput: HTMLInputElement): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Inscription en ligne désactivée par l'administration.");
      return;
    }

    this.selectedCandidatureForInscription = candidature;
    fileInput.value = '';
    fileInput.click();
  }

  onFichierPaiementDirectSelected(event: Event, candidature: Candidature): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Fichier trop volumineux (max 5 Mo)');
      return;
    }

    const reference = prompt('Entrez la référence de paiement (inscription.tn):', '');
    if (!reference || !reference.trim()) {
      alert('❌ Référence de paiement obligatoire');
      return;
    }

    this.soumettrePaiementDirect(candidature, file, reference.trim());
  }

  ouvrirDossierDepuisTable(numeroDossier: string): void {
    if (!this.actionPermissions.depotDossier) {
      this.notifyActionBlocked("Import dossier désactivé par l'administration.");
      return;
    }

    this.selectedDossierNumber = numeroDossier;
    this.switchView('importer');
  }

  resetSelectionDossier(): void {
    this.selectedDossierNumber = null;
  }

  voirDetails(candidature: Candidature): void {
    alert(`Voir détails de ${candidature.master_nom}`);
  }

  gererDossier(candidature: Candidature): void {
    if (candidature.dossier_depose) {
      alert(`Modifier le dossier pour ${candidature.master_nom}`);
    } else {
      this.switchView('mon-dossier');
    }
  }

  nouvelleCandidature(): void {
    if (!this.actionPermissions.preinscription) {
      this.notifyActionBlocked("Préinscription désactivée par l'administration.");
      return;
    }

    this.switchView('offres-inscription');
  }

  deposerDocument(doc: Document): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.jpg,.jpeg,.png';

    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('❌ Fichier trop volumineux (max 5 Mo)');
          return;
        }

        const token = this.authService.getAccessToken();
        const formData = new FormData();
        formData.append('document', file);
        formData.append('type', doc.nom);

        this.http
          .post('http://localhost:8003/api/documents/upload/', formData, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .subscribe({
            next: () => {
              doc.depose = true;
              doc.date_depot = new Date().toISOString().split('T')[0];
              alert('✅ Document déposé avec succès !');
            },
            error: (error) => {
              console.error('Erreur:', error);
              alert('❌ Erreur lors du dépôt');
            },
          });
      }
    };

    input.click();
  }

  voirDocument(doc: Document): void {
    alert(`Voir le document : ${doc.nom}`);
  }

  soumettrePaiementDirect(
    candidature: Candidature,
    fichierPaiement: File,
    reference: string,
  ): void {
    const token = this.authService.getAccessToken();
    const formData = new FormData();

    formData.append('candidature_id', candidature.id.toString());
    formData.append('reference_paiement', reference);
    formData.append('montant', '500');
    formData.append('fichier_paiement', fichierPaiement);

    this.http
      .post('http://localhost:8003/api/inscriptions/soumettre-paiement/', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          alert('✅ Paiement soumis avec succès !');
          candidature.statut_inscription = 'paiement_soumis';
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de la soumission du paiement');
        },
      });
  }

  getObjetLabel(objet: string): string {
    const labels: any = {
      score: 'Score incorrect',
      statut: 'Statut non mis à jour',
      dossier: 'Problème de dossier',
      paiement: 'Problème de paiement',
      autre: 'Autre',
    };
    return labels[objet] || objet;
  }

  getStatutReclamationLabel(statut: string): string {
    const labels: any = {
      en_cours: 'En cours',
      en_attente: 'En attente',
      traitee: 'Traitée',
    };
    return labels[statut] || statut;
  }

  ouvrirModalReclamation(): void {
    if (!this.actionPermissions.deposerReclamation) {
      this.notifyActionBlocked("Dépôt de réclamation désactivé par l'administration.");
      return;
    }

    this.nouvelleReclamation = {
      master_id: '',
      objet: '',
      motif: '',
    };
    this.showModalReclamation = true;
  }

  fermerModalReclamation(): void {
    this.showModalReclamation = false;
  }

  soumettreReclamation(): void {
    if (!this.actionPermissions.deposerReclamation) {
      this.notifyActionBlocked("Dépôt de réclamation désactivé par l'administration.");
      return;
    }

    if (
      !this.nouvelleReclamation.master_id ||
      !this.nouvelleReclamation.objet ||
      !this.nouvelleReclamation.motif
    ) {
      alert('❌ Veuillez remplir tous les champs');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post('http://localhost:8003/api/reclamations/creer/', this.nouvelleReclamation, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          alert('✅ Réclamation soumise avec succès !');
          this.reclamations.unshift({
            id: response.id ?? Date.now(),
            identifiant: response.identifiant ?? `RECL-${new Date().getFullYear()}-${Date.now()}`,
            objet: response.objet ?? this.nouvelleReclamation.objet,
            master_nom: response.master_nom ?? 'Master',
            master_id: response.master_id ?? Number(this.nouvelleReclamation.master_id),
            motif: response.motif ?? this.nouvelleReclamation.motif,
            date: response.date ?? new Date().toISOString(),
            statut: response.statut ?? 'en_cours',
            reponse: response.reponse ?? null,
          });
          this.fermerModalReclamation();
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de la soumission');
        },
      });
  }

  voirReclamation(reclamation: Reclamation): void {
    alert(`Détails réclamation: ${reclamation.identifiant}\n\n${reclamation.motif}`);
  }

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

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.fichierInscription = files[0];
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('❌ Fichier trop volumineux (max 5 Mo)');
        return;
      }
      this.fichierInscription = file;
    }
  }

  removeFichier(): void {
    this.fichierInscription = null;
  }

  uploadFichier(): void {
    if (!this.fichierInscription) return;

    const token = this.authService.getAccessToken();
    const formData = new FormData();
    formData.append('fichier', this.fichierInscription);

    this.http
      .post('http://localhost:8003/api/candidatures/upload-fichier/', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          alert('✅ Fichier envoyé avec succès !');
          this.fichiersHistorique.unshift({
            id: Date.now(),
            nom: this.fichierInscription!.name,
            date: new Date().toLocaleDateString('fr-FR'),
          });
          this.fichierInscription = null;
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert("❌ Erreur lors de l'envoi du fichier");
        },
      });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  voirFichier(fichier: FichierHistorique): void {
    alert(`Voir le fichier : ${fichier.nom}`);
  }

  telechargerFichier(fichier: FichierHistorique): void {
    alert(`Télécharger le fichier : ${fichier.nom}`);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
