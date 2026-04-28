import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { OffreRichContentService } from '../../../services/offre-rich-content.service';
import { ToastService } from '../../../services/toast.service';
import { OffreRichContent } from '../../../shared/offre-rich-content';

interface CapaciteLigne {
  categorie: string;
  origine: string;
  quota: number;
  diplome: string;
}

interface OffrePreinscriptionDto {
  id: number;
  master_id: number;
  titre: string;
  description: string;
  type_formation?: 'master' | 'cycle_ingenieur';
  actif: boolean;
  appel_actif?: boolean;
  est_publiee?: boolean;
  capacite: number;
  date_limite: string;
  date_debut_visibilite?: string | null;
  date_fin_visibilite?: string | null;
  date_limite_preinscription?: string | null;
  date_limite_depot_dossier?: string | null;
  capacites_detaillees?: CapaciteLigne[];
}

interface OffrePreinscriptionForm {
  titre: string;
  type_formation: 'master' | 'cycle_ingenieur';
  appel_actif: boolean;
  description: string;
  date_debut_visibilite: string;
  date_fin_visibilite: string;
  date_limite_preinscription: string;
  date_limite_depot_dossier: string;
}

@Component({
  selector: 'app-offre-preinscription-editor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatTableModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './offre-preinscription-editor.html',
  styleUrl: './offre-preinscription-editor.css',
})
export class OffrePreinscriptionEditorComponent implements OnInit {
  private readonly apiBase = environment.candidatureServiceUrl;

  offerId: number | null = null;
  masterId: number | null = null;
  loading = false;
  saving = false;
  publishing = false;
  publishedPulse = false;

  readonly quotasColumns = ['categorie', 'origine', 'quota', 'diplome', 'actions'];

  form: OffrePreinscriptionForm = {
    titre: '',
    type_formation: 'master',
    appel_actif: true,
    description: '',
    date_debut_visibilite: '',
    date_fin_visibilite: '',
    date_limite_preinscription: '',
    date_limite_depot_dossier: '',
  };

  quotas: CapaciteLigne[] = [
    {
      categorie: 'ISIMM Internes',
      origine: 'ISIMM',
      quota: 15,
      diplome: 'Licence en Sciences de l Informatique',
    },
    {
      categorie: 'Autres Externes',
      origine: 'Autres etablissements',
      quota: 8,
      diplome: 'Licence ou equivalent selon la specialite',
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private offreRichContentService: OffreRichContentService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const role = this.authService.currentUserValue?.role || '';
    if (!['responsable_commission', 'commission', 'admin'].includes(role)) {
      this.toastService.show('Acces non autorise.', 'error');
      this.backToDashboard();
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.offerId = Number.isFinite(id) && id > 0 ? id : null;

    if (!this.offerId) {
      this.toastService.show('Offre introuvable.', 'error');
      this.backToDashboard();
      return;
    }

    this.loadOffer();
  }

  get isReadOnly(): boolean {
    return this.authService.currentUserValue?.role === 'commission';
  }

  get totalCapacite(): number {
    return this.quotas.reduce((total, ligne) => total + (Number(ligne.quota) || 0), 0);
  }

  get publicationLabel(): string {
    if (this.publishing) {
      return 'Publication...';
    }
    return this.form.appel_actif ? 'Publier maintenant' : 'Activer puis publier';
  }

  addQuotaRow(): void {
    if (this.isReadOnly) {
      return;
    }

    this.quotas = [
      ...this.quotas,
      {
        categorie: 'Nouveau quota',
        origine: 'A preciser',
        quota: 0,
        diplome: '',
      },
    ];
  }

  removeQuotaRow(index: number): void {
    if (this.isReadOnly || this.quotas.length <= 1) {
      return;
    }

    this.quotas = this.quotas.filter((_, currentIndex) => currentIndex !== index);
  }

  saveOffer(): void {
    if (!this.offerId || this.isReadOnly) {
      return;
    }

    if (!this.form.titre.trim()) {
      this.toastService.show('Le titre est obligatoire.', 'warning');
      return;
    }

    this.saving = true;
    const payload = this.buildOfferPayload();

    this.http
      .patch<OffrePreinscriptionDto>(`${this.apiBase}/offres-master/${this.offerId}/`, payload)
      .subscribe({
        next: (saved) => {
          this.masterId = saved.master_id;
          this.form.appel_actif = Boolean(saved.appel_actif ?? saved.actif);
          this.syncCandidateDesignContent();
          this.toastService.show(
            'Offre enregistree. Visible immediatement cote candidat apres publication.',
            'success',
          );
          this.saving = false;
        },
        error: (error) => {
          console.error('Erreur sauvegarde offre:', error);
          this.toastService.show('Erreur lors de la sauvegarde.', 'error');
          this.saving = false;
        },
      });
  }

  publishOffer(): void {
    if (!this.offerId || this.isReadOnly) {
      return;
    }

    this.publishing = true;
    const payload = {
      actif: true,
      appel_actif: true,
      est_publiee: true,
    };

    this.http
      .patch<OffrePreinscriptionDto>(`${this.apiBase}/offres-master/${this.offerId}/`, payload)
      .subscribe({
        next: () => {
          this.form.appel_actif = true;
          this.triggerPublishPulse();
          this.toastService.show('Offre publiee: statut Ouverte cote candidats.', 'success');
          this.publishing = false;
        },
        error: (error) => {
          console.error('Erreur publication offre:', error);
          this.toastService.show('Echec de publication de l offre.', 'error');
          this.publishing = false;
        },
      });
  }

  backToDashboard(): void {
    this.router.navigate(['/commission/dashboard'], {
      queryParams: { view: 'configuration-appels' },
    });
  }

  private loadOffer(): void {
    if (!this.offerId) {
      return;
    }

    this.loading = true;
    this.http
      .get<OffrePreinscriptionDto>(`${this.apiBase}/offres-master/${this.offerId}/`)
      .subscribe({
        next: (offer) => {
          this.mapOfferToForm(offer);
          this.loading = false;
        },
        error: (error) => {
          console.warn('Service offre indisponible, affichage du formulaire local:', error);
          this.toastService.show(
            'Le service offre est indisponible pour le moment. Le formulaire reste accessible.',
            'warning',
          );
          this.loading = false;
        },
      });
  }

  private mapOfferToForm(offer: OffrePreinscriptionDto): void {
    this.masterId = offer.master_id;

    this.form = {
      titre: offer.titre || '',
      type_formation: offer.type_formation || 'master',
      appel_actif: Boolean(offer.appel_actif ?? offer.actif),
      description: offer.description || '',
      date_debut_visibilite: offer.date_debut_visibilite || '',
      date_fin_visibilite: offer.date_fin_visibilite || '',
      date_limite_preinscription: offer.date_limite_preinscription || offer.date_limite || '',
      date_limite_depot_dossier: offer.date_limite_depot_dossier || '',
    };

    if (Array.isArray(offer.capacites_detaillees) && offer.capacites_detaillees.length > 0) {
      this.quotas = offer.capacites_detaillees.map((row) => ({
        categorie: row.categorie || 'Quota',
        origine: row.origine || '',
        quota: Number(row.quota) || 0,
        diplome: row.diplome || '',
      }));
    }
  }

  private buildOfferPayload(): Record<string, unknown> {
    return {
      titre: this.form.titre.trim(),
      description: this.form.description.trim(),
      type_formation: this.form.type_formation,
      actif: this.form.appel_actif,
      appel_actif: this.form.appel_actif,
      date_limite: this.form.date_limite_preinscription,
      date_debut_visibilite: this.form.date_debut_visibilite || null,
      date_fin_visibilite: this.form.date_fin_visibilite || null,
      date_limite_preinscription: this.form.date_limite_preinscription || null,
      date_limite_depot_dossier: this.form.date_limite_depot_dossier || null,
      capacite: this.totalCapacite,
      capacites_detaillees: this.quotas.map((ligne) => ({
        categorie: (ligne.categorie || '').trim(),
        origine: (ligne.origine || '').trim(),
        quota: Number(ligne.quota) || 0,
        diplome: (ligne.diplome || '').trim(),
      })),
    };
  }

  private syncCandidateDesignContent(): void {
    if (!this.offerId) {
      return;
    }

    const content: OffreRichContent = {
      offerId: this.offerId,
      title: this.form.titre,
      openingTitle: `Offre de preinscription ${this.form.type_formation === 'master' ? 'Master' : 'Cycle Ingenieur'}`,
      openingBody: this.form.description,
      tableTitle: 'Capacites et diplomes admissibles',
      tableHeaders: ['Categorie', 'Etablissement d origine', 'Quota', 'Diplome requis'],
      tableRows: this.quotas.map((ligne) => [
        ligne.categorie,
        ligne.origine,
        String(ligne.quota),
        ligne.diplome,
      ]),
      modalitesTitle: 'Calendrier de candidature',
      etape1: `Visibilite de l appel: ${this.form.date_debut_visibilite || '-'} au ${this.form.date_fin_visibilite || '-'}.`,
      etape2: `Preinscription jusqu au ${this.form.date_limite_preinscription || '-'} et depot du dossier avant ${this.form.date_limite_depot_dossier || '-'}.`,
      dossierTitle: 'Indications',
      dossierItems: [
        'Les informations publiees par la commission sont les informations officielles.',
        'La capacite totale est automatiquement calculee depuis les quotas.',
      ],
      scoreTitle: 'Etat de publication',
      scoreFormula: this.form.appel_actif ? 'Offre ouverte' : 'Offre fermee',
      moyenneFormula: `Capacite totale: ${this.totalCapacite}`,
      scoreTableHeaders: ['Champ', 'Valeur'],
      scoreTableRows: [
        ['Type', this.form.type_formation],
        ['Date limite preinscription', this.form.date_limite_preinscription || '-'],
        ['Date limite depot dossier', this.form.date_limite_depot_dossier || '-'],
      ],
      bnrRules: [],
      bspRules: [],
      evaluationNotes: [
        'Veuillez conserver les dates officielles de cette offre.',
        'Les modifications sont appliquees en temps reel.',
      ],
      updatedAt: new Date().toISOString(),
    };

    this.offreRichContentService.saveOffreRichContent(content).subscribe({
      error: (error) => {
        console.error('Erreur sync contenu candidat:', error);
      },
    });
  }

  private triggerPublishPulse(): void {
    this.publishedPulse = false;
    setTimeout(() => {
      this.publishedPulse = true;
      setTimeout(() => {
        this.publishedPulse = false;
      }, 1600);
    }, 20);
  }
}
