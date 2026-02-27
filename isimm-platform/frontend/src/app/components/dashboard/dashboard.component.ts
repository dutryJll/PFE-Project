import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  currentUser: any = null;
  userProfile: any = null;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadUserProfile();
  }

  loadUserProfile() {
    const email = this.currentUser?.email;
    if (!email) {
      console.error('❌ Email non trouvé');
      return;
    }

    this.userService.getProfile(email).subscribe({
      next: (profile) => {
        console.log('✅ Profil chargé:', profile);
        this.userProfile = profile;
      },
      error: (error) => {
        console.error('❌ Erreur chargement profil:', error);
      },
    });
  }
  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    if (this.userProfile?.first_name && this.userProfile?.last_name) {
      return (this.userProfile.first_name[0] + this.userProfile.last_name[0]).toUpperCase();
    }
    if (this.currentUser?.email) {
      return this.currentUser.email.substring(0, 2).toUpperCase();
    }
    return 'JD';
  }
}
