import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface MasterScoreCoefficients {
  master_id: number;
  master_nom: string;
  coeff_bac: number;
  coeff_licence: number;
  coeff_examen: number;
  bonus_mention: number;
}

@Injectable({
  providedIn: 'root',
})
export class CandidatureService {
  private apiUrl = environment.candidatureServiceUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(includeJsonContentType: boolean = true): HttpHeaders {
    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };

    if (includeJsonContentType) {
      headers['Content-Type'] = 'application/json';
    }

    return new HttpHeaders(headers);
  }

  // CrÃ©er une candidature
  createCandidature(data: any): Observable<any> {
    const endpoint = `${this.apiUrl}/create/`;
    return this.http.post(endpoint, data, { headers: this.getHeaders() });
  }

  // RÃ©cupÃ©rer mes candidatures
  getMesCandidatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // RÃ©cupÃ©rer une candidature spÃ©cifique
  getCandidature(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // Mettre Ã  jour une candidature
  updateCandidature(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/modifier/`, data, { headers: this.getHeaders() });
  }

  // Mettre Ã  jour le statut d'une candidature
  updateStatus(candidatureId: number, newStatus: string, motifRejet?: string): Observable<any> {
    const payload = {
      statut: newStatus,
      motif_rejet: motifRejet || '',
    };
    return this.http.patch(`${this.apiUrl}/${candidatureId}/update-status/`, payload, {
      headers: this.getHeaders(),
    });
  }

  // RÃ©cupÃ©rer les mÃ©triques en temps rÃ©el pour le candidat (score, classement, total)
  getCandidateLiveMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidate-live-metrics/`, { headers: this.getHeaders() });
  }

  // RÃ©cupÃ©rer les coefficients de calcul d'un master.
  getMasterCoefficients(masterId: number): Observable<MasterScoreCoefficients> {
    return this.http.get<MasterScoreCoefficients>(
      `${this.apiUrl}/masters/${masterId}/coefficients/`,
      {
        headers: this.getHeaders(),
      },
    );
  }

  // RÃ©cupÃ©rer tous les masters ouverts
  getMastersOuverts(): Observable<any> {
    return this.http.get(`${this.apiUrl}/masters/`, { headers: this.getHeaders() });
  }

  // POUR ADMIN/COMMISSION : RÃ©cupÃ©rer toutes les candidatures
  getAllCandidatures(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mes-candidatures/`, { headers: this.getHeaders() });
  }

  // POUR COMMISSION : rÃ©cupÃ©rer la liste classÃ©e des candidatures masters
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

  // DÃ©poser ou ajuster le dossier numÃ©rique pour une candidature prÃ©sÃ©lectionnÃ©e
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

  // Calculer le score rÃ©el du wizard via le backend (pour preview en temps rÃ©el)
  calculateWizardScore(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/preview-score/`, payload, {
      headers: this.getHeaders(),
    });
  }

  // CrÃ©er une rÃ©clamation
  createReclamation(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/reclamations/`, data, { headers: this.getHeaders() });
  }

  // RÃ©cupÃ©rer mes rÃ©clamations
  getMesReclamations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reclamations/mes-reclamations/`, {
      headers: this.getHeaders(),
    });
  }

  // POUR COMMISSION : RÃ©cupÃ©rer toutes les rÃ©clamations
  getAllReclamations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/reclamations/`, { headers: this.getHeaders() });
  }

  // Traiter une rÃ©clamation (accepter/rejeter)
  traiterReclamation(id: number, decision: string, motif?: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/reclamations/${id}/traiter/`,
      { decision, motif },
      { headers: this.getHeaders() },
    );
  }
}
