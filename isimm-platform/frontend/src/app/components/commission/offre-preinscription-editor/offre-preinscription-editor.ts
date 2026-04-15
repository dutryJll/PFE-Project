import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { OffreRichContentService } from '../../../services/offre-rich-content.service';
import { ToastService } from '../../../services/toast.service';
import { OffreRichContent } from '../../../shared/offre-rich-content';

interface OffrePreinscriptionItem {
  id: number;
  titre: string;
  type: 'master' | 'cycle_ingenieur';
  specialite: string;
  description: string;
  date_limite: string;
  places: number;
  document_officiel_pdf_url?: string | null;
}

interface EditorFormModel {
  title: string;
  openingTitle: string;
  openingBody: string;
  tableTitle: string;
  capInterneTotale: string;
  capInterneOrigine: string;
  capInterneCapacite: string;
  capInterneDiplome: string;
  capInterneDates: string;
  capExterneTotale: string;
  capExterneOrigine: string;
  capExterneCapacite: string;
  capExterneDiplome: string;
  capExterneDates: string;
  modalitesTitle: string;
  etape1: string;
  etape2: string;
  dossierTitle: string;
  dossierItemsText: string;
  scoreTitle: string;
  scoreRow1Composante: string;
  scoreRow1Calcul: string;
  scoreRow2Composante: string;
  scoreRow2Calcul: string;
  scoreRow3Composante: string;
  scoreRow3Calcul: string;
  evaluationNotesText: string;
}

@Component({
  selector: 'app-offre-preinscription-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offre-preinscription-editor.html',
  styleUrl: './offre-preinscription-editor.css',
})
export class OffrePreinscriptionEditorComponent implements OnInit {
  readonly capacityHeaders = [
    'Capacité totale',
    'Établissement d origine',
    'Capacité',
    'Type de diplôme',
    'Dates importantes',
  ];

  readonly scoreHeaders = ['Composantes', 'Mode de Calcul'];

  offerId: number | null = null;
  offer: OffrePreinscriptionItem | null = null;
  isEmptyMode = false;
  loading = false;
  savingContent = false;
  selectedPdfFileName = '';
  pdfUploadLoading = false;

  form: EditorFormModel = {
    title: '',
    openingTitle: '',
    openingBody: '',
    tableTitle: 'Tableau des capacités d accueil et calendrier',
    capInterneTotale: '35',
    capInterneOrigine: 'Institut Supérieur de l Informatique et des Mathématiques (ISIMM)',
    capInterneCapacite: '30',
    capInterneDiplome: 'Licence en Sciences de l Informatique',
    capInterneDates: 'Inscription sur le site web : www.isimm.rnu.tn/public/formulaires',
    capExterneTotale: '35',
    capExterneOrigine: 'Autres établissements',
    capExterneCapacite: '05',
    capExterneDiplome:
      'Licence en Sciences de l Informatique ou en Informatique de Gestion (uniquement)',
    capExterneDates:
      'Du jour de publication jusqu au 22 juillet 2025. Préselection le 28 juillet. Dépôt dossier du 28 au 31 juillet. Liste admis le 08 août 2025.',
    modalitesTitle: 'Modalités d inscription au Mastère',
    etape1:
      'Première étape : inscription obligatoire sur www.isimm.rnu.tn/public/formulaires et remplissage du formulaire électronique.',
    etape2:
      'Seconde étape : les candidats présélectionnés déposent leurs dossiers numériques via le site de l Institut.',
    dossierTitle: 'Composition du dossier de candidature',
    dossierItemsText:
      'Le formulaire de candidature au Mastère en Informatique\nLa fiche de candidature imprimée et signée\nUn CV d une page avec adresse, téléphone et email\nCopies certifiées conformes de tous les diplômes, y compris le Bac\nCopies certifiées conformes des relevés de notes de toutes les années et du Bac\nDocuments de report ou de réorientation si nécessaire\nTous les documents doivent être fusionnés en un seul PDF',
    scoreTitle: 'Composantes et mode de calcul du score',
    scoreRow1Composante: 'Score',
    scoreRow1Calcul: 'Score = M.G + B.N.R + B.S.P',
    scoreRow2Composante: 'Moyenne Générale (M.G)',
    scoreRow2Calcul: 'M.G = (Moyenne 1ère année + Moyenne 2ème année + Moyenne 3ème année) / 3',
    scoreRow3Composante: 'Bonus (B.N.R / B.S.P)',
    scoreRow3Calcul:
      'B.N.R: Aucun redoublement 5, un redoublement 3, deux et plus 0. B.S.P: Aucune session 3, une session 2, deux et plus 0.',
    evaluationNotesText:
      'Les dossiers incomplets ou hors délai ne sont pas examinés\nToute donnée erronée ou document falsifié annule la candidature\nLes recours sont déposés avant la date limite indiquée par l Institut\nLes originaux sont obligatoires lors de l inscription administrative',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
    private offreRichContentService: OffreRichContentService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.offerId = Number.isFinite(id) && id > 0 ? id : null;
    this.isEmptyMode = this.route.snapshot.queryParamMap.get('empty') === '1';

    if (!this.offerId) {
      this.toastService.show('Offre introuvable.', 'error');
      this.router.navigate(['/commission/dashboard'], {
        queryParams: { view: 'configuration-appels' },
      });
      return;
    }

    if (this.isEmptyMode) {
      this.form = this.createEmptyFormModel();
      this.loading = false;
      return;
    }

    this.loadOffer();
  }

  private createEmptyFormModel(): EditorFormModel {
    return {
      title: '',
      openingTitle: '',
      openingBody: '',
      tableTitle: '',
      capInterneTotale: '',
      capInterneOrigine: '',
      capInterneCapacite: '',
      capInterneDiplome: '',
      capInterneDates: '',
      capExterneTotale: '',
      capExterneOrigine: '',
      capExterneCapacite: '',
      capExterneDiplome: '',
      capExterneDates: '',
      modalitesTitle: '',
      etape1: '',
      etape2: '',
      dossierTitle: '',
      dossierItemsText: '',
      scoreTitle: '',
      scoreRow1Composante: '',
      scoreRow1Calcul: '',
      scoreRow2Composante: '',
      scoreRow2Calcul: '',
      scoreRow3Composante: '',
      scoreRow3Calcul: '',
      evaluationNotesText: '',
    };
  }

  private loadOffer(): void {
    const token = this.authService.getAccessToken();
    if (!token || !this.offerId) {
      return;
    }

    this.loading = true;

    this.http
      .get<OffrePreinscriptionItem[]>(
        'http://localhost:8003/api/candidatures/offres-inscription-responsable/',
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: (offers) => {
          this.offer = (offers || []).find((item) => Number(item.id) === this.offerId) || null;
          this.loadSavedContent();
        },
        error: () => {
          this.loadSavedContent();
        },
      });
  }

  private loadSavedContent(): void {
    if (!this.offerId) {
      this.loading = false;
      return;
    }

    this.offreRichContentService.getOffreRichContent(this.offerId).subscribe({
      next: (existing) => {
        if (existing) {
          this.form = this.toForm(existing);
        } else if (this.offer) {
          this.prefillFromOffer();
        }

        this.loading = false;
      },
      error: () => {
        if (this.offer) {
          this.prefillFromOffer();
        }
        this.loading = false;
      },
    });
  }

  private prefillFromOffer(): void {
    if (!this.offer) {
      return;
    }

    this.form.title = this.offer.titre;
    this.form.openingTitle = `Avis d ouverture des candidatures pour l inscription au ${this.offer.titre}`;
    this.form.openingBody = `La direction de l ISIMM annonce l ouverture des candidatures pour l inscription en première année du ${this.offer.titre}.`;
  }

  save(): void {
    if (!this.offerId) {
      return;
    }

    const payload = this.toContent(this.form, this.offerId);
    this.savingContent = true;
    this.offreRichContentService.saveOffreRichContent(payload).subscribe({
      next: (saved) => {
        this.form = this.toForm(saved);
        this.toastService.show(
          'Contenu de l offre enregistré. Visible côté candidat sur Détail.',
          'success',
        );
        this.savingContent = false;
      },
      error: (error) => {
        console.error('Erreur enregistrement contenu offre:', error);
        this.toastService.show('Erreur lors de l enregistrement du contenu.', 'error');
        this.savingContent = false;
      },
    });
  }

  backToDashboard(): void {
    this.router.navigate(['/commission/dashboard'], {
      queryParams: { view: 'configuration-appels' },
    });
  }

  onPdfFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;

    if (!file) {
      this.selectedPdfFileName = '';
      return;
    }

    if (file.type !== 'application/pdf') {
      this.toastService.show('Veuillez sélectionner un fichier PDF.', 'warning');
      input.value = '';
      this.selectedPdfFileName = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.toastService.show('Le fichier dépasse 10 Mo.', 'warning');
      input.value = '';
      this.selectedPdfFileName = '';
      return;
    }

    this.selectedPdfFileName = file.name;
  }

  uploadOfficialPdf(fileInput: HTMLInputElement): void {
    if (!this.offerId) {
      return;
    }

    const file = fileInput.files?.[0] || null;
    if (!file) {
      this.toastService.show('Veuillez choisir un fichier PDF.', 'warning');
      return;
    }

    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.pdfUploadLoading = true;

    const formData = new FormData();
    formData.append('document_pdf', file);

    this.http
      .post<any>(
        `http://localhost:8003/api/candidatures/configuration/${this.offerId}/document-pdf/`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      .subscribe({
        next: (response) => {
          if (this.offer) {
            this.offer = {
              ...this.offer,
              document_officiel_pdf_url: response?.document_url || null,
            };
          }

          this.toastService.show('PDF officiel chargé avec succès.', 'success');
          this.selectedPdfFileName = '';
          fileInput.value = '';
          this.pdfUploadLoading = false;
        },
        error: (error) => {
          console.error('Erreur upload PDF officiel:', error);
          this.toastService.show('Erreur lors du chargement du PDF officiel.', 'error');
          this.pdfUploadLoading = false;
        },
      });
  }

  private toContent(form: EditorFormModel, offerId: number): OffreRichContent {
    const rowInterneParts = [
      form.capInterneTotale,
      form.capInterneOrigine,
      form.capInterneCapacite,
      form.capInterneDiplome,
      form.capInterneDates,
    ].map((item) => item.trim());

    const rowExterneParts = [
      form.capExterneTotale,
      form.capExterneOrigine,
      form.capExterneCapacite,
      form.capExterneDiplome,
      form.capExterneDates,
    ].map((item) => item.trim());

    const scoreRows = [
      [form.scoreRow1Composante.trim(), form.scoreRow1Calcul.trim()],
      [form.scoreRow2Composante.trim(), form.scoreRow2Calcul.trim()],
      [form.scoreRow3Composante.trim(), form.scoreRow3Calcul.trim()],
    ];

    return {
      offerId,
      title: form.title.trim(),
      openingTitle: form.openingTitle.trim(),
      openingBody: form.openingBody.trim(),
      tableTitle: form.tableTitle.trim(),
      tableHeaders: this.capacityHeaders,
      tableRows: [rowInterneParts, rowExterneParts],
      modalitesTitle: form.modalitesTitle.trim(),
      etape1: form.etape1.trim(),
      etape2: form.etape2.trim(),
      dossierTitle: form.dossierTitle.trim(),
      dossierItems: this.splitByLine(form.dossierItemsText),
      scoreTitle: form.scoreTitle.trim(),
      scoreFormula: form.scoreRow1Calcul.trim(),
      moyenneFormula: form.scoreRow2Calcul.trim(),
      scoreTableHeaders: this.scoreHeaders,
      scoreTableRows: scoreRows,
      bnrRules: [],
      bspRules: [],
      evaluationNotes: this.splitByLine(form.evaluationNotesText),
      updatedAt: new Date().toISOString(),
    };
  }

  private toForm(content: OffreRichContent): EditorFormModel {
    const cap1 = content.tableRows?.[0] || [];
    const cap2 = content.tableRows?.[1] || [];
    const score1 = content.scoreTableRows?.[0] || [];
    const score2 = content.scoreTableRows?.[1] || [];
    const score3 = content.scoreTableRows?.[2] || [];

    return {
      title: content.title || '',
      openingTitle: content.openingTitle || '',
      openingBody: content.openingBody || '',
      tableTitle: content.tableTitle || '',
      capInterneTotale: cap1[0] || '',
      capInterneOrigine: cap1[1] || '',
      capInterneCapacite: cap1[2] || '',
      capInterneDiplome: cap1[3] || '',
      capInterneDates: cap1[4] || '',
      capExterneTotale: cap2[0] || '',
      capExterneOrigine: cap2[1] || '',
      capExterneCapacite: cap2[2] || '',
      capExterneDiplome: cap2[3] || '',
      capExterneDates: cap2[4] || '',
      modalitesTitle: content.modalitesTitle || '',
      etape1: content.etape1 || '',
      etape2: content.etape2 || '',
      dossierTitle: content.dossierTitle || '',
      dossierItemsText: (content.dossierItems || []).join('\n'),
      scoreTitle: content.scoreTitle || '',
      scoreRow1Composante: score1[0] || 'Score',
      scoreRow1Calcul: score1[1] || content.scoreFormula || '',
      scoreRow2Composante: score2[0] || 'Moyenne Générale (M.G)',
      scoreRow2Calcul: score2[1] || content.moyenneFormula || '',
      scoreRow3Composante: score3[0] || 'Bonus (B.N.R / B.S.P)',
      scoreRow3Calcul:
        score3[1] || [...(content.bnrRules || []), ...(content.bspRules || [])].join(' '),
      evaluationNotesText: (content.evaluationNotes || []).join('\n'),
    };
  }

  private splitByLine(value: string): string[] {
    return String(value || '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => !!line);
  }
}
