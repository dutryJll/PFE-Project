import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { CandidatureService } from '../../../services/candidature.service';

@Component({
  selector: 'app-dashboard-candidat',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './dashboard-candidat.html',
  styleUrls: ['./dashboard-candidat.css'],
})
export class DashboardCandidatComponent implements OnInit {
  currentUser: any = null;
  candidature: any = null;
  documents: any[] = [];
  documentsCount: number = 0;

  activeTab: string = 'overview';

  // Pour la vérification d'identité du dossier
  isDossierUnlocked: boolean = false;
  verificationPassword: string = '';
  verificationError: string = '';

  constructor(
    private authService: AuthService,
    private candidatureService: CandidatureService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    console.log('👤 Current user:', this.currentUser);

    if (this.currentUser) {
      this.loadCandidature();
      this.loadDocuments();
    }
  }

  loadCandidature(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (data: any) => {
        console.log('✅ Candidature loaded:', data);
        this.candidature = data[0]; // Prendre la première candidature
      },
      error: (error: any) => {
        console.error('❌ Error loading candidature:', error);
      },
    });
  }

  loadDocuments(): void {
    // TODO: Appel API pour charger les documents
    this.candidatureService.getDocuments(this.candidature?.id).subscribe({
      next: (docs: any[]) => {
        this.documents = docs || [];
        this.documentsCount = this.documents.length;
      },
      error: (err: any) => {
        console.error('❌ Error loading documents:', err);
        this.documents = [];
        this.documentsCount = 0;
      },
    });
  }

  getStatutClass(statut: string): string {
    const classes: any = {
      en_cours: 'badge-warning',
      en_attente: 'badge-info',
      validee: 'badge-success',
      rejetee: 'badge-danger',
      preselectionne: 'badge-primary',
    };
    return classes[statut] || 'badge-secondary';
  }

  verifyIdentity(): void {
    if (!this.verificationPassword) {
      this.verificationError = 'Veuillez entrer votre mot de passe';
      return;
    }

    // Vérifier le mot de passe via API
    this.authService.verifyPassword(this.currentUser.email, this.verificationPassword).subscribe({
      next: (response: any) => {
        console.log('✅ Identity verified');
        this.isDossierUnlocked = true;
        this.verificationError = '';
        this.verificationPassword = '';
      },
      error: (error: any) => {
        console.error('❌ Verification failed:', error);
        this.verificationError = 'Mot de passe incorrect';
      },
    });
  }

  hasDocument(type: string): boolean {
    // Vérifier si le document existe
    return this.documents.some((doc) => doc.type_document === type);
  }

  getDocumentDate(type: string): string {
    const doc = this.documents.find((d) => d.type_document === type);
    return doc ? new Date(doc.date_upload).toLocaleDateString('fr-FR') : '';
  }

  imprimerCandidature(): void {
    window.print();
  }

  logout(): void {
    this.authService.logout();
  }
}
