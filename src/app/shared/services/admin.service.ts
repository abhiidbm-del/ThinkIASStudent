import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SyllabusPayload, ApiResponse, SyllabusItem } from '../../core/models/syllabus.model';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  // Get syllabus data
  getSyllabus(type: string): Observable<SyllabusPayload> {
    return this.http.get<SyllabusPayload>(`${this.apiUrl}/syllabus/${type}`);
  }

  // Create or Update syllabus data using POST
  saveSyllabus(type: string, payload: SyllabusPayload): Observable<ApiResponse> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    return this.http.post<ApiResponse>(`${this.apiUrl}/syllabus/admin/syllabus/${type}`, payload, { headers });
  }

  // Remove the old update and add methods since we're using a single POST now
}