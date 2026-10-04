import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Plan {
  id: string;
  name: string;
  baseAmount: number;
  totalAmount: number;
  duration: string;
  features: string[];
  nameHindi?: string; subtitleHindi?: string; badgeHindi?: string; durationHindi?: string; featuresHindi?: string[];
  subtitle?: string;
  badge?: string;
  displayOrder?: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class PublicPlanService {
  constructor(private http: HttpClient) {}
  getPlans(): Observable<Plan[]> { return this.http.get<Plan[]>(`${environment.apiUrl}/plans`); }
}
