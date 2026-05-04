import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CandidatureService } from '../../../services/candidature.service';

@Component({
  selector: 'app-candidatures-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './candidatures-list.component.html',
  styleUrls: ['./candidatures-list.component.css'],
})
export class CandidaturesListComponent implements OnInit {
  candidatures: any[] = [];
  selectedIds: number[] = [];
  isAllSelected = false;

  constructor(private candidatureService: CandidatureService) {}

  ngOnInit(): void {
    this.loadCandidatures();
  }

  loadCandidatures(): void {
    this.candidatureService.getCandidaturesCommissionClassees().subscribe({
      next: (res: any) => {
        this.candidatures = res || [];
      },
      error: () => (this.candidatures = []),
    });
  }

  toggleSelect(id: number): void {
    const idx = this.selectedIds.indexOf(id);
    if (idx >= 0) this.selectedIds.splice(idx, 1);
    else this.selectedIds.push(id);
    this.isAllSelected = this.selectedIds.length === this.candidatures.length;
  }

  toggleSelectAll(): void {
    if (this.isAllSelected) {
      this.selectedIds = [];
      this.isAllSelected = false;
      return;
    }
    this.selectedIds = this.candidatures.map((c) => c.id);
    this.isAllSelected = true;
  }

  consultMass(): void {
    console.log('Consulter en masse', this.selectedIds);
  }

  consultCandidate(id: number): void {
    console.log('Consulter', id);
  }

  downloadZip(): void {
    console.log('Télécharger ZIP', this.selectedIds);
  }

  markAllAsRead(): void {
    console.log('Lire tous', this.selectedIds);
  }
}
