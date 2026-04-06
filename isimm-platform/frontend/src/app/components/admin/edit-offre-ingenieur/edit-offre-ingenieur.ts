import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

interface OffreIngenieurForm {
  id: number;
  titre: string;
  specialite: string;
  places: number;
  date_ouverture: string;
  date_limite: string;
  statut: 'ouvert' | 'ferme';
  description: string;
  document_officiel_pdf_url?: string | null;
}

@Component({
  selector: 'app-edit-offre-ingenieur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-offre-ingenieur.html',
  styleUrl: './edit-offre-ingenieur.css',
})
export class EditOffreIngenieurComponent implements OnInit {
  offreId: number | null = null;
  isCreateMode = false;
  isLoading = false;
  isSaving = false;
  errorMessage = '';
  successMessage = '';
  selectedPdfFile: File | null = null;

  offreForm: OffreIngenieurForm = {
    id: 0,
    titre: '',
    specialite: '',
    places: 0,
    date_ouverture: '',
    date_limite: '',
    statut: 'ouvert',
    description: '',
    document_officiel_pdf_url: null,
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    if (!rawId) {
      this.isCreateMode = true;
      const today = new Date().toISOString().split('T')[0];
      this.offreForm = {
        id: 0,
        titre: '',
        specialite: '',
        places: 0,
        date_ouverture: today,
        date_limite: '',
        statut: 'ouvert',
        description: '',
        document_officiel_pdf_url: null,
      };
      return;
    }

    const id = Number(rawId);
    if (!id || Number.isNaN(id)) {
      this.errorMessage = 'Identifiant offre invalide.';
      return;
    }

    this.offreId = id;
    this.loadOffre();
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard'], { queryParams: { view: 'concours-ingenieur' } });
  }

  loadOffre(): void {
    if (!this.offreId) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http
      .get<any[]>('http://localhost:8003/api/candidatures/concours/?type_concours=ingenieur')
      .subscribe({
        next: (concours) => {
          const item = (concours || []).find((c) => Number(c.id) === this.offreId);
          if (!item) {
            this.errorMessage = 'Offre introuvable.';
            this.isLoading = false;
            return;
          }

          this.offreForm = {
            id: Number(item.id),
            titre: item.nom || '',
            specialite: item.conditions_admission?.specialite || item.description || '',
            places: Number(item.places_disponibles ?? 0),
            date_ouverture: item.date_ouverture || '',
            date_limite: item.date_cloture || '',
            statut: item.actif ? 'ouvert' : 'ferme',
            description: item.description || '',
            document_officiel_pdf_url: item.document_officiel_pdf_url || null,
          };

          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = "Erreur lors du chargement de l'offre.";
          this.isLoading = false;
        },
      });
  }

  saveOffre(): void {
    if (this.isSaving) {
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      this.errorMessage = 'Session invalide. Veuillez vous reconnecter.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      nom: this.offreForm.titre,
      specialite: this.offreForm.specialite,
      description: this.offreForm.description || this.offreForm.specialite,
      type_concours: 'ingenieur',
      places_disponibles: this.offreForm.places,
      date_ouverture: this.offreForm.date_ouverture,
      date_cloture: this.offreForm.date_limite,
      actif: this.offreForm.statut === 'ouvert',
    };

    if (this.selectedPdfFile && !this.isCreateMode) {
      this.saveOffreWithPdf(payload);
      return;
    }

    if (this.isCreateMode) {
      this.http
        .post('http://localhost:8003/api/candidatures/concours/admin/', payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .subscribe({
          next: (created: any) => {
            this.successMessage = 'Offre ingénieur ajoutée avec succès.';
            if (this.selectedPdfFile && created?.id) {
              this.uploadPdfAfterCreate(Number(created.id));
              return;
            }
            this.isSaving = false;
            const newId = Number(created?.id);
            if (newId) {
              this.router.navigate(['/admin/offres-ingenieur', newId, 'edit']);
            }
          },
          error: (error) => {
            this.errorMessage =
              error?.error?.error || "Erreur lors de l'ajout de l'offre ingénieur.";
            this.isSaving = false;
          },
        });
      return;
    }

    if (!this.offreId) {
      this.errorMessage = 'Identifiant offre invalide.';
      this.isSaving = false;
      return;
    }

    this.http
      .patch(`http://localhost:8003/api/candidatures/concours/${this.offreId}/admin/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          this.successMessage = 'Offre ingénieur modifiée avec succès.';
          this.isSaving = false;
          this.selectedPdfFile = null;
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.error || "Erreur lors de la modification de l'offre ingénieur.";
          this.isSaving = false;
        },
      });
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      this.selectedPdfFile = null;
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.errorMessage = 'Seuls les fichiers PDF sont acceptés.';
      this.selectedPdfFile = null;
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Fichier trop volumineux (max 10 MB).';
      this.selectedPdfFile = null;
      return;
    }

    this.errorMessage = '';
    this.selectedPdfFile = file;
  }

  private saveOffreWithPdf(payload: any): void {
    if (!this.offreId || !this.selectedPdfFile) {
      this.errorMessage = 'Impossible de televerser le PDF pour cette offre.';
      this.isSaving = false;
      return;
    }

    const token = this.authService.getAccessToken();
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, String(value ?? ''));
    });
    formData.append('document_officiel_pdf', this.selectedPdfFile);

    this.http
      .patch(`http://localhost:8003/api/candidatures/concours/${this.offreId}/admin/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (updated: any) => {
          this.successMessage = 'Offre ingénieur modifiée avec succès (PDF inclus).';
          this.offreForm.document_officiel_pdf_url = updated?.document_officiel_pdf_url || null;
          this.selectedPdfFile = null;
          this.isSaving = false;
        },
        error: (error) => {
          this.errorMessage =
            error?.error?.error || "Erreur lors de la sauvegarde de l'offre ingénieur.";
          this.isSaving = false;
        },
      });
  }

  private uploadPdfAfterCreate(concoursId: number): void {
    if (!this.selectedPdfFile) {
      this.isSaving = false;
      return;
    }

    const token = this.authService.getAccessToken();
    const formData = new FormData();
    formData.append('document_officiel_pdf', this.selectedPdfFile);

    this.http
      .patch(`http://localhost:8003/api/candidatures/concours/${concoursId}/admin/`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: () => {
          this.selectedPdfFile = null;
          this.isSaving = false;
          this.router.navigate(['/admin/offres-ingenieur', concoursId, 'edit']);
        },
        error: () => {
          this.errorMessage =
            'Offre créée mais échec du téléversement PDF. Vous pouvez le refaire en mode modification.';
          this.isSaving = false;
          this.router.navigate(['/admin/offres-ingenieur', concoursId, 'edit']);
        },
      });
  }
}
