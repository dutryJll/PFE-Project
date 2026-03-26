import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface Section {
  id: string;
  icon: string;
  titre: string;
  contenu: string[];
}

@Component({
  selector: 'app-guide-etudiant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guide-etudiant.html',
  styleUrl: './guide-etudiant.css',
})
export class GuideEtudiantComponent {
  sectionActive: string = 'introduction';

  sections: Section[] = [
    {
      id: 'introduction',
      icon: 'fa-info-circle',
      titre: 'Introduction',
      contenu: [
        "Bienvenue sur la plateforme d'admission ISIMM",
        'Ce guide vous accompagne dans toutes les étapes de votre candidature',
        'Prenez le temps de lire attentivement chaque section',
      ],
    },
    {
      id: 'inscription',
      icon: 'fa-user-plus',
      titre: 'Création de Compte',
      contenu: [
        "1. Accédez à la page d'inscription",
        '2. Remplissez vos informations personnelles (Email, Nom, Prénom)',
        '3. Créez votre mot de passe sécurisé (8+ caractères, majuscule, chiffre, caractère spécial)',
        '4. Validez votre compte par email',
        '5. Connectez-vous avec vos identifiants',
      ],
    },
    {
      id: 'candidature',
      icon: 'fa-file-alt',
      titre: 'Soumettre une Candidature',
      contenu: [
        '1. Consultez les masters ouverts',
        "2. Vérifiez les prérequis et conditions d'admission",
        '3. Cliquez sur "Postuler"',
        '4. Remplissez le formulaire de candidature',
        '5. Vous recevez un email de confirmation avec votre numéro de candidature (format: AAMM-XXXXX-ABR)',
        '⚠️ IMPORTANT: Vous disposez de 7 jours pour modifier votre candidature',
      ],
    },
    {
      id: 'dossier',
      icon: 'fa-folder-open',
      titre: 'Dépôt de Dossier',
      contenu: [
        'Après présélection, vous devez déposer votre dossier numérique complet:',
        '📄 Documents requis:',
        "- Carte d'identité nationale (CIN)",
        '- Diplôme de licence',
        '- Relevés de notes (L1, L2, L3)',
        '- CV détaillé',
        '- Lettre de motivation',
        '- Attestation de PFE',
        '💡 Format: PDF uniquement, Taille max: 5 Mo par fichier',
        '⏰ Respectez la date limite fixée par la commission',
      ],
    },
    {
      id: 'selection',
      icon: 'fa-clipboard-check',
      titre: 'Processus de Sélection',
      contenu: [
        'Phase 1 - Préinscription: Soumission de votre candidature',
        'Phase 2 - Présélection: Vérification des prérequis',
        'Phase 3 - Dépôt dossier: Upload des documents',
        'Phase 4 - Étude des dossiers: Calcul du score et classement',
        "Phase 5 - Publication liste: Liste principale + Liste d'attente",
        'Phase 6 - Paiement: Inscription via inscription.tn',
        "Phase 7 - Confirmation: Validation finale de l'inscription",
      ],
    },
    {
      id: 'score',
      icon: 'fa-calculator',
      titre: 'Calcul du Score',
      contenu: [
        'Votre score est calculé selon la formule suivante:',
        'Score = (Moyenne Générale × 60%) + (Moyenne Spécialité × 30%) + (Note PFE × 10%)',
        '',
        '🎖️ Bonus:',
        '- Mention Excellent: +1.5 points',
        '- Mention Très Bien: +1.0 point',
        '- Mention Bien: +0.5 point',
        '- Mention Assez Bien: +0.25 point',
        '',
        '⚠️ Malus:',
        '- Redoublement: -0.5 par année',
        '- Dette: -0.25 par module',
        '',
        '📊 Score minimum requis: 10/20',
      ],
    },
    {
      id: 'paiement',
      icon: 'fa-credit-card',
      titre: 'Paiement et Inscription',
      contenu: [
        'Si vous êtes sélectionné:',
        '1. Vous recevez un email de notification',
        '2. Accédez au site www.inscription.tn',
        '3. Effectuez le paiement en ligne (500 TND)',
        '4. Téléchargez le reçu de paiement',
        '5. Importez le reçu sur notre plateforme',
        '6. La commission vérifie votre paiement',
        '7. Votre inscription est confirmée',
        '',
        '⚠️ Date limite: Respectez impérativement la date limite de paiement',
      ],
    },
    {
      id: 'reclamation',
      icon: 'fa-exclamation-triangle',
      titre: 'Réclamations',
      contenu: [
        'Vous pouvez déposer une réclamation si:',
        '- Votre score affiché est incorrect',
        "- Votre statut n'est pas mis à jour",
        '- Vous rencontrez un problème technique',
        '- Votre dossier présente une anomalie',
        '',
        'Processus:',
        '1. Accédez à "Mes Réclamations"',
        '2. Cliquez sur "Nouvelle Réclamation"',
        "3. Sélectionnez le master concerné et l'objet",
        '4. Décrivez votre problème en détail',
        '5. Joignez des pièces justificatives si nécessaire',
        '6. La commission traite votre réclamation sous 48h',
      ],
    },
    {
      id: 'contact',
      icon: 'fa-envelope',
      titre: 'Contact et Support',
      contenu: [
        '📧 Email: contact@isimm.tn',
        '📞 Téléphone: +216 73 500 274',
        '📍 Adresse: Route de Kairouan, 5000 Monastir',
        '🕒 Horaires: Lun-Ven 8h-17h',
        '',
        'Support technique: support@isimm.tn',
        'Réclamations urgentes: reclamations@isimm.tn',
      ],
    },
  ];

  constructor(private router: Router) {}

  changerSection(sectionId: string): void {
    this.sectionActive = sectionId;
  }

  getSectionActive(): Section {
    return this.sections.find((s) => s.id === this.sectionActive) || this.sections[0];
  }

  retourAccueil(): void {
    this.router.navigate(['/']);
  }
}
