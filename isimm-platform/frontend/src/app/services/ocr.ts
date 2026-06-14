import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LotOcrResultat {
  candidature_id: number;
  candidat_nom: string;
  master: string;
  statut: 'ok' | 'anomalie' | 'incomplet' | 'erreur';
  flag_fraude: boolean;
  nb_anomalies: number;
  rapport: any;
  message?: string;
}

export interface LotOcrResponse {
  success: boolean;
  message: string;
  nb_total: number;
  nb_conformes: number;
  nb_incoherences: number;
  nb_erreurs: number;
  resultats: LotOcrResultat[];
}

@Injectable({
  providedIn: 'root',
})
export class OcrService {
  // ✅ Utilise l'environment au lieu de URLs codées en dur
  private apiUrl = `${environment.candidatureServiceUrl}/ocr`;
  private candidatureApiUrl = environment.candidatureServiceUrl;

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

  // Lister les dossiers déposés en attente d'analyse OCR
  listerDossiersOcr(): Observable<any> {
    return this.http.get(`${this.candidatureApiUrl}/dossiers-ocr/`, {
      headers: this.getHeaders(),
    });
  }

  // Lancer l'analyse OCR en lot (une seule transaction serveur)
  analyserLot(candidatureIds: number[]): Observable<LotOcrResponse> {
    return this.http.post<LotOcrResponse>(
      `${this.candidatureApiUrl}/ocr/analyser-lot/`,
      { candidature_ids: candidatureIds },
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
