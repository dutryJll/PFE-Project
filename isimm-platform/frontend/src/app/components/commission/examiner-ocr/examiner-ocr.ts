import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface Candidat {
  id: number;
  first_name: string;
  last_name: string;
  cin: string;
  email: string;
  master_id: number;
  master_nom: string;
  statut_analyse: string;
  analyse_effectuee: boolean;
}

interface DocumentOCR {
  id: number;
  type: string;
  nom: string;
  icon: string;
  url?: string;
  urlSafe?: SafeResourceUrl;
  analyzing: boolean;
  progress: number;
  verification?: {
    statut: string;
    confiance: number;
    donnees_extraites?: any;
    verifications?: any[];
    anomalies?: string[];
  };
}

interface RapportFinal {
  resultat: 'valide' | 'invalide';
  message: string;
  documents_valides: number;
  documents_invalides: number;
  total_anomalies: number;
  confiance_globale: number;
}

@Component({
  selector: 'app-examiner-ocr',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './examiner-ocr.html',
  styleUrl: './examiner-ocr.css',
})
export class ExaminerOcrComponent implements OnInit {
  dossiersAnalyses: number = 847;
  tauxPrecision: number = 96.5;

  recherche: string = '';
  filtreMaster: string = '';
  filtreStatut: string = '';

  masters: any[] = [];
  candidatsEnAttente: Candidat[] = [];
  candidatsFiltres: Candidat[] = [];
  candidatSelectionne: Candidat | null = null;

  documentsOCR: DocumentOCR[] = [];
  analysisEnCours: boolean = false;
  rapportFinal: RapportFinal | null = null;

  documentViewer: any = null;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.loadMasters();
    this.loadCandidats();
  }

  loadMasters(): void {
    // TODO: Charger depuis l'API
    this.masters = [
      { id: 1, nom: 'Master Recherche Génie Logiciel' },
      { id: 2, nom: 'Master Professionnel Data Science' },
      { id: 3, nom: 'Master Recherche Microélectronique' },
    ];
  }

  loadCandidats(): void {
    // TODO: Charger depuis l'API
    this.candidatsEnAttente = [
      {
        id: 1,
        first_name: 'Ahmed',
        last_name: 'Ben Ali',
        cin: '12345678',
        email: 'ahmed@example.com',
        master_id: 1,
        master_nom: 'Master Recherche Génie Logiciel',
        statut_analyse: 'en_attente',
        analyse_effectuee: false,
      },
      {
        id: 2,
        first_name: 'Fatma',
        last_name: 'Trabelsi',
        cin: '87654321',
        email: 'fatma@example.com',
        master_id: 2,
        master_nom: 'Master Professionnel Data Science',
        statut_analyse: 'analyse_ok',
        analyse_effectuee: true,
      },
      {
        id: 3,
        first_name: 'Mohamed',
        last_name: 'Karoui',
        cin: '11223344',
        email: 'mohamed@example.com',
        master_id: 1,
        master_nom: 'Master Recherche Génie Logiciel',
        statut_analyse: 'probleme',
        analyse_effectuee: true,
      },
    ];

    this.candidatsFiltres = [...this.candidatsEnAttente];
  }

  filtrerCandidats(): void {
    this.candidatsFiltres = this.candidatsEnAttente.filter((c) => {
      const matchRecherche =
        !this.recherche ||
        c.first_name.toLowerCase().includes(this.recherche.toLowerCase()) ||
        c.last_name.toLowerCase().includes(this.recherche.toLowerCase()) ||
        c.cin.includes(this.recherche) ||
        c.email.toLowerCase().includes(this.recherche.toLowerCase());

      const matchMaster = !this.filtreMaster || c.master_id.toString() === this.filtreMaster;
      const matchStatut = !this.filtreStatut || c.statut_analyse === this.filtreStatut;

      return matchRecherche && matchMaster && matchStatut;
    });
  }

  selectionnerCandidat(candidat: Candidat): void {
    console.log('👤 Candidat sélectionné:', candidat);
    this.candidatSelectionne = candidat;
    this.rapportFinal = null;
    this.loadDocuments();
  }

  loadDocuments(): void {
    // TODO: Charger depuis l'API
    this.documentsOCR = [
      {
        id: 1,
        type: 'cin',
        nom: "Carte d'identité nationale",
        icon: 'fa-id-card',
        url: '/assets/docs/sample.pdf',
        analyzing: false,
        progress: 0,
      },
      {
        id: 2,
        type: 'releves',
        nom: 'Relevés de notes',
        icon: 'fa-chart-line',
        url: '/assets/docs/sample.pdf',
        analyzing: false,
        progress: 0,
      },
      {
        id: 3,
        type: 'diplome',
        nom: 'Diplôme de Licence',
        icon: 'fa-graduation-cap',
        url: '/assets/docs/sample.pdf',
        analyzing: false,
        progress: 0,
      },
      {
        id: 4,
        type: 'photo',
        nom: "Photo d'identité",
        icon: 'fa-camera',
        url: '/assets/images/photo.jpg',
        analyzing: false,
        progress: 0,
      },
    ];
  }

  analyserDocument(doc: DocumentOCR): void {
    console.log('🤖 Analyse OCR:', doc.nom);

    doc.analyzing = true;
    doc.progress = 0;

    // Simuler la progression de l'analyse
    const interval = setInterval(() => {
      doc.progress += 10;

      if (doc.progress >= 100) {
        clearInterval(interval);
        doc.analyzing = false;
        doc.progress = 100;

        // Générer résultats simulés
        this.genererResultatsOCR(doc);
      }
    }, 300);
  }

  genererResultatsOCR(doc: DocumentOCR): void {
    // Résultats simulés selon le type de document
    if (doc.type === 'cin') {
      doc.verification = {
        statut: 'valide',
        confiance: 98,
        donnees_extraites: {
          Nom: 'BEN ALI',
          Prénom: 'Ahmed',
          CIN: '12345678',
          'Date naissance': '15/03/2000',
          'Lieu naissance': 'Monastir',
        },
        verifications: [
          { valide: true, description: 'Correspondance CIN avec candidature' },
          { valide: true, description: 'Correspondance nom et prénom' },
          { valide: true, description: 'Document authentique (tampon détecté)' },
          { valide: true, description: 'Qualité image suffisante' },
        ],
        anomalies: [],
      };
    } else if (doc.type === 'releves') {
      doc.verification = {
        statut: 'valide',
        confiance: 94,
        donnees_extraites: {
          'Moyenne L1': '14.25',
          'Moyenne L2': '15.80',
          'Moyenne L3': '16.50',
          'Moyenne générale': '15.52',
        },
        verifications: [
          { valide: true, description: 'Relevés des 3 années présents' },
          { valide: true, description: 'Tampons universitaires détectés' },
          { valide: true, description: 'Calcul des moyennes cohérent' },
        ],
        anomalies: [],
      };
    } else if (doc.type === 'diplome') {
      doc.verification = {
        statut: 'invalide',
        confiance: 65,
        donnees_extraites: {
          Diplôme: 'Licence Informatique',
          Université: 'ISIMM',
          Année: '2024',
        },
        verifications: [
          { valide: true, description: 'Format PDF valide' },
          { valide: false, description: 'Tampon universitaire non détecté' },
          { valide: false, description: 'Signature manquante' },
        ],
        anomalies: ["Tampon de l'université non visible", 'Signature du doyen absente'],
      };
    } else if (doc.type === 'photo') {
      doc.verification = {
        statut: 'valide',
        confiance: 99,
        donnees_extraites: {
          Format: 'JPEG',
          Dimensions: '600x800 pixels',
          Qualité: 'Haute',
        },
        verifications: [
          { valide: true, description: 'Visage détecté' },
          { valide: true, description: 'Fond uni' },
          { valide: true, description: 'Résolution suffisante' },
          { valide: true, description: 'Format respecté' },
        ],
        anomalies: [],
      };
    }

    console.log('✅ Analyse terminée:', doc.verification);
  }

  analyserTousDocuments(): void {
    console.log('🤖 Analyse de tous les documents...');
    this.analysisEnCours = true;

    // Analyser chaque document séquentiellement
    let index = 0;
    const analyserProchain = () => {
      if (index < this.documentsOCR.length) {
        const doc = this.documentsOCR[index];
        if (!doc.verification) {
          this.analyserDocument(doc);

          // Attendre la fin de l'analyse avant de passer au suivant
          setTimeout(() => {
            index++;
            analyserProchain();
          }, 3500);
        } else {
          index++;
          analyserProchain();
        }
      } else {
        // Tous les documents sont analysés
        this.analysisEnCours = false;
        this.genererRapportFinal();
      }
    };

    analyserProchain();
  }

  reanalyserDocument(doc: DocumentOCR): void {
    console.log('🔄 Réanalyse du document:', doc.nom);
    doc.verification = undefined;
    this.analyserDocument(doc);
  }

  genererRapportFinal(): void {
    const documentsValides = this.documentsOCR.filter(
      (d) => d.verification?.statut === 'valide',
    ).length;
    const documentsInvalides = this.documentsOCR.filter(
      (d) => d.verification?.statut === 'invalide',
    ).length;
    const totalAnomalies = this.documentsOCR.reduce(
      (sum, d) => sum + (d.verification?.anomalies?.length || 0),
      0,
    );

    const confianceGlobale = Math.round(
      this.documentsOCR.reduce((sum, d) => sum + (d.verification?.confiance || 0), 0) /
        this.documentsOCR.length,
    );

    const resultat = documentsInvalides === 0 && totalAnomalies === 0 ? 'valide' : 'invalide';

    this.rapportFinal = {
      resultat,
      message:
        resultat === 'valide'
          ? 'Tous les documents sont conformes et valides. Le dossier peut être validé.'
          : `${documentsInvalides} document(s) invalide(s) détecté(s). Le dossier nécessite une vérification manuelle.`,
      documents_valides: documentsValides,
      documents_invalides: documentsInvalides,
      total_anomalies: totalAnomalies,
      confiance_globale: confianceGlobale,
    };

    console.log('📊 Rapport final généré:', this.rapportFinal);
  }

  validerDossier(): void {
    if (confirm('Êtes-vous sûr de vouloir valider ce dossier ?')) {
      console.log('✅ Dossier validé');
      // TODO: Appeler l'API
      alert('Dossier validé avec succès !');
      this.candidatSelectionne!.statut_analyse = 'analyse_ok';
      this.candidatSelectionne = null;
    }
  }

  rejeterDossier(): void {
    const motif = prompt('Motif du rejet :');
    if (!motif) return;

    console.log('❌ Dossier rejeté:', motif);
    // TODO: Appeler l'API
    alert('Dossier rejeté');
    this.candidatSelectionne!.statut_analyse = 'probleme';
    this.candidatSelectionne = null;
  }

  envoyerReclamation(): void {
    if (confirm('Envoyer une réclamation au candidat pour corriger les anomalies ?')) {
      console.log('📧 Réclamation envoyée');
      // TODO: Appeler l'API
      alert('Réclamation envoyée au candidat par email');
    }
  }

  exporterRapport(): void {
    console.log('📥 Export du rapport PDF');
    // TODO: Générer et télécharger le PDF
    alert('Rapport PDF téléchargé !');
  }

  voirDocument(doc: DocumentOCR): void {
    this.documentViewer = {
      ...doc,
      urlSafe: this.sanitizer.bypassSecurityTrustResourceUrl(doc.url || ''),
    };
  }

  fermerViewer(): void {
    this.documentViewer = null;
  }

  getStatutAnalyseLabel(statut: string): string {
    const labels: any = {
      en_attente: 'En attente',
      analyse_ok: 'Analyse OK',
      probleme: 'Problèmes détectés',
    };
    return labels[statut] || statut;
  }

  formatLabel(key: string | number | symbol): string {
    const keyStr = String(key);
    return keyStr.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
}
