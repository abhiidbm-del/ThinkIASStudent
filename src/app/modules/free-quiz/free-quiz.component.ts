import { Component, signal, inject, OnInit, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatMenuModule } from '@angular/material/menu';
import { interval, Subscription } from 'rxjs';

import { QuizService } from '../../shared/services/quiz.service';
import { QuizDialogComponent } from './quiz-dialog/quiz-dialog.component';
import { HeaderComponent } from '../homepage/header/header.component';
import { PublicFooterComponent } from '../../shared/components/public-footer/public-footer.component';
import { MatExpansionModule } from '@angular/material/expansion'; // Add this

// Update the QuizResult interface
interface QuizResult {
  message: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  rank: number;
  totalParticipants: number;
  timeTaken: number;
  submittedAt: string;
  questionOverview: QuestionOverview[];
}

interface QuestionOverview {
  questionNumber: number;
  questionUid: string;
  questionText: {
    english?: string;
    hindi?: string;
    _id?: string;
  } | string;
  description?: {
    english?: string;
    hindi?: string;
    _id?: string;
  };
  options: QuestionOption[];
  selectedOption: number;
  correctOption: number;
  selectedOptionLetter: string | null;
  correctOptionLetter: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuestionOption {
  optionNumber: number;
  optionLetter: string;
  optionText: {
    english?: string;
    hindi?: string;
    _id?: string;
  } | string;
  isCorrect: boolean;
  isSelected: boolean;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardItem[];
  totalParticipants: number;
}

interface LeaderboardItem {
  rank: number;
  name: string;
  email: string;
  phone: string;
  score: number;
  timeTaken: number;
  correctAnswers: number;
  submittedAt: string;
}

@Component({
  selector: 'app-free-quiz',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatRadioModule,
    FormsModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatTableModule,
    MatProgressBarModule,
    MatMenuModule,
    HeaderComponent,
    PublicFooterComponent,
    MatExpansionModule
  ],
  templateUrl: './free-quiz.component.html',
  styleUrl: './free-quiz.component.css'
})
export class FreeQuizComponent implements OnInit, OnDestroy {
  private quizService = inject(QuizService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // State
  quizzes = signal<any[]>([]);
  loading = signal(false);
  
  // Current quiz state
  currentQuiz = signal<any>(null);
  quizQuestions = signal<any[]>([]);
  quizLoading = signal(false);
  submitting = signal(false);
  quizCompleted = signal(false);
  submissionError = signal<string | null>(null);
  
  // User info
  userInfoForm: FormGroup;
  showUserInfoForm = signal(false);
  
  // Quiz answers
  answers = signal<any[]>([]);
  startTime: number = 0;
  
  // Results
  quizResult = signal<QuizResult | null>(null);
  leaderboard = signal<LeaderboardItem[]>([]);

  // Timer
  elapsedTime = signal(0);
  private timerSubscription?: Subscription;

  // Language
  currentLanguage = signal<'en' | 'hi'>('en');

  // Computed properties for template
  answeredCount = computed(() => {
    return this.answers().filter(a => a.selectedOption !== null).length;
  });

  progressPercentage = computed(() => {
    const total = this.quizQuestions().length;
    const answered = this.answeredCount();
    return total > 0 ? (answered / total) * 100 : 0;
  });

  currentQuestionNumber = computed(() => {
    const unansweredIndex = this.answers().findIndex(a => a.selectedOption === null);
    return unansweredIndex >= 0 ? unansweredIndex + 1 : this.quizQuestions().length;
  });

  constructor() {
    // Try to get saved language from localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang === 'en' || savedLang === 'hi') {
      this.currentLanguage.set(savedLang);
    } else {
      this.currentLanguage.set('en'); // Default to English
    }

    this.userInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]]
    });
  }

  ngOnInit() {
    this.loadActiveQuizzes();
    
    // Check if we have a quiz ID in route
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadQuiz(params['id']);
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer(); // Stop any existing timer
    this.elapsedTime.set(0);
    
    this.timerSubscription = interval(1000).subscribe(() => {
      this.elapsedTime.update(time => time + 1);
    });
  }

  stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  toggleLanguage() {
    const newLang = this.currentLanguage() === 'en' ? 'hi' : 'en';
    this.currentLanguage.set(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  }

  getCurrentLanguageText(): string {
    return this.currentLanguage() === 'en' ? 'English' : 'हिंदी';
  }

  getQuestionText(question: any): string {
    if (!question) return '';
    
    if (typeof question === 'string') {
      return question;
    }
    
    if (this.currentLanguage() === 'hi' && question.hindi) {
      return question.hindi;
    }
    
    return question.english || question.question || '';
  }

  // getOptionText(option: any): string {
  //   if (!option) return '';
    
  //   if (typeof option === 'string') {
  //     return option;
  //   }
    
  //   if (this.currentLanguage() === 'hi' && option.hindi) {
  //     return option.hindi;
  //   }
    
  //   return option.english || option;
  // }

  loadActiveQuizzes() {
    this.loading.set(true);
    this.quizService.getAllQuizzes().subscribe({
      next: (quizzes) => {
        // Filter only active quizzes for public view
        const activeQuizzes = quizzes.filter(quiz => quiz.isActive);
        this.quizzes.set(activeQuizzes);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading quizzes:', error);
        this.snackBar.open('Error loading quizzes', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  // loadQuiz(quizId: string) {
  //   this.quizLoading.set(true);
  //   this.quizService.getQuizById(quizId).subscribe({
  //     next: (quiz) => {
  //       this.currentQuiz.set(quiz);
  //       this.quizQuestions.set(quiz.questions || []);
  //       this.initializeAnswers(quiz.questions || []);
  //       this.quizLoading.set(false);
        
  //       // Start timer
  //       this.startTimer();
  //     },
  //     error: (error) => {
  //       console.error('Error loading quiz:', error);
  //       this.snackBar.open('Error loading quiz', 'Close', { duration: 3000 });
  //       this.quizLoading.set(false);
  //       this.router.navigate(['/free-quiz']);
  //     }
  //   });
  // }

  initializeAnswers(questions: any[]) {
    const answers = questions.map(question => ({
      questionUid: question.uid,
      selectedOption: null as number | null
    }));
    this.answers.set(answers);
  }

  // onOptionSelect(questionIndex: number, optionIndex: number) {
  //   const updatedAnswers = [...this.answers()];
  //   updatedAnswers[questionIndex].selectedOption = optionIndex;
  //   this.answers.set(updatedAnswers);
  // }

  startQuiz(quiz: any) {
    // First show user info form
    this.currentQuiz.set(quiz);
    this.showUserInfoForm.set(true);
  }

  submitUserInfo() {
    if (this.userInfoForm.valid) {
      this.showUserInfoForm.set(false);
      this.loadQuiz(this.currentQuiz()._id);
    } else {
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
    }
  }

  calculateTimeTaken(): number {
    return this.elapsedTime();
  }

  submitQuiz() {
    if (!this.userInfoForm.valid) {
      this.snackBar.open('Please complete your information first', 'Close', { duration: 3000 });
      return;
    }

    // Check if all questions are answered
    const unansweredQuestions = this.answers().filter(answer => answer.selectedOption === null);
    if (unansweredQuestions.length > 0) {
      const confirmSubmit = confirm(`You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway?`);
      if (!confirmSubmit) return;
    }

    this.submitting.set(true);
    this.submissionError.set(null);
    this.stopTimer(); // Stop the timer when submitting
    
    const submissionData = {
      name: this.userInfoForm.value.name,
      email: this.userInfoForm.value.email,
      phone: this.userInfoForm.value.phone,
      answers: this.answers().map(answer => ({
        selectedOption: answer.selectedOption !== null ? answer.selectedOption : -1
      })),
      timeTaken: this.calculateTimeTaken()
    };

    this.quizService.submitQuiz(this.currentQuiz()._id, submissionData).subscribe({
      next: (result: QuizResult) => {
        this.quizResult.set(result);
        this.quizCompleted.set(true);
        this.loadLeaderboard();
        this.submitting.set(false);
      },
      error: (error) => {
        console.error('Error submitting quiz:', error);
        const message = error.error?.message || 'Error submitting quiz';
        this.submissionError.set(message);
        this.snackBar.open(message, 'Close', { duration: 3000 });
        this.submitting.set(false);
      }
    });
  }

  loadLeaderboard() {
    this.quizService.getQuizLeaderboard(this.currentQuiz()._id).subscribe({
      next: (result: LeaderboardResponse) => {
        this.leaderboard.set(result.leaderboard || []);
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }

  // restartQuiz() {
  //   this.stopTimer();
  //   this.currentQuiz.set(null);
  //   this.quizQuestions.set([]);
  //   this.quizCompleted.set(false);
  //   this.quizResult.set(null);
  //   this.leaderboard.set([]);
  //   this.answers.set([]);
  //   this.showUserInfoForm.set(false);
  //   this.userInfoForm.reset();
  //   this.elapsedTime.set(0);
  // }

  viewLeaderboard(quizId: string) {
    this.quizService.getQuizLeaderboard(quizId).subscribe({
      next: (result: LeaderboardResponse) => {
        this.dialog.open(QuizDialogComponent, {
          data: { 
            leaderboard: result.leaderboard, 
            quizTitle: this.currentQuiz()?.title 
          }
        });
      },
      error: (error) => {
        console.error('Error loading leaderboard:', error);
      }
    });
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  getScorePercentage(score: number, total: number): number {
    return total > 0 ? Math.round((score / total) * 100) : 0;
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Add these methods to the FreeQuizComponent class

getOptionText(optionText: any): string {
    if (!optionText) return '';
    
    if (typeof optionText === 'string') {
        return optionText;
    }
    
    if (this.currentLanguage() === 'hi' && optionText.hindi) {
        return optionText.hindi;
    }
    
    // Return English as default
    return optionText.english || optionText || '';
}

// hasBilingualContent(question: any): boolean {
//     // Check if question has content in both languages
//     const hasEnglishQuestion = question.questionText?.english;
//     const hasHindiQuestion = question.questionText?.hindi;
//     const hasEnglishOptions = question.options?.some((opt: any) => opt.optionText?.english);
//     const hasHindiOptions = question.options?.some((opt: any) => opt.optionText?.hindi);
    
//     return (hasEnglishQuestion && hasHindiQuestion) || 
//            (hasEnglishOptions && hasHindiOptions);
// }

getFeedbackTitle(isCorrect: boolean): string {
    if (this.currentLanguage() === 'hi') {
        return isCorrect ? 'बहुत बढ़िया!' : 'सुधार की आवश्यकता:';
    }
    return isCorrect ? 'Great job!' : 'Need to review:';
}

getFeedbackMessage(isCorrect: boolean): string {
    if (this.currentLanguage() === 'hi') {
        return isCorrect 
            ? 'आपने यह प्रश्न सही उत्तर दिया है।' 
            : 'अपनी समझ को बेहतर बनाने के लिए इस विषय की समीक्षा करें।';
    }
    return isCorrect 
        ? 'You answered this question correctly.' 
        : 'Review this topic to improve your understanding.';
}

getPerformanceInsight(percentage: number): string {
    if (this.currentLanguage() === 'hi') {
        if (percentage >= 90) return 'उत्कृष्ट! आपने इस विषय में महारत हासिल कर ली है।';
        if (percentage >= 80) return 'बहुत बढ़िया! आपकी समझ मजबूत है।';
        if (percentage >= 70) return 'अच्छा काम! आपकी समझ ठोस है।';
        if (percentage >= 60) return 'संतोषजनक प्रदर्शन। अभ्यास जारी रखें!';
        if (percentage >= 50) return 'आप पास हो गए! समझ में सुधार के लिए अवधारणाओं की समीक्षा करें।';
        return 'सीखते रहें! प्रश्नों की समीक्षा करें और फिर से प्रयास करें।';
    }
    
    if (percentage >= 90) return 'Excellent! You have mastered this topic.';
    if (percentage >= 80) return 'Great job! You have a strong understanding.';
    if (percentage >= 70) return 'Good work! You have a solid grasp.';
    if (percentage >= 60) return 'Satisfactory performance. Keep practicing!';
    if (percentage >= 50) return 'You passed! Review the concepts to improve.';
    return 'Keep learning! Review the questions and try again.';
}

getTimeInsight(timeTaken: number, totalQuestions: number): string {
    const avgTimePerQuestion = timeTaken / totalQuestions;
    
    if (this.currentLanguage() === 'hi') {
        if (avgTimePerQuestion < 30) return 'अच्छा समय प्रबंधन! आपने तेजी से उत्तर दिए।';
        if (avgTimePerQuestion < 60) return 'संतुलित गति। समय का अच्छा आवंटन।';
        return 'समय को बेहतर ढंग से प्रबंधित करने पर विचार करें। तेजी से उत्तर देने पर ध्यान दें।';
    }
    
    if (avgTimePerQuestion < 30) return 'Good time management! You answered quickly.';
    if (avgTimePerQuestion < 60) return 'Balanced pace. Good time allocation.';
    return 'Consider managing time better. Focus on answering faster.';
}

getImprovementTips(percentage: number): string {
    if (this.currentLanguage() === 'hi') {
        if (percentage >= 80) return 'नियमित अभ्यास करके इस स्तर को बनाए रखें।';
        if (percentage >= 60) return 'समीक्षा में पहचाने गए कमजोर क्षेत्रों पर ध्यान दें।';
        return 'सभी गलत उत्तरों की समीक्षा करें और अवधारणाओं को पूरी तरह से समझें।';
    }
    
    if (percentage >= 80) return 'Maintain this level by practicing regularly.';
    if (percentage >= 60) return 'Focus on weak areas identified in review.';
    return 'Review all incorrect answers and understand concepts thoroughly.';
}

// Update the downloadResults method to include bilingual content
downloadResults(): void {
    // const printWindow = window.open('', '_blank');
    // if (printWindow) {
    //     const content = `
    //         <!DOCTYPE html>
    //         <html>
    //         <head>
    //             <title>Quiz Results - ${this.currentQuiz()?.title}</title>
    //             <style>
    //                 body { font-family: Arial, sans-serif; padding: 20px; }
    //                 .header { text-align: center; margin-bottom: 30px; }
    //                 .score-card { background: #f5f5f5; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
    //                 .score-circle { text-align: center; font-size: 24px; font-weight: bold; }
    //                 .question-review { margin-top: 30px; }
    //                 .question { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
    //                 .correct { border-left: 4px solid #4CAF50; }
    //                 .wrong { border-left: 4px solid #f44336; }
    //                 .option { margin: 5px 0; padding: 5px; }
    //                 .correct-option { background-color: #e8f5e9; }
    //                 .selected-wrong { background-color: #ffebee; }
    //                 .summary { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; }
    //                 .language-note { background: #f0f7ff; padding: 10px; border-radius: 5px; margin: 10px 0; }
    //             </style>
    //         </head>
    //         <body>
    //             <div class="header">
    //                 <h1>${this.currentQuiz()?.title}</h1>
    //                 <h2>Quiz Results</h2>
    //                 <p>Submitted by: ${this.userInfoForm.value.name} | Date: ${new Date().toLocaleDateString()}</p>
    //                 <p><strong>Language:</strong> ${this.currentLanguage() === 'en' ? 'English' : 'Hindi'}</p>
    //             </div>
                
    //             <div class="score-card">
    //                 <div class="score-circle">
    //                     Score: ${this.quizResult()?.score}/${this.quizResult()?.totalQuestions} 
    //                     (${this.getScorePercentage(this.quizResult()?.score || 0, this.quizResult()?.totalQuestions || 0)}%)
    //                 </div>
    //                 <div>
    //                     <p>Correct Answers: ${this.quizResult()?.correctAnswers}</p>
    //                     <p>Wrong Answers: ${this.quizResult()?.wrongAnswers}</p>
    //                     <p>Time Taken: ${this.formatTime(this.quizResult()?.timeTaken || 0)}</p>
    //                     <p>Rank: ${this.quizResult()?.rank} of ${this.quizResult()?.totalParticipants}</p>
    //                 </div>
    //             </div>
                
    //             <div class="question-review">
    //                 <h3>Question Review (${this.currentLanguage() === 'en' ? 'English' : 'Hindi'})</h3>
    //                 ${this.quizResult()?.questionOverview?.map((q: any, index: number) => `
    //                     <div class="question ${q.isCorrect ? 'correct' : 'wrong'}">
    //                         <h4>Q${index + 1}: ${q.isCorrect ? '✓' : '✗'}</h4>
                            
    //                         <!-- Question Text -->
    //                         <div><strong>Question:</strong><br>
    //                             ${this.currentLanguage() === 'en' && q.questionText?.english ? 
    //                                 q.questionText.english : 
    //                                 (this.currentLanguage() === 'hi' && q.questionText?.hindi ? 
    //                                     q.questionText.hindi : 
    //                                     q.questionText || '')}
    //                         </div>
                            
    //                         <!-- Description -->
    //                         ${(this.currentLanguage() === 'en' && q.description?.english) || 
    //                           (this.currentLanguage() === 'hi' && q.description?.hindi) ? `
    //                             <div><strong>Description:</strong><br>
    //                                 ${this.currentLanguage() === 'en' ? q.description?.english : q.description?.hindi}
    //                             </div>
    //                         ` : ''}
                            
    //                         <!-- Bilingual Note -->
    //                         ${this.hasBilingualContent(q) ? `
    //                             <div class="language-note">
    //                                 <strong>Note:</strong> This question is available in both English and Hindi.
    //                             </div>
    //                         ` : ''}
                            
    //                         <!-- Options -->
    //                         <div class="options">
    //                             <strong>Options:</strong>
    //                             ${q.options?.map((opt: any) => {
    //                                 const optText = this.currentLanguage() === 'en' && opt.optionText?.english ? 
    //                                     opt.optionText.english : 
    //                                     (this.currentLanguage() === 'hi' && opt.optionText?.hindi ? 
    //                                         opt.optionText.hindi : 
    //                                         opt.optionText || '');
    //                                 return `
    //                                     <div class="option 
    //                                         ${opt.isCorrect ? 'correct-option' : ''} 
    //                                         ${opt.isSelected && !opt.isCorrect ? 'selected-wrong' : ''}">
    //                                         ${opt.optionLetter}. ${optText}
    //                                         ${opt.isCorrect ? ' (Correct)' : ''}
    //                                         ${opt.isSelected ? ' (Your Answer)' : ''}
    //                                     </div>
    //                                 `;
    //                             }).join('')}
    //                         </div>
                            
    //                         <div class="summary">
    //                             <p><strong>Your Answer:</strong> ${q.selectedOptionLetter || 'Not answered'}</p>
    //                             <p><strong>Correct Answer:</strong> ${q.correctOptionLetter}</p>
    //                             ${q.explanation ? `<p><strong>Explanation:</strong> ${q.explanation}</p>` : ''}
    //                         </div>
    //                     </div>
    //                 `).join('')}
    //             </div>
                
    //             <div class="footer">
    //                 <p>Generated on: ${new Date().toLocaleString()}</p>
    //                 <p>Language: ${this.currentLanguage() === 'en' ? 'English' : 'Hindi'}</p>
    //             </div>
    //         </body>
    //         </html>
    //     `;
    //     printWindow.document.write(content);
    //     printWindow.document.close();
    //     printWindow.print();
    // }
}

scorePercentage = computed(() => {
    const result = this.quizResult();
    if (!result) return 0;
    return this.getScorePercentage(result.score, result.totalQuestions);
  });

  // ... rest of your component code ...

  // Add this method to safely access question text properties
  // getSafeQuestionText(questionText: string | { english?: string; hindi?: string; _id?: string }): any {
  //   if (typeof questionText === 'string') {
  //     return questionText;
  //   }
  //   return questionText;
  // }

  // Add this method to safely access option text properties
  getSafeOptionText(optionText: string | { english?: string; hindi?: string; _id?: string }): any {
    if (typeof optionText === 'string') {
      return optionText;
    }
    return optionText;
  }

  // Add this method to replace retakeQuiz in template
  retakeQuiz() {
    this.restartQuiz();
  }

  // Add these methods to FreeQuizComponent class

// getQuestionDisplayText(questionText: any): string {
//   if (!questionText) return '';
  
//   if (typeof questionText === 'string') {
//     return questionText;
//   }
  
//   // Check for language-specific text
//   if (this.currentLanguage() === 'en' && questionText.english) {
//     return questionText.english;
//   }
  
//   if (this.currentLanguage() === 'hi' && questionText.hindi) {
//     return questionText.hindi;
//   }
  
//   // Fallback to any available text
//   return questionText.english || questionText.hindi || questionText || '';
// }

// getOptionDisplayText(optionText: any): string {
//   if (!optionText) return '';
  
//   if (typeof optionText === 'string') {
//     return optionText;
//   }
  
//   // Check for language-specific text
//   if (this.currentLanguage() === 'en' && optionText.english) {
//     return optionText.english;
//   }
  
//   if (this.currentLanguage() === 'hi' && optionText.hindi) {
//     return optionText.hindi;
//   }
  
//   // Fallback to any available text
//   return optionText.english || optionText.hindi || optionText || '';
// }

// Helper method to check if text has bilingual content
isBilingualText(text: any): boolean {
  if (!text || typeof text === 'string') return false;
  return !!(text.english && text.hindi);
}

// Add these methods to your FreeQuizComponent class

// Helper method to get question text with language support
getQuestionDisplayText(questionText: any): string {
  if (!questionText) return '';
  
  if (typeof questionText === 'string') {
    return questionText;
  }
  
  if (this.currentLanguage() === 'en' && questionText.english) {
    return questionText.english;
  }
  
  if (this.currentLanguage() === 'hi' && questionText.hindi) {
    return questionText.hindi;
  }
  
  // Fallback to any available text
  return questionText.english || questionText.hindi || questionText || '';
}

// Helper method to get option text with language support
getOptionDisplayText(optionText: any): string {
  if (!optionText) return '';
  
  if (typeof optionText === 'string') {
    return optionText;
  }
  
  if (this.currentLanguage() === 'en' && optionText.english) {
    return optionText.english;
  }
  
  if (this.currentLanguage() === 'hi' && optionText.hindi) {
    return optionText.hindi;
  }
  
  // Fallback to any available text
  return optionText.english || optionText.hindi || optionText || '';
}

// Helper method to get question description
getQuestionDescription(description: any): string {
  if (!description) return '';
  
  if (typeof description === 'string') {
    return description;
  }
  
  if (this.currentLanguage() === 'en' && description.english) {
    return description.english;
  }
  
  if (this.currentLanguage() === 'hi' && description.hindi) {
    return description.hindi;
  }
  
  // Fallback to any available text
  return description.english || description.hindi || description || '';
}

// Helper method to check if question has bilingual content
hasBilingualContent(question: any): boolean {
  if (!question) return false;
  
  const hasEnglishQuestion = this.getSafeQuestionText(question.questionText)?.english;
  const hasHindiQuestion = this.getSafeQuestionText(question.questionText)?.hindi;
  
  return !!(hasEnglishQuestion && hasHindiQuestion);
}

// Helper method to safely access question text properties
getSafeQuestionText(questionText: any): any {
  if (!questionText || typeof questionText === 'string') {
    return { english: questionText, hindi: questionText };
  }
  return questionText;
}

// Add these signals at the top with your other signals
activeQuestionIndex = signal<number>(0);
private questionElements = new Map<number, HTMLElement>();

// Add these methods to your component class

scrollToQuestion(index: number): void {
  // Update active index
  this.activeQuestionIndex.set(index);
  
  // Find the question element and scroll to it
  const element = document.getElementById(`question-${index}`);
  if (element) {
    const container = document.querySelector('.questions-container');
    if (container) {
      const offset = 20; // Offset from the top
      const elementPosition = element.getBoundingClientRect().top;
      const containerPosition = container.getBoundingClientRect().top;
      const scrollPosition = elementPosition - containerPosition - offset;
      
      container.scrollTo({
        top: container.scrollTop + scrollPosition,
        behavior: 'smooth'
      });
    }
  }
}

// Add this method to track which question is currently visible
setupIntersectionObserver(): void {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          if (id && id.startsWith('question-')) {
            const index = parseInt(id.split('-')[1]);
            this.activeQuestionIndex.set(index);
          }
        }
      });
    },
    {
      threshold: 0.5, // Trigger when 50% of the element is visible
      rootMargin: '0px'
    }
  );

  // Observe all question elements after they're rendered
  setTimeout(() => {
    this.quizQuestions().forEach((_, index) => {
      const element = document.getElementById(`question-${index}`);
      if (element) {
        observer.observe(element);
      }
    });
  }, 500);
}

// Update your loadQuiz method to setup the observer after questions are loaded
loadQuiz(quizId: string) {
  this.quizLoading.set(true);
  this.quizService.getQuizById(quizId).subscribe({
    next: (quiz) => {
      this.currentQuiz.set(quiz);
      this.quizQuestions.set(quiz.questions || []);
      this.initializeAnswers(quiz.questions || []);
      this.quizLoading.set(false);
      
      // Start timer
      this.startTimer();
      
      // Setup intersection observer after a short delay to ensure DOM is rendered
      setTimeout(() => {
        this.setupIntersectionObserver();
      }, 500);
    },
    error: (error) => {
      console.error('Error loading quiz:', error);
      this.snackBar.open('Error loading quiz', 'Close', { duration: 3000 });
      this.quizLoading.set(false);
      this.router.navigate(['/free-quiz']);
    }
  });
}

// Update onOptionSelect to refresh the observer if needed
onOptionSelect(questionIndex: number, optionIndex: number) {
  const updatedAnswers = [...this.answers()];
  updatedAnswers[questionIndex].selectedOption = optionIndex;
  this.answers.set(updatedAnswers);
  
  // You can optionally auto-scroll to next unanswered question
  // Uncomment the next lines if you want auto-advance feature
  // const nextUnanswered = updatedAnswers.findIndex(a => a.selectedOption === null);
  // if (nextUnanswered !== -1 && nextUnanswered > questionIndex) {
  //   this.scrollToQuestion(nextUnanswered);
  // }
}

// Update restartQuiz to clean up
restartQuiz() {
  this.stopTimer();
  this.currentQuiz.set(null);
  this.quizQuestions.set([]);
  this.quizCompleted.set(false);
  this.submissionError.set(null);
  this.quizResult.set(null);
  this.leaderboard.set([]);
  this.answers.set([]);
  this.showUserInfoForm.set(false);
  this.userInfoForm.reset();
  this.elapsedTime.set(0);
  this.activeQuestionIndex.set(0);
}


}