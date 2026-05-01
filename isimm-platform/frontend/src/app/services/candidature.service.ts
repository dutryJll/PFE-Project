import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CandidatureService {
  private apiUrl = 'http://localhost:8003/api/candidatures';

  constructor(private http: HttpClient) {}

  private getHeaders(includeJsonContentType: boolean = true): HttpHeaders {
    const token = localStorage.getItem('access_token');
    console.log('🔐 CandidatureService.getHeaders() - token exists:', !!token);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    console.log('📤 Headers being sent:', {
      Authorization: token ? `Bearer ${token.substring(0, 20)}...` : 'NO TOKEN',
    });
    return new HttpHeaders(headers);
  }

  // Créer une candidature
  createCandidature(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create/`, data, { headers: this.getHeaders() });
  }

  // Récupérer mes candidatures
  getMesCandidatures(): Observable<any> {
    console.log('📤 GET /mes-candidatures/ appelé');
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // Récupérer une candidature spécifique
  getCandidature(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // Mettre à jour une candidature
  updateCandidature(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/modifier/`, data, { headers: this.getHeaders() });
  }

  // Récupérer tous les masters ouverts
  getMastersOuverts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/masters/`, { headers: this.getHeaders() });
  }

  // POUR ADMIN/COMMISSION : Récupérer toutes les candidatures
  getAllCandidatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // POUR COMMISSION : récupérer la liste classée des candidatures masters
  getCandidaturesCommissionClassees(masterId?: number | string): Observable<any> {
    let params = new HttpParams().set('type', 'masters');
    if (
      masterId !== undefined &&
      masterId !== null &&
      `${masterId}`.trim() !== '' &&
      `${masterId}` !== 'all'
    ) {
      params = params.set('master_id', `${masterId}`);
    }

    return this.http.get(`${this.apiUrl}/responsable/candidatures/`, {
      headers: this.getHeaders(),
      params,
    });
  }

  // POUR COMMISSION : accepter ou refuser une candidature
  deciderCandidatureCommission(
    candidatureId: number,
    decision: 'accepter' | 'refuser',
    motifRejet?: string,
  ): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/${candidatureId}/commission-decision/`,
      { decision, motif_rejet: motifRejet || '' },
      { headers: this.getHeaders() },
    );
  }

  // Déposer ou ajuster le dossier numérique pour une candidature présélectionnée
  deposerDossierNumerique(candidatureId: number, payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${candidatureId}/deposer-dossier/`, payload, {
      headers: this.getHeaders(),
    });
  }

  deposerDossierNumeriqueWithProgress(
    candidatureId: number,
    payload: any,
  ): Observable<HttpEvent<any>> {
    return this.http.post<any>(`${this.apiUrl}/${candidatureId}/deposer-dossier/`, payload, {
      headers: this.getHeaders(),
      observe: 'events',
      reportProgress: true,
    });
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
