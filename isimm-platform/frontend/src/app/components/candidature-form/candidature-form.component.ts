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
import { AuthService } from '../../services/auth.service';

interface Master {
  id: string;
  nom: string;
}

interface Specialite {
  id: string;
  nom: string;
}

@Component({
  selector: 'app-candidature-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './candidature-form.component.html',
  styleUrls: ['./candidature-form.component.css'],
})
export class CandidatureFormComponent implements OnInit {
  typeCandidature: string = 'master';

  formData = {
    prenom: '',
    nom: '',
    dateNaissance: '',
    cin: '',
    email: '',
    telephone: '',
    moyenneBac: null as number | null,
    moyenneL1: null as number | null,
    moyenneL2: null as number | null,
    moyenneL3: null as number | null,
    voeu1: '',
    voeu2: '',
    voeu3: '',
    specialite: '',
    passwordMode: 'auto',
    password: '',
    confirmPassword: '',
  };

  candidatureForm!: FormGroup;

  accepteCGU = false;
  isLoading = false;
  errorMessage = '';

  // Listes de choix - données hardcodées
  mastersList: Master[] = [
    { id: '1', nom: 'Master de recherche en génie logiciel' },
    { id: '2', nom: 'Master de recherche en Microélectronique et Instrumentation' },
    { id: '3', nom: 'Master Professionnel en Data Science' },
    { id: '4', nom: 'Master Professionnel en Ingénierie Instrumentation' },
    { id: '5', nom: 'Master Professionnel en Génie Logiciel' },
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
        this.typeCandidature = params['type']; // 'master' ou 'ingenieur'
        console.log('🎯 Type reçu:', this.typeCandidature);
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
      moyenneBac: [null],
      moyenneL1: [null],
      moyenneL2: [null],
      moyenneL3: [null],
      voeu1: [''],
      voeu2: [''],
      voeu3: [''],
      specialite: [''],
      type_candidature: [this.typeCandidature, Validators.required],
    });

    this.updateValidations();
  }

  // Mettre à jour les validations selon le type de candidature
  updateValidations(): void {
    if (!this.candidatureForm) return;
    const voeu1 = this.candidatureForm.get('voeu1');
    const specialite = this.candidatureForm.get('specialite');

    if (this.typeCandidature === 'master') {
      voeu1?.setValidators([Validators.required]);
      specialite?.clearValidators();
    } else if (this.typeCandidature === 'ingenieur') {
      specialite?.setValidators([Validators.required]);
      voeu1?.clearValidators();
      this.candidatureForm.patchValue({ voeu2: '', voeu3: '' });
    }

    voeu1?.updateValueAndValidity();
    specialite?.updateValueAndValidity();
  }

  getMastersForVoeu(voeuNumber: number): Master[] {
    // Filtre les masters déjà sélectionnés dans les autres vœux
    const selectedVoeux = [this.formData.voeu1, this.formData.voeu2, this.formData.voeu3];

    return this.mastersList.filter((master) => {
      // Inclure le master déjà sélectionné pour ce vœu
      const selectedForThisVoeu =
        voeuNumber === 1
          ? this.formData.voeu1
          : voeuNumber === 2
            ? this.formData.voeu2
            : this.formData.voeu3;

      return master.id === selectedForThisVoeu || !selectedVoeux.includes(master.id);
    });
  }

  // Soumission du formulaire
  onSubmit(): void {
    this.errorMessage = '';

    // Validation de base
    if (!this.formData.prenom || !this.formData.nom || !this.formData.email || !this.formData.cin) {
      this.errorMessage = 'Veuillez remplir tous les champs obligatoires';
      return;
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

    // Validation des vœux/spécialité
    if (this.typeCandidature === 'master' && !this.formData.voeu1) {
      this.errorMessage = 'Veuillez sélectionner au moins un vœu de master';
      return;
    }

    if (this.typeCandidature === 'ingenieur' && !this.formData.specialite) {
      this.errorMessage = 'Veuillez sélectionner une spécialité';
      return;
    }

    if (!this.accepteCGU) {
      this.errorMessage = 'Veuillez accepter les conditions générales';
      return;
    }

    this.isLoading = true;

    // Préparer les données
    const candidatureData = {
      first_name: this.formData.prenom,
      last_name: this.formData.nom,
      cin: this.formData.cin,
      date_naissance: this.formData.dateNaissance,
      email: this.formData.email,
      telephone: this.formData.telephone,
      type_candidature: this.typeCandidature,

      // Vœux (pour Masters) OU Spécialité (pour Ingénieur)
      voeux:
        this.typeCandidature === 'master'
          ? [this.formData.voeu1, this.formData.voeu2, this.formData.voeu3].filter((v) => v)
          : null,

      specialite: this.typeCandidature === 'ingenieur' ? this.formData.specialite : null,

      // Mot de passe
      password:
        this.formData.passwordMode === 'manual' ? this.formData.password : this.generatePassword(),
    };

    console.log('📤 Données envoyées:', candidatureData);

    this.authService.register(candidatureData).subscribe({
      next: (response: any) => {
        console.log('✅ Candidature créée:', response);
        alert(
          `Candidature soumise avec succès !\n\nVotre mot de passe : ${candidatureData.password}\n\nNotez-le bien, vous en aurez besoin pour vous connecter.`,
        );

        localStorage.setItem('access_token', response.token);
        localStorage.setItem('current_user', JSON.stringify(response.user));

        this.router.navigate(['/candidat/dashboard']);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('❌ Erreur inscription:', error);
        this.isLoading = false;

        let errorMessage = 'Erreur lors de la candidature.';
        if (error.error?.error) {
          errorMessage = error.error.error;
        }
        if (error.error?.details) {
          errorMessage += '\n\nDétails : ' + JSON.stringify(error.error.details, null, 2);
        }

        this.errorMessage = errorMessage;
      },
    });
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
