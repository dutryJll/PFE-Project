import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  selectedRole: string = 'candidat';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    console.log('🔵 LoginComponent initialized');
  }

  onLogin() {
    console.log('🔵 onLogin called');
    console.log('📧 Email:', this.email);
    console.log('🎭 Selected Role:', this.selectedRole);

    if (!this.email || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('✅ Connexion réussie', response);
        console.log('👤 User role:', response.user.role);

        this.isLoading = false;

        const userRole = response.user.role.toLowerCase();
        const selectedRole = this.selectedRole.toLowerCase();

        // ✅ VÉRIFICATION : Le rôle sélectionné doit correspondre au rôle réel
        if (userRole !== selectedRole) {
          this.errorMessage = `Erreur : Vous avez sélectionné "${this.selectedRole}" mais votre compte est "${response.user.role}". Veuillez sélectionner le bon rôle.`;
          return;
        }

        console.log('🔄 Redirection en cours pour le rôle:', userRole);

        const adminRoles = ['admin', 'commission', 'directeur', 'secretaire_general'];

        setTimeout(() => {
          if (adminRoles.includes(userRole)) {
            console.log('➡️ Redirection vers /admin');
            this.router.navigate(['/admin'], { replaceUrl: true });
          } else {
            console.log('➡️ Redirection vers /dashboard');
            this.router.navigate(['/dashboard'], { replaceUrl: true });
          }
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Email ou mot de passe incorrect';
        console.error('❌ Erreur de connexion', error);
      },
    });
  }
}
