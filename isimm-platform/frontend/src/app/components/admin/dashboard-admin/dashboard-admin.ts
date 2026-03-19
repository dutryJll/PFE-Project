import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

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

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrl: './dashboard-admin.css',
})
export class DashboardAdminComponent implements OnInit {
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
  mastersList: Master[] = [];
  candidaturesList: Candidature[] = [];

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

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.profileData = { ...this.currentUser };
    this.loadStats();
    this.loadUtilisateurs();
    this.loadMasters();
    this.loadCandidatures();
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
      utilisateurs: 'Gestion des utilisateurs',
      masters: 'Gestion des Masters',
      commission: 'Gestion de la commission',
      listes: 'Listes de sélection',
      candidatures: 'Toutes les candidatures',
      parametres: 'Paramètres système',
      rapports: 'Rapports et statistiques',
      profil: 'Mon Profil',
    };
    return titles[this.currentView] || 'Tableau de bord';
  }

  // ========================================
  // CHARGEMENT DONNÉES
  // ========================================
  loadStats(): void {
    const token = this.authService.getAccessToken();

    // Charger utilisateurs pour stats
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
          // Données par défaut si erreur
          this.statsData.totalUsers = 1245;
          this.statsData.membresCommission = 45;
        },
      });

    // Stats candidatures (données fictives pour le moment)
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
          // Données fictives si erreur
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
    // Données fictives pour le moment
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
      {
        id: 3,
        nom: 'Master Recherche Microélectronique',
        type: 'recherche',
        description: 'Formation en microélectronique avancée',
        places: 20,
        date_limite: '2026-03-25',
        statut: 'ouvert',
        specialite: 'Électronique',
      },
    ];
  }

  loadCandidatures(): void {
    // Données fictives pour le moment
    this.candidaturesList = [
      {
        id: 1,
        numero: 'CAND-2026-001',
        candidat_nom: 'Ahmed Ben Ali',
        candidat_email: 'ahmed@example.com',
        master_nom: 'Master Génie Logiciel',
        specialite: 'Informatique',
        score: 16.5,
        statut: 'accepte',
        date_soumission: '2026-02-15',
      },
      {
        id: 2,
        numero: 'CAND-2026-002',
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

  // ========================================
  // GESTION UTILISATEURS
  // ========================================
  nouvelUtilisateur(): void {
    alert('Créer un nouvel utilisateur');
    // TODO: Ouvrir modal création utilisateur
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

    // TODO: Appel API pour créer le master
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
  // GESTION CANDIDATURES
  // ========================================
  voirCandidature(candidature: Candidature): void {
    alert(`Voir détails de la candidature ${candidature.numero}`);
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      accepte: 'Accepté',
      en_attente: 'En attente',
      rejete: 'Rejeté',
      en_cours: 'En cours',
    };
    return labels[statut] || statut;
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
  // PARAMÈTRES
  // ========================================
  sauvegarderParametres(): void {
    alert('Sauvegarder les paramètres système');
  }

  // ========================================
  // RAPPORTS
  // ========================================
  genererRapport(): void {
    alert('Générer un rapport');
  }

  exporterDonnees(): void {
    alert('Exporter les données');
  }

  // ========================================
  // DÉCONNEXION
  // ========================================
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  // ========================================
  // NAVIGATION VERS PAGES DÉDIÉES
  // ========================================
  allerGestionCommission(): void {
    this.router.navigate(['/admin/gestion-commission']);
  }

  allerListesSelection(): void {
    this.router.navigate(['/admin/listes-selection']);
  }
}
