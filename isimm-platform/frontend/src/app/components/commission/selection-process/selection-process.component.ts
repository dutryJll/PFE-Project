import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-selection-process',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './selection-process.component.html',
  styleUrls: ['./selection-process.component.css'],
})
export class SelectionProcessComponent implements OnInit {
  // Changement de rôle pour tester les vues séparées
  isResponsable: boolean = true;
  activeKebab: number | null = null;
  modalRecoursOuvert: boolean = false;
  candidatSelectionne: any = {};

  // Mock Data Réclamations
  listReclamations = [
    {
      idCandidature: '2026-ING-GL-053',
      nomPrenom: 'Yassine Ben Ali',
      specialite: 'Génie Logiciel',
      score: '16.45',
      statusRecours: "En attente d'examen",
      statusColorBg: '#fef3c7',
      statusColorText: '#d97706',
      texteRecours:
        'Je réclame une réévaluation de mon score. Ma moyenne de la 2ème année a été saisie à 12.50 au lieu de 15.20 par erreur dans le système automatique.',
    },
  ];

  // Mock Data Inscriptions
  listInscriptions = [
    {
      idCandidature: '2026-ING-TI-012',
      nomPrenom: 'Amine Trabelsi',
      numInscUniv: 'INS-2026-9941',
      statutFinal: 'En attente de paiement',
      bgColor: '#fef3c7',
      textColor: '#d97706',
    },
  ];

  constructor() {}

  ngOnInit(): void {}

  toggleKebab(index: number, event: Event) {
    event.stopPropagation();
    this.activeKebab = this.activeKebab === index ? null : index;
  }

  ouvrirModalRecours(rec: any) {
    this.candidatSelectionne = rec;
    this.modalRecoursOuvert = true;
    this.activeKebab = null;
  }

  fermerModalRecours() {
    this.modalRecoursOuvert = false;
  }

  traiterRecours(index: number, action: string) {
    if (action === 'Accepter') {
      alert("Recours Accepté ! Le candidat passe à l'état Sélectionné et réintègre le classement.");
      this.listReclamations[index].statusRecours = 'Accepté';
      this.listReclamations[index].statusColorBg = '#dcfce7';
      this.listReclamations[index].statusColorText = '#15803d';
    } else {
      const motif = prompt('Saisir le Motif du refus du recours :');
      if (motif) {
        this.listReclamations[index].statusRecours = 'Refusé';
        this.listReclamations[index].statusColorBg = '#ffeeee';
        this.listReclamations[index].statusColorText = '#dc2626';
      }
    }
    this.activeKebab = null;
  }

  validerInscriptionDefinitive(ins: any) {
    const conf = confirm(
      "Voulez-vous valider définitivement l'inscription administrative de ce candidat ?",
    );
    if (conf) {
      ins.statutFinal = 'Inscrite';
      ins.bgColor = '#dcfce7';
      ins.textColor = '#15803d';
    }
  }
}
