import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth.service';

interface MembreCommission {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  specialite: string;
  grade: string;
  role: string;
  statut: string;
  date_creation: string;
}

@Component({
  selector: 'app-gestion-commission',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-commission.component.html',
  styleUrl: './gestion-commission.component.css',
})
export class GestionCommissionComponent implements OnInit {
  membres: MembreCommission[] = [];
  showModal: boolean = false;
  showActionsMenu: number | null = null;
  isUsingFallbackData: boolean = false;

  nouveauMembre = {
    first_name: '',
    last_name: '',
    email: '',
    specialite: '',
    grade: 'Maître de conférences',
    role: 'commission',
  };

  membreEnEdition: MembreCommission | null = null;
  isEditMode: boolean = false;

  specialites = [
    'Master Data Science',
    'Master Génie Logiciel',
    'Master Microélectronique',
    'Master Réseaux et Télécommunications',
    'Tous les masters',
  ];

  grades = ['Professeur', 'Maître de conférences', 'Maître assistant', 'Assistant'];

  constructor(
    private router: Router,
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.authService.getAccessToken();
    if (!token || !this.authService.getCurrentUser()) {
      alert('Session expirée. Veuillez vous reconnecter.');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.loadMembres();
  }

  private mapUserToMembre(user: any): MembreCommission {
    return {
      id: user.id,
      first_name: user.first_name ?? '',
      last_name: user.last_name ?? '',
      email: user.email ?? '',
      specialite: user.specialite ?? 'Tous les masters',
      grade: user.grade ?? 'Maître de conférences',
      role: user.role,
      statut: user.is_active ? 'actif' : 'suspendu',
      date_creation: user.date_inscription ?? '',
    };
  }

  loadMembres(): void {
    const token = this.authService.getAccessToken();
    if (!token) {
      alert('Session expirée. Veuillez vous reconnecter.');
      this.router.navigate(['/login-admin']);
      return;
    }

    // ✅ CHARGER les membres depuis Django
    this.http
      .get<
        MembreCommission[]
      >('http://localhost:8001/api/auth/commission-members/', { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (response) => {
          this.isUsingFallbackData = false;
          this.membres = response;
          console.log('✅ Membres chargés depuis la base:', this.membres);
        },
        error: (error) => {
          console.error('❌ Erreur chargement membres:', error);

          if (error?.status === 401) {
            alert('Votre session admin a expiré. Merci de vous reconnecter.');
            this.authService.logout();
            this.router.navigate(['/login-admin']);
            return;
          }

          // Fallback réel: récupérer tous les utilisateurs puis filtrer les rôles commission.
          this.http
            .get<any[]>('http://localhost:8001/api/auth/users/', {
              headers: { Authorization: `Bearer ${token}` },
            })
            .subscribe({
              next: (users) => {
                const membres = (users ?? [])
                  .filter((u) => u?.role === 'commission' || u?.role === 'responsable_commission')
                  .map((u) => this.mapUserToMembre(u));

                this.isUsingFallbackData = false;
                this.membres = membres;
                console.log('✅ Membres chargés via fallback users:', this.membres);
              },
              error: (usersError) => {
                console.error('❌ Erreur fallback users:', usersError);
                if (usersError?.status === 401) {
                  alert('Votre session admin a expiré. Merci de vous reconnecter.');
                  this.authService.logout();
                  this.router.navigate(['/login-admin']);
                  return;
                }
                this.isUsingFallbackData = true;
                this.membres = [];
              },
            });
        },
      });
  }

  ouvrirModal(): void {
    this.showModal = true;
    this.isEditMode = false;
    this.nouveauMembre = {
      first_name: '',
      last_name: '',
      email: '',
      specialite: '',
      grade: 'Maître de conférences',
      role: 'commission',
    };
  }

  fermerModal(): void {
    this.showModal = false;
    this.membreEnEdition = null;
    this.isEditMode = false;
  }

  ajouterMembre(): void {
    if (
      !this.nouveauMembre.first_name ||
      !this.nouveauMembre.last_name ||
      !this.nouveauMembre.email ||
      !this.nouveauMembre.specialite
    ) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const normalizedEmail = (this.nouveauMembre.email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      alert('Email invalide');
      return;
    }

    this.nouveauMembre.email = normalizedEmail;

    const dejaMembre = this.membres.some(
      (m) => (m.email || '').trim().toLowerCase() === normalizedEmail,
    );
    if (dejaMembre) {
      alert('Cet email est déjà utilisé par un membre de commission.');
      return;
    }

    const membre: MembreCommission = {
      id: this.membres.length + 1,
      ...this.nouveauMembre,
      statut: 'actif',
      date_creation: new Date().toISOString().split('T')[0],
    };

    // ✅ ENVOYER à Django pour sauvegarde en base
    this.envoyerEmailActivation(membre);
  }

  envoyerEmailActivation(membre: MembreCommission): void {
    console.log('📧 Envoi email activation à:', membre.email);

    const token = this.authService.getAccessToken();
    if (!token) {
      alert('Session expirée. Veuillez vous reconnecter.');
      this.router.navigate(['/login-admin']);
      return;
    }

    this.http
      .get<any[]>('http://localhost:8001/api/auth/users/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: (users) => {
          const normalizedEmail = (membre.email || '').trim().toLowerCase();
          const existingUser = (users || []).find(
            (u) => ((u?.email || '') as string).trim().toLowerCase() === normalizedEmail,
          );

          if (existingUser?.role === 'admin') {
            alert(
              "Impossible d'ajouter cet email: il appartient déjà à un compte administrateur. Utilisez un autre email.",
            );
            return;
          }

          this.http
            .post(
              'http://localhost:8001/api/auth/create-commission-member/',
              {
                email: membre.email,
                first_name: membre.first_name,
                last_name: membre.last_name,
                specialite: membre.specialite,
                grade: membre.grade,
                role: membre.role,
              },
              { headers: { Authorization: `Bearer ${token}` } },
            )
            .subscribe({
              next: (response: any) => {
                console.log('✅ Membre créé en base de données:', response);
                const serverMessage = response?.message ?? '';
                alert(
                  `✅ Membre ajouté avec succès !\n\n📧 ${serverMessage || `Email d'activation envoyé à ${membre.email}`}`,
                );

                this.fermerModal();
                this.loadMembres();
              },
              error: (error) => {
                console.error('❌ Erreur:', error);

                if (error.status === 0) {
                  alert('⚠️ Backend non accessible. Vérifiez que Django tourne sur le port 8001.');
                  return;
                }

                const backendError =
                  error?.error?.error ||
                  error?.error?.message ||
                  (typeof error?.error === 'string' ? error.error : '');

                const detail =
                  backendError || error?.message || `HTTP ${error?.status || 'inconnu'}`;
                alert(`⚠️ Création du membre échouée.\n${detail}`);
              },
            });
        },
        error: (error) => {
          console.error('❌ Erreur chargement users avant création:', error);
          if (error?.status === 401) {
            alert('Votre session admin a expiré. Merci de vous reconnecter.');
            this.authService.logout();
            this.router.navigate(['/login-admin']);
            return;
          }

          alert('⚠️ Impossible de valider cet email avant création. Réessayez.');
        },
      });
  }

  toggleActionsMenu(membreId: number): void {
    this.showActionsMenu = this.showActionsMenu === membreId ? null : membreId;
  }

  editerMembre(membre: MembreCommission): void {
    this.membreEnEdition = { ...membre };
    this.isEditMode = true;
    this.nouveauMembre = {
      first_name: membre.first_name,
      last_name: membre.last_name,
      email: membre.email,
      specialite: membre.specialite,
      grade: membre.grade,
      role: membre.role,
    };
    this.showModal = true;
    this.showActionsMenu = null;
  }

  sauvegarderModification(): void {
    if (!this.membreEnEdition) return;

    const index = this.membres.findIndex((m) => m.id === this.membreEnEdition!.id);
    if (index !== -1) {
      this.membres[index] = {
        ...this.membreEnEdition,
        ...this.nouveauMembre,
      };
    }

    alert('✅ Membre modifié avec succès !');
    this.fermerModal();
  }

  suspendreMembre(membre: MembreCommission): void {
    const action = membre.statut === 'actif' ? 'suspendre' : 'activer';
    if (confirm(`Voulez-vous ${action} ${membre.first_name} ${membre.last_name} ?`)) {
      membre.statut = membre.statut === 'actif' ? 'suspendu' : 'actif';
      alert(`✅ Membre ${action === 'suspendre' ? 'suspendu' : 'activé'} avec succès`);
    }
    this.showActionsMenu = null;
  }

  supprimerMembre(membre: MembreCommission): void {
    if (
      confirm(
        `⚠️ Supprimer définitivement ${membre.first_name} ${membre.last_name} ?\n\nCette action est irréversible.`,
      )
    ) {
      // En mode fallback (backend indisponible), supprimer localement pour éviter un faux blocage UI.
      if (this.isUsingFallbackData) {
        const index = this.membres.indexOf(membre);
        if (index > -1) {
          this.membres.splice(index, 1);
        }
        this.showActionsMenu = null;
        alert('⚠️ Suppression locale uniquement (backend auth indisponible).');
        return;
      }

      const token = this.authService.getAccessToken();

      // ✅ SUPPRIMER EN BASE DE DONNÉES
      this.http
        .delete(
          `http://localhost:8001/api/auth/commission-members/${membre.id}/delete/?email=${encodeURIComponent(membre.email)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )
        .subscribe({
          next: (response: any) => {
            console.log('✅ Membre supprimé de la base:', response);

            // ✅ Retirer du tableau local
            const index = this.membres.indexOf(membre);
            this.membres.splice(index, 1);

            alert('✅ Membre supprimé avec succès');
            this.showActionsMenu = null;
          },
          error: (error) => {
            console.error('❌ Erreur suppression:', error);
            if (error.status === 0) {
              alert('⚠️ Backend auth inaccessible. Vérifiez le service sur le port 8001.');
            } else if (error.status === 403) {
              alert('⚠️ Accès refusé: vous devez être connecté avec un compte admin.');
            } else if (error.status === 404) {
              alert('⚠️ Membre introuvable ou déjà supprimé.');
            } else if (error.error?.error) {
              alert(`⚠️ ${error.error.error}`);
            } else {
              alert('⚠️ Erreur lors de la suppression du membre');
            }
            this.showActionsMenu = null;
          },
        });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.actions-cell')) {
      this.showActionsMenu = null;
    }
  }

  retourDashboard(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
