// shared/services/question.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Question {
  _id?: string;
  question: {
    english: string;
    hindi: string;
  };
  description: {
    english: string;
    hindi: string;
  };
  options: Array<{
    english: string;
    hindi: string;
  }>;
  correctAnswer: number;
    uid?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateQuestionRequest {
  questions: Omit<Question, '_id' | 'createdAt' | 'updatedAt'>[];
}

export interface QuestionsResponse {
  questions: Question[];
  total: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface QuestionsResponse {
  questions: Question[];
  pagination: PaginationInfo;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/questions`;

  getQuestions(page: number = 1, limit: number = 10): Observable<QuestionsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<QuestionsResponse>(this.apiUrl, { params });
  }

  createQuestions(questions: CreateQuestionRequest): Observable<QuestionsResponse> {
    return this.http.post<QuestionsResponse>(this.apiUrl, questions);
  }

  updateQuestion(questionId: string, question: Partial<Question>): Observable<Question> {
    return this.http.put<Question>(`${this.apiUrl}/${questionId}`, question);
  }

  deleteQuestion(questionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${questionId}`);
  }

  getQuestionById(questionId: string): Observable<Question> {
    return this.http.get<Question>(`${this.apiUrl}/${questionId}`);
  }

  getAllQuestions(): Observable<{ questions: any, totalCount: number }> {
    return this.http.get<{ questions: Question[], totalCount: number }>(`${this.apiUrl}/all`);
  }

  // In QuestionService
getTags(): Observable<any> {
  return this.http.get<any>('http://localhost:5000/api/tags');
}
}