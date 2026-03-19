import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Document {
  id: number;
  type: string;
  nom: string;
  icon: string;
  depose: boolean;
  date_depot?: string;
  url?: string;
  urlSafe?: SafeResourceUrl;
  nom_fichier?: string;
  taille?: string;
  valide?: boolean | null;
  commentaire?: string;
  nouveauCommentaire?: string;
  verified_by?: string;
  verified_at?: string;
}

@Component({
  selector: 'app-consulter-dossier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulter-dossier.html',
  styleUrl: './consulter-dossier.css',
})
export class ConsulterDossierComponent implements OnInit {
  candidatureId: number = 0;
  candidat: any = null;
  isLoading: boolean = true;
  commentaireGlobal: string = '';
  documentViewer: any = null;

  documents: Document[] = [
    {
      id: 1,
      type: 'cin',
      nom: "Carte d'identité nationale",
      icon: 'fa-id-card',
      depose: true,
      date_depot: '2026-02-15',
      url: '/assets/docs/sample.pdf',
      nom_fichier: 'CIN_12345678.pdf',
      taille: '1.2 MB',
      valide: true,
      commentaire: 'Document conforme',
      verified_by: 'Dr. Ahmed Gharbi',
      verified_at: '2026-02-16T10:30:00',
    },
    {
      id: 2,
      type: 'releves',
      nom: 'Relevés de notes (L1, L2, L3)',
      icon: 'fa-chart-line',
      depose: true,
      date_depot: '2026-02-15',
      url: '/assets/docs/sample.pdf',
      nom_fichier: 'Releves_Notes.pdf',
      taille: '3.5 MB',
      valide: true,
      verified_by: 'Dr. Ahmed Gharbi',
      verified_at: '2026-02-16T10:35:00',
    },
    {
      id: 3,
      type: 'diplome',
      nom: 'Diplôme de Licence',
      icon: 'fa-graduation-cap',
      depose: true,
      date_depot: '2026-02-16',
      url: '/assets/docs/sample.pdf',
      nom_fichier: 'Diplome_Licence.pdf',
      taille: '2.1 MB',
      valide: null,
      nouveauCommentaire: '',
    },
    {
      id: 4,
      type: 'photo',
      nom: "Photo d'identité",
      icon: 'fa-camera',
      depose: true,
      date_depot: '2026-02-15',
      url: '/assets/images/photo-sample.jpg',
      nom_fichier: 'Photo_ID.jpg',
      taille: '250 KB',
      valide: null,
      nouveauCommentaire: '',
    },
  ];

  historique = [
    {
      action: 'Dossier soumis',
      details: 'Le candidat a soumis son dossier complet',
      auteur: 'Système',
      date: '2026-02-15T10:30:00',
      icon: 'fa-upload',
      type: 'info',
    },
    {
      action: 'CIN validé',
      details: 'Document validé par Dr. Ahmed Gharbi',
      auteur: 'Dr. Ahmed Gharbi',
      date: '2026-02-16T10:30:00',
      icon: 'fa-check',
      type: 'success',
    },
    {
      action: 'Relevés validés',
      details: 'Documents validés après vérification',
      auteur: 'Dr. Ahmed Gharbi',
      date: '2026-02-16T10:35:00',
      icon: 'fa-check',
      type: 'success',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.candidatureId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadCandidature();
  }

  loadCandidature(): void {
    // Simuler un chargement
    setTimeout(() => {
      this.candidat = {
        first_name: 'Ahmed',
        last_name: 'Ben Ali',
        cin: '12345678',
        email: 'ahmed.benali@example.com',
        telephone: '+216 98 765 432',
        date_naissance: '2000-03-15',
        adresse: '15 Avenue Habib Bourguiba',
        ville: 'Monastir',
        code_postal: '5000',
        type_candidature: 'master',
        voeux: ['Master Génie Logiciel', 'Master Data Science', 'Master Microélectronique'],
        score: 17.5,
        statut_dossier: 'en_attente',
        date_soumission: '2026-02-15T10:30:00',
      };
      this.isLoading = false;
    }, 1000);
  }

  get documentsValides(): number {
    return this.documents.filter((d) => d.valide === true).length;
  }

  get documentsRejetes(): number {
    return this.documents.filter((d) => d.valide === false).length;
  }

  get documentsEnAttente(): number {
    return this.documents.filter((d) => d.depose && d.valide === null).length;
  }

  getStatutClass(statut: string): string {
    const classes: any = {
      valide: 'success',
      invalide: 'danger',
      en_attente: 'warning',
    };
    return classes[statut] || 'secondary';
  }

  getStatutLabel(statut: string): string {
    const labels: any = {
      valide: 'Dossier validé',
      invalide: 'Dossier invalidé',
      en_attente: 'En attente de validation',
    };
    return labels[statut] || statut;
  }

  voirDocument(doc: Document): void {
    this.documentViewer = {
      ...doc,
      urlSafe: this.sanitizer.bypassSecurityTrustResourceUrl(doc.url || ''),
    };
  }

  fermerViewer(): void {
    this.documentViewer = null;
  }

  telechargerDocument(doc: Document): void {
    console.log('📥 Téléchargement:', doc.nom);
    // Implémenter le téléchargement
  }

  imprimerDocument(): void {
    window.print();
  }

  validerDocument(doc: Document): void {
    doc.valide = true;
    doc.verified_by = 'Dr. Ahmed Gharbi'; // Utiliser l'utilisateur connecté
    doc.verified_at = new Date().toISOString();

    if (doc.nouveauCommentaire) {
      doc.commentaire = doc.nouveauCommentaire;
    }

    console.log('✅ Document validé:', doc.nom);

    // Ajouter à l'historique
    this.historique.unshift({
      action: `${doc.nom} validé`,
      details: doc.commentaire || 'Document validé',
      auteur: 'Dr. Ahmed Gharbi',
      date: new Date().toISOString(),
      icon: 'fa-check',
      type: 'success',
    });
  }

  rejeterDocument(doc: Document): void {
    if (!doc.nouveauCommentaire) {
      alert('Veuillez ajouter un commentaire pour justifier le rejet');
      return;
    }

    doc.valide = false;
    doc.commentaire = doc.nouveauCommentaire;
    doc.verified_by = 'Dr. Ahmed Gharbi';
    doc.verified_at = new Date().toISOString();

    console.log('❌ Document rejeté:', doc.nom);

    // Ajouter à l'historique
    this.historique.unshift({
      action: `${doc.nom} rejeté`,
      details: doc.commentaire,
      auteur: 'Dr. Ahmed Gharbi',
      date: new Date().toISOString(),
      icon: 'fa-times',
      type: 'danger',
    });
  }

  validerDossier(): void {
    if (this.documentsValides !== this.documents.length) {
      alert('Tous les documents doivent être validés avant de valider le dossier');
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir valider ce dossier ?')) {
      console.log('✅ Dossier validé:', this.commentaireGlobal);
      alert('Dossier validé avec succès !');
      this.retour();
    }
  }

  invaliderDossier(): void {
    if (!this.commentaireGlobal) {
      alert("Veuillez ajouter un commentaire pour justifier l'invalidation");
      return;
    }

    if (confirm('Êtes-vous sûr de vouloir invalider ce dossier ?')) {
      console.log('❌ Dossier invalidé:', this.commentaireGlobal);
      alert('Dossier invalidé');
      this.retour();
    }
  }

  mettreEnAttente(): void {
    console.log('⏸️ Dossier mis en attente:', this.commentaireGlobal);
    alert('Dossier mis en attente');
  }

  retour(): void {
    this.router.navigate(['/commission/candidatures']);
  }
}
