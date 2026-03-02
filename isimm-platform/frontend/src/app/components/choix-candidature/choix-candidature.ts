import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-choix-candidature',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './choix-candidature.html',
  styleUrls: ['./choix-candidature.css'],
})
export class ChoixCandidatureComponent {
  constructor(private router: Router) {}

  choisirType(type: string): void {
    console.log(`✅ Type choisi: ${type}`);

    // Rediriger vers le formulaire avec le type en paramètre
    this.router.navigate(['/candidature'], {
      queryParams: { type: type }, // 'master' ou 'ingenieur'
    });
  }
}
