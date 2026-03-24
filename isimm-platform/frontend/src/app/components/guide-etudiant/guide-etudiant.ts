import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-guide-etudiant',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './guide-etudiant.html',
  styleUrl: './guide-etudiant.css',
})
export class GuideEtudiantComponent {
  guides = [
    {
      id: 1,
      titre: 'Comment candidater ?',
      description: 'Guide complet pour soumettre votre candidature aux masters ISIMM',
      icon: 'fa-file-alt',
      steps: [
        'Créer votre compte',
        'Remplir le formulaire de candidature',
        'Soumettre votre dossier avant la date limite',
        "Suivre l'état de votre candidature",
      ],
    },
    {
      id: 2,
      titre: "Procédure d'inscription",
      description: 'Étapes à suivre après votre admission',
      icon: 'fa-user-graduate',
      steps: [
        "Vérifier votre statut d'admission",
        'Effectuer le paiement en ligne',
        'Déposer les documents requis',
        'Confirmer votre inscription',
      ],
    },
    {
      id: 3,
      titre: 'Documents requis',
      description: 'Liste complète des documents à fournir',
      icon: 'fa-folder-open',
      steps: [
        'Copie CIN',
        'Diplôme de licence certifié',
        'Relevés de notes',
        'CV et lettre de motivation',
      ],
    },
    {
      id: 4,
      titre: 'Calcul du score',
      description: 'Comment votre score est calculé',
      icon: 'fa-calculator',
      steps: [
        'Moyenne générale (60%)',
        'Moyenne spécialité (30%)',
        'Note PFE (10%)',
        'Bonus/Malus selon critères',
      ],
    },
  ];

  faq = [
    {
      question: 'Quelle est la date limite de candidature ?',
      reponse:
        'La date limite varie selon les masters. Consultez la page "Formations" pour les dates spécifiques.',
    },
    {
      question: 'Puis-je candidater à plusieurs masters ?',
      reponse:
        "Oui, vous pouvez soumettre jusqu'à 3 candidatures en les classant par ordre de préférence.",
    },
    {
      question: "Comment suivre l'état de ma candidature ?",
      reponse:
        'Connectez-vous à votre espace candidat. Vous recevrez également des emails à chaque changement de statut.',
    },
    {
      question: 'Que faire si je suis présélectionné ?',
      reponse:
        'Vous recevrez un email avec les instructions pour déposer votre dossier numérique dans les délais impartis.',
    },
  ];

  selectedGuide: any = null;

  openGuide(guide: any): void {
    this.selectedGuide = guide;
  }

  closeGuide(): void {
    this.selectedGuide = null;
  }
}
