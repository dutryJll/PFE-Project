import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidatureService } from '../../../services/candidature.service';

@Component({
  selector: 'app-preselection-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preselection-dashboard.component.html',
  styleUrls: ['./preselection-dashboard.component.css'],
})
export class PreselectionDashboardComponent implements OnInit {
  candidatures: any[] = [];
  selectedIds: number[] = [];
  validationScoreThreshold = 10;

  constructor(private candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.loadPreselectionCandidates();
  }

  loadPreselectionCandidates(): void {
    this.candidatureService.getCandidaturesCommissionClassees().subscribe({
      next: (res: any) => (this.candidatures = res || []),
      error: () => (this.candidatures = []),
    });
  }

  toggleSelect(id: number): void {
    const i = this.selectedIds.indexOf(id);
    if (i >= 0) this.selectedIds.splice(i, 1);
    else this.selectedIds.push(id);
  }

  validateSelection(): void {
    console.log('Valider la sélection', this.selectedIds, this.validationScoreThreshold);
  }

  fullAutoValidate(): void {
    console.log('Tous Valider seulement', this.validationScoreThreshold);
  }

  quickValidate(c: any): void {
    console.log('Validation rapide', c.id);
  }
}
