// shared/services/live-test.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface LiveTest {
  _id: string;
  title: string;
  titleHi?: string;
  type: 'Full-Length' | 'Sectional';
  subject: string;
  description?: string;
  descriptionHi?: string;
  questionPaperPDF?: string;
  questionPaperPDFHi?: string;
  questions?: Question[];
  meetLink: string;
  instructions?: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  duration: number;
  order?: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'available' | 'upcoming' | 'expired' | 'in-progress';
}

export interface Question {
  questionText: string;
  questionTextHi?: string;
  marks?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class LiveTestService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/live-tests`;

  // ============================================
  // ADMIN API CALLS
  // ============================================

  // Create a new live test
  createLiveTest(testData: Partial<LiveTest>): Observable<ApiResponse<LiveTest>> {
    return this.http.post<ApiResponse<LiveTest>>(this.baseUrl, testData);
  }

  // Get all live tests (admin)
  getAllLiveTests(params?: {
    search?: string;
    status?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<LiveTest[]>> {
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, value.toString());
        }
      });
    }
    return this.http.get<ApiResponse<LiveTest[]>>(`${this.baseUrl}/admin`, { params: httpParams });
  }

  // Get single live test
  getLiveTestById(id: string): Observable<ApiResponse<LiveTest>> {
    return this.http.get<ApiResponse<LiveTest>>(`${this.baseUrl}/${id}`);
  }

  // Update live test
  updateLiveTest(id: string, testData: Partial<LiveTest>): Observable<ApiResponse<LiveTest>> {
    return this.http.put<ApiResponse<LiveTest>>(`${this.baseUrl}/${id}`, testData);
  }

  // Toggle live test status
  toggleLiveTestStatus(id: string, isActive: boolean): Observable<ApiResponse<LiveTest>> {
    return this.http.patch<ApiResponse<LiveTest>>(`${this.baseUrl}/${id}/toggle-status`, { isActive });
  }

  // Delete live test
  deleteLiveTest(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/${id}`);
  }

  // ============================================
  // STUDENT API CALLS
  // ============================================

  

  // shared/services/live-test.service.ts

// Get all tests for students (with status)
getAllStudentTests(): Observable<ApiResponse<LiveTest[]>> {
  return this.http.get<ApiResponse<LiveTest[]>>(`${this.baseUrl}/student/all`);
}

// Get only currently available tests
getAvailableTests(): Observable<ApiResponse<LiveTest[]>> {
  return this.http.get<ApiResponse<LiveTest[]>>(`${this.baseUrl}/student/available`);
}

// Get upcoming tests
getUpcomingTests(): Observable<ApiResponse<LiveTest[]>> {
  return this.http.get<ApiResponse<LiveTest[]>>(`${this.baseUrl}/student/upcoming`);
}

// shared/services/live-test.service.ts (add this method)

// Submit live test answer
submitLiveTestAnswer(testId: string, file: File, language: string): Observable<ApiResponse<any>> {
  const formData = new FormData();
  formData.append('answerPDF', file);
  formData.append('language', language);
  return this.http.post<ApiResponse<any>>(`${this.baseUrl}/${testId}/submit`, formData);
}

getMyParticipations(): Observable<ApiResponse<any[]>> {
  return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/student/my-participations`);
}
}
