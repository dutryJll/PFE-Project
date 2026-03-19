import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CandidatureService {
  private apiUrl = 'http://localhost:8003/api/candidatures';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Créer une candidature
  createCandidature(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create/`, data, { headers: this.getHeaders() });
  }

  // Récupérer mes candidatures
  getMesCandidatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // Récupérer une candidature spécifique
  getCandidature(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/`, { headers: this.getHeaders() });
  }

  // Mettre à jour une candidature
  updateCandidature(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/`, data, { headers: this.getHeaders() });
  }

  // Récupérer tous les masters ouverts
  getMastersOuverts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/masters-ouverts/`, { headers: this.getHeaders() });
  }

  // POUR ADMIN/COMMISSION : Récupérer toutes les candidatures
  getAllCandidatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/`, { headers: this.getHeaders() });
  }

  // Créer une réclamation
  createReclamation(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reclamations/`, data, { headers: this.getHeaders() });
  }

  // Récupérer mes réclamations
  getMesReclamations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reclamations/mes-reclamations/`, {
      headers: this.getHeaders(),
    });
  }

  // POUR COMMISSION : Récupérer toutes les réclamations
  getAllReclamations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reclamations/`, { headers: this.getHeaders() });
  }

  // Traiter une réclamation (accepter/rejeter)
  traiterReclamation(id: number, decision: string, motif?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reclamations/${id}/traiter/`,
      { decision, motif },
      { headers: this.getHeaders() },
    );
  }
}
