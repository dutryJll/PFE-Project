import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:8001/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const storedUser = this.getCurrentUser();
    if (storedUser) {
      this.currentUserSubject.next(storedUser);
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login/`, { email, password }).pipe(
      tap((response: any) => {
        console.log('🔐 Réponse login:', response);

        if (response.access && response.user) {
          localStorage.setItem('access_token', response.access);
          localStorage.setItem('refresh_token', response.refresh);
          localStorage.setItem('current_user', JSON.stringify(response.user));

          this.currentUserSubject.next(response.user);

          console.log('✅ Connexion OK - Rôle:', response.user.role);
        }
      }),
      catchError((error: any) => {
        console.error('❌ Erreur login:', error);
        return throwError(() => error);
      }),
    );
  }

  register(userData: any): Observable<any> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
    console.log('🚪 Déconnexion');
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('current_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('❌ Erreur parsing user:', e);
        return null;
      }
    }
    return null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('access_token');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  refreshToken(): Observable<any> {
    const refresh = localStorage.getItem('refresh_token');
    return this.http.post(`${this.apiUrl}/refresh/`, { refresh }).pipe(
      tap((response: any) => {
        if (response.access) {
          localStorage.setItem('access_token', response.access);
        }
      }),
    );
  }

  verifyPassword(email: string, password: string): Observable<any> {
    console.log('🔐 Vérification mot de passe pour:', email);
    return this.http.post(`${this.apiUrl}/login/`, { email, password }).pipe(
      tap((response: any) => {
        console.log('✅ Mot de passe vérifié');
      }),
      catchError((error: any) => {
        console.error('❌ Mot de passe incorrect');
        return throwError(() => error);
      }),
    );
  }
}
