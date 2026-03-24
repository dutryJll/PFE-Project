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
    this.loadMembres();
  }

  loadMembres(): void {
    const token = this.authService.getAccessToken();

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
          this.isUsingFallbackData = true;
          // En cas d'erreur, utiliser des données de test
          this.membres = [
            {
              id: 1,
              first_name: 'Fatma',
              last_name: 'Ben Ali',
              email: 'fatma.ben@isimm.tn',
              specialite: 'Tous les masters',
              grade: 'Professeur',
              role: 'responsable_commission',
              statut: 'actif',
              date_creation: '2026-01-15',
            },
            {
              id: 2,
              first_name: 'Ahmed',
              last_name: 'Gharbi',
              email: 'ahmed.gharbi@isimm.tn',
              specialite: 'Master Génie Logiciel',
              grade: 'Maître de conférences',
              role: 'commission',
              statut: 'actif',
              date_creation: '2026-01-20',
            },
          ];
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

    const membre: MembreCommission = {
      id: this.membres.length + 1,
      ...this.nouveauMembre,
      statut: 'actif',
      date_creation: new Date().toISOString().split('T')[0],
    };

    // ✅ Ajouter temporairement dans le tableau (pour affichage immédiat)
    this.membres.push(membre);

    // ✅ ENVOYER à Django pour sauvegarde en base
    this.envoyerEmailActivation(membre);

    this.fermerModal();
  }

  envoyerEmailActivation(membre: MembreCommission): void {
    console.log('📧 Envoi email activation à:', membre.email);

    const token = this.authService.getAccessToken();

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
          alert(`✅ Membre ajouté avec succès !\n\n📧 Email d'activation envoyé à ${membre.email}`);

          // ✅ Recharger les membres depuis la base
          this.loadMembres();
        },
        error: (error) => {
          console.error('❌ Erreur:', error);

          // ✅ RETIRER le membre du tableau car il n'a pas été créé
          const index = this.membres.indexOf(membre);
          if (index > -1) {
            this.membres.splice(index, 1);
          }

          // Afficher l'erreur détaillée
          if (error.status === 0) {
            alert('⚠️ Backend non accessible. Vérifiez que Django tourne sur le port 8001.');
          } else if (error.error?.error) {
            alert(`⚠️ ${error.error.error}`);
          } else {
            alert("⚠️ Erreur lors de l'envoi de l'email. Vérifiez la configuration Gmail.");
          }
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
