import { Injectable } from '@angular/core';
import {
  Router,
  CanActivateFn,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const currentUser = authService.getCurrentUser();

  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  // Récupérer les rôles autorisés depuis la route
  const allowedRoles = route.data['roles'] as string[];

  if (!allowedRoles || allowedRoles.length === 0) {
    return true;
  }

  // Vérifier si l'utilisateur a un des rôles autorisés
  if (allowedRoles.includes(currentUser.role)) {
    return true;
  }

  // Redirection selon le rôle
  switch (currentUser.role) {
    case 'candidat':
      router.navigate(['/candidat/dashboard']);
      break;
    case 'admin':
      router.navigate(['/admin']);
      break;
    case 'commission':
      router.navigate(['/commission']);
      break;
    default:
      router.navigate(['/']);
  }

  return false;
};
