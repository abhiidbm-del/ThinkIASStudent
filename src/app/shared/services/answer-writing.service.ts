import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface Question {
  _id?: string;
  questionText: string;
  questionTextHi?: string;
}

export interface AnswerWriting {
  _id: string;
  name: string;
  nameHi?: string;
  description: string;
  descriptionHi?: string;
  questions: Question[];
  questionPaperPDF: string;
  questionPaperPDFHi?: string;
  startDateTime: Date;
  endDateTime: Date;
  isActive: boolean;
  order: number;
  status?: string;
  isAvailable?: boolean;
  isUpcoming?: boolean;
  isExpired?: boolean;
  hasSubmitted?: boolean;
  userSubmission?: any;
}

export interface AnswerSubmission {
  questionId: string;
  answerPDF: string;
language?: string;
}

export interface StudentSubmission {
  _id: string;
  answerWritingId: AnswerWriting;
  studentId: any;
  answers: Array<{
    questionId: string;
    answerPDF: string;
    answerPDFHi?: string;
    submittedAt: Date;
  }>;
  submittedAt: Date;
  isLate: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AnswerWritingService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Admin routes
  getAllExercisesAdmin(search?: string, status?: string): Observable<any> {
    let url = `${this.apiUrl}/answer-writing/admin/all`;
    if (search) url += `?search=${search}`;
    if (status) url += `${search ? '&' : '?'}status=${status}`;
    return this.http.get(url);
  }

  createExercise(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/answer-writing`, data);
  }

  updateExercise(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/answer-writing/${id}`, data);
  }

  deleteExercise(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/answer-writing/${id}`);
  }

  toggleExerciseStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/answer-writing/${id}/toggle-status`, {});
  }

  getExerciseSubmissions(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/${id}/submissions`);
  }

  // Student routes (with language param)
  getAvailableExercises(lang: string = 'en'): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/available?lang=${lang}`);
  }

  getExerciseById(id: string, lang: string = 'en'): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/${id}?lang=${lang}`);
  }

  // submitAnswers(id: string, answers: AnswerSubmission[]): Observable<any> {
  //   return this.http.post(`${this.apiUrl}/answer-writing/${id}/submit`, { answers });
  // }

  getMySubmissions(lang: string = 'en'): Observable<any> {
    return this.http.get(`${this.apiUrl}/answer-writing/my-submissions?lang=${lang}`);
  }

  // In answer-writing.service.ts
// Replace the existing submitAnswers method with this:
submitAnswers(id: string, file: File, language: string): Observable<any> {
  const formData = new FormData();
  formData.append('answerPDF', file);
  formData.append('language', language);
  return this.http.post(`${this.apiUrl}/answer-writing/${id}/submit`, formData);
}

getMyEvaluations(lang: string = 'en'): Observable<any> {
  return this.http.get(`${this.apiUrl}/answer-writing/my-evaluations?lang=${lang}`);
}

// Get specific evaluation for an exercise
getMyEvaluation(exerciseId: string, lang: string = 'en'): Observable<any> {
  return this.http.get(`${this.apiUrl}/answer-writing/${exerciseId}/my-evaluation?lang=${lang}`);
}

}