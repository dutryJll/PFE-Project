import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  | 'masters'
  | 'configuration-appels'
  | 'concours-ingenieur'
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

interface MasterOption {
  id: number;
  nom: string;
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
  listesExportFormat: ExportFormat = 'pdf';
  deliberationsExportFormat: ExportFormat = 'pdf';
  inscriptionsExportFormat: ExportFormat = 'xlsx';

  masterOptions: MasterOption[] = [];
  selectedConfigMasterId: number | null = null;
  configLoading: boolean = false;
  configSaving: boolean = false;
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
    this.loadMastersForConfiguration();
  }

  loadMastersForConfiguration(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<any[]>('http://localhost:8003/api/candidatures/masters/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
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

  private loadActionPermissions(): void {
    this.authService.getMyEnabledActions().subscribe({
      next: (actions: string[]) => {
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
        console.warn('Permissions indisponibles, maintien du mode permissif local.');
      },
    });
  }

  canAccessView(view: CommissionView): boolean {
    if (
      view === 'dashboard' ||
      view === 'profil' ||
      view === 'masters' ||
      view === 'configuration-appels' ||
      view === 'concours-ingenieur'
    ) {
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

  openOcrAnalysisPage(): void {
    if (!this.isResponsable || !this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked('Analyse OCR non autorisee pour votre profil.');
      return;
    }
    this.currentView = 'ocr';
    this.router.navigate(['/commission/dossier-analysis']);
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
      masters: 'Les Masters',
      'configuration-appels': 'Configuration des Appels',
      'concours-ingenieur': "Concours Cycle d'Ingénieur",
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

  getConcoursIngenieur(): Concours[] {
    return this.concoursIngenieur;
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

  getAuthorizedStatutTransitions(candidature: Candidature): string[] {
    const currentStatut = candidature.statut;
    const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatut] || new Set();
    return Array.from(allowed);
  }

  changerStatut(candidature: Candidature): void {
    if (!this.actionPermissions.verifierDossiers) {
      this.notifyActionBlocked("Changement de statut désactivé par l'administration.");
      return;
    }

    if (!candidature.nouveau_statut) {
      alert('❌ Veuillez sélectionner un statut');
      // Vérifier que la transition est autorisée
      const authorized = this.getAuthorizedStatutTransitions(candidature);
      if (!authorized.includes(candidature.nouveau_statut!)) {
        alert(`❌ Transition non autorisée: ${candidature.statut} → ${candidature.nouveau_statut}`);
        candidature.nouveau_statut = '';
        return;
      }

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

  // ========================================
  // EXPORT FUNCTIONALITY
  // ========================================
  exportListes(): void {
    if (this.listes.length === 0) {
      alert('❌ Aucune liste à exporter');
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

  exportDeliberations(): void {
    if (this.procesVerbaux.length === 0) {
      alert('❌ Aucune délibération à exporter');
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

  exportInscriptions(): void {
    const inscriptions = this.candidatures.filter((c) => c.statut === 'inscrit');
    if (inscriptions.length === 0) {
      alert('❌ Aucune inscription à exporter');
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
      alert('❌ Aucune donnée à exporter');
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
      alert('❌ Aucune donnée à exporter');
      return;
    }

    const jsonContent = JSON.stringify(rows, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    this.downloadFile(blob, baseFileName, 'json');
  }

  exportRowsToXLSX(rows: ExportRow[], baseFileName: string, tableTitle: string): void {
    if (rows.length === 0) {
      alert('❌ Aucune donnée à exporter');
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
      alert('❌ Aucune donnée à exporter');
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
