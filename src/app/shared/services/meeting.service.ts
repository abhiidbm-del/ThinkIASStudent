import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';
import { AuthService } from './auth.service';

export interface Meeting {
  _id: string;
  title: string;
  description: string;
  meetingDate: string;
  duration: number;
  meetingLink: string;
  videoLink?: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
  meetingDate: string;
  duration?: number;
  meetingLink: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
  meetingDate?: string;
  duration?: number;
  meetingLink?: string;
  videoLink?: string;
}

export interface MeetingsResponse {
  message: string;
  upcomingMeetings: Meeting[];
  completedMeetings: Meeting[];
}

@Injectable({
  providedIn: 'root'
})
export class MeetingService {

  private apiUrl = `${environment.apiUrl}/meetings`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Add these methods to your existing meeting.service.ts

// Get meetings for students (view only)
getStudentMeetings(audience?: 'pre' | 'mains'): Observable<MeetingsResponse> {
  const params = audience ? { audience } : undefined;
  return this.http.get<MeetingsResponse>(`${this.apiUrl}/student`, {
    headers: this.getHeaders(),
    params
  });
}

// Get all meetings (public view)
getAllMeetings(): Observable<MeetingsResponse> {
  return this.http.get<MeetingsResponse>(`${this.apiUrl}`, {
    headers: this.getHeaders()
  });
}
}
