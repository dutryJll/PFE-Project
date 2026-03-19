import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

import { ForgotPasswordComponent } from './components/forgot-password/forgot-password';
import { ResetPasswordComponent } from './components/reset-password/reset-password';
import { MastersComponent } from './components/masters/masters';
import { ConcoursIngenieurComponent } from './components/concours-ingenieur/concours-ingenieur.component';
import { CandidatureFormComponent } from './components/candidature-form/candidature-form.component';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin-guard';
import { roleGuard } from './guards/role-guard';
import { ProfilComponent } from './components/shared/profil.component';
import { CreatePasswordComponent } from './components/create-password/create-password.component';

// ========================================
// NOUVEAUX LOGIN SPÉCIFIQUES
// ========================================
import { LoginCandidatComponent } from './components/login-candidat/login-candidat.component';
import { LoginCommissionComponent } from './components/login-commission/login-commission.component';
import { LoginAdminComponent } from './components/login-admin/login-admin.component';

// ========================================
// CANDIDAT COMPONENTS
// ========================================
import { DashboardCandidatComponent } from './components/candidat/dashboard-candidat/dashboard-candidat';
import { ConsulterCandidaturesComponent } from './components/candidat/consulter-candidature/consulter-candidature';
import { ModifierCandidatureComponent } from './components/candidat/modifier-candidature/modifier-candidature';
import { ConsulterDossierComponent } from './components/candidat/consulter-dossier/consulter-dossier';
import { DeposerDocumentsComponent } from './components/candidat/deposer-documents/deposer-documents';
import { ChoixCandidatureComponent } from './components/choix-candidature/choix-candidature';

// ========================================
// ADMIN COMPONENTS
// ========================================
import { ListeCandidatures } from './components/admin/liste-candidatures/liste-candidatures';
import { DashboardAdminComponent } from './components/admin/dashboard-admin/dashboard-admin';

// ========================================
// COMMISSION COMPONENTS
// ========================================
import { DashboardCommissionComponent } from './components/commission/dashboard-commission/dashboard-commission';
import { ConsulterCandidaturesComponent as ConsulterCandidaturesCommissionComponent } from './components/commission/consulter-candidatures/consulter-candidatures';
import { ConsulterDossierComponent as CommissionDossierComponent } from './components/commission/consulter-dossier/consulter-dossier';
import { PreparerPreselection } from './components/commission/preparer-preselection/preparer-preselection';
import { ListePreselection } from './components/commission/liste-preselection/liste-preselection';
import { ListeSelection } from './components/commission/liste-selection/liste-selection';
import { ListeDossiersComponent } from './components/commission/liste-dossiers/liste-dossiers';
import { ExaminerOcrComponent } from './components/commission/examiner-ocr/examiner-ocr';
import { TraiterReclamationsComponent } from './components/commission/traiter-reclamations/traiter-reclamations';
import { GererInscriptionsComponent } from './components/commission/gerer-inscriptions/gerer-inscriptions';
import { GestionCommissionComponent } from './components/admin/gestion-commission/gestion-commission.component';
import { Component, OnInit, HostListener } from '@angular/core';

export const routes: Routes = [
  // ========================================
  // ROUTES PUBLIQUES
  // ========================================
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'login-candidat',
    component: LoginCandidatComponent,
  },
  {
    path: 'login-commission',
    component: LoginCommissionComponent,
  },
  {
    path: 'login-admin',
    component: LoginAdminComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'forgot-password',
    component: ForgotPasswordComponent,
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
  },
  {
    path: 'masters',
    component: MastersComponent,
  },
  {
    path: 'concours-ingenieur',
    component: ConcoursIngenieurComponent,
  },
  {
    path: 'choisir-candidature',
    component: ChoixCandidatureComponent,
  },
  {
    path: 'candidature',
    component: CandidatureFormComponent,
  },

  // ========================================
  // ROUTES CANDIDAT
  // ========================================
  {
    path: 'create-password/:token',
    component: CreatePasswordComponent,
  },
  {
    path: 'candidat/dashboard',
    component: DashboardCandidatComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['candidat'] },
  },
  {
    path: 'candidat/candidature',
    component: ConsulterCandidaturesComponent,
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

  // ========================================
  // ROUTES COMMISSION
  // ========================================
  {
    path: 'commission/dashboard',
    component: DashboardCommissionComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['commission', 'responsable_commission'] },
  },
  {
    path: 'commission/dossiers',
    component: ListeDossiersComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['commission', 'responsable_commission'] },
  },
  {
    path: 'commission/liste-preselection',
    component: ListePreselection,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['commission', 'responsable_commission'] },
  },
  {
    path: 'commission/liste-selection',
    component: ListeSelection,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['commission', 'responsable_commission'] },
  },
  {
    path: 'commission/candidatures',
    component: ConsulterCandidaturesCommissionComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['commission', 'responsable_commission'] },
  },
  {
    path: 'commission/dossier/:id',
    component: CommissionDossierComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['commission', 'responsable_commission'] },
  },
  {
    path: 'commission/preparer-preselection',
    component: PreparerPreselection,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responsable_commission'] },
  },
  {
    path: 'commission/examiner-ocr',
    component: ExaminerOcrComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responsable_commission'] },
  },
  {
    path: 'commission/reclamations',
    component: TraiterReclamationsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responsable_commission'] },
  },
  {
    path: 'commission/inscriptions',
    component: GererInscriptionsComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['responsable_commission'] },
  },

  // ========================================
  // ROUTES ADMIN
  // ========================================
  {
    path: 'admin/dashboard',
    component: DashboardAdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/gestion-commission',
    component: GestionCommissionComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'admin/candidatures',
    component: ListeCandidatures,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },

  // ========================================
  // ROUTES GÉNÉRALES
  // ========================================
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profil',
    component: ProfilComponent,
    canActivate: [authGuard],
  },

  // ========================================
  // ROUTE WILDCARD - ⚠️ TOUJOURS EN DERNIER
  // ========================================
  {
    path: '**',
    redirectTo: '',
  },
  {
    path: 'admin/gestion-commission',
    component: GestionCommissionComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['admin'] },
  },
];
