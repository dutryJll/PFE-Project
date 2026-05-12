import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';
import { ToastService } from '../../../services/toast.service';

interface Offer {
  id: number;
  master_nom: string;
  master_id: number;
  specialite: string;
  date_limite: string;
  type: string;
  already_applied: boolean;
}

@Component({
  selector: 'app-offers-listing',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    RouterModule,
  ],
  templateUrl: './offers-listing.component.html',
  styleUrls: ['./offers-listing.component.css'],
})
export class OffersListingComponent implements OnInit {
  offers: Offer[] = [];
  filteredOffers: Offer[] = [];
  isLoading = false;
  errorMessage = '';
  filterType = 'all';
  filterSpecialite = 'all';

  constructor(
    private candidatureService: CandidatureService,
    private toastService: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadAvailableOffers();
  }

  loadAvailableOffers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.candidatureService.getAvailableOffersWithSpecialites().subscribe({
      next: (response: any) => {
        if (response.offers && Array.isArray(response.offers)) {
          this.offers = response.offers;
          this.applyFilters();
          this.toastService.showSuccess('Offres chargées avec succès');
        } else {
          this.errorMessage = 'Format de réponse invalide';
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading offers:', error);
        this.errorMessage = error.error?.error || 'Erreur lors du chargement des offres';
        this.toastService.showError(this.errorMessage);
        this.isLoading = false;
      },
    });
  }

  applyFilters(): void {
    this.filteredOffers = this.offers.filter((offer) => {
      const typeMatch = this.filterType === 'all' || offer.type === this.filterType;
      const specialiteMatch =
        this.filterSpecialite === 'all' || offer.specialite === this.filterSpecialite;
      return typeMatch && specialiteMatch;
    });
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type;
    this.applyFilters();
  }

  onFilterSpecialiteChange(specialite: string): void {
    this.filterSpecialite = specialite;
    this.applyFilters();
  }

  isDeadlineApproaching(deadlineStr: string): boolean {
    if (!deadlineStr) return false;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const daysLeft = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 && daysLeft <= 7;
  }

  daysRemainingText(deadlineStr: string): string {
    if (!deadlineStr) return '';
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const daysLeft = Math.floor((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? `${daysLeft} jours restants` : 'Délai dépassé';
  }

  applyNow(offerId: number): void {
    // This will navigate to the candidature form with the master_id
    // Implementation depends on your routing
    window.location.href = `/candidat/apply/${offerId}`;
  }

  getUniqueSpecialites(): string[] {
    const specialites = new Set(this.offers.map((o) => o.specialite));
    return Array.from(specialites).filter((s) => s && s.trim() !== '');
  }

  getUniqueTypes(): string[] {
    const types = new Set(this.offers.map((o) => o.type));
    return Array.from(types).filter((t) => t && t.trim() !== '');
  }
}
