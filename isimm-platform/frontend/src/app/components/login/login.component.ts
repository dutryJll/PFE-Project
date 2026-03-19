import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  constructor(private router: Router) {}

  goToEspace(type: string) {
    console.log('🔵 Espace sélectionné:', type);

    switch (type) {
      case 'candidat':
        this.router.navigate(['/login-candidat']);
        break;
      case 'commission':
        this.router.navigate(['/login-commission']);
        break;
      case 'admin':
        this.router.navigate(['/login-admin']);
        break;
    }
  }
}
