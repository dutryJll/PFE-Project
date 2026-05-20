import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './services/theme.service';
import { CandidatureService } from './services/candidature.service';
import { FormsModule } from '@angular/forms';
import {
  CommissionContextService,
  CommissionContextOption,
} from './services/commission-context.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent implements OnInit {
  title = 'frontend';

  commissions: CommissionContextOption[] = [];
  commissionsLoading = false;
  activeCommissionId: number | null = null;

  constructor(
    public themeService: ThemeService,
    private candidatureService: CandidatureService,
    private commissionContext: CommissionContextService,
  ) {}

  ngOnInit(): void {
    this.loadMyCommissions();
    this.commissionContext.activeCommissionId$.subscribe((value) => {
      this.activeCommissionId = value;
    });
  }

  loadMyCommissions(): void {
    this.commissionsLoading = true;
    this.candidatureService.getMyCommissions().subscribe(
      (res: any) => {
        const apiCommissions = Array.isArray(res?.commissions) ? res.commissions : [];
        const normalized = apiCommissions.length
          ? apiCommissions.map((commission: any, index: number) => ({
              id: Number(commission.id) || index + 1,
              nom:
                commission.nom ||
                commission.description ||
                this.commissionContext.commissions[index]?.nom ||
                `Commission ${index + 1}`,
              description: commission.description || '',
            }))
          : this.commissionContext.commissions;

        this.commissions = normalized;
        this.commissionContext.setCommissions(normalized);
        const responseActiveId = Number(res?.active_commission_id);
        const fallbackActiveId =
          this.commissionContext.activeCommissionId || normalized[0]?.id || null;
        this.activeCommissionId = Number.isFinite(responseActiveId)
          ? responseActiveId
          : fallbackActiveId;
        this.commissionContext.setActiveCommissionId(this.activeCommissionId);
        this.commissionsLoading = false;
      },
      (err) => {
        this.commissionsLoading = false;
        this.commissions = this.commissionContext.commissions;
        if (!this.activeCommissionId && this.commissions.length) {
          this.activeCommissionId = this.commissions[0].id;
          this.commissionContext.setActiveCommissionId(this.activeCommissionId);
        }
      },
    );
  }

  onCommissionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement | null;
    const selectedValue = selectElement?.value || '';

    if (selectedValue) {
      this.commissionContext.setActiveCommissionId(Number(selectedValue));
    } else {
      this.commissionContext.setActiveCommissionId(null);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
