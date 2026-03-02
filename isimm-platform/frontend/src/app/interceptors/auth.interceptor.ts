import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // ne pas attacher le token sur les routes d'authentification
  // (login / register) car l'utilisateur n'est pas encore connecté
  if (req.url.includes('/api/auth/')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
