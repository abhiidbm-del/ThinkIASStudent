import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface DemoTest {
  _id: string;
  title: string;
  description: string;
  duration: number;
  marksPerQuestion: number;
  negativeMarks: number;
  questionUids: string[];
  introPage?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  totalMarks?: number;
  questions?: any[];
  submitted?: boolean;
  result?: {
    score: number;
    totalMarks: number;
    percentage: string;
  };
}

export interface DemoQuestion {
  uid: string;
  question: {
    english: string;
    hindi: string;
  };
  description?: {
    english: string;
    hindi: string;
  };
  options: Array<{
    english: string;
    hindi: string;
  }>;
}

export interface DemoAnswer {
  questionUid: string;
  questionIndex: number;
  selectedOption: number;
  isCorrect: boolean;
  isAttempted: boolean;
  correctAnswer: number;
  marksObtained: number;
}

export interface DemoResult {
  _id: string;
  test: {
    _id: string;
    title: string;
    description: string;
    duration: number;
    marksPerQuestion: number;
    negativeMarks: number;
    totalMarks: number;
    questionUids: string[];
  };
  student: {
    _id: string;
    fullName: string;
    email: string;
  };
  score: number;
  totalMarks: number;
  percentage: string;
  timeTaken: number;
  submittedAt: string;
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    marksPerQuestion: number;
    negativeMarks: number;
  };
  answers: DemoAnswer[];
  rank?: number;
  totalStudents?: number;
}

export interface DemoDetailedResult extends DemoResult {
  answers: Array<DemoAnswer & {
    question?: {
      english: string;
      hindi: string;
    };
    description?: {
      english: string;
      hindi: string;
    };
    options?: Array<{
      english: string;
      hindi: string;
    }>;
    tags?: string[];
  }>;
}

@Injectable({
  providedIn: 'root'
})
export class DemoTestService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/demo-tests`;

  // Admin APIs
  createDemoTest(testData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, testData);
  }

  getDemoTests(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin`);
  }

  updateDemoTest(testId: string, testData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${testId}`, testData);
  }

  deleteDemoTest(testId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete/${testId}`);
  }

  toggleDemoTestStatus(testId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${testId}/toggle-status`, {});
  }

  // Public APIs (available to both admin and students)
  getAvailableDemoTests(): Observable<DemoTest[]> {
    return this.http.get<DemoTest[]>(`${this.apiUrl}/available`);
  }

  getDemoTestById(testId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${testId}`);
  }

  submitDemoTest(testId: string, data: { answers: any[], timeTaken: number }): Observable<any> {
  const url = `${environment.apiUrl}/demo-tests/${testId}/submit`;
  console.log('Submitting to URL:', url);
  return this.http.post(url, data);
}

  checkDemoTestAvailability(testId: string): Observable<{ canTake: boolean; reason?: string; resultId?: string; submittedAt?: string }> {
    return this.http.get<{ canTake: boolean; reason?: string; resultId?: string; submittedAt?: string }>(`${this.apiUrl}/${testId}/check-availability`);
  }

  getStudentDemoTestResult(testId: string): Observable<DemoDetailedResult> {
    return this.http.get<DemoDetailedResult>(`${this.apiUrl}/${testId}/result`);
  }

  getStudentDemoResults(): Observable<DemoResult[]> {
    return this.http.get<DemoResult[]>(`${this.apiUrl}/student/results`);
  }

  // In your demo-test.service.ts
checkTestCompleted(testId: string): Observable<{completed: boolean}> {
  return this.http.get<{completed: boolean}>(`${this.apiUrl}/demo-tests/${testId}/completed`);
}
}