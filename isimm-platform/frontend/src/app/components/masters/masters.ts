import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-masters',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './masters.html',
  styleUrl: './masters.css',
})
export class MastersComponent {
  mastersRecherche = [
    {
      id: 1,
      titre: 'Master de recherche en génie logiciel',
      image: 'assets/masters/genie-logiciel.jpg',
      duree: '2 ans',
      prerequis: 'Licence en informatique',
      debouches: 'Recherche, Développement avancé, Doctorat',
      description:
        'Formation approfondie en génie logiciel, architecture logicielle, et méthodes formelles.',
    },
    {
      id: 2,
      titre: 'Master de recherche en Microélectronique et Instrumentation',
      image: 'assets/masters/microelectronique.jpg',
      duree: '2 ans',
      prerequis: 'Licence en électronique',
      debouches: 'Conception de circuits, R&D, Instrumentation',
      description:
        'Spécialisation en circuits intégrés, systèmes embarqués et instrumentation avancée.',
    },
  ];

  mastersProfessionnels = [
    {
      id: 4,
      titre: 'Master professionnel : Data Science',
      image: 'assets/masters/data-science.jpg',
      duree: '2 ans',
      prerequis: 'Licence informatique/mathématiques',
      debouches: 'Data Scientist, Analyste IA, Machine Learning Engineer',
      description:
        'Formation pratique en analyse de données, intelligence artificielle et big data.',
    },
    {
      id: 5,
      titre: 'Master professionnel : Ingénierie en Instrumentation Industrielle',
      image: 'assets/masters/instrumentation.jpg',
      duree: '2 ans',
      prerequis: 'Licence en génie électrique',
      debouches: 'Ingénieur instrumentation, Automatisation industrielle',
      description: 'Expertise en capteurs, mesure industrielle et systèmes automatisés.',
    },
    {
      id: 6,
      titre: 'Master professionnel en génie logiciel',
      image: 'assets/masters/genie-logiciel-pro.jpg',
      duree: '2 ans',
      prerequis: 'Licence en informatique',
      debouches: 'Architecte logiciel, Chef de projet, DevOps',
      description:
        'Formation professionnelle en développement, architecture et gestion de projets.',
    },
  ];
}
