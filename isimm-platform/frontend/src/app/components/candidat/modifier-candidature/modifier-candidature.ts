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
        const candidatures = Array.isArray(data) ? data : [];
        this.candidature =
          candidatures.find((c: any) => c.peut_modifier === true) ?? candidatures[0] ?? null;

        const voeuPrincipal = this.candidature?.master_nom;
        this.voeux = voeuPrincipal ? [voeuPrincipal] : [''];
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
    if (!this.candidature?.id) {
      alert('❌ Aucune candidature trouvée.');
      return;
    }

    if (!this.candidature?.peut_modifier) {
      alert('❌ Cette candidature ne peut plus être modifiée (délai expiré ou statut verrouillé).');
      return;
    }

    const firstNonEmptyIndex = this.voeux.findIndex((v) => !!v && v.trim().length > 0);
    const choixPriorite = firstNonEmptyIndex >= 0 ? firstNonEmptyIndex + 1 : 1;

    this.candidatureService
      .updateCandidature(this.candidature.id, {
        choix_priorite: choixPriorite,
      })
      .subscribe({
        next: () => {
          alert('✅ Modifications enregistrées avec succès.');
          this.router.navigate(['/candidat/dashboard']);
        },
        error: (error: any) => {
          console.error('Erreur sauvegarde candidature:', error);
          const backendMessage = error?.error?.error;
          alert(`❌ Erreur lors de la sauvegarde.${backendMessage ? `\n${backendMessage}` : ''}`);
        },
      });
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
