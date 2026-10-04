import { Component, inject, signal, OnInit, OnDestroy, computed, HostListener, ChangeDetectorRef } from '@angular/core';
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
import { firstValueFrom } from 'rxjs';
import { AutoSaveService } from '../../../../shared/services/auto-save.service';
import { DemoTestService } from '../../../../shared/services/demo-test.service';
import { DocumentVisibilityService } from '../../../../shared/services/document-visibility.service';
import { FullscreenService } from '../../../../shared/services/fullscreen.service';

@Component({
  selector: 'app-take-demo-test',
  standalone: true,
  imports: [
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
  templateUrl: './take-demo-test.component.html',
  styleUrl: './take-demo-test.component.css'
})
export class TakeDemoTestComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private demoTestService = inject(DemoTestService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private visibilityService = inject(DocumentVisibilityService);
  private autoSaveService = inject(AutoSaveService);
  private cdr = inject(ChangeDetectorRef);
  private fullscreenService = inject(FullscreenService);

  private fullscreenHandler = this.handleFullscreenChange.bind(this);

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

  testForm: FormGroup;
  timer: any;
  startTime: Date = new Date();
  selectedLanguage: 'english' | 'hindi' = 'english';

  // Dialog states
  showSubmitDialog = false;
  showResultsDialog = false;
  resultsMessage = '';
  isAutoSubmitted = false;
  submissionResult: any = null;

  // Prevent double submission
  isSubmitting = false;

  // Track component state
  private isInitialized = false;
  private destroyed = false;
  private testLoaded = false;

  // Subscription references
  private visibilitySubscription: any;
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

    this.testId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.testId) {
      this.router.navigate(['/demo-tests']);
      return;
    }

    this.setupEventListeners();
    this.loadTest();
  }

  setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Only listen for visibility changes (no auto-save)
    this.visibilitySubscription = this.visibilityService.visibilityChanged$.subscribe(isVisible => {
      console.log('Visibility changed to:', isVisible);
    });

    // Fullscreen change detection
    document.addEventListener('fullscreenchange', this.fullscreenHandler);
document.addEventListener('webkitfullscreenchange', this.fullscreenHandler);
  }

  async loadTest() {

    if (this.isTestSubmitted) {
    return;
  }

    if (this.testLoadSubscription) {
      this.testLoadSubscription.unsubscribe();
    }

    this.loading.set(true);

    try {
      // First check availability
      const availabilityCheck = await firstValueFrom(
        this.demoTestService.checkDemoTestAvailability(this.testId)
      );

      if (!availabilityCheck.canTake) {
        this.snackBar.open(availabilityCheck.reason || 'This test is not available', 'Close', { duration: 5000 });
        this.router.navigate(['/demo-tests']);
        return;
      }

      // Load the test
      const test = await firstValueFrom(
        this.demoTestService.getDemoTestById(this.testId)
      );

      if (this.destroyed) return;
      
      console.log('Demo test loaded successfully:', test);
      this.test.set(test);
      this.testDuration = test.duration * 60;
      this.initializeForm(test);
      
      // Start fresh - no saved progress
      this.timeLeft.set(this.testDuration);
      this.startTime = new Date();
      this.testLoaded = true;
      
      this.startTimer();
      
      // Enter fullscreen after test is loaded
      setTimeout(() => {
        this.enterFullscreen();
      }, 500);
      
    } catch (error: any) {
      console.error('Error loading demo test:', error);
      this.snackBar.open(error.message || 'Error loading test. Please try again.', 'Close', { duration: 4000 });
      
      if (this.fullscreenService.isFullscreen()) {
        this.fullscreenService.exitFullscreen();
      }
      
      this.router.navigate(['/demo-tests']);
    } finally {
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  }

  initializeForm(test: any) {
    const answerArray = this.answers;
    answerArray.clear();

    test.questions.forEach(() => {
      answerArray.push(this.fb.control(null));
    });
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
    
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        (elem as any).mozRequestFullScreen();
      } else if ((elem as any).msRequestFullscreen) {
        (elem as any).msRequestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen error:', err);
    }
    
    this.checkFullscreen();
  }

  exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        (document as any).msExitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  }

  checkFullscreen() {
    this.isFullscreen = !!(document.fullscreenElement || 
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement);
    
    this.showFullscreenWarning = !this.isFullscreen && !this.isTestSubmitted;
  }

  handleFullscreenChange() {
    if (this.destroyed) return;
    this.checkFullscreen();
  }

  // Timer Methods
  startTimer() {
    if (this.timer) clearInterval(this.timer);
    
    this.timer = setInterval(() => {
      if (this.destroyed || this.isTestSubmitted) {
        clearInterval(this.timer);
        return;
      }
      
      this.timeLeft.update(t => {
        const newTime = t - 1;
        if (newTime <= 0) {
          clearInterval(this.timer);
          this.autoSubmit();
          return 0;
        }
        return newTime;
      });

      this.cdr.detectChanges();
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
    if (this.isTestSubmitted || this.showSubmitDialog || this.showResultsDialog || this.destroyed || !this.testLoaded) return;

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
    localStorage.setItem('demo_test_language', this.selectedLanguage);
  }

  // Submission Methods
  showSubmitConfirmation() {
    if (!this.testLoaded || this.isTestSubmitted) return;
    this.showSubmitDialog = true;
  }

  closeSubmitDialog() {
    this.showSubmitDialog = false;
  }

  async confirmSubmit() {
    this.showSubmitDialog = false;
    
    // Small delay to allow dialog to close
    await new Promise(resolve => setTimeout(resolve, 300));
    
    this.submitTest();
  }

  async autoSubmit() {
    if (this.isTestSubmitted || this.isSubmitting || this.destroyed || !this.testLoaded) return;
    
    this.snackBar.open('Time\'s up! Auto-submitting...', 'Close', { duration: 3000 });
    
    // Small delay to show the message
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.submitTest(true);
  }

  async submitTest(isAutoSubmit: boolean = false) {
  console.log('submitTest called', { 
    isSubmitting: this.isSubmitting, 
    isTestSubmitted: this.isTestSubmitted,
    testLoaded: this.testLoaded,
    destroyed: this.destroyed
  });
  
  // Validation checks
  if (this.isTestSubmitted) {
    console.log('Test already submitted');
    return;
  }
  
  if (this.isSubmitting) {
    console.log('Already submitting');
    return;
  }
  
  if (this.destroyed) {
    console.log('Component destroyed');
    return;
  }
  
  if (!this.testLoaded || !this.test()) {
    console.log('Test not loaded');
    this.snackBar.open('Test not loaded properly', 'Close', { duration: 3000 });
    return;
  }
  
  // Set submitting state
  this.isSubmitting = true;
  this.isTestSubmitted = true;
  
  // Stop timer
  if (this.timer) {
    clearInterval(this.timer);
    this.timer = null;
  }
  
  // Disable form
  this.testForm.disable();
  
  // Calculate time taken
  const timeTaken = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  
  // Prepare submission data
  const answers = this.answers.value.map((option: number | null) => ({
    selectedOption: option !== null && option !== undefined ? option : -1
  }));
  
  const submission = {
    answers: answers,
    timeTaken: Math.min(timeTaken, this.testDuration) // Cap at test duration
  };
  
  console.log('Submitting demo test:', {
    testId: this.testId,
    answersCount: answers.length,
    timeTaken: timeTaken
  });
  
  try {
    // Make API call
    const result = await firstValueFrom(
      this.demoTestService.submitDemoTest(this.testId, submission)
    );
    
    console.log('Demo test submission successful:', result);
    
    if (this.destroyed) return;
    
    // Store the result
    this.submissionResult = result;
    
    // Clear any saved progress
    try {
      this.autoSaveService.clearProgress(`demo_${this.testId}`);
    } catch (e) {
      console.warn('Error clearing progress:', e);
    }
    
    // Set results data
    this.resultsMessage = isAutoSubmit 
      ? 'Practice test submitted automatically (Time\'s up)!'
      : 'Practice test submitted successfully!';
    
    this.isAutoSubmitted = isAutoSubmit;
    
    // Exit fullscreen
    this.exitFullscreen();
    
    if (this.timer) {
  clearInterval(this.timer);
}
    
    // Show success message
    this.snackBar.open('Test submitted successfully!', 'Close', { duration: 3000 });
    
    // Navigate to demo tests page after a short delay
    // setTimeout(() => {
    //   if (!this.destroyed) {
    //     this.router.navigate(['/demo-tests']);
    //   }
    // }, 2000);
    this.router.navigateByUrl('/demo-tests', { replaceUrl: true });
    
  } catch (error: any) {
    console.error('Demo test submission error:', error);
    
    if (this.destroyed) return;
    
    // Show error message
    const errorMessage = error?.error?.message || error?.message || 'Unknown error occurred';
    this.snackBar.open(`Error submitting test: ${errorMessage}`, 'Close', { duration: 5000 });
    
    // Reset states on error
    this.isSubmitting = false;
    this.isTestSubmitted = false;
    this.testForm.enable();
    
    // Restart timer
    this.startTimer();
    
  } finally {
    // Ensure submitting flag is reset if not already done
    if (!this.isTestSubmitted) {
      this.isSubmitting = false;
    }
    this.cdr.detectChanges();
  }
}

  // Results dialog methods
  getScoreColor(percentage: number): string {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#2196f3';
    if (percentage >= 40) return '#ff9800';
    return '#f44336';
  }

  viewDetailedResults() {
    if (this.submissionResult?.resultId) {
      this.router.navigate(['/demo-results', this.submissionResult.resultId]);
    } else {
      this.router.navigate(['/demo-results', this.testId]);
    }
  }

  goToDemoTests() {
    this.showResultsDialog = false;
    if (this.fullscreenService.isFullscreen()) {
      this.fullscreenService.exitFullscreen();
    }
    this.router.navigate(['/demo-tests']);
  }

  retakeTest() {
    this.showResultsDialog = false;
    if (this.fullscreenService.isFullscreen()) {
      this.fullscreenService.exitFullscreen();
    }
    
    // Clear any saved progress
    try {
      this.autoSaveService.clearProgress(`demo_${this.testId}`);
    } catch (e) {
      console.warn('Error clearing progress:', e);
    }
    
    // Navigate to the same test to retake
    window.location.href = `/take-demo-test/${this.testId}`;
  }

  // Cleanup method
  ngOnDestroy() {
    console.log('TakeDemoTestComponent destroying...');
    
    // Set destroyed flag
    this.destroyed = true;
    
    // Clear timer
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Unsubscribe from subscriptions
    if (this.visibilitySubscription) {
      this.visibilitySubscription.unsubscribe();
      this.visibilitySubscription = null;
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
    document.addEventListener('fullscreenchange', this.fullscreenHandler);
document.addEventListener('webkitfullscreenchange', this.fullscreenHandler);
    
    // DO NOT auto-save on destroy - we want fresh starts
  }
}