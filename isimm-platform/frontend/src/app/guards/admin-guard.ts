import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const userStr = localStorage.getItem('currentUser');

  if (!userStr) {
    console.log("❌ Pas d'utilisateur dans localStorage");
    router.navigate(['/login']);
    return false;
  }

  const user = JSON.parse(userStr);
  const userRole = user.role?.toLowerCase();

  console.log('🔒 Admin Guard - User role:', userRole);

  // ✅ AJOUT DES NOUVEAUX RÔLES
  const adminRoles = ['admin', 'commission', 'directeur', 'secretaire_general'];

  if (adminRoles.includes(userRole)) {
    console.log('✅ Accès autorisé');
    return true;
  }

  console.log('❌ Accès refusé');
  router.navigate(['/dashboard']);
  return false;
};
