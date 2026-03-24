import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';

interface Candidature {
  id: number;
  first_name?: string;
  last_name?: string;
  cin?: string;
  email?: string;
  numero?: string;
  master_nom?: string;
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
  imports: [CommonModule, FormsModule],
  templateUrl: './consulter-candidature.html',
  styleUrl: './consulter-candidature.css',
})
export class ConsulterCandidaturesComponent implements OnInit {
  candidatures: Candidature[] = [];
  candidaturesFiltrees: Candidature[] = [];
  selectedCandidature: Candidature | null = null;
  detailRequested: boolean = false;

  // ✅ UTILISER UN OBJET filtres AU LIEU DE VARIABLES SÉPARÉES
  filtres = {
    type: '',
    statut: '',
    recherche: '',
  };

  constructor(
    private candidatureService: CandidatureService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.detailRequested = false;
        this.selectedCandidature = null;
        this.loadCandidatures();
        return;
      }

      const id = Number(idParam);
      if (Number.isNaN(id)) {
        this.detailRequested = true;
        this.selectedCandidature = null;
        return;
      }

      this.detailRequested = true;
      this.loadCandidatureDetail(id);
    });
  }

  loadCandidatures(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (data: any[]) => {
        this.candidatures = (data || []).map((item) => this.normalizeCandidature(item));
        this.candidaturesFiltrees = [...this.candidatures];
      },
      error: () => {
        this.candidatures = [];
        this.candidaturesFiltrees = [];
      },
    });
  }

  loadCandidatureDetail(id: number): void {
    this.candidatureService.getCandidature(id).subscribe({
      next: (data: any) => {
        this.selectedCandidature = this.normalizeCandidature(data);
      },
      error: () => {
        this.candidatureService.getMesCandidatures().subscribe({
          next: (items: any[]) => {
            const found = (items || []).find((c: any) => Number(c.id) === id);
            this.selectedCandidature = found ? this.normalizeCandidature(found) : null;
          },
          error: () => {
            this.selectedCandidature = null;
          },
        });
      },
    });
  }

  private normalizeCandidature(item: any): Candidature {
    const fullName = item?.candidat_nom || '';
    const firstName = item?.first_name || fullName.split(' ')[0] || '';
    const lastName = item?.last_name || fullName.split(' ').slice(1).join(' ') || '';
    const masterName = item?.master_nom || item?.master_name || '';
    const cycle = (masterName || '').toLowerCase().includes('ingenieur') ? 'ingenieur' : 'master';

    return {
      id: Number(item?.id),
      first_name: firstName,
      last_name: lastName,
      cin: item?.cin || '',
      email: item?.email || item?.candidat_email || '',
      numero: item?.numero || '',
      master_nom: masterName,
      type: item?.type || cycle,
      type_candidature: item?.type_candidature || cycle,
      voeux: item?.voeux || [],
      specialite: item?.specialite || '',
      score: item?.score,
      statut: item?.statut || 'en_cours',
      date_soumission: item?.date_soumission || '',
    };
  }

  appliquerFiltres(): void {
    this.candidaturesFiltrees = this.candidatures.filter((c) => {
      const matchType = !this.filtres.type || c.type === this.filtres.type;
      const matchStatut = !this.filtres.statut || c.statut === this.filtres.statut;
      const firstName = (c.first_name || '').toLowerCase();
      const lastName = (c.last_name || '').toLowerCase();
      const cin = c.cin || '';
      const email = (c.email || '').toLowerCase();
      const search = (this.filtres.recherche || '').toLowerCase();
      const matchRecherche =
        !this.filtres.recherche ||
        firstName.includes(search) ||
        lastName.includes(search) ||
        cin.includes(this.filtres.recherche) ||
        email.includes(search);

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
    this.router.navigate(['/candidat/candidature', candidature.id]);
  }

  retourDashboard(): void {
    this.router.navigate(['/candidat/dashboard']);
  }

  voirDossier(candidature: Candidature): void {
    this.router.navigate(['/candidat/dossier'], {
      queryParams: { candidatureId: candidature.id },
    });
  }

  statusClass(statut: string): string {
    const value = (statut || '').toLowerCase();
    if (value.includes('rej')) {
      return 'status-rejected';
    }
    if (value.includes('valid') || value.includes('accept') || value.includes('select')) {
      return 'status-approved';
    }
    return 'status-pending';
  }

  exporterExcel(): void {
    const selected = this.candidaturesFiltrees.filter((c) => c.selected);
    alert(`Export Excel de ${selected.length} candidature(s)`);
  }

  imprimer(): void {
    window.print();
  }
}
