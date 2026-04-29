import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ReclamationDetailDialogComponent } from './reclamation-detail-dialog.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { isPublicOffer } from '../../../shared/public-offer';
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
  historique_statut?: HistoriqueStatutItem[];
  historiqueStatut?: HistoriqueStatutItem[];
}

type WorkflowStageState = 'done' | 'current' | 'pending' | 'rejected';

interface WorkflowStage {
  label: string;
  state: WorkflowStageState;
  hint?: string;
}

interface HistoriqueStatutItem {
  statut?: string;
  etat?: string;
  state?: string;
  libelle?: string;
  label?: string;
  date?: string;
  created_at?: string;
  updated_at?: string;
  commentaire?: string;
  motif?: string;
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
  est_cache?: boolean;
  est_visible?: boolean;
  publie_par_responsable?: boolean;
  nombre_candidats_inscrits?: number;
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
  obligatoire?: boolean;
  fichier_url?: string;
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
  coefficients?: string;
  datesImportantes: string;
}

interface SummaryCard {
  title: string;
  value: number | string;
  subtitle: string;
  icon: string;
  tone: 'indigo' | 'blue' | 'green' | 'orange';
  progress: number;
}

interface DeadlineCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

interface QuickActionCard {
  key: 'modifier' | 'notifications';
  title: string;
  description: string;
  icon: string;
  badge?: number;
}

interface DashboardTimelineItem {
  title: string;
  subtitle: string;
  statusLabel: string;
  tone: 'success' | 'warning' | 'info';
  icon: string;
}

interface HistoriqueItem {
  id?: number;
  titre?: string;
  description?: string;
  date?: string;
  color?: string;
  annee_universitaire?: string;
  numero?: string;
  master_nom?: string;
  score?: number;
  classement?: string;
  statut_final?: string;
  date_soumission?: string;
  historique_statut?: HistoriqueStatutItem[];
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

type ProfileTab = 'personnel' | 'academique' | 'documents' | 'securite';

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
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    MatProgressBarModule,
    MatTabsModule,
    MatStepperModule,
    MatTooltipModule,
  ],
  templateUrl: './dashboard-candidat.html',
  styleUrls: ['./dashboard-candidat.css', './dashboard-candidat-wizard.css'],
})
export class DashboardCandidatComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  currentView: CandidatView = 'dashboard';
  currentDate: Date = new Date();
  private readonly deadlineDate = new Date('2026-03-12T23:59:59');
  candidatureTabIndex: number = 0;

  // ── Nouvelles propriétés ──
  dragOverDocId: number | null = null;
  uploadProgress: { [docId: string]: number } = {};
  uploadErrors: { [docId: string]: string } = {};
  apercuDoc: any = null;
  finalisationLoading = false;

  // Explore Section Properties
  rechercheOffre: string = '';
  rechercheDateOffre: string = '';
  displayedDetailColumns: string[] = [
    'etablissementOrigine',
    'capaciteAccueille',
    'typeDiplome',
    'coefficients',
    'datesImportantes',
  ];

  get userDisplayName(): string {
    return this.currentUser
      ? `${this.currentUser.first_name} ${this.currentUser.last_name}`
      : 'Candidat';
  }

  get profileCompletionPercent(): number {
    const checks = [
      !!(this.profileData?.first_name || this.currentUser?.first_name),
      !!(this.profileData?.last_name || this.currentUser?.last_name),
      !!(this.profileData?.email || this.currentUser?.email),
      !!(this.profileData?.phone || this.currentUser?.phone),
      !!(this.profileData?.address || this.currentUser?.address),
      !!(this.profileData?.etablissement_origine || this.currentUser?.etablissement_origine),
      !!(this.profileData?.diplome || this.currentUser?.diplome),
      this.documentsRequis.length > 0 && this.documentsDeposes / this.documentsRequis.length >= 0.5,
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }

  // ── Calculs complétude dossier ──
  get documentsTotaux(): number {
    return this.documentsRequis.filter((d) => d.obligatoire !== false).length;
  }

  get documentsValides(): number {
    return this.documentsRequis.filter((d) => d.obligatoire !== false && d.depose === true).length;
  }

  get completionPercent(): number {
    if (this.documentsTotaux === 0) return 0;
    return Math.round((this.documentsValides / this.documentsTotaux) * 100);
  }

  isSidebarOpen: boolean = false;
  activeProfileTab: ProfileTab = 'personnel';
  isProfileEditMode: boolean = false;

  showAlert: boolean = true;

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
  isDashboardLoading = true;
  isHistoriqueLoading = false;
  isWorkflowMockMode = false;
  isPreferenceFormDemoMode = false;
  showEditCandidatureModal: boolean = false;
  selectedCandidatureForEdit: Candidature | null = null;
  editChoixPriorite: number = 1;
  showSubmissionWizardModal: boolean = false;
  isOffresInscriptionFallback: boolean = false;
  // Allow clicking any step for quick preview/testing
  wizardAllowFreeNavigation: boolean = true;
  wizardCurrentStep: number = 1;
  wizardMaxAllowedStep: number = 1;
  readonly wizardTotalSteps: number = 3;
  readonly wizardStepsMeta: Array<{ label: string }> = [
    { label: 'Informations Personnelles' },
    { label: 'Diplôme et Formation' },
    { label: 'Validation et Synthèse' },
  ];
  wizardOffre: Offre | null = null;
  selectedOffreDetail: Offre | null = null;
  wizardTouched: {
    nom: boolean;
    prenom: boolean;
    cinPasseport: boolean;
    dateNaissance: boolean;
    email: boolean;
    telephone: boolean;
    etablissementOrigine: boolean;
    confirmationText: boolean;
  } = {
    nom: false,
    prenom: false,
    cinPasseport: false,
    dateNaissance: false,
    email: false,
    telephone: false,
    etablissementOrigine: false,
    confirmationText: false,
  };
  readonly wizardRequiredDocs: Array<{ label: string; icon: string; hint: string }> = [
    {
      label: 'Copie du CIN / Passeport',
      icon: 'fa-id-card',
      hint: 'PDF/JPG/PNG - max 5 Mo',
    },
    {
      label: 'Diplôme ou attestation',
      icon: 'fa-graduation-cap',
      hint: 'Document lisible et complet',
    },
    {
      label: 'Relevés de notes',
      icon: 'fa-table',
      hint: 'Toutes les années demandées',
    },
    {
      label: 'CV',
      icon: 'fa-file-alt',
      hint: 'Format PDF recommandé',
    },
  ];
  wizardUploadedFiles: Array<File | null> = [];
  wizardDragOverIndex: number | null = null;
  wizardSubmitting: boolean = false;
  wizardData: {
    nom: string;
    prenom: string;
    cinPasseport: string;
    dateNaissance: string;
    email: string;
    telephone: string;
    etablissementOrigine: string;
    specialiteBac: string;
    anneeBac: string;
    moyenneBacPrincipale: string;
    noteMathBac: string;
    noteFrancaisBac: string;
    noteAnglaisBac: string;
    certificationB2: 'non' | 'oui' | '';
    specialiteDiplome: string;
    anneeObtentionDiplome: string;
    natureDiplome: 'Licence' | 'Maitrise' | '';
    moyenne1Annee: string;
    session1Annee: 'Principale' | 'control' | '';
    moyenne2Annee: string;
    session2Annee: 'Principale' | 'control' | '';
    moyenne3Annee: string;
    session3Annee: 'Principale' | 'control' | '';
    natureCandidature: 'Étudiant ISIMM' | 'Étudiant Externe' | '';
    etablissementExterne: string;
    specialiteExterne: string;
    moyenne4Annee: string;
    session4Annee: 'Principale' | 'control' | '';
    nombreRedoublement: string;
    moyenneIng1: string;
    sessionReussiteIng1: 'Principale' | 'control' | '';
    nombreRedoublementIng1: string;
    confirmationDeclaration: boolean;
    confirmationText: string;
  } = {
    nom: '',
    prenom: '',
    cinPasseport: '',
    dateNaissance: '',
    email: '',
    telephone: '',
    etablissementOrigine: 'ISIMM',
    specialiteBac: '',
    anneeBac: '',
    moyenneBacPrincipale: '',
    noteMathBac: '',
    noteFrancaisBac: '',
    noteAnglaisBac: '',
    certificationB2: '',
    specialiteDiplome: '',
    anneeObtentionDiplome: '',
    natureDiplome: '',
    moyenne1Annee: '',
    session1Annee: '',
    moyenne2Annee: '',
    session2Annee: '',
    moyenne3Annee: '',
    session3Annee: '',
    natureCandidature: '',
    etablissementExterne: '',
    specialiteExterne: '',
    moyenne4Annee: '',
    session4Annee: '',
    nombreRedoublement: '',
    moyenneIng1: '',
    sessionReussiteIng1: '',
    nombreRedoublementIng1: '',
    confirmationDeclaration: false,
    confirmationText: '',
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
  notificationsErreur: string = '';
  filtreNotificationType: '' | 'info' | 'success' | 'warning' | 'danger' = '';
  filtreNotificationTriRapide: 'recent' | 'critique' = 'recent';
  filtreNotificationDateDebut: string = '';
  filtreNotificationDateFin: string = '';
  filtreNotificationRecherche: string = '';

  documentsRequis: Document[] = [
    {
      id: 1,
      nom: 'Formulaire de candidature au Mastère en Informatique (joint à cet avis)',
      icon: 'fa-file-signature',
      depose: true,
      date_depot: '2026-02-10',
      obligatoire: true,
    },
    {
      id: 2,
      nom: 'Fiche de candidature imprimée depuis le site web et dûment signée',
      icon: 'fa-clipboard-check',
      depose: true,
      date_depot: '2026-02-10',
      obligatoire: true,
    },
    {
      id: 3,
      nom: "Curriculum Vitae (CV) d'une page avec adresse postale, téléphone et e-mail",
      icon: 'fa-user-tie',
      depose: true,
      date_depot: '2026-02-12',
      obligatoire: true,
    },
    {
      id: 4,
      nom: 'Copie certifiée conforme de tous les diplômes obtenus, y compris le Baccalauréat',
      icon: 'fa-graduation-cap',
      depose: false,
      obligatoire: true,
    },
    {
      id: 5,
      nom: 'Copie certifiée conforme des relevés de notes de toutes les années et du Baccalauréat',
      icon: 'fa-file-alt',
      depose: false,
      obligatoire: true,
    },
    {
      id: 6,
      nom: "Document justifiant un report d'inscription ou une réorientation (si applicable)",
      icon: 'fa-file-medical',
      depose: false,
      obligatoire: false,
    },
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

  // Historique UI helpers
  historiqueFilterYear: string = '';
  historiqueFilterResult: '' | 'success' | 'waiting' | 'rejected' | '' = '';

  get filteredHistorique(): HistoriqueItem[] {
    return (this.historique || []).filter((item) => {
      if (
        this.historiqueFilterYear &&
        String(item.annee_universitaire || '') !== this.historiqueFilterYear
      ) {
        return false;
      }
      if (this.historiqueFilterResult) {
        const normalized = (item.statut_final || '').toLowerCase();
        if (
          this.historiqueFilterResult === 'success' &&
          !['selectionne', 'inscrit', 'valide'].includes(normalized)
        )
          return false;
        if (
          this.historiqueFilterResult === 'waiting' &&
          ['en_attente', 'sous_examen', 'soumis', 'preselectionne'].indexOf(normalized) === -1
        )
          return false;
        if (
          this.historiqueFilterResult === 'rejected' &&
          ['rejete', 'non_admis', 'non_preselectionne'].indexOf(normalized) === -1
        )
          return false;
      }
      return true;
    });
  }

  get historiqueTotalCount(): number {
    return (this.historique || []).length;
  }

  get historiqueYears(): string[] {
    return Array.from(
      new Set(
        (this.historique || [])
          .map((item) => String(item.annee_universitaire || '').trim())
          .filter((annee) => annee.length > 0),
      ),
    ).sort((left, right) => right.localeCompare(left));
  }

  get historiqueBestScore(): number | null {
    const scores = (this.historique || [])
      .map((h) => Number(h.score || 0))
      .filter((s) => !Number.isNaN(s));
    if (!scores.length) return null;
    return Math.max(...scores);
  }

  get historiqueAdmissionsCount(): number {
    return (this.historique || []).filter((h) =>
      ['selectionne', 'inscrit', 'valide'].includes(
        ((h.statut_final || '') as string).toLowerCase(),
      ),
    ).length;
  }

  downloadHistoriquePdf(item: HistoriqueItem): void {
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const title = `Dossier - ${item.numero || ''}`;
      doc.setFontSize(14);
      doc.text(title, 40, 60);
      const rows = [
        ['Année', item.annee_universitaire || '-'],
        ['N° Candidature', item.numero || '-'],
        ['Master', item.master_nom || '-'],
        ['Score', String(item.score ?? '-')],
        ['Classement', String(item.classement ?? '-')],
        ['Résultat', this.getStatutLabel(item.statut_final || '')],
      ];
      // simple table
      // @ts-ignore
      autoTable(doc, {
        startY: 90,
        head: [['Champ', 'Valeur']],
        body: rows,
        styles: { fontSize: 11 },
      });
      doc.save(`${item.numero || 'historique'}.pdf`);
    } catch (e) {
      console.error('Erreur génération PDF historique:', e);
      this.toastService.show('Impossible de générer le PDF.', 'error');
    }
  }

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
  readonly quickActionCards: QuickActionCard[] = [
    {
      key: 'modifier',
      title: 'Modifier Candidature',
      description: 'Mettre à jour vos informations et continuer le stepper de soumission.',
      icon: 'edit',
    },
    {
      key: 'notifications',
      title: 'Mes Notifications',
      description: 'Consulter vos alertes et messages non lus en un clic.',
      icon: 'notifications',
    },
  ];
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
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };
    this.initializeDossierPreferenceForm();

    const requestedView = this.route.snapshot.queryParamMap.get('view') as CandidatView | null;
    const workflowMockMode = this.route.snapshot.queryParamMap.get('workflowMock') === '1';
    const requestedWizardStep = Number(this.route.snapshot.queryParamMap.get('wizardStep') || '0');
    if (requestedView && this.canAccessView(requestedView)) {
      this.currentView = requestedView;
    }
    if (requestedWizardStep >= 1) {
      this.openWizardFromUrl(requestedWizardStep);
    }

    this.queryParamsSub = this.route.queryParamMap.subscribe((params) => {
      const isMock = params.get('workflowMock') === '1';
      const isPreferenceFormDemo = params.get('preferenceFormDemo') === '1';
      const viewParam = params.get('view') as CandidatView | null;
      const wizardStepParam = Number(params.get('wizardStep') || '0');

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

      if (wizardStepParam >= 1) {
        this.openWizardFromUrl(wizardStepParam);
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
    if (this.currentView === 'historique') {
      this.chargerHistorique();
    }
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

  switchView(view: CandidatView, options?: { preserveDossierSelection?: boolean }): void {
    if (!this.canAccessView(view)) {
      this.notifyActionBlocked("Cette section n'est pas active pour votre rôle.");
      return;
    }
    this.closeActionMenu();
    if (view === 'mon-dossier' && !options?.preserveDossierSelection) {
      this.resetSelectionDossier();
    }
    this.currentView = view;
    if (view === 'historique') {
      this.chargerHistorique();
    }
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  closeSidebar(): void {
    this.isSidebarOpen = false;
  }

  validateMenuSection(view: CandidatView, event: Event): void {
    event.stopPropagation();

    if (!this.canAccessView(view)) {
      this.notifyActionBlocked("Cette section n'est pas active pour votre rôle.");
      return;
    }

    switch (view) {
      case 'profil':
        this.switchView('profil');
        this.updateProfile();
        break;

      case 'offres-inscription':
        this.switchView('offres-inscription');
        this.toastService.show(
          'Validation preinscription: cliquez sur Postuler puis Soumettre candidature.',
          'info',
        );
        break;

      case 'mon-dossier':
        this.switchView('mon-dossier');
        if (!this.selectedDossierNumber) {
          this.toastService.show(
            'Selectionnez un dossier puis validez via la section Importer un fichier.',
            'warning',
          );
          return;
        }

        this.switchView('importer');
        if (this.shouldShowPreferenceForm()) {
          this.submitDossierPreferenceForm();
        } else if (this.selectedDocumentsCount > 0) {
          this.uploadAllSelectedDocuments();
        } else {
          this.toastService.show(
            'Aucun document selectionne. Ajoutez un document avant validation.',
            'warning',
          );
        }
        break;

      case 'inscription':
        this.switchView('inscription');
        this.toastService.show(
          'Validation inscription: deposez le justificatif de paiement pour chaque candidature.',
          'info',
        );
        break;

      default:
        this.switchView(view);
        this.toastService.show('Validation non requise dans cette section.', 'info');
        break;
    }
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

  get dashboardSummaryCards(): SummaryCard[] {
    const total = Math.max(this.mesCandidatures.length, 1);
    return [
      {
        title: 'Candidatures déposées',
        value: this.mesCandidatures.length,
        subtitle: 'Total de vos candidatures soumises',
        icon: 'fa-file-alt',
        tone: 'indigo',
        progress: 100,
      },
      {
        title: 'Sous examen',
        value: this.countByStatut('sous_examen'),
        subtitle: "Dossiers en cours d'évaluation",
        icon: 'fa-hourglass-half',
        tone: 'blue',
        progress: Math.min(100, Math.round((this.countByStatut('sous_examen') / total) * 100)),
      },
      {
        title: 'Présélectionnées',
        value: this.countByStatut('preselectionne') + this.countByStatut('selectionne'),
        subtitle: 'Candidatures à statut favorable',
        icon: 'fa-check-circle',
        tone: 'green',
        progress: Math.min(
          100,
          Math.round(
            ((this.countByStatut('preselectionne') + this.countByStatut('selectionne')) / total) *
              100,
          ),
        ),
      },
      {
        title: 'Rejetées',
        value: this.countByStatut('rejete'),
        subtitle: 'Candidatures non retenues',
        icon: 'fa-times-circle',
        tone: 'orange',
        progress: Math.min(100, Math.round((this.countByStatut('rejete') / total) * 100)),
      },
    ];
  }

  get deadlineCountdown(): DeadlineCountdown {
    const diff = this.deadlineDate.getTime() - this.countdownNow;
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, expired: false };
  }

  get dashboardTimeline(): DashboardTimelineItem[] {
    return [...this.mesCandidatures]
      .sort(
        (a, b) =>
          new Date(b.date_soumission || '').getTime() - new Date(a.date_soumission || '').getTime(),
      )
      .slice(0, 4)
      .map((candidature) => ({
        title: candidature.master_nom || 'Candidature',
        subtitle: candidature.date_soumission
          ? `Soumise le ${new Date(candidature.date_soumission).toLocaleDateString('fr-FR')}`
          : 'Soumise récemment',
        statusLabel: this.getStatutLabel(candidature.statut),
        tone: this.getTimelineTone(candidature.statut),
        icon: this.getStatutFaIcon(candidature.statut),
      }));
  }

  private getTimelineTone(statut?: string): 'success' | 'warning' | 'info' {
    const value = (statut || '').toLowerCase();
    if (['selectionne', 'inscrit', 'valide', 'traitee'].includes(value)) {
      return 'success';
    }
    if (['rejete', 'non_admis', 'non_preselectionne'].includes(value)) {
      return 'warning';
    }
    return 'info';
  }

  openQuickAction(actionKey: QuickActionCard['key']): void {
    if (actionKey === 'notifications') {
      this.switchView('notifications');
      return;
    }

    const offer =
      this.getOffresFiltrees().find((item) => item.statut === 'ouvert') ||
      this.offresInscription[0];
    if (!offer) {
      this.toastService.show('Aucune offre disponible pour ouvrir le stepper.', 'warning');
      return;
    }

    this.startSubmissionWizard(offer);
  }

  countByStatut(statut: string): number {
    return this.mesCandidatures.filter((c) => c.statut === statut).length;
  }

  getStatusChipClass(statut?: string): string {
    const value = (statut || 'en_attente').toLowerCase();

    if (['selectionne', 'inscrit', 'valide', 'traitee'].includes(value)) {
      return 'status-chip--success';
    }

    if (['rejete', 'non_admis', 'non_preselectionne', 'dossier_non_depose'].includes(value)) {
      return 'status-chip--danger';
    }

    if (
      ['sous_examen', 'soumis', 'preselectionne', 'dossier_depose', 'paiement_soumis'].includes(
        value,
      )
    ) {
      return 'status-chip--info';
    }

    return 'status-chip--warning';
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

  getStatutIcon(statut?: string): string {
    const icons: Record<string, string> = {
      selectionne: 'check_circle',
      en_attente: 'schedule',
      soumis: 'send',
      rejete: 'cancel',
      preselectionne: 'verified',
      sous_examen: 'manage_search',
      dossier_depose: 'folder_open',
      inscrit: 'person_check',
      paiement_soumis: 'payments',
      valide: 'task_alt',
      traitee: 'done_all',
      confirme: 'done',
      propose: 'thumb_up',
    };

    return icons[statut || ''] || 'info';
  }

  getStatutFaIcon(statut?: string): string {
    const icons: Record<string, string> = {
      selectionne: 'fa-circle-check',
      en_attente: 'fa-clock',
      soumis: 'fa-paper-plane',
      rejete: 'fa-circle-xmark',
      preselectionne: 'fa-badge-check',
      sous_examen: 'fa-magnifying-glass',
      dossier_depose: 'fa-folder-open',
      inscrit: 'fa-user-check',
      paiement_soumis: 'fa-money-check-dollar',
      valide: 'fa-square-check',
      traitee: 'fa-check-double',
      confirme: 'fa-check',
      propose: 'fa-thumbs-up',
    };

    return icons[statut || ''] || 'fa-circle-info';
  }

  getOffresFiltrees(): Offre[] {
    const q = this.rechercheOffre.toLowerCase().trim();
    const dateFilter = (this.rechercheDateOffre || '').trim();

    return this.offresInscription.filter((o) => {
      const matchesText =
        !q ||
        o.titre.toLowerCase().includes(q) ||
        (o.description && o.description.toLowerCase().includes(q)) ||
        (o.specialite && o.specialite.toLowerCase().includes(q));

      const matchesDate = !dateFilter || String(o.date_limite || '') === dateFilter;

      return matchesText && matchesDate;
    });
  }

  reinitialiserRechercheOffres(): void {
    this.rechercheOffre = '';
    this.rechercheDateOffre = '';
  }

  private getOffresFiltreesParType(type: Offre['type'], sousType?: string): Offre[] {
    return this.getOffresFiltrees().filter(
      (o) => o.type === type && (!sousType || o.sous_type === sousType),
    );
  }

  voirRecapitulatif(candidature: Candidature): void {
    this.closeActionMenu();
    this.selectedCandidatureForEdit = candidature;
    this.toastService.show(
      `Affichage du récapitulatif pour la candidature ${candidature.numero}`,
      'info',
    );
  }

  suivreCandidature(candidature: Candidature): void {
    this.closeActionMenu();
    this.selectedDossierNumber = this.getDossierNumber(candidature);
    this.switchView('suivi');
    this.toastService.show(`Ouverture du suivi pour la candidature ${candidature.numero}`, 'info');
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
            historique_statut: Array.isArray(item.historique_statut)
              ? item.historique_statut
              : Array.isArray(item.historiqueStatut)
                ? item.historiqueStatut
                : [],
          }));
          this.isDashboardLoading = false;
          this.loadNotifications();
        },
        error: (error) => {
          console.error('Erreur chargement candidatures:', error);
          this.isDashboardLoading = false;
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
          const mappedOffres = (data || [])
            .filter((offre: any) => isPublicOffer(offre) && offre.statut === 'ouvert')
            .map((offre: any) => ({
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
              est_cache: !!offre.est_cache,
              est_visible: offre.est_visible,
              publie_par_responsable: offre.publie_par_responsable,
              nombre_candidats_inscrits: Number(offre.nombre_candidats_inscrits || 0),
            }));
          this.isOffresInscriptionFallback = mappedOffres.length === 0;
          this.offresInscription = mappedOffres.length
            ? mappedOffres
            : this.getFallbackOffresInscription();
          this.loadNotifications();
        },
        error: (error) => {
          console.error('Erreur chargement offres:', error);
          this.isOffresInscriptionFallback = true;
          this.toastService.show(
            'Impossible de charger les offres de préinscription (service indisponible).',
            'error',
          );
          if (!this.offresInscription.length) {
            this.offresInscription = this.getFallbackOffresInscription();
          }
        },
      });
  }

  private getFallbackOffresInscription(): Offre[] {
    return [
      {
        id: 101,
        titre: 'Master Recherche Génie Logiciel',
        type: 'master',
        sous_type: 'recherche',
        description: 'Offre temporaire affichée quand le service candidature est indisponible.',
        date_limite: '2026-07-22',
        places: 30,
        statut: 'ouvert',
      },
      {
        id: 102,
        titre: 'Master Professionnel Sciences de Données',
        type: 'master',
        sous_type: 'professionnel',
        description: 'Carte de secours pour continuer la navigation côté candidat.',
        date_limite: '2026-07-22',
        places: 35,
        statut: 'ouvert',
      },
      {
        id: 103,
        titre: 'Cycle d' + "'" + 'Ingénieur Informatique',
        type: 'cycle_ingenieur',
        specialite: 'Informatique, Génie logiciel',
        description: 'Carte de secours si les offres réelles ne sont pas récupérables.',
        date_limite: '2026-07-22',
        places: 50,
        statut: 'ouvert',
      },
    ];
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
      this.notificationsErreur = 'Session expirée. Veuillez vous reconnecter.';
      return;
    }

    this.http
      .get<NotificationItem[]>('http://localhost:8003/api/candidatures/mes-notifications/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data) => {
          this.notificationsErreur = '';
          this.notificationsCandidat = data || [];
          this.notificationsNonLues = this.notificationsCandidat.filter((item) => !item.lue).length;
        },
        error: (error) => {
          console.error('Erreur chargement notifications:', error);
          this.notificationsErreur =
            error?.status === 401
              ? 'Authentification invalide entre services. Reconnectez-vous après redémarrage.'
              : 'Impossible de charger les notifications pour le moment.';
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
    const search = this.filtreNotificationRecherche.trim().toLowerCase();
    const severity = (notification: NotificationItem): number => {
      if (notification.type === 'danger') {
        return 3;
      }
      if (notification.type === 'warning') {
        return 2;
      }
      if (notification.type === 'info') {
        return 1;
      }
      return 0;
    };

    const filtered = this.notificationsCandidat.filter((notification) => {
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

      if (search) {
        const content = `${notification.titre} ${notification.message}`.toLowerCase();
        if (!content.includes(search)) {
          return false;
        }
      }

      return true;
    });

    if (this.filtreNotificationTriRapide === 'critique') {
      return [...filtered].sort((a, b) => {
        const bySeverity = severity(b) - severity(a);
        if (bySeverity !== 0) {
          return bySeverity;
        }

        if (a.lue !== b.lue) {
          return Number(a.lue) - Number(b.lue);
        }

        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
    }

    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  reinitialiserFiltresNotifications(): void {
    this.filtreNotificationType = '';
    this.filtreNotificationTriRapide = 'recent';
    this.filtreNotificationDateDebut = '';
    this.filtreNotificationDateFin = '';
    this.filtreNotificationRecherche = '';
  }

  get notificationsTotalCount(): number {
    return this.notificationsCandidat.length;
  }

  get notificationsTodayCount(): number {
    const today = new Date();
    return this.notificationsCandidat.filter((notification) => {
      const date = new Date(notification.date);
      return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      );
    }).length;
  }

  get notificationsCriticalCount(): number {
    return this.notificationsCandidat.filter(
      (notification) => notification.type === 'warning' || notification.type === 'danger',
    ).length;
  }

  get notificationsFilteredUnreadCount(): number {
    return this.getNotificationsFiltrees().filter((notification) => !notification.lue).length;
  }

  getNotificationTypeLabel(type: NotificationItem['type']): string {
    if (type === 'success') {
      return 'Succes';
    }
    if (type === 'warning') {
      return 'Avertissement';
    }
    if (type === 'danger') {
      return 'Critique';
    }
    return 'Information';
  }

  chargerHistorique(): void {
    const token = this.authService.getAccessToken();

    const params: any = {};
    if (this.filtreAnnee) {
      params.annee = this.filtreAnnee;
    }

    this.isHistoriqueLoading = true;

    this.http
      .get('http://localhost:8003/api/candidatures/historique/', {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      })
      .subscribe({
        next: (data: any) => {
          this.historique = Array.isArray(data) ? data : [];
          this.isHistoriqueLoading = false;
        },
        error: (error) => {
          console.error('Erreur chargement historique:', error);
          this.isHistoriqueLoading = false;
        },
      });
  }

  getTimelineFromHistorique(candidature: Candidature): WorkflowStage[] {
    const history = candidature.historique_statut || candidature.historiqueStatut || [];
    if (!Array.isArray(history) || history.length === 0) {
      return this.workflowTimeline(candidature);
    }

    const sortedHistory = [...history].sort((a, b) => {
      const rawA = String(a?.date || a?.updated_at || a?.created_at || '');
      const rawB = String(b?.date || b?.updated_at || b?.created_at || '');
      const dateA = new Date(rawA).getTime();
      const dateB = new Date(rawB).getTime();

      if (Number.isNaN(dateA) && Number.isNaN(dateB)) {
        return 0;
      }
      if (Number.isNaN(dateA)) {
        return 1;
      }
      if (Number.isNaN(dateB)) {
        return -1;
      }

      return dateA - dateB;
    });

    const timeline = sortedHistory.map((step) => {
      const rawStatus = String(step?.statut || step?.etat || step?.state || '').trim();
      const label =
        String(step?.libelle || step?.label || '').trim() ||
        this.formatHistoriqueStatusLabel(rawStatus);
      const hint =
        String(step?.commentaire || step?.motif || '').trim() ||
        String(step?.date || step?.updated_at || step?.created_at || '').trim();

      return {
        label,
        state: this.mapHistoriqueStatusState(rawStatus),
        hint: hint || undefined,
      };
    });

    return timeline.filter((step, index) => {
      if (index === 0) {
        return true;
      }

      const previousStep = timeline[index - 1];
      return !(previousStep.label === step.label && previousStep.state === step.state);
    });
  }

  getCurrentTimelineStatusLabel(candidature: Candidature): string {
    const timeline = this.getTimelineFromHistorique(candidature);
    for (let index = timeline.length - 1; index >= 0; index -= 1) {
      if (timeline[index].state === 'rejected') {
        return timeline[index].label;
      }
    }

    for (let index = timeline.length - 1; index >= 0; index -= 1) {
      if (timeline[index].state === 'current') {
        return timeline[index].label;
      }
    }

    for (let index = timeline.length - 1; index >= 0; index -= 1) {
      if (timeline[index].state === 'done') {
        return timeline[index].label;
      }
    }

    return 'En attente';
  }

  getTimelineActiveIndex(candidature: Candidature): number {
    const timeline = this.getTimelineFromHistorique(candidature);
    if (!timeline.length) {
      return 0;
    }

    const rejectedIndex = timeline.findIndex((step) => step.state === 'rejected');
    if (rejectedIndex >= 0) {
      return rejectedIndex;
    }

    const currentIndex = timeline.findIndex((step) => step.state === 'current');
    if (currentIndex >= 0) {
      return currentIndex;
    }

    const doneIndexes = timeline
      .map((step, index) => ({ step, index }))
      .filter((entry) => entry.step.state === 'done')
      .map((entry) => entry.index);

    return doneIndexes.length ? doneIndexes[doneIndexes.length - 1] : 0;
  }

  private mapHistoriqueStatusState(status: string): WorkflowStageState {
    const normalized = (status || '').toLowerCase();

    if (
      [
        'rejete',
        'rejetee',
        'non_admis',
        'non_admise',
        'non_preselectionne',
        'dossier_non_depose',
        'echec',
      ].includes(normalized)
    ) {
      return 'rejected';
    }

    if (
      ['selectionne', 'inscrit', 'dossier_depose', 'preselectionne', 'valide', 'soumis'].includes(
        normalized,
      )
    ) {
      return 'done';
    }

    if (['en_attente', 'sous_examen', 'en_cours', 'pending'].includes(normalized)) {
      return 'current';
    }

    return 'pending';
  }

  private formatHistoriqueStatusLabel(status: string): string {
    const raw = (status || '').trim();
    if (!raw) {
      return 'Mise a jour du dossier';
    }

    return this.getStatutLabel(raw).replaceAll('_', ' ');
  }

  mastersRecherche(): Offre[] {
    return this.getOffresFiltreesParType('master', 'recherche');
  }

  mastersProfessionnels(): Offre[] {
    return this.getOffresFiltreesParType('master', 'professionnel');
  }

  cyclesIngenieur(): Offre[] {
    return this.getOffresFiltreesParType('cycle_ingenieur');
  }

  dejaCandidature(masterId: number): boolean {
    const offre = this.offresInscription.find((o) => o.id === masterId);
    if (!offre) return false;
    return this.mesCandidatures.some((c) => c.master_id === offre.id);
  }

  postuler(offre: Offre, payload: Record<string, unknown> = {}): void {
    if (!this.actionPermissions.preinscription) {
      this.notifyActionBlocked("Action préinscription désactivée par l'administration.");
      return;
    }

    if (this.dejaCandidature(offre.id)) {
      this.toastService.show('Vous avez déjà postulé à cette offre.', 'warning');
      return;
    }

    if (offre.statut === 'ferme') {
      this.toastService.show('Cette offre est fermée.', 'warning');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        'http://localhost:8003/api/candidatures/create/',
        {
          master_id: offre.id,
          ...payload,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (response: any) => {
          this.toastService.show('Candidature soumise avec succès.', 'success');
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
          this.toastService.show('Erreur lors de la soumission de la candidature.', 'error');
        },
      });
  }

  postulerOffre(offre: Offre): void {
    this.startSubmissionWizard(offre);
  }

  startSubmissionWizard(offre: Offre): void {
    if (!this.actionPermissions.preinscription) {
      this.notifyActionBlocked("Action préinscription désactivée par l'administration.");
      return;
    }

    if (this.dejaCandidature(offre.id)) {
      this.toastService.show('Vous avez déjà postulé à cette offre.', 'warning');
      return;
    }

    if (offre.statut === 'ferme') {
      this.toastService.show('Cette offre est fermée.', 'warning');
      return;
    }

    this.wizardOffre = offre;
    this.wizardCurrentStep = 1;
    this.wizardMaxAllowedStep = 1;
    this.wizardTouched = {
      nom: false,
      prenom: false,
      cinPasseport: false,
      dateNaissance: false,
      email: false,
      telephone: false,
      etablissementOrigine: false,
      confirmationText: false,
    };
    this.wizardUploadedFiles = Array.from({ length: this.wizardRequiredDocs.length }, () => null);
    this.wizardDragOverIndex = null;
    const firstName = this.profileData?.first_name || this.currentUser?.first_name || '';
    const lastName = this.profileData?.last_name || this.currentUser?.last_name || '';
    const phone = this.profileData?.phone || this.currentUser?.phone || '';
    const email = this.profileData?.email || this.currentUser?.email || '';

    this.wizardData = {
      nom: lastName,
      prenom: firstName,
      cinPasseport: '',
      dateNaissance: '',
      email,
      telephone: phone,
      etablissementOrigine: this.profileData?.etablissement_origine || 'ISIMM',
      specialiteBac: '',
      anneeBac: '',
      moyenneBacPrincipale: '',
      noteMathBac: '',
      noteFrancaisBac: '',
      noteAnglaisBac: '',
      certificationB2: '',
      specialiteDiplome: '',
      anneeObtentionDiplome: '',
      natureDiplome: '',
      moyenne1Annee: '',
      session1Annee: '',
      moyenne2Annee: '',
      session2Annee: '',
      moyenne3Annee: '',
      session3Annee: '',
      natureCandidature: '',
      etablissementExterne: '',
      specialiteExterne: '',
      moyenne4Annee: '',
      session4Annee: '',
      nombreRedoublement: '',
      moyenneIng1: '',
      sessionReussiteIng1: '',
      nombreRedoublementIng1: '',
      confirmationDeclaration: false,
      confirmationText: '',
    };
    this.showSubmissionWizardModal = true;
  }

  closeSubmissionWizard(): void {
    this.showSubmissionWizardModal = false;
    this.wizardOffre = null;
    this.wizardSubmitting = false;
  }

  private openWizardFromUrl(step: number): void {
    const boundedStep = Math.min(this.wizardTotalSteps, Math.max(1, step));
    const defaultOffer =
      this.getOffresFiltrees().find((item) => item.statut === 'ouvert') ||
      this.offresInscription[0];

    if (!defaultOffer) {
      this.toastService.show('Aucune offre disponible pour ouvrir le parcours.', 'warning');
      return;
    }

    this.startSubmissionWizard(defaultOffer);
    this.wizardCurrentStep = boundedStep;
    this.wizardMaxAllowedStep = Math.max(this.wizardMaxAllowedStep, boundedStep);
  }

  canGoToWizardStep(step: number): boolean {
    if (this.wizardAllowFreeNavigation) return true;
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
      this.toastService.show('Veuillez compléter les champs requis avant de continuer.', 'warning');
      return;
    }

    if (this.wizardCurrentStep < this.wizardTotalSteps) {
      this.wizardCurrentStep += 1;
      this.wizardMaxAllowedStep = Math.max(this.wizardMaxAllowedStep, this.wizardCurrentStep);
    }
  }

  private parseWizardNumeric(value: string): number | null {
    const parsed = Number(
      String(value ?? '')
        .replace(',', '.')
        .trim(),
    );
    return Number.isFinite(parsed) ? parsed : null;
  }

  private isScoreRangeValid(value: string): boolean {
    const parsed = this.parseWizardNumeric(value);
    return parsed !== null && parsed >= 0 && parsed <= 20;
  }

  isWizardScoreInvalid(value: string): boolean {
    return !!String(value || '').trim() && !this.isScoreRangeValid(value);
  }

  isValidEmail(value: string): boolean {
    const email = String(value || '').trim();
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private areWizardScoresInRange(values: string[]): boolean {
    return values.every((value) => this.isScoreRangeValid(value));
  }

  getWizardComputedScore(): number {
    const moyennes: number[] = [
      this.parseWizardNumeric(this.wizardData.moyenneBacPrincipale) ?? 0,
      this.parseWizardNumeric(this.wizardData.moyenne1Annee) ?? 0,
      this.parseWizardNumeric(this.wizardData.moyenne2Annee) ?? 0,
      this.parseWizardNumeric(this.wizardData.moyenne3Annee) ?? 0,
    ];

    const hasFourthYear = this.parseWizardNumeric(this.wizardData.moyenne4Annee);
    if (hasFourthYear !== null) {
      moyennes.push(hasFourthYear);
    }

    const hasIng1 = this.parseWizardNumeric(this.wizardData.moyenneIng1);
    if (hasIng1 !== null) {
      moyennes.push(hasIng1);
    }

    const sum = moyennes.reduce((acc, value) => acc + value, 0);
    const count = Math.max(moyennes.length, 1);
    return Number((sum / count).toFixed(2));
  }

  getWizardComputedScoreDisplay(): string {
    return `${this.getWizardComputedScore().toFixed(2)} / 20`;
  }

  isWizardMrglOffer(): boolean {
    return this.wizardOffre?.titre === 'Mastère Recherche en Génie logiciel(MRGL)';
  }

  isWizardMrmiOffer(): boolean {
    return this.wizardOffre?.titre === 'Mastère Recherche en micro-électronique et instrumentation';
  }

  isWizardIngenieurOffer(): boolean {
    return this.wizardOffre?.type === 'cycle_ingenieur';
  }

  isWizardMrmiIng1EquivalentSelected(): boolean {
    return (
      this.isWizardMrmiOffer() &&
      this.wizardData.specialiteDiplome ===
        'Reussite en 1ere annee du cycle ingenieur (Electronique/Instrumentation) ou equivalent'
    );
  }

  shouldShowWizardMrglFourthYearFields(): boolean {
    return this.isWizardMrglOffer() && this.wizardData.natureDiplome === 'Maitrise';
  }

  isWizardStepValid(step: number): boolean {
    if (step === 1) {
      const baseRequired = [
        this.wizardData.nom,
        this.wizardData.prenom,
        this.wizardData.cinPasseport,
        this.wizardData.dateNaissance,
        this.wizardData.email,
        this.wizardData.telephone,
        this.wizardData.etablissementOrigine,
      ].every((value) => !!String(value || '').trim());

      return baseRequired && this.isValidEmail(this.wizardData.email);
    }

    if (step === 2) {
      const baseBacFieldsValid = [
        this.wizardData.specialiteBac,
        this.wizardData.anneeBac,
        this.wizardData.moyenneBacPrincipale,
      ].every((value) => !!String(value || '').trim());

      if (!baseBacFieldsValid || !this.isScoreRangeValid(this.wizardData.moyenneBacPrincipale)) {
        return false;
      }

      const licenceFields = [
        this.wizardData.specialiteDiplome,
        this.wizardData.anneeObtentionDiplome,
        this.wizardData.natureDiplome,
        this.wizardData.moyenne1Annee,
        this.wizardData.session1Annee,
        this.wizardData.moyenne2Annee,
        this.wizardData.session2Annee,
        this.wizardData.moyenne3Annee,
        this.wizardData.session3Annee,
      ].every((value) => !!String(value || '').trim());

      if (!licenceFields) {
        return false;
      }

      const licenceScores = [
        this.wizardData.moyenne1Annee,
        this.wizardData.moyenne2Annee,
        this.wizardData.moyenne3Annee,
      ];
      if (!this.areWizardScoresInRange(licenceScores)) {
        return false;
      }

      if (this.isWizardMrglOffer() || this.isWizardMrmiOffer()) {
        if (!this.wizardData.natureCandidature || !this.wizardData.nombreRedoublement) {
          return false;
        }
      }

      if (this.wizardData.natureCandidature === 'Étudiant Externe') {
        if (!this.wizardData.etablissementExterne || !this.wizardData.specialiteExterne) {
          return false;
        }
      }

      if (this.isWizardMrglOffer() && this.shouldShowWizardMrglFourthYearFields()) {
        if (
          !this.wizardData.moyenne4Annee ||
          !this.isScoreRangeValid(this.wizardData.moyenne4Annee)
        ) {
          return false;
        }
      }

      if (this.isWizardMrmiIng1EquivalentSelected()) {
        if (!this.wizardData.moyenneIng1 || !this.isScoreRangeValid(this.wizardData.moyenneIng1)) {
          return false;
        }
      }

      if (this.isWizardMrglOffer()) {
        const mrglBacFieldsValid = [
          this.wizardData.noteMathBac,
          this.wizardData.noteFrancaisBac,
          this.wizardData.noteAnglaisBac,
          this.wizardData.certificationB2,
        ].every((value) => !!String(value || '').trim());

        if (!mrglBacFieldsValid) {
          return false;
        }

        return this.areWizardScoresInRange([
          this.wizardData.noteMathBac,
          this.wizardData.noteFrancaisBac,
          this.wizardData.noteAnglaisBac,
        ]);
      }

      return true;
    }

    if (step === 3) {
      if (!this.wizardOffre) {
        return false;
      }

      return (
        this.wizardData.confirmationDeclaration === true &&
        String(this.wizardData.confirmationText || '')
          .trim()
          .toLowerCase() === 'je confirme'
      );
    }

    return true;
  }

  get wizardUploadedCount(): number {
    return this.wizardUploadedFiles.filter((file) => !!file).length;
  }

  get wizardUploadCompletion(): number {
    if (!this.wizardRequiredDocs.length) {
      return 0;
    }
    return Math.round((this.wizardUploadedCount / this.wizardRequiredDocs.length) * 100);
  }

  onWizardDragOver(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.wizardDragOverIndex = index;
  }

  onWizardDrop(event: DragEvent, index: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.wizardDragOverIndex = null;

    const file = event.dataTransfer?.files?.[0] || null;
    if (file) {
      this.setWizardFile(index, file);
    }
  }

  onWizardFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (file) {
      this.setWizardFile(index, file);
    }
    input.value = '';
  }

  getWizardUploadedFileName(index: number): string {
    return this.wizardUploadedFiles[index]?.name || '';
  }

  hasWizardUploadedFile(index: number): boolean {
    return !!this.wizardUploadedFiles[index];
  }

  getWizardDocHint(index: number, fallbackHint: string): string {
    const file = this.wizardUploadedFiles[index];
    return file ? `✅ ${file.name}` : fallbackHint;
  }

  removeWizardFile(index: number): void {
    if (index < 0 || index >= this.wizardUploadedFiles.length) {
      return;
    }
    this.wizardUploadedFiles[index] = null;
  }

  private setWizardFile(index: number, file: File): void {
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
      this.toastService.show('Format invalide. Utilisez PDF, JPG ou PNG.', 'warning');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.toastService.show('Fichier trop volumineux (max 5 Mo).', 'warning');
      return;
    }

    this.wizardUploadedFiles[index] = file;
  }

  submitWizardCandidature(): void {
    if (!this.wizardOffre) {
      return;
    }

    if (!this.isWizardStepValid(3)) {
      this.toastService.show(
        'Veuillez compléter la validation et la synthèse avant envoi.',
        'warning',
      );
      return;
    }

    const offre = this.wizardOffre;
    const formationCode = this.getWizardFormationCode(offre);
    const academicData = this.buildWizardAcademicDataPayload();

    if (!formationCode) {
      this.toastService.show(
        "Impossible d'identifier la formation pour calculer le score.",
        'error',
      );
      return;
    }

    const wizardPayload: Record<string, unknown> = {
      nature_candidature: this.wizardData.natureCandidature,
      etablissement_externe: this.wizardData.etablissementExterne,
      specialite_externe: this.wizardData.specialiteExterne,
      etablissement_origine: this.wizardData.etablissementOrigine,
      selected_diplome: this.wizardData.specialiteDiplome,
      diplome_reference: this.wizardData.natureDiplome,
      formation_code: formationCode,
      score_previsualisation: this.getWizardComputedScore(),
      academic_data: academicData,
    };

    this.wizardSubmitting = true;
    this.postuler(offre, wizardPayload);
    setTimeout(() => {
      this.closeSubmissionWizard();
    }, 450);
  }

  private getWizardFormationCode(offre: Offre): string {
    const code = this.getPreinscriptionDetailCode(offre);
    const map: Record<string, string> = {
      mpgl: 'MPGL',
      mpds: 'MPDS',
      mp3i: 'MP3I',
      mrgl: 'MRGL',
      mrmi: 'MRMI',
      ing_info_gl: 'ING_INFO_GL',
      ing_em: 'ING_EM',
    };

    return code ? map[code] || '' : '';
  }

  private buildWizardAcademicDataPayload(): Record<string, unknown> {
    const n = (value: string): number | null => this.parseWizardNumeric(value);

    const common = {
      session: this.wizardData.session3Annee || this.wizardData.session2Annee || 'Principale',
      redoublements: Number(this.wizardData.nombreRedoublement || '0'),
    };

    return {
      common,
      glDs: {
        moy1: n(this.wizardData.moyenne1Annee),
        moy2: n(this.wizardData.moyenne2Annee),
        moy3: n(this.wizardData.moyenne3Annee),
      },
      i3: {
        moyBac: n(this.wizardData.moyenneBacPrincipale),
        moyL1: n(this.wizardData.moyenne1Annee),
        moyL2: n(this.wizardData.moyenne2Annee),
        moyL3: n(this.wizardData.moyenne3Annee),
        session1Annee: this.wizardData.session1Annee,
        session2Annee: this.wizardData.session2Annee,
        session3Annee: this.wizardData.session3Annee,
        nombreRedoublement: Number(this.wizardData.nombreRedoublement || '0'),
      },
      mrglParcours: this.wizardData.natureDiplome === 'Maitrise' ? 'maitrise' : 'licence',
      mrglLicence: {
        moyBac: n(this.wizardData.moyenneBacPrincipale),
        note_math_bac: n(this.wizardData.noteMathBac),
        note_francais_bac: n(this.wizardData.noteFrancaisBac),
        note_anglais_bac: n(this.wizardData.noteAnglaisBac),
        certification_b2: this.wizardData.certificationB2 === 'oui',
        annee_obtention_diplome: this.wizardData.anneeObtentionDiplome,
        moy1: n(this.wizardData.moyenne1Annee),
        moy2: n(this.wizardData.moyenne2Annee),
        moy3: n(this.wizardData.moyenne3Annee),
        session1Annee: this.wizardData.session1Annee,
        session2Annee: this.wizardData.session2Annee,
        session3Annee: this.wizardData.session3Annee,
        nombreRedoublement: Number(this.wizardData.nombreRedoublement || '0'),
      },
      mrglMaitrise: {
        moyBac: n(this.wizardData.moyenneBacPrincipale),
        note_math_bac: n(this.wizardData.noteMathBac),
        note_francais_bac: n(this.wizardData.noteFrancaisBac),
        note_anglais_bac: n(this.wizardData.noteAnglaisBac),
        certification_b2: this.wizardData.certificationB2 === 'oui',
        moy1: n(this.wizardData.moyenne1Annee),
        moy2: n(this.wizardData.moyenne2Annee),
        moy3: n(this.wizardData.moyenne3Annee),
        moy4: n(this.wizardData.moyenne4Annee),
        session1Annee: this.wizardData.session1Annee,
        session2Annee: this.wizardData.session2Annee,
        session3Annee: this.wizardData.session3Annee,
        session4Annee: this.wizardData.session4Annee,
        nombreRedoublement: Number(this.wizardData.nombreRedoublement || '0'),
      },
      mrmiParcours: this.isWizardMrmiIng1EquivalentSelected() ? 'cas2' : 'cas1',
      mrmiCas1: {
        moyBac: n(this.wizardData.moyenneBacPrincipale),
        moyL1: n(this.wizardData.moyenne1Annee),
        moyL2: n(this.wizardData.moyenne2Annee),
        moyL3: n(this.wizardData.moyenne3Annee),
        session1Annee: this.wizardData.session1Annee,
        session2Annee: this.wizardData.session2Annee,
        session3Annee: this.wizardData.session3Annee,
        nombreRedoublement: Number(this.wizardData.nombreRedoublement || '0'),
      },
      mrmiCas2: {
        moyIng1: n(this.wizardData.moyenneIng1),
        sessionReussiteIng1: this.wizardData.sessionReussiteIng1,
        nombreRedoublementIng1: Number(this.wizardData.nombreRedoublementIng1 || '0'),
      },
      ingParcours: 'cas1',
      ingCas1: {
        moy1: n(this.wizardData.moyenne1Annee),
        moy2: n(this.wizardData.moyenne2Annee),
        session1Annee: this.wizardData.session1Annee,
        session2Annee: this.wizardData.session2Annee,
        nombreRedoublement: Number(this.wizardData.nombreRedoublement || '0'),
      },
      ingCas2: {
        m1: n(this.wizardData.moyenne1Annee),
        m2: n(this.wizardData.moyenne2Annee),
        m3: n(this.wizardData.moyenne3Annee),
      },
    };
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
      this.showAlertMessage('Dossier non trouvé');
    }
  }

  getDossierNumber(candidatureOrNumero: string | Candidature): string | null {
    const numeroCandidature =
      typeof candidatureOrNumero === 'string' ? candidatureOrNumero : candidatureOrNumero.numero;
    const dossier = this.dossiersCandidature.find(
      (d) => d.numero_candidature === numeroCandidature,
    );

    if (dossier) {
      return dossier.numero_dossier;
    }

    if (typeof candidatureOrNumero !== 'string') {
      const tokens = (candidatureOrNumero.numero || '').split('-').filter(Boolean);
      return tokens.length >= 2 ? tokens.slice(0, 2).join('-') : candidatureOrNumero.numero || null;
    }

    return null;
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

  get candidatureTotalCount(): number {
    return this.mesCandidatures.length;
  }

  get candidaturePendingCount(): number {
    return this.mesCandidatures.filter((candidature) => this.isPendingCandidature(candidature))
      .length;
  }

  get candidatureValidatedCount(): number {
    return this.mesCandidatures.filter((candidature) => this.isValidatedCandidature(candidature))
      .length;
  }

  hasMissingPieces(candidature: Candidature): boolean {
    return candidature.dossier_depose !== true || candidature.dossier_valide !== true;
  }

  private normalizeStatus(value: string | undefined | null): string {
    return (value || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  isAdmitted(candidature: Candidature): boolean {
    const etat = this.normalizeStatus(candidature.etat_candidature);
    const statut = this.normalizeStatus(candidature.statut);
    return (
      etat.includes('admis') ||
      etat.includes('selectionne') ||
      ['selectionne', 'admis', 'inscrit'].includes(statut)
    );
  }

  isFicheInscriptionDeposee(candidature: Candidature): boolean {
    const statutInscription = this.normalizeStatus(candidature.statut_inscription);
    return ['paiement_soumis', 'valide', 'confirme'].includes(statutInscription);
  }

  get admittedCandidatures(): Candidature[] {
    return [...this.mesCandidatures]
      .filter((candidature) => this.isAdmitted(candidature))
      .sort((a, b) => a.numero.localeCompare(b.numero));
  }

  getCandidatureStatusStepper(_candidature: Candidature): string[] {
    return ['Reçu', 'Vérifié', 'Admis'];
  }

  getCandidatureStatusIndex(candidature: Candidature): number {
    const status = (candidature.statut || '').toLowerCase();

    if (['selectionne', 'inscrit', 'valide', 'traitee'].includes(status)) {
      return 2;
    }

    if (
      [
        'preselectionne',
        'sous_examen',
        'dossier_depose',
        'paiement_soumis',
        'rejete',
        'non_admis',
        'non_preselectionne',
      ].includes(status) ||
      candidature.dossier_valide === true
    ) {
      return 1;
    }

    return 0;
  }

  getStatusBadgeClass(statut?: string): string {
    const value = (statut || '').toLowerCase();

    if (this.isValidatedStatus(value)) {
      return 'chip-success';
    }

    if (this.isRejectedStatus(value)) {
      return 'chip-danger';
    }

    if (['preselectionne', 'sous_examen', 'soumis'].includes(value)) {
      return 'chip-info';
    }

    return 'chip-warning';
  }

  private isValidatedStatus(status: string): boolean {
    return ['selectionne', 'inscrit', 'valide', 'traitee'].includes(status);
  }

  private isRejectedStatus(status: string): boolean {
    return ['rejete', 'non_admis', 'non_preselectionne'].includes(status);
  }

  private isValidatedCandidature(candidature: Candidature): boolean {
    return this.isValidatedStatus((candidature.statut || '').toLowerCase());
  }

  private isPendingCandidature(candidature: Candidature): boolean {
    const status = (candidature.statut || '').toLowerCase();
    return (
      [
        'en_attente',
        'soumis',
        'sous_examen',
        'preselectionne',
        'dossier_depose',
        'paiement_soumis',
      ].includes(status) ||
      (!this.isValidatedCandidature(candidature) && !this.isRejectedStatus(status))
    );
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
            ? "En attente de confirmation d'inscription"
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
    const statut = this.normalizeStatus(candidature.statut);
    const etat = this.normalizeStatus(candidature.etat_candidature);
    return (
      ['selectionne', 'inscrit'].includes(statut) ||
      etat.includes('selectionne') ||
      etat.includes('admis')
    );
  }

  isWithinInscriptionDeadline(candidature: Candidature): boolean {
    if (!candidature.date_limite_modification) {
      return true;
    }

    const deadline = new Date(candidature.date_limite_modification).getTime();
    if (Number.isNaN(deadline)) {
      return true;
    }

    return deadline >= Date.now();
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

    if (!this.canAccessInscriptionEtape(candidature)) {
      this.notifyActionBlocked(
        "Vous devez terminer les étapes précédentes (présélection, dépôt dossier, sélection) avant l'inscription en ligne.",
      );
      return;
    }

    if (!this.isWithinInscriptionDeadline(candidature)) {
      this.notifyActionBlocked("Le délai d'inscription est dépassé pour cette candidature.");
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
    this.router.navigate(['/candidat/candidature/modifier'], {
      queryParams: { candidatureId: candidature.id },
    });
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
      this.showAlertMessage('❌ Priorité invalide. Veuillez entrer un entier entre 1 et 5.');
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
          this.showAlertMessage('✅ Candidature modifiée avec succès.');
          this.fermerModalModification();
          this.loadMesCandidatures();
        },
        error: (error) => {
          console.error('Erreur modification candidature:', error);
          this.showAlertMessage(
            error?.error?.error || '❌ Erreur lors de la modification de la candidature.',
          );
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

    if (!this.isWithinInscriptionDeadline(candidature)) {
      this.notifyActionBlocked("Le délai d'inscription est dépassé pour cette candidature.");
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
      this.showAlertMessage('❌ Fichier trop volumineux (max 5 Mo)');
      return;
    }

    const reference = prompt("Entrez la référence de la fiche d'inscription (inscription.tn):", '');
    if (!reference || !reference.trim()) {
      this.showAlertMessage("❌ Référence de la fiche d'inscription obligatoire");
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
    this.switchView('mon-dossier', { preserveDossierSelection: true });
  }

  ouvrirRecapDossierDepuisCandidature(candidatureNumero: string): void {
    const numeroDossier = this.getDossierNumber(candidatureNumero);
    if (!numeroDossier) {
      this.showAlertMessage('Aucun dossier associé à cette candidature pour le moment.');
      return;
    }
    this.ouvrirDossierDepuisTable(numeroDossier);
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

  voirDetails(candidature: Candidature | HistoriqueItem): void {
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

    this.router.navigate(['/preinscription/detail', code], {
      queryParams: { offerId: offre.id },
    });
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
          coefficients: 'Bac (40%), Licence (60%)',
          datesImportantes: 'Inscription sur le site web : www.isimm.rnu.tn/public/formulaires',
        },
        {
          capaciteAccueilleTotale: '35',
          etablissementOrigine: 'Autres établissements',
          capaciteAccueille: '05',
          typeDiplome:
            'Licence en Sciences de l' + 'Informatique ou en Informatique de Gestion (uniquement)',
          coefficients: 'Moyenne Générale > 12/20',
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
        coefficients: 'Standard ISIMM',
        datesImportantes: `Date limite : ${new Date(offre.date_limite).toLocaleDateString('fr-FR')}`,
      },
    ];
  }

  gererDossier(candidature: Candidature): void {
    if (candidature.dossier_depose) {
      this.showAlertMessage(`Modifier le dossier pour ${candidature.master_nom}`);
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
          this.showAlertMessage('❌ Fichier trop volumineux (max 5 Mo)');
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
              this.showAlertMessage('✅ Document déposé avec succès !');
            },
            error: (error) => {
              console.error('Erreur:', error);
              this.showAlertMessage('❌ Erreur lors du dépôt');
            },
          });
      }
    };

    input.click();
  }

  voirDocument(doc: Document): void {
    this.showAlertMessage(`Voir le document : ${doc.nom}`);
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

    if (!this.isWithinInscriptionDeadline(candidature)) {
      this.notifyActionBlocked("Paiement refusé: le délai d'inscription est dépassé.");
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
          this.showAlertMessage("✅ Fiche d'inscription déposée avec succès !");
          candidature.statut_inscription = 'paiement_soumis';
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage("❌ Erreur lors du dépôt de la fiche d'inscription");
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
      this.showAlertMessage('❌ Veuillez remplir tous les champs');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post('http://localhost:8003/api/reclamations/creer/', this.nouvelleReclamation, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          this.showAlertMessage('✅ Réclamation soumise avec succès !');
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
          this.showAlertMessage('❌ Erreur lors de la soumission');
        },
      });
  }

  voirReclamation(reclamation: Reclamation): void {
    this.dialog.open(ReclamationDetailDialogComponent, {
      width: '640px',
      maxHeight: '80vh',
      data: reclamation,
    });
  }

  setProfileTab(tab: ProfileTab): void {
    this.activeProfileTab = tab;
  }

  enableProfileEdit(): void {
    this.isProfileEditMode = true;
  }

  cancelProfileEdit(): void {
    this.isProfileEditMode = false;
    this.profileData = { ...this.currentUser };
  }

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
          this.isProfileEditMode = false;
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

  // ── Drag & Drop enrichi ──
  onDragOver(event: DragEvent, docId?: number): void {
    event.preventDefault();
    event.stopPropagation();
    if (docId !== undefined) {
      this.dragOverDocId = docId;
    }
  }

  onDragLeave(): void {
    this.dragOverDocId = null;
  }

  onDocumentDrop(event: DragEvent, doc: Document): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverDocId = null;

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];
    if (!this.isAllowedUploadFile(file)) {
      return;
    }

    this.selectedDocumentFiles[doc.id] = file;
  }

  // ── Aperçu document ──
  ouvrirApercu(doc: Document): void {
    this.apercuDoc = doc;
  }

  isPdf(url?: string): boolean {
    return !!url && /\.pdf(?:$|[?#])/i.test(url);
  }

  getApercuPdfUrl(url?: string): SafeResourceUrl | null {
    if (!url) {
      return null;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  fermerApercu(): void {
    this.apercuDoc = null;
  }

  telechargerDocument(doc: Document): void {
    if (doc.fichier_url) {
      window.open(doc.fichier_url, '_blank');
    }
  }

  getDocumentStatusLabel(doc: Document): 'Validé' | 'Erreur' | 'Manquant' {
    if (this.uploadErrors[doc.id]) {
      return 'Erreur';
    }
    return doc.depose ? 'Validé' : 'Manquant';
  }

  getDocumentStatusIcon(doc: Document): string {
    const status = this.getDocumentStatusLabel(doc);
    if (status === 'Validé') {
      return 'fa-check-circle';
    }
    if (status === 'Erreur') {
      return 'fa-exclamation-circle';
    }
    return 'fa-clock';
  }

  // ── Finalisation dossier ──
  finaliserDossier(): void {
    if (this.completionPercent < 100) {
      this.toastService.show(
        'Veuillez déposer tous les documents obligatoires avant de finaliser.',
        'warning',
      );
      return;
    }
    this.finalisationLoading = true;
    // Appel API ici — remplacer le setTimeout par l'appel réel
    // this.dossierService.finaliserDossier(this.selectedDossierNumber).subscribe(...)
    setTimeout(() => {
      this.finalisationLoading = false;
      this.toastService.show('Dossier finalisé avec succès !', 'success');
    }, 1500);
  }

  private isAllowedUploadFile(file: File): boolean {
    const allowedExtensions = ['pdf'];
    const extension = (file.name.split('.').pop() || '').toLowerCase();

    if (!allowedExtensions.includes(extension)) {
      this.showAlertMessage('❌ Format non supporté. Utilisez uniquement le format PDF.');
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.showAlertMessage('❌ Fichier trop volumineux (max 5 Mo)');
      return false;
    }

    return true;
  }

  onDocumentFileSelected(event: Event, document: Document): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!this.isAllowedUploadFile(file)) {
      input.value = '';
      this.uploadErrors[document.id] = 'Format invalide ou taille > 5 Mo.';
      return;
    }

    this.uploadErrors[document.id] = '';
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
          this.uploadErrors[document.id] = '';
          if (onSuccess) onSuccess();
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.uploadErrors[document.id] = "Erreur d'envoi. Réessayez.";
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
        this.showAlertMessage('❌ Fichier trop volumineux (max 5 Mo)');
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
          this.showAlertMessage('✅ Fichier envoyé avec succès !');
          this.fichiersHistorique.unshift({
            id: Date.now(),
            nom: this.fichierInscription!.name,
            date: new Date().toLocaleDateString('fr-FR'),
          });
          this.fichierInscription = null;
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.showAlertMessage("❌ Erreur lors de l'envoi du fichier");
        },
      });
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '';
    return bytes < 1024 * 1024
      ? (bytes / 1024).toFixed(1) + ' Ko'
      : (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
  }

  voirFichier(fichier: FichierHistorique): void {
    this.showAlertMessage(`Voir le fichier : ${fichier.nom}`);
  }

  telechargerFichier(fichier: FichierHistorique): void {
    this.showAlertMessage(`Télécharger le fichier : ${fichier.nom}`);
  }

  exportInscriptionsEnLigne(): void {
    if (!this.mesCandidatures.length) {
      this.showAlertMessage('❌ Aucune candidature à exporter');
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
