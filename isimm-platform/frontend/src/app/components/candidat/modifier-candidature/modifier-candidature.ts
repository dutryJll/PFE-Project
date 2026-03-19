import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';

@Component({
  selector: 'app-modifier-candidature',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './modifier-candidature.html',
  styleUrl: './modifier-candidature.css',
})
export class ModifierCandidatureComponent implements OnInit {
  candidature: any = null;
  voeux: string[] = [];
  mastersList: string[] = [
    'Master en Génie Logiciel',
    'Master en Microélectronique',
    'Master en Data Science',
    'Master Ingénierie Instrumentation',
  ];
  specialite: string = '';

  constructor(
    private candidatureService: CandidatureService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCandidature();
  }

  loadCandidature(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (data: any) => {
        this.candidature = data[0];
        this.voeux = this.candidature?.voeux || [];
      },
      error: (error: any) => {
        console.error('Erreur:', error);
      },
    });
  }

  ajouterVoeu(): void {
    this.voeux.push('');
  }

  supprimerVoeu(index: number): void {
    this.voeux.splice(index, 1);
  }

  sauvegarder(): void {
    console.log('Sauvegarde des vœux:', this.voeux);
    // TODO: Appel API pour sauvegarder
    this.router.navigate(['/candidat/dashboard']);
  }

  getStatutClass(statut: string): string {
    const classes: { [key: string]: string } = {
      'En attente': 'badge-pending',
      Approuvée: 'badge-approved',
      Rejetée: 'badge-rejected',
      'En examen': 'badge-reviewing',
    };
    return classes[statut] || 'badge-default';
  }
}
