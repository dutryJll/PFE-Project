import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-candidature-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './candidature-form.component.html',
  styleUrl: './candidature-form.component.css',
})
export class CandidatureFormComponent implements OnInit {
  typeCandidature: string = 'master';
  masterSelectionne: number | null = null;
  specialiteSelectionnee: string = '';

  formData = {
    prenom: '',
    nom: '',
    dateNaissance: '',
    email: '',
    telephone: '',
    cin: '',
    moyenneBac: '',
    moyenneL1: '',
    moyenneL2: '',
    moyenneL3: '',
    voeu1: '',
    voeu2: '',
    voeu3: '',
    specialite: '',
    passwordMode: 'auto',
    password: '',
    confirmPassword: '',
  };

  mastersDisponibles = [
    { id: 1, nom: 'Master de recherche en génie logiciel' },
    { id: 2, nom: 'Master de recherche en Microélectronique et Instrumentation' },
    { id: 3, nom: 'Licence IIC - Parcours: Réseaux et IOT (RIOT)' },
    { id: 4, nom: 'Master professionnel : Data Science' },
    { id: 5, nom: 'Master professionnel : Ingénierie en Instrumentation Industrielle' },
    { id: 6, nom: 'Master professionnel en génie logiciel' },
  ];

  specialitesIngenieur = [
    { id: 'informatique', nom: 'Génie Informatique' },
    { id: 'electrique', nom: 'Génie Électrique' },
    { id: 'mecanique', nom: 'Génie Mécanique' },
  ];

  isLoading = false;
  errorMessage = '';
  accepteCGU = false;

  constructor(
    public router: Router,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.typeCandidature = params['type'] || 'master';
      this.masterSelectionne = params['id'] ? parseInt(params['id']) : null;
      this.specialiteSelectionnee = params['specialite'] || '';

      if (this.masterSelectionne) {
        this.formData.voeu1 = this.masterSelectionne.toString();
      }

      if (this.specialiteSelectionnee) {
        this.formData.specialite = this.specialiteSelectionnee;
      }
    });
  }

  onSubmit() {
    console.log('📤 Soumission du formulaire');

    if (!this.validateForm()) {
      return;
    }

    if (!this.accepteCGU) {
      this.errorMessage = "Vous devez accepter les conditions générales d'utilisation";
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    let finalPassword = this.formData.password;
    if (this.formData.passwordMode === 'auto') {
      finalPassword = this.generatePassword();
    }

    const candidatureData = {
      first_name: this.formData.prenom,
      last_name: this.formData.nom,
      email: this.formData.email,
      password: finalPassword,
      cin: this.formData.cin,
      telephone: this.formData.telephone,
      date_naissance: this.formData.dateNaissance,
      moyenne_bac: parseFloat(this.formData.moyenneBac),
      moyenne_l1: this.formData.moyenneL1 ? parseFloat(this.formData.moyenneL1) : null,
      moyenne_l2: this.formData.moyenneL2 ? parseFloat(this.formData.moyenneL2) : null,
      moyenne_l3: this.formData.moyenneL3 ? parseFloat(this.formData.moyenneL3) : null,
      type_candidature: this.typeCandidature,
      voeux:
        this.typeCandidature === 'master'
          ? [this.formData.voeu1, this.formData.voeu2, this.formData.voeu3].filter((v) => v)
          : null,
      specialite: this.typeCandidature === 'ingenieur' ? this.formData.specialite : null,
    };

    console.log('📦 Données à envoyer:', candidatureData);

    this.http.post('http://localhost:8003/api/candidatures/create/', candidatureData).subscribe({
      next: (response: any) => {
        console.log('✅ Inscription réussie:', response);
        this.isLoading = false;

        alert(
          `✅ Compte créé avec succès !\n\n` +
            `📧 Identifiant : ${this.formData.email}\n` +
            `🔑 Mot de passe : ${finalPassword}\n\n` +
            `Un email de confirmation a été envoyé à votre adresse.`,
        );

        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Erreur inscription:', error);
        this.isLoading = false;

        if (error.error && error.error.email) {
          this.errorMessage = 'Cet email est déjà utilisé';
        } else if (error.error && error.error.cin) {
          this.errorMessage = 'Ce CIN est déjà utilisé';
        } else {
          this.errorMessage = "Erreur lors de l'inscription. Veuillez réessayer.";
        }
      },
    });
  }

  validateForm(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) {
      this.errorMessage = 'Email invalide';
      return false;
    }

    if (this.formData.cin.length !== 8 || !/^\d+$/.test(this.formData.cin)) {
      this.errorMessage = 'Le CIN doit contenir exactement 8 chiffres';
      return false;
    }

    if (this.formData.telephone && !/^[+\d\s]+$/.test(this.formData.telephone)) {
      this.errorMessage = 'Numéro de téléphone invalide';
      return false;
    }

    const moyenne = parseFloat(this.formData.moyenneBac);
    if (isNaN(moyenne) || moyenne < 0 || moyenne > 20) {
      this.errorMessage = 'La moyenne doit être entre 0 et 20';
      return false;
    }

    if (this.typeCandidature === 'master' && !this.formData.voeu1) {
      this.errorMessage = 'Vous devez choisir au moins un vœu';
      return false;
    }

    if (this.typeCandidature === 'ingenieur' && !this.formData.specialite) {
      this.errorMessage = 'Vous devez choisir une spécialité';
      return false;
    }

    if (this.formData.passwordMode === 'manual') {
      if (this.formData.password.length < 8) {
        this.errorMessage = 'Le mot de passe doit contenir au moins 8 caractères';
        return false;
      }
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errorMessage = 'Les mots de passe ne correspondent pas';
        return false;
      }
    }

    return true;
  }

  generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  getMastersForVoeu(voeuNumber: number): any[] {
    const selectedVoeux = [this.formData.voeu1, this.formData.voeu2, this.formData.voeu3];
    return this.mastersDisponibles.filter((master) => {
      const masterId = master.id.toString();
      if (voeuNumber === 1) {
        return !selectedVoeux.slice(1).includes(masterId);
      } else if (voeuNumber === 2) {
        return masterId !== selectedVoeux[0] && masterId !== selectedVoeux[2];
      } else {
        return !selectedVoeux.slice(0, 2).includes(masterId);
      }
    });
  }
}
