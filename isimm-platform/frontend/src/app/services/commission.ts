import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommissionService {
  private apiUrl = 'http://localhost:8003/api/commission';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // ========================================
  // STATISTIQUES
  // ========================================

  getStats(session: string = 'actuelle'): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/`, {
      params: { session },
      headers: this.getHeaders(),
    });
  }

  // ========================================
  // MASTERS
  // ========================================

  getMesMasters(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-masters/`, {
      headers: this.getHeaders(),
    });
  }

  // Publier un master (l'ouvrir aux candidatures)
  publierMaster(masterId: number, dateLimite: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/masters/${masterId}/publier/`,
      { date_limite: dateLimite },
      { headers: this.getHeaders() },
    );
  }

  // Fermer un master (stopper les candidatures)
  fermerMaster(masterId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/masters/${masterId}/fermer/`,
      {},
      { headers: this.getHeaders() },
    );
  }

  // ========================================
  // DEADLINES
  // ========================================

  setDeadline(date: Date): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/deadline/`,
      { date: date.toISOString() },
      { headers: this.getHeaders() },
    );
  }

  getDeadline(): Observable<any> {
    return this.http.get(`${this.apiUrl}/deadline/`, {
      headers: this.getHeaders(),
    });
  }

  // ========================================
  // RÉCLAMATIONS (RESPONSABLE)
  // ========================================

  getAllReclamations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reclamations/`, {
      headers: this.getHeaders(),
    });
  }

  traiterReclamation(
    id: number,
    decision: 'acceptee' | 'rejetee',
    motif?: string,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reclamations/${id}/traiter/`,
      { decision, motif },
      { headers: this.getHeaders() },
    );
  }

  // ========================================
  // INSCRIPTIONS
  // ========================================

  getInscriptions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/inscriptions/`, {
      headers: this.getHeaders(),
    });
  }

  ajouterInscription(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/inscriptions/`, data, { headers: this.getHeaders() });
  }

  // Exporter liste des inscrits
  exporterInscrits(format: 'excel' | 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/inscriptions/export/`, {
      params: { format },
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }
}
