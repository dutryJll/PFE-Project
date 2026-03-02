import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ProfileComponent } from './components/profile/profile.component';
import { AdminComponent } from './components/admin/admin.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { MastersComponent } from './components/masters/masters';
import { ConcoursIngenieurComponent } from './components/concours-ingenieur/concours-ingenieur.component';
import { CandidatureFormComponent } from './components/candidature-form/candidature-form.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin-guard';
import { roleGuard } from './guards/role-guard';
import { DashboardCandidatComponent } from './components/candidat/dashboard-candidat/dashboard-candidat';
import { ConsulterCandidatureComponent } from './components/candidat/consulter-candidature/consulter-candidature';
import { ModifierCandidatureComponent } from './components/candidat/modifier-candidature/modifier-candidature';
import { ConsulterDossierComponent } from './components/candidat/consulter-dossier/consulter-dossier';
import { DeposerDocumentsComponent } from './components/candidat/deposer-documents/deposer-documents';
import { ChoixCandidatureComponent } from './components/choix-candidature/choix-candidature';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'masters', component: MastersComponent },
  { path: 'concours-ingenieur', component: ConcoursIngenieurComponent },
  { path: 'choisir-candidature', component: ChoixCandidatureComponent },
  { path: 'candidature', component: CandidatureFormComponent },

  {
    path: 'candidat/dashboard',
    component: DashboardCandidatComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['candidat'] },
  },
  {
    path: 'candidat/candidature',
    component: ConsulterCandidatureComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['candidat'] },
  },
  {
    path: 'candidat/candidature/modifier',
    component: ModifierCandidatureComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['candidat'] },
  },
  {
    path: 'candidat/dossier',
    component: ConsulterDossierComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['candidat'] },
  },
  {
    path: 'candidat/dossier/deposer',
    component: DeposerDocumentsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['candidat'] },
  },

  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, adminGuard],
  },

  { path: '**', redirectTo: '' },
];
