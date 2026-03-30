import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
interface Commission {
  id: number;
  nom: string;
  master_nom: string;
  responsable_nom?: string;
  membres_count: number;
  actif: boolean;
}

interface Master {
  id: number;
  nom: string;
  type: 'recherche' | 'professionnel';
  description: string;
  places: number;
  date_limite: string;
  statut: 'ouvert' | 'ferme';
  specialite: string;
}

interface Utilisateur {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  is_active: boolean;
  date_inscription: string;
}

interface OffreIngenieur {
  id: number;
  titre: string;
  specialite: string;
  places: number;
  date_limite: string;
  statut: 'ouvert' | 'ferme';
  description: string;
  backend_id?: number;
}

interface ReglementConcoursIngenieur {
  metadata?: any;
  [key: string]: any;
}

interface ReferentielMasters {
  metadata?: any;
  sections_masters?: Record<string, any>;
  documents_requis_pdf_unique?: string[];
  regles_importantes?: string[];
  modele_formulaire_candidature?: {
    champs?: string[];
    choix_possibles?: string[];
  };
  [key: string]: any;
}

interface Candidature {
  id: number;
  numero: string;
  candidat_nom: string;
  candidat_email: string;
  master_nom: string;
  specialite: string;
  score: number;
  statut: string;
  date_soumission: string;
}

interface Role {
  id: number;
  nom: string;
  description: string;
  est_systeme: boolean;
  nb_utilisateurs: number;
  nb_permissions: number;
  permissions?: number[];
}

interface Permission {
  id: number;
  nom: string;
  module: string;
}

interface LogEntry {
  id: number;
  timestamp: string;
  user_name: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  succes: boolean;
}

interface ActionMatrixRow {
  action_no: number;
  action_name: string;
  description?: string;
  roles: {
    candidat: boolean;
    commission: boolean;
    responsable_commission: boolean;
    admin: boolean;
  };
}

type RoleKey = 'candidat' | 'commission' | 'responsable_commission' | 'admin';
type ExportFormat = 'csv' | 'json' | 'ods' | 'pdf';
type ExportRow = Record<string, string | number | boolean | null | undefined>;

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdminComponent implements OnInit {
  adminLogoSrc: string = '/images/logo-universite.png';
  currentUser: any = null;
  currentView: string = 'dashboard';
  currentDate: Date = new Date();

  // Données statistiques
  statsData = {
    totalUsers: 0,
    totalCandidatures: 0,
    admis: 0,
    membresCommission: 0,
  };

  // Listes
  utilisateursList: Utilisateur[] = [];
  utilisateurRecherche: string = '';
  selectedUserIds: number[] = [];
  openUserMenuId: number | null = null;
  exportFormat: ExportFormat = 'csv';
  mastersExportFormat: ExportFormat = 'csv';
  candidaturesExportFormat: ExportFormat = 'csv';
  offresExportFormat: ExportFormat = 'csv';
  mastersList: Master[] = [];
  offresIngenieurList: OffreIngenieur[] = [];
  reglementReference: ReglementConcoursIngenieur | null = null;
  chapitresReglement: Array<{ key: string; label: string; value: any }> = [];
  referentielMasters: ReferentielMasters | null = null;
  isLoadingReferentielMasters: boolean = false;
  referentielMastersMessage: string = '';
  point13Message: string = '';
  isLoadingReglement: boolean = false;
  isApplyingReglement: boolean = false;
  concoursIngenieurApiAvailable: boolean = true;
  selectedConcoursIdForReglement: number | null = null;
  reglementApplyMessage: string = '';
  candidaturesList: Candidature[] = [];
  commissions: any[] = [];

  // Administration Système
  roles: Role[] = [
    {
      id: 1,
      nom: 'Administrateur',
      description: 'Accès complet au système',
      est_systeme: true,
      nb_utilisateurs: 3,
      nb_permissions: 50,
      permissions: [1, 2, 3, 4, 5],
    },
    {
      id: 2,
      nom: 'Responsable Commission',
      description: 'Gestion complète de sa commission',
      est_systeme: true,
      nb_utilisateurs: 5,
      nb_permissions: 35,
      permissions: [1, 2, 3],
    },
    {
      id: 3,
      nom: 'Membre Commission',
      description: 'Évaluation des candidatures',
      est_systeme: true,
      nb_utilisateurs: 25,
      nb_permissions: 15,
      permissions: [1],
    },
  ];

  permissions: Permission[] = [
    { id: 1, nom: 'Voir candidatures', module: 'Candidatures' },
    { id: 2, nom: 'Modifier candidatures', module: 'Candidatures' },
    { id: 3, nom: 'Gérer listes', module: 'Listes' },
    { id: 4, nom: 'Gérer utilisateurs', module: 'Utilisateurs' },
    { id: 5, nom: 'Configuration système', module: 'Système' },
  ];

  logs: LogEntry[] = [];

  roleColumns: Array<{ key: RoleKey; label: string }> = [
    { key: 'candidat', label: 'Candidat' },
    { key: 'commission', label: 'Commission' },
    { key: 'responsable_commission', label: 'Responsable commission' },
    { key: 'admin', label: 'Admin' },
  ];

  actionRoleMatrix: ActionMatrixRow[] = [];
  newActionName: string = '';
  newActionDescription: string = '';
  newActionRoles: Record<RoleKey, boolean> = {
    candidat: false,
    commission: false,
    responsable_commission: false,
    admin: false,
  };

  filtresLogs: any = {
    module: '',
    action: '',
    utilisateur: '',
  };

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

  // Formulaire Master
  nouveauMaster: Master = {
    id: 0,
    nom: '',
    type: 'recherche',
    description: '',
    places: 0,
    date_limite: '',
    statut: 'ouvert',
    specialite: '',
  };

  showModalMaster: boolean = false;
  showModalOffreIngenieur: boolean = false;
  nouvelleOffreIngenieur: OffreIngenieur = {
    id: 0,
    titre: '',
    specialite: '',
    places: 0,
    date_limite: '',
    statut: 'ouvert',
    description: '',
  };

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    const token = this.authService.getAccessToken();

    if (!token || !this.currentUser) {
      alert('Session expirée. Veuillez vous reconnecter.');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.profileData = { ...this.currentUser };
    this.loadStats();
    this.loadUtilisateurs();
    this.loadMasters();
    this.loadReferentielMasters();
    this.loadCandidatures();
    this.loadOffresIngenieur();
    this.loadLogs();
    this.loadActionRoleMatrix();
  }

  // ========================================
  // NAVIGATION
  // ========================================
  switchView(view: string): void {
    this.currentView = view;
    if (view === 'logs') {
      this.loadLogs();
    } else if (view === 'commissions') {
      this.loadCommissions();
    }
  }

  loadCommissions(): void {
    const token = this.authService.getAccessToken();

    this.http
      .get('http://localhost:8003/api/commissions/list/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data: any) => {
          this.commissions = data;
        },
        error: (error) => {
          console.error('Erreur chargement commissions:', error);
        },
      });
  }

  getViewTitle(): string {
    const titles: any = {
      dashboard: 'Tableau de bord',
      analytics: 'Analytiques avancées',
      utilisateurs: 'Gestion des utilisateurs',
      masters: 'Gestion des Masters',
      'concours-ingenieur': "Gestion des offres - Concours d'ingénieur",
      candidatures: 'Gestion de candidature',
      administration: 'Administration système',
      logs: "Journaux d'activité",
      parametres: 'Administration du site',
      rapports: 'Rapports',
      profil: 'Mon Profil',
    };
    return titles[this.currentView] || 'Tableau de bord';
  }

  onAdminLogoError(): void {
    if (this.adminLogoSrc === '/images/logo-universite.png') {
      this.adminLogoSrc = '/images/logo-isimm.png';
      return;
    }

    if (this.adminLogoSrc === '/images/logo-isimm.png') {
      this.adminLogoSrc = '/ISIMM_LOGO.png';
    }
  }

  // ========================================
  // CHARGEMENT DONNÉES
  // ========================================
  loadStats(): void {
    const token = this.authService.getAccessToken();

    this.http
      .get('http://localhost:8001/api/auth/users/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (users: any) => {
          this.statsData.totalUsers = users.length;
          this.statsData.membresCommission = users.filter(
            (u: any) => u.role === 'commission' || u.role === 'responsable_commission',
          ).length;
        },
        error: (error) => {
          console.error('Erreur chargement stats utilisateurs:', error);
          this.statsData.totalUsers = 1245;
          this.statsData.membresCommission = 45;
        },
      });

    this.statsData.totalCandidatures = 856;
    this.statsData.admis = 234;
  }

  loadUtilisateurs(): void {
    const token = this.authService.getAccessToken();

    this.http
      .get('http://localhost:8001/api/auth/users/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (users: any) => {
          this.utilisateursList = users;
        },
        error: (error) => {
          console.error('Erreur chargement utilisateurs:', error);
          this.utilisateursList = [
            {
              id: 1,
              first_name: 'Ahmed',
              last_name: 'Ben Ali',
              email: 'ahmed@example.com',
              role: 'candidat',
              is_active: true,
              date_inscription: '2026-02-15',
            },
            {
              id: 2,
              first_name: 'Fatma',
              last_name: 'Gharbi',
              email: 'fatma@example.com',
              role: 'commission',
              is_active: true,
              date_inscription: '2026-01-10',
            },
          ];
        },
      });
  }

  loadMasters(): void {
    this.mastersList = [
      {
        id: 1,
        nom: 'Master Recherche Génie Logiciel',
        type: 'recherche',
        description: 'Formation en recherche en génie logiciel',
        places: 30,
        date_limite: '2026-03-30',
        statut: 'ouvert',
        specialite: 'Informatique',
      },
      {
        id: 2,
        nom: 'Master Professionnel Data Science',
        type: 'professionnel',
        description: 'Formation professionnelle en science des données',
        places: 25,
        date_limite: '2026-04-15',
        statut: 'ouvert',
        specialite: 'Informatique',
      },
    ];
  }

  executerSelectionMaster(master: Master): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.point13Message = 'Session expirée. Veuillez vous reconnecter.';
      return;
    }

    this.http
      .post(
        `http://localhost:8003/api/candidatures/master/${master.id}/generer-listes/`,
        { iteration: 1 },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (res: any) => {
          this.point13Message = `✅ Sélection lancée pour ${master.nom}. ${res?.message || ''}`;
        },
        error: (err) => {
          const msg = err?.error?.error || err?.error?.message || 'Erreur de sélection.';
          this.point13Message = `❌ ${msg}`;
        },
      });
  }

  verifierClotureOuRelance(master: Master): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      this.point13Message = 'Session expirée. Veuillez vous reconnecter.';
      return;
    }

    this.http
      .post(
        `http://localhost:8003/api/candidatures/master/${master.id}/cloture-ou-relance/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (res: any) => {
          this.point13Message =
            `ℹ️ ${res?.message || 'Cloture/relance executée.'}` +
            ` (inscrits: ${res?.nb_inscrits ?? '-'}, capacité: ${res?.capacite_accueil ?? '-'})`;
        },
        error: (err) => {
          const msg = err?.error?.error || err?.error?.message || 'Erreur cloture/relance.';
          this.point13Message = `❌ ${msg}`;
        },
      });
  }

  loadReferentielMasters(): void {
    this.isLoadingReferentielMasters = true;
    this.referentielMastersMessage = '';

    this.http
      .get<ReferentielMasters>(
        'http://localhost:8003/api/candidatures/masters/reglement-reference/',
      )
      .subscribe({
        next: (data) => {
          this.referentielMasters = data;
          this.isLoadingReferentielMasters = false;
        },
        error: (err) => {
          console.error('Erreur chargement referentiel masters:', err);
          this.isLoadingReferentielMasters = false;
          this.referentielMastersMessage =
            'Impossible de charger le referentiel masters 2025/2026.';
        },
      });
  }

  getMastersReferenceCards(): Array<{ code: string; data: any }> {
    const sections = this.referentielMasters?.sections_masters || {};
    const orderedCodes = ['mpgl', 'mrgl', 'mpds'];

    return orderedCodes
      .filter((code) => !!sections[code])
      .map((code) => ({ code: code.toUpperCase(), data: sections[code] }));
  }

  formatMasterFieldLabel(key: string): string {
    return key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  normalizeKey(key: string | number | symbol): string {
    return String(key);
  }

  joinMasterChoices(values?: string[]): string {
    return (values || []).join(', ');
  }

  loadCandidatures(): void {
    this.candidaturesList = [
      {
        id: 1,
        numero: '2603-00001-GL',
        candidat_nom: 'Ahmed Ben Ali',
        candidat_email: 'ahmed@example.com',
        master_nom: 'Master Génie Logiciel',
        specialite: 'Informatique',
        score: 16.5,
        statut: 'selectionne',
        date_soumission: '2026-02-15',
      },
      {
        id: 2,
        numero: '2603-00002-DS',
        candidat_nom: 'Fatma Gharbi',
        candidat_email: 'fatma@example.com',
        master_nom: 'Master Data Science',
        specialite: 'Informatique',
        score: 17.2,
        statut: 'en_attente',
        date_soumission: '2026-02-16',
      },
    ];
  }

  loadLogs(): void {
    const token = this.authService.getAccessToken();

    const params: any = {};
    if (this.filtresLogs.module) params.module = this.filtresLogs.module;
    if (this.filtresLogs.action) params.action = this.filtresLogs.action;
    if (this.filtresLogs.utilisateur) params.search = this.filtresLogs.utilisateur;

    this.http
      .get('http://localhost:8001/api/admin/logs/', {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      })
      .subscribe({
        next: (data: any) => {
          this.logs = data.results || data;
        },
        error: (error) => {
          console.error('Erreur:', error);
          // Données fictives si erreur
          this.logs = [
            {
              id: 1,
              timestamp: '2026-03-22T14:30:00',
              user_name: 'Ahmed Ben Ali',
              action: 'create',
              module: 'candidatures',
              description: 'Nouvelle candidature créée',
              ip_address: '192.168.1.10',
              succes: true,
            },
            {
              id: 2,
              timestamp: '2026-03-22T14:25:00',
              user_name: 'Admin ISIMM',
              action: 'update',
              module: 'users',
              description: 'Utilisateur modifié',
              ip_address: '192.168.1.1',
              succes: true,
            },
          ];
        },
      });
  }

  // ========================================
  // GESTION UTILISATEURS
  // ========================================
  get utilisateursFiltres(): Utilisateur[] {
    const q = this.utilisateurRecherche.trim().toLowerCase();
    if (!q) {
      return this.utilisateursList;
    }

    return this.utilisateursList.filter((user) => {
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      return fullName.includes(q) || user.email.toLowerCase().includes(q);
    });
  }

  get allUsersSelected(): boolean {
    const ids = this.utilisateursFiltres.map((u) => u.id);
    return ids.length > 0 && ids.every((id) => this.selectedUserIds.includes(id));
  }

  toggleAllUsers(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.selectedUserIds = this.utilisateursFiltres.map((u) => u.id);
    } else {
      this.selectedUserIds = [];
    }
  }

  toggleUserSelection(userId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      if (!this.selectedUserIds.includes(userId)) {
        this.selectedUserIds.push(userId);
      }
      return;
    }

    this.selectedUserIds = this.selectedUserIds.filter((id) => id !== userId);
  }

  isUserSelected(userId: number): boolean {
    return this.selectedUserIds.includes(userId);
  }

  toggleUserMenu(userId: number): void {
    this.openUserMenuId = this.openUserMenuId === userId ? null : userId;
  }

  closeUserMenu(): void {
    this.openUserMenuId = null;
  }

  getUserInitials(user: Utilisateur): string {
    const first = (user.first_name || '').charAt(0).toUpperCase();
    const last = (user.last_name || '').charAt(0).toUpperCase();
    return `${first}${last}` || 'US';
  }

  suspendreUtilisateur(user: Utilisateur): void {
    user.is_active = !user.is_active;
    this.closeUserMenu();
    alert(
      user.is_active
        ? `✅ Compte réactivé pour ${user.first_name} ${user.last_name}`
        : `⛔ Candidature suspendue pour ${user.first_name} ${user.last_name}`,
    );
  }

  downloadUsersFile(): void {
    const rows: ExportRow[] = this.utilisateursFiltres.map((u) => ({
      id: u.id,
      nom: `${u.first_name} ${u.last_name}`,
      email: u.email,
      role: this.getRoleLabel(u.role),
      statut: u.is_active ? 'Actif' : 'Suspendu',
      date_inscription: u.date_inscription,
    }));

    void this.exportRows(rows, this.exportFormat, 'users-export', 'Export utilisateurs');
  }

  downloadMastersFile(): void {
    const rows: ExportRow[] = this.mastersList.map((m) => ({
      id: m.id,
      nom: m.nom,
      type: m.type,
      specialite: m.specialite,
      places: m.places,
      date_limite: m.date_limite,
      statut: m.statut,
    }));

    void this.exportRows(rows, this.mastersExportFormat, 'masters-export', 'Export masters');
  }

  downloadCandidaturesFile(): void {
    const rows: ExportRow[] = this.candidaturesList.map((c) => ({
      numero: c.numero,
      candidat: c.candidat_nom,
      email: c.candidat_email,
      master: c.master_nom,
      specialite: c.specialite,
      score: c.score,
      statut: this.getStatutLabel(c.statut),
      date_soumission: c.date_soumission,
    }));

    void this.exportRows(
      rows,
      this.candidaturesExportFormat,
      'candidatures-export',
      'Export candidatures',
    );
  }

  downloadOffresIngenieurFile(): void {
    const rows: ExportRow[] = this.offresIngenieurList.map((o) => ({
      id: o.id,
      titre: o.titre,
      specialite: o.specialite,
      places: o.places,
      date_limite: o.date_limite,
      statut: o.statut === 'ouvert' ? 'Ouvert' : 'Ferme',
      description: o.description,
    }));

    void this.exportRows(
      rows,
      this.offresExportFormat,
      'offres-ingenieur-export',
      'Export offres concours ingenieur',
    );
  }

  private async exportRows(
    rows: ExportRow[],
    format: ExportFormat,
    baseFileName: string,
    pdfTitle: string,
  ): Promise<void> {
    if (!rows.length) {
      alert('Aucune donnee a exporter');
      return;
    }

    const headers = Object.keys(rows[0]);

    if (format === 'json') {
      const json = JSON.stringify(rows, null, 2);
      this.downloadBlob(
        json,
        this.buildExportFileName(baseFileName, 'json'),
        'application/json;charset=utf-8;',
      );
      return;
    }

    if (format === 'ods') {
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Export');
      XLSX.writeFile(workbook, this.buildExportFileName(baseFileName, 'ods'), { bookType: 'ods' });
      return;
    }

    if (format === 'pdf') {
      await this.exportRowsToPdf(
        rows,
        headers,
        pdfTitle,
        this.buildExportFileName(baseFileName, 'pdf'),
      );
      return;
    }

    const csvRows = rows.map((row) =>
      headers.map((header) => `"${String(row[header] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csv = [headers.join(','), ...csvRows].join('\n');
    this.downloadBlob(
      csv,
      this.buildExportFileName(baseFileName, 'csv'),
      'text/csv;charset=utf-8;',
    );
  }

  private async exportRowsToPdf(
    rows: ExportRow[],
    headers: string[],
    title: string,
    fileName: string,
  ): Promise<void> {
    const doc = new jsPDF({ orientation: 'landscape' });
    const logoDataUrl = await this.loadImageAsDataUrl('/assets/images/logo-isimm.png');

    let startY = 24;
    let textX = 14;

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 8, 18, 18);
      textX = 36;
      startY = 34;
    }

    doc.setFontSize(14);
    doc.text('ISIMM', textX, 14);
    doc.setFontSize(11);
    doc.text(title, textX, 20);
    doc.setFontSize(9);
    doc.text(`Genere le ${this.getHumanReadableTimestamp()}`, 14, startY - 4);

    autoTable(doc, {
      startY,
      head: [headers.map((h) => h.replace(/_/g, ' '))],
      body: rows.map((row) => headers.map((header) => String(row[header] ?? ''))),
      styles: { fontSize: 8 },
    });

    doc.save(fileName);
  }

  private loadImageAsDataUrl(src: string): Promise<string | null> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(null);
          return;
        }

        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  private buildExportFileName(baseFileName: string, extension: string): string {
    const now = new Date();
    const stamp = `${now.getFullYear()}-${this.pad2(now.getMonth() + 1)}-${this.pad2(now.getDate())}_${this.pad2(now.getHours())}-${this.pad2(now.getMinutes())}`;
    return `${baseFileName}-${stamp}.${extension}`;
  }

  private getHumanReadableTimestamp(): string {
    const now = new Date();
    return `${this.pad2(now.getDate())}/${this.pad2(now.getMonth() + 1)}/${now.getFullYear()} ${this.pad2(now.getHours())}:${this.pad2(now.getMinutes())}`;
  }

  private pad2(value: number): string {
    return String(value).padStart(2, '0');
  }

  private downloadBlob(content: string, fileName: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  nouvelUtilisateur(): void {
    alert('Créer un nouvel utilisateur');
  }

  voirUtilisateur(user: Utilisateur): void {
    alert(`Voir détails de ${user.first_name} ${user.last_name}`);
  }

  modifierUtilisateur(user: Utilisateur): void {
    alert(`Modifier ${user.first_name} ${user.last_name}`);
  }

  supprimerUtilisateur(user: Utilisateur): void {
    if (confirm(`Supprimer l'utilisateur ${user.first_name} ${user.last_name} ?`)) {
      const token = this.authService.getAccessToken();

      this.http
        .delete(`http://localhost:8001/api/auth/users/${user.id}/delete/`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe({
          next: () => {
            alert('✅ Utilisateur supprimé avec succès');
            this.closeUserMenu();
            this.loadUtilisateurs();
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de la suppression');
          },
        });
    }
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      admin: 'Administrateur',
      candidat: 'Candidat',
      commission: 'Membre Commission',
      responsable_commission: 'Responsable Commission',
    };
    return labels[role] || role;
  }

  // ========================================
  // GESTION OFFRES CONCOURS INGÉNIEUR
  // ========================================
  loadOffresIngenieur(): void {
    this.loadReglementReference();

    const token = this.authService.getAccessToken();
    this.http
      .get<any[]>('http://localhost:8003/api/candidatures/concours/?type_concours=ingenieur', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (items: any[]) => {
          this.concoursIngenieurApiAvailable = true;
          this.offresIngenieurList = (items || []).map((c: any) => ({
            id: c.id,
            backend_id: c.id,
            titre: c.nom,
            specialite: c.description || 'Cycle Ingenieur',
            places: c.places_disponibles,
            date_limite: c.date_cloture,
            statut: c.actif ? 'ouvert' : 'ferme',
            description: c.description || '',
          }));

          if (this.offresIngenieurList.length > 0 && !this.selectedConcoursIdForReglement) {
            this.selectedConcoursIdForReglement =
              this.offresIngenieurList[0].backend_id || this.offresIngenieurList[0].id;
          }
        },
        error: () => {
          this.concoursIngenieurApiAvailable = false;
          // fallback mock si l'API concours n'est pas disponible
          this.offresIngenieurList = [
            {
              id: 1,
              titre: "Concours d'accès - Cycle Ingénieur Génie Logiciel",
              specialite: 'Génie Logiciel',
              places: 50,
              date_limite: '2026-05-31',
              statut: 'ouvert',
              description: 'Concours national pour les titulaires de licence en informatique.',
            },
          ];
          if (!this.selectedConcoursIdForReglement) {
            this.selectedConcoursIdForReglement = this.offresIngenieurList[0].id;
          }
        },
      });

    return;

    this.offresIngenieurList = [
      {
        id: 1,
        titre: "Concours d'accès - Cycle Ingénieur Génie Logiciel",
        specialite: 'Génie Logiciel',
        places: 50,
        date_limite: '2026-05-31',
        statut: 'ouvert',
        description: 'Concours national pour les titulaires de licence en informatique.',
      },
      {
        id: 2,
        titre: "Concours d'accès - Cycle Ingénieur Data & IA",
        specialite: 'Data & IA',
        places: 35,
        date_limite: '2026-06-05',
        statut: 'ferme',
        description: 'Admission sur dossier et entretien pour parcours Data Science.',
      },
    ];
  }

  loadReglementReference(): void {
    this.isLoadingReglement = true;
    this.reglementApplyMessage = '';

    this.http
      .get<ReglementConcoursIngenieur>(
        'http://localhost:8003/api/candidatures/concours/reglement-reference/',
      )
      .subscribe({
        next: (data) => {
          this.hydrateReglementDisplay(data);
          this.isLoadingReglement = false;
        },
        error: (err) => {
          console.error('Erreur chargement règlement:', err);
          this.isLoadingReglement = false;
          this.reglementApplyMessage = 'Impossible de charger le règlement de référence.';
        },
      });
  }

  applyReglementOfficiel(): void {
    if (!this.concoursIngenieurApiAvailable) {
      this.reglementApplyMessage =
        '❌ API concours indisponible: impossible d’appliquer le règlement sur une offre fictive.';
      alert('❌ API concours indisponible. Vérifiez le backend concours puis réessayez.');
      return;
    }

    if (!this.selectedConcoursIdForReglement) {
      alert('Veuillez sélectionner un concours ingénieur à mettre à jour.');
      return;
    }

    this.isApplyingReglement = true;
    this.reglementApplyMessage = '';

    const token = this.authService.getAccessToken();
    const payload = {
      sections_personnalisees: {},
    };

    this.http
      .put(
        `http://localhost:8003/api/candidatures/concours/${this.selectedConcoursIdForReglement}/appliquer-reglement-reference/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: (response: any) => {
          this.hydrateReglementDisplay(response);
          this.isApplyingReglement = false;
          this.reglementApplyMessage = `✅ Règlement officiel appliqué avec succès (${this.chapitresReglement.length} chapitres affichés).`;
          alert('✅ Règlement officiel appliqué au concours.');
        },
        error: (err) => {
          console.error('Erreur application règlement:', err);
          this.isApplyingReglement = false;
          const message = this.extractApiErrorMessage(err);
          this.reglementApplyMessage = `❌ ${message}`;
          alert(`❌ Échec application du règlement: ${message}`);
        },
      });
  }

  private extractApiErrorMessage(err: any): string {
    const statusCode = err?.status ? `HTTP ${err.status}` : 'Erreur reseau';

    const apiMessage =
      err?.error?.error ||
      err?.error?.detail ||
      err?.error?.message ||
      (typeof err?.error === 'string' ? err.error : '');

    if (apiMessage) {
      return `${statusCode}: ${apiMessage}`;
    }

    if (statusCode === 'HTTP 401') {
      return 'HTTP 401: session expirée ou token invalide.';
    }
    if (statusCode === 'HTTP 403') {
      return 'HTTP 403: permission refusée pour ce rôle.';
    }
    if (statusCode === 'HTTP 404') {
      return 'HTTP 404: concours introuvable dans le backend.';
    }

    return `${statusCode}: erreur inconnue côté backend.`;
  }

  private buildChapitresFromReglement(
    data: ReglementConcoursIngenieur | null,
  ): Array<{ key: string; label: string; value: any }> {
    if (!data) return [];

    const rootEntries = Object.entries(data)
      .filter(([k]) => k.startsWith('chapitre_'))
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (rootEntries.length > 0) {
      return rootEntries.map(([key, value]) => ({
        key,
        label: this.prettyChapitreLabel(key),
        value,
      }));
    }

    const nested = data['chapitres'];
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      return Object.entries(nested).map(([key, value]) => ({
        key,
        label: this.prettyChapitreLabel(key),
        value,
      }));
    }

    return [];
  }

  private prettyChapitreLabel(key: string): string {
    return key
      .replaceAll('_', ' ')
      .replace('chapitre', 'Chapitre')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private prettyFieldLabel(key: string): string {
    return key.replaceAll('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private stringifyInline(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => this.stringifyInline(item))
        .filter((item) => !!item)
        .join(', ');
    }

    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `${this.prettyFieldLabel(k)}: ${this.stringifyInline(v)}`)
        .join(' ; ');
    }

    return String(value);
  }

  formatChapitreContent(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }

    if (Array.isArray(value)) {
      return value.map((item, index) => `${index + 1}. ${this.stringifyInline(item)}`).join('\n');
    }

    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `${this.prettyFieldLabel(k)}: ${this.stringifyInline(v)}`)
        .join('\n');
    }

    return String(value);
  }

  private hydrateReglementDisplay(payload: any): void {
    const source = payload?.conditions_admission ?? payload;
    this.reglementReference = source;
    this.chapitresReglement = this.buildChapitresFromReglement(source);
  }

  ajouterOffreIngenieur(): void {
    this.nouvelleOffreIngenieur = {
      id: 0,
      titre: '',
      specialite: '',
      places: 0,
      date_limite: '',
      statut: 'ouvert',
      description: '',
    };
    this.showModalOffreIngenieur = true;
  }

  modifierOffreIngenieur(offre: OffreIngenieur): void {
    this.nouvelleOffreIngenieur = { ...offre };
    this.showModalOffreIngenieur = true;
  }

  fermerModalOffreIngenieur(): void {
    this.showModalOffreIngenieur = false;
  }

  enregistrerOffreIngenieur(): void {
    const item = this.nouvelleOffreIngenieur;
    if (!item.titre || !item.specialite || !item.places || !item.date_limite) {
      alert('❌ Veuillez remplir les champs obligatoires');
      return;
    }

    if (item.id) {
      const idx = this.offresIngenieurList.findIndex((o) => o.id === item.id);
      if (idx !== -1) {
        this.offresIngenieurList[idx] = { ...item };
      }
      alert('✅ Offre mise à jour');
    } else {
      const nextId = this.offresIngenieurList.length
        ? Math.max(...this.offresIngenieurList.map((o) => o.id)) + 1
        : 1;
      this.offresIngenieurList.unshift({ ...item, id: nextId });
      alert('✅ Offre ajoutée');
    }

    this.showModalOffreIngenieur = false;
  }

  toggleStatutOffreIngenieur(offre: OffreIngenieur): void {
    offre.statut = offre.statut === 'ouvert' ? 'ferme' : 'ouvert';
  }

  supprimerOffreIngenieur(offre: OffreIngenieur): void {
    if (!confirm(`Supprimer l'offre "${offre.titre}" ?`)) {
      return;
    }
    this.offresIngenieurList = this.offresIngenieurList.filter((o) => o.id !== offre.id);
  }

  // ========================================
  // GESTION MASTERS
  // ========================================
  ajouterMaster(): void {
    this.nouveauMaster = {
      id: 0,
      nom: '',
      type: 'recherche',
      description: '',
      places: 0,
      date_limite: '',
      statut: 'ouvert',
      specialite: '',
    };
    this.showModalMaster = true;
  }

  enregistrerMaster(): void {
    if (!this.nouveauMaster.nom || !this.nouveauMaster.places || !this.nouveauMaster.date_limite) {
      alert('❌ Veuillez remplir tous les champs obligatoires');
      return;
    }

    this.nouveauMaster.id = Date.now();
    this.mastersList.push({ ...this.nouveauMaster });

    alert('✅ Master ajouté avec succès');
    this.showModalMaster = false;
  }

  fermerModalMaster(): void {
    this.showModalMaster = false;
  }

  modifierMaster(master: Master): void {
    this.nouveauMaster = { ...master };
    this.showModalMaster = true;
  }

  supprimerMaster(master: Master): void {
    if (confirm(`Supprimer le master "${master.nom}" ?`)) {
      const index = this.mastersList.findIndex((m) => m.id === master.id);
      if (index !== -1) {
        this.mastersList.splice(index, 1);
        alert('✅ Master supprimé');
      }
    }
  }

  // ========================================
  // ADMINISTRATION SYSTÈME
  // ========================================
  creerRole(): void {
    alert('Créer un nouveau rôle');
  }

  voirPermissions(role: Role): void {
    alert(`Voir permissions de ${role.nom}`);
  }

  modifierRole(role: Role): void {
    alert(`Modifier ${role.nom}`);
  }

  aPermission(role: Role, permission: Permission): boolean {
    return role.permissions?.includes(permission.id) || false;
  }

  togglePermission(role: Role, permission: Permission): void {
    if (role.est_systeme) {
      alert('❌ Impossible de modifier un rôle système');
      return;
    }

    const token = this.authService.getAccessToken();

    this.http
      .post(
        `http://localhost:8001/api/admin/roles/${role.id}/toggle-permission/`,
        { permission_id: permission.id },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          if (this.aPermission(role, permission)) {
            role.permissions = role.permissions!.filter((p) => p !== permission.id);
          } else {
            role.permissions!.push(permission.id);
          }
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert('❌ Erreur lors de la modification');
        },
      });
  }

  chargerLogs(): void {
    this.loadLogs();
  }

  // ========================================
  // CANDIDATURES
  // ========================================
  voirCandidature(candidature: Candidature): void {
    alert(`Voir détails de la candidature ${candidature.numero}`);
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      selectionne: 'Sélectionné',
      en_attente: 'En attente',
      rejete: 'Rejeté',
      soumis: 'Soumis',
    };
    return labels[statut] || statut;
  }

  // ========================================
  // NAVIGATION PAGES DÉDIÉES
  // ========================================
  allerGestionCommission(): void {
    this.router.navigate(['/admin/gestion-commission']);
  }

  allerGestionConcoursIngenieur(): void {
    this.switchView('concours-ingenieur');
    this.loadReglementReference();
  }

  allerListesSelection(): void {
    this.router.navigate(['/admin/listes-selection']);
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

  // ========================================
  // ADMINISTRATION DU SITE (MATRICE ACTION/RÔLE)
  // ========================================
  loadActionRoleMatrix(): void {
    const token = this.authService.getAccessToken();

    this.http
      .get('http://localhost:8001/api/auth/admin/action-roles/matrix/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          this.actionRoleMatrix = (response.actions || []).map((row: any) => ({
            action_no: row.action_no,
            action_name: row.action_name,
            description: row.description || '',
            roles: {
              candidat: !!row.roles?.candidat,
              commission: !!row.roles?.commission,
              responsable_commission: !!row.roles?.responsable_commission,
              admin: !!row.roles?.admin,
            },
          }));
        },
        error: () => {
          this.actionRoleMatrix = this.buildFallbackActionMatrix();
        },
      });
  }

  buildFallbackActionMatrix(): ActionMatrixRow[] {
    return [
      this.makeActionRow(1, 'Préinscription', { candidat: true }),
      this.makeActionRow(2, 'Dépôt de dossier', { candidat: true }),
      this.makeActionRow(3, 'Consultation de dossier', { candidat: true, commission: true }),
      this.makeActionRow(4, 'Consultation de candidature', { candidat: true, commission: true }),
      this.makeActionRow(5, 'Suivi de candidature', { candidat: true }),
      this.makeActionRow(6, 'Préselection', { commission: true, responsable_commission: true }),
      this.makeActionRow(7, 'Sélection finale', { responsable_commission: true }),
      this.makeActionRow(8, 'Gestion des utilisateurs', { admin: true }),
      this.makeActionRow(9, 'Gestion des masters', { admin: true }),
      this.makeActionRow(10, "Gestion concours d'ingénieur", { admin: true }),
    ];
  }

  makeActionRow(
    no: number,
    name: string,
    enabled: Partial<Record<RoleKey, boolean>>,
    description: string = '',
  ): ActionMatrixRow {
    return {
      action_no: no,
      action_name: name,
      description,
      roles: {
        candidat: !!enabled.candidat,
        commission: !!enabled.commission,
        responsable_commission: !!enabled.responsable_commission,
        admin: !!enabled.admin,
      },
    };
  }

  addAction(): void {
    const actionName = this.newActionName.trim();
    if (!actionName) {
      alert("Le nom d'action est obligatoire");
      return;
    }

    const nextNo = this.actionRoleMatrix.length
      ? Math.max(...this.actionRoleMatrix.map((a) => a.action_no)) + 1
      : 1;

    this.actionRoleMatrix.push({
      action_no: nextNo,
      action_name: actionName,
      description: this.newActionDescription.trim(),
      roles: {
        candidat: !!this.newActionRoles.candidat,
        commission: !!this.newActionRoles.commission,
        responsable_commission: !!this.newActionRoles.responsable_commission,
        admin: !!this.newActionRoles.admin,
      },
    });

    this.newActionName = '';
    this.newActionDescription = '';
    this.newActionRoles = {
      candidat: false,
      commission: false,
      responsable_commission: false,
      admin: false,
    };
  }

  removeAction(actionNo: number): void {
    if (!confirm('Supprimer cette action ?')) {
      return;
    }

    this.actionRoleMatrix = this.actionRoleMatrix.filter((a) => a.action_no !== actionNo);
  }

  toggleRoleForAction(action: ActionMatrixRow, role: RoleKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    action.roles[role] = input.checked;
  }

  toggleNewActionRole(role: RoleKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    this.newActionRoles[role] = input.checked;
  }

  saveActionRoleMatrix(): void {
    if (!this.actionRoleMatrix.length) {
      alert('Ajoutez au moins une action avant de sauvegarder');
      return;
    }

    const token = this.authService.getAccessToken();
    const payload = {
      actions: this.actionRoleMatrix.map((row) => ({
        action_no: row.action_no,
        action_name: row.action_name,
        description: row.description || '',
        roles: row.roles,
      })),
    };

    this.http
      .put('http://localhost:8001/api/auth/admin/action-roles/matrix/update/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (response: any) => {
          alert('✅ Matrice des actions enregistrée avec succès');
          this.actionRoleMatrix = (response.actions || this.actionRoleMatrix).map((row: any) => ({
            action_no: row.action_no,
            action_name: row.action_name,
            description: row.description || '',
            roles: {
              candidat: !!row.roles?.candidat,
              commission: !!row.roles?.commission,
              responsable_commission: !!row.roles?.responsable_commission,
              admin: !!row.roles?.admin,
            },
          }));
        },
        error: (error) => {
          console.error('Erreur sauvegarde matrice:', error);
          alert("❌ Erreur lors de l'enregistrement de la matrice");
        },
      });
  }

  getEnabledRoleLabels(action: ActionMatrixRow): string[] {
    return this.roleColumns.filter((r) => action.roles[r.key]).map((r) => r.label);
  }

  getRoleActions(role: RoleKey): string[] {
    return this.actionRoleMatrix.filter((a) => a.roles[role]).map((a) => a.action_name);
  }

  // ========================================
  // PARAMÈTRES & RAPPORTS
  // ========================================

  genererRapport(): void {
    alert('Générer un rapport');
  }

  exporterDonnees(): void {
    alert('Exporter les données');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
