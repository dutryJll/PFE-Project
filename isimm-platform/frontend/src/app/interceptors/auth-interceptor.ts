import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Récupérer le token depuis localStorage
  const currentUser = localStorage.getItem('currentUser');

  if (currentUser) {
    const user = JSON.parse(currentUser);
    const token = user.access;

    console.log('🔑 Token ajouté à la requête:', req.url);

    // Cloner la requête et ajouter le header Authorization
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(clonedRequest);
  }

  return next(req);
};
