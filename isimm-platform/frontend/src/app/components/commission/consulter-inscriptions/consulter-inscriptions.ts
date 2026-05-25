import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SpecialitesService } from '../../../services/specialites.service';
import { CommissionStateService } from '../../../services/commission-state.service';

interface InscriptionRecord {
  id: number;
  candidat: string;
  email: string;
  specialite: string;
  commissionCategory: 'ingenieur' | 'master-ds' | 'master-gl';
  statut: 'Validée' | 'En attente' | 'Rejetée';
  paiement: 'Payé' | 'En attente' | 'Non vérifié';
  dateDepot: string;
  matricule?: string;
}

@Component({
  selector: 'app-consulter-inscriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './consulter-inscriptions.html',
  styleUrl: './consulter-inscriptions.css',
})
export class ConsulterInscriptions implements OnInit {
  availableSpecialites: string[] = [];
  selectedSpecialite: string = '';
  inscriptions: InscriptionRecord[] = [];
  inscriptionsFiltrees: InscriptionRecord[] = [];
  recherche = '';
  private activeCommissionCategory: 'ingenieur' | 'master-ds' | 'master-gl' | null = null;

  constructor(
    private specialitesService: SpecialitesService,
    private commissionStateService: CommissionStateService,
  ) {}

  ngOnInit(): void {
    this.commissionStateService.activeCommissionId$.subscribe((commissionId) => {
      this.activeCommissionCategory = this.getCommissionCategoryFromId(commissionId);
      this.applyFilters();
    });

    this.inscriptions = this.buildMockInscriptions();
    this.specialitesService.getSpecialitesData().subscribe(() => {
      this.availableSpecialites = this.specialitesService.getAllSpecialties();
      this.applyFilters();
    });
    this.applyFilters();
  }

  private buildMockInscriptions(): InscriptionRecord[] {
    return [
      {
        id: 1,
        candidat: 'Amina Ben Salah',
        email: 'amina.bensalah@example.com',
        specialite: 'Génie Logiciel',
        commissionCategory: 'master-gl',
        statut: 'Validée',
        paiement: 'Payé',
        dateDepot: '2026-05-10',
        matricule: 'INS-2026-1001',
      },
      {
        id: 2,
        candidat: 'Yassine Trabelsi',
        email: 'yassine.trabelsi@example.com',
        specialite: 'Data Science',
        commissionCategory: 'master-ds',
        statut: 'En attente',
        paiement: 'En attente',
        dateDepot: '2026-05-11',
        matricule: 'INS-2026-1002',
      },
      {
        id: 3,
        candidat: 'Nour Cherif',
        email: 'nour.cherif@example.com',
        specialite: 'Cycle Ingénieur Génie Logiciel',
        commissionCategory: 'ingenieur',
        statut: 'Validée',
        paiement: 'Payé',
        dateDepot: '2026-05-12',
        matricule: 'INS-2026-1003',
      },
      {
        id: 4,
        candidat: 'Meriem Khaldi',
        email: 'meriem.khaldi@example.com',
        specialite: 'Génie Logiciel',
        commissionCategory: 'master-gl',
        statut: 'Rejetée',
        paiement: 'Non vérifié',
        dateDepot: '2026-05-13',
        matricule: 'INS-2026-1004',
      },
      {
        id: 5,
        candidat: 'Omar Jaziri',
        email: 'omar.jaziri@example.com',
        specialite: 'Data Science',
        commissionCategory: 'master-ds',
        statut: 'Validée',
        paiement: 'Payé',
        dateDepot: '2026-05-14',
        matricule: 'INS-2026-1005',
      },
      {
        id: 6,
        candidat: 'Hassen Mnif',
        email: 'hassen.mnif@example.com',
        specialite: 'Cycle Ingénieur Génie Logiciel',
        commissionCategory: 'ingenieur',
        statut: 'En attente',
        paiement: 'En attente',
        dateDepot: '2026-05-15',
        matricule: 'INS-2026-1006',
      },
    ];
  }

  applyFilters(): void {
    const search = this.recherche.trim().toLowerCase();
    this.inscriptionsFiltrees = this.inscriptions.filter((item) => {
      const commissionMatch =
        !this.activeCommissionCategory || item.commissionCategory === this.activeCommissionCategory;
      const specialiteMatch =
        !this.selectedSpecialite || item.specialite === this.selectedSpecialite;
      const searchMatch =
        !search ||
        item.candidat.toLowerCase().includes(search) ||
        item.email.toLowerCase().includes(search) ||
        item.matricule?.toLowerCase().includes(search) ||
        item.specialite.toLowerCase().includes(search);

      return commissionMatch && specialiteMatch && searchMatch;
    });
  }

  getStatusClass(statut: InscriptionRecord['statut']): string {
    if (statut === 'Validée') return 'status-validee';
    if (statut === 'Rejetée') return 'status-rejetee';
    return 'status-en-attente';
  }

  getPaiementClass(paiement: InscriptionRecord['paiement']): string {
    if (paiement === 'Payé') return 'paiement-paye';
    if (paiement === 'Non vérifié') return 'paiement-non-verifie';
    return 'paiement-en-attente';
  }

  private getCommissionCategoryFromId(
    commissionId: number | null,
  ): 'ingenieur' | 'master-ds' | 'master-gl' | null {
    if (commissionId === 1) return 'ingenieur';
    if (commissionId === 2) return 'master-ds';
    if (commissionId === 3) return 'master-gl';
    return null;
  }
}
