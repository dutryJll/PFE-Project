import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // RÃ©cupÃ©rer le token depuis localStorage
  const currentUser = localStorage.getItem('currentUser');

  if (currentUser) {
    const user = JSON.parse(currentUser);
    const token = user.access;


    // Cloner la requÃªte et ajouter le header Authorization
    const clonedRequest = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(clonedRequest);
  }

  return next(req);
};
