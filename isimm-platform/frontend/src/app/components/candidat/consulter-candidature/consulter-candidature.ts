import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CandidatureService } from '../../../services/candidature.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-consulter-candidature',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './consulter-candidature.html',
  styleUrl: './consulter-candidature.css',
})
export class ConsulterCandidatureComponent implements OnInit {
  candidature: any = null;
  currentUser: any = null;

  constructor(
    private candidatureService: CandidatureService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadCandidature();
  }

  loadCandidature(): void {
    this.candidatureService.getMesCandidatures().subscribe({
      next: (data: any) => {
        this.candidature = data[0];
      },
      error: (error: any) => {
        console.error('Erreur:', error);
      },
    });
  }
}
