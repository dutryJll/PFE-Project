import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  private apiUrl = 'http://localhost:8005/api/ocr';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
  }

  // Analyser un document spécifique
  analyserDocument(documentId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/analyser/`,
      { document_id: documentId },
      { headers: this.getHeaders() },
    );
  }

  // Analyser tous les documents d'un candidat
  analyserDossierComplet(candidatureId: number): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/analyser-dossier/`,
      { candidature_id: candidatureId },
      { headers: this.getHeaders() },
    );
  }

  // Générer rapport final
  genererRapport(candidatureId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/rapport/${candidatureId}/`, {
      headers: this.getHeaders(),
    });
  }

  // Exporter rapport PDF
  exporterRapportPDF(candidatureId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/rapport/${candidatureId}/pdf/`, {
      headers: this.getHeaders(),
      responseType: 'blob',
    });
  }
}
