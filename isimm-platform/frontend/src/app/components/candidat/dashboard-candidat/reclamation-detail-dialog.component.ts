import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-reclamation-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <div class="title">{{ data.identifiant || 'Réclamation' }}</div>
      <div class="status" [ngClass]="getStatusClass()">{{ getStatusLabel() }}</div>
    </div>

    <div class="section">
      <h3>Votre message</h3>
      <p class="objet"><strong>Objet :</strong> {{ getObjetLabel(data.objet) }}</p>
      <p class="motif">{{ data.motif }}</p>
      <button mat-button *ngIf="data.piece_jointe_url" (click)="openAttachment()">
        <mat-icon>attachment</mat-icon>
        {{ data.piece_jointe_nom || 'Voir la pièce jointe' }}
      </button>
    </div>

    <div class="response" *ngIf="data.reponse">
      <h4>Réponse de l'administration</h4>
      <div class="response-box">
        <mat-icon class="info-icon">info</mat-icon>
        <div class="response-text">{{ data.reponse }}</div>
      </div>
    </div>

    <div class="actions">
      <button mat-button color="primary" (click)="dialogRef.close()">Fermer</button>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        font-family: Roboto, Arial, sans-serif;
      }
      .dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
      }
      .title {
        font-weight: 600;
        font-size: 16px;
      }
      .status {
        padding: 6px 10px;
        border-radius: 12px;
        font-size: 12px;
      }
      .status.chip-success {
        background: #e6f4ea;
        color: #0b8a3e;
      }
      .status.chip-info {
        background: #e8f4ff;
        color: #1e6fd8;
      }
      .status.chip-warning {
        background: #fff4e5;
        color: #9a6b00;
      }
      .status.chip-danger {
        background: #ffecec;
        color: #b00020;
      }
      .section {
        margin-top: 8px;
      }
      .objet {
        margin: 0 0 6px 0;
      }
      .motif {
        white-space: pre-wrap;
        background: #fafafa;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid #eee;
      }
      .response {
        margin-top: 14px;
      }
      .response-box {
        display: flex;
        gap: 8px;
        background: #eef6ff;
        padding: 10px;
        border-radius: 6px;
        align-items: flex-start;
      }
      .info-icon {
        color: #1e6fd8;
      }
      .actions {
        margin-top: 12px;
        text-align: right;
      }
    `,
  ],
})
export class ReclamationDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReclamationDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  getStatusLabel(): string {
    const labels: any = { en_cours: 'En cours', en_attente: 'En attente', traitee: 'Traitée' };
    return labels[(this.data?.statut || '').toLowerCase()] || this.data?.statut || '-';
  }

  getStatusClass(): string {
    const value = (this.data?.statut || '').toLowerCase();
    if (['selectionne', 'inscrit', 'valide', 'traitee'].includes(value))
      return 'status chip-success';
    if (['rejete', 'non_admis', 'non_preselectionne'].includes(value)) return 'status chip-danger';
    if (['sous_examen', 'soumis', 'preselectionne'].includes(value)) return 'status chip-info';
    return 'status chip-warning';
  }

  openAttachment(): void {
    if (this.data?.piece_jointe_url) {
      window.open(this.data.piece_jointe_url, '_blank');
    }
  }

  getObjetLabel(objet: string): string {
    const labels: any = {
      score: 'Score incorrect',
      statut: 'Statut',
      dossier: 'Dossier',
      paiement: 'Paiement',
      autre: 'Autre',
    };
    return labels[objet] || objet || '';
  }
}
