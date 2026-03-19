import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

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

  constructor(private router: Router) {}

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

    console.log('📤 Soumission des documents:', this.selectedFiles);

    // TODO: Upload via API
    const formData = new FormData();
    Object.keys(this.selectedFiles).forEach((key) => {
      if (this.selectedFiles[key]) {
        formData.append(key, this.selectedFiles[key]!);
      }
    });

    alert('Documents uploadés avec succès !');
    this.router.navigate(['/candidat/dashboard']);
  }
}
