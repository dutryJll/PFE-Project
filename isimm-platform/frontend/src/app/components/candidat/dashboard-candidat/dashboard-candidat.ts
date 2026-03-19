import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface Candidature {
  numero: string;
  master_nom: string;
  statut: string;
  date_soumission: string;
  etat_candidature: string;
  dossier_valide: boolean;
  date_depot_dossier: string;
  dossier_depose: boolean;
  score?: number;
  classement?: string;
  total_candidats?: number;
}

interface Master {
  id: number;
  nom: string;
  type: string;
  description: string;
  date_limite: string;
  places: number;
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
  objet: string;
  motif: string;
  master_nom: string;
  date: string;
  statut: string;
  reponse?: string;
}

interface FichierHistorique {
  nom: string;
  date: string;
  id: number;
}

interface HistoriqueItem {
  titre: string;
  description: string;
  date: string;
  color: string;
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
  currentView: string = 'dashboard';
  currentDate: Date = new Date();

  // Alerte
  showAlert: boolean = true;

  // Candidatures
  mesCandidatures: Candidature[] = [
    {
      numero: 'CAND-2026-001',
      master_nom: 'Master Recherche Génie Logiciel',
      statut: 'accepte',
      date_soumission: '2026-02-15',
      etat_candidature: 'Accepté',
      dossier_valide: true,
      date_depot_dossier: '2026-02-20',
      dossier_depose: true,
      score: 16.5,
      classement: '3',
      total_candidats: 45,
    },
    {
      numero: 'CAND-2026-002',
      master_nom: 'Master Professionnel Data Science',
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
      numero: 'CAND-2026-003',
      master_nom: 'Master Recherche Microélectronique',
      statut: 'en_cours',
      date_soumission: '2026-02-16',
      etat_candidature: 'En cours',
      dossier_valide: false,
      date_depot_dossier: '',
      dossier_depose: false,
    },
  ];

  // Masters ouverts
  mastersOuverts: Master[] = [
    {
      id: 1,
      nom: 'Master Réseaux et Télécommunications',
      type: 'professionnel',
      description: 'Formation axée sur les réseaux modernes et les télécommunications',
      date_limite: '2026-03-30',
      places: 25,
    },
    {
      id: 2,
      nom: 'Master Intelligence Artificielle',
      type: 'recherche',
      description: 'Spécialisation en IA et apprentissage automatique',
      date_limite: '2026-04-15',
      places: 20,
    },
  ];

  // Documents
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

  // Réclamations
  reclamations: Reclamation[] = [
    {
      id: 1,
      objet: 'Score non mis à jour',
      motif: "Mon score n'apparaît pas pour la candidature Master GL",
      master_nom: 'Master Génie Logiciel',
      date: '2026-02-25',
      statut: 'en_cours',
      reponse: undefined,
    },
  ];

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

  // Fichiers
  fichierInscription: File | null = null;
  fichiersHistorique: FichierHistorique[] = [
    { id: 1, nom: 'fiche_inscription_2026.pdf', date: '15/02/2026' },
    { id: 2, nom: 'releve_notes.pdf', date: '16/02/2026' },
  ];

  // Historique
  historique: HistoriqueItem[] = [
    {
      titre: 'Candidature acceptée',
      description: 'Votre candidature pour Master GL a été acceptée',
      date: '20/02/2026',
      color: '#10b981',
    },
    {
      titre: 'Dossier déposé',
      description: 'Vous avez déposé votre dossier complet',
      date: '18/02/2026',
      color: '#3b82f6',
    },
    {
      titre: 'Candidature soumise',
      description: 'Candidature Master GL soumise avec succès',
      date: '15/02/2026',
      color: '#8b5cf6',
    },
  ];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };
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
      'masters-ouverts': 'Masters Ouverts',
      candidatures: 'Mes Candidatures',
      'mon-dossier': 'Mon Dossier',
      reclamations: 'Mes Réclamations',
      importer: 'Importer un fichier',
      historique: 'Historique',
    };
    return titles[this.currentView] || 'Tableau de bord';
  }

  // ========================================
  // ALERTES
  // ========================================
  closeAlert(): void {
    this.showAlert = false;
  }

  // ========================================
  // STATS
  // ========================================
  countByStatut(statut: string): number {
    return this.mesCandidatures.filter((c) => c.statut === statut).length;
  }

  get documentsDeposes(): number {
    return this.documentsRequis.filter((d) => d.depose).length;
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      accepte: 'Accepté',
      en_attente: 'En attente',
      en_cours: 'En cours',
      rejete: 'Rejeté',
    };
    return labels[statut] || statut;
  }

  // ========================================
  // MASTERS OUVERTS
  // ========================================
  dejaCandidature(masterId: number): boolean {
    const master = this.mastersOuverts.find((m) => m.id === masterId);
    if (!master) return false;
    return this.mesCandidatures.some((c) => c.master_nom === master.nom);
  }

  postuler(master: Master): void {
    if (this.dejaCandidature(master.id)) {
      alert('Vous avez déjà candidaté pour ce master');
      return;
    }

    if (confirm(`Postuler pour ${master.nom} ?`)) {
      const token = this.authService.getAccessToken();

      this.http
        .post(
          'http://localhost:8003/api/candidatures/create/',
          { master_id: master.id },
          { headers: { Authorization: `Bearer ${token}` } },
        )
        .subscribe({
          next: (response: any) => {
            alert('✅ Candidature soumise avec succès !');
            this.mesCandidatures.push({
              numero: response.numero,
              master_nom: master.nom,
              statut: 'en_cours',
              date_soumission: new Date().toISOString(),
              etat_candidature: 'En cours',
              dossier_valide: false,
              date_depot_dossier: '',
              dossier_depose: false,
            });
            this.switchView('candidatures');
          },
          error: (error) => {
            console.error('Erreur:', error);
            alert('❌ Erreur lors de la soumission');
          },
        });
    }
  }

  // ========================================
  // CANDIDATURES
  // ========================================
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
    this.switchView('masters-ouverts');
  }

  // ========================================
  // DOCUMENTS
  // ========================================
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

  // ========================================
  // RÉCLAMATIONS
  // ========================================
  nouvelleReclamation(): void {
    alert('Créer une nouvelle réclamation');
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
  // UPLOAD FICHIER
  // ========================================
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

  // ========================================
  // DÉCONNEXION
  // ========================================
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
