import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css',
})
export class AdminComponent implements OnInit {
  currentUser: any = null;
  users: any[] = [];
  isLoading: boolean = true;

  stats = {
    total: 0,
    candidats: 0,
    commission: 0,
    admins: 0,
    directeurs: 0,
    secretaires: 0,
  };

  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.currentUserValue;
    this.loadUsers();
  }

  loadUsers() {
    console.log('📥 Chargement des utilisateurs...');
    this.isLoading = true;

    this.userService.getUsers().subscribe({
      next: (users) => {
        console.log('✅ Utilisateurs reçus:', users);
        this.users = users;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur chargement utilisateurs', error);
        this.isLoading = false;
      },
    });
  }

  calculateStats() {
    this.stats.total = this.users.length;
    this.stats.candidats = this.users.filter((u) => u.role === 'candidat').length;
    this.stats.commission = this.users.filter((u) => u.role === 'commission').length;
    this.stats.admins = this.users.filter((u) => u.role === 'admin').length;
    this.stats.directeurs = this.users.filter((u) => u.role === 'directeur').length;
    this.stats.secretaires = this.users.filter((u) => u.role === 'secretaire_general').length;
  }

  deleteUser(userId: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      this.userService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
          alert('Utilisateur supprimé avec succès');
        },
        error: (error) => {
          console.error('Erreur suppression', error);
          alert('Erreur lors de la suppression');
        },
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'badge-admin';
      case 'directeur':
        return 'badge-directeur';
      case 'secretaire_general':
        return 'badge-secretaire';
      case 'commission':
        return 'badge-commission';
      case 'candidat':
        return 'badge-candidat';
      default:
        return 'badge-candidat';
    }
  }

  getInitials(firstName: string, lastName: string): string {
    const first = firstName?.[0]?.toUpperCase() || '';
    const last = lastName?.[0]?.toUpperCase() || '';
    return first + last || '?';
  }

  logout() {
    this.authService.logout();
  }
}
