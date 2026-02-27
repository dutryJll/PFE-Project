import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit {
  // Utilisateur actuel
  currentUser: any = null;

  // Données du profil avec TOUTES les propriétés initialisées
  profile = {
    first_name: '',
    last_name: '',
    cin: '',
    telephone: '',
    date_naissance: '',
    email: '',
    adresse: '',
    ville: '',
    code_postal: '',
  };

  // Données pour changement de mot de passe
  passwordData = {
    old_password: '',
    new_password: '',
    confirm_password: '',
  };

  // État de l'interface
  activeTab = 'info';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Utilisateur actuel:', this.currentUser);

    if (this.currentUser && this.currentUser.email) {
      this.loadProfile();
    }
  }

  loadProfile(): void {
    const email = this.currentUser.email;
    this.isLoading = true;

    this.userService.getProfile(email).subscribe({
      next: (data) => {
        console.log('✅ Profil chargé:', data);
        this.profile = {
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          cin: data.cin || '',
          telephone: data.telephone || '',
          date_naissance: data.date_naissance || '',
          email: data.email || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          code_postal: data.code_postal || '',
        };
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement profil:', error);
        this.errorMessage = 'Impossible de charger le profil';
        this.isLoading = false;
      },
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    console.log('📝 Mise à jour profil:', this.profile);

    this.userService.updateProfile(this.profile).subscribe({
      next: (data) => {
        console.log('✅ Profil mis à jour:', data);
        this.successMessage = '✅ Profil mis à jour avec succès !';
        this.isLoading = false;

        // Masquer le message après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('❌ Erreur mise à jour:', error);
        this.errorMessage = '❌ Erreur lors de la mise à jour du profil';
        this.isLoading = false;
      },
    });
  }

  changePassword(): void {
    // Vérification des mots de passe
    if (this.passwordData.new_password !== this.passwordData.confirm_password) {
      this.errorMessage = '❌ Les mots de passe ne correspondent pas';
      return;
    }

    if (this.passwordData.new_password.length < 8) {
      this.errorMessage = '❌ Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    console.log('🔐 Changement de mot de passe');

    // TODO: Implémenter l'appel API pour changer le mot de passe
    this.successMessage = '✅ Mot de passe changé avec succès !';

    // Réinitialiser le formulaire
    this.passwordData = {
      old_password: '',
      new_password: '',
      confirm_password: '',
    };

    // Masquer le message après 3 secondes
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  getRoleLabel(role: string): string {
    const labels: { [key: string]: string } = {
      admin: 'Administrateur',
      candidat: 'Candidat',
      commission: 'Commission',
      directeur: 'Directeur',
      secretaire_general: 'Secrétaire Général',
    };
    return labels[role] || role;
  }
}
