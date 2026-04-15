import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-professional-masters-exploration',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './professional-masters-exploration.component.html',
  styleUrl: './professional-masters-exploration.component.css',
})
export class ProfessionalMastersExplorationComponent {
  calendrierCommun = {
    inscription: "Du jour de publication jusqu'au 22 juillet 2025",
    preselection: '28 juillet 2025',
    depot: 'Du 28 au 31 juillet 2025',
    resultatFinal: '08 août 2025',
    recours: 'Avant le 31 juillet 2025',
  };

  dossierNumerique = [
    'Formulaire de candidature au Mastère en Informatique.',
    'Fiche de candidature imprimée depuis le site et signée.',
    'CV sur une seule page avec adresse, téléphone et e-mail.',
    'Copie certifiée conforme des diplômes, y compris le Baccalauréat.',
    'Copies certifiées conformes des relevés de notes universitaires et du Bac.',
    'Justificatifs de réorientation ou report (si applicable).',
    'Tous les documents doivent être fusionnés en un seul PDF.',
  ];

  mpgl = {
    titre: 'Mastère Professionnel en Génie Logiciel (MPGL)',
    avis: "Avis d'ouverture des candidatures pour l'année universitaire 2025-2026.",
    capaciteTotale: '35',
    repartition: [
      'ISIMM: 30 places (Licence en Sciences de l Informatique).',
      'Autres établissements: 05 places (Licence Info ou Info de Gestion uniquement).',
    ],
    score: {
      formule: 'Score = M.G + B.N.R + B.S.P',
      mg: 'M.G = (Moyenne L1 + Moyenne L2 + Moyenne L3) / 3',
      bnr: 'Aucun redoublement: 5, un redoublement: 3, deux et plus: 0.',
      bsp: 'Aucun rattrapage: 3, un rattrapage: 2, deux et plus: 0.',
    },
  };

  mpds = {
    titre: 'Mastère Professionnel en Sciences des Données (MPDS)',
    avis: "Avis d'ouverture des candidatures pour l'année universitaire 2025-2026.",
    capaciteTotale: '35',
    repartition: [
      'ISIMM: 10 (Math Appliquées) + 19 (Informatique).',
      'Autres établissements: 02 (Math Appliquées) + 04 (Informatique).',
    ],
    score: {
      formule: 'Score = M.G + B.N.R + B.S.P',
      mg: 'M.G = (Moyenne Année 1 + Moyenne Année 2 + Moyenne Année 3) / 3',
      bnr: 'Bonus non-redoublement appliqué selon le parcours.',
      bsp: 'Bonus session principale appliqué selon le nombre de rattrapages.',
    },
  };

  mp3i = {
    titre: 'Mastère Professionnel en Génie des Instruments Industriels (MP3I)',
    avis: "Avis d'ouverture des candidatures pour l'année universitaire 2025-2026.",
    capaciteTotale: '25',
    repartition: [
      'ISIMM: 08 (MIM), 06 (SE), 06 (TIC).',
      'Autres établissements: 05 places sur spécialités compatibles.',
    ],
    score: {
      formule: 'Score = M.P + M.R + M.C',
      mp: 'M.P = (2 x Moy. Bac) + (1.5 x Moy. L1) + (1 x Moy. L2) + (0.5 x Moy. L3)',
      mr: 'M.R = -1 point par redoublement.',
      mc: 'M.C = -1 point par réussite en session de contrôle.',
    },
  };

  remarquesImportantes = [
    'Tout dossier incomplet ou hors délai est rejeté.',
    'Toute donnée erronée annule la candidature et peut entraîner des poursuites.',
    'Les recours sont acceptés avant la date limite indiquée.',
    'Les originaux sont obligatoires lors de l inscription administrative finale.',
  ];
}
