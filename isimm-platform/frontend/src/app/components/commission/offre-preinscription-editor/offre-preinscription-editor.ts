import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Quota {
  cat: string;
  etab: string;
  places: number;
  diplome: string;
}

interface Offre {
  id: number;
  titre: string;
  type: string;
  soustype: string;
  spec: string;
  limite: string;
  vis: boolean;
  statut: boolean;
  cap: number;
  candidats: number;
  desc: string;
}

@Component({
  selector: 'app-offre-preinscription-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offre-preinscription-editor.html',
  styleUrl: './offre-preinscription-editor.css',
})
export class OffrePreinscriptionEditorComponent implements OnInit {
  // Form fields
  titre: string = 'Master Professionnel Data Science';
  typeFormation: string = 'master';
  soustype: string = 'professionnel';
  spec: string = 'Informatique';
  description: string =
    'Offre de préinscription pour le Master Professionnel en Data Science. Formation orientée Big Data, IA et traitement de données massives.';
  dateDebut: string = '2026-03-01';
  dateFin: string = '2026-07-22';
  dateLimitePre: string = '2026-07-22';
  dateLimiteDep: string = '2026-08-15';
  selectedPdfFile: File | null = null;

  // Toggles
  appel: boolean = true;
  visibilite: boolean = true;
  row1Open: boolean = false;

  // Quotas
  quotas: Quota[] = [
    {
      cat: 'ISIMM Internes',
      etab: 'ISIMM',
      places: 15,
      diplome: "Licence en Sciences de l'Informatique",
    },
    {
      cat: 'Autres Externes',
      etab: 'Autres établissements',
      places: 8,
      diplome: 'Licence ou équivalent selon la spécialité',
    },
  ];

  // Offres list
  offres: Offre[] = [
    {
      id: 1,
      titre: 'Master Professionnel Data Science',
      type: 'Master',
      soustype: 'professionnel',
      spec: 'Informatique',
      limite: '15/04/2026',
      vis: true,
      statut: false,
      cap: 25,
      candidats: 2,
      desc: 'Formation orientée Big Data, IA et traitement de données massives.',
    },
    {
      id: 2,
      titre: 'Master Recherche Génie Logiciel',
      type: 'Master',
      soustype: 'recherche',
      spec: 'Informatique',
      limite: '30/03/2026',
      vis: true,
      statut: false,
      cap: 30,
      candidats: 0,
      desc: 'Offre temporaire affichée quand le service candidature est indisponible.',
    },
  ];

  previewOpen: boolean = false;
  currentStep: number = 1;
  capaciteTotal: number = 23;

  ngOnInit(): void {
    this.updateTotal();
  }

  // Stepper navigation
  goStep(n: number): void {
    this.currentStep = n;
  }

  // Quota management
  updateTotal(): void {
    this.capaciteTotal = this.quotas.reduce((a, q) => a + (q.places || 0), 0);
  }

  addQuota(): void {
    this.quotas.push({
      cat: 'Nouvelle catégorie',
      etab: '',
      places: 5,
      diplome: '',
    });
    this.updateTotal();
    this.syncLive();
  }

  delQuota(i: number): void {
    this.quotas.splice(i, 1);
    this.updateTotal();
    this.syncLive();
  }

  // Sync live changes
  syncLive(): void {
    this.offres[0].titre = this.titre;
    this.offres[0].soustype = this.soustype;
    this.offres[0].desc = this.description;
    if (this.dateLimitePre) {
      const d = new Date(this.dateLimitePre);
      this.offres[0].limite = d.toLocaleDateString('fr-FR');
    }
    this.offres[0].cap = this.capaciteTotal;
  }

  onPdfSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    if (!file) {
      this.selectedPdfFile = null;
      return;
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      this.selectedPdfFile = null;
      this.showToast('Veuillez sélectionner un fichier PDF valide', 't-warn');
      return;
    }

    this.selectedPdfFile = file;
    this.showToast('PDF officiel signé sélectionné', 't-info');
  }

  // Toggle functions
  toggleVis(): void {
    this.visibilite = !this.visibilite;
    this.offres[0].vis = this.visibilite;
    this.updateStatusBar();
  }

  toggleAppel(): void {
    this.appel = !this.appel;
    this.updateStatusBar();
  }

  toggleRow1(): void {
    this.row1Open = !this.row1Open;
    this.offres[0].statut = this.row1Open;
    this.updateStatusBar();
  }

  togglePreview(): void {
    this.previewOpen = !this.previewOpen;
  }

  updateStatusBar(): void {
    // Status bar logic handled in template via computed properties
  }

  // Actions
  enregistrer(): void {
    this.showToast('Offre enregistrée et synchronisée', 't-success');
  }

  publierOffre(): void {
    this.row1Open = true;
    this.offres[0].statut = true;
    this.updateStatusBar();
    this.showToast('Offre publiée — visible pour les candidats', 't-success');
  }

  showToast(msg: string, cls: string): void {
    console.log(`[${cls}] ${msg}`);
  }

  sendPrompt(prompt: string): void {
    console.log('Prompt:', prompt);
  }

  // Helper methods for template
  isStatusOpen(): boolean {
    return this.visibilite && this.appel && this.row1Open;
  }

  getStatusBarClass(): string {
    return this.isStatusOpen() ? 'status-bar green' : 'status-bar';
  }

  getStatusText(): string {
    return this.isStatusOpen()
      ? 'Statut actuel : Ouverte pour les candidats'
      : 'Statut actuel : Fermée / Non visible';
  }

  getRowStatusClass(isOpen: boolean): string {
    return isOpen ? 'badge b-open' : 'badge b-closed';
  }

  getRowStatusText(isOpen: boolean): string {
    return isOpen ? 'Ouverte' : 'Fermée';
  }

  getOffre(index: number): Offre | undefined {
    return this.offres[index];
  }

  getCardBadgeClass(soustype: string): string {
    return soustype === 'recherche' ? 'recherche' : 'professionnel';
  }

  getCardBadgeText(soustype: string): string {
    return soustype === 'recherche' ? 'PARCOURS RECHERCHE' : 'PARCOURS PROFESSIONNEL';
  }

  getHeadBadgeClass(soustype: string): string {
    return soustype === 'recherche' ? 'hb-recherche' : 'hb-professionnel';
  }
}
