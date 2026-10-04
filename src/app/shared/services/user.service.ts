// services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface MentorshipProgram {
  _id: string;
  name: string;
  nameHindi?: string; descriptionHindi?: string; durationHindi?: string;
  programId?: any; batchId?: any;
  description: string;
  duration: string;
  startDate: string;
  medium: 'english' | 'hindi' | 'english/hindi';
  fee: number;
  brochureHindi: string;
  brochureEnglish: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
  updatedBy?: {
    _id: string;
    fullName: string;
    email: string;
  };
}

export interface Student {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}`;
  constructor(private http: HttpClient) {}

  getAllStudents(): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/admin/students`);
  }

  getActivePrograms(): Observable<{ success: boolean; count: number; data: MentorshipProgram[] }> {
    return this.http.get<{ success: boolean; count: number; data: MentorshipProgram[] }>(`${this.apiUrl}/mentorship`, { });
  }

  getAllAnnouncement(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/announcements/public/active`);
  }

  getMe(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`);
  }

  getActivePlanIds(): Observable<{ planIds: string[] }> {
    return this.http.get<{ planIds: string[] }>(`${this.apiUrl}/payments/active-plans`);
  }

  getAllVideos(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/live-content/public`);
  }
}