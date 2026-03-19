import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';

interface Candidature {
  id: number;
  first_name: string;
  last_name: string;
  cin: string;
  email: string;
  type: string;
  type_candidature: string;
  voeux?: string[];
  specialite?: string;
  score?: number;
  statut: string;
  date_soumission: string;
  selected?: boolean;
  ocr_analyse?: {
    resultat: 'en_cours' | 'valide' | 'invalide';
    rapport?: {
      documents_valides: number;
      documents_invalides: number;
      anomalies: string[];
      confiance_globale: number;
    };
  };
}

@Component({
  selector: 'app-consulter-candidatures',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './consulter-candidature.html',
  styleUrl: './consulter-candidature.css',
})
export class ConsulterCandidaturesComponent implements OnInit {
  candidatures: Candidature[] = [];
  candidaturesFiltrees: Candidature[] = [];

  // ✅ UTILISER UN OBJET filtres AU LIEU DE VARIABLES SÉPARÉES
  filtres = {
    type: '',
    statut: '',
    recherche: '',
  };

  constructor(
    private candidatureService: CandidatureService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCandidatures();
  }

  loadCandidatures(): void {
    this.candidatures = [
      {
        id: 1,
        first_name: 'Ahmed',
        last_name: 'Ben Ali',
        cin: '12345678',
        email: 'ahmed@example.com',
        type: 'master',
        type_candidature: 'master',
        voeux: ['Master Génie Logiciel', 'Master Data Science'],
        score: 17.5,
        statut: 'validee',
        date_soumission: '2026-02-15T10:30:00',
      },
      {
        id: 2,
        first_name: 'Fatma',
        last_name: 'Trabelsi',
        cin: '87654321',
        email: 'fatma@example.com',
        type: 'ingenieur',
        type_candidature: 'ingenieur',
        specialite: 'Génie Informatique',
        score: 15.2,
        statut: 'en_cours',
        date_soumission: '2026-02-16T11:00:00',
      },
      {
        id: 3,
        first_name: 'Mohamed',
        last_name: 'Karoui',
        cin: '11223344',
        email: 'mohamed@example.com',
        type: 'master',
        type_candidature: 'master',
        voeux: ['Master Data Science'],
        score: 16.8,
        statut: 'validee',
        date_soumission: '2026-02-17T14:00:00',
      },
      {
        id: 4,
        first_name: 'Sarra',
        last_name: 'Mansouri',
        cin: '99887766',
        email: 'sarra@example.com',
        type: 'ingenieur',
        type_candidature: 'ingenieur',
        specialite: 'Génie Électrique',
        score: 14.5,
        statut: 'en_cours',
        date_soumission: '2026-02-18T09:30:00',
      },
      {
        id: 5,
        first_name: 'Youssef',
        last_name: 'Bouzid',
        cin: '55443322',
        email: 'youssef@example.com',
        type: 'master',
        type_candidature: 'master',
        voeux: ['Master Microélectronique'],
        score: 13.2,
        statut: 'rejetee',
        date_soumission: '2026-02-19T16:00:00',
      },
    ];

    this.candidaturesFiltrees = [...this.candidatures];
  }

  appliquerFiltres(): void {
    this.candidaturesFiltrees = this.candidatures.filter((c) => {
      const matchType = !this.filtres.type || c.type === this.filtres.type;
      const matchStatut = !this.filtres.statut || c.statut === this.filtres.statut;
      const matchRecherche =
        !this.filtres.recherche ||
        c.first_name.toLowerCase().includes(this.filtres.recherche.toLowerCase()) ||
        c.last_name.toLowerCase().includes(this.filtres.recherche.toLowerCase()) ||
        c.cin.includes(this.filtres.recherche) ||
        c.email.toLowerCase().includes(this.filtres.recherche.toLowerCase());

      return matchType && matchStatut && matchRecherche;
    });
  }

  resetFiltres(): void {
    this.filtres = {
      type: '',
      statut: '',
      recherche: '',
    };
    this.candidaturesFiltrees = [...this.candidatures];
  }

  countByType(type: string): number {
    return this.candidaturesFiltrees.filter((c) => c.type === type).length;
  }

  countByStatut(statut: string): number {
    return this.candidaturesFiltrees.filter((c) => c.statut === statut).length;
  }

  toggleSelectAll(event: any): void {
    const checked = event.target.checked;
    this.candidaturesFiltrees.forEach((c) => (c.selected = checked));
  }

  hasSelection(): boolean {
    return this.candidaturesFiltrees.some((c) => c.selected);
  }

  countSelected(): number {
    return this.candidaturesFiltrees.filter((c) => c.selected).length;
  }

  analyserDossier(candidature: Candidature): void {
    candidature.ocr_analyse = {
      resultat: 'en_cours',
      rapport: undefined,
    };

    setTimeout(() => {
      const problemes = Math.random() > 0.7;

      candidature.ocr_analyse = {
        resultat: problemes ? 'invalide' : 'valide',
        rapport: {
          documents_valides: problemes ? 3 : 4,
          documents_invalides: problemes ? 1 : 0,
          anomalies: problemes ? ['Tampon manquant'] : [],
          confiance_globale: problemes ? 75 : 98,
        },
      };

      if (problemes) {
        if (confirm('Anomalies détectées. Envoyer réclamation ?')) {
          this.envoyerReclamation(candidature);
        }
      } else {
        alert('✅ Dossier valide !');
        candidature.statut = 'validee';
      }
    }, 3000);
  }

  voirRapportOCR(candidature: Candidature): void {
    if (!candidature.ocr_analyse?.rapport) {
      alert('Aucun rapport disponible');
      return;
    }

    const r = candidature.ocr_analyse.rapport;
    alert(`
📊 RAPPORT OCR
━━━━━━━━━━━━━━
✅ Valides: ${r.documents_valides}
❌ Invalides: ${r.documents_invalides}
🎯 Confiance: ${r.confiance_globale}%
${r.anomalies.length > 0 ? '\n⚠️ ' + r.anomalies.join('\n⚠️ ') : '✅ Aucune anomalie'}
    `);
  }

  envoyerReclamation(candidature: Candidature): void {
    alert(`📧 Réclamation envoyée à ${candidature.first_name} ${candidature.last_name}`);
  }

  voirDetails(candidature: Candidature): void {
    console.log('Détails:', candidature);
  }

  voirDossier(candidature: Candidature): void {
    this.router.navigate(['/commission/dossier', candidature.id]);
  }

  exporterExcel(): void {
    const selected = this.candidaturesFiltrees.filter((c) => c.selected);
    alert(`Export Excel de ${selected.length} candidature(s)`);
  }

  imprimer(): void {
    window.print();
  }
}
