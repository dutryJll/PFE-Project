import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpEventType } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CandidatureService } from '../../../services/candidature.service';

interface FilePreview {
  fileName: string;
  fileSize: string;
  mimeType: string;
  isImage: boolean;
  previewUrl: string | null;
}

@Component({
  selector: 'app-deposer-documents',
  standalone: true,
  imports: [CommonModule, RouterLink, MatProgressBarModule],
  templateUrl: './deposer-documents.html',
  styleUrl: './deposer-documents.css',
})
export class DeposerDocumentsComponent implements OnDestroy {
  readonly requiredDocumentTypes = ['cin', 'releves', 'diplome', 'photo'];

  selectedFiles: { [key: string]: File | null } = {
    cin: null,
    releves: null,
    diplome: null,
    photo: null,
  };

  filePreviews: { [key: string]: FilePreview | null } = {
    cin: null,
    releves: null,
    diplome: null,
    photo: null,
  };

  photoPreview: string | null = null;
  documentsUploaded: number = 0;
  isSubmitting: boolean = false;
  submitProgress: number = 0;
  uploadStepLabel: string = 'En attente';
  uploadProgressByType: { [key: string]: number } = {
    cin: 0,
    releves: 0,
    diplome: 0,
    photo: 0,
  };

  constructor(
    private router: Router,
    private candidatureService: CandidatureService,
  ) {}

  ngOnDestroy(): void {
    this.clearAllObjectUrls();
  }

  onFileSelected(event: any, type: string): void {
    const file = event.target.files[0];
    if (file) {
      // Vérifier la taille
      const maxSize =
        type === 'photo' ? 2 * 1024 * 1024 : (type === 'releves' ? 10 : 5) * 1024 * 1024;

      if (file.size > maxSize) {
        alert(`Le fichier est trop volumineux. Taille max: ${maxSize / (1024 * 1024)} MB`);
        return;
      }

      this.selectedFiles[type] = file;
      this.filePreviews[type] = this.buildFilePreview(file);
      this.uploadProgressByType[type] = 0;
      this.updateProgress();

      console.log(`✅ Fichier sélectionné (${type}):`, file.name);

      // Prévisualisation photo
      if (type === 'photo') {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.photoPreview = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeFile(type: string): void {
    this.revokePreviewUrl(type);
    this.selectedFiles[type] = null;
    this.filePreviews[type] = null;
    this.uploadProgressByType[type] = 0;
    if (type === 'photo') {
      this.photoPreview = null;
    }
    this.updateProgress();
  }

  hasFile(type: string): boolean {
    return !!this.selectedFiles[type];
  }

  getFileSize(file: File | null): string {
    if (!file) return '';
    const bytes = file.size;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  updateProgress(): void {
    this.documentsUploaded = Object.values(this.selectedFiles).filter((f) => f !== null).length;
  }

  previewFor(type: string): FilePreview | null {
    return this.filePreviews[type] || null;
  }

  progressFor(type: string): number {
    if (!this.hasFile(type)) {
      return 0;
    }

    if (!this.isSubmitting && this.submitProgress === 0) {
      return 100;
    }

    return this.uploadProgressByType[type] ?? 0;
  }

  private syncPerDocumentProgress(progress: number): void {
    const activeTypes = this.requiredDocumentTypes.filter((type) => this.hasFile(type));
    activeTypes.forEach((type) => {
      this.uploadProgressByType[type] = progress;
    });
  }

  private buildFilePreview(file: File): FilePreview {
    const isImage = file.type.startsWith('image/');
    return {
      fileName: file.name,
      fileSize: this.getFileSize(file),
      mimeType: file.type || 'application/octet-stream',
      isImage,
      previewUrl: isImage ? URL.createObjectURL(file) : null,
    };
  }

  private revokePreviewUrl(type: string): void {
    const preview = this.filePreviews[type];
    if (preview?.previewUrl) {
      URL.revokeObjectURL(preview.previewUrl);
    }
  }

  private clearAllObjectUrls(): void {
    Object.keys(this.filePreviews).forEach((type) => this.revokePreviewUrl(type));
  }

  soumettre(): void {
    if (this.documentsUploaded < 4) {
      alert('Veuillez télécharger tous les documents requis');
      return;
    }

    this.isSubmitting = true;
    this.submitProgress = 10;
    this.uploadStepLabel = 'Préparation du dépôt';
    this.syncPerDocumentProgress(10);

    // Charger la candidature active, puis déposer le dossier sur l'API dédiée.
    this.candidatureService.getMesCandidatures().subscribe({
      next: (items: any) => {
        const candidatures = Array.isArray(items) ? items : [];
        const cible =
          candidatures.find(
            (c: any) => c.statut === 'preselectionne' || c.statut === 'en_attente_dossier',
          ) ?? candidatures[0];

        if (!cible?.id) {
          this.isSubmitting = false;
          this.submitProgress = 0;
          alert('❌ Aucune candidature trouvée pour le dépôt de dossier.');
          return;
        }

        const documents = Object.keys(this.selectedFiles).filter((k) => !!this.selectedFiles[k]);
        const payload = {
          formulaire: {
            cin: this.selectedFiles['cin']?.name ?? 'cin',
            telephone: '00000000',
            documents,
          },
        };

        this.uploadStepLabel = 'Envoi des données';

        this.candidatureService.deposerDossierNumeriqueWithProgress(cible.id, payload).subscribe({
          next: (event) => {
            if (event.type === HttpEventType.UploadProgress) {
              const progress = event.total
                ? Math.round((event.loaded / event.total) * 100)
                : Math.min(this.submitProgress + 10, 95);
              this.submitProgress = Math.max(progress, 15);
              this.uploadStepLabel = 'Transfert en cours';
              this.syncPerDocumentProgress(this.submitProgress);
            }

            if (event.type === HttpEventType.Response) {
              this.submitProgress = 100;
              this.uploadStepLabel = 'Dossier soumis';
              this.syncPerDocumentProgress(100);
              this.isSubmitting = false;
              alert('✅ Dossier déposé avec succès !');
              this.router.navigate(['/candidat/dashboard']);
            }
          },
          error: (error: any) => {
            this.isSubmitting = false;
            this.submitProgress = 0;
            this.uploadStepLabel = 'Erreur lors du dépôt';
            this.syncPerDocumentProgress(0);
            console.error('Erreur dépôt dossier:', error);
            const backendMessage = error?.error?.error;
            alert(
              `❌ Erreur lors du dépôt du dossier.${backendMessage ? `\n${backendMessage}` : ''}`,
            );
          },
        });
      },
      error: (error: any) => {
        this.isSubmitting = false;
        this.submitProgress = 0;
        this.uploadStepLabel = 'Erreur de chargement';
        this.syncPerDocumentProgress(0);
        console.error('Erreur chargement candidatures:', error);
        alert('❌ Impossible de charger vos candidatures.');
      },
    });
  }
}
