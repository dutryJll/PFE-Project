import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private currentLanguage: string = 'fr';

  private translations: any = {
    fr: {
      // Navigation
      'nav.home': 'Accueil',
      'nav.login': 'Connexion',
      'nav.logout': 'Déconnexion',

      // Dashboard
      'dashboard.welcome': 'Bienvenue',
      'dashboard.candidatures': 'Candidatures',
      'dashboard.profile': 'Profil',

      // Candidatures
      'candidature.numero': 'N° Candidature',
      'candidature.candidat': 'Candidat',
      'candidature.master': 'Master',
      'candidature.score': 'Score',
      'candidature.statut': 'Statut',
      'candidature.actions': 'Actions',
      'candidature.dossier': 'Dossier',
      'candidature.avis': 'Avis',

      // Statuts
      'status.soumis': 'Soumis',
      'status.en_attente': 'En attente',
      'status.selectionne': 'Sélectionné',
      'status.rejete': 'Rejeté',
      'status.sous_examen': 'Sous examen',
      'status.preselectionne': 'Présélectionné',

      // Boutons
      'btn.save': 'Enregistrer',
      'btn.cancel': 'Annuler',
      'btn.delete': 'Supprimer',
      'btn.edit': 'Modifier',
      'btn.view': 'Voir',
      'btn.download': 'Télécharger',
      'btn.add': 'Ajouter',
      'btn.search': 'Rechercher',
      'btn.reset': 'Réinitialiser',

      // Formulaires
      'form.email': 'Adresse email',
      'form.password': 'Mot de passe',
      'form.firstname': 'Prénom',
      'form.lastname': 'Nom',

      // Messages
      'msg.success': 'Opération réussie',
      'msg.error': 'Une erreur est survenue',
      'msg.confirm': 'Êtes-vous sûr ?',
    },
    en: {
      // Navigation
      'nav.home': 'Home',
      'nav.login': 'Login',
      'nav.logout': 'Logout',

      // Dashboard
      'dashboard.welcome': 'Welcome',
      'dashboard.candidatures': 'Applications',
      'dashboard.profile': 'Profile',

      // Candidatures
      'candidature.numero': 'Application No.',
      'candidature.candidat': 'Candidate',
      'candidature.master': 'Master',
      'candidature.score': 'Score',
      'candidature.statut': 'Status',
      'candidature.actions': 'Actions',
      'candidature.dossier': 'File',
      'candidature.avis': 'Review',

      // Statuts
      'status.soumis': 'Submitted',
      'status.en_attente': 'Pending',
      'status.selectionne': 'Selected',
      'status.rejete': 'Rejected',
      'status.sous_examen': 'Under review',
      'status.preselectionne': 'Preselected',

      // Boutons
      'btn.save': 'Save',
      'btn.cancel': 'Cancel',
      'btn.delete': 'Delete',
      'btn.edit': 'Edit',
      'btn.view': 'View',
      'btn.download': 'Download',
      'btn.add': 'Add',
      'btn.search': 'Search',
      'btn.reset': 'Reset',

      // Formulaires
      'form.email': 'Email address',
      'form.password': 'Password',
      'form.firstname': 'First name',
      'form.lastname': 'Last name',

      // Messages
      'msg.success': 'Operation successful',
      'msg.error': 'An error occurred',
      'msg.confirm': 'Are you sure?',
    },
  };

  constructor() {
    const savedLang = localStorage.getItem('language');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
  }

  setLanguage(lang: string): void {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  translate(key: string): string {
    return this.translations[this.currentLanguage][key] || key;
  }
}
