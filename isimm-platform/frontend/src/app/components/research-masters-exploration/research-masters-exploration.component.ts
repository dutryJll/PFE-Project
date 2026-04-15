import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-research-masters-exploration',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './research-masters-exploration.component.html',
  styleUrl: './research-masters-exploration.component.css',
})
export class ResearchMastersExplorationComponent {
  mrglKeyInfo = {
    titre: 'Mastère Recherche en Génie Logiciel (MRGL)',
    inscription: "Jusqu'au 22 juillet 2025",
    resultatsPreliminaires: '28 juillet 2025',
    depotNumerique: 'Du 28 au 31 juillet 2025',
    resultatsFinaux: '08 août 2025',
    capaciteInterne: '49 places (Licence: 19, Maîtrise: 30)',
    capaciteExterne: '62 places (Licence/Info Gestion: 60, Maîtrise/Info Gestion: 02)',
    resumeScore:
      'Classement par score automatique avec bonus non-redoublement, session principale, langue et année de diplôme.',
  };

  mrmiKeyInfo = {
    titre: 'Mastère Recherche en Micro-électronique et Instrumentation (MRMI)',
    inscription: "Jusqu'au 20 juillet 2025",
    resultatsPreliminaires: '28 juillet 2025',
    depotNumerique: 'Du 28 au 31 juillet 2025',
    resultatsFinaux: '08 août 2025',
    capaciteM1: '23 places (Internes: 15, Externes: 08)',
    capaciteM2: '03 places',
    resumeScore:
      'Score basé sur moyenne pondérée et malus (redoublement, session de contrôle), avec conditions d équivalence pour M2.',
  };
}
