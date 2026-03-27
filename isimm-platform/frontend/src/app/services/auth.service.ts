import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

interface MyActionsResponse {
  role: string;
  actions: Array<{
    action_no: number;
    action_name: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.authServiceUrl;
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private enabledActions = new Set<string>();
  private actionsLoaded = false;

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
        if (error?.status === 0) {
          console.error(`❌ Service Auth indisponible: ${this.apiUrl}`);
        }
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
    this.enabledActions.clear();
    this.actionsLoaded = false;
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

  getMyEnabledActions(forceReload: boolean = false): Observable<string[]> {
    if (this.actionsLoaded && !forceReload) {
      return of(Array.from(this.enabledActions));
    }

    return this.http.get<MyActionsResponse>(`${this.apiUrl}/my-actions/`).pipe(
      map((response) => (response.actions || []).map((item) => item.action_name || '')),
      tap((actionNames) => {
        this.enabledActions = new Set(
          actionNames.filter((name) => !!name).map((name) => this.normalizeActionName(name)),
        );
        this.actionsLoaded = true;
      }),
      catchError((error: any) => {
        console.warn('Actions indisponibles (fallback local permissif):', error?.status || error);
        this.actionsLoaded = false;
        this.enabledActions.clear();
        return of([]);
      }),
    );
  }

  hasMyAction(actionNames: string | string[]): boolean {
    const names = Array.isArray(actionNames) ? actionNames : [actionNames];
    if (!names.length) {
      return false;
    }

    return names.some((name) => this.enabledActions.has(this.normalizeActionName(name)));
  }

  private normalizeActionName(value: string): string {
    return (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
