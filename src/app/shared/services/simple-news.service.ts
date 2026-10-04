import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SimpleNews {
  _id: string;
  text: string;
  textHi: string;
  isActive: boolean;
  createdAt: string;
}

export interface NewsResponse {
  message: string;
  news: SimpleNews | SimpleNews[];
}

@Injectable({
  providedIn: 'root'
})
export class SimpleNewsService {
  private apiUrl = `${environment.apiUrl}/simpleNews`;

  constructor(private http: HttpClient) {}

  // Public: Get active news
  getActiveNews(): Observable<NewsResponse> {
    return this.http.get<NewsResponse>(`${this.apiUrl}/public`);
  }

  // Admin: Create news
  createNews(text: string, textHi: string): Observable<NewsResponse> {
    return this.http.post<NewsResponse>(`${this.apiUrl}`, { text, textHi });
  }

  // Admin: Get all news
  getAllNews(): Observable<NewsResponse> {
    return this.http.get<NewsResponse>(`${this.apiUrl}`);
  }

  // Admin: Toggle status
  toggleNewsStatus(id: string): Observable<NewsResponse> {
    return this.http.patch<NewsResponse>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Admin: Delete news
  deleteNews(id: string): Observable<NewsResponse> {
    return this.http.delete<NewsResponse>(`${this.apiUrl}/${id}`);
  }
}