// services/test.service.ts - CORRECTED VERSION
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ChatMessage {
  _id: string;
  result: string;
  sender: any;
  receiver: any;
  message: string;
  isEdited: boolean;
  isRead: boolean;
  readAt: string;
  parentMessage?: ChatMessage;
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  duration: number;
  questions: Question[];
  endTime?: string;
  isActive?: boolean;
  totalQuestions?: number;
  totalMarks?: number;
}

// export interface Question {
//   question: string;
//   options: string[];
//   marks: number;
//   correctAnswer?: number;
// }

export interface TestSubmission {
  answers: Answer[];
  timeTaken: number;
}

export interface Answer {
  selectedOption: number;
}

export interface TestSubmissionResult {
  message: string;
  score: number;
  totalMarks: number;
  percentage: number;
  resultId: string;
}

export interface TestResult {
  _id: string;
  test: {
    _id: string;
    title: string;
    startTime: string;
    duration: number;
    totalMarks?: number;
  };
  score: number;
  totalMarks: number;
  percentage: number;
  rank?: number;
  totalStudents?: number;
  submittedAt: string;
  timeTaken: number;
  videoLink: string;
}

// export interface DetailedResult {
//   _id: string;
//   test: {
//     _id: string;
//     title: string;
//     marksPerQuestion: number;
//     negativeMarks: number;
//     questions: Array<{
//       question: string;
//       options: string[];
//       marks: number;
//       description: string;
//       studentAnswer: number;
//       correctAnswer: number;
//       isCorrect: boolean;
//     }>;
//   };
//   score: number;
//   totalMarks: number;
//   percentage: number;
//   rank: number;
//   totalStudents: number;
//   submittedAt: string;
//   timeTaken: number;
//   answers?: Array<{
//     questionIndex: number;
//     selectedOption: number;
//     isCorrect: boolean;
//     correctAnswer: number;
//   }>;
// }

// Update your existing interfaces in test.service.ts
export interface Question {
  question: {
    english: string;
    hindi: string;
    _id: string;
  };
  description: {
    english: string;
    hindi: string;
    _id: string;
  };
  options: Array<{
    english: string;
    hindi: string;
    _id: string;
  }>;
  tags: Array<{
    _id: string;
    tag: string;
  }>;
  studentAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  marks?: number;
}

export interface DetailedResult {
  summary: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    marksPerQuestion: number;
    negativeMarks: number;
  };
  _id: string;
  test: {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    duration: number;
    marksPerQuestion: number;
    negativeMarks: number;
    questionUids: string[];
    questions: Question[];
  };
  student: {
    _id: string;
    fullName: string;
    email: string;
  };
  answers: Array<{
    questionUid: string;
    questionIndex: number;
    selectedOption: number;
    isCorrect: boolean;
    isAttempted: boolean;
    correctAnswer: number;
    marksObtained: number;
    _id: string;
  }>;
  score: number;
  totalMarks: number;
  percentage: string;
  timeTaken: number;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  rank: number;
  totalStudents: number;
}

export interface TestAnalytics {
  testTitle: string;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  averageTime: number;
  questionStats: Array<{
    questionIndex: number;
    question: string;
    correctAnswers: number;
    incorrectAnswers: number;
    correctPercentage: string;
  }>;
  performanceDistribution?: {
    excellent: number;
    good: number;
    average: number;
    poor: number;
  };
}

export interface TestRanking {
  _id: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
  };
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  submittedAt: string;
  timeTaken: number;
}

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = `${environment.apiUrl}`;
  constructor(private http: HttpClient) {}

  // Student methods
  getUpcomingTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/tests`);
  }

  getTestById(id: string): Observable<Test> {
    return this.http.get<Test>(`${this.apiUrl}/tests/${id}`);
  }

  submitTest(testId: string, submission: TestSubmission): Observable<TestSubmissionResult> {
    return this.http.post<TestSubmissionResult>(`${this.apiUrl}/tests/${testId}/submit`, submission);
  }

  getStudentResults(): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.apiUrl}/results/student`);
  }

  getStudentTestResult(testId: string): Observable<DetailedResult> {
    return this.http.get<DetailedResult>(`${this.apiUrl}/results/student/test/${testId}`);
  }

  getStudentTestHistory(): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.apiUrl}/tests/student/history`);
  }

  checkTestAvailability(testId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tests/${testId}/availability`);
  }

  // Admin methods
  createTest(testData: any): Observable<Test> {
    return this.http.post<Test>(`${this.apiUrl}/admin/tests`, testData);
  }

  getAllTests(): Observable<Test[]> {
    return this.http.get<Test[]>(`${this.apiUrl}/admin/tests`);
  }

  updateTest(id: string, testData: any): Observable<Test> {
    return this.http.put<Test>(`${this.apiUrl}/admin/tests/${id}`, testData);
  }

  deleteTest(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/tests/${id}`);
  }

  getTestResults(testId: string): Observable<TestRanking[]> {
    return this.http.get<TestRanking[]>(`${this.apiUrl}/admin/results/${testId}`);
  }

  getAllResults(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/results`);
  }

  getTestAnalytics(testId: string): Observable<TestAnalytics> {
    return this.http.get<TestAnalytics>(`${this.apiUrl}/admin/analytics/${testId}`);
  }

  getPlatformStatistics(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/statistics`);
  }

  processPayment(paymentData: any): Observable<any> {
  // For now, simulate a successful payment response
  // Replace with actual API call when backend is ready
  // return new Observable(observer => {
  //   setTimeout(() => {
  //     observer.next({
  //       success: true,
  //       transactionId: 'TXN' + Date.now(),
  //       message: 'Payment processed successfully'
  //     });
  //     observer.complete();
  //   }, 2000);
  // });
  
  // Uncomment below when you have actual API endpoint
  return this.http.post<any>(`${this.apiUrl}/payments/process`, paymentData);
}

getPlans(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/plans`);
}

getPaymentHistory(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/payments/history`);
}

// In TestService
downloadQuestionPaperPdf(testId: string, type: 'en' | 'hi'): Observable<any> {
  const url = `${this.apiUrl}/pdf/question-paper-base64`;
  return this.http.post<any>(url, {
    testId,
    type
  });
}


getChatMessages(resultId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/chat/${resultId}`);
  }

  sendMessage(messageData: any): Observable<ChatMessage> {
    return this.http.post<ChatMessage>(`${this.apiUrl}/chat`, messageData);
  }

  updateMessage(messageId: string, newMessage: string): Observable<ChatMessage> {
    return this.http.put<ChatMessage>(`${this.apiUrl}/chat/${messageId}`, {
      message: newMessage
    });
  }

  deleteMessage(messageId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/chat/${messageId}`);
  }

  getUnreadMessageCount(resultId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/chat/${resultId}/unread-count`);
  }

  markMessagesAsRead(resultId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/${resultId}/mark-read`, {});
  }

}