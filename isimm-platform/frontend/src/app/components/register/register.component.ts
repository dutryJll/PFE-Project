import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
})
export class RegisterComponent {
  formData = {
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    role: 'candidat',
  };

  errorMessage: string = '';
  successMessage: string = '';
  isLoading: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  onRegister() {
    // Validation
    if (
      !this.formData.email ||
      !this.formData.username ||
      !this.formData.first_name ||
      !this.formData.last_name ||
      !this.formData.password ||
      !this.formData.password2
    ) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    if (this.formData.password !== this.formData.password2) {
      this.errorMessage = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (this.formData.password.length < 8) {
      this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.register(this.formData).subscribe({
      next: (response) => {
        console.log('Inscription réussie', response);
        this.successMessage = 'Inscription réussie ! Redirection vers la connexion...';

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        if (error.error?.email) {
          this.errorMessage = 'Cet email est déjà utilisé';
        } else if (error.error?.username) {
          this.errorMessage = "Ce nom d'utilisateur est déjà utilisé";
        } else {
          this.errorMessage = "Une erreur est survenue lors de l'inscription";
        }
        console.error("Erreur d'inscription", error);
      },
    });
  }
}
