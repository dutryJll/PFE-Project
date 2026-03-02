import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CandidatureService {
  private apiUrl = 'http://localhost:8003/api/candidature';

  constructor(private http: HttpClient) {}

  getMesCandidatures(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mes`).pipe(
      catchError((err) => {
        console.error('❌ Error fetching candidatures:', err);
        return of([]);
      }),
    );
  }

  getDocuments(candidatureId?: any): Observable<any[]> {
    const url = candidatureId ? `${this.apiUrl}/${candidatureId}/documents` : `${this.apiUrl}/documents`;
    return this.http.get<any[]>(url).pipe(
      catchError((err) => {
        console.error('❌ Error fetching documents:', err);
        return of([]);
      }),
    );
  }
}
