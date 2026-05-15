import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from './services/theme.service';
import { CandidatureService } from './services/candidature.service';

interface CommissionOption {
  id: number;
  nom: string;
  description?: string;
  actif?: boolean;
  is_active?: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class AppComponent {
  title = 'frontend';

  commissions: CommissionOption[] = [];
  commissionsLoading = false;
  activeCommissionId: number | null = null;

  constructor(public themeService: ThemeService, private candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.loadMyCommissions();
  }

  loadMyCommissions(): void {
    this.commissionsLoading = true;
    this.candidatureService.getMyCommissions().subscribe(
      (res: any) => {
        this.commissions = res?.commissions || [];
        this.activeCommissionId = res?.active_commission_id || null;
        this.commissionsLoading = false;
      },
      (err) => {
        this.commissionsLoading = false;
      },
    );
  }

  onCommissionChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement | null;
    const selectedValue = selectElement?.value || '';

    if (selectedValue) {
      localStorage.setItem('active_commission_id', selectedValue);
    } else {
      localStorage.removeItem('active_commission_id');
    }

    window.location.reload();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
