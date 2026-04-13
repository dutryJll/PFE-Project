import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Candidature {
  id: number;
  numero: string;
  candidat_nom: string;
  candidat_email: string;
  candidat_cin?: string;
  master_id?: number;
  specialite: string;
  master_nom?: string;
  score: number;
  dossier_depose: boolean;
  dossier_id?: string;
  statut: string;
  avis?: string;
  type_concours?: string;
  parcours?: string;
  nouveau_statut?: string;
  date_inscription?: string;
  annee_universitaire?: string;
  notes_preinscription?: string;
  decision_responsable?: 'valide' | 'non_valide' | '';
  date_soumission?: string;
}

interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  date: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  lue: boolean;
}

interface ResponsibleNotificationItem {
  id: string;
  master_id: number;
  master_nom: string;
  deadline_type: string;
  deadline_date: string;
  days_left: number;
  est_cache?: boolean;
  est_visible?: boolean;
  statut: 'ouvert' | 'ferme';
  type: 'info' | 'warning';
  message: string;
}

interface Specialite {
  id: number;
  nom: string;
  statut: 'actuel' | 'ancien';
  nb_candidatures: number;
  nb_dossiers: number;
}

interface Concours {
  id: number;
  nom: string;
  annee: string;
  nb_candidatures: number;
  nb_acceptes: number;
  nb_refuses: number;
}

interface Liste {
  id: number;
  nom: string;
  specialite: string;
  type: 'preselection' | 'selection';
  statut: 'active' | 'archivee';
  nb_candidats: number;
  date_creation: string;
  avis?: string;
  recommandation?: 'favorable' | 'defavorable' | 'reserve' | '';
}

interface Reclamation {
  id: number;
  candidat_nom: string;
  objet: string;
  master_nom?: string;
  master?: string;
  specialite?: string;
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

interface CandidatureVoteAvis {
  membreNom: string;
  role: 'membre' | 'responsable';
  recommandation: 'favorable' | 'defavorable' | 'reserve';
  commentaire: string;
  date: string;
  diplomeConforme?: boolean;
}

interface InscriptionVerificationRow {
  numero_candidature: string;
  cin: string;
  numero_inscription: string;
  nom_prenom: string;
  master: string;
  specialite: string;
  verification: 'valide' | 'incoherent' | 'absent';
  details: string;
}

interface ResponsableMasterStat {
  masterId: number | string;
  masterNom: string;
  typeConcours: 'masters' | 'ingenieur' | 'autre';
  totalCandidatures: number;
  dossiersDeposes: number;
  acceptes: number;
  inscrits: number;
  rejetes: number;
  tauxAcceptation: number;
  tauxInscription: number;
  tauxDossier: number;
  tauxRejet: number;
}

interface DashboardProgramStat {
  label: string;
  type: 'masters' | 'ingenieur' | 'autre';
  total: number;
  acceptes: number;
  inscrits: number;
  rejetes: number;
  tauxAcceptation: number;
  tauxInscription: number;
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

interface CommissionMember {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: 'responsable' | 'evaluateur' | 'observateur';
  statut: 'actif' | 'inactif';
  date_inscription: string;
  master_rattachement?: string;
}

type CommissionView =
  | 'dashboard'
  | 'profil'
  | 'masters'
  | 'configuration-appels'
  | 'candidatures-responsable'
  | 'avis-listes'
  | 'concours-ingenieur'
  | 'candidatures'
  | 'candidatures-master'
  | 'candidatures-ingenieur'
  | 'valider-dossier'
  | 'dossiers'
  | 'listes'
  | 'membres'
  | 'ocr'
  | 'reclamations'
  | 'inscriptions'
  | 'statistiques'
  | 'deliberations'
  | 'notifications';

type ExportFormat = 'csv' | 'json' | 'pdf' | 'xlsx';
type ExportRow = Record<string, string | number | boolean | null | undefined>;

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

function normalizeActionLabel(value: string): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

interface MasterOption {
  id: number;
  nom: string;
}

interface OffrePreinscription {
  id: number;
  titre: string;
  type: 'master' | 'cycle_ingenieur';
  sous_type: string;
  specialite: string;
  description: string;
  annee_universitaire?: string;
  date_limite: string;
  date_limite_preinscription?: string | null;
  date_limite_depot_dossier?: string | null;
  date_limite_paiement?: string | null;
  capacite_total?: number;
  capacite_liste_attente?: number;
  places: number;
  capacite_interne?: number;
  capacite_externe?: number;
  est_cache?: boolean;
  est_visible?: boolean;
  statut: 'ouvert' | 'ferme';
  document_officiel_pdf_url?: string | null;
  isDemo?: boolean;
}

interface OffreCalendarPreviewRow {
  capaciteTotale: string;
  etablissementOrigine: string;
  capacite: string;
  typeDiplome: string;
  datesImportantes: string;
}

interface ConfigurationAppelForm {
  master: number | null;
  date_debut_visibilite: string;
  date_fin_visibilite: string;
  date_limite_preinscription: string;
  date_limite_depot_dossier: string;
  date_limite_paiement: string;
  delai_modification_candidature_jours: number;
  delai_depot_dossier_preselectionnes_jours: number;
  actif: boolean;
  est_cache?: boolean;
  capacite_interne?: number;
  capacite_externe?: number;
  document_officiel_pdf_url?: string | null;
}

interface NouvelleOffreForm {
  nom: string;
  type_master: 'professionnel' | 'recherche';
  specialite: string;
  description: string;
  places_disponibles: number;
  date_limite_candidature: string;
  annee_universitaire: string;
  actif: boolean;
}

interface OffreEditForm extends NouvelleOffreForm {
  id: number | null;
  date_debut_visibilite: string;
  date_fin_visibilite: string;
  date_limite_preinscription: string;
  date_limite_depot_dossier: string;
  date_limite_paiement: string;
  delai_modification_candidature_jours: number;
  delai_depot_dossier_preselectionnes_jours: number;
  est_cache: boolean;
  capacite_interne: number;
  capacite_externe: number;
  document_officiel_pdf_url?: string | null;
}

// ========================================
// WORKFLOW TRANSITION RULES
// ========================================
const ALLOWED_STATUS_TRANSITIONS: Record<string, Set<string>> = {
  soumis: new Set(['sous_examen', 'rejete', 'annule']),
  sous_examen: new Set(['preselectionne', 'en_attente_dossier', 'rejete']),
  preselectionne: new Set(['en_attente_dossier', 'rejete']),
  en_attente_dossier: new Set(['dossier_depose', 'dossier_non_depose', 'rejete']),
  dossier_depose: new Set(['en_attente', 'selectionne', 'rejete']),
  en_attente: new Set(['selectionne', 'rejete', 'annule']),
  selectionne: new Set(['inscrit', 'rejete']),
  dossier_non_depose: new Set(['en_attente_dossier', 'rejete']),
  annule: new Set(),
  rejete: new Set(),
  inscrit: new Set(),
};

@Component({
  selector: 'app-dashboard-commission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-commission.html',
  styleUrl: './dashboard-commission.css',
})
export class DashboardCommissionComponent implements OnInit {
  private readonly fallbackEditOfferId = 3;
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
  customRoleActions: string[] = [];
  private readonly customActionViewMap: Record<string, CommissionView> = {
    [normalizeActionLabel('Consultation de candidature')]: 'candidatures',
    [normalizeActionLabel('Vérifier dossiers')]: 'valider-dossier',
    [normalizeActionLabel('Étude de dossier de candidature')]: 'valider-dossier',
    [normalizeActionLabel('Consultation de dossier')]: 'dossiers',
    [normalizeActionLabel('Préselection')]: 'listes',
    [normalizeActionLabel('Sélection finale')]: 'listes',
    [normalizeActionLabel('Liste de candidature')]: 'candidatures',
    [normalizeActionLabel('Avis sur les listes')]: 'avis-listes',
    [normalizeActionLabel('Consultation des listes')]: 'avis-listes',
    [normalizeActionLabel('Listes et avis')]: 'avis-listes',
    [normalizeActionLabel('Publier liste principale')]: 'deliberations',
    [normalizeActionLabel('Publier liste attente')]: 'deliberations',
    [normalizeActionLabel('Traiter réclamations')]: 'reclamations',
    [normalizeActionLabel('Gérer inscriptions')]: 'inscriptions',
    [normalizeActionLabel('Consulter statistiques')]: 'dashboard',
    [normalizeActionLabel('Membres de la commission')]: 'membres',
    [normalizeActionLabel('Mon profil')]: 'profil',
    [normalizeActionLabel('Les masters')]: 'masters',
    [normalizeActionLabel('Configuration des appels')]: 'configuration-appels',
    [normalizeActionLabel('Liste des candidatures')]: 'candidatures-responsable',
    [normalizeActionLabel("Concours cycle d'ingénieur")]: 'concours-ingenieur',
    [normalizeActionLabel('Analyse dossier')]: 'ocr',
  };
  private readonly knownActionNameSet = new Set<string>([
    normalizeActionLabel('Consultation de candidature'),
    normalizeActionLabel('Consultation de dossier'),
    normalizeActionLabel('Vérifier dossiers'),
    normalizeActionLabel('Préselection'),
    normalizeActionLabel('Sélection finale'),
    normalizeActionLabel('Liste de candidature'),
    normalizeActionLabel('Avis sur les listes'),
    normalizeActionLabel('Consultation des listes'),
    normalizeActionLabel('Listes et avis'),
    normalizeActionLabel('Publier liste principale'),
    normalizeActionLabel('Publier liste attente'),
    normalizeActionLabel('Traiter réclamations'),
    normalizeActionLabel('Gérer inscriptions'),
    normalizeActionLabel('Consulter statistiques'),
  ]);

  // Menu Kebab
  actionMenuOpen: number | null = null;

  // Filtres principaux
  filtreSpecialite: 'actuel' | 'ancien' = 'actuel';
  filtreConcours: 'actuel' | 'ancien' = 'actuel';
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
  filtreAnneeUniversitaire: 'courante' | 'precedente' | 'toutes' = 'courante';
  filtrePorteeOffres: 'specialite' | 'toutes_ouvertes' = 'specialite';
  preselectionDecisionFilter: '' | 'valide' | 'non_valide' = '';
  preselectionSearch: string = '';
  preselectionQuota: number = 100;
  preselectionRowsForGeneration: Candidature[] = [];
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

  notificationsCandidat: NotificationItem[] = [];
  notificationsNonLues: number = 0;
  filtreNotificationType: '' | 'info' | 'success' | 'warning' | 'danger' = '';
  filtreNotificationDateDebut: string = '';
  filtreNotificationDateFin: string = '';

  concoursIngenieur: Concours[] = [
    {
      id: 1,
      nom: 'Cycle Ingénieur 2025-2026',
      annee: '2026',
      nb_candidatures: 120,
      nb_acceptes: 45,
      nb_refuses: 75,
    },
    {
      id: 2,
      nom: 'Cycle Ingénieur (Double Diplôme)',
      annee: '2026',
      nb_candidatures: 35,
      nb_acceptes: 12,
      nb_refuses: 23,
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
      annee_universitaire: '2025/2026',
      notes_preinscription: 'Moyenne 15.8, classement 12/120, projet IA validé.',
      decision_responsable: '',
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
      annee_universitaire: '2024/2025',
      notes_preinscription: 'Moyenne 16.7, forte base mathématique, stage data confirmé.',
      decision_responsable: 'valide',
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
      annee_universitaire: '2025/2026',
      notes_preinscription: 'Moyenne 14.9, expérience développement web, motivation correcte.',
      decision_responsable: '',
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
  listesExportFormat: ExportFormat = 'pdf';
  candidaturesMembreExportFormat: ExportFormat = 'xlsx';
  candidaturesResponsableExportFormat: ExportFormat = 'xlsx';
  deliberationsExportFormat: ExportFormat = 'pdf';
  inscriptionsExportFormat: ExportFormat = 'xlsx';

  masterOptions: MasterOption[] = [];
  offresPreinscription: OffrePreinscription[] = [];
  private readonly demoOffrePreinscription: OffrePreinscription = {
    id: -1,
    titre: 'Master Démo - Ingénierie Logicielle',
    type: 'master',
    sous_type: 'professionnel',
    specialite: 'Génie Logiciel',
    description:
      'Ligne de démonstration affichée automatiquement quand aucune offre réelle n’existe.',
    date_limite: '2026-09-15',
    places: 30,
    est_cache: false,
    est_visible: true,
    statut: 'ouvert',
    document_officiel_pdf_url: null,
    isDemo: true,
  };
  selectedConfigMasterId: number | null = null;
  selectedOffreId: number | null = null;
  selectedMasterForCandidatures: number | 'all' = 'all';
  configLoading: boolean = false;
  configSaving: boolean = false;
  creationOffreLoading: boolean = false;
  editingOffreLoading: boolean = false;
  offreEditionMode: boolean = false;
  candidaturesResponsable: Candidature[] = [];
  candidaturesResponsableFiltrees: Candidature[] = [];
  responsibleNotifications: ResponsibleNotificationItem[] = [];
  filtreResponsibleNotificationType: '' | 'info' | 'warning' = '';
  filtreResponsibleNotificationStatut: '' | 'ouvert' | 'ferme' = '';
  nouvelleOffre: NouvelleOffreForm = {
    nom: '',
    type_master: 'recherche',
    specialite: '',
    description: '',
    places_disponibles: 30,
    date_limite_candidature: '',
    annee_universitaire: '2026/2027',
    actif: true,
  };
  offreEditForm: OffreEditForm = {
    id: null,
    nom: '',
    type_master: 'recherche',
    specialite: '',
    description: '',
    places_disponibles: 30,
    date_limite_candidature: '',
    annee_universitaire: '2026/2027',
    actif: true,
    date_debut_visibilite: '',
    date_fin_visibilite: '',
    date_limite_preinscription: '',
    date_limite_depot_dossier: '',
    date_limite_paiement: '',
    delai_modification_candidature_jours: 7,
    delai_depot_dossier_preselectionnes_jours: 14,
    est_cache: false,
    capacite_interne: 0,
    capacite_externe: 0,
    document_officiel_pdf_url: null,
  };
  configurationAppel: ConfigurationAppelForm = {
    master: null,
    date_debut_visibilite: '',
    date_fin_visibilite: '',
    date_limite_preinscription: '',
    date_limite_depot_dossier: '',
    date_limite_paiement: '',
    delai_modification_candidature_jours: 7,
    delai_depot_dossier_preselectionnes_jours: 14,
    actif: true,
  };

  reclamations: Reclamation[] = [
    {
      id: 1,
      candidat_nom: 'Ahmed Ben Ali',
      objet: 'Score incorrect',
      master_nom: 'Master Génie Logiciel',
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

  // Membres
  membres: CommissionMember[] = [
    {
      id: 1,
      nom: 'Ben Ali',
      prenom: 'Mohamed',
      email: 'm.benali@isimm.rnu.tn',
      telephone: '+216 98 123 456',
      role: 'responsable',
      statut: 'actif',
      date_inscription: '2025-01-15',
      master_rattachement: 'Master Génie Logiciel',
    },
    {
      id: 2,
      nom: 'Gharbi',
      prenom: 'Fatma',
      email: 'f.gharbi@isimm.rnu.tn',
      telephone: '+216 98 234 567',
      role: 'evaluateur',
      statut: 'actif',
      date_inscription: '2025-02-01',
      master_rattachement: 'Master Data Science',
    },
    {
      id: 3,
      nom: 'Trabelsi',
      prenom: 'Ahmed',
      email: 'a.trabelsi@isimm.rnu.tn',
      telephone: '+216 98 345 678',
      role: 'evaluateur',
      statut: 'actif',
      date_inscription: '2025-02-10',
    },
    {
      id: 4,
      nom: 'Jmour',
      prenom: 'Sana',
      email: 's.jmour@isimm.rnu.tn',
      telephone: '+216 98 456 789',
      role: 'observateur',
      statut: 'inactif',
      date_inscription: '2024-11-20',
    },
  ];
  membresFiltres: CommissionMember[] = [];
  rechercheMembres: string = '';
  filtrRoleMembre: string = '';
  filtreStatutMembre: string = '';

  // Statistiques
  filtreStatPeriode: 'jour' | 'semaine' | 'mois' | 'annee' = 'mois';
  statMasterExportFormat: string = 'pdf';

  // Modal avis
  showModalAvis: boolean = false;
  candidatureSelectionnee: Candidature | null = null;
  avisText: string = '';
  avisRecommandation: string = 'favorable';
  avisDiplomeConforme: 'conforme' | 'non_conforme' = 'conforme';
  showModalConsultation: boolean = false;
  candidatureConsultationSelectionnee: Candidature | null = null;
  showModalAvisListe: boolean = false;
  listeSelectionneeAvis: Liste | null = null;
  avisListeText: string = '';
  avisListeRecommandation: 'favorable' | 'defavorable' | 'reserve' = 'favorable';

  // Modal changement statut
  showModalStatut: boolean = false;
  candidatureStatutSelectionnee: Candidature | null = null;
  statusOptions: string[] = [];
  statusSelection: string = '';
  statusRejectReason: string = '';

  // Modal OCR
  showModalOCR: boolean = false;
  fichierOCR: File | null = null;
  selectedOCRCandidature: Candidature | null = null;

  candidatureVotes: Record<number, CandidatureVoteAvis[]> = {};

  inscriptionsExcelRows: any[] = [];
  inscriptionsVerificationRows: InscriptionVerificationRow[] = [];
  selectedInscriptionsFileName: string = '';
  lastRapprochementAuditId: number | null = null;

  validationFilters = {
    recherche: '',
    statut: '',
    diplomeConforme: '',
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };
    this.isResponsable = this.currentUser?.role === 'responsable_commission';

    let requestedView = this.route.snapshot.queryParamMap.get('view') as CommissionView | null;
    if (requestedView === 'candidatures-master' || requestedView === 'candidatures-ingenieur') {
      requestedView = 'candidatures-responsable';
    }
    if (requestedView && this.canAccessView(requestedView)) {
      this.currentView = requestedView;
    }

    this.loadActionPermissions();
    this.candidaturesFiltrees = [...this.candidatures];
    this.loadMastersForConfiguration();
    this.loadOffresPreinscription();
    this.loadResponsibleNotifications();
    this.loadMembers();
    this.loadNotifications();
    if (this.isResponsable) {
      this.loadCandidaturesResponsable();
    }

    // Load data for initial view
    if (
      this.currentView === 'candidatures-responsable' ||
      this.currentView === 'candidatures-master' ||
      this.currentView === 'candidatures-ingenieur'
    ) {
      this.resetFiltresResponsable();
      this.loadCandidaturesResponsable();
    }
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
          this.notificationsNonLues = this.notificationsCandidat.filter((n) => !n.lue).length;
        },
        error: (error) => {
          console.error('Erreur chargement notifications commission:', error);
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
          console.error('Erreur marquage notification commission:', error);
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
        next: () => {
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

  loadMastersForConfiguration(): void {
    this.http.get<any[]>('http://localhost:8003/api/candidatures/masters/').subscribe({
      next: (masters) => {
        this.masterOptions = (masters || []).map((m) => ({ id: Number(m.id), nom: m.nom }));
        if (!this.selectedConfigMasterId && this.masterOptions.length > 0) {
          this.selectedConfigMasterId = this.masterOptions[0].id;
          this.onConfigMasterChange();
        }
      },
      error: (error) => {
        console.error('Erreur chargement masters:', error);
      },
    });
  }

  loadOffresPreinscription(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<OffrePreinscription[]>(
        'http://localhost:8003/api/candidatures/offres-inscription-responsable/',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: (data) => {
          this.offresPreinscription = data || [];
        },
        error: (error) => {
          console.error('Erreur chargement offres responsable:', error);
          this.offresPreinscription = [];
        },
      });
  }

  getOffresPreinscriptionForDisplay(): OffrePreinscription[] {
    return this.offresPreinscription.length > 0
      ? this.offresPreinscription
      : [this.demoOffrePreinscription];
  }

  hasRealOffresPreinscription(): boolean {
    return this.offresPreinscription.length > 0;
  }

  getSelectedOffreForCandidatPreview(): OffrePreinscription | null {
    if (this.selectedOffreId) {
      return this.offresPreinscription.find((offre) => offre.id === this.selectedOffreId) || null;
    }

    return this.offresPreinscription.length > 0 ? this.offresPreinscription[0] : null;
  }

  getSelectedConfigurationMasterLabel(): string {
    if (!this.selectedConfigMasterId) {
      return 'Aucun master sélectionné';
    }

    return (
      this.masterOptions.find((item) => item.id === this.selectedConfigMasterId)?.nom ||
      'Master inconnu'
    );
  }

  getOffreCalendarPreviewRows(): OffreCalendarPreviewRow[] {
    const totalCapacity =
      Number(this.configurationAppel.capacite_interne || 0) +
      Number(this.configurationAppel.capacite_externe || 0);
    const masterLabel = this.getSelectedConfigurationMasterLabel();
    const title = masterLabel.toLowerCase();

    let typeDiplome = 'Licence ou diplôme équivalent';
    if (title.includes('science des données') || title.includes('data')) {
      typeDiplome = 'Licence en Mathématiques Appliquées (ou équivalent)';
    } else if (title.includes('génie logiciel') || title.includes('genie logiciel')) {
      typeDiplome = 'Licence en Sciences de l’Informatique (ou équivalent)';
    } else if (title.includes('ingénieur') || title.includes('ingenieur')) {
      typeDiplome = 'Diplôme d’accès au cycle ingénieur';
    }

    const dates = [
      `Inscription en ligne : ${this.configurationAppel.date_debut_visibilite || '-'} → ${this.configurationAppel.date_limite_preinscription || '-'}`,
      `Résultats de présélection : ${this.configurationAppel.date_limite_depot_dossier || '-'}`,
      `Dépôt des dossiers numériques : ${this.configurationAppel.date_limite_paiement || '-'}`,
    ].join(' | ');

    return [
      {
        capaciteTotale: String(totalCapacity || 0),
        etablissementOrigine: 'ISIMM',
        capacite: String(this.configurationAppel.capacite_interne || 0),
        typeDiplome,
        datesImportantes: dates,
      },
      {
        capaciteTotale: '',
        etablissementOrigine: 'Autres établissements',
        capacite: String(this.configurationAppel.capacite_externe || 0),
        typeDiplome,
        datesImportantes: `Liste finale des admis : ${this.configurationAppel.date_fin_visibilite || '-'}`,
      },
    ];
  }

  loadCandidaturesResponsable(masterId: number | 'all' = this.selectedMasterForCandidatures): void {
    const fallbackData = this.candidatures.filter((c) => !!c.type_concours);
    this.candidaturesResponsable = [...fallbackData];
    this.candidaturesResponsableFiltrees = [...fallbackData];
    this.appliquerFiltresResponsable();

    const token = this.authService.getAccessToken();
    if (!token) {
      console.warn('[LoadCandidaturesResponsable] No token available');
      return;
    }

    const params = new URLSearchParams();
    if (masterId !== 'all') {
      params.set('master_id', String(masterId));
    }

    const apiUrl = `http://localhost:8003/api/candidatures/responsable/candidatures/?${params.toString()}`;
    console.log('[LoadCandidaturesResponsable] Fetching from:', apiUrl);

    this.http
      .get<Candidature[]>(apiUrl, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (data) => {
          const apiRows = data || [];
          console.log('[LoadCandidaturesResponsable] API returned', apiRows.length, 'rows');

          // If API returns data, use it
          if (apiRows.length > 0) {
            this.candidaturesResponsable = apiRows;
            console.log('[LoadCandidaturesResponsable] Using API data');
          } else {
            // Fallback: use candidatures with type_concours from local cache
            const fallbackData = this.candidatures.filter((c) => !!c.type_concours);
            this.candidaturesResponsable = fallbackData.length > 0 ? fallbackData : [];
            console.log(
              '[LoadCandidaturesResponsable] Using fallback data:',
              fallbackData.length,
              'rows',
            );
          }

          // Update filtered list and apply filters
          this.candidaturesResponsableFiltrees = [...this.candidaturesResponsable];
          this.appliquerFiltresResponsable();
          console.log(
            '[LoadCandidaturesResponsable] Final filtered count:',
            this.candidaturesResponsableFiltrees.length,
          );
        },
        error: (error) => {
          console.error('[LoadCandidaturesResponsable] API Error:', error);

          // On error, try fallback
          const fallbackData = this.candidatures.filter((c) => !!c.type_concours);
          this.candidaturesResponsable = fallbackData.length > 0 ? fallbackData : [];
          this.candidaturesResponsableFiltrees = [...this.candidaturesResponsable];
          this.appliquerFiltresResponsable();

          console.log(
            '[LoadCandidaturesResponsable] Fallback activated with:',
            this.candidaturesResponsable.length,
            'rows',
          );
        },
      });
  }

  loadCandidaturesMembre(): void {
    this.candidaturesFiltrees = [...this.candidatures];
    this.appliquerFiltres();
  }

  loadResponsibleNotifications(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<
        ResponsibleNotificationItem[]
      >('http://localhost:8003/api/candidatures/responsable/notifications/', { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (data) => {
          this.responsibleNotifications = data || [];
        },
        error: (error) => {
          console.error('Erreur chargement notifications responsable:', error);
          this.responsibleNotifications = [];
        },
      });
  }

  onConfigMasterChange(): void {
    if (!this.selectedConfigMasterId) {
      return;
    }
    this.loadConfigurationAppel(this.selectedConfigMasterId);
  }

  private loadConfigurationAppel(masterId: number): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.configLoading = true;

    this.http
      .get<any>(`http://localhost:8003/api/candidatures/configuration/${masterId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (config) => {
          this.configurationAppel = {
            master: config.master,
            date_debut_visibilite: config.date_debut_visibilite || '',
            date_fin_visibilite: config.date_fin_visibilite || '',
            date_limite_preinscription: config.date_limite_preinscription || '',
            date_limite_depot_dossier: config.date_limite_depot_dossier || '',
            date_limite_paiement: config.date_limite_paiement || '',
            delai_modification_candidature_jours: config.delai_modification_candidature_jours ?? 7,
            delai_depot_dossier_preselectionnes_jours:
              config.delai_depot_dossier_preselectionnes_jours ?? 14,
            actif: config.actif ?? true,
            est_cache: config.est_cache ?? false,
            capacite_interne: config.capacite_interne ?? 0,
            capacite_externe: config.capacite_externe ?? 0,
            document_officiel_pdf_url: config.document_officiel_pdf_url || null,
          };
          this.configLoading = false;
        },
        error: () => {
          this.configurationAppel = {
            master: masterId,
            date_debut_visibilite: '',
            date_fin_visibilite: '',
            date_limite_preinscription: '',
            date_limite_depot_dossier: '',
            date_limite_paiement: '',
            delai_modification_candidature_jours: 7,
            delai_depot_dossier_preselectionnes_jours: 14,
            actif: true,
            est_cache: false,
            capacite_interne: 0,
            capacite_externe: 0,
            document_officiel_pdf_url: null,
          };
          this.configLoading = false;
        },
      });
  }

  saveConfigurationAppel(): void {
    if (!this.isResponsable || !this.selectedConfigMasterId) {
      this.notifyActionBlocked('Configuration des appels réservée au responsable.');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    const payload = {
      ...this.configurationAppel,
      master: this.selectedConfigMasterId,
    };

    this.configSaving = true;

    this.http
      .put(
        `http://localhost:8003/api/candidatures/configuration/${this.selectedConfigMasterId}/`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: () => {
          this.toastService.show('Configuration des appels enregistrée.', 'success');
          this.configSaving = false;
        },
        error: () => {
          this.http
            .post('http://localhost:8003/api/candidatures/configuration/', payload, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .subscribe({
              next: () => {
                this.toastService.show('Configuration des appels créée.', 'success');
                this.configSaving = false;
              },
              error: (createError) => {
                console.error('Erreur sauvegarde configuration:', createError);
                this.toastService.show(
                  'Erreur lors de la sauvegarde de la configuration.',
                  'error',
                );
                this.configSaving = false;
              },
            });
        },
      });
  }

  creerNouvelleOffrePreinscription(): void {
    if (!this.isResponsable) {
      this.notifyActionBlocked("Création d'offre réservée au responsable.");
      return;
    }

    const requiredFields = [
      this.nouvelleOffre.nom,
      this.nouvelleOffre.type_master,
      this.nouvelleOffre.specialite,
      this.nouvelleOffre.date_limite_candidature,
    ];

    if (requiredFields.some((value) => !String(value || '').trim())) {
      this.toastService.show(
        'Veuillez remplir les champs obligatoires de la nouvelle offre.',
        'warning',
      );
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.creationOffreLoading = true;

    this.http
      .post<any>('http://localhost:8003/api/candidatures/masters/admin/', this.nouvelleOffre, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (created) => {
          this.toastService.show('Nouvelle offre créée avec succès.', 'success');

          this.nouvelleOffre = {
            nom: '',
            type_master: 'recherche',
            specialite: '',
            description: '',
            places_disponibles: 30,
            date_limite_candidature: '',
            annee_universitaire: this.nouvelleOffre.annee_universitaire || '2026/2027',
            actif: true,
          };

          this.loadMastersForConfiguration();
          if (created?.id) {
            this.selectedConfigMasterId = Number(created.id);
            this.onConfigMasterChange();
          }

          this.creationOffreLoading = false;
        },
        error: (error) => {
          console.error('Erreur création offre:', error);
          this.toastService.show(
            error?.error?.error || "Erreur lors de la création de l'offre.",
            'error',
          );
          this.creationOffreLoading = false;
        },
      });
  }

  selectionnerOffre(offre: OffrePreinscription): void {
    this.selectedOffreId = offre.id;
    this.offreEditionMode = true;
    this.offreEditForm = {
      id: offre.id,
      nom: offre.titre,
      type_master: offre.type === 'cycle_ingenieur' ? 'professionnel' : 'recherche',
      specialite: offre.specialite,
      description: offre.description,
      places_disponibles: offre.places,
      date_limite_candidature: offre.date_limite || '',
      annee_universitaire: '2026/2027',
      actif: offre.statut === 'ouvert',
      date_debut_visibilite: '',
      date_fin_visibilite: '',
      date_limite_preinscription: offre.date_limite_preinscription || '',
      date_limite_depot_dossier: offre.date_limite_depot_dossier || '',
      date_limite_paiement: offre.date_limite_paiement || '',
      delai_modification_candidature_jours: 7,
      delai_depot_dossier_preselectionnes_jours: 14,
      est_cache: !!offre.est_cache,
      capacite_interne: offre.capacite_interne || 0,
      capacite_externe: offre.capacite_externe || 0,
      document_officiel_pdf_url: offre.document_officiel_pdf_url || null,
    };
    this.selectedConfigMasterId = offre.id;
    this.onConfigMasterChange();
  }

  ouvrirPageEditionOffre(offre: OffrePreinscription): void {
    if (!offre?.id) {
      return;
    }

    if (offre.isDemo) {
      this.router.navigate(['/commission/offre-preinscription/edit', this.fallbackEditOfferId]);
      return;
    }

    this.router.navigate(['/commission/offre-preinscription/edit', offre.id]);
  }

  ouvrirEditionOuCreation(offre: OffrePreinscription): void {
    if (offre?.isDemo) {
      this.router.navigate(['/commission/offre-preinscription/edit', this.fallbackEditOfferId]);
      return;
    }

    this.ouvrirPageEditionOffre(offre);
  }

  uploadOfferPdf(event: any): void {
    if (!this.selectedOffreId) {
      this.toastService.show('Sélectionnez une offre avant de téléverser un PDF.', 'warning');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.toastService.show('Veuillez sélectionner un fichier PDF.', 'error');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    const formData = new FormData();
    formData.append('document_pdf', file);

    this.http
      .post(
        `http://localhost:8003/api/candidatures/configuration/${this.selectedOffreId}/document-pdf/`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (response: any) => {
          this.offresPreinscription = this.offresPreinscription.map((offre) =>
            offre.id === this.selectedOffreId
              ? { ...offre, document_officiel_pdf_url: response.document_url || null }
              : offre,
          );
          this.offreEditForm.document_officiel_pdf_url = response.document_url || null;
          this.toastService.show('PDF téléversé avec succès.', 'success');
          if (event.target) {
            event.target.value = '';
          }
        },
        error: (error) => {
          console.error('Erreur téléversement PDF offre:', error);
          this.toastService.show('Erreur lors du téléversement PDF.', 'error');
        },
      });
  }

  basculerEtatOffre(offre: OffrePreinscription, hidden: boolean): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .put(
        `http://localhost:8003/api/candidatures/configuration/${offre.id}/`,
        {
          master: offre.id,
          est_cache: hidden,
          actif: offre.statut === 'ouvert',
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          this.toastService.show(hidden ? 'Offre masquée.' : 'Offre affichée.', 'success');
          this.loadOffresPreinscription();
        },
        error: (error) => {
          console.error('Erreur bascule visibilité offre:', error);
          this.toastService.show('Impossible de modifier la visibilité.', 'error');
        },
      });
  }

  onOffreStatutSwitchChange(offre: OffrePreinscription, event: Event): void {
    if (offre?.isDemo) {
      const input = event.target as HTMLInputElement | null;
      if (input) {
        input.checked = offre.statut === 'ouvert';
      }
      this.toastService.show(
        'Mode démo: créez une offre réelle pour changer le statut.',
        'warning',
      );
      return;
    }
    const checked = (event.target as HTMLInputElement | null)?.checked ?? false;
    this.ouvrirFermerOffre(offre, checked);
  }

  onOffreVisibiliteSwitchChange(offre: OffrePreinscription, event: Event): void {
    if (offre?.isDemo) {
      const input = event.target as HTMLInputElement | null;
      if (input) {
        input.checked = !offre.est_cache;
      }
      this.toastService.show(
        'Mode démo: créez une offre réelle pour changer la visibilité.',
        'warning',
      );
      return;
    }
    const checked = (event.target as HTMLInputElement | null)?.checked ?? true;
    // checked=true => visible => hidden=false
    this.basculerEtatOffre(offre, !checked);
  }

  ouvrirFermerOffre(offre: OffrePreinscription, ouvert: boolean): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    const dateLimite = ouvert
      ? this.offreEditForm.date_limite_candidature || offre.date_limite
      : '2000-01-01';

    this.http
      .put(
        `http://localhost:8003/api/candidatures/masters/${offre.id}/`,
        {
          nom: offre.titre,
          type_master: offre.sous_type,
          specialite: offre.specialite,
          description: offre.description,
          places_disponibles: offre.places,
          date_limite_candidature: dateLimite,
          annee_universitaire: '2026/2027',
          actif: ouvert,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          this.toastService.show(ouvert ? 'Offre ouverte.' : 'Offre fermée.', 'success');
          this.loadOffresPreinscription();
        },
        error: (error) => {
          console.error('Erreur ouverture/fermeture offre:', error);
          this.toastService.show("Impossible de modifier le statut de l'offre.", 'error');
        },
      });
  }

  enregistrerEditionOffre(): void {
    if (!this.selectedOffreId) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.editingOffreLoading = true;

    const payload = {
      nom: this.offreEditForm.nom,
      type_master: this.offreEditForm.type_master,
      specialite: this.offreEditForm.specialite,
      description: this.offreEditForm.description,
      places_disponibles: this.offreEditForm.places_disponibles,
      date_limite_candidature: this.offreEditForm.date_limite_candidature,
      annee_universitaire: this.offreEditForm.annee_universitaire,
      actif: this.offreEditForm.actif,
      est_cache: this.offreEditForm.est_cache,
      capacite_interne: this.offreEditForm.capacite_interne,
      capacite_externe: this.offreEditForm.capacite_externe,
    };

    this.http
      .put(`http://localhost:8003/api/candidatures/masters/${this.selectedOffreId}/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          this.toastService.show('Offre mise à jour.', 'success');
          this.editingOffreLoading = false;
          this.offreEditionMode = false;
          this.loadOffresPreinscription();
        },
        error: (error) => {
          console.error('Erreur mise à jour offre:', error);
          this.toastService.show('Erreur lors de la mise à jour.', 'error');
          this.editingOffreLoading = false;
        },
      });
  }

  get candidaturesMastersResponsableList(): Candidature[] {
    return this.candidatures.filter((candidature) => candidature.type_concours === 'masters');
  }

  get candidaturesIngenieurResponsableList(): Candidature[] {
    return this.candidatures.filter((candidature) => candidature.type_concours === 'ingenieur');
  }

  uploadConfigurationPdf(event: any): void {
    if (!this.selectedConfigMasterId) {
      this.toastService.show('Veuillez sélectionner un master.', 'error');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.type !== 'application/pdf') {
      this.toastService.show('Veuillez sélectionner un fichier PDF.', 'error');
      return;
    }

    const maxSizeMB = 10;
    if (file.size > maxSizeMB * 1024 * 1024) {
      this.toastService.show(`Le fichier dépasse ${maxSizeMB} MB.`, 'error');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    const formData = new FormData();
    formData.append('document_pdf', file);

    this.http
      .post(
        `http://localhost:8003/api/candidatures/configuration/${this.selectedConfigMasterId}/document-pdf/`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: (response: any) => {
          this.configurationAppel.document_officiel_pdf_url = response.document_url;
          this.toastService.show('Document PDF chargé avec succès.', 'success');
          // Reset file input
          if (event.target) {
            event.target.value = '';
          }
        },
        error: (error) => {
          console.error('Erreur upload PDF:', error);
          const errorMsg = error?.error?.error || 'Erreur lors du téléchargement du document.';
          this.toastService.show(errorMsg, 'error');
        },
      });
  }

  downloadConfigurationPdf(): void {
    if (!this.configurationAppel.document_officiel_pdf_url) {
      this.toastService.show('Aucun document disponible.', 'warning');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    // Get the base URL from the document_officiel_pdf_url
    const link = document.createElement('a');
    link.href = this.configurationAppel.document_officiel_pdf_url;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private loadActionPermissions(): void {
    this.authService.getMyEnabledActions().subscribe({
      next: (actions: string[]) => {
        this.customRoleActions = this.extractCustomRoleActions(actions || []);

        // Fallback permissif: si l'API des actions est indisponible/vide,
        // on conserve les permissions locales pour ne pas masquer le menu.
        if (!actions || actions.length === 0) {
          console.warn('Aucune action distante chargee, conservation des permissions locales.');
          return;
        }

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

  canAccessView(view: CommissionView): boolean {
    if (view === 'dashboard' || view === 'profil' || view === 'masters') {
      return true;
    }

    if (view === 'configuration-appels') {
      return this.isResponsable;
    }

    if (view === 'concours-ingenieur') {
      return this.isResponsable || this.actionPermissions.consultationCandidature;
    }

    if (view === 'candidatures') {
      return this.actionPermissions.consultationCandidature;
    }

    if ((view as string) === 'candidatures-responsable') {
      return this.isResponsable;
    }

    if ((view as string) === 'avis-listes') {
      return (
        this.isResponsable ||
        this.actionPermissions.consultationCandidature ||
        this.actionPermissions.preselection ||
        this.actionPermissions.selectionFinale
      );
    }

    if (view === 'valider-dossier') {
      return this.actionPermissions.verifierDossiers;
    }

    if (view === 'dossiers') {
      return this.actionPermissions.consultationDossier;
    }

    if (view === 'listes') {
      return (
        this.actionPermissions.consultationCandidature ||
        this.actionPermissions.preselection ||
        this.actionPermissions.selectionFinale
      );
    }

    if (view === 'ocr') {
      return this.actionPermissions.verifierDossiers || this.actionPermissions.consultationDossier;
    }

    if (view === 'reclamations') {
      return (
        this.actionPermissions.traiterReclamations || this.actionPermissions.consultationCandidature
      );
    }

    if (view === 'inscriptions') {
      return (
        this.actionPermissions.gererInscriptions || this.actionPermissions.consultationCandidature
      );
    }

    if (view === 'statistiques') {
      return false;
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

    if (view === 'candidatures-responsable') {
      return this.isResponsable;
    }

    if (view === 'candidatures-master' || view === 'candidatures-ingenieur') {
      return this.isResponsable && this.actionPermissions.consultationCandidature;
    }

    return true;
  }

  isMenuDisabled(view: CommissionView): boolean {
    return !this.canAccessView(view);
  }

  openMenuView(view: CommissionView): void {
    if (this.isMenuDisabled(view)) {
      this.notifyActionBlocked('Fonctionnalité non accessible pour votre rôle.');
      return;
    }
    this.switchView(view);
  }

  canOpenCandidaturesMasterMenu(): boolean {
    return this.isResponsable || this.actionPermissions.consultationCandidature;
  }

  canOpenCandidaturesIngenieurMenu(): boolean {
    return this.isResponsable
      ? this.isEngineerScope()
      : this.actionPermissions.consultationCandidature;
  }

  openCandidaturesMasterMenu(): void {
    if (!this.canOpenCandidaturesMasterMenu()) {
      this.notifyActionBlocked('Fonctionnalité non accessible pour votre rôle.');
      return;
    }

    if (this.isResponsable) {
      this.filtres.concours = 'masters';
      this.switchView('candidatures-responsable');
      this.appliquerFiltresResponsable();
      return;
    }

    this.filtres.concours = 'masters';
    this.switchView('candidatures');
    this.appliquerFiltres();
  }

  openCandidaturesIngenieurMenu(): void {
    if (!this.canOpenCandidaturesIngenieurMenu()) {
      this.notifyActionBlocked('Fonctionnalité non accessible pour votre rôle.');
      return;
    }

    if (this.isResponsable) {
      this.filtres.concours = 'ingenieur';
      this.switchView('candidatures-ingenieur');
      this.appliquerFiltresResponsable();
      return;
    }

    this.filtres.concours = 'ingenieur';
    this.switchView('candidatures');
    this.appliquerFiltres();
  }

  getCandidaturesResponsableByType(type: 'masters' | 'ingenieur'): Candidature[] {
    return this.candidaturesResponsable.filter((candidature) => candidature.type_concours === type);
  }

  getResponsableMasterStats(): ResponsableMasterStat[] {
    const grouped = new Map<string, ResponsableMasterStat>();

    this.candidaturesResponsable.forEach((candidature) => {
      const masterId = candidature.master_id || candidature.master_nom || 'unknown';
      const masterNom = candidature.master_nom || candidature.specialite || 'Master inconnu';
      const typeConcours = (candidature.type_concours === 'ingenieur' ? 'ingenieur' : 'masters') as
        | 'masters'
        | 'ingenieur'
        | 'autre';
      const key = `${masterId}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          masterId,
          masterNom,
          typeConcours,
          totalCandidatures: 0,
          dossiersDeposes: 0,
          acceptes: 0,
          inscrits: 0,
          rejetes: 0,
          tauxAcceptation: 0,
          tauxInscription: 0,
          tauxDossier: 0,
          tauxRejet: 0,
        });
      }

      const stat = grouped.get(key)!;
      stat.totalCandidatures += 1;
      if (candidature.dossier_depose) {
        stat.dossiersDeposes += 1;
      }
      if (candidature.statut === 'selectionne' || candidature.statut === 'inscrit') {
        stat.acceptes += 1;
      }
      if (candidature.statut === 'inscrit') {
        stat.inscrits += 1;
      }
      if (candidature.statut === 'rejete') {
        stat.rejetes += 1;
      }

      stat.tauxAcceptation = this.getRate(stat.acceptes, stat.totalCandidatures);
      stat.tauxInscription = this.getRate(stat.inscrits, Math.max(stat.acceptes, 1));
      stat.tauxDossier = this.getRate(stat.dossiersDeposes, stat.totalCandidatures);
      stat.tauxRejet = this.getRate(stat.rejetes, stat.totalCandidatures);
    });

    return Array.from(grouped.values()).sort((a, b) => b.totalCandidatures - a.totalCandidatures);
  }

  getTotalResponsableCandidatures(): number {
    return this.getResponsableMasterStats().reduce(
      (total, stat) => total + stat.totalCandidatures,
      0,
    );
  }

  getTotalResponsableDossiersDeposes(): number {
    return this.getResponsableMasterStats().reduce(
      (total, stat) => total + stat.dossiersDeposes,
      0,
    );
  }

  getTotalResponsableAcceptes(): number {
    return this.getResponsableMasterStats().reduce((total, stat) => total + stat.acceptes, 0);
  }

  getTotalResponsableInscrits(): number {
    return this.getResponsableMasterStats().reduce((total, stat) => total + stat.inscrits, 0);
  }

  getTotalResponsableRejetes(): number {
    return this.getResponsableMasterStats().reduce((total, stat) => total + stat.rejetes, 0);
  }

  getTauxResponsableAcceptationGlobal(): number {
    return this.getRate(this.getTotalResponsableAcceptes(), this.getTotalResponsableCandidatures());
  }

  getTauxResponsableInscriptionGlobal(): number {
    return this.getRate(
      this.getTotalResponsableInscrits(),
      Math.max(this.getTotalResponsableAcceptes(), 1),
    );
  }

  getTauxResponsableDossierGlobal(): number {
    return this.getRate(
      this.getTotalResponsableDossiersDeposes(),
      this.getTotalResponsableCandidatures(),
    );
  }

  getRate(numerator: number, denominator: number): number {
    if (!denominator) {
      return 0;
    }
    return Math.round((numerator / denominator) * 1000) / 10;
  }

  getResponsibleMasterLabel(stat: ResponsableMasterStat): string {
    return stat.masterNom || 'Master inconnu';
  }

  private notifyActionBlocked(message: string): void {
    this.toastService.show(message, 'warning');
  }

  private showAlertMessage(message: string): void {
    const normalized = String(message ?? '').trim();
    const cleanMessage = normalized.replace(/[✅❌⚠️ℹ️]/g, '').trim();
    let type: 'success' | 'info' | 'warning' | 'error' = 'info';

    if (normalized.includes('✅')) {
      type = 'success';
    } else if (normalized.includes('❌')) {
      type = 'error';
    } else if (/erreur|impossible|introuvable|expir/i.test(normalized)) {
      type = 'error';
    } else if (
      /obligatoire|veuillez|aucun|aucune|invalide|fermee|fermé|attention/i.test(normalized)
    ) {
      type = 'warning';
    } else if (
      /succes|succès|enregistr|soumis|publie|publié|modifie|modifié|supprim/i.test(normalized)
    ) {
      type = 'success';
    }

    this.toastService.show(cleanMessage || 'Notification', type);
  }

  canAnalyzeDossier(): boolean {
    return this.actionPermissions.verifierDossiers || this.actionPermissions.consultationDossier;
  }

  canChangeStatus(): boolean {
    return this.isResponsable && this.actionPermissions.verifierDossiers;
  }

  canGiveAvis(): boolean {
    return this.actionPermissions.preselection || this.actionPermissions.consultationCandidature;
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
          this.showAlertMessage('❌ Erreur lors du téléchargement');
        },
      });

    this.closeActionMenu();
  }

  modifierScore(candidature: Candidature): void {
    this.notifyActionBlocked(
      'La modification manuelle du score est désactivée. Le score est calculé automatiquement.',
    );

    this.closeActionMenu();
  }

  rejeterCandidature(candidature: Candidature): void {
    if (!this.canChangeStatus()) {
      this.notifyActionBlocked('Seul le responsable peut rejeter une candidature.');
      return;
    }

    if (
      !confirm(`Êtes-vous sûr de vouloir rejeter la candidature de ${candidature.candidat_nom} ?`)
    ) {
      return;
    }

    const motif = prompt('Motif du rejet :');

    if (!motif) {
      this.showAlertMessage('❌ Le motif est obligatoire');
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
          this.showAlertMessage('✅ Candidature rejetée');
          candidature.statut = 'rejete';
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage('❌ Erreur lors du rejet');
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

    if (!this.masterOptions.length) {
      this.toastService.show('Aucun master disponible pour créer un PV.', 'warning');
      return;
    }

    let masterId = this.selectedConfigMasterId;
    if (!masterId) {
      masterId = this.masterOptions[0].id;
    }

    const selectedMaster = this.masterOptions.find((m) => m.id === masterId);
    if (!selectedMaster) {
      this.toastService.show('Master invalide pour la création du PV.', 'error');
      return;
    }

    const token = this.authService.getAccessToken();
    this.http
      .post<any>(
        `http://localhost:8003/api/candidatures/master/${masterId}/generer-listes/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (response) => {
          const existingIndex = this.procesVerbaux.findIndex(
            (pv) => pv.master_nom === selectedMaster.nom && pv.statut !== 'publie',
          );

          const pv: ProcesVerbal = {
            id: Number(response?.id ?? Date.now()),
            titre:
              response?.titre ||
              `Délibération ${selectedMaster.nom} - Session ${new Date().getFullYear()}`,
            date_reunion:
              response?.date_reunion ||
              response?.date_creation ||
              new Date().toISOString().slice(0, 10),
            master_nom: response?.master_nom || selectedMaster.nom,
            nb_participants: Number(response?.nb_participants ?? 0),
            nb_candidatures: Number(response?.nb_candidatures ?? response?.total_candidats ?? 0),
            nb_admis: Number(response?.nb_admis ?? response?.admis ?? 0),
            nb_rejetes: Number(response?.nb_rejetes ?? response?.rejetes ?? 0),
            statut: response?.statut || 'brouillon',
          };

          if (existingIndex >= 0) {
            this.procesVerbaux[existingIndex] = pv;
          } else {
            this.procesVerbaux.unshift(pv);
          }

          this.toastService.show('PV généré avec succès.', 'success');
        },
        error: (error) => {
          console.error('Erreur création PV:', error);
          this.toastService.show('Erreur lors de la génération du PV.', 'error');
        },
      });
  }

  voirPV(pv: ProcesVerbal): void {
    this.showAlertMessage(`Consulter PV: ${pv.titre}`);
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
          this.showAlertMessage('❌ Erreur lors du téléchargement');
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
          this.showAlertMessage('✅ PV publié');
          pv.statut = 'publie';
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage('❌ Erreur lors de la publication');
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

  get validationValidatedCount(): number {
    return this.candidaturesAvecDossier.filter(
      (c) => c.statut === 'dossier_depose' || c.statut === 'selectionne' || c.statut === 'inscrit',
    ).length;
  }

  get validationRejectedCount(): number {
    return this.candidaturesAvecDossier.filter((c) => c.statut === 'rejete').length;
  }

  get validationPendingCount(): number {
    return (
      this.candidaturesAvecDossier.length -
      this.validationValidatedCount -
      this.validationRejectedCount
    );
  }

  switchView(view: CommissionView): void {
    if (!this.canAccessView(view)) {
      this.notifyActionBlocked("Cette section n'est pas active pour votre rôle.");
      return;
    }
    this.currentView = view;
    if (view === 'notifications') {
      this.loadNotifications();
    }
    const candidatureViews: CommissionView[] = [
      'candidatures-responsable',
      'candidatures-master',
      'candidatures-ingenieur',
    ];
    if (candidatureViews.includes(view)) {
      this.resetFiltresResponsable();
      this.loadCandidaturesResponsable();
      if (view === 'candidatures-ingenieur') {
        this.filtres.concours = 'ingenieur';
        this.appliquerFiltresResponsable();
      }
    }
    if (view === 'candidatures') {
      this.loadCandidaturesMembre();
    }
  }

  isCurrentView(view: CommissionView): boolean {
    return this.currentView === view;
  }

  openCustomRoleAction(actionName: string): void {
    const normalized = normalizeActionLabel(actionName);
    const target = this.customActionViewMap[normalized];

    if (!target) {
      this.notifyActionBlocked(`Action non mappée: ${actionName}`);
      return;
    }

    if (target === 'ocr') {
      this.openOcrAnalysisPage();
      return;
    }

    if (target) {
      this.switchView(target);
      return;
    }
  }

  openOcrAnalysisPage(candidature?: Candidature): void {
    if (!this.canAnalyzeDossier()) {
      this.notifyActionBlocked('Analyse OCR non autorisée pour votre profil.');
      return;
    }

    const queryParams = candidature?.id ? { candidatureId: candidature.id } : undefined;
    this.currentView = 'ocr';
    this.router.navigate(['/commission/dossier-analysis'], { queryParams });
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
      'configuration-appels': 'Offre de préinscription',
      'candidatures-responsable': 'Liste de candidature',
      'avis-listes': 'Présélection',
      candidatures: this.isResponsable ? 'Candidatures à évaluer' : 'Liste de candidature',
      'valider-dossier': 'Dossiers à valider',
      dossiers: 'Tous les dossiers soumis',
      listes: "Listes d'admission",
      membres: 'Membres de la commission',
      ocr: 'Analyse automatique (OCR)',
      reclamations: 'Gestion des réclamations',
      inscriptions: 'Validation des inscriptions',
      statistiques: 'Statistiques et rapports',
      deliberations: 'Procès-verbaux de délibération',
      notifications: 'Notifications',
      'candidatures-master': 'Candidatures Master',
      'candidatures-ingenieur': 'Candidatures Ingénieur',
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

  getConcoursStatut(concours: Concours): 'actuel' | 'ancien' {
    const year = Number(concours.annee);
    const currentYear = new Date().getFullYear();

    if (!Number.isNaN(year) && year < currentYear) {
      return 'ancien';
    }

    return 'actuel';
  }

  getConcoursIngenieur(): Concours[] {
    return this.concoursIngenieur.filter(
      (concours) => this.getConcoursStatut(concours) === this.filtreConcours,
    );
  }

  get candidaturesMastersResponsable(): Candidature[] {
    return this.candidaturesResponsable.filter(
      (candidature) => candidature.type_concours === 'masters',
    );
  }

  get candidaturesIngenieurResponsable(): Candidature[] {
    return this.candidaturesResponsable.filter(
      (candidature) => candidature.type_concours === 'ingenieur',
    );
  }

  get candidaturesResponsableMastersCount(): number {
    return this.candidaturesResponsableFiltrees.filter((c) => c.type_concours === 'masters').length;
  }

  get candidaturesResponsableIngenieurCount(): number {
    return this.candidaturesResponsableFiltrees.filter((c) => c.type_concours === 'ingenieur')
      .length;
  }

  get candidaturesResponsableDossiersDeposesCount(): number {
    return this.candidaturesResponsableFiltrees.filter((c) => c.dossier_depose).length;
  }

  resetFiltresResponsable(): void {
    this.selectedMasterForCandidatures = 'all';
    this.filtres.concours = '';
    this.filtres.statut = '';
    this.filtres.recherche = '';
    this.filtreAnneeUniversitaire = 'courante';
    this.filtrePorteeOffres = 'specialite';
    this.candidaturesResponsableFiltrees = [...this.candidaturesResponsable];
  }

  appliquerFiltresResponsable(): void {
    const offresEligibles = this.getEligibleOpenOffresForCurrentProfile();
    const masterIdsEligibles = new Set<number>(
      offresEligibles.map((offre) => Number(offre.id)).filter((id) => Number.isFinite(id)),
    );

    this.candidaturesResponsableFiltrees = this.candidaturesResponsable.filter((candidature) => {
      if (masterIdsEligibles.size > 0) {
        const masterId = Number(candidature.master_id || 0);
        if (masterId && !masterIdsEligibles.has(masterId)) {
          return false;
        }
      }

      if (
        this.selectedMasterForCandidatures !== 'all' &&
        candidature.master_id !== this.selectedMasterForCandidatures
      ) {
        return false;
      }

      if (this.filtres.concours && candidature.type_concours !== this.filtres.concours) {
        return false;
      }

      if (this.filtres.statut && candidature.statut !== this.filtres.statut) {
        return false;
      }

      const search = (this.filtres.recherche || '').toLowerCase();
      if (search) {
        const match =
          candidature.numero.toLowerCase().includes(search) ||
          candidature.candidat_nom.toLowerCase().includes(search) ||
          candidature.candidat_email.toLowerCase().includes(search) ||
          (candidature.specialite || '').toLowerCase().includes(search);
        if (!match) {
          return false;
        }
      }

      return true;
    });
  }

  get responsibleNotificationsFiltered(): ResponsibleNotificationItem[] {
    return this.responsibleNotifications.filter((item) => {
      if (
        this.filtreResponsibleNotificationType &&
        item.type !== this.filtreResponsibleNotificationType
      ) {
        return false;
      }

      if (
        this.filtreResponsibleNotificationStatut &&
        item.statut !== this.filtreResponsibleNotificationStatut
      ) {
        return false;
      }

      return true;
    });
  }

  get responsibleDeadlineSoonItems(): ResponsibleNotificationItem[] {
    return this.responsibleNotifications
      .filter((item) => item.days_left >= 0 && item.days_left <= 3)
      .sort((a, b) => a.days_left - b.days_left);
  }

  get responsibleDeadlineSoonCount(): number {
    return this.responsibleDeadlineSoonItems.length;
  }

  getCurrentAcademicYear(): string {
    const now = new Date();
    const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return `${startYear}/${startYear + 1}`;
  }

  getPreviousAcademicYear(): string {
    const [startRaw] = this.getCurrentAcademicYear().split('/');
    const startYear = Number(startRaw || new Date().getFullYear());
    return `${startYear - 1}/${startYear}`;
  }

  getAcademicYearLabel(mode: 'courante' | 'precedente' | 'toutes'): string {
    if (mode === 'courante') {
      return this.getCurrentAcademicYear();
    }
    if (mode === 'precedente') {
      return this.getPreviousAcademicYear();
    }
    return 'Toutes';
  }

  getUserMasterOrSpecialiteLabel(): string {
    const direct =
      this.currentUser?.master_rattachement ||
      this.currentUser?.master_nom ||
      this.currentUser?.specialite ||
      '';
    if (String(direct).trim()) {
      return String(direct).trim();
    }

    const fromMembers = this.membres.find(
      (member) => member.email?.toLowerCase() === (this.currentUser?.email || '').toLowerCase(),
    );
    return fromMembers?.master_rattachement || 'Tous les masters';
  }

  hasUserScopeLabel(): boolean {
    return this.getUserMasterOrSpecialiteLabel() !== 'Tous les masters';
  }

  isEngineerScope(): boolean {
    const label = this.getUserMasterOrSpecialiteLabel().toLowerCase();
    return label.includes('ingénieur') || label.includes('ingenieur');
  }

  private getOffreAcademicYear(offre: OffrePreinscription): string {
    const fromPayload = String(offre.annee_universitaire || '').trim();
    if (fromPayload) {
      return fromPayload;
    }

    const refDate = new Date(offre.date_limite || new Date().toISOString());
    const year = refDate.getFullYear();
    return refDate.getMonth() >= 8 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
  }

  private getEligibleOpenOffresForCurrentProfile(): OffrePreinscription[] {
    const currentYear = this.getCurrentAcademicYear();
    const previousYear = this.getPreviousAcademicYear();
    const profileMaster = this.getUserMasterOrSpecialiteLabel().toLowerCase();

    return this.offresPreinscription.filter((offre) => {
      if (offre.statut !== 'ouvert') {
        return false;
      }

      const offerYear = this.getOffreAcademicYear(offre);
      if (this.filtreAnneeUniversitaire === 'courante' && offerYear !== currentYear) {
        return false;
      }
      if (this.filtreAnneeUniversitaire === 'precedente' && offerYear !== previousYear) {
        return false;
      }

      if (this.filtrePorteeOffres === 'toutes_ouvertes') {
        return true;
      }

      if (!profileMaster || profileMaster === 'tous les masters') {
        return true;
      }

      const offerText = `${offre.titre || ''} ${offre.specialite || ''}`.toLowerCase();
      return offerText.includes(profileMaster);
    });
  }

  onResponsableOfferFiltersChanged(): void {
    this.appliquerFiltresResponsable();
  }

  get offresEligiblesCount(): number {
    return this.getEligibleOpenOffresForCurrentProfile().length;
  }

  getDashboardProgramStats(): DashboardProgramStat[] {
    const baseSource = this.isResponsable
      ? this.candidaturesResponsable.length
        ? this.candidaturesResponsable
        : this.candidatures
      : this.candidatures;
    const source = this.getScopedCandidatures(baseSource);

    const grouped = new Map<string, DashboardProgramStat>();
    source.forEach((cand) => {
      const label = cand.master_nom || cand.specialite || 'Programme non défini';
      const type = (cand.type_concours === 'ingenieur' ? 'ingenieur' : 'masters') as
        | 'masters'
        | 'ingenieur'
        | 'autre';

      if (!grouped.has(label)) {
        grouped.set(label, {
          label,
          type,
          total: 0,
          acceptes: 0,
          inscrits: 0,
          rejetes: 0,
          tauxAcceptation: 0,
          tauxInscription: 0,
        });
      }

      const stat = grouped.get(label)!;
      stat.total += 1;
      if (cand.statut === 'selectionne' || cand.statut === 'inscrit') {
        stat.acceptes += 1;
      }
      if (cand.statut === 'inscrit') {
        stat.inscrits += 1;
      }
      if (cand.statut === 'rejete') {
        stat.rejetes += 1;
      }

      stat.tauxAcceptation = this.getRate(stat.acceptes, stat.total);
      stat.tauxInscription = this.getRate(stat.inscrits, Math.max(stat.acceptes, 1));
    });

    return Array.from(grouped.values()).sort((a, b) => b.total - a.total);
  }

  consulterConcours(concours: Concours): void {
    this.filtreSpecialiteActive = '';
    this.filtres.concours = 'ingenieur';
    this.switchView('candidatures');
    this.appliquerFiltres();
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
      this.showAlertMessage('❌ Aucun dossier déposé pour cette candidature');
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
    this.avisDiplomeConforme = 'conforme';
    this.showModalAvis = true;
  }

  fermerModalAvis(): void {
    this.showModalAvis = false;
    this.candidatureSelectionnee = null;
    this.avisText = '';
    this.avisDiplomeConforme = 'conforme';
  }

  ouvrirModalAvisListe(liste: Liste): void {
    this.listeSelectionneeAvis = liste;
    this.avisListeText = liste.avis || '';
    this.avisListeRecommandation = liste.recommandation || 'favorable';
    this.showModalAvisListe = true;
  }

  fermerModalAvisListe(): void {
    this.showModalAvisListe = false;
    this.listeSelectionneeAvis = null;
    this.avisListeText = '';
    this.avisListeRecommandation = 'favorable';
  }

  enregistrerAvisListe(): void {
    if (!this.avisListeText.trim()) {
      this.showAlertMessage('❌ Veuillez saisir un avis');
      return;
    }

    if (!this.listeSelectionneeAvis) {
      return;
    }

    const avis = this.avisListeText.trim();
    this.listeSelectionneeAvis.avis = avis;
    this.listeSelectionneeAvis.recommandation = this.avisListeRecommandation;

    const index = this.listes.findIndex((liste) => liste.id === this.listeSelectionneeAvis!.id);
    if (index !== -1) {
      this.listes[index].avis = avis;
      this.listes[index].recommandation = this.avisListeRecommandation;
    }

    this.showAlertMessage('✅ Avis enregistré avec succès !');
    this.fermerModalAvisListe();
  }

  enregistrerAvis(): void {
    if (!this.canGiveAvis()) {
      this.notifyActionBlocked('Vous ne pouvez pas déposer un avis sur cette candidature.');
      return;
    }

    if (!this.avisText.trim()) {
      this.showAlertMessage('❌ Veuillez saisir un avis');
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
          this.showAlertMessage('✅ Avis enregistré avec succès !');

          if (this.candidatureSelectionnee) {
            const candidatureId = this.candidatureSelectionnee.id;
            const existingVotes = this.candidatureVotes[candidatureId] || [];
            const membreNom = this.currentUser?.username || this.currentUser?.email || 'Membre';
            const filteredVotes = existingVotes.filter((vote) => vote.membreNom !== membreNom);

            this.candidatureVotes[candidatureId] = [
              ...filteredVotes,
              {
                membreNom,
                role: this.isResponsable ? 'responsable' : 'membre',
                recommandation: this.avisRecommandation as 'favorable' | 'defavorable' | 'reserve',
                commentaire: `${this.avisText.trim()} | Diplôme ${this.avisDiplomeConforme === 'conforme' ? 'conforme' : 'non conforme'}`,
                date: new Date().toISOString(),
                diplomeConforme: this.avisDiplomeConforme === 'conforme',
              },
            ];

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
          this.showAlertMessage("❌ Erreur lors de l'enregistrement de l'avis");
        },
      });
  }

  getVotesForCandidature(candidatureId: number): CandidatureVoteAvis[] {
    return this.candidatureVotes[candidatureId] || [];
  }

  getAllVotesDisplay(candidatureId: number): string {
    const votes = this.getVotesForCandidature(candidatureId);
    if (!votes.length) {
      return 'Aucun avis';
    }

    return votes
      .map((vote) => {
        const role = vote.role === 'responsable' ? 'Responsable' : 'Membre';
        const recomm =
          vote.recommandation === 'favorable'
            ? 'Favorable'
            : vote.recommandation === 'defavorable'
              ? 'Défavorable'
              : 'Réserve';
        const diplome =
          vote.diplomeConforme === false ? 'Diplôme non conforme' : 'Diplôme conforme';
        return `${role} ${vote.membreNom}: ${recomm} (${diplome})`;
      })
      .join(' | ');
  }

  getCurrentUserScopeLabel(): string {
    const label = this.getUserMasterOrSpecialiteLabel();
    return label && label !== 'Tous les masters' ? label : 'Toutes les spécialités';
  }

  private isCandidatureInScope(candidature: Candidature): boolean {
    const scope = this.getUserMasterOrSpecialiteLabel().toLowerCase().trim();
    if (!scope || scope === 'tous les masters') {
      return true;
    }

    const text = `${candidature.specialite || ''} ${candidature.master_nom || ''}`.toLowerCase();
    return text.includes(scope);
  }

  private getScopedCandidatures(source: Candidature[]): Candidature[] {
    return source.filter((candidature) => this.isCandidatureInScope(candidature));
  }

  private getCandidatureAcademicYear(candidature: Candidature): string {
    const raw = String(candidature.annee_universitaire || '').trim();
    if (raw) {
      return raw;
    }

    return this.getCurrentAcademicYear();
  }

  getPreselectionWorkflowRows(): Candidature[] {
    const source = this.isResponsable
      ? this.candidaturesResponsable.length
        ? this.candidaturesResponsable
        : this.candidatures
      : this.candidatures;

    const scoped = this.getScopedCandidatures(source);
    const currentYear = this.getCurrentAcademicYear();
    const previousYear = this.getPreviousAcademicYear();
    const search = (this.preselectionSearch || '').toLowerCase().trim();

    const filtered = scoped.filter((candidature) => {
      const academicYear = this.getCandidatureAcademicYear(candidature);
      if (this.filtreAnneeUniversitaire === 'courante' && academicYear !== currentYear) {
        return false;
      }
      if (this.filtreAnneeUniversitaire === 'precedente' && academicYear !== previousYear) {
        return false;
      }

      if (
        this.preselectionDecisionFilter &&
        candidature.decision_responsable !== this.preselectionDecisionFilter
      ) {
        return false;
      }

      if (search) {
        const haystack =
          `${candidature.numero || ''} ${candidature.candidat_nom || ''} ${candidature.candidat_email || ''} ${candidature.specialite || ''}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  consulterCandidaturePreselection(candidature: Candidature): void {
    if (!this.actionPermissions.consultationCandidature) {
      this.notifyActionBlocked("Consultation candidature désactivée par l'administration.");
      return;
    }

    this.candidatureConsultationSelectionnee = candidature;
    this.showModalConsultation = true;
  }

  fermerModalConsultation(): void {
    this.showModalConsultation = false;
    this.candidatureConsultationSelectionnee = null;
  }

  setDecisionPreselection(candidature: Candidature, decision: 'valide' | 'non_valide' | ''): void {
    if (!this.isResponsable) {
      this.notifyActionBlocked('Seul le responsable peut enregistrer la décision finale.');
      return;
    }

    candidature.decision_responsable = decision;
  }

  confirmerDecisionPreselection(candidature: Candidature): void {
    if (!this.isResponsable) {
      this.notifyActionBlocked('Seul le responsable peut confirmer la décision.');
      return;
    }

    if (!candidature.decision_responsable) {
      this.toastService.show('Sélectionnez une décision valide/non valide.', 'warning');
      return;
    }

    const nextStatus = candidature.decision_responsable === 'valide' ? 'preselectionne' : 'rejete';
    this.candidatureStatutSelectionnee = candidature;
    this.statusSelection = nextStatus;
    this.statusRejectReason =
      nextStatus === 'rejete' ? 'Non validée en commission de présélection.' : '';

    if (candidature.statut === nextStatus) {
      this.toastService.show(
        nextStatus === 'preselectionne'
          ? 'La candidature est déjà validée en présélection.'
          : 'La candidature est déjà rejetée.',
        'info',
      );
      return;
    }

    this.confirmerChangementStatut();
  }

  getPreselectionValidCount(): number {
    return this.getPreselectionWorkflowRows().filter((row) => row.decision_responsable === 'valide')
      .length;
  }

  genererListePreselectionParScore(): void {
    if (!this.isResponsable) {
      this.notifyActionBlocked('Seul le responsable peut générer la liste de présélection.');
      return;
    }

    const quota = Math.max(1, Number(this.preselectionQuota || 0));
    const baseRows = this.getPreselectionWorkflowRows();
    const eligibles = baseRows.filter(
      (row) => row.decision_responsable === 'valide' && row.statut !== 'rejete',
    );

    if (!eligibles.length) {
      this.toastService.show(
        'Aucune candidature validée par le responsable pour générer la présélection.',
        'warning',
      );
      return;
    }

    const topRows = eligibles.slice(0, quota);
    const selectedIds = new Set<number>(topRows.map((row) => row.id));

    this.preselectionRowsForGeneration = topRows;
    this.candidatures = this.candidatures.map((candidature) =>
      selectedIds.has(candidature.id)
        ? { ...candidature, statut: 'preselectionne', decision_responsable: 'valide' }
        : candidature,
    );

    const specialiteLabel = this.getCurrentUserScopeLabel();
    const existing = this.listes.find(
      (liste) => liste.type === 'preselection' && liste.specialite === specialiteLabel,
    );
    const dateCreation = new Date().toLocaleDateString('fr-FR');

    if (existing) {
      existing.nb_candidats = topRows.length;
      existing.date_creation = dateCreation;
      existing.statut = 'active';
    } else {
      this.listes.unshift({
        id: Date.now(),
        nom: `Présélection ${specialiteLabel} ${new Date().getFullYear()}`,
        specialite: specialiteLabel,
        type: 'preselection',
        statut: 'active',
        nb_candidats: topRows.length,
        date_creation: dateCreation,
      });
    }

    this.toastService.show(
      `Liste de présélection générée (${topRows.length} candidats).`,
      'success',
    );
  }

  getSelectionListsForMember(): Liste[] {
    return this.listes
      .filter((liste) => liste.type === 'selection')
      .sort((a, b) => {
        const dateA = new Date(a.date_creation || '').getTime() || 0;
        const dateB = new Date(b.date_creation || '').getTime() || 0;
        return dateB - dateA;
      });
  }

  getSelectionCandidatesTotalForMember(): number {
    return this.getSelectionListsForMember().reduce(
      (total, liste) => total + Number(liste.nb_candidats || 0),
      0,
    );
  }

  get validationRows(): Candidature[] {
    const rows = this.getScopedCandidatures(this.candidaturesAvecDossier);
    const search = (this.validationFilters.recherche || '').toLowerCase().trim();

    return rows.filter((candidature) => {
      if (this.validationFilters.statut && candidature.statut !== this.validationFilters.statut) {
        return false;
      }

      if (this.validationFilters.diplomeConforme) {
        const votes = this.getVotesForCandidature(candidature.id);
        const hasNonConforme = votes.some((vote) => vote.diplomeConforme === false);
        if (this.validationFilters.diplomeConforme === 'oui' && hasNonConforme) {
          return false;
        }
        if (this.validationFilters.diplomeConforme === 'non' && !hasNonConforme) {
          return false;
        }
      }

      if (!search) {
        return true;
      }

      const haystack =
        `${candidature.numero} ${candidature.candidat_nom} ${candidature.specialite}`.toLowerCase();
      return haystack.includes(search);
    });
  }

  verifierDossiersFiltres(): void {
    this.toastService.show(
      `${this.validationRows.length} dossier(s) correspondent aux filtres de vérification.`,
      'info',
    );
  }

  getFavorableVotesCount(candidatureId: number): number {
    return this.getVotesForCandidature(candidatureId).filter(
      (vote) => vote.recommandation === 'favorable',
    ).length;
  }

  canValidatePreselection(candidature: Candidature): boolean {
    return this.canChangeStatus() && candidature.statut === 'sous_examen';
  }

  validerPreselectionParResponsable(candidature: Candidature): void {
    if (!this.canValidatePreselection(candidature)) {
      this.notifyActionBlocked('Validation de présélection réservée au responsable.');
      return;
    }

    const favorableVotes = this.getFavorableVotesCount(candidature.id);
    if (favorableVotes < 2) {
      this.toastService.show(
        'Validation impossible: au moins 2 avis favorables sont requis.',
        'warning',
      );
      return;
    }

    this.candidatureStatutSelectionnee = candidature;
    this.statusSelection = 'preselectionne';
    this.statusRejectReason = '';

    if (candidature.statut === 'preselectionne') {
      candidature.decision_responsable = 'valide';
      this.toastService.show('La candidature est déjà validée en présélection.', 'info');
      this.closeActionMenu();
      return;
    }

    this.confirmerChangementStatut();
    this.closeActionMenu();
  }

  onStatutChange(candidature: Candidature): void {
    console.log('Nouveau statut sélectionné:', candidature.nouveau_statut);
  }

  getAuthorizedStatutTransitions(candidature: Candidature): string[] {
    const currentStatut = candidature.statut;
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatut] || new Set();
    return Array.from(allowed);
  }

  getStatusDisplayLabel(statut: string): string {
    const labels: Record<string, string> = {
      soumis: 'Soumis',
      sous_examen: 'Sous examen',
      preselectionne: 'Présélectionné',
      en_attente_dossier: 'En attente dossier',
      dossier_depose: 'Dossier déposé',
      dossier_non_depose: 'Dossier non déposé',
      en_attente: 'En attente',
      selectionne: 'Sélectionné',
      rejete: 'Rejeté',
      annule: 'Annulé',
      inscrit: 'Inscrit',
    };

    return labels[statut] || statut;
  }

  ouvrirModalStatut(candidature: Candidature): void {
    if (!this.canChangeStatus()) {
      this.notifyActionBlocked('Seul le responsable peut changer le statut.');
      return;
    }

    const authorized = this.getAuthorizedStatutTransitions(candidature);
    if (authorized.length === 0) {
      this.showAlertMessage('Aucune transition de statut autorisée pour cette candidature.');
      return;
    }

    this.candidatureStatutSelectionnee = candidature;
    this.statusOptions = authorized;
    this.statusSelection =
      candidature.nouveau_statut && authorized.includes(candidature.nouveau_statut)
        ? candidature.nouveau_statut
        : authorized[0];
    this.statusRejectReason = '';
    this.showModalStatut = true;
    this.closeActionMenu();
  }

  fermerModalStatut(): void {
    this.showModalStatut = false;
    this.candidatureStatutSelectionnee = null;
    this.statusOptions = [];
    this.statusSelection = '';
    this.statusRejectReason = '';
  }

  changerStatut(candidature: Candidature): void {
    this.ouvrirModalStatut(candidature);
  }

  confirmerChangementStatut(): void {
    if (!this.canChangeStatus()) {
      this.notifyActionBlocked('Seul le responsable peut confirmer un changement de statut.');
      return;
    }

    if (!this.candidatureStatutSelectionnee) {
      return;
    }

    const candidature = this.candidatureStatutSelectionnee;
    candidature.nouveau_statut = this.statusSelection;

    const authorized = this.getAuthorizedStatutTransitions(candidature);
    if (!authorized.includes(candidature.nouveau_statut!)) {
      this.showAlertMessage(
        `❌ Transition non autorisée: ${candidature.statut} → ${candidature.nouveau_statut}`,
      );
      return;
    }

    let motif_rejet = '';

    if (candidature.nouveau_statut === 'rejete') {
      motif_rejet = this.statusRejectReason.trim();
      if (!motif_rejet) {
        this.showAlertMessage('❌ Le motif de rejet est obligatoire');
        return;
      }
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
          this.toastService.show('Statut changé avec succès.', 'success');
          candidature.statut = candidature.nouveau_statut!;
          candidature.nouveau_statut = '';
          this.fermerModalStatut();
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.toastService.show('Erreur lors du changement de statut.', 'error');
        },
      });
  }

  // ========================================
  // LISTES
  // ========================================
  getListesByType(): Liste[] {
    return this.listes.filter((l) => l.type === this.typeListe);
  }

  get listesActivesByTypeCount(): number {
    return this.getListesByType().filter((liste) => liste.statut === 'active').length;
  }

  get listesArchivesByTypeCount(): number {
    return this.getListesByType().filter((liste) => liste.statut === 'archivee').length;
  }

  get totalCandidatsByTypeCount(): number {
    return this.getListesByType().reduce((total, liste) => total + (liste.nb_candidats || 0), 0);
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

    if (type === 'selection') {
      this.genererListesSelectionFinaleAutomatique();
      return;
    }

    this.showAlertMessage(`Créer une nouvelle liste de ${type}`);
  }

  genererListesSelectionFinaleAutomatique(): void {
    if (!this.isResponsable) {
      this.notifyActionBlocked('Seul le responsable peut générer les listes finales.');
      return;
    }

    const eligibles = this.candidatures
      .filter(
        (c) => c.dossier_depose && (c.statut === 'preselectionne' || c.statut === 'selectionne'),
      )
      .sort((a, b) => (b.score || 0) - (a.score || 0));

    if (eligibles.length === 0) {
      this.toastService.show('Aucune candidature éligible pour la sélection finale.', 'warning');
      return;
    }

    const byMaster = new Map<number, Candidature[]>();
    eligibles.forEach((cand) => {
      const masterId = Number(cand.master_id || 0);
      if (!masterId) {
        return;
      }
      if (!byMaster.has(masterId)) {
        byMaster.set(masterId, []);
      }
      byMaster.get(masterId)!.push(cand);
    });

    if (byMaster.size === 0) {
      this.toastService.show(
        'Les candidatures éligibles doivent être rattachées à un master.',
        'warning',
      );
      return;
    }

    this.listes = this.listes.filter(
      (liste) =>
        !['Liste Principale', "Liste d'Attente", 'Liste Retenue'].some((prefix) =>
          liste.nom.startsWith(prefix),
        ),
    );

    const dateCreation = new Date().toLocaleDateString('fr-FR');
    let baseId = Date.now();
    const nouvellesListes: Liste[] = [];

    byMaster.forEach((cands, masterId) => {
      const offre = this.offresPreinscription.find((item) => Number(item.id) === masterId);

      const capacitePrincipale = Math.max(
        0,
        Number(
          offre?.capacite_total ||
            offre?.places ||
            Number(offre?.capacite_interne || 0) + Number(offre?.capacite_externe || 0),
        ),
      );

      const capaciteAttente = Math.max(
        0,
        Number(offre?.capacite_liste_attente || Math.ceil(capacitePrincipale * 0.5)),
      );

      const principale = cands.slice(0, capacitePrincipale);
      const attente = cands.slice(capacitePrincipale, capacitePrincipale + capaciteAttente);
      const retenu = cands.slice(0, capacitePrincipale + capaciteAttente);

      const specialite = cands[0]?.specialite || offre?.specialite || 'Toutes spécialités';
      const masterLabel = offre?.titre || cands[0]?.master_nom || `Master ${masterId}`;

      nouvellesListes.push(
        {
          id: baseId++,
          nom: `Liste Principale - ${masterLabel}`,
          specialite,
          type: 'selection',
          statut: 'active',
          nb_candidats: principale.length,
          date_creation: dateCreation,
        },
        {
          id: baseId++,
          nom: `Liste d'Attente - ${masterLabel}`,
          specialite,
          type: 'selection',
          statut: 'active',
          nb_candidats: attente.length,
          date_creation: dateCreation,
        },
        {
          id: baseId++,
          nom: `Liste Retenue - ${masterLabel}`,
          specialite,
          type: 'selection',
          statut: 'active',
          nb_candidats: retenu.length,
          date_creation: dateCreation,
        },
      );
    });

    this.listes.unshift(...nouvellesListes);
    this.toastService.show(
      'Listes de sélection finale générées selon les capacités réelles.',
      'success',
    );
  }

  modifierListe(liste: Liste): void {
    this.showAlertMessage(`Modifier la liste: ${liste.nom}`);
  }

  consulterListe(liste: Liste): void {
    console.log('Consultation liste:', liste);
    this.listeSelectionneeAvis = liste;
    this.showModalAvisListe = true;
  }

  exporterListe(liste: Liste): void {
    if (!this.actionPermissions.publierListes) {
      this.notifyActionBlocked("Export des listes désactivé par l'administration.");
      return;
    }

    const rows: ExportRow[] = [liste].map((item) => ({
      ID: item.id.toString(),
      Nom: item.nom,
      Spécialité: item.specialite,
      Type: item.type === 'preselection' ? 'Présélection' : 'Sélection',
      Statut: item.statut === 'active' ? 'Active' : 'Archivée',
      Candidats: item.nb_candidats.toString(),
      Avis: item.avis || '-',
      Recommandation: item.recommandation || '-',
      'Date Création': item.date_creation,
    }));

    const suffixe = this.typeListe === 'preselection' ? 'preselection' : 'selection';
    this.exportRows(
      rows,
      this.listesExportFormat,
      `consultation-listes-${suffixe}`,
      `Consultation des listes (${suffixe})`,
    );
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
            this.showAlertMessage(`✅ Liste ${action}e avec succès`);
          },
          error: (error) => {
            console.error('Erreur:', error);
            this.showAlertMessage("❌ Erreur lors de l'archivage");
          },
        });
    }
  }

  // ========================================
  // OCR
  // ========================================
  ouvrirModalOCR(candidature?: Candidature): void {
    if (!this.canAnalyzeDossier()) {
      this.notifyActionBlocked("Analyse dossier désactivée par l'administration.");
      return;
    }

    this.selectedOCRCandidature = candidature || null;
    this.fichierOCR = null;
    this.showModalOCR = true;
  }

  fermerModalOCR(): void {
    this.showModalOCR = false;
    this.fichierOCR = null;
    this.selectedOCRCandidature = null;
  }

  onFileOCRSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.includes('pdf') && !file.type.includes('image')) {
        this.showAlertMessage('❌ Format non supporté. Utilisez PDF ou images');
        return;
      }
      this.fichierOCR = file;
    }
  }

  lancerAnalyseOCR(): void {
    if (!this.canAnalyzeDossier()) {
      this.notifyActionBlocked("Analyse dossier désactivée par l'administration.");
      return;
    }

    if (!this.fichierOCR) {
      this.showAlertMessage('❌ Veuillez sélectionner un fichier');
      return;
    }

    const token = this.authService.getAccessToken();
    const formData = new FormData();
    formData.append('fichier', this.fichierOCR);
    if (this.selectedOCRCandidature?.id) {
      formData.append('candidature_id', String(this.selectedOCRCandidature.id));
    }

    this.http
      .post('http://localhost:8003/api/ocr/analyser/', formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          this.showAlertMessage('✅ Analyse OCR lancée avec succès !');
          this.dossiersOCR.unshift({
            id: Date.now(),
            candidat_nom: this.selectedOCRCandidature?.candidat_nom || 'En cours...',
            fichier: this.fichierOCR!.name,
            statut_ocr: 'en_cours',
            date_upload: new Date().toISOString(),
            resultats: response,
          });
          this.fermerModalOCR();
        },
        error: (error) => {
          console.error('Erreur OCR:', error);
          this.showAlertMessage("❌ Erreur lors de l'analyse OCR");
        },
      });
  }

  voirResultatsOCR(dossier: DossierOCR): void {
    this.showAlertMessage(`Voir les résultats OCR pour ${dossier.candidat_nom}`);
  }

  // ========================================
  // RÉCLAMATIONS
  // ========================================
  getReclamationMaster(reclamation: Reclamation): string {
    return reclamation.master_nom || reclamation.master || reclamation.specialite || '-';
  }

  formatReclamationStatus(statut: string): string {
    if (statut === 'en_cours') {
      return 'En cours';
    }
    if (statut === 'en_attente') {
      return 'En attente';
    }
    if (statut === 'traitee') {
      return 'Traité';
    }
    return statut;
  }

  getReclamationStatusClass(statut: string): string {
    if (statut === 'en_cours') {
      return 'statut-en_cours';
    }
    if (statut === 'en_attente') {
      return 'statut-en_attente';
    }
    if (statut === 'traitee') {
      return 'statut-traitee';
    }
    return '';
  }

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
            this.showAlertMessage('✅ Réclamation traitée');
          },
          error: (error) => {
            console.error('Erreur:', error);
            this.showAlertMessage('❌ Erreur lors du traitement');
          },
        });
    }
  }

  // ========================================
  // MEMBRES
  // ========================================
  loadMembers(): void {
    // Charge les membres depuis l'API ou initialise avec les données mockées
    this.membresFiltres = [...this.membres];
  }

  filtrerMembres(): void {
    this.membresFiltres = this.membres.filter((membre) => {
      // Filtre par recherche (nom, email)
      if (this.rechercheMembres) {
        const recherche = this.rechercheMembres.toLowerCase();
        const matchNom = `${membre.prenom} ${membre.nom}`.toLowerCase().includes(recherche);
        const matchEmail = membre.email.toLowerCase().includes(recherche);
        const matchTelephone = membre.telephone.toLowerCase().includes(recherche);

        if (!matchNom && !matchEmail && !matchTelephone) {
          return false;
        }
      }

      // Filtre par rôle
      if (this.filtrRoleMembre && membre.role !== this.filtrRoleMembre) {
        return false;
      }

      // Filtre par statut
      if (this.filtreStatutMembre && membre.statut !== this.filtreStatutMembre) {
        return false;
      }

      return true;
    });
  }

  reinitialiserFiltresMembres(): void {
    this.rechercheMembres = '';
    this.filtrRoleMembre = '';
    this.filtreStatutMembre = '';
    this.membresFiltres = [...this.membres];
  }

  toggleStatutMembre(membre: CommissionMember): void {
    membre.statut = membre.statut === 'actif' ? 'inactif' : 'actif';
    this.toastService.show(`${membre.prenom} ${membre.nom} - Statut: ${membre.statut}`, 'success');
  }

  voirProfilMembre(membre: CommissionMember): void {
    this.showAlertMessage(
      `👤 Profil\n\n${membre.prenom} ${membre.nom}\nRôle: ${membre.role}\nEmail: ${membre.email}\nTéléphone: ${membre.telephone}`,
    );
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
          this.showAlertMessage('✅ Profil mis à jour avec succès !');
          this.currentUser = { ...this.currentUser, ...this.profileData };
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage('❌ Erreur lors de la mise à jour du profil');
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.new_password !== this.passwordForm.confirm_password) {
      this.showAlertMessage('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (this.passwordForm.new_password.length < 8) {
      this.showAlertMessage('❌ Le mot de passe doit contenir au moins 8 caractères');
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
          this.showAlertMessage('✅ Mot de passe modifié avec succès !');
          this.passwordForm = {
            current_password: '',
            new_password: '',
            confirm_password: '',
          };
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage('❌ Erreur lors du changement de mot de passe');
        },
      });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ========================================
  // EXPORT FUNCTIONALITY
  // ========================================
  exportListes(): void {
    if (this.listes.length === 0) {
      this.showAlertMessage('❌ Aucune liste à exporter');
      return;
    }

    const rows: ExportRow[] = this.listes.map((liste) => ({
      ID: liste.id.toString(),
      Nom: liste.nom,
      Spécialité: liste.specialite,
      Type: liste.type === 'preselection' ? 'Présélection' : 'Sélection',
      Statut: liste.statut === 'active' ? 'Active' : 'Inactive',
      Candidats: liste.nb_candidats.toString(),
      'Date Création': liste.date_creation,
    }));

    this.exportRows(rows, this.listesExportFormat, 'listes-admission', "Listes d'Admission");
  }

  exportListesByType(): void {
    const listes = this.getListesByType();
    if (listes.length === 0) {
      this.toastService.show('Aucune liste à exporter pour le type sélectionné.', 'warning');
      return;
    }

    const rows: ExportRow[] = listes.map((liste) => ({
      ID: liste.id.toString(),
      Nom: liste.nom,
      Spécialité: liste.specialite,
      Type: liste.type === 'preselection' ? 'Présélection' : 'Sélection',
      Statut: liste.statut === 'active' ? 'Active' : 'Archivée',
      Candidats: liste.nb_candidats.toString(),
      Avis: liste.avis || '-',
      Recommandation: liste.recommandation || '-',
      'Date Création': liste.date_creation,
    }));

    const suffixe = this.typeListe === 'preselection' ? 'preselection' : 'selection';
    this.exportRows(
      rows,
      this.listesExportFormat,
      `consultation-listes-${suffixe}`,
      `Consultation des listes (${suffixe})`,
    );
  }

  exportCandidaturesResponsable(): void {
    if (this.candidaturesResponsableFiltrees.length === 0) {
      this.toastService.show('Aucune candidature à exporter.', 'warning');
      return;
    }

    const rows: ExportRow[] = this.candidaturesResponsableFiltrees.map((cand) => ({
      ID: cand.id.toString(),
      Numéro: cand.numero,
      Candidat: cand.candidat_nom || cand.candidat_email,
      Email: cand.candidat_email,
      CIN: cand.candidat_cin || '-',
      Master: cand.master_nom || '-',
      Spécialité: cand.specialite,
      Score: cand.score,
      Statut: this.getStatusDisplayLabel(cand.statut),
      'Dossier déposé': cand.dossier_depose ? 'Oui' : 'Non',
      Type: cand.type_concours || 'master',
    }));

    this.exportRows(
      rows,
      this.candidaturesResponsableExportFormat,
      'candidatures-responsable',
      'Liste de candidature (Responsable)',
    );
  }

  exportCandidaturesMembre(): void {
    if (this.candidaturesFiltrees.length === 0) {
      this.toastService.show('Aucune candidature à exporter.', 'warning');
      return;
    }

    const rows: ExportRow[] = this.candidaturesFiltrees.map((cand) => ({
      ID: cand.id.toString(),
      Numéro: cand.numero,
      Candidat: cand.candidat_nom || cand.candidat_email,
      Email: cand.candidat_email,
      CIN: cand.candidat_cin || '-',
      Spécialité: cand.specialite,
      Score: cand.score,
      Statut: this.getStatusDisplayLabel(cand.statut),
      'Dossier déposé': cand.dossier_depose ? 'Oui' : 'Non',
      Type: cand.type_concours || 'master',
    }));

    this.exportRows(
      rows,
      this.candidaturesMembreExportFormat,
      'candidatures-master-membre',
      'Liste de candidature (Membre de commission)',
    );
  }

  exportDeliberations(): void {
    if (this.procesVerbaux.length === 0) {
      this.showAlertMessage('❌ Aucune délibération à exporter');
      return;
    }

    const rows: ExportRow[] = this.procesVerbaux.map((pv) => ({
      ID: pv.id.toString(),
      Titre: pv.titre,
      Master: pv.master_nom,
      'Date Réunion': pv.date_reunion,
      Participants: pv.nb_participants.toString(),
      Candidatures: pv.nb_candidatures.toString(),
      Admis: pv.nb_admis.toString(),
      Rejetés: pv.nb_rejetes.toString(),
      Statut:
        pv.statut === 'approuve' ? 'Approuvé' : pv.statut === 'en_cours' ? 'En Cours' : 'Archivé',
    }));

    this.exportRows(
      rows,
      this.deliberationsExportFormat,
      'deliberations-pv',
      'Procès-Verbaux de Délibération',
    );
  }

  onInscriptionsExcelSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.selectedInscriptionsFileName = file.name;
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      this.inscriptionsExcelRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      this.inscriptionsVerificationRows = [];
      this.toastService.show('Fichier Excel chargé.', 'success');
    };

    reader.onerror = () => {
      this.toastService.show("Erreur lors de la lecture du fichier d'inscriptions.", 'error');
    };

    reader.readAsArrayBuffer(file);
  }

  verifierInscriptionsExcel(): void {
    if (this.inscriptionsExcelRows.length === 0) {
      this.toastService.show('Importez un fichier Excel avant la vérification.', 'warning');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.toastService.show('Session expirée. Veuillez vous reconnecter.', 'error');
      return;
    }

    const masterId = this.selectedConfigMasterId || null;

    this.http
      .post<any>(
        'http://localhost:8003/api/candidatures/inscriptions/rapprochement/',
        {
          rows: this.inscriptionsExcelRows,
          source_filename: this.selectedInscriptionsFileName,
          master_id: masterId,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (response) => {
          this.inscriptionsVerificationRows = (response?.rows ||
            []) as InscriptionVerificationRow[];
          this.lastRapprochementAuditId = Number(response?.audit_id || 0) || null;
          const summary = response?.summary || {};
          this.toastService.show(
            `Rapprochement terminé: ${summary.valide || 0} valide(s), ${summary.incoherent || 0} incohérent(s), ${summary.absent || 0} absent(s).`,
            'success',
          );
        },
        error: (error) => {
          console.error('Erreur rapprochement inscriptions:', error);
          this.toastService.show('Erreur lors du rapprochement des inscriptions.', 'error');
        },
      });
  }

  exporterFichierFinalInscriptions(): void {
    const lignesValides = this.inscriptionsVerificationRows.filter(
      (row) => row.verification === 'valide',
    );
    if (lignesValides.length === 0) {
      this.toastService.show('Aucune ligne valide à exporter.', 'warning');
      return;
    }

    const rows: ExportRow[] = lignesValides.map((row) => ({
      'Numéro candidature': row.numero_candidature,
      CIN: row.cin,
      'Numéro inscription': row.numero_inscription,
      'Nom et prénom': row.nom_prenom,
      Master: row.master,
      Spécialité: row.specialite,
    }));

    this.exportRows(rows, 'xlsx', 'inscriptions-finales', 'Fichier Final Inscriptions');
  }

  exportInscriptions(): void {
    const inscriptions = this.candidatures.filter((c) => c.statut === 'inscrit');
    if (inscriptions.length === 0) {
      this.showAlertMessage('❌ Aucune inscription à exporter');
      return;
    }

    const rows: ExportRow[] = inscriptions.map((cand) => ({
      ID: cand.id.toString(),
      Dossier: cand.dossier_id || '-',
      Candidat: cand.candidat_nom || cand.candidat_email,
      Master: cand.master_nom,
      Spécialité: cand.specialite,
      Statut: 'Inscrit',
      'Date Inscription': cand.date_inscription || new Date().toLocaleDateString('fr-FR'),
    }));

    this.exportRows(
      rows,
      this.inscriptionsExportFormat,
      'inscriptions-payment',
      'Fichier de Paiement',
    );
  }

  exportRows(
    rows: ExportRow[],
    format: ExportFormat,
    baseFileName: string,
    tableTitle: string,
  ): void {
    if (format === 'csv') {
      this.exportRowsToCSV(rows, baseFileName);
    } else if (format === 'json') {
      this.exportRowsToJSON(rows, baseFileName);
    } else if (format === 'xlsx') {
      this.exportRowsToXLSX(rows, baseFileName, tableTitle);
    } else if (format === 'pdf') {
      this.exportRowsToPdf(rows, baseFileName, tableTitle);
    }
  }

  exportRowsToCSV(rows: ExportRow[], baseFileName: string): void {
    if (rows.length === 0) {
      this.showAlertMessage('❌ Aucune donnée à exporter');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => headers.map((h) => `"${row[h]}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, baseFileName, 'csv');
  }

  exportRowsToJSON(rows: ExportRow[], baseFileName: string): void {
    if (rows.length === 0) {
      this.showAlertMessage('❌ Aucune donnée à exporter');
      return;
    }

    const jsonContent = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadFile(blob, baseFileName, 'json');
  }

  exportRowsToXLSX(rows: ExportRow[], baseFileName: string, tableTitle: string): void {
    if (rows.length === 0) {
      this.showAlertMessage('❌ Aucune donnée à exporter');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, tableTitle.substring(0, 31));

    const fileName = this.buildExportFileName(baseFileName, 'xlsx');
    XLSX.writeFile(workbook, fileName);
  }

  exportRowsToPdf(rows: ExportRow[], baseFileName: string, tableTitle: string): void {
    if (rows.length === 0) {
      this.showAlertMessage('❌ Aucune donnée à exporter');
      return;
    }

    const doc = new jsPDF('l', 'mm', 'a4');
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title
    doc.setFontSize(14);
    doc.text(tableTitle, pageWidth / 2, 15, { align: 'center' });

    // Add date
    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, 22, {
      align: 'center',
    });

    // Add table
    const headers = Object.keys(rows[0]);
    const tableRows = rows.map((row) => headers.map((h) => row[h]));

    (doc as any).autoTable({
      head: [headers],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 15 } },
      didDrawPage: (data: any) => {
        // Footer
        const pageCount = (doc as any).internal.pages.length - 1;
        const currentPage = data.pageNumber;
        doc.setFontSize(8);
        doc.text(`Page ${currentPage} / ${pageCount}`, pageWidth - 20, pageHeight - 10);
      },
    });

    const fileName = this.buildExportFileName(baseFileName, 'pdf');
    doc.save(fileName);
  }

  downloadFile(blob: Blob, baseFileName: string, format: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = this.buildExportFileName(baseFileName, format);
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  buildExportFileName(baseName: string, format: string): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${baseName}_${timestamp}.${format}`;
  }
}
