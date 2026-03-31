import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { TranslatePipe } from '../../pipes/translate.pipe';

interface ReferentielMasters {
  metadata?: any;
  sections_masters?: Record<string, any>;
  documents_requis_pdf_unique?: string[];
  regles_importantes?: string[];
  [key: string]: any;
}

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslatePipe],
  templateUrl: './masters.html',
  styleUrl: './masters.css',
})
export class MastersComponent implements OnInit {
  private readonly candidatureApiBase = environment.candidatureServiceUrl;
  referentielMasters: ReferentielMasters | null = null;
  isLoadingReferentiel = false;
  referentielMessage = '';

  mastersRecherche = [
    {
      id: 1,
      titre: 'Master Recherche - Sciences de l Informatique: Ingenierie Logicielle (MRGL)',
      description:
        'Master de recherche avec selection sur score selon l appel a candidatures 2025/2026.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Recherche, R&D',
    },
  ];

  mastersProfessionnels = [
    {
      id: 3,
      titre: 'Master Professionnel en Ingenierie Logicielle (MPGL)',
      description: 'Ouverture officielle 2025/2026 avec preselection puis depot dossier numerique.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Developpement logiciel, architecture, DevOps',
    },
    {
      id: 4,
      titre: 'Master Professionnel en Science des Donnees (MPDS)',
      description: 'Formation appliquee en data science avec quotas officiels 2025/2026.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Data analyst, data scientist, IA appliquee',
    },
  ];

  // ✅ NOUVEAU : Cycle Ingénieur
  cycleIngenieur = [
    {
      id: 1,
      titre: 'Cycle Ingénieur - Génie Informatique',
      description:
        "Formation d'ingénieur en informatique axée sur le développement logiciel, l'intelligence artificielle et les systèmes distribués.",
      duree: '3 ans',
      prerequis: 'Bac + Concours',
      specialites: '2 (Info, Électrique)',
    },
    {
      id: 2,
      titre: 'Cycle Ingénieur - Génie Électrique',
      description:
        "Formation d'ingénieur en électronique et systèmes embarqués avec spécialisation en automatisation et énergie.",
      duree: '3 ans',
      prerequis: 'Bac + Concours',
      specialites: '2 (Info, Électrique)',
    },
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadReferentielMasters();
    console.log('✅ Masters page loaded');
    console.log('🎓 Masters Recherche:', this.mastersRecherche);
    console.log('💼 Masters Professionnels:', this.mastersProfessionnels);
    console.log('🔧 Cycle Ingénieur:', this.cycleIngenieur);
  }

  loadReferentielMasters(): void {
    this.isLoadingReferentiel = true;
    this.referentielMessage = '';

    this.http
      .get<ReferentielMasters>(`${this.candidatureApiBase}/masters/reglement-reference/`)
      .subscribe({
        next: (data) => {
          this.referentielMasters = data;
          this.isLoadingReferentiel = false;
        },
        error: (err) => {
          console.error('Erreur chargement référentiel masters:', err);
          this.referentielMessage =
            'Impossible de charger les détails officiels des appels d inscription. Vérifiez que le service candidature est actif sur le port 8003.';
          this.isLoadingReferentiel = false;
        },
      });
  }

  getSection(code: string): any {
    return this.referentielMasters?.sections_masters?.[code] || null;
  }

  getTotalPlaces(code: string): number | null {
    const total = this.getSection(code)?.capacites?.total;
    return typeof total === 'number' ? total : null;
  }
}
