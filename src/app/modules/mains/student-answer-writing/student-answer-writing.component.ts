import { Component, inject, signal, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AnswerWritingService, AnswerWriting, AnswerSubmission } from '../../../shared/services/answer-writing.service';

@Component({
  selector: 'app-student-answer-writing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDialogModule
  ],
  template: `
    <div class="student-answer-writing">
      
      <div class="header">
  <div class="header-top">
    <div class="header-title">
      <h1>
        <i class="fas fa-pen-fancy"></i> 
        {{ isHindiMode ? 'मेन्स दैनिक उत्तर लेखन' : 'Mains Daily Answer Writing' }}
      </h1>
      <p>{{ isHindiMode ? 'UPSC मेन्स के लिए उत्तर लेखन का अभ्यास करें' : 'Practice answer writing for UPSC Mains' }}</p>
    </div>
    <div class="lang-toggle">
      <button class="lang-btn" [class.active]="!isHindiMode" (click)="toggleLanguage(false)">English</button>
      <button class="lang-btn" [class.active]="isHindiMode" (click)="toggleLanguage(true)">हिंदी</button>
    </div>
  </div>
</div>
      
      <mat-tab-group>
        <!--  ble Exercises Tab -->
        <mat-tab [label]="isHindiMode ? 'उपलब्ध अभ्यास' : 'Available Exercises'">
          <div class="tab-content">
            <div *ngIf="isLoading" class="loader">
              <div class="spinner"></div>
              <p>{{ isHindiMode ? 'लोड हो रहा...' : 'Loading...' }}</p>
            </div>

            <div *ngIf="!isLoading && availableExercises().length === 0" class="empty-state">
              <i class="fas fa-calendar-day"></i>
              <h3>{{ isHindiMode ? 'कोई अभ्यास उपलब्ध नहीं' : 'No Exercises Available' }}</h3>
            </div>

            <!-- Table View -->
            <div *ngIf="!isLoading && availableExercises().length > 0" class="table-container">
              <table class="exercise-table">
                <thead>
                  <tr>
                    <th>{{ isHindiMode ? 'अभ्यास का नाम' : 'Exercise Name' }}</th>
                    <th>{{ isHindiMode ? 'विवरण' : 'Description' }}</th>
                    <th>{{ isHindiMode ? 'तिथि' : 'Dates' }}</th>
                    <th>{{ isHindiMode ? 'स्थिति' : 'Status' }}</th>
                    <th>{{ isHindiMode ? 'कार्रवाई' : 'Actions' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let exercise of availableExercises()">
                    <td class="name-cell">
                      <strong>{{ isHindiMode ? (exercise.nameHi || exercise.name) : exercise.name }}</strong>
                    </td>
                    <td class="desc-cell">
                      {{ isHindiMode ? (exercise.descriptionHi || exercise.description) : exercise.description | slice:0:60 }}{{ (isHindiMode ? (exercise.descriptionHi || exercise.description) : exercise.description).length > 60 ? '...' : '' }}
                    </td>
                    <td class="date-cell">
                      <div class="date-info">
                        <span><i class="fas fa-calendar-alt"></i> {{ exercise.startDateTime | date:'dd MMM yyyy' }}</span>
                        <span><i class="fas fa-arrow-right"></i></span>
                        <span><i class="fas fa-calendar-check"></i> {{ exercise.endDateTime | date:'dd MMM yyyy' }}</span>
                      </div>
                    </td>
                    <td class="status-cell">
                      <span class="status-badge" [class.available]="exercise.isAvailable && exercise.status !== 'submitted'"
                            [class.submitted]="exercise.status === 'submitted'"
                            [class.upcoming]="exercise.isUpcoming"
                            [class.expired]="exercise.isExpired">
                        <i class="fas" [class.fa-check-circle]="exercise.isAvailable && exercise.status !== 'submitted'"
                           [class.fa-check-double]="exercise.status === 'submitted'"
                           [class.fa-clock]="exercise.isUpcoming"
                           [class.fa-ban]="exercise.isExpired"></i>
                        {{ getStatusText(exercise) }}
                      </span>
                    </td>
                    <td class="actions-cell">
  <div *ngIf="canSubmit(exercise)" class="action-buttons">
    <button class="icon-btn view-btn" 
            *ngIf="canViewQuestions(exercise)"
            (click)="viewQuestions(exercise)" 
            [title]="isHindiMode ? 'प्रश्न देखें' : 'View Questions'">
      <i class="fas fa-eye"></i>
    </button>
    <button class="icon-btn download-btn" 
            *ngIf="canDownloadPaper(exercise)"
            (click)="downloadQuestionPaper(exercise)" 
            [title]="isHindiMode ? 'प्रश्न पत्र डाउनलोड करें' : 'Download Paper'">
      <i class="fas fa-download"></i>
    </button>
    <button class="icon-btn submit-btn" 
            (click)="openSubmissionModal(exercise)" 
            [title]="isHindiMode ? 'उत्तर जमा करें' : 'Submit Answer'">
      <i class="fas fa-upload"></i>
    </button>
  </div>
  <div *ngIf="exercise.status === 'submitted'" class="submitted-text">
    <i class="fas fa-check-circle"></i> {{ isHindiMode ? 'जमा किया' : 'Submitted' }}
  </div>
  <div *ngIf="exercise.isUpcoming" class="upcoming-text">
    <i class="fas fa-hourglass-half"></i> {{ getUpcomingMessage(exercise) }}
  </div>
  <div *ngIf="exercise.isExpired" class="expired-text">
    <i class="fas fa-ban"></i> {{ isHindiMode ? 'समाप्त' : 'Expired' }}
  </div>
</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>

        <!-- My Submissions Tab -->
        <mat-tab [label]="isHindiMode ? 'मेरे सबमिशन' : 'My Submissions'">
          <div class="tab-content">
            <div *ngIf="isLoadingSubmissions" class="loader">
              <div class="spinner"></div>
              <p>{{ isHindiMode ? 'लोड हो रहा...' : 'Loading...' }}</p>
            </div>
            <div *ngIf="!isLoadingSubmissions && mySubmissions().length === 0" class="empty-state">
              <i class="fas fa-folder-open"></i>
              <h3>{{ isHindiMode ? 'कोई सबमिशन नहीं' : 'No Submissions' }}</h3>
              <button class="btn-primary" (click)="switchToAvailableTab()">{{ isHindiMode ? 'अभ्यास देखें' : 'Browse Exercises' }}</button>
            </div>
            <div *ngIf="!isLoadingSubmissions && mySubmissions().length > 0" class="table-container">
              <table class="submission-table">
                <thead>
                  <tr>
                    <th>{{ isHindiMode ? 'अभ्यास का नाम' : 'Exercise Name' }}</th>
                    <th>{{ isHindiMode ? 'जमा तिथि' : 'Submitted On' }}</th>
                    <th>{{ isHindiMode ? 'भाषा' : 'Language' }}</th>
                    <!-- <th>{{ isHindiMode ? 'स्थिति' : 'Status' }}</th> -->
                    <th>{{ isHindiMode ? 'कार्रवाई' : 'Action' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let submission of mySubmissions()">
                    <td class="name-cell">
                      <strong>{{ isHindiMode ? (submission.answerWritingId?.nameHi || submission.answerWritingId?.name) : submission.answerWritingId?.name }}</strong>
                    </td>
                    <td>{{ submission.submittedAt | date:'dd MMM yyyy, hh:mm a' }}</td>
                    <td>
                      <span class="lang-badge" [class.hindi]="submission.submissionLanguage === 'hi'">
                        {{ submission.submissionLanguage === 'hi' ? 'हिंदी' : 'English' }}
                      </span>
                    </td>
                    <!-- <td>
                      <span class="status-badge" [class.late]="submission.isLate" [class.ontime]="!submission.isLate">
                        {{ submission.isLate ? (isHindiMode ? 'देर से' : 'Late') : (isHindiMode ? 'समय पर' : 'On Time') }}
                      </span>
                    </td> -->
                    <td>
                      <button class="icon-btn view-submit-btn" (click)="viewSubmissionDetails(submission)" [title]="isHindiMode ? 'विवरण देखें' : 'View Details'">
                        <i class="fas fa-eye"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>

     <!-- Submission Details Modal -->
    <ng-template #submissionDetailsModal>
      <div class="modal-container" *ngIf="selectedSubmission">
        <div class="modal-header">
          <h2>{{ isHindiMode ? (selectedSubmission.answerWritingId?.nameHi || selectedSubmission.answerWritingId?.name) : selectedSubmission.answerWritingId?.name }}</h2>
          <button class="close-btn" (click)="closeSubmissionDetailsModal()">×</button>
        </div>
        <div class="modal-body">
          <!-- Description -->
          <div class="info-section">
            <h4>{{ isHindiMode ? 'विवरण:' : 'Description:' }}</h4>
            <p>{{ isHindiMode ? (selectedSubmission.answerWritingId?.descriptionHi || selectedSubmission.answerWritingId?.description) : selectedSubmission.answerWritingId?.description }}</p>
          </div>

          <!-- Questions and Answers -->
          <div class="info-section">
            <h4>{{ isHindiMode ? 'प्रश्न और उत्तर:' : 'Questions and Answers:' }}</h4>
            <div *ngFor="let answer of selectedSubmission.answers; let i = index" class="qa-item">
              <div class="question-box">
                <strong>{{ isHindiMode ? 'प्रश्न' : 'Q' }} {{ i + 1 }}:</strong>
                <p>{{ getQuestionTextFromAnswer(answer, selectedSubmission.answerWritingId?.questions) }}</p>
              </div>
              <div class="answer-box">
                <strong>{{ isHindiMode ? 'आपका उत्तर:' : 'Your Answer:' }}</strong>
                <div class="answer-actions">
                  <a [href]="answer.answerPDF" target="_blank" class="download-link" download>
                    <i class="fas fa-file-pdf"></i> 
                    {{ isHindiMode ? 'उत्तर PDF देखें' : 'View Answer PDF' }}
                  </a>
                  <!-- <a [href]="answer.answerPDF" download class="download-link">
                    <i class="fas fa-download"></i> 
                    {{ isHindiMode ? 'डाउनलोड करें' : 'Download' }}
                  </a> -->
                </div>
              </div>
            </div>
          </div>

          <!-- Submission Info -->
          <div class="info-section">
            <h4>{{ isHindiMode ? 'सबमिशन जानकारी:' : 'Submission Info:' }}</h4>
            <div class="info-grid">
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'जमा तिथि:' : 'Submitted On:' }}</span>
                <span>{{ selectedSubmission.submittedAt | date:'dd MMM yyyy, hh:mm a' }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'भाषा:' : 'Language:' }}</span>
                <span>{{ selectedSubmission.submissionLanguage === 'hi' ? 'हिंदी' : 'English' }}</span>
              </div>
              
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="closeSubmissionDetailsModal()">{{ isHindiMode ? 'बंद करें' : 'Close' }}</button>
        </div>
      </div>
    </ng-template>


    <!-- Submission Modal -->
    <!-- Submission Modal -->
<ng-template #submissionModal>
  <div class="modal-container">
    <div class="modal-header">
      <h2>{{ selectedExercise?.name }}/{{ selectedExercise?.nameHi }}</h2>
      <button class="close-btn" (click)="closeSubmissionModal()">×</button>
    </div>
    <div class="modal-body">
      
      <!-- Instruction Message - Visible in Both Languages -->
      <div class="instruction-message">
        <i class="fas fa-info-circle"></i>
        <div class="message-content">
          <p class="english-text">Please upload your answer PDF according to your language</p>
          <p class="hindi-text"> कृपया अपनी उत्तर भाषा के अनुसार PDF अपलोड करें</p>
        </div>
      </div>

      <!-- Language Selection Buttons - Hide when file is attached -->
      <div class="language-upload-buttons" *ngIf="!selectedFile">
        <button class="lang-upload-btn english-btn" (click)="selectAndUploadLanguage('en')">
          <i class="fas fa-language"></i>
          English PDF
        </button>
        <button class="lang-upload-btn hindi-btn" (click)="selectAndUploadLanguage('hi')">
          <i class="fas fa-language"></i>
          हिंदी PDF
        </button>
      </div>

      <!-- Upload Status - Show when file is attached -->
      <div *ngIf="selectedFile" class="uploaded-info">
        <i class="fas fa-file-pdf"></i>
        <span>{{ selectedFile.name }}</span>
        <span class="uploaded-language-badge" [class.english]="selectedLanguage === 'en'" [class.hindi]="selectedLanguage === 'hi'">
          {{ selectedLanguage === 'en' ? 'English' : 'हिंदी' }}
        </span>
        <button type="button" (click)="removeSelectedFile()" class="remove-file-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Re-upload button (optional) - Show when file is attached -->
      <div class="reupload-section" *ngIf="selectedFile">
        <button class="btn-reupload" (click)="reuploadFile()">
          <i class="fas fa-sync-alt"></i>
          {{ isHindiMode ? 'दूसरी भाषा में अपलोड करें' : 'Upload in different language' }}
        </button>
      </div>

      <!-- Submit Button -->
      <div class="modal-actions">
        <button class="btn-cancel" (click)="closeSubmissionModal()">{{ isHindiMode ? 'रद्द करें' : 'Cancel' }}</button>
        <button class="btn-submit-modal" (click)="submitSingleFileAnswer()" 
                [disabled]="!selectedFile || isSubmitting">
          {{ isSubmitting ? (isHindiMode ? 'जमा हो रहा...' : 'Submitting...') : (isHindiMode ? 'जमा करें' : 'Submit') }}
        </button>
      </div>
    </div>
  </div>
</ng-template>

    <!-- Questions Modal -->
    <ng-template #questionsDialog>
      <div class="modal-container">
        <div class="modal-header">
          <h2>{{ isHindiMode ? 'प्रश्न' : 'Questions' }}</h2>
          <button class="close-btn" (click)="closeQuestionsDialog()">×</button>
        </div>
        <div class="modal-body">
          <div *ngFor="let q of currentQuestions; let i = index" class="question-item-modal">
            <div class="q-num">{{ i + 1 }}.</div>
            <div class="q-text">{{ isHindiMode ? (q.questionTextHi || q.questionText) : q.questionText }}</div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ['./student-answer-writing.component.css']
})
export class StudentAnswerWritingComponent implements OnInit {
  @ViewChild('questionsDialog') questionsDialog!: TemplateRef<any>;
  @ViewChild('submissionModal') submissionModal!: TemplateRef<any>;
    @ViewChild('submissionDetailsModal') submissionDetailsModal!: TemplateRef<any>;
  
  private answerWritingService = inject(AnswerWritingService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  availableExercises = signal<AnswerWriting[]>([]);
  mySubmissions = signal<any[]>([]);
  isLoading = false;
  isLoadingSubmissions = false;
  isHindiMode = false;
  isSubmitting = false;
  selectedLanguage: string = '';
  selectedExercise: AnswerWriting | null = null;
  selectedFile: File | null = null;
  private submissionDialogRef: any;
    selectedSubmission: any = null;
  
  currentQuestions: any[] = [];
    private submissionDetailsDialogRef: any;
  private questionsDialogRef: any;

  ngOnInit() {
    this.loadAvailableExercises();
    this.loadMySubmissions();
  }

  toggleLanguage(isHindi: boolean) {
    this.isHindiMode = isHindi;
    this.loadAvailableExercises();
    this.loadMySubmissions();
  }

  // getStatusText(exercise: AnswerWriting): string {
  //   if (exercise.status === 'submitted') return this.isHindiMode ? 'जमा किया' : 'Submitted';
  //   if (exercise.isAvailable) return this.isHindiMode ? 'उपलब्ध' : 'Available';
  //   if (exercise.isUpcoming) return this.isHindiMode ? 'आगामी' : 'Upcoming';
  //   if (exercise.isExpired) return this.isHindiMode ? 'समाप्त' : 'Expired';
  //   return '';
  // }

  loadAvailableExercises() {
    this.isLoading = true;
    this.answerWritingService.getAvailableExercises(this.isHindiMode ? 'hi' : 'en').subscribe({
      next: (res) => {
        if (res.success) {
          this.availableExercises.set(res.data);
        }
        this.isLoading = false;
      },
      error: () => {
        this.snackBar.open('Failed to load', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  loadMySubmissions() {
    this.isLoadingSubmissions = true;
    this.answerWritingService.getMySubmissions(this.isHindiMode ? 'hi' : 'en').subscribe({
      next: (res) => {
        if (res.success) this.mySubmissions.set(res.data);
        this.isLoadingSubmissions = false;
      },
      error: () => this.isLoadingSubmissions = false
    });
  }

  viewQuestions(exercise: AnswerWriting) {
    if (!exercise.isAvailable) {
      this.snackBar.open(this.isHindiMode ? 'अभ्यास अवधि में ही देख सकते हैं' : 'Only available during exercise period', 'Close', { duration: 3000 });
      return;
    }
    this.currentQuestions = exercise.questions || [];
    this.questionsDialogRef = this.dialog.open(this.questionsDialog, { 
      width: '500px', 
      panelClass: 'custom-dialog' 
    });
  }

  closeQuestionsDialog() { 
    if (this.questionsDialogRef) this.questionsDialogRef.close(); 
  }

  downloadQuestionPaper(exercise: AnswerWriting) {
    if (!exercise.isAvailable) {
      this.snackBar.open(this.isHindiMode ? 'अभ्यास अवधि में ही डाउनलोड कर सकते हैं' : 'Only available during exercise period', 'Close', { duration: 3000 });
      return;
    }
    const url = this.isHindiMode && exercise.questionPaperPDFHi ? exercise.questionPaperPDFHi : exercise.questionPaperPDF;
    if (url) window.open(url, '_blank');
    else this.snackBar.open(this.isHindiMode ? 'PDF उपलब्ध नहीं' : 'PDF not available', 'Close', { duration: 3000 });
  }

  openSubmissionModal(exercise: AnswerWriting) {
    this.selectedExercise = exercise;
    this.selectedFile = null;
    this.selectedLanguage = '';
    this.submissionDialogRef = this.dialog.open(this.submissionModal, { 
      width: '550px', 
      panelClass: 'custom-dialog',
      disableClose: true
    });
  }

  closeSubmissionModal() {
    if (this.submissionDialogRef) this.submissionDialogRef.close();
  }

  reuploadFile() {
  // Clear current file and language
  this.selectedFile = null;
  this.selectedLanguage = '';
  this.snackBar.open(this.isHindiMode ? 'नई फ़ाइल अपलोड कर सकते हैं' : 'You can upload a new file', 'Close', { duration: 2000 });
}

  selectAndUploadLanguage(language: string) {
    // If already have a file and trying to change language, prompt user
    if (this.selectedFile !== null && this.selectedLanguage !== language) {
      const confirmChange = confirm(this.isHindiMode 
        ? 'क्या आप भाषा बदलना चाहते हैं? यह मौजूदा फ़ाइल को हटा देगा।' 
        : 'Do you want to change language? This will remove the current file.');
      if (confirmChange) {
        this.selectedFile = null;
        this.selectedLanguage = '';
      } else {
        return;
      }
    }
    
    // Trigger file upload
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf';
    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file && file.type === 'application/pdf') {
        this.selectedFile = file;
        this.selectedLanguage = language;
        this.snackBar.open(`PDF (${language === 'en' ? 'English' : 'Hindi'}) selected: ${file.name}`, 'Close', { duration: 2000 });
      } else {
        this.snackBar.open(this.isHindiMode ? 'कृपया PDF फ़ाइल चुनें' : 'Please select PDF file', 'Close', { duration: 3000 });
      }
    };
    fileInput.click();
  }

  removeSelectedFile() {
    this.selectedFile = null;
    this.selectedLanguage = '';
    this.snackBar.open(this.isHindiMode ? 'फ़ाइल हटा दी गई' : 'File removed', 'Close', { duration: 1000 });
  }

  submitSingleFileAnswer() {
  if (!this.selectedFile || !this.selectedExercise || !this.selectedLanguage) {
    this.snackBar.open(this.isHindiMode ? 'कृपया PDF फ़ाइल चुनें' : 'Please select a PDF file', 'Close', { duration: 3000 });
    return;
  }

  this.isSubmitting = true;
  
  // Send file directly to backend for R2 upload
  this.answerWritingService.submitAnswers(
    this.selectedExercise._id, 
    this.selectedFile, 
    this.selectedLanguage
  ).subscribe({
    next: (res) => {
      this.snackBar.open(res.message, 'Close', { duration: 3000 });
      this.closeSubmissionModal();
      this.loadAvailableExercises();
      this.loadMySubmissions();
      this.isSubmitting = false;
    },
    error: (err) => {
      this.snackBar.open(err.error?.message || 'Failed', 'Close', { duration: 3000 });
      this.isSubmitting = false;
    }
  });
}

  // viewSubmissionDetails(submission: any) {
  //   this.router.navigate(['/student/answer-writing/submission', submission._id], { 
  //     queryParams: { lang: this.isHindiMode ? 'hi' : 'en' } 
  //   });
  // }

  switchToAvailableTab() {
    const tabs = document.querySelector('mat-tab-group') as any;
    if (tabs) tabs.selectedIndex = 0;
  }

  getStatusText(exercise: any): string {
  if (exercise.status === 'submitted') return this.isHindiMode ? 'जमा किया' : 'Submitted';
  if (exercise.isAvailable) return this.isHindiMode ? 'उपलब्ध' : 'Available';
  if (exercise.isUpcoming) return this.isHindiMode ? 'आगामी' : 'Upcoming';
  if (exercise.isExpired) return this.isHindiMode ? 'समाप्त' : 'Expired';
  return '';
}

// Check if action buttons should be shown
canSubmit(exercise: any): boolean {
  return exercise.isAvailable && exercise.status !== 'submitted';
}

// Check if questions can be viewed
canViewQuestions(exercise: any): boolean {
  return exercise.isAvailable && exercise.questions && exercise.questions.length > 0;
}

// Check if paper can be downloaded
canDownloadPaper(exercise: any): boolean {
  return exercise.isAvailable && (exercise.questionPaperPDF || exercise.questionPaperPDFHi);
}

getUpcomingMessage(exercise: any): string {
  const startDate = new Date(exercise.startDateTime);
  const formattedDate = startDate.toLocaleDateString(this.isHindiMode ? 'hi-IN' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  return this.isHindiMode ? `आरंभ: ${formattedDate}` : `Starts: ${formattedDate}`;
}

  viewSubmissionDetails(submission: any) {
    this.selectedSubmission = submission;
    this.submissionDetailsDialogRef = this.dialog.open(this.submissionDetailsModal, { 
      width: '700px', 
      panelClass: 'custom-dialog',
      disableClose: true
    });
  }

  closeSubmissionDetailsModal() {
    if (this.submissionDetailsDialogRef) this.submissionDetailsDialogRef.close();
    this.selectedSubmission = null;
  }

  getQuestionTextFromAnswer(answer: any, questions: any[]): string {
  console.log('Answer:', answer);
  console.log('Questions:', questions);
  
  if (!questions || questions.length === 0) {
    return this.isHindiMode ? 'प्रश्न उपलब्ध नहीं' : 'Question not available';
  }
  
  // Try to find by exact match first
  let question = questions.find(q => q._id === answer.questionId);
  
  // If not found and answer.questionId is actually the exercise._id, take the first question
  if (!question && answer.questionId) {
    // Check if the questionId matches any exercise ID (fallback for old data)
    question = questions[0];
  }
  
  if (question) {
    return this.isHindiMode ? (question.questionTextHi || question.questionText) : question.questionText;
  }
  
  return this.isHindiMode ? 'प्रश्न नहीं मिला' : 'Question not found';
}
}