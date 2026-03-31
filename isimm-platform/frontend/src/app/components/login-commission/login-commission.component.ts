import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-login-commission',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
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
      this.errorMessage = 'login.com.error.fill';
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
          this.errorMessage = 'login.com.error.role';
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'login.com.error.invalid';
      },
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
