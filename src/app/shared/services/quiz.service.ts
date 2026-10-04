import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Quiz {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  totalQuestions: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Question {
  uid: string;
  question: string;
  description?: { english: string };
  options: any[];
}

export interface Submission {
  _id: string;
  name: string;
  email: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  submittedAt: Date;
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
  totalParticipants: number;
}

export interface LeaderboardItem {
  rank: number;
  name: string;
  email: string;
  phone: string;
  score: number;
  timeTaken: number;
  correctAnswers: number;
  submittedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = `${environment.apiUrl}/quizzes`;

  constructor(private http: HttpClient) {}

  // Admin operations
  createQuiz(quizData: any): Observable<any> {
    return this.http.post(this.apiUrl, quizData);
  }

  getAllQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(this.apiUrl);
  }

  getQuizById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  updateQuiz(id: string, quizData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, quizData);
  }

  deleteQuiz(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleQuizActive(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, { isActive });
  }

  getQuizSubmissions(id: string): Observable<Submission[]> {
    return this.http.get<Submission[]>(`${this.apiUrl}/${id}/submissions`);
  }

  // Public operations
  getActiveQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>(`${this.apiUrl}/active`);
  }

  submitQuiz(id: string, submissionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/submit`, submissionData);
  }

  getQuizLeaderboard(id: string): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/${id}/leaderboard`);
  }

  checkQuizAvailability(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}/availability`);
  }
}