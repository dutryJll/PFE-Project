import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterLink, Router } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';
import { ToastService } from '../../../services/toast.service';

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
  selectedCandidatureId: number | null = null;
  mastersList: string[] = [
    'Master en Génie Logiciel',
    'Master en Microélectronique',
    'Master en Data Science',
    'Master Ingénierie Instrumentation',
  ];
  specialite: string = '';

  constructor(
    private candidatureService: CandidatureService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const candidatureIdParam = this.route.snapshot.queryParamMap.get('candidatureId');
    this.selectedCandidatureId = candidatureIdParam ? Number(candidatureIdParam) : null;
    this.loadCandidature();
  }

  loadCandidature(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (data: any) => {
        const candidatures = Array.isArray(data) ? data : [];

        if (this.selectedCandidatureId && !Number.isNaN(this.selectedCandidatureId)) {
          this.candidature =
            candidatures.find((c: any) => Number(c?.id) === this.selectedCandidatureId) ?? null;
        }

        if (!this.candidature) {
          this.candidature =
            candidatures.find((c: any) => c.peut_modifier === true) ?? candidatures[0] ?? null;
        }

        if (!this.candidature) {
          this.toastService.show('Aucune candidature trouvée.', 'warning');
          return;
        }

        if (!this.candidature?.peut_modifier) {
          this.toastService.show(
            'Cette candidature ne peut plus être modifiée (délai expiré ou statut verrouillé).',
            'warning',
          );
        }

        const voeuPrincipal = this.candidature?.master_nom;
        this.voeux = voeuPrincipal ? [voeuPrincipal] : [''];
      },
      error: (error: any) => {
        console.error('Erreur:', error);
        this.toastService.show('Impossible de charger votre candidature.', 'error');
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
      this.toastService.show('Aucune candidature trouvée.', 'warning');
      return;
    }

    if (!this.candidature?.peut_modifier) {
      this.toastService.show(
        'Cette candidature ne peut plus être modifiée (délai expiré ou statut verrouillé).',
        'warning',
      );
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
          this.toastService.show('Modifications enregistrées avec succès.', 'success');
          this.router.navigate(['/candidat/dashboard']);
        },
        error: (error: any) => {
          console.error('Erreur sauvegarde candidature:', error);
          const backendMessage = error?.error?.error;
          this.toastService.show(
            backendMessage || 'Erreur lors de la sauvegarde de la candidature.',
            'error',
          );
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
