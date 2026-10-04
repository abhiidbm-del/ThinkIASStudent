import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface SupportFeature {
  _id: string;
  title: string;
  titleHindi: string;
  description: string;
  descriptionHindi: string;
  points: string[];
  pointsHindi: string[];
  footer: string;
  footerHindi: string;
  icon: string;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class SupportFeatureService {
  private readonly apiUrl = `${environment.apiUrl}/support-features/public`;
  constructor(private http: HttpClient) {}
  getPublic(): Observable<{ success: boolean; data: SupportFeature[] }> {
    return this.http.get<{ success: boolean; data: SupportFeature[] }>(this.apiUrl);
  }
}
