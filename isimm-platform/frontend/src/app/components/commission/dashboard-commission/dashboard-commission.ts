import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface Candidature {
  id: number;
  candidat_nom: string;
  candidat_email: string;
  specialite: string;
  score: number;
  dossier_depose: boolean;
  statut: string;
  avis?: string;
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

@Component({
  selector: 'app-dashboard-commission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-commission.html',
  styleUrl: './dashboard-commission.css',
})
export class DashboardCommissionComponent implements OnInit {
  currentView: string = 'dashboard';
  currentUser: any = null;
  currentDate: Date = new Date();
  isResponsable: boolean = false;

  // Filtres
  filtreSpecialite: 'actuel' | 'ancien' = 'actuel';
  filtreSpecialiteActive: string = '';
  filtreStatut: string = '';
  typeListe: 'preselection' | 'selection' = 'preselection';

  // Profil
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
      candidat_nom: 'Ahmed Ben Ali',
      candidat_email: 'ahmed@example.com',
      specialite: 'Master Génie Logiciel',
      score: 16.5,
      dossier_depose: true,
      statut: 'en_attente',
      avis: 'Très bon dossier',
    },
    {
      id: 2,
      candidat_nom: 'Fatma Gharbi',
      candidat_email: 'fatma@example.com',
      specialite: 'Master Data Science',
      score: 17.2,
      dossier_depose: true,
      statut: 'en_attente',
    },
    {
      id: 3,
      candidat_nom: 'Mohamed Trabelsi',
      candidat_email: 'mohamed@example.com',
      specialite: 'Master Génie Logiciel',
      score: 15.8,
      dossier_depose: false,
      statut: 'en_cours',
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

  // Modal avis
  showModalAvis: boolean = false;
  candidatureSelectionnee: Candidature | null = null;
  avisText: string = '';
  avisRecommandation: string = 'favorable';

  // Modal OCR
  showModalOCR: boolean = false;
  dossierOCRSelectionne: DossierOCR | null = null;
  fichierOCR: File | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };
    this.isResponsable = this.currentUser?.role === 'responsable_commission';
  }

  // ========================================
  // GETTERS POUR FILTRES
  // ========================================
  get candidaturesAvecDossier(): Candidature[] {
    return this.candidatures.filter((c) => c.dossier_depose);
  }

  get nbDossiersDeposes(): number {
    return this.candidatures.filter((c) => c.dossier_depose).length;
  }

  // ========================================
  // NAVIGATION
  // ========================================
  switchView(view: string): void {
    this.currentView = view;
  }

  getViewTitle(): string {
    const titles: any = {
      dashboard: 'Tableau de bord',
      profil: 'Mon Profil',
      specialites: 'Mes Spécialités',
      candidatures: 'Gestion des candidatures',
      'valider-dossier': 'Valider les dossiers',
      dossiers: 'Tous les dossiers',
      listes: 'Gestion des listes',
      membres: 'Membres commission',
      ocr: 'Analyser avec OCR',
      reclamations: 'Traiter les réclamations',
      inscriptions: 'Gérer les inscriptions',
      statistiques: 'Statistiques',
    };
    return titles[this.currentView] || 'Tableau de bord';
  }

  // ========================================
  // SPÉCIALITÉS
  // ========================================
  getSpecialitesFiltrees(): Specialite[] {
    return this.specialites.filter((s) => s.statut === this.filtreSpecialite);
  }

  consulterSpecialite(spec: Specialite): void {
    this.filtreSpecialiteActive = spec.id.toString();
    this.switchView('candidatures');
  }

  // ========================================
  // CANDIDATURES
  // ========================================
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

  voirDossier(candidature: Candidature): void {
    if (!candidature.dossier_depose) {
      alert('❌ Aucun dossier déposé pour cette candidature');
      return;
    }
    alert(`Voir le dossier de ${candidature.candidat_nom}`);
  }

  // ========================================
  // MODAL AVIS
  // ========================================
  ouvrirModalAvis(candidature: Candidature): void {
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

  // ========================================
  // LISTES (RESPONSABLE)
  // ========================================
  getListesByType(): Liste[] {
    return this.listes.filter((l) => l.type === this.typeListe);
  }

  nouvelleListe(type: 'preselection' | 'selection'): void {
    alert(`Créer une nouvelle liste de ${type}`);
  }

  modifierListe(liste: Liste): void {
    alert(`Modifier la liste: ${liste.nom}`);
  }

  exporterListe(liste: Liste): void {
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
            alert(`❌ Erreur lors de l'archivage`);
          },
        });
    }
  }

  // ========================================
  // OCR (RESPONSABLE)
  // ========================================
  ouvrirModalOCR(dossier?: DossierOCR): void {
    this.dossierOCRSelectionne = dossier || null;
    this.fichierOCR = null;
    this.showModalOCR = true;
  }

  fermerModalOCR(): void {
    this.showModalOCR = false;
    this.dossierOCRSelectionne = null;
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
  // RÉCLAMATIONS (RESPONSABLE)
  // ========================================
  traiterReclamation(reclamation: Reclamation): void {
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
        next: (response) => {
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
  // DÉCONNEXION
  // ========================================
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
