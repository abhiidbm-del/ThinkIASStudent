import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Testimonial { nameHindi?: string; descriptionHindi?: string; subtitleHindi?: string; _id: string; rating: number; description: string; name: string; subtitle: string; image?: string | null; }
interface ApiResponse<T> { success: boolean; data: T; }

@Injectable({ providedIn: 'root' })
export class TestimonialService {
  private readonly apiUrl = `${environment.apiUrl}/testimonials/public`;
  constructor(private http: HttpClient) {}
  getPublicTestimonials(): Observable<ApiResponse<Testimonial[]>> { return this.http.get<ApiResponse<Testimonial[]>>(this.apiUrl); }
}
