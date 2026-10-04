// module-test/module-test.component.ts
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
import { MatExpansionModule } from '@angular/material/expansion';

import { ModuleTestDialogComponent } from './module-test-dialog/module-test-dialog.component';
import { HeaderComponent } from '../../header/header.component';
import { ModuleTestService } from '../../../../shared/services/module-test.service';

interface TestResult {
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
  passingScore: number;
  passed: boolean;
  percentage: number;
  showResults: boolean;
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
  selector: 'app-module-test',
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
    MatExpansionModule
  ],
  templateUrl: './module-test.component.html',
  styleUrls: ['./module-test.component.css']
})
export class ModuleTestComponent implements OnInit, OnDestroy {
  private moduleTestService = inject(ModuleTestService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);

  // State
  moduleId = '';
  moduleName = '';
  tests = signal<any[]>([]);
  loading = signal(false);
  
  // Current test state
  currentTest = signal<any>(null);
  testQuestions = signal<any[]>([]);
  testLoading = signal(false);
  submitting = signal(false);
  testCompleted = signal(false);
  
  // User info
  userInfoForm: FormGroup;
  showUserInfoForm = signal(false);
  
  // Test answers
  answers = signal<any[]>([]);
  startTime: number = 0;
  
  // Results
  testResult = signal<any>(null);
  leaderboard = signal<LeaderboardItem[]>([]);

  // Timer
  elapsedTime = signal(0);
  private timerSubscription?: Subscription;

  // Language
  currentLanguage = signal<'en' | 'hi'>('en');

  // Computed properties
  answeredCount = computed(() => {
    return this.answers().filter(a => a.selectedOption !== null).length;
  });

  progressPercentage = computed(() => {
    const total = this.testQuestions().length;
    const answered = this.answeredCount();
    return total > 0 ? (answered / total) * 100 : 0;
  });

  currentQuestionNumber = computed(() => {
    const unansweredIndex = this.answers().findIndex(a => a.selectedOption === null);
    return unansweredIndex >= 0 ? unansweredIndex + 1 : this.testQuestions().length;
  });

  activeQuestionIndex = signal<number>(0);

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
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.moduleId = params['id'];
        this.moduleName = params['name'] || 'Module Test';
        this.loadTests();
      }
    });
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  // ============ Language Methods ============
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

  getOptionText(option: any): string {
    if (!option) return '';
    
    if (typeof option === 'string') {
      return option;
    }
    
    if (this.currentLanguage() === 'hi' && option.hindi) {
      return option.hindi;
    }
    
    return option.english || option;
  }

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
    
    return questionText.english || questionText.hindi || questionText || '';
  }

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
    
    return optionText.english || optionText.hindi || optionText || '';
  }

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
    
    return description.english || description.hindi || description || '';
  }

  // module-test/module-test.component.ts - Fix hasBilingualContent method

// Replace the existing hasBilingualContent method with this:

hasBilingualContent(question: any): boolean {
  if (!question) return false;
  
  // Get the question text object
  const questionText = question.questionText;
  
  // If it's a string, it's not bilingual
  if (typeof questionText === 'string') return false;
  
  // Check if both English and Hindi versions exist
  const hasEnglish = !!(questionText?.english && questionText.english.trim().length > 0);
  const hasHindi = !!(questionText?.hindi && questionText.hindi.trim().length > 0);
  
  // Also check options for bilingual content
  const hasBilingualOptions = question.options?.some((opt: any) => {
    const optText = opt.optionText;
    if (typeof optText === 'string') return false;
    return !!(optText?.english && optText?.hindi);
  });
  
  return (hasEnglish && hasHindi) || hasBilingualOptions;
}

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

  // ============ Load Tests ============
  loadTests() {
    this.loading.set(true);
    this.moduleTestService.getModuleTestsByModule(this.moduleId).subscribe({
      next: (tests) => {
        // Filter only active tests for public view
        const activeTests = tests.filter(test => test.isActive);
        this.tests.set(activeTests);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading tests:', error);
        this.snackBar.open('Error loading tests', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  // ============ Start Test ============
  startTest(test: any) {
    this.currentTest.set(test);
    this.showUserInfoForm.set(true);
  }

  submitUserInfo() {
    if (this.userInfoForm.valid) {
      this.showUserInfoForm.set(false);
      this.loadTestQuestions(this.currentTest()._id);
    } else {
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
    }
  }

  loadTestQuestions(testId: string) {
    this.testLoading.set(true);
    this.moduleTestService.getModuleTestById(testId).subscribe({
      next: (test) => {
        this.currentTest.set(test);
        this.testQuestions.set(test.questions || []);
        this.initializeAnswers(test.questions || []);
        this.testLoading.set(false);
        
        // Start timer
        this.startTimer();
      },
      error: (error) => {
        console.error('Error loading test:', error);
        this.snackBar.open('Error loading test', 'Close', { duration: 3000 });
        this.testLoading.set(false);
        this.router.navigate(['/']);
      }
    });
  }

  initializeAnswers(questions: any[]) {
    const answers = questions.map(() => ({
      selectedOption: null as number | null
    }));
    this.answers.set(answers);
  }

  startTimer() {
    this.stopTimer();
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

  // ============ Test Taking ============
  onOptionSelect(questionIndex: number, optionIndex: number) {
    const updatedAnswers = [...this.answers()];
    updatedAnswers[questionIndex].selectedOption = optionIndex;
    this.answers.set(updatedAnswers);
  }

  scrollToQuestion(index: number): void {
    this.activeQuestionIndex.set(index);
    const element = document.getElementById(`question-${index}`);
    if (element) {
      const container = document.querySelector('.questions-container');
      if (container) {
        const offset = 20;
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

  // ============ Submit Test ============
  // module-test/module-test.component.ts - Fix submitTest method

submitTest() {
  if (!this.userInfoForm.valid) {
    this.snackBar.open('Please complete your information first', 'Close', { duration: 3000 });
    return;
  }

  const unansweredQuestions = this.answers().filter(answer => answer.selectedOption === null);
  if (unansweredQuestions.length > 0) {
    const confirmSubmit = confirm(`You have ${unansweredQuestions.length} unanswered question(s). Do you want to submit anyway?`);
    if (!confirmSubmit) return;
  }

  this.submitting.set(true);
  this.stopTimer();

  const submissionData = {
    name: this.userInfoForm.value.name,
    email: this.userInfoForm.value.email,
    phone: this.userInfoForm.value.phone,
    answers: this.answers().map(answer => ({
      selectedOption: answer.selectedOption !== null ? answer.selectedOption : -1
    })),
    timeTaken: this.elapsedTime()
  };

  // Use moduleId instead of test ID
  this.moduleTestService.submitModuleTest(this.moduleId, submissionData).subscribe({
    next: (result: any) => {
      this.testResult.set(result);
      this.testCompleted.set(true);
      this.loadLeaderboard();
      this.submitting.set(false);
    },
    error: (error) => {
      console.error('Error submitting test:', error);
      this.snackBar.open(error.error?.message || 'Error submitting test', 'Close', { duration: 3000 });
      this.submitting.set(false);
    }
  });
}

  // ============ Leaderboard ============
  // loadLeaderboard() {
  //   this.moduleTestService.getModuleTestLeaderboard(this.currentTest()._id).subscribe({
  //     next: (result: LeaderboardResponse) => {
  //       this.leaderboard.set(result.leaderboard || []);
  //     },
  //     error: (error) => {
  //       console.error('Error loading leaderboard:', error);
  //     }
  //   });
  // }

  // module-test/module-test.component.ts - Fix viewLeaderboard method

viewLeaderboard(testId: string) {
  // Use moduleId instead of testId for the leaderboard
  this.moduleTestService.getModuleTestLeaderboard(this.moduleId).subscribe({
    next: (result: LeaderboardResponse) => {
      this.dialog.open(ModuleTestDialogComponent, {
        data: {
          leaderboard: result.leaderboard,
          testTitle: this.tests().find(t => t._id === testId)?.title || 'Test',
          totalParticipants: result.totalParticipants,
          currentUserEmail: this.userInfoForm.value.email
        }
      });
    },
    error: (error) => {
      console.error('Error loading leaderboard:', error);
      this.snackBar.open('Error loading leaderboard', 'Close', { duration: 3000 });
    }
  });
}

// Also fix loadLeaderboard method
loadLeaderboard() {
  // Use moduleId instead of test ID
  this.moduleTestService.getModuleTestLeaderboard(this.moduleId).subscribe({
    next: (result: LeaderboardResponse) => {
      this.leaderboard.set(result.leaderboard || []);
    },
    error: (error) => {
      console.error('Error loading leaderboard:', error);
    }
  });
}

  // ============ Navigation ============
  restartTest() {
    this.stopTimer();
    this.currentTest.set(null);
    this.testQuestions.set([]);
    this.testCompleted.set(false);
    this.testResult.set(null);
    this.leaderboard.set([]);
    this.answers.set([]);
    this.showUserInfoForm.set(false);
    this.userInfoForm.reset();
    this.elapsedTime.set(0);
    this.activeQuestionIndex.set(0);
    this.loadTests();
  }

  goBack() {
    this.stopTimer();
    this.router.navigate(['/']);
  }

  // ============ Helper Methods ============
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
}