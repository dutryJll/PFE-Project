import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';

@Component({
  selector: 'app-deposer-documents',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './deposer-documents.html',
  styleUrl: './deposer-documents.css',
})
export class DeposerDocumentsComponent {
  selectedFiles: { [key: string]: File | null } = {
    cin: null,
    releves: null,
    diplome: null,
    photo: null,
  };

  photoPreview: string | null = null;
  documentsUploaded: number = 0;

  constructor(
    private router: Router,
    private candidatureService: CandidatureService,
  ) {}

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
    this.selectedFiles[type] = null;
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

  soumettre(): void {
    if (this.documentsUploaded < 4) {
      alert('Veuillez télécharger tous les documents requis');
      return;
    }

    // Charger la candidature active, puis déposer le dossier sur l'API dédiée.
    this.candidatureService.getMesCandidatures().subscribe({
      next: (items: any) => {
        const candidatures = Array.isArray(items) ? items : [];
        const cible =
          candidatures.find(
            (c: any) => c.statut === 'preselectionne' || c.statut === 'en_attente_dossier',
          ) ?? candidatures[0];

        if (!cible?.id) {
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

        this.candidatureService.deposerDossierNumerique(cible.id, payload).subscribe({
          next: () => {
            alert('✅ Dossier déposé avec succès !');
            this.router.navigate(['/candidat/dashboard']);
          },
          error: (error: any) => {
            console.error('Erreur dépôt dossier:', error);
            const backendMessage = error?.error?.error;
            alert(
              `❌ Erreur lors du dépôt du dossier.${backendMessage ? `\n${backendMessage}` : ''}`,
            );
          },
        });
      },
      error: (error: any) => {
        console.error('Erreur chargement candidatures:', error);
        alert('❌ Impossible de charger vos candidatures.');
      },
    });
  }
}
