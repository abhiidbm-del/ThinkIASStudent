import { Component, inject, signal, OnInit, OnDestroy, AfterViewInit, computed, HostListener, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, FormControl, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';

import { TestService } from '../../../shared/services/test.service';
import { DocumentVisibilityService } from '../../../shared/services/document-visibility.service';
import { AutoSaveService } from '../../../shared/services/auto-save.service';
import { FullscreenService } from '../../../shared/services/fullscreen.service';
import { ProctoringService } from '../../../shared/services/proctoring.service';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { LanguageService } from '../../../shared/i18n/language.service';

@Component({
  selector: 'app-take-test',
  standalone: true,
  imports: [
    TranslatePipe,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatRadioModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatDialogModule
  ],
  templateUrl: './take-test.component.html',
  styleUrl: './take-test.component.css'
})
export class TakeTestComponent implements OnInit, OnDestroy, AfterViewInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private testService = inject(TestService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private visibilityService = inject(DocumentVisibilityService);
  private autoSaveService = inject(AutoSaveService);
  private elementRef = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private fullscreenService = inject(FullscreenService);
  proctoring = inject(ProctoringService);
  readonly language = inject(LanguageService);
  @ViewChild('proctorPreview') proctorPreview!: ElementRef<HTMLVideoElement>;
  proctorMessage = signal('Camera recording is not active.');
  

  test = signal<any>(null);
  loading = signal(false);
  timeLeft = signal(0);
  currentQuestionIndex = signal(0);
  reviewQuestions = signal<number[]>([]);
  isTestSubmitted = false;
  testDuration = 0;
  testId: string = '';

  // Fullscreen state
  isFullscreen = false;
  showFullscreenWarning = false;

  // Settings
  readonly autoSaveInterval = 30000; // 30 seconds

  testForm: FormGroup;
  timer: any;
  countdownTimer: any;
  countdownLabel = signal('');
  startTime: Date = new Date();
  selectedLanguage: 'english' | 'hindi' = localStorage.getItem('preferredLanguage') === 'hi' ? 'hindi' : 'english';

  // Custom dialog state
  showSubmitDialog = false;
  
  // Results dialog state
  showResultsDialog = false;
  resultsMessage = '';
  isAutoSubmitted = false;
  submissionResult: any = null;

  // Prevent double submission
  isSubmitting = false;

  // Track if component is initialized
  private isInitialized = false;
  private destroyed = false;

  // Listeners
  private visibilitySubscription: any;
  private autoSaveSubscription: any;

  // Subscription references
  private testLoadSubscription: any;
  private testSubmitSubscription: any;

  // Computed properties
  currentQuestion = computed(() => {
    const testData = this.test();
    const index = this.currentQuestionIndex();
    return testData && testData.questions ? testData.questions[index] : null;
  });

  constructor() {
    this.testForm = this.fb.group({
      answers: this.fb.array([])
    });
  }

  ngOnInit() {
    console.log('TakeTestComponent ngOnInit called');
    
    // Prevent double initialization
    if (this.isInitialized) {
      console.log('Component already initialized, skipping...');
      return;
    }
    
    // Get test ID from route parameters
    this.route.paramMap.subscribe(params => {
      this.testId = params.get('id') || '';
      if (this.testId) {
        console.log('Loading test with ID:', this.testId);
        this.loadTest(this.testId);
        this.setupEventListeners();
        // Enter fullscreen immediately
        this.enterFullscreen();
        this.isInitialized = true;
      } else {
        console.error('No test ID found in route parameters');
        this.snackBar.open('Test ID not found!', 'Close', { duration: 3000 });
        this.router.navigate(['/prelims-tests']);
      }
    });
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Listen for visibility changes only for state saving
    this.visibilitySubscription = this.visibilityService.visibilityChanged$.subscribe(isVisible => {
      console.log('Visibility changed to:', isVisible);
      if (!isVisible && !this.isTestSubmitted && !this.destroyed) {
        console.log('Page hidden - auto-saving');
        this.autoSave();
        this.proctoring.violation('tab_hidden');
      }
    });

    // Auto-save interval
    this.autoSaveSubscription = setInterval(() => {
      if (this.test() && !this.isTestSubmitted && !this.destroyed) {
        this.autoSave();
      }
    }, this.autoSaveInterval);

    // Fullscreen change detection
    document.addEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    
    // Setup direct window listeners
    this.setupDirectWindowListeners();
  }

  // Setup direct window listeners for auto-save only
  setupDirectWindowListeners() {
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));
    
    // Also listen for beforeunload to auto-save before refresh/close
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
  }

  private handleWindowBlur(event: FocusEvent) {
    if (this.isTestSubmitted || this.destroyed) return;
    
    console.log('Window blur event - auto-saving');
    this.autoSave();
    this.proctoring.violation('window_blur');
  }

  ngAfterViewInit(): void {
    // Monitoring starts from the consent button once the async test preview exists.
  }

  async enableProctoring() {
    if (!this.proctorPreview || this.proctoring.starting()) return;
    try {
      await this.proctoring.start(this.testId, this.proctorPreview.nativeElement);
      this.proctorMessage.set('Camera and recording active');
    } catch {
      this.proctorMessage.set('Camera permission denied. This event has been reported.');
    }
  }

  private handleWindowFocus(event: FocusEvent) {
    console.log('Window focus regained');
  }

  private handleBeforeUnload(event: BeforeUnloadEvent) {
    if (!this.isTestSubmitted && !this.destroyed) {
      console.log('Page is being refreshed/closed - auto-saving');
      this.autoSave();
    }
  }

  loadTest(testId: string) {
    // Cancel any existing load subscription
    if (this.testLoadSubscription) {
      this.testLoadSubscription.unsubscribe();
    }

    this.loading.set(true);

    this.testLoadSubscription = this.testService.getTestById(testId).subscribe({
      next: (test) => {
        if (this.destroyed) return;
        
        console.log('Test loaded successfully:', test);
        this.test.set(test);
        if ((test as any).waiting) {
          this.loading.set(false);
          this.startCountdown((test as any).startTime);
          this.cdr.detectChanges();
          return;
        }
        this.testDuration = test.duration * 60;
        this.initializeForm(test);
        
        // Load saved progress (without violations)
        this.loadSavedProgress(testId);
        
        this.startTimer();
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading test:', error);
        this.loading.set(false);
        
        // Show error message
        // this.snackBar.open('Error loading test. Please try again.', 'Close', { duration: 4000 });
        
        // Exit fullscreen if active
        if (this.fullscreenService.isFullscreen()) {
          this.fullscreenService.exitFullscreen();
        }
        
        // Navigate back to tests list
        this.router.navigate(['/prelims-tests']);
      }
    });
  }

  initializeForm(test: any) {
    const answerArray = this.answers;
    answerArray.clear();

    test.questions.forEach(() => {
      answerArray.push(this.fb.control(null));
    });
  }

  loadSavedProgress(testId: string) {
    const savedData = this.autoSaveService.loadProgress(testId);
    if (savedData) {
      // Load answers
      savedData.answers.forEach((answer: number, index: number) => {
        if (answer !== null && answer !== undefined) {
          this.answers.at(index).setValue(answer);
        }
      });
      
      // Load review questions
      if (savedData.reviewQuestions) {
        this.reviewQuestions.set(savedData.reviewQuestions);
      }
      
      // Load current question index
      if (savedData.currentQuestionIndex !== undefined) {
        this.currentQuestionIndex.set(savedData.currentQuestionIndex);
      }
      
      // Calculate time left based on saved start time
      if (savedData.startTime) {
        const elapsedSeconds = Math.floor((Date.now() - savedData.startTime) / 1000);
        const timeSpent = Math.min(elapsedSeconds, this.testDuration);
        const calculatedTimeLeft = Math.max(0, this.testDuration - timeSpent);
        
        this.timeLeft.set(calculatedTimeLeft);
        this.startTime = new Date(savedData.startTime);
        
        // Show notification about resumed time
        if (elapsedSeconds > 0) {
          const minutesLost = Math.floor(elapsedSeconds / 60);
          this.snackBar.open(
            `Test resumed. Time continued from previous session (${minutesLost} min elapsed).`,
            'OK',
            { duration: 5000 }
          );
        }
      } else {
        // Fresh start
        this.timeLeft.set(this.testDuration);
        this.startTime = new Date();
      }
      
      this.snackBar.open('Previous progress restored', 'OK', { duration: 3000 });
    } else {
      // No saved data, start fresh
      this.timeLeft.set(this.testDuration);
      this.startTime = new Date();
    }
  }

  autoSave() {
    if (this.isTestSubmitted || !this.test() || this.destroyed) return;

    const saveData = {
      testId: this.testId,
      answers: this.answers.value,
      reviewQuestions: this.reviewQuestions(),
      currentQuestionIndex: this.currentQuestionIndex(),
      startTime: this.startTime.getTime(),
      testDuration: this.testDuration,
      timestamp: Date.now()
    };

    this.autoSaveService.saveProgress(this.testId, saveData);
  }

  get answers(): FormArray {
    return this.testForm.get('answers') as FormArray;
  }

  getAnswerControl(index: number): FormControl {
    return this.answers.at(index) as FormControl;
  }

  // Fullscreen Methods
  enterFullscreen() {
    const elem = document.documentElement;
    
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.warn('Fullscreen error:', err);
      });
    } else if ((elem as any).webkitRequestFullscreen) {
      (elem as any).webkitRequestFullscreen();
    } else if ((elem as any).mozRequestFullScreen) {
      (elem as any).mozRequestFullScreen();
    } else if ((elem as any).msRequestFullscreen) {
      (elem as any).msRequestfullscreen();
    }
    
    this.checkFullscreen();
    
    if (!this.isFullscreen) {
      this.showFullscreenWarning = true;
    }
  }

  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  }

  checkFullscreen() {
    this.isFullscreen = !!(document.fullscreenElement || 
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement);
  }

  handleFullscreenChange() {
    if (this.destroyed) return;
    
    this.checkFullscreen();
    if (!this.isFullscreen && !this.isTestSubmitted) {
      this.showFullscreenWarning = true;
    } else {
      this.showFullscreenWarning = false;
    }
  }

  // Timer Methods
  startCountdown(startTime: string) {
    const tick = () => {
      const ms = Math.max(0, +new Date(startTime) - Date.now());
      const s = Math.floor(ms / 1000);
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      this.countdownLabel.set(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`);
      if (ms <= 0) {
        clearInterval(this.countdownTimer);
        this.loadTest(this.testId);
      }
    };
    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }

  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      if (this.destroyed) {
        clearInterval(this.timer);
        return;
      }
      
      this.timeLeft.update(t => {
        const newTime = t - 1;
        return newTime;
      });

      if (this.timeLeft() <= 0) {
        this.autoSubmit();
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Question Navigation
  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.update(i => i - 1);
    }
  }

  nextQuestion() {
    if (this.currentQuestionIndex() < this.test().questions.length - 1) {
      this.currentQuestionIndex.update(i => i + 1);
    }
  }

  goToQuestion(index: number) {
    if (index >= 0 && index < this.test().questions.length) {
      this.currentQuestionIndex.set(index);
    }
  }

  clearAnswer() {
    this.getAnswerControl(this.currentQuestionIndex()).setValue(null);
  }

  markForReview() {
    const currentIndex = this.currentQuestionIndex();
    const reviewQuestions = this.reviewQuestions();
    
    if (!reviewQuestions.includes(currentIndex)) {
      this.reviewQuestions.set([...reviewQuestions, currentIndex]);
      this.snackBar.open('Question marked for review', 'OK', { duration: 2000 });
    } else {
      this.reviewQuestions.set(reviewQuestions.filter(i => i !== currentIndex));
      this.snackBar.open('Review mark removed', 'OK', { duration: 2000 });
    }
  }

  isMarkedForReview(index: number): boolean {
    return this.reviewQuestions().includes(index);
  }

  saveAndNext() {
    this.nextQuestion();
  }

  // Statistics
  getAnsweredCount(): number {
    return this.answers.controls.filter(control => control.value !== null).length;
  }

  getNotAnsweredCount(): number {
    return this.answers.controls.filter(control => control.value === null).length;
  }

  getQuestionStatusClass(index: number): string {
    const isAnswered = this.answers.at(index).value !== null;
    const isMarkedForReview = this.reviewQuestions().includes(index);
    const isCurrent = index === this.currentQuestionIndex();
    
    if (isCurrent) {
      return 'current';
    } else if (isMarkedForReview) {
      return 'marked-review';
    } else if (isAnswered) {
      return 'answered';
    } else {
      return 'not-answered';
    }
  }

  // Keyboard Navigation
  @HostListener('window:keydown', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    if (this.isTestSubmitted || this.showSubmitDialog || this.showResultsDialog || this.destroyed) return;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.previousQuestion();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.nextQuestion();
        break;
      case ' ':
        event.preventDefault();
        this.markForReview();
        break;
      case '1':
      case '2':
      case '3':
      case '4':
        if (event.ctrlKey) {
          event.preventDefault();
          const optionIndex = parseInt(event.key) - 1;
          this.getAnswerControl(this.currentQuestionIndex()).setValue(optionIndex);
        }
        break;
    }
  }

  onLanguageChange() {
    this.language.set(this.selectedLanguage === 'hindi' ? 'hi' : 'en');
    localStorage.setItem('test_language', this.selectedLanguage);
  }

  // Submission Methods
  showSubmitConfirmation() {
    this.showSubmitDialog = true;
  }

  closeSubmitDialog() {
    this.showSubmitDialog = false;
  }

  confirmSubmit() {
    this.showSubmitDialog = false;
    this.submitTest();
  }

  autoSubmit() {
    if (this.isTestSubmitted || this.isSubmitting || this.destroyed) return;
    
    this.snackBar.open('Time\'s up! Auto-submitting...', 'Close', { duration: 5000 });
    this.submitTest(true);
  }

  submitTest(isAutoSubmit: boolean = false) {
    console.log('submitTest called, isSubmitting:', this.isSubmitting, 'isTestSubmitted:', this.isTestSubmitted);
    
    if (this.isTestSubmitted || this.isSubmitting || this.destroyed) {
      console.log('Submission blocked - already submitting or destroyed');
      return;
    }
    
    this.isSubmitting = true;
    
    // Stop timers
    if (this.timer) clearInterval(this.timer);
    
    // Disable form
    this.isTestSubmitted = true;
    this.testForm.disable();
    
    // Exit fullscreen
    this.exitFullscreen();
    
    const submission = {
      testId: this.testId,
      answers: this.answers.value.map((option: number) => ({
        selectedOption: option ?? -1
      })),
      reviewQuestions: this.reviewQuestions(),
      timeTaken: Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000),
      isAutoSubmit: isAutoSubmit,
      completedAt: new Date().toISOString()
    };
    
    console.log('Making API call to submit test...', submission);
    
    // Cancel any existing subscription
    if (this.testSubmitSubscription) {
      this.testSubmitSubscription.unsubscribe();
    }
    
    // Single subscription with take(1) to prevent duplicate calls
    this.testSubmitSubscription = this.testService.submitTest(this.testId, submission).subscribe({
      next: (result) => {
        console.log('Test submission successful:', result);
        
        if (this.destroyed) return;
        
        // Store the result
        this.submissionResult = result;
        this.proctoring.finish().catch(() => this.snackBar.open('Test submitted, but recording upload needs retry.', 'Close', { duration: 5000 }));
        
        // Clear saved progress
        this.autoSaveService.clearProgress(this.testId);
        
        // Set results data
        this.resultsMessage = isAutoSubmit 
          ? `Test submitted automatically (Time's up)!`
          : `Test submitted successfully!`;
        
        this.isAutoSubmitted = isAutoSubmit;
        
        // Reset submitting flag
        this.isSubmitting = false;
        
        // Force change detection
        this.cdr.detectChanges();

        // Leave the exam screen as soon as the single submission succeeds.
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Test submission error:', error);
        
        if (this.destroyed) return;
        
        this.snackBar.open('Error submitting test! ' + (error?.error?.message || ''), 'Close', { duration: 4000 });
        
        // Reset states on error
        this.isSubmitting = false;
        this.isTestSubmitted = false;
        this.testForm.enable();
        
        // Restart timer if error occurred
        this.startTimer();
        
        // Force change detection
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('Test submission complete');
      }
    });
  }

  // Results dialog methods
  closeResultsDialog() {
    this.showResultsDialog = false;
    if (this.fullscreenService.isFullscreen()) {
      this.fullscreenService.exitFullscreen();
    }
    this.router.navigate(['/dashboard']);
  }

  goToDashboard() {
    if (this.fullscreenService.isFullscreen()) {
      this.fullscreenService.exitFullscreen();
    }
    this.showResultsDialog = false;
    this.router.navigate(['/dashboard']);
  }

  // Cleanup method
  ngOnDestroy() {
    console.log('TakeTestComponent destroying...');
    
    // Set destroyed flag
    this.destroyed = true;
    if (!this.isTestSubmitted) this.proctoring.stopWithoutUpload();
    
    // Clear timers
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    // Unsubscribe from observables
    if (this.visibilitySubscription) {
      this.visibilitySubscription.unsubscribe();
      this.visibilitySubscription = null;
    }
    
    if (this.autoSaveSubscription) {
      clearInterval(this.autoSaveSubscription);
      this.autoSaveSubscription = null;
    }
    
    if (this.testLoadSubscription) {
      this.testLoadSubscription.unsubscribe();
      this.testLoadSubscription = null;
    }
    
    if (this.testSubmitSubscription) {
      this.testSubmitSubscription.unsubscribe();
      this.testSubmitSubscription = null;
    }
    
    // Remove event listeners
    window.removeEventListener('blur', this.handleWindowBlur.bind(this));
    window.removeEventListener('focus', this.handleWindowFocus.bind(this));
    window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange.bind(this));
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange.bind(this));
    
    // Auto-save on destroy
    if (!this.isTestSubmitted && this.test()) {
      this.autoSave();
    }
    
    // Reset initialization flag
    this.isInitialized = false;
  }
}
