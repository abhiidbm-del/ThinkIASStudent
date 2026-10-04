// shared/services/module-test.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ModuleTest {
  _id: string;
  title: string;
  description: string;
  isActive: boolean;
  questionUids: string[];
  moduleId?: string;
  passingScore?: number;
  timeLimit?: number | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleTestSubmission {
  _id: string;
  name: string;
  email: string;
  phone: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  timeTaken: number;
  passed: boolean;
  percentage: number;
  submittedAt: string;
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
  totalQuestions: number;
  correctAnswers: number;
  timeTaken: number;
  submittedAt: string;
}

export interface ModuleTestResponse {
  moduleTest: {
    _id: string;
    title: string;
    description: string;
    totalQuestions: number;
    timeLimit: number | null;
    passingScore: number;
    allowRetake: boolean;
    questions: ModuleTestQuestion[];
  };
  settings: {
    passingScore: number;
    timeLimit: number | null;
    allowRetake: boolean;
    maxAttempts: number;
    showResults: boolean;
  };
}

export interface ModuleTestQuestion {
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

@Injectable({
  providedIn: 'root'
})
export class ModuleTestService {
  private apiUrl = `${environment.apiUrl}/module-tests`;

  constructor(private http: HttpClient) {}

  // ============ Admin Operations ============
  
  /**
   * Create a new module test
   */
  createModuleTest(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  /**
   * Get all module tests (admin only)
   */
  getAllModuleTests(): Observable<ModuleTest[]> {
    return this.http.get<ModuleTest[]>(this.apiUrl);
  }

  /**
   * Get module test by ID (admin only - includes correct answers)
   */
  getModuleTestById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  /**
   * Update module test
   */
  updateModuleTest(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete module test
   */
  deleteModuleTest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Toggle module test active status
   */
  toggleModuleTestActive(id: string, isActive: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-active`, { isActive });
  }

  /**
   * Get submissions for a module test (admin only)
   */
  getModuleTestSubmissions(id: string): Observable<ModuleTestSubmission[]> {
    return this.http.get<ModuleTestSubmission[]>(`${this.apiUrl}/${id}/submissions`);
  }

  // ============ Module Specific Operations ============

  /**
   * Get all tests for a specific module
   */
  getModuleTestsByModule(moduleId: string): Observable<ModuleTest[]> {
    return this.http.get<ModuleTest[]>(`${this.apiUrl}/module/${moduleId}/tests`);
  }

  // ============ Public Operations (No Auth Required) ============

  /**
   * Get active module tests (public)
   */
  getActiveModuleTests(): Observable<ModuleTest[]> {
    return this.http.get<ModuleTest[]>(`${this.apiUrl}/active`);
  }

  /**
   * Get module test for public view (without correct answers)
   */
  getModuleTest(moduleId: string): Observable<ModuleTestResponse> {
    return this.http.get<ModuleTestResponse>(`${this.apiUrl}/public/${moduleId}/module-test`);
  }

  /**
   * Submit module test (public)
   */
  submitModuleTest(moduleId: string, submissionData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/public/${moduleId}/submit-module-test`, submissionData);
  }

  

  /**
   * Get module test leaderboard (public)
   */
  getModuleTestLeaderboard(moduleId: string): Observable<LeaderboardResponse> {
    return this.http.get<LeaderboardResponse>(`${this.apiUrl}/public/${moduleId}/module-test-leaderboard`);
  }

  
  /**
   * Check module test availability (public)
   */
  checkModuleTestAvailability(moduleId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/public/${moduleId}/availability`);
  }

  // ============ Module Integration Operations ============

  /**
   * Attach module test to a module/folder (admin only)
   */
  attachModuleTestToModule(moduleId: string, moduleTestId: string, testSettings?: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/${moduleId}/attach-module-test`, { moduleTestId, testSettings });
  }

  /**
   * Detach module test from a module/folder (admin only)
   */
  detachModuleTestFromModule(moduleId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${moduleId}/detach-module-test`);
  }

  // ============ Helper Methods ============

  /**
   * Get the display name of a module test
   */
  getDisplayName(test: ModuleTest): string {
    return test.title;
  }

  /**
   * Check if a module test is active
   */
  isActive(test: ModuleTest): boolean {
    return test.isActive;
  }

  /**
   * Get the passing score of a module test
   */
  getPassingScore(test: ModuleTest): number {
    return test.passingScore || 70;
  }

  /**
   * Get the time limit of a module test
   */
  getTimeLimit(test: ModuleTest): number | null {
    return test.timeLimit || null;
  }

  /**
   * Format time in seconds to MM:SS
   */
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Calculate score percentage
   */
  getScorePercentage(score: number, total: number): number {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  /**
   * Check if a user has passed the test
   */
  hasPassed(score: number, total: number, passingScore: number): boolean {
    const percentage = this.getScorePercentage(score, total);
    return percentage >= passingScore;
  }

  
}