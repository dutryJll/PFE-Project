import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login-candidat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslatePipe],
  templateUrl: './login-candidat.component.html',
  styleUrl: './login-candidat.component.css',
})
export class LoginCandidatComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onLogin() {
    if (!this.email || !this.password) {
      this.errorMessage = 'login.candidat.error.fill';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('✅ Connexion candidat:', response);
        this.isLoading = false;

        const userRole = response.user.role.toLowerCase();

        if (userRole === 'candidat') {
          // Vérifier si le candidat a une candidature
          // TODO: Appeler l'API pour vérifier
          this.router.navigate(['/candidat/dashboard']);
        } else {
          this.errorMessage = 'login.candidat.error.role';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'login.candidat.error.invalid';
      },
    });
  }

  goToPostulation() {
    this.router.navigate(['/choisir-candidature']);
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
