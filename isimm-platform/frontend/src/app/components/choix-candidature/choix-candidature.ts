import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface ReferentielMasters {
  sections_masters?: Record<string, any>;
  [key: string]: any;
}

@Component({
  selector: 'app-choix-candidature',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './choix-candidature.html',
  styleUrls: ['./choix-candidature.css'],
})
export class ChoixCandidatureComponent {
  referentielMasters: ReferentielMasters | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
  ) {
    this.loadReferentielMasters();
  }

  loadReferentielMasters(): void {
    this.http
      .get<ReferentielMasters>(
        'http://localhost:8003/api/candidatures/masters/reglement-reference/',
      )
      .subscribe({
        next: (data) => {
          this.referentielMasters = data;
        },
        error: (err) => {
          console.error('Erreur chargement référentiel dans choix candidature:', err);
        },
      });
  }

  getTotalPlaces(code: string): number | null {
    const total = this.referentielMasters?.sections_masters?.[code]?.capacites?.total;
    return typeof total === 'number' ? total : null;
  }

  choisirType(type: string): void {
    console.log(`✅ Type choisi: ${type}`);

    // Rediriger vers le formulaire avec le type en paramètre
    this.router.navigate(['/candidature'], {
      queryParams: { type: type }, // 'master' ou 'ingenieur'
    });
  }
}
