import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  date: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  lue: boolean;
}

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
  currentView: 'dashboard' | 'notifications' = 'dashboard';
  notificationsCandidat: NotificationItem[] = [];
  notificationsNonLues = 0;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadUserProfile();
    this.loadNotifications();
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

  switchView(view: 'dashboard' | 'notifications'): void {
    this.currentView = view;
    if (view === 'notifications') {
      this.loadNotifications();
    }
  }

  private loadNotifications(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .get<NotificationItem[]>(`${environment.candidatureServiceUrl}/mes-notifications/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (data) => {
          this.notificationsCandidat = data || [];
          this.notificationsNonLues = this.notificationsCandidat.filter((item) => !item.lue).length;
        },
        error: (error) => {
          console.error('❌ Erreur chargement notifications:', error);
          this.notificationsCandidat = [];
          this.notificationsNonLues = 0;
        },
      });
  }

  marquerNotificationCommeLue(notificationId: number): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .post(
        `${environment.candidatureServiceUrl}/notifications/${notificationId}/mark-read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          this.notificationsCandidat = this.notificationsCandidat.map((notification) =>
            notification.id === notificationId ? { ...notification, lue: true } : notification,
          );
          this.notificationsNonLues = this.notificationsCandidat.filter((item) => !item.lue).length;
        },
        error: (error) => {
          console.error('❌ Erreur marquage notification lue:', error);
        },
      });
  }

  marquerToutesNotificationsCommeLues(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      return;
    }

    this.http
      .post(
        `${environment.candidatureServiceUrl}/notifications/mark-all-read/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .subscribe({
        next: () => {
          this.notificationsCandidat = this.notificationsCandidat.map((notification) => ({
            ...notification,
            lue: true,
          }));
          this.notificationsNonLues = 0;
        },
        error: (error) => {
          console.error('❌ Erreur marquage notifications lues:', error);
        },
      });
  }

  getNotificationsFiltrees(): NotificationItem[] {
    return this.notificationsCandidat;
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
