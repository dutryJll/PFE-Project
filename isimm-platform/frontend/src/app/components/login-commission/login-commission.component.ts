import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-commission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-commission.component.html',
  styleUrl: './login-commission.component.css',
})
export class LoginCommissionComponent {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onLogin() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Le username peut être l'email
    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        console.log('✅ Connexion commission:', response);
        this.isLoading = false;

        const userRole = response.user.role.toLowerCase();

        if (userRole === 'commission' || userRole === 'responsable_commission') {
          this.router.navigate(['/commission/dashboard']);
        } else {
          this.errorMessage =
            "Ce compte n'est pas un compte commission. Veuillez contacter l'administrateur.";
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Identifiants incorrects. Vérifiez vos informations reçues par email.';
      },
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
