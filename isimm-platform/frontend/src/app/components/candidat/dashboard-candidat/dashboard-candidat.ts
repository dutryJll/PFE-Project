import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Candidature {
  id: number;
  numero: string;
  master_nom: string;
  master?: number;
  master_id?: number;
  statut: string;
  motif_rejet?: string;
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
  choix_priorite?: number;
  date_limite_modification?: string;
  peut_modifier?: boolean;
  jours_restants?: number;
}

type WorkflowStageState = 'done' | 'current' | 'pending' | 'rejected';

interface WorkflowStage {
  label: string;
  state: WorkflowStageState;
  hint?: string;
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
  document_officiel_pdf_url?: string | null;
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

interface DossierPreferenceForm {
  nom_prenom: string;
  etablissement_origine: string;
  diplome: string;
  choix_1: string;
  choix_2: string;
  choix_3: string;
  numero_dossier_reserve_administration: string;
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

interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  date: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  lue: boolean;
}

interface FichierHistorique {
  nom: string;
  date: string;
  id: number;
}

interface OffreDetailRow {
  capaciteAccueilleTotale: string;
  etablissementOrigine: string;
  capaciteAccueille: string;
  typeDiplome: string;
  datesImportantes: string;
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

type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';
type ExportRow = Record<string, string | number | boolean | null | undefined>;

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
  | 'notifications'
  | 'importer';

interface CandidatActionPermissions {
  preinscription: boolean;
  consultationCandidature: boolean;
  consultationDossier: boolean;
  depotDossier: boolean;
  suiviCandidature: boolean;
  deposerReclamation: boolean;
}

function normalizeActionLabel(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Component({
  selector: 'app-dashboard-candidat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-candidat.html',
  styleUrl: './dashboard-candidat.css',
})
export class DashboardCandidatComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  currentView: CandidatView = 'dashboard';
  currentDate: Date = new Date();

  showAlert: boolean = true;

  // ✅ AJOUT - Filtre année pour historique
  filtreAnnee: string = '';
  selectedDossierNumber: string | null = null;
  dossierPreferenceForm: DossierPreferenceForm = {
    nom_prenom: '',
    etablissement_origine: 'ISIMM',
    diplome: '',
    choix_1: '',
    choix_2: '',
    choix_3: '',
    numero_dossier_reserve_administration: '',
  };
  selectedCandidatureForInscription: Candidature | null = null;
  openActionMenuId: number | null = null;
  inscriptionExportFormat: ExportFormat = 'pdf';
  notificationsNonLues = 0;
  isWorkflowMockMode = false;
  isPreferenceFormDemoMode = false;
  showEditCandidatureModal: boolean = false;
  selectedCandidatureForEdit: Candidature | null = null;
  editChoixPriorite: number = 1;
  showSubmissionWizardModal: boolean = false;
  wizardCurrentStep: number = 1;
  wizardMaxAllowedStep: number = 1;
  wizardOffre: Offre | null = null;
  selectedOffreDetail: Offre | null = null;
  wizardData: {
    type: string;
    titre: string;
    resume: string;
    fichierNom: string;
    attributs: string;
    auteurs: string;
    reviewers: string;
    details: string;
    confirmation: boolean;
  } = {
    type: '',
    titre: '',
    resume: '',
    fichierNom: '',
    attributs: '',
    auteurs: '',
    reviewers: '',
    details: '',
    confirmation: false,
  };

  private countdownNow: number = Date.now();
  private countdownTimerId: ReturnType<typeof setInterval> | null = null;
  private ws: WebSocket | null = null;
  private reconnectTimerId: ReturnType<typeof setTimeout> | null = null;
  private queryParamsSub: Subscription | null = null;
  private readonly wsReconnectDelayMs = 3000;

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
    {
      id: 1,
      titre: 'Mastère Professionnel en Génie logiciel(GL)',
      type: 'master',
      sous_type: 'professionnel',
      description: 'Formation professionnelle orientée ingénierie logicielle.',
      date_limite: '2026-07-22',
      places: 35,
      statut: 'ouvert',
    },
    {
      id: 2,
      titre: 'Mastère Professionnel en sciences de données(DS)',
      type: 'master',
      sous_type: 'professionnel',
      description: 'Formation professionnelle en sciences de données.',
      date_limite: '2026-07-22',
      places: 35,
      statut: 'ouvert',
    },
    {
      id: 3,
      titre: 'Mastère Professionnel en Ingénieries en Instrumentation industrielle (3I)',
      type: 'master',
      sous_type: 'professionnel',
      description: 'Formation professionnelle en instrumentation industrielle.',
      date_limite: '2026-07-22',
      places: 30,
      statut: 'ouvert',
    },
    {
      id: 4,
      titre: 'Mastère Recherche en Génie logiciel(MRGL)',
      type: 'master',
      sous_type: 'recherche',
      description: 'Mastère recherche en génie logiciel.',
      date_limite: '2026-07-22',
      places: 30,
      statut: 'ouvert',
    },
    {
      id: 5,
      titre: 'Mastère Recherche en micro-électronique et instrumentation',
      type: 'master',
      sous_type: 'recherche',
      description: 'Mastère recherche en micro-électronique et instrumentation.',
      date_limite: '2026-07-22',
      places: 30,
      statut: 'ouvert',
    },
    {
      id: 6,
      titre: 'Ingénieur en sciences Appliquées et Technologie : Informatique, Génie logiciel',
      type: 'cycle_ingenieur',
      specialite: 'Informatique, Génie logiciel',
      description: 'Cycle ingénieur en informatique et génie logiciel.',
      date_limite: '2026-07-22',
      places: 50,
      statut: 'ouvert',
    },
    {
      id: 7,
      titre: 'Ingénieur en sciences Appliquées et Technologie : Electronique, Microélectronique',
      type: 'cycle_ingenieur',
      specialite: 'Electronique, Microélectronique',
      description: 'Cycle ingénieur en électronique et microélectronique.',
      date_limite: '2026-07-22',
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

  notificationsCandidat: NotificationItem[] = [];
  filtreNotificationType: '' | 'info' | 'success' | 'warning' | 'danger' = '';
  filtreNotificationDateDebut: string = '';
  filtreNotificationDateFin: string = '';

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
  selectedDocumentFiles: Record<number, File | null> = {};
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
  customRoleActions: string[] = [];
  private readonly customActionViewMap: Record<string, CandidatView> = {
    [normalizeActionLabel('Préinscription')]: 'offres-inscription',
    [normalizeActionLabel('Consultation de candidature')]: 'candidatures',
    [normalizeActionLabel('Dépôt de dossier')]: 'mon-dossier',
    [normalizeActionLabel('Consultation de dossier')]: 'mon-dossier',
    [normalizeActionLabel('Suivi de candidature')]: 'suivi',
    [normalizeActionLabel('Déposer réclamation')]: 'reclamations',
    [normalizeActionLabel('Historique des candidatures')]: 'historique',
    [normalizeActionLabel('Inscription en ligne')]: 'inscription',
    [normalizeActionLabel('Mon profil')]: 'profil',
  };
  private readonly knownActionNameSet = new Set<string>([
    normalizeActionLabel('Préinscription'),
    normalizeActionLabel('Consultation de candidature'),
    normalizeActionLabel('Consultation de dossier'),
    normalizeActionLabel('Dépôt de dossier'),
    normalizeActionLabel('Suivi de candidature'),
    normalizeActionLabel('Déposer réclamation'),
  ]);

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
    this.initializeDossierPreferenceForm();

    const requestedView = this.route.snapshot.queryParamMap.get('view') as CandidatView | null;
    const workflowMockMode = this.route.snapshot.queryParamMap.get('workflowMock') === '1';
    if (requestedView && this.canAccessView(requestedView)) {
      this.currentView = requestedView;
    }

    this.queryParamsSub = this.route.queryParamMap.subscribe((params) => {
      const isMock = params.get('workflowMock') === '1';
      const isPreferenceFormDemo = params.get('preferenceFormDemo') === '1';
      const viewParam = params.get('view') as CandidatView | null;

      this.isPreferenceFormDemoMode = isPreferenceFormDemo;
      if (this.isPreferenceFormDemoMode) {
        this.prefillPreferenceFormDemoValues();
      }

      if (isMock) {
        this.isWorkflowMockMode = true;
        this.mesCandidatures = this.buildWorkflowMockCandidatures();
        this.currentView = 'suivi';
        return;
      }

      if (this.isWorkflowMockMode) {
        this.isWorkflowMockMode = false;
        this.loadMesCandidatures();
        this.loadMesDossiers();
        this.loadNotifications();
      }

      if (viewParam && this.canAccessView(viewParam)) {
        this.currentView = viewParam;
      }
    });

    if (workflowMockMode) {
      this.isWorkflowMockMode = true;
      this.mesCandidatures = this.buildWorkflowMockCandidatures();
      this.currentView = 'suivi';
      this.loadActionPermissions();
      this.startCountdownClock();
      return;
    }

    this.loadActionPermissions();
    this.loadMesCandidatures();
    this.loadOffresInscription();
    this.loadMesDossiers();
    this.loadNotifications();
    this.startCountdownClock();
    this.connectStatusWebSocket();
  }

  ngOnDestroy(): void {
    if (this.queryParamsSub) {
      this.queryParamsSub.unsubscribe();
      this.queryParamsSub = null;
    }
    this.stopCountdownClock();
    this.disconnectStatusWebSocket();
  }

  private startCountdownClock(): void {
    this.stopCountdownClock();
    this.countdownTimerId = setInterval(() => {
      this.countdownNow = Date.now();
    }, 1000);
  }

  private stopCountdownClock(): void {
    if (this.countdownTimerId) {
      clearInterval(this.countdownTimerId);
      this.countdownTimerId = null;
    }
  }

  private buildWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return `${protocol}://localhost:8003/ws/candidatures/`;
  }

  private connectStatusWebSocket(): void {
    this.disconnectStatusWebSocket();

    try {
      this.ws = new WebSocket(this.buildWebSocketUrl());
    } catch (error) {
      console.warn('WebSocket indisponible:', error);
      this.scheduleWebSocketReconnect();
      return;
    }

    this.ws.onopen = () => {
      if (this.reconnectTimerId) {
        clearTimeout(this.reconnectTimerId);
        this.reconnectTimerId = null;
      }
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.type !== 'candidature_status_changed') {
          return;
        }

        const userId = this.currentUser?.id;
        if (!userId || payload.candidate_user_id !== userId) {
          return;
        }

        this.loadMesCandidatures();
        this.loadMesDossiers();
        this.loadNotifications();
      } catch (error) {
        console.warn('Message WebSocket invalide:', error);
      }
    };

    this.ws.onclose = () => {
      this.scheduleWebSocketReconnect();
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  private scheduleWebSocketReconnect(): void {
    if (this.reconnectTimerId) {
      return;
    }
    this.reconnectTimerId = setTimeout(() => {
      this.reconnectTimerId = null;
      this.connectStatusWebSocket();
    }, this.wsReconnectDelayMs);
  }

  private disconnectStatusWebSocket(): void {
    if (this.reconnectTimerId) {
      clearTimeout(this.reconnectTimerId);
      this.reconnectTimerId = null;
    }

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
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

  openCustomRoleAction(actionName: string): void {
    const normalized = normalizeActionLabel(actionName);
    const target = this.customActionViewMap[normalized];

    if (!target) {
      this.notifyActionBlocked(`Action non mappée: ${actionName}`);
      return;
    }

    this.switchView(target);
  }

  private loadActionPermissions(): void {
    this.authService.getMyEnabledActions().subscribe({
      next: (actions: string[]) => {
        this.customRoleActions = this.extractCustomRoleActions(actions || []);

        // Fallback permissif: si l'API des actions est indisponible/vide,
        // on conserve les permissions locales pour ne pas masquer le menu candidat.
        if (!actions || actions.length === 0) {
          console.warn('Aucune action distante chargee, conservation des permissions locales.');
          return;
        }

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
        this.customRoleActions = [];
        console.warn('Permissions indisponibles, maintien du mode permissif local.');
      },
    });
  }

  private extractCustomRoleActions(actions: string[]): string[] {
    const unique = new Set<string>();
    const custom: string[] = [];

    (actions || []).forEach((name) => {
      const cleaned = (name || '').trim();
      if (!cleaned) {
        return;
      }

      const normalized = normalizeActionLabel(cleaned);
      if (this.knownActionNameSet.has(normalized) || unique.has(normalized)) {
        return;
      }

      unique.add(normalized);
      custom.push(cleaned);
    });

    return custom;
  }

  canAccessView(view: CandidatView): boolean {
    if (view === 'dashboard' || view === 'profil') {
      return true;
    }

    if (view === 'notifications') {
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
      'offres-inscription': 'Préinscription',
      candidatures: 'Candidatures',
      'mon-dossier': 'Dossiers de candidature',
      reclamations: 'Réclamation',
      notifications: 'Notifications',
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
            jours_restants: item.jours_restants ?? 0,
            peut_modifier: item.peut_modifier ?? false,
            statut_inscription: item.statut_inscription ?? '',
            motif_rejet: item.motif_rejet ?? '',
          }));
          this.loadNotifications();
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
            document_officiel_pdf_url: offre.document_officiel_pdf_url || null,
          }));
          this.loadNotifications();
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

  private loadNotifications(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<NotificationItem[]>('http://localhost:8003/api/candidatures/mes-notifications/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data) => {
          this.notificationsCandidat = data || [];
          this.notificationsNonLues = this.notificationsCandidat.filter((item) => !item.lue).length;
        },
        error: (error) => {
          console.error('Erreur chargement notifications:', error);
          this.notificationsCandidat = [];
          this.notificationsNonLues = 0;
        },
      });
  }

  marquerNotificationCommeLue(notificationId: number): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .post(
        `http://localhost:8003/api/candidatures/notifications/${notificationId}/mark-read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          this.notificationsCandidat = this.notificationsCandidat.map((notification) =>
            notification.id === notificationId ? { ...notification, lue: true } : notification,
          );
          this.notificationsNonLues = this.notificationsCandidat.filter((item) => !item.lue).length;
        },
        error: (error) => {
          console.error('Erreur marquage notification lue:', error);
        },
      });
  }

  marquerToutesNotificationsCommeLues(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .post(
        'http://localhost:8003/api/candidatures/notifications/mark-all-read/',
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (response: any) => {
          this.notificationsCandidat = this.notificationsCandidat.map((notification) => ({
            ...notification,
            lue: true,
          }));
          this.notificationsNonLues = 0;
        },
        error: (error) => {
          console.error('Erreur marquage notifications lues:', error);
        },
      });
  }

  getNotificationsFiltrees(): NotificationItem[] {
    return this.notificationsCandidat.filter((notification) => {
      if (this.filtreNotificationType && notification.type !== this.filtreNotificationType) {
        return false;
      }

      const notificationDate = new Date(notification.date);

      if (this.filtreNotificationDateDebut) {
        const dateDebut = new Date(`${this.filtreNotificationDateDebut}T00:00:00`);
        if (notificationDate < dateDebut) {
          return false;
        }
      }

      if (this.filtreNotificationDateFin) {
        const dateFin = new Date(`${this.filtreNotificationDateFin}T23:59:59`);
        if (notificationDate > dateFin) {
          return false;
        }
      }

      return true;
    });
  }

  reinitialiserFiltresNotifications(): void {
    this.filtreNotificationType = '';
    this.filtreNotificationDateDebut = '';
    this.filtreNotificationDateFin = '';
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

    this.router.navigate(['/candidature/in-progress'], {
      queryParams: {
        offerId: offre.id,
        type: offre.type,
        title: offre.titre,
      },
    });
  }

  startSubmissionWizard(offre: Offre): void {
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

    this.wizardOffre = offre;
    this.wizardCurrentStep = 1;
    this.wizardMaxAllowedStep = 1;
    this.wizardData = {
      type: offre.type,
      titre: offre.titre,
      resume: '',
      fichierNom: '',
      attributs: '',
      auteurs: '',
      reviewers: '',
      details: '',
      confirmation: false,
    };
    this.showSubmissionWizardModal = true;
  }

  closeSubmissionWizard(): void {
    this.showSubmissionWizardModal = false;
    this.wizardOffre = null;
  }

  canGoToWizardStep(step: number): boolean {
    return step >= 1 && step <= this.wizardMaxAllowedStep;
  }

  goToWizardStep(step: number): void {
    if (this.canGoToWizardStep(step)) {
      this.wizardCurrentStep = step;
    }
  }

  previousWizardStep(): void {
    if (this.wizardCurrentStep > 1) {
      this.wizardCurrentStep -= 1;
    }
  }

  nextWizardStep(): void {
    if (!this.isWizardStepValid(this.wizardCurrentStep)) {
      alert('❌ Veuillez compléter les champs requis avant de continuer.');
      return;
    }

    if (this.wizardCurrentStep < 7) {
      this.wizardCurrentStep += 1;
      this.wizardMaxAllowedStep = Math.max(this.wizardMaxAllowedStep, this.wizardCurrentStep);
    }
  }

  private isWizardStepValid(step: number): boolean {
    if (step === 1) {
      return (
        !!this.wizardData.type && !!this.wizardData.titre.trim() && !!this.wizardData.resume.trim()
      );
    }

    if (step === 2) {
      return !!this.wizardData.fichierNom;
    }

    if (step === 7) {
      return this.wizardData.confirmation;
    }

    return true;
  }

  onWizardFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    this.wizardData.fichierNom = file.name;
  }

  submitWizardCandidature(): void {
    if (!this.wizardOffre) {
      return;
    }

    if (!this.isWizardStepValid(7)) {
      alert('❌ Veuillez confirmer avant de soumettre.');
      return;
    }

    const offre = this.wizardOffre;
    this.closeSubmissionWizard();
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

  private buildWorkflowMockCandidatures(): Candidature[] {
    const today = new Date().toISOString();
    return [
      {
        id: 9001,
        numero: 'SIM-001',
        master_nom: 'Scenario 1 - Paiement non confirme puis rejet',
        master_id: 1,
        statut: 'rejete',
        date_soumission: today,
        etat_candidature: 'Rejeté',
        dossier_valide: true,
        date_depot_dossier: today,
        dossier_depose: true,
        statut_inscription: 'non_confirme',
        motif_rejet: 'Paiement non valide sur inscription en ligne',
      },
      {
        id: 9002,
        numero: 'SIM-002',
        master_nom: 'Scenario 2 - Non presélectionné',
        master_id: 2,
        statut: 'non_preselectionne',
        date_soumission: today,
        etat_candidature: 'Non présélectionné',
        dossier_valide: false,
        dossier_depose: false,
        date_depot_dossier: '',
      },
      {
        id: 9003,
        numero: 'SIM-003',
        master_nom: 'Scenario 3 - Dossier non depose',
        master_id: 3,
        statut: 'dossier_non_depose',
        date_soumission: today,
        etat_candidature: 'Rejeté',
        dossier_valide: false,
        dossier_depose: false,
        date_depot_dossier: '',
        motif_rejet: 'Dossier de candidature non depose avant delai',
      },
      {
        id: 9004,
        numero: 'SIM-004',
        master_nom: 'Scenario 4 - Sélectionnée (en attente) / Non admis',
        master_id: 4,
        statut: 'non_admis',
        date_soumission: today,
        etat_candidature: 'Non admis',
        dossier_valide: true,
        dossier_depose: true,
        date_depot_dossier: today,
        statut_inscription: 'en_attente',
        motif_rejet: 'non admis',
      },
    ];
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
    const rawSubmitted = candidature.statut === 'soumis' || !!candidature.date_soumission;
    const rawPreselected = ['sous_examen', 'preselectionne', 'selectionne', 'inscrit'].includes(
      candidature.statut,
    );
    const rawDossierDone =
      !!candidature.dossier_depose ||
      ['dossier_depose', 'selectionne', 'inscrit'].includes(candidature.statut);
    const rawSelected = ['selectionne', 'inscrit'].includes(candidature.statut);
    const rawConfirmed =
      candidature.statut_inscription === 'valide' || candidature.statut === 'inscrit';

    // Verrouillage séquentiel: une étape n'est validée que si toutes les précédentes le sont.
    const submitted = rawSubmitted;
    const preselected = submitted && rawPreselected;
    const dossierDone = preselected && rawDossierDone;
    const selected = dossierDone && rawSelected;
    const confirmed = selected && rawConfirmed;

    return [
      { key: 'preinscription', label: 'Préinscription', done: submitted },
      { key: 'preselection', label: 'Présélection', done: preselected },
      { key: 'depot_dossier', label: 'Dépôt de dossier', done: dossierDone },
      { key: 'selection', label: 'Sélection de candidature', done: selected },
      { key: 'confirmation', label: 'Confirmation inscription en ligne', done: confirmed },
    ];
  }

  workflowTimeline(candidature: Candidature): WorkflowStage[] {
    const statut = (candidature.statut || '').toLowerCase();
    const statutInscription = (candidature.statut_inscription || '').toLowerCase();
    const motifRejet = (candidature.motif_rejet || '').toLowerCase();

    const hasDossier =
      !!candidature.dossier_depose ||
      ['dossier_depose', 'en_attente', 'selectionne', 'inscrit'].includes(statut);
    const hasPreselection =
      [
        'preselectionne',
        'non_preselectionne',
        'non_preselectionnee',
        'en_attente_dossier',
        'dossier_non_depose',
        'dossier_depose',
        'en_attente',
        'en_attente_selection',
        'selectionne',
        'inscrit',
      ].includes(statut) || hasDossier;

    const isRejected = ['rejete', 'rejetee'].includes(statut);
    const isNonAdmis =
      ['non_admis', 'non_admise'].includes(statut) || motifRejet.includes('non admis');
    const isSelected = ['selectionne', 'inscrit'].includes(statut);
    const isSelectionWaiting = ['en_attente', 'en_attente_selection'].includes(statut);
    const inscriptionConfirmed = statut === 'inscrit' || statutInscription === 'valide';
    const inscriptionNotConfirmed = [
      'non_confirme',
      'non_confirmee',
      'non confirme',
      'non confirmee',
      'rejete',
      'rejetee',
      'echec',
      'refuse',
    ].includes(statutInscription);
    const paymentOrInscriptionIssue =
      motifRejet.includes('paiement') || motifRejet.includes('inscription');
    const wasSelectedBeforeRejection =
      isRejected && hasDossier && (inscriptionNotConfirmed || paymentOrInscriptionIssue);
    const inscriptionPending = isSelected && !inscriptionConfirmed;

    if (
      ['non_preselectionne', 'non_preselectionnee'].includes(statut) ||
      (isRejected && !hasPreselection)
    ) {
      return [
        { label: 'Préinscrit', state: 'done' },
        { label: 'Non présélectionné', state: 'rejected' },
      ];
    }

    if (
      statut === 'dossier_non_depose' ||
      (isRejected && !hasDossier && motifRejet.includes('dossier'))
    ) {
      return [
        { label: 'Préinscrit', state: 'done' },
        { label: 'Présélectionné', state: 'done' },
        { label: 'Dossier de candidature non déposé', state: 'rejected' },
        { label: 'Candidature rejetée', state: 'rejected' },
      ];
    }

    if (statut === 'soumis') {
      return [
        { label: 'Préinscrit', state: 'done' },
        { label: 'Présélectionné', state: 'pending' },
      ];
    }

    if (statut === 'sous_examen') {
      return [
        { label: 'Préinscrit', state: 'done' },
        { label: 'Présélectionné', state: 'current', hint: 'En cours de vérification' },
      ];
    }

    const steps: WorkflowStage[] = [
      { label: 'Préinscrit', state: 'done' },
      { label: 'Présélectionné', state: hasPreselection ? 'done' : 'pending' },
      {
        label: 'Dossier de candidature déposé',
        state: hasDossier ? 'done' : hasPreselection ? 'current' : 'pending',
      },
      {
        label: isSelectionWaiting
          ? 'Candidature sélectionnée (en attente)'
          : 'Candidature sélectionnée',
        state: isSelected
          ? 'done'
          : isSelectionWaiting
            ? 'current'
            : hasDossier
              ? 'current'
              : 'pending',
        hint:
          (isSelected || isSelectionWaiting) && !inscriptionConfirmed
            ? 'En attente de confirmation d’inscription'
            : undefined,
      },
    ];

    if (inscriptionConfirmed) {
      steps.push({ label: 'Inscription en ligne confirmée', state: 'done' });
      return steps;
    }

    if (isNonAdmis) {
      steps.push({ label: 'Non admis', state: 'rejected' });
      return steps;
    }

    if (isRejected) {
      if (
        (hasPreselection && hasDossier && (inscriptionNotConfirmed || paymentOrInscriptionIssue)) ||
        (isSelected && !inscriptionConfirmed)
      ) {
        steps.push({ label: 'Inscription en ligne non confirmée', state: 'rejected' });
      }
      steps.push({ label: 'Candidature rejetée', state: 'rejected' });
      return steps;
    }

    if (inscriptionPending) {
      steps.push({ label: 'Inscription en ligne non confirmée', state: 'current' });
    }

    return steps;
  }

  canAccessInscriptionEtape(candidature: Candidature): boolean {
    return ['selectionne', 'inscrit'].includes(candidature.statut);
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
    this.router.navigate(['/candidature/in-progress'], {
      queryParams: {
        candidatureId: candidature.id,
        type: this.isCycleIngenieur(candidature) ? 'ingenieur' : 'master',
        title: candidature.master_nom,
      },
    });
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

    if (!this.canAccessInscriptionEtape(candidature)) {
      this.notifyActionBlocked(
        "Vous devez terminer les étapes précédentes (présélection, dépôt dossier, sélection) avant l'inscription en ligne.",
      );
      return;
    }

    this.closeActionMenu();
    this.selectedCandidatureForInscription = candidature;
    this.switchView('inscription');
  }

  canModifyCandidature(candidature: Candidature): boolean {
    if (candidature.statut !== 'soumis' || candidature.peut_modifier !== true) {
      return false;
    }

    if (!candidature.date_limite_modification) {
      return false;
    }

    return new Date(candidature.date_limite_modification).getTime() > this.countdownNow;
  }

  canShowModifyButton(candidature: Candidature): boolean {
    return this.actionPermissions.consultationCandidature && candidature.statut === 'soumis';
  }

  getModificationCountdown(candidature: Candidature): string {
    if (!candidature.date_limite_modification) {
      return 'Délai indisponible';
    }

    const remainingMs =
      new Date(candidature.date_limite_modification).getTime() - this.countdownNow;
    if (remainingMs <= 0) {
      return 'Expiré';
    }

    const totalMinutes = Math.floor(remainingMs / 60000);
    const days = Math.floor(totalMinutes / (24 * 60));
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days}j ${hours}h ${minutes}min`;
    }

    return `${hours}h ${minutes}min`;
  }

  modifierCandidature(candidature: Candidature): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Modification candidature désactivée par l'administration.");
      return;
    }

    if (!this.canModifyCandidature(candidature)) {
      this.notifyActionBlocked(
        'Cette candidature ne peut plus être modifiée (délai dépassé ou statut non autorisé).',
      );
      return;
    }

    this.closeActionMenu();
    this.selectedCandidatureForEdit = candidature;
    this.editChoixPriorite = candidature.choix_priorite ?? 1;
    this.showEditCandidatureModal = true;
  }

  fermerModalModification(): void {
    this.showEditCandidatureModal = false;
    this.selectedCandidatureForEdit = null;
    this.editChoixPriorite = 1;
  }

  confirmerModificationCandidature(): void {
    if (!this.selectedCandidatureForEdit) {
      return;
    }

    const priorite = Number(this.editChoixPriorite);
    if (!Number.isInteger(priorite) || priorite < 1 || priorite > 5) {
      alert('❌ Priorité invalide. Veuillez entrer un entier entre 1 et 5.');
      return;
    }

    const candidature = this.selectedCandidatureForEdit;
    const token = this.authService.getAccessToken();

    this.http
      .put<Candidature>(
        `http://localhost:8003/api/candidatures/${candidature.id}/modifier/`,
        { choix_priorite: priorite },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          alert('✅ Candidature modifiée avec succès.');
          this.fermerModalModification();
          this.loadMesCandidatures();
        },
        error: (error) => {
          console.error('Erreur modification candidature:', error);
          alert(error?.error?.error || '❌ Erreur lors de la modification de la candidature.');
        },
      });
  }

  ouvrirInscription(candidature: Candidature, fileInput: HTMLInputElement): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Inscription en ligne désactivée par l'administration.");
      return;
    }

    if (!this.canAccessInscriptionEtape(candidature)) {
      this.notifyActionBlocked("Cette candidature n'a pas encore atteint l'étape de sélection.");
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
    this.syncDossierPreferenceFormFromSelection();
    this.switchView('importer');
  }

  resetSelectionDossier(): void {
    this.selectedDossierNumber = null;
    this.dossierPreferenceForm.numero_dossier_reserve_administration = '';
  }

  private initializeDossierPreferenceForm(): void {
    const firstName = this.profileData?.first_name || this.currentUser?.first_name || '';
    const lastName = this.profileData?.last_name || this.currentUser?.last_name || '';
    this.dossierPreferenceForm.nom_prenom = `${firstName} ${lastName}`.trim();
    this.dossierPreferenceForm.etablissement_origine =
      this.profileData?.etablissement_origine || this.dossierPreferenceForm.etablissement_origine;
    this.syncDossierPreferenceFormFromSelection();
  }

  private syncDossierPreferenceFormFromSelection(): void {
    this.dossierPreferenceForm.numero_dossier_reserve_administration =
      this.selectedDossierNumber || '';
  }

  voirDetails(candidature: Candidature): void {
    this.selectedOffreDetail =
      this.offresInscription.find((offre) => offre.titre === candidature.master_nom) || null;
    this.currentView = 'offres-inscription';
  }

  ouvrirDetailOffre(offre: Offre): void {
    const code = this.getPreinscriptionDetailCode(offre);
    if (!code) {
      this.toastService.show('Aucun detail configure pour cette offre.', 'warning');
      return;
    }

    this.router.navigate(['/preinscription/detail', code]);
  }

  fermerDetailOffre(): void {
    this.selectedOffreDetail = null;
  }

  private getPreinscriptionDetailCode(offre: Offre): string | null {
    const title = (offre?.titre || '').toLowerCase();
    const desc = (offre?.description || '').toLowerCase();
    const specialite = (offre?.specialite || '').toLowerCase();
    const haystack = `${title} ${desc} ${specialite}`;

    if (haystack.includes('science') && haystack.includes('donnee')) return 'mpds';
    if (haystack.includes('instrumentation') && haystack.includes('industri')) return 'mp3i';
    if (haystack.includes('micro') && haystack.includes('instrument')) return 'mrmi';
    if (haystack.includes('recherche') && haystack.includes('genie logiciel')) return 'mrgl';
    if (
      haystack.includes('cycle') &&
      haystack.includes('ingenieur') &&
      haystack.includes('informatique')
    ) {
      return 'ing_info_gl';
    }
    if (haystack.includes('ingenieur') && haystack.includes('microelectronique')) return 'ing_em';
    if (haystack.includes('ingenieur') && haystack.includes('electronique')) return 'ing_em';
    if (haystack.includes('genie logiciel') || haystack.includes('ingenierie logicielle'))
      return 'mpgl';

    return null;
  }

  get acceptedMastersForPreference(): Candidature[] {
    return this.mesCandidatures.filter((c) => ['selectionne', 'inscrit'].includes(c.statut));
  }

  shouldShowPreferenceForm(): boolean {
    if (this.isPreferenceFormDemoMode) {
      return true;
    }
    return !!this.selectedDossierNumber && this.acceptedMastersForPreference.length > 1;
  }

  getPreferenceMasterOptions(): Array<{ value: string; label: string }> {
    const allowedCodes = new Set(['mpgl', 'mrgl', 'mpds']);
    const options = this.offresInscription
      .map((offre) => ({ value: this.getPreinscriptionDetailCode(offre), label: offre.titre }))
      .filter(
        (item): item is { value: string; label: string } =>
          !!item.value && allowedCodes.has(item.value),
      );

    if (options.length > 0) {
      return options;
    }

    return [
      { value: 'mpgl', label: 'Mastère Professionnel en Génie logiciel(GL)' },
      { value: 'mrgl', label: 'Mastère Recherche en Génie logiciel(MRGL)' },
      { value: 'mpds', label: 'Mastère Professionnel en sciences de données(DS)' },
    ];
  }

  activerExemplePreferenceForm(): void {
    this.isPreferenceFormDemoMode = true;
    this.prefillPreferenceFormDemoValues();
  }

  desactiverExemplePreferenceForm(): void {
    this.isPreferenceFormDemoMode = false;
  }

  private prefillPreferenceFormDemoValues(): void {
    if (!this.selectedDossierNumber) {
      this.selectedDossierNumber =
        this.dossiersCandidature[0]?.numero_dossier ||
        this.dossierPreferenceForm.numero_dossier_reserve_administration;
    }

    this.syncDossierPreferenceFormFromSelection();

    const options = this.getPreferenceMasterOptions().map((opt) => opt.value);
    if (!this.dossierPreferenceForm.choix_1 && options[0]) {
      this.dossierPreferenceForm.choix_1 = options[0];
    }
    if (!this.dossierPreferenceForm.choix_2 && options[1]) {
      this.dossierPreferenceForm.choix_2 = options[1];
    }
    if (!this.dossierPreferenceForm.choix_3 && options[2]) {
      this.dossierPreferenceForm.choix_3 = options[2];
    }
  }

  submitDossierPreferenceForm(): void {
    if (!this.shouldShowPreferenceForm()) {
      this.notifyActionBlocked(
        'Le formulaire de choix apparaît seulement si plusieurs masters sont acceptés.',
      );
      return;
    }

    const dossier = this.dossiersCandidature.find(
      (item) => item.numero_dossier === this.selectedDossierNumber,
    );

    if (!dossier) {
      this.toastService.show('Dossier sélectionné introuvable.', 'warning');
      return;
    }

    const requiredValues = [
      this.dossierPreferenceForm.nom_prenom,
      this.dossierPreferenceForm.etablissement_origine,
      this.dossierPreferenceForm.diplome,
      this.dossierPreferenceForm.choix_1,
      this.dossierPreferenceForm.choix_2,
      this.dossierPreferenceForm.choix_3,
      this.dossierPreferenceForm.numero_dossier_reserve_administration,
    ];

    if (requiredValues.some((value) => !String(value || '').trim())) {
      this.toastService.show('Veuillez remplir tout le formulaire de choix.', 'warning');
      return;
    }

    const choiceValues = [
      this.dossierPreferenceForm.choix_1,
      this.dossierPreferenceForm.choix_2,
      this.dossierPreferenceForm.choix_3,
    ].map((value) => String(value).trim().toUpperCase());

    if (new Set(choiceValues).size !== choiceValues.length) {
      this.toastService.show('Les choix 1, 2 et 3 doivent être différents.', 'warning');
      return;
    }

    const token = this.authService.getAccessToken();
    const payload = {
      formulaire: {
        ...this.dossierPreferenceForm,
        choix_1: choiceValues[0],
        choix_2: choiceValues[1],
        choix_3: choiceValues[2],
        documents: this.documentsRequis.filter((doc) => doc.depose).map((doc) => doc.nom),
      },
    };

    this.http
      .post(
        `http://localhost:8003/api/candidatures/${dossier.candidature_id}/deposer-dossier/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: () => {
          this.toastService.show('✅ Formulaire de choix enregistré et dossier déposé.', 'success');
          this.loadMesCandidatures();
          this.loadMesDossiers();
        },
        error: (error) => {
          console.error('Erreur dépôt dossier avec choix:', error);
          this.toastService.show(
            error?.error?.error || '❌ Erreur lors du dépôt du dossier avec choix.',
            'error',
          );
        },
      });
  }

  getDetailRowsForOffre(offre: Offre): OffreDetailRow[] {
    const title = (offre?.titre || '').toLowerCase();

    if (title.includes('génie logiciel') || title.includes('genie logiciel')) {
      return [
        {
          capaciteAccueilleTotale: '35',
          etablissementOrigine: "Institut Supérieur de l'Informatique et des Mathématiques (ISIMM)",
          capaciteAccueille: '30',
          typeDiplome: 'Licence en Sciences de l' + 'Informatique',
          datesImportantes: 'Inscription sur le site web : www.isimm.rnu.tn/public/formulaires',
        },
        {
          capaciteAccueilleTotale: '35',
          etablissementOrigine: 'Autres établissements',
          capaciteAccueille: '05',
          typeDiplome:
            'Licence en Sciences de l' + 'Informatique ou en Informatique de Gestion (uniquement)',
          datesImportantes:
            'Du jour de la publication de cet avis jusqu au 22 juillet 2025. Proclamation de la liste des étudiants présélectionnés : Le 28 juillet 2025. Dépôt des dossiers numériques : Du 28 juillet au 31 juillet 2025. Proclamation de la liste finale : Le 08 août 2025.',
        },
      ];
    }

    return [
      {
        capaciteAccueilleTotale: String(offre.places || 0),
        etablissementOrigine: 'ISIMM',
        capaciteAccueille: String(offre.places || 0),
        typeDiplome:
          offre.type === 'cycle_ingenieur' ? 'Cycle préparatoire / ingénieur' : 'Licence',
        datesImportantes: `Date limite : ${new Date(offre.date_limite).toLocaleDateString('fr-FR')}`,
      },
    ];
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
    if (!this.canAccessInscriptionEtape(candidature)) {
      this.notifyActionBlocked(
        "Paiement non autorisé: la candidature doit d'abord être sélectionnée.",
      );
      return;
    }

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

  private isAllowedUploadFile(file: File): boolean {
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      alert('❌ Format non supporté. Utilisez PDF, JPG ou PNG.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('❌ Fichier trop volumineux (max 5 Mo)');
      return false;
    }

    return true;
  }

  onDocumentDrop(event: DragEvent, document: Document): void {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!this.isAllowedUploadFile(file)) {
      return;
    }

    this.selectedDocumentFiles[document.id] = file;
  }

  onDocumentFileSelected(event: Event, document: Document): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!this.isAllowedUploadFile(file)) {
      input.value = '';
      return;
    }

    this.selectedDocumentFiles[document.id] = file;
  }

  removeDocumentFile(documentId: number): void {
    this.selectedDocumentFiles[documentId] = null;
  }

  get selectedDocumentsCount(): number {
    return this.documentsRequis.filter((doc) => !!this.selectedDocumentFiles[doc.id]).length;
  }

  uploadAllSelectedDocuments(): void {
    const docsToUpload = this.documentsRequis.filter((doc) => !!this.selectedDocumentFiles[doc.id]);

    if (!docsToUpload.length) {
      this.toastService.show('Aucun document sélectionné.', 'warning');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const totalCount = docsToUpload.length;

    docsToUpload.forEach((doc) => {
      this.uploadDocumentFile(
        doc,
        () => {
          successCount++;
          if (successCount + errorCount === totalCount) {
            if (errorCount === 0) {
              this.toastService.show(
                `✅ ${successCount} document${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès`,
                'success',
                3500,
              );
            } else {
              this.toastService.show(
                `⚠️ ${successCount} envoyé${successCount > 1 ? 's' : ''}, ${errorCount} échoué${errorCount > 1 ? 's' : ''}`,
                'warning',
                3500,
              );
            }
          }
        },
        () => {
          errorCount++;
          if (successCount + errorCount === totalCount) {
            if (errorCount === 0) {
              this.toastService.show(
                `✅ ${successCount} document${successCount > 1 ? 's' : ''} envoyé${successCount > 1 ? 's' : ''} avec succès`,
                'success',
                3500,
              );
            } else {
              this.toastService.show(
                `⚠️ ${successCount} envoyé${successCount > 1 ? 's' : ''}, ${errorCount} échoué${errorCount > 1 ? 's' : ''}`,
                'warning',
                3500,
              );
            }
          }
        },
      );
    });
  }

  uploadDocumentFile(document: Document, onSuccess?: () => void, onError?: () => void): void {
    const selectedFile = this.selectedDocumentFiles[document.id];
    if (!selectedFile) {
      return;
    }

    const token = this.authService.getAccessToken();
    const formData = new FormData();
    formData.append('fichier', selectedFile);
    formData.append('document_type', document.nom);

    if (this.selectedDossierNumber) {
      formData.append('numero_dossier', this.selectedDossierNumber);
    }

    this.http
      .post('http://localhost:8003/api/candidatures/upload-fichier/', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          const now = new Date().toLocaleDateString('fr-FR');

          document.depose = true;
          document.date_depot = now;

          this.fichiersHistorique.unshift({
            id: Date.now(),
            nom: selectedFile.name,
            date: now,
          });

          this.selectedDocumentFiles[document.id] = null;
          if (onSuccess) onSuccess();
        },
        error: (error) => {
          console.error('Erreur:', error);
          if (onError) onError();
        },
      });
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

  exportInscriptionsEnLigne(): void {
    if (!this.mesCandidatures.length) {
      alert('❌ Aucune candidature à exporter');
      return;
    }

    const rows: ExportRow[] = this.mesCandidatures.map((c) => ({
      'N° Candidature': c.numero,
      Formation: c.master_nom,
      'Statut inscription': this.getStatutLabel(c.statut_inscription || 'en_attente'),
      'Statut candidature': this.getStatutLabel(c.statut),
      'Date soumission': c.date_soumission
        ? new Date(c.date_soumission).toLocaleDateString('fr-FR')
        : '-',
      'Année universitaire': c.annee_universitaire || this.currentAcademicYear(),
    }));

    this.exportRows(
      rows,
      this.inscriptionExportFormat,
      'inscriptions-en-ligne',
      'Inscriptions en ligne',
    );
  }

  private exportRows(
    rows: ExportRow[],
    format: ExportFormat,
    baseFileName: string,
    tableTitle: string,
  ): void {
    if (format === 'csv') {
      this.exportRowsToCSV(rows, baseFileName);
      return;
    }

    if (format === 'json') {
      this.exportRowsToJSON(rows, baseFileName);
      return;
    }

    if (format === 'xlsx') {
      this.exportRowsToXLSX(rows, baseFileName, tableTitle);
      return;
    }

    this.exportRowsToPdf(rows, baseFileName, tableTitle);
  }

  private exportRowsToCSV(rows: ExportRow[], baseFileName: string): void {
    if (!rows.length) {
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, baseFileName, 'csv');
  }

  private exportRowsToJSON(rows: ExportRow[], baseFileName: string): void {
    if (!rows.length) {
      return;
    }

    const jsonContent = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadFile(blob, baseFileName, 'json');
  }

  private exportRowsToXLSX(rows: ExportRow[], baseFileName: string, tableTitle: string): void {
    if (!rows.length) {
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableTitle.substring(0, 31));
    XLSX.writeFile(workbook, this.buildExportFileName(baseFileName, 'xlsx'));
  }

  private exportRowsToPdf(rows: ExportRow[], baseFileName: string, tableTitle: string): void {
    if (!rows.length) {
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(14);
    doc.text(tableTitle, pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 21, {
      align: 'center',
    });

    const headers = Object.keys(rows[0]);
    const body = rows.map((row) => headers.map((h) => row[h] ?? ''));

    autoTable(doc, {
      head: [headers],
      body,
      startY: 26,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 18, pageHeight - 8);
      },
    });

    doc.save(this.buildExportFileName(baseFileName, 'pdf'));
  }

  private downloadFile(blob: Blob, baseFileName: string, extension: string): void {
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = this.buildExportFileName(baseFileName, extension);
    document.body.appendChild(anchor);
    anchor.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(anchor);
  }

  private buildExportFileName(baseName: string, extension: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseName}_${timestamp}.${extension}`;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
