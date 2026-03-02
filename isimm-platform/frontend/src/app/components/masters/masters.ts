import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './masters.html',
  styleUrl: './masters.css',
})
export class MastersComponent implements OnInit {
  mastersRecherche = [
    {
      id: 1,
      titre: 'Master de recherche en génie logiciel',
      description:
        'Formation approfondie en génie logiciel, architecture logicielle, et méthodes formelles.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Recherche, R&D',
    },
    {
      id: 2,
      titre: 'Master de recherche en Microélectronique et Instrumentation',
      description:
        'Spécialisation en circuits intégrés, systèmes embarqués et instrumentation avancée.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'R&D, Industrie',
    },
  ];

  mastersProfessionnels = [
    {
      id: 3,
      titre: 'Master Professionnel en Data Science',
      description:
        'Formation en science des données, intelligence artificielle et analyse prédictive.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Data Scientist, IA Engineer',
    },
    {
      id: 4,
      titre: 'Master Professionnel en Ingénierie Instrumentation',
      description: 'Spécialisation en systèmes de mesure, capteurs et automatisation industrielle.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Ingénierie, Industrie',
    },
    {
      id: 5,
      titre: 'Master Professionnel en Génie Logiciel',
      description: 'Formation pratique en développement logiciel, architecture cloud et DevOps.',
      duree: '2 ans',
      prerequis: 'Licence',
      debouches: 'Développeur, Architecte',
    },
  ];

  // ✅ NOUVEAU : Cycle Ingénieur
  cycleIngenieur = [
    {
      id: 1,
      titre: 'Cycle Ingénieur - Génie Informatique',
      description:
        "Formation d'ingénieur en informatique axée sur le développement logiciel, l'intelligence artificielle et les systèmes distribués.",
      duree: '3 ans',
      prerequis: 'Bac + Concours',
      specialites: '2 (Info, Électrique)',
    },
    {
      id: 2,
      titre: 'Cycle Ingénieur - Génie Électrique',
      description:
        "Formation d'ingénieur en électronique et systèmes embarqués avec spécialisation en automatisation et énergie.",
      duree: '3 ans',
      prerequis: 'Bac + Concours',
      specialites: '2 (Info, Électrique)',
    },
  ];

  ngOnInit(): void {
    console.log('✅ Masters page loaded');
    console.log('🎓 Masters Recherche:', this.mastersRecherche);
    console.log('💼 Masters Professionnels:', this.mastersProfessionnels);
    console.log('🔧 Cycle Ingénieur:', this.cycleIngenieur);
  }
}
