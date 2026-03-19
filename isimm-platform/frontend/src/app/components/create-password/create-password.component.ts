import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-create-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-password-page">
      <div class="create-password-container">
        <div class="card">
          <div class="icon">🔐</div>
          <h1>Créer votre mot de passe</h1>
          <p class="subtitle">Bienvenue sur la plateforme ISIMM</p>

          <div *ngIf="!tokenValid" class="error-box">
            <i class="fas fa-exclamation-triangle"></i>
            <p>Ce lien est invalide ou a expiré.</p>
            <button (click)="goToLogin()">Retour à la connexion</button>
          </div>

          <form *ngIf="tokenValid" (ngSubmit)="createPassword()">
            <div class="form-group">
              <label>Nouveau mot de passe *</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                placeholder="Minimum 8 caractères"
                required
              />
              <div class="password-strength">
                <div
                  class="strength-bar"
                  [class.weak]="passwordStrength === 'weak'"
                  [class.medium]="passwordStrength === 'medium'"
                  [class.strong]="passwordStrength === 'strong'"
                ></div>
                <small>{{ passwordStrengthText }}</small>
              </div>
            </div>

            <div class="form-group">
              <label>Confirmer le mot de passe *</label>
              <input
                type="password"
                [(ngModel)]="confirmPassword"
                name="confirmPassword"
                placeholder="Retapez votre mot de passe"
                required
              />
            </div>

            <div class="info-box">
              <i class="fas fa-info-circle"></i>
              <ul>
                <li>Au moins 8 caractères</li>
                <li>Mélangez majuscules, minuscules et chiffres</li>
                <li>Utilisez des caractères spéciaux (recommandé)</li>
              </ul>
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading">
              {{ loading ? 'Création en cours...' : '✅ Créer mon mot de passe' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .create-password-page {
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
      }

      .create-password-container {
        width: 100%;
        max-width: 500px;
      }

      .card {
        background: white;
        border-radius: 20px;
        padding: 3rem;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      }

      .icon {
        font-size: 4rem;
        text-align: center;
        margin-bottom: 1rem;
      }

      h1 {
        text-align: center;
        color: #1f2937;
        margin: 0 0 0.5rem 0;
        font-size: 1.8rem;
      }

      .subtitle {
        text-align: center;
        color: #6b7280;
        margin: 0 0 2rem 0;
      }

      .form-group {
        margin-bottom: 1.5rem;
      }

      label {
        display: block;
        margin-bottom: 0.5rem;
        color: #374151;
        font-weight: 600;
      }

      input {
        width: 100%;
        padding: 0.875rem;
        border: 2px solid #e5e7eb;
        border-radius: 10px;
        font-size: 1rem;
        transition: border 0.3s;
      }

      input:focus {
        outline: none;
        border-color: #667eea;
      }

      .password-strength {
        margin-top: 0.5rem;
      }

      .strength-bar {
        height: 4px;
        border-radius: 2px;
        background: #e5e7eb;
        transition: all 0.3s;
      }

      .strength-bar.weak {
        width: 33%;
        background: #ef4444;
      }

      .strength-bar.medium {
        width: 66%;
        background: #f59e0b;
      }

      .strength-bar.strong {
        width: 100%;
        background: #10b981;
      }

      small {
        display: block;
        margin-top: 0.25rem;
        color: #6b7280;
        font-size: 0.85rem;
      }

      .info-box {
        background: #eff6ff;
        border-left: 4px solid #3b82f6;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
      }

      .info-box i {
        color: #3b82f6;
        margin-right: 0.5rem;
      }

      .info-box ul {
        margin: 0.5rem 0 0 0;
        padding-left: 1.5rem;
        color: #1e40af;
      }

      .info-box li {
        margin-bottom: 0.25rem;
      }

      .error-box {
        background: #fee2e2;
        border: 2px solid #ef4444;
        border-radius: 10px;
        padding: 1.5rem;
        text-align: center;
      }

      .error-box i {
        font-size: 3rem;
        color: #ef4444;
        margin-bottom: 1rem;
      }

      .error-box p {
        color: #991b1b;
        font-weight: 600;
        margin-bottom: 1rem;
      }

      .btn-submit {
        width: 100%;
        padding: 1rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
      }

      .btn-submit:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(16, 185, 129, 0.4);
      }

      .btn-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    `,
  ],
})
export class CreatePasswordComponent implements OnInit {
  token: string = '';
  password: string = '';
  confirmPassword: string = '';
  tokenValid: boolean = true;
  loading: boolean = false;
  passwordStrength: 'weak' | 'medium' | 'strong' = 'weak';
  passwordStrengthText: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.params['token'];
    if (!this.token) {
      this.tokenValid = false;
    }
  }

  createPassword(): void {
    if (this.password !== this.confirmPassword) {
      alert('❌ Les mots de passe ne correspondent pas');
      return;
    }

    if (this.password.length < 8) {
      alert('❌ Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    this.loading = true;

    this.http
      .post(`http://localhost:8001/api/auth/set-password/${this.token}/`, {
        password: this.password,
        confirm_password: this.confirmPassword,
      })
      .subscribe({
        next: (response: any) => {
          alert(`✅ ${response.message}`);
          this.router.navigate(['/login-commission']);
        },
        error: (error) => {
          console.error('Erreur:', error);
          alert(`❌ ${error.error?.error || 'Erreur lors de la création du mot de passe'}`);
          this.loading = false;
        },
      });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
