import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

interface Specialite {
  id: string;
  nom: string;
}

interface FormationOption {
  code: string;
  label: string;
}

@Component({
  selector: 'app-candidature-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './candidature-form.component.html',
  styleUrls: ['./candidature-form.component.css'],
})
export class CandidatureFormComponent implements OnInit {
  typeCandidature: string = 'master';
  masterParcours: '' | 'mrgl' | 'mrmi' | 'mpgl' | 'mpds' | 'mp3i' = '';

  formData = {
    prenom: '',
    nom: '',
    dateNaissance: '',
    cin: '',
    email: '',
    telephone: '',
    specialiteBac: '',
    anneeBac: '',
    moyenneBacSessionPrincipale: null as number | null,
    noteMathBac: null as number | null,
    noteFrancaisBac: null as number | null,
    noteAnglaisBac: null as number | null,
    certificationB2: '',
    etablissementUniversitaireOrigine: '',
    specialiteDiplomeObtenu: '',
    anneeObtentionDernierDiplome: '',
    natureDiplome: '',
    typeLicence: '',
    moyenne1ereAnnee: null as number | null,
    sessionReussite1ereAnnee: '',
    moyenne2emeAnnee: null as number | null,
    sessionReussite2emeAnnee: '',
    moyenne3emeAnnee: null as number | null,
    sessionReussite3emeAnnee: '',
    moyenne4emeAnnee: null as number | null,
    sessionReussite4emeAnnee: '',
    moyenneSemestre1TroisiemeAnnee: null as number | null,
    natureCandidature: '',
    etablissementExterne: '',
    specialiteExterne: '',
    nombreAnneesRedoublement: '0',
    classement1ereAnnee: '',
    classement2emeAnnee: '',
    moyenneSessionPrincipale1ereAnnee: null as number | null,
    moyenneSessionControle1ereAnnee: null as number | null,
    moyenneSessionPrincipale2emeAnnee: null as number | null,
    moyenneSessionControle2emeAnnee: null as number | null,
    moyenneSessionPrincipale1ereAnneeRedoublement: null as number | null,
    moyenneSessionControle1ereAnneeRedoublement: null as number | null,
    moyenneSessionPrincipale2emeAnneeRedoublement: null as number | null,
    moyenneSessionControle2emeAnneeRedoublement: null as number | null,
    moyenneIng1: null as number | null,
    sessionReussiteIng1: '',
    nombreAnneesRedoublementIng1: '0',
    categorieIngenieur: '',
    specialite: '',
    confirmationDeclaration: '',
    passwordMode: 'auto',
    password: '',
    confirmPassword: '',
  };

  candidatureForm!: FormGroup;

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  generatedPasswordMessage = '';
  copiedPassword = false;
  private copyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  currentFormStep = 1;
  maxUnlockedFormStep = 1;
  readonly totalFormSteps = 4;
  readonly formSteps = [
    { no: 1, label: 'Profil' },
    { no: 2, label: 'Bac et diplôme' },
    { no: 3, label: 'Parcours académique' },
    { no: 4, label: 'Validation' },
  ];

  // Options demandees pour le formulaire master (MRGL)
  specialiteBacOptions: FormationOption[] = [
    { code: 'informatique', label: 'Informatique' },
    { code: 'economique', label: 'Economique' },
    { code: 'mathematique', label: 'Mathematique' },
    { code: 'technique', label: 'Technique' },
    { code: 'science_experimentale', label: 'Science experimentale' },
    { code: 'autre', label: 'Autre' },
  ];

  specialiteDiplomeOptionsMrgl: string[] = [
    'Licence en Informatique : GL & SI',
    'Licence en Informatique de Gestion : BI',
  ];

  specialiteDiplomeOptionsMpds: string[] = [
    'Licence en Informatique : GL & SI',
    'Licence en Informatique de Gestion : BI',
    'Licence en Mathématiques Appliquées (ou équivalent)',
  ];

  specialiteDiplomeOptionsMrmi: string[] = [
    'Licence en EEA, MIM (Electronique, Systemes Embarques, Metrologie) ou TIC (Reseaux et IoT)',
    'Licence en Electronique, Automatique ou Mesures et Instrumentation',
    'Reussite en 1ere annee du cycle ingenieur (Electronique/Instrumentation) ou equivalent',
  ];

  specialiteDiplomeOptionsMp3i: string[] = [
    'Licence en Électronique, Électrotechnique et Automatique (MIM)',
    'Licence en Électronique, Électrotechnique et Automatique (SE)',
    "Licence en Technologies de l'Information et de la Communication (TIC)",
    'Licence en Mesures et Instrumentation',
    'Licence en EEA (Spécialité Automatique et Informatique Industrielle ou Mesures et Métrologie)',
    'Licence en Génie Électrique (Spécialité Automatique et Informatique Industrielle)',
  ];

  specialiteDiplomeOptionsIngenieur: string[] = [
    "Licence en Sciences de l'Informatique (Génie Logiciel et Systèmes d'Information)",
    'Licence en Mathématiques et Informatique (ou diplôme équivalent)',
    'Cycle préparatoire intégré',
  ];

  natureDiplomeOptions: string[] = ['Licence', 'Maitrise'];
  natureDiplomeOptionsIngenieur: string[] = ['Licence', 'Cycle ingénieur'];
  typeLicenceOptions: string[] = ['Licence Nationale', 'Licence Ancien Régime'];
  ouiNonOptions: string[] = ['Oui', 'Non'];
  sessionOptions: string[] = ['Principale', 'Controle'];
  natureCandidatureOptions: string[] = ['Étudiant ISIMM', 'Étudiant Externe'];
  categoriesIngenieurOptions: string[] = [
    "Catégorie 1 : Les étudiants ayant réussi la deuxième année du cycle préparatoire intégré en informatique à l'ISIMM lors de l'année 2024-2025.",
    "Catégorie 2 : Les étudiants brillants inscrits en troisième année de Licence (système LMD) dans des spécialités scientifiques et techniques en 2024-2025, et n'ayant jamais redoublé durant leur cursus universitaire.",
  ];

  specialitesIngenieur: Specialite[] = [
    { id: '1', nom: 'Génie Informatique' },
    { id: '2', nom: 'Génie Électrique' },
    { id: '3', nom: 'Génie Mécanique' },
  ];

  constructor(
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    // Récupérer le type depuis l'URL
    this.route.queryParams.subscribe((params) => {
      if (params['type']) {
        this.typeCandidature = this.normalizeTypeParam(params['type']);
        console.log('🎯 Type reçu:', this.typeCandidature);
      }

      this.masterParcours = this.normalizeMasterParcoursParam(params['parcours']);

      const availableDiplomaOptions = this.getSpecialiteDiplomeOptions();
      if (
        this.formData.specialiteDiplomeObtenu &&
        !availableDiplomaOptions.includes(this.formData.specialiteDiplomeObtenu)
      ) {
        this.formData.specialiteDiplomeObtenu = '';
      }
    });

    // Initialiser le formulaire
    this.candidatureForm = this.fb.group({
      prenom: [''],
      nom: [''],
      dateNaissance: [''],
      cin: [''],
      email: [''],
      telephone: [''],
      specialiteBac: [''],
      anneeBac: [''],
      moyenneBacSessionPrincipale: [null],
      noteMathBac: [null],
      noteFrancaisBac: [null],
      noteAnglaisBac: [null],
      certificationB2: [''],
      etablissementUniversitaireOrigine: [''],
      specialiteDiplomeObtenu: [''],
      anneeObtentionDernierDiplome: [''],
      natureDiplome: [''],
      typeLicence: [''],
      moyenne1ereAnnee: [null],
      sessionReussite1ereAnnee: [''],
      moyenne2emeAnnee: [null],
      sessionReussite2emeAnnee: [''],
      moyenne3emeAnnee: [null],
      sessionReussite3emeAnnee: [''],
      moyenne4emeAnnee: [null],
      sessionReussite4emeAnnee: [''],
      moyenneSemestre1TroisiemeAnnee: [null],
      natureCandidature: [''],
      etablissementExterne: [''],
      specialiteExterne: [''],
      nombreAnneesRedoublement: ['0'],
      classement1ereAnnee: [''],
      classement2emeAnnee: [''],
      moyenneSessionPrincipale1ereAnnee: [null],
      moyenneSessionControle1ereAnnee: [null],
      moyenneSessionPrincipale2emeAnnee: [null],
      moyenneSessionControle2emeAnnee: [null],
      moyenneSessionPrincipale1ereAnneeRedoublement: [null],
      moyenneSessionControle1ereAnneeRedoublement: [null],
      moyenneSessionPrincipale2emeAnneeRedoublement: [null],
      moyenneSessionControle2emeAnneeRedoublement: [null],
      moyenneIng1: [null],
      sessionReussiteIng1: [''],
      nombreAnneesRedoublementIng1: ['0'],
      categorieIngenieur: [''],
      specialite: [''],
      confirmationDeclaration: [''],
      type_candidature: [this.typeCandidature, Validators.required],
    });

    this.updateValidations();
  }

  private normalizeTypeParam(rawType: string): 'master' | 'ingenieur' {
    const normalized = rawType
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return normalized === 'ingenieur' ? 'ingenieur' : 'master';
  }

  private normalizeMasterParcoursParam(
    rawParcours: string | undefined,
  ): '' | 'mrgl' | 'mrmi' | 'mpgl' | 'mpds' | 'mp3i' {
    if (!rawParcours) return '';

    const normalized = rawParcours
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      normalized === 'mrgl' ||
      normalized === 'mrmi' ||
      normalized === 'mpgl' ||
      normalized === 'mpds' ||
      normalized === 'mp3i'
    ) {
      return normalized;
    }

    return '';
  }

  getMasterFormTitle(): string {
    if (this.masterParcours === 'mrmi') {
      return '📚 Candidature Master - Mastère Recherche en Micro-électronique et Instrumentation (MRMI)';
    }

    if (this.masterParcours === 'mrgl') {
      return '📚 Candidature Master - Mastère Recherche en Génie Logiciel (MRGL)';
    }

    if (this.masterParcours === 'mpgl') {
      return '📚 Candidature Master - Mastère Professionnel en Génie Logiciel (MPGL)';
    }

    if (this.masterParcours === 'mpds') {
      return '📚 Candidature Master - Mastère Professionnel en Science de Données (MPDS)';
    }

    if (this.masterParcours === 'mp3i') {
      return '📚 Candidature Master - Mastère Professionnel en Génie des Instruments Industriels (MP3I)';
    }

    return '📚 Candidature à un Master';
  }

  getSpecialiteDiplomeOptions(): string[] {
    if (this.typeCandidature === 'ingenieur') {
      return this.specialiteDiplomeOptionsIngenieur;
    }

    if (this.masterParcours === 'mrmi') {
      return this.specialiteDiplomeOptionsMrmi;
    }

    if (this.masterParcours === 'mpds') {
      return this.specialiteDiplomeOptionsMpds;
    }

    if (this.masterParcours === 'mp3i') {
      return this.specialiteDiplomeOptionsMp3i;
    }

    return this.specialiteDiplomeOptionsMrgl;
  }

  getNatureDiplomeOptions(): string[] {
    return this.typeCandidature === 'ingenieur'
      ? this.natureDiplomeOptionsIngenieur
      : this.natureDiplomeOptions;
  }

  isIngenieurCategorie2Selected(): boolean {
    return this.formData.categorieIngenieur.startsWith('Catégorie 2');
  }

  isIngenieurCategoriePrepaSelected(): boolean {
    return this.formData.categorieIngenieur.startsWith('Catégorie 1');
  }

  isIngenieurCategorieLicenceSelected(): boolean {
    return this.formData.categorieIngenieur.startsWith('Catégorie 2');
  }

  shouldShowTroisiemeAnneeFields(): boolean {
    return !(this.typeCandidature === 'ingenieur' && this.isIngenieurCategoriePrepaSelected());
  }

  isIng1EquivalentProfileSelected(): boolean {
    return (
      this.formData.specialiteDiplomeObtenu ===
      'Reussite en 1ere annee du cycle ingenieur (Electronique/Instrumentation) ou equivalent'
    );
  }

  shouldShowIngenieurSessionAverages(): boolean {
    if (this.typeCandidature !== 'ingenieur') {
      return false;
    }

    const isCycleIngenieur = this.formData.natureDiplome === 'Cycle ingénieur';

    return isCycleIngenieur;
  }

  hasRedoublement(): boolean {
    return Number(this.formData.nombreAnneesRedoublement || '0') > 0;
  }

  isProfessionalMasterSelected(): boolean {
    return (
      this.masterParcours === 'mpgl' ||
      this.masterParcours === 'mpds' ||
      this.masterParcours === 'mp3i'
    );
  }

  isEtudiantExterneSelected(): boolean {
    return this.formData.natureCandidature === 'Étudiant Externe';
  }

  shouldShowMrglFourthYearFields(): boolean {
    return this.masterParcours === 'mrgl' && this.formData.natureDiplome === 'Maitrise';
  }

  private isValidNote(value: number | null): boolean {
    return value === null || (value >= 0 && value <= 20);
  }

  private hasValue(value: unknown): boolean {
    return String(value ?? '') !== '';
  }

  isFormStepAccessible(step: number): boolean {
    return step >= 1 && step <= this.maxUnlockedFormStep;
  }

  goToFormStep(step: number): void {
    if (!this.isFormStepAccessible(step)) {
      return;
    }

    this.currentFormStep = step;
    this.errorMessage = '';
  }

  previousFormStep(): void {
    if (this.currentFormStep > 1) {
      this.currentFormStep -= 1;
      this.errorMessage = '';
    }
  }

  nextFormStep(): void {
    if (!this.isFormStepValid(this.currentFormStep)) {
      this.errorMessage = this.getFormStepValidationMessage(this.currentFormStep);
      return;
    }

    if (this.currentFormStep < this.totalFormSteps) {
      this.currentFormStep += 1;
      this.maxUnlockedFormStep = Math.max(this.maxUnlockedFormStep, this.currentFormStep);
      this.errorMessage = '';
    }
  }

  private isFormStepValid(step: number): boolean {
    if (step === 1) {
      return (
        this.formData.prenom.trim() !== '' &&
        this.formData.nom.trim() !== '' &&
        this.formData.dateNaissance.trim() !== '' &&
        this.formData.cin.trim() !== '' &&
        this.formData.email.trim() !== '' &&
        this.formData.telephone.trim() !== ''
      );
    }

    if (step === 2) {
      const baseValid =
        this.formData.specialiteBac.trim() !== '' &&
        this.formData.anneeBac !== '' &&
        this.formData.moyenneBacSessionPrincipale !== null &&
        this.formData.etablissementUniversitaireOrigine.trim() !== '' &&
        this.formData.specialiteDiplomeObtenu.trim() !== '' &&
        this.formData.anneeObtentionDernierDiplome !== '' &&
        this.formData.natureDiplome.trim() !== '';

      if (!baseValid) {
        return false;
      }

      if (this.masterParcours === 'mrgl') {
        return (
          this.formData.noteMathBac !== null &&
          this.formData.noteFrancaisBac !== null &&
          this.formData.noteAnglaisBac !== null &&
          this.formData.certificationB2.trim() !== ''
        );
      }

      if (this.isProfessionalMasterSelected()) {
        return this.formData.typeLicence.trim() !== '';
      }

      return true;
    }

    if (step === 3) {
      const requiredAcademicFields =
        this.formData.moyenne1ereAnnee !== null &&
        this.formData.sessionReussite1ereAnnee.trim() !== '' &&
        this.formData.moyenne2emeAnnee !== null &&
        this.formData.sessionReussite2emeAnnee.trim() !== '' &&
        this.formData.natureCandidature.trim() !== '' &&
        this.hasValue(this.formData.nombreAnneesRedoublement);

      if (!requiredAcademicFields || !this.validateScoresRange()) {
        return false;
      }

      if (this.shouldShowTroisiemeAnneeFields()) {
        if (
          this.formData.moyenne3emeAnnee === null ||
          this.formData.sessionReussite3emeAnnee.trim() === ''
        ) {
          return false;
        }
      }

      if (this.shouldShowMrglFourthYearFields()) {
        if (
          this.formData.moyenne4emeAnnee === null ||
          this.formData.sessionReussite4emeAnnee.trim() === ''
        ) {
          return false;
        }
      }

      if (this.isEtudiantExterneSelected()) {
        return (
          this.formData.etablissementExterne.trim() !== '' &&
          this.formData.specialiteExterne.trim() !== ''
        );
      }

      return true;
    }

    return true;
  }

  private getFormStepValidationMessage(step: number): string {
    if (step === 1) {
      return 'Complétez les informations personnelles obligatoires avant de continuer.';
    }

    if (step === 2) {
      return 'Complétez les champs obligatoires du bac et du diplôme avant de continuer.';
    }

    if (step === 3) {
      return 'Complétez les informations académiques obligatoires avant de continuer.';
    }

    return 'Veuillez compléter les champs requis avant de continuer.';
  }

  private getScoreValues(): number[] {
    const values: Array<number | null> = [
      this.formData.moyenne1ereAnnee,
      this.formData.moyenne2emeAnnee,
      this.formData.moyenne3emeAnnee,
      this.formData.moyenne4emeAnnee,
      this.formData.moyenneIng1,
    ];

    return values.filter((value): value is number => value !== null);
  }

  getAcademicAveragePreview(): number | null {
    const scores = this.getScoreValues();
    if (scores.length === 0) {
      return null;
    }

    const total = scores.reduce((sum, value) => sum + value, 0);
    return Number((total / scores.length).toFixed(2));
  }

  getEstimatedScorePreview(): number | null {
    if (this.formData.moyenneBacSessionPrincipale === null) {
      return null;
    }

    const academicAvg = this.getAcademicAveragePreview();
    if (academicAvg === null) {
      return null;
    }

    const redoublementPenalty =
      Math.min(Number(this.formData.nombreAnneesRedoublement || '0'), 3) * 0.25;
    const weightedScore =
      this.formData.moyenneBacSessionPrincipale * 0.4 + academicAvg * 0.6 - redoublementPenalty;

    return Number(Math.max(0, weightedScore).toFixed(2));
  }

  getEstimatedScoreDisplay(): string {
    const score = this.getEstimatedScorePreview();
    return score === null ? 'En attente des notes' : `${score.toFixed(2)} / 20`;
  }

  copyGeneratedPassword(): void {
    if (!this.generatedPasswordMessage) {
      return;
    }

    navigator.clipboard
      .writeText(this.generatedPasswordMessage)
      .then(() => {
        this.copiedPassword = true;
        if (this.copyFeedbackTimer) {
          clearTimeout(this.copyFeedbackTimer);
        }
        this.copyFeedbackTimer = setTimeout(() => {
          this.copiedPassword = false;
        }, 1400);
      })
      .catch(() => {
        this.copiedPassword = false;
      });
  }

  private validateScoresRange(): boolean {
    const scoreFields: Array<number | null> = [
      this.formData.moyenneBacSessionPrincipale,
      this.formData.noteMathBac,
      this.formData.noteFrancaisBac,
      this.formData.noteAnglaisBac,
      this.formData.moyenne1ereAnnee,
      this.formData.moyenne2emeAnnee,
      this.formData.moyenne3emeAnnee,
      this.formData.moyenne4emeAnnee,
      this.formData.moyenneSemestre1TroisiemeAnnee,
      this.formData.moyenneSessionPrincipale1ereAnnee,
      this.formData.moyenneSessionControle1ereAnnee,
      this.formData.moyenneSessionPrincipale2emeAnnee,
      this.formData.moyenneSessionControle2emeAnnee,
      this.formData.moyenneSessionPrincipale1ereAnneeRedoublement,
      this.formData.moyenneSessionControle1ereAnneeRedoublement,
      this.formData.moyenneSessionPrincipale2emeAnneeRedoublement,
      this.formData.moyenneSessionControle2emeAnneeRedoublement,
      this.formData.moyenneIng1,
    ];

    return scoreFields.every((value) => this.isValidNote(value));
  }

  // Mettre à jour les validations selon le type de candidature
  updateValidations(): void {
    if (!this.candidatureForm) return;
  }

  // Soumission du formulaire
  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.generatedPasswordMessage = '';

    // Validation de base
    if (!this.formData.prenom || !this.formData.nom || !this.formData.email || !this.formData.cin) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (
      !this.formData.specialiteBac ||
      !this.formData.anneeBac ||
      this.formData.moyenneBacSessionPrincipale === null ||
      !this.formData.etablissementUniversitaireOrigine ||
      !this.formData.specialiteDiplomeObtenu ||
      !this.formData.anneeObtentionDernierDiplome ||
      !this.formData.natureDiplome ||
      this.formData.moyenne1ereAnnee === null ||
      !this.formData.sessionReussite1ereAnnee ||
      this.formData.moyenne2emeAnnee === null ||
      !this.formData.sessionReussite2emeAnnee ||
      !this.formData.natureCandidature ||
      this.formData.nombreAnneesRedoublement === ''
    ) {
      this.errorMessage = 'Veuillez renseigner tous les champs obligatoires du Bac et du diplôme.';
      return;
    }

    if (!this.validateScoresRange()) {
      this.errorMessage = 'Les moyennes et notes doivent etre comprises entre 0 et 20.';
      return;
    }

    if (this.isEtudiantExterneSelected()) {
      if (!this.formData.etablissementExterne.trim() || !this.formData.specialiteExterne.trim()) {
        this.errorMessage =
          "Veuillez renseigner l'établissement et la spécialité pour un étudiant externe.";
        return;
      }
    }

    if (this.shouldShowTroisiemeAnneeFields()) {
      const isIngenieur = this.typeCandidature === 'ingenieur';
      const missingTroisiemeAnneeFields =
        this.formData.moyenne3emeAnnee === null || !this.formData.sessionReussite3emeAnnee;
      const missingIngenieurSemestre1 =
        isIngenieur && this.formData.moyenneSemestre1TroisiemeAnnee === null;

      if (missingTroisiemeAnneeFields || missingIngenieurSemestre1) {
        this.errorMessage = isIngenieur
          ? 'Veuillez renseigner tous les champs obligatoires de la 3ème année.'
          : 'Veuillez renseigner la moyenne et la session de réussite de la 3ème année.';
        return;
      }
    }

    if (this.masterParcours === 'mrgl') {
      if (
        this.formData.noteMathBac === null ||
        this.formData.noteFrancaisBac === null ||
        this.formData.noteAnglaisBac === null ||
        !this.formData.certificationB2 ||
        (this.shouldShowMrglFourthYearFields() &&
          (this.formData.moyenne4emeAnnee === null || !this.formData.sessionReussite4emeAnnee))
      ) {
        this.errorMessage =
          'Veuillez renseigner les notes du bac, la certification B2, et les champs de 4ème année si vous avez choisi la Maîtrise pour MRGL.';
        return;
      }
    }

    if (this.typeCandidature === 'ingenieur' && this.isIngenieurCategorieLicenceSelected()) {
      if (this.formData.classement1ereAnnee === '' || this.formData.classement2emeAnnee === '') {
        this.errorMessage =
          'Veuillez renseigner le classement de la 1ère année et de la 2ème année.';
        return;
      }
    }

    if (this.typeCandidature === 'ingenieur' && !this.formData.categorieIngenieur) {
      this.errorMessage = 'Veuillez sélectionner une catégorie pour la candidature ingénieur.';
      return;
    }

    if (this.shouldShowIngenieurSessionAverages()) {
      if (
        this.formData.moyenneSessionPrincipale1ereAnnee === null ||
        this.formData.moyenneSessionControle1ereAnnee === null ||
        this.formData.moyenneSessionPrincipale2emeAnnee === null ||
        this.formData.moyenneSessionControle2emeAnnee === null
      ) {
        this.errorMessage =
          'Veuillez renseigner les moyennes de réussite (session principale et contrôle) pour la 1ère et la 2ème année.';
        return;
      }

      if (this.hasRedoublement()) {
        if (
          this.formData.moyenneSessionPrincipale1ereAnneeRedoublement === null ||
          this.formData.moyenneSessionControle1ereAnneeRedoublement === null ||
          this.formData.moyenneSessionPrincipale2emeAnneeRedoublement === null ||
          this.formData.moyenneSessionControle2emeAnneeRedoublement === null
        ) {
          this.errorMessage =
            'Veuillez renseigner les moyennes de réussite (session principale et contrôle) pour le cas de redoublement.';
          return;
        }
      }
    }

    if (this.isProfessionalMasterSelected() && !this.formData.typeLicence) {
      this.errorMessage = 'Veuillez sélectionner le type de licence pour MPGL/MPDS/MP3I.';
      return;
    }

    if (this.isIng1EquivalentProfileSelected()) {
      if (
        this.formData.moyenneIng1 === null ||
        !this.formData.sessionReussiteIng1 ||
        this.formData.nombreAnneesRedoublementIng1 === ''
      ) {
        this.errorMessage =
          'Veuillez renseigner les champs ING1 (moyenne, session et redoublement).';
        return;
      }
    }

    // Validation du mot de passe si mode manuel
    if (this.formData.passwordMode === 'manual') {
      if (!this.formData.password || !this.formData.confirmPassword) {
        this.errorMessage = 'Veuillez entrer et confirmer votre mot de passe';
        return;
      }
      if (this.formData.password.length < 8) {
        this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
        return;
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas';
        return;
      }
    }

    if (this.formData.confirmationDeclaration.trim().toLowerCase() !== 'je confirme') {
      this.errorMessage = 'Veuillez saisir exactement "je confirme" pour valider la declaration.';
      return;
    }

    this.isLoading = true;

    const generatedPassword =
      this.formData.passwordMode === 'manual' ? this.formData.password : this.generatePassword();

    // Préparer les données
    const candidatureData = {
      first_name: this.formData.prenom,
      last_name: this.formData.nom,
      cin: this.formData.cin,
      date_naissance: this.formData.dateNaissance,
      email: this.formData.email,
      telephone: this.formData.telephone,
      type_candidature: this.typeCandidature,
      etablissement_origine: this.formData.etablissementUniversitaireOrigine,
      diplome_obtenu: this.formData.natureDiplome,
      etablissement_externe: this.formData.etablissementExterne,
      specialite_externe: this.formData.specialiteExterne,
      annees_rattrapage: Number(this.formData.nombreAnneesRedoublement || '0'),
      bsp: 0,
      notes_academiques: {
        specialite_baccalaureat: this.formData.specialiteBac,
        annee_baccalaureat: this.formData.anneeBac,
        moyenne_bac_session_principale: this.formData.moyenneBacSessionPrincipale,
        note_mathematiques_bac: this.formData.noteMathBac,
        note_francais_bac: this.formData.noteFrancaisBac,
        note_anglais_bac: this.formData.noteAnglaisBac,
        certification_niveau_b2: this.formData.certificationB2,
        specialite_diplome_obtenu: this.formData.specialiteDiplomeObtenu,
        annee_obtention_dernier_diplome: this.formData.anneeObtentionDernierDiplome,
        nature_diplome: this.formData.natureDiplome,
        type_licence: this.formData.typeLicence,
        moyenne_1ere_annee: this.formData.moyenne1ereAnnee,
        session_reussite_1ere_annee: this.formData.sessionReussite1ereAnnee,
        moyenne_2eme_annee: this.formData.moyenne2emeAnnee,
        session_reussite_2eme_annee: this.formData.sessionReussite2emeAnnee,
        moyenne_3eme_annee: this.formData.moyenne3emeAnnee,
        session_reussite_3eme_annee: this.formData.sessionReussite3emeAnnee,
        moyenne_semestre1_3eme_annee: this.formData.moyenneSemestre1TroisiemeAnnee,
        classement_1ere_annee: this.formData.classement1ereAnnee,
        classement_2eme_annee: this.formData.classement2emeAnnee,
        nature_candidature: this.formData.natureCandidature,
        nombre_annees_redoublement: Number(this.formData.nombreAnneesRedoublement || '0'),
        moyenne_session_principale_1ere_annee: this.formData.moyenneSessionPrincipale1ereAnnee,
        moyenne_session_controle_1ere_annee: this.formData.moyenneSessionControle1ereAnnee,
        moyenne_session_principale_2eme_annee: this.formData.moyenneSessionPrincipale2emeAnnee,
        moyenne_session_controle_2eme_annee: this.formData.moyenneSessionControle2emeAnnee,
        moyenne_session_principale_1ere_annee_redoublement:
          this.formData.moyenneSessionPrincipale1ereAnneeRedoublement,
        moyenne_session_controle_1ere_annee_redoublement:
          this.formData.moyenneSessionControle1ereAnneeRedoublement,
        moyenne_session_principale_2eme_annee_redoublement:
          this.formData.moyenneSessionPrincipale2emeAnneeRedoublement,
        moyenne_session_controle_2eme_annee_redoublement:
          this.formData.moyenneSessionControle2emeAnneeRedoublement,
        moyenne_ing1: this.formData.moyenneIng1,
        session_reussite_ing1: this.formData.sessionReussiteIng1,
        nombre_annees_redoublement_ing1: Number(this.formData.nombreAnneesRedoublementIng1 || '0'),
        categorie_ingenieur: this.formData.categorieIngenieur,
      },
      documents_declares: {},

      // Plus de vœux dans le formulaire master
      voeux: [],

      specialite: null,

      // Mot de passe
      password: generatedPassword,
    };

    // Le endpoint auth/register attend un payload strict (password2 obligatoire).
    const registerPayload = {
      first_name: candidatureData.first_name,
      last_name: candidatureData.last_name,
      email: candidatureData.email,
      role: 'candidat',
      password: generatedPassword,
      password2: generatedPassword,
    };

    console.log('📤 Données candidature (local):', candidatureData);
    console.log('📤 Données envoyées register:', registerPayload);

    this.authService.register(registerPayload).subscribe({
      next: (response: any) => {
        console.log('✅ Candidature créée:', response);
        this.successMessage =
          'Compte créé avec succès. Conservez ce mot de passe puis connectez-vous.';
        this.generatedPasswordMessage = generatedPassword;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur inscription:', error);
        this.isLoading = false;

        let errorMessage = 'Erreur lors de la candidature.';
        if (error?.error) {
          if (typeof error.error === 'string') {
            errorMessage += `\n${error.error}`;
          } else {
            const details = Object.entries(error.error)
              .map(
                ([field, messages]) =>
                  `${field}: ${Array.isArray(messages) ? messages.join(', ') : String(messages)}`,
              )
              .join('\n');
            if (details) {
              errorMessage += `\n\n${details}`;
            }
          }
        }

        this.errorMessage = errorMessage;
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  onCancel(): void {
    if (this.typeCandidature === 'ingenieur') {
      this.router.navigate(['/masters/ingenieur/exploration']);
      return;
    }

    if (
      this.masterParcours === 'mpgl' ||
      this.masterParcours === 'mpds' ||
      this.masterParcours === 'mp3i'
    ) {
      this.router.navigate(['/masters/professionnel/exploration']);
      return;
    }

    this.router.navigate(['/masters/recherche/exploration']);
  }

  // Générer un mot de passe aléatoire
  generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}
