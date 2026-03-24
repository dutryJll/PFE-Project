import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();

  console.log('🔐 roleGuard - Utilisateur:', currentUser);
  console.log('🔐 roleGuard - Route:', route.routeConfig?.path);
  console.log('🔐 roleGuard - Rôles autorisés:', route.data['roles']);

  if (!currentUser) {
    console.log("❌ Pas d'utilisateur connecté → /login");
    router.navigate(['/login']);
    return false;
  }

  const allowedRoles = route.data['roles'] as string[];

  if (!allowedRoles || allowedRoles.length === 0) {
    console.log('✅ Pas de restriction de rôle');
    return true;
  }

  const userRole = (currentUser.role ?? '').toString().trim().toLowerCase();
  const normalizedAllowedRoles = (allowedRoles ?? []).map((role) =>
    role.toString().trim().toLowerCase(),
  );
  const isAllowed = normalizedAllowedRoles.includes(userRole);

  console.log('🔍 Vérification rôle:', {
    userRole,
    allowedRoles: normalizedAllowedRoles,
    isAllowed,
  });

  if (isAllowed) {
    console.log('✅ Rôle autorisé → Accès accordé');
    return true;
  }

  console.log('❌ Rôle non autorisé → Redirection');

  // ✅ CORRECTION : Redirection selon le rôle
  switch (userRole) {
    case 'candidat':
      router.navigate(['/candidat/dashboard']);
      break;
    case 'commission':
    case 'responsable_commission':
      router.navigate(['/commission/dashboard']);
      break;
    case 'admin':
      router.navigate(['/admin/dashboard']); // ✅ CORRIGÉ
      break;
    default:
      router.navigate(['/']);
  }

  return false;
};
