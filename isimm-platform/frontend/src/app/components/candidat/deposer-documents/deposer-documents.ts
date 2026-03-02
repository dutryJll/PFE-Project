import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-deposer-documents',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deposer-documents.html',
  styleUrl: './deposer-documents.css',
})
export class DeposerDocumentsComponent {
  selectedFiles: { [key: string]: File | null } = {
    cin: null,
    releves: null,
    diplome: null,
    cv: null,
    photo: null,
  };

  constructor(private router: Router) {}

  onFileSelected(event: any, type: string): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[type] = file;
      console.log(`Fichier sélectionné (${type}):`, file.name);
    }
  }

  soumettre(): void {
    console.log('Documents à uploader:', this.selectedFiles);
    // TODO: Upload via API
    alert('Documents uploadés avec succès !');
    this.router.navigate(['/candidat/dashboard']);
  }
}
