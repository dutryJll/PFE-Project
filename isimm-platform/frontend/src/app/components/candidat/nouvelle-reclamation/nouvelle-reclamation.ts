import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';
import { AuthService } from '../../../services/auth.service';

interface CandidatureLight {
  id: number;
  master_id?: number;
  master_nom?: string;
}

@Component({
  selector: 'app-nouvelle-reclamation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nouvelle-reclamation.html',
  styleUrl: './nouvelle-reclamation.css',
})
export class NouvelleReclamationComponent implements OnInit {
  mesCandidatures: CandidatureLight[] = [];

  formData: {
    master_id: string;
    objet: string;
    motif: string;
  } = {
    master_id: '',
    objet: '',
    motif: '',
  };

  isSubmitting = false;

  constructor(
    private http: HttpClient,
    private router: Router,
    private candidatureService: CandidatureService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (response: any) => {
        const list = Array.isArray(response) ? response : response?.results || [];
        this.mesCandidatures = list.map((item: any) => ({
          id: Number(item?.id),
          master_id: item?.master_id ?? item?.master,
          master_nom: item?.master_nom ?? item?.master_name ?? 'Master',
        }));
      },
      error: () => {
        this.mesCandidatures = [];
      },
    });
  }

  submit(): void {
    if (this.isSubmitting) {
      return;
    }

    if (!this.formData.master_id || !this.formData.objet || !this.formData.motif.trim()) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.isSubmitting = true;
    const token = this.authService.getAccessToken();

    this.http
      .post(
        'http://localhost:8003/api/reclamations/creer/',
        {
          master_id: Number(this.formData.master_id),
          objet: this.formData.objet,
          motif: this.formData.motif.trim(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: () => {
          alert('Reclamation envoyee avec succes.');
          this.router.navigate(['/candidat/dashboard'], {
            queryParams: { view: 'reclamations' },
          });
        },
        error: () => {
          this.isSubmitting = false;
          alert("Erreur lors de l'envoi de la reclamation.");
        },
      });
  }

  cancel(): void {
    this.router.navigate(['/candidat/dashboard'], {
      queryParams: { view: 'reclamations' },
    });
  }
}
