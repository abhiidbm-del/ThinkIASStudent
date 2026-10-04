// daw-evaluation.component.ts

import { Component, inject, signal, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';

import { AnswerWritingService } from '../../../shared/services/answer-writing.service';

interface EvaluationAnswer {
  index: number;
  questionId: string;
  questionText: string;
  answerPDF: string;
  language: string;
  evaluation: {
    evaluatedPDF: string;
    evaluatedAt: Date;
    evaluatedBy: {
      fullName: string;
      email: string;
    };
    remarks: string;
    score: number;
  } | null;
  isEvaluated: boolean;
}

interface EvaluationItem {
  submissionId: string;
  exercise: {
    _id: string;
    name: string;
    nameHi: string;
    description: string;
    descriptionHi: string;
    startDateTime: Date;
    endDateTime: Date;
  };
  submittedAt: Date;
  isLate: boolean;
  submissionLanguage: string;
  evaluatedAnswers: EvaluationAnswer[];
  modelAnswer: {
    remark: string;
    answerEnglish: string;
    answerHindi: string;
    modelAnswerPDF: string;
    modelAnswerPDFHi: string;
    isActive: boolean;
  } | null;
  evaluationCount: number;
  totalQuestions: number;
  allEvaluated: boolean;
}

@Component({
  selector: 'app-daw-evaluation',
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
    MatDialogModule,
    MatExpansionModule,
    MatDividerModule
  ],
  template: `
    <div class="daw-evaluation-container">
      
      <!-- Header -->
      <div class="header results-hero">
        <div class="header-content">
          <div class="header-left">
            <div class="hero-copy">
              <span class="eyebrow">ANSWER WRITING PROGRESS</span>
              <h1>{{ isHindiMode ? 'मूल्यांकन परिणाम' : 'Evaluation Results' }}</h1>
              <p class="header-subtitle">
                {{ isHindiMode ? 'अपने उत्तर लेखन के मूल्यांकन देखें' : 'View your answer writing evaluations' }}
              </p>
            </div>
          </div>
          <div class="header-actions">
            <div class="hero-mark" aria-hidden="true"><i class="fas fa-clipboard-check"></i></div>
            <div class="lang-toggle">
            <button class="lang-btn" [class.active]="!isHindiMode" (click)="toggleLanguage(false)">English</button>
            <button class="lang-btn" [class.active]="isHindiMode" (click)="toggleLanguage(true)">हिंदी</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="isLoading" class="loading-state">
        <mat-spinner diameter="40"></mat-spinner>
        <p>{{ isHindiMode ? 'लोड हो रहा...' : 'Loading...' }}</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!isLoading && evaluations().length === 0" class="empty-state">
        <mat-card>
          <mat-card-content>
            <div class="empty-content">
              <i class="fas fa-inbox empty-icon"></i>
              <h3>{{ isHindiMode ? 'कोई मूल्यांकन नहीं' : 'No Evaluations Found' }}</h3>
              <p class="text-muted">
                {{ isHindiMode ? 'आपके किसी भी उत्तर का अभी तक मूल्यांकन नहीं हुआ है।' : 'Your answers haven\'t been evaluated yet.' }}
              </p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Evaluations List -->
      <div *ngIf="!isLoading && evaluations().length > 0" class="evaluations-grid">
        <mat-card 
          *ngFor="let item of evaluations()" 
          class="evaluation-card"
          [class.fully-evaluated]="item.allEvaluated"
          [class.partially-evaluated]="!item.allEvaluated && item.evaluationCount > 0">
          
          <!-- Card Header -->
          <mat-card-header>
            <mat-card-title>
              <span class="exercise-title">
                {{ isHindiMode ? (item.exercise.nameHi || item.exercise.name) : item.exercise.name }}
              </span>
              <span class="evaluation-badge" [class.fully]="item.allEvaluated" [class.partial]="!item.allEvaluated && item.evaluationCount > 0">
                <i class="fas" [class.fa-check-circle]="item.allEvaluated" [class.fa-clock]="!item.allEvaluated"></i>
                {{ item.allEvaluated ? (isHindiMode ? 'पूर्ण' : 'Complete') : (isHindiMode ? 'आंशिक' : 'Partial') }}
              </span>
            </mat-card-title>
            <mat-card-subtitle>
              <i class="far fa-calendar-alt"></i>
              {{ isHindiMode ? 'जमा किया: ' : 'Submitted: ' }}
              {{ item.submittedAt | date:'MMM d, y, h:mm a' }}
              <span class="status-badge" [class.late]="item.isLate" [class.ontime]="!item.isLate">
                <i class="fas" [class.fa-clock]="item.isLate" [class.fa-check]="!item.isLate"></i>
                {{ item.isLate ? (isHindiMode ? 'देर से' : 'Late') : (isHindiMode ? 'समय पर' : 'On Time') }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>

          <!-- Card Content -->
          <mat-card-content>
            <div class="exercise-meta">
              <span class="meta-item">
                <i class="fas fa-question-circle"></i>
                {{ item.totalQuestions }} {{ isHindiMode ? 'प्रश्न' : 'Questions' }}
              </span>
              <span class="meta-item">
                <i class="fas fa-check-double"></i>
                {{ item.evaluationCount }} / {{ item.totalQuestions }} {{ isHindiMode ? 'मूल्यांकित' : 'Evaluated' }}
              </span>
              <span class="meta-item" *ngIf="item.modelAnswer">
                <i class="fas fa-file-alt"></i>
                {{ isHindiMode ? 'मॉडल उत्तर उपलब्ध' : 'Model Answer Available' }}
              </span>
            </div>

            <!-- Description -->
            <p class="exercise-description" *ngIf="item.exercise.description">
              {{ isHindiMode ? (item.exercise?.descriptionHi || item.exercise.description) : item.exercise.description }}
            </p>

            <!-- Progress Bar -->
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="(item.evaluationCount / item.totalQuestions) * 100"></div>
              </div>
              <span class="progress-text">{{ item.evaluationCount }}/{{ item.totalQuestions }}</span>
            </div>
          </mat-card-content>

          <!-- Card Actions -->
          <mat-card-actions align="end">
            <button mat-button color="primary" (click)="viewEvaluationDetails(item)">
              <i class="fas fa-eye"></i> 
              {{ isHindiMode ? 'विवरण देखें' : 'View Details' }}
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>

    <!-- Evaluation Details Modal -->
    <ng-template #evaluationDetailsModal>
      <div class="modal-container" *ngIf="selectedEvaluation">
        <div class="modal-header">
          <h2>
            <i class="fas fa-clipboard-check"></i>
            {{ isHindiMode ? (selectedEvaluation.exercise.nameHi || selectedEvaluation.exercise.name) : selectedEvaluation.exercise.name }}
          </h2>
          <button class="close-btn" (click)="closeEvaluationDetails()">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Exercise Info -->
          <div class="info-section">
            <div class="section-header">
              <i class="fas fa-info-circle"></i>
              <h3>{{ isHindiMode ? 'अभ्यास जानकारी' : 'Exercise Information' }}</h3>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">{{ isHindiMode ? 'जमा तिथि:' : 'Submitted:' }}</span>
                <span class="value">{{ selectedEvaluation.submittedAt | date:'MMM d, y, h:mm a' }}</span>
              </div>
              <div class="info-item">
                <span class="label">{{ isHindiMode ? 'भाषा:' : 'Language:' }}</span>
                <span class="value lang-badge" [class.hindi]="selectedEvaluation.submissionLanguage === 'hi'">
                  {{ selectedEvaluation.submissionLanguage === 'hi' ? 'हिंदी' : 'English' }}
                </span>
              </div>
              <div class="info-item">
                <span class="label">{{ isHindiMode ? 'स्थिति:' : 'Status:' }}</span>
                <span class="value status-badge" [class.late]="selectedEvaluation.isLate" [class.ontime]="!selectedEvaluation.isLate">
                  <i class="fas" [class.fa-clock]="selectedEvaluation.isLate" [class.fa-check]="!selectedEvaluation.isLate"></i>
                  {{ selectedEvaluation.isLate ? (isHindiMode ? 'देर से' : 'Late') : (isHindiMode ? 'समय पर' : 'On Time') }}
                </span>
              </div>
            </div>
          </div>

          <!-- Model Answer Section -->
          <div *ngIf="selectedEvaluation.modelAnswer" class="info-section model-answer-section">
            <div class="section-header">
              <i class="fas fa-file-alt"></i>
              <h3>{{ isHindiMode ? 'मॉडल उत्तर' : 'Model Answer' }}</h3>
              <span class="model-status-badge" [class.active]="selectedEvaluation.modelAnswer.isActive">
                <i class="fas" [class.fa-check-circle]="selectedEvaluation.modelAnswer.isActive" [class.fa-times-circle]="!selectedEvaluation.modelAnswer.isActive"></i>
                {{ selectedEvaluation.modelAnswer.isActive ? (isHindiMode ? 'सक्रिय' : 'Active') : (isHindiMode ? 'निष्क्रिय' : 'Inactive') }}
              </span>
            </div>
            
            <div class="model-content">
              <!-- Remark -->
              <div *ngIf="selectedEvaluation.modelAnswer.remark" class="model-remark">
                <strong>{{ isHindiMode ? 'टिप्पणी:' : 'Remark:' }}</strong>
                <p>{{ selectedEvaluation.modelAnswer.remark }}</p>
              </div>

              <!-- Model Answer English -->
              <div *ngIf="selectedEvaluation.modelAnswer.answerEnglish" class="model-answer-text">
                <strong>{{ isHindiMode ? 'उत्तर (अंग्रेजी):' : 'Answer (English):' }}</strong>
                <p>{{ selectedEvaluation.modelAnswer.answerEnglish }}</p>
              </div>

              <!-- Model Answer Hindi -->
              <div *ngIf="selectedEvaluation.modelAnswer.answerHindi" class="model-answer-text hindi">
                <strong>{{ isHindiMode ? 'उत्तर (हिंदी):' : 'Answer (Hindi):' }}</strong>
                <p>{{ selectedEvaluation.modelAnswer.answerHindi }}</p>
              </div>

              <!-- Model Answer PDF Links -->
              <div class="model-pdf-links" *ngIf="selectedEvaluation.modelAnswer.modelAnswerPDF || selectedEvaluation.modelAnswer.modelAnswerPDFHi">
                <a *ngIf="selectedEvaluation.modelAnswer.modelAnswerPDF" 
                   [href]="selectedEvaluation.modelAnswer.modelAnswerPDF" 
                   target="_blank" 
                   class="pdf-link english">
                  <i class="fas fa-file-pdf"></i> 
                  {{ isHindiMode ? 'मॉडल उत्तर PDF (अंग्रेजी)' : 'Model Answer PDF (English)' }}
                </a>
                <a *ngIf="selectedEvaluation.modelAnswer.modelAnswerPDFHi" 
                   [href]="selectedEvaluation.modelAnswer.modelAnswerPDFHi" 
                   target="_blank" 
                   class="pdf-link hindi">
                  <i class="fas fa-file-pdf"></i> 
                  {{ isHindiMode ? 'मॉडल उत्तर PDF (हिंदी)' : 'Model Answer PDF (Hindi)' }}
                </a>
              </div>
            </div>
          </div>

          <!-- Evaluated Answers Section -->
          <div class="info-section">
            <div class="section-header">
              <i class="fas fa-clipboard-check"></i>
              <h3>{{ isHindiMode ? 'मूल्यांकित उत्तर' : 'Evaluated Answers' }}</h3>
              <!-- <span class="evaluation-count">
                {{ selectedEvaluation.evaluationCount }} / {{ selectedEvaluation.totalQuestions }}
              </span> -->
            </div>

            <div class="answers-list">
              <div *ngFor="let answer of selectedEvaluation.evaluatedAnswers" class="answer-evaluation-card">
                <!-- <div class="answer-header">
                  <span class="question-number">{{ isHindiMode ? 'प्रश्न' : 'Q' }} {{ answer.index + 1 }}</span>
                  <span class="answer-language" [class.hindi]="answer.language === 'hi'">
                    {{ answer.language === 'hi' ? 'हिंदी' : 'English' }}
                  </span>
                </div> -->

                <div class="answer-content">
                  <!-- <p class="question-text">{{ answer.questionText }}</p> -->
                  
                  <div class="answer-actions">
                    <a [href]="answer.answerPDF" target="_blank" class="btn-view-answer">
                      <i class="fas fa-file-pdf"></i> 
                      {{ isHindiMode ? 'आपका उत्तर देखें' : 'View Your Answer' }}
                    </a>
                  </div>

                  <!-- Evaluation Result -->
                  <div *ngIf="answer.evaluation" class="evaluation-result">
                    <div class="evaluation-header">
                      <span class="evaluation-label">
                        <i class="fas fa-check-circle"></i>
                        {{ isHindiMode ? 'मूल्यांकन परिणाम' : 'Evaluation Result' }}
                      </span>
                      <span class="evaluation-date">
                        {{ answer.evaluation.evaluatedAt | date:'MMM d, y' }}
                      </span>
                    </div>

                    <!-- Score -->
                    <div *ngIf="answer.evaluation.score" class="score-display">
                      <span class="score-value">{{ answer.evaluation.score }}</span>
                      <span class="score-max">/ 100</span>
                    </div>

                    <!-- Remarks -->
                    <div *ngIf="answer.evaluation.remarks" class="remarks">
                      <strong>{{ isHindiMode ? 'टिप्पणी:' : 'Remarks:' }}</strong>
                      <p>{{ answer.evaluation.remarks }}</p>
                    </div>

                    <!-- Evaluated PDF -->
                    <div class="evaluated-pdf">
                      <a [href]="answer.evaluation.evaluatedPDF" target="_blank" class="btn-evaluated-pdf">
                        <i class="fas fa-file-pdf"></i>
                        {{ isHindiMode ? 'मूल्यांकित PDF देखें' : 'View Evaluated PDF' }}
                      </a>
                    </div>

                    <!-- Evaluated By -->
                    <div class="evaluated-by" *ngIf="answer.evaluation.evaluatedBy">
                      <i class="fas fa-user-check"></i>
                      {{ isHindiMode ? 'मूल्यांकनकर्ता:' : 'Evaluated by:' }}
                      {{ answer.evaluation.evaluatedBy.fullName || 'Admin' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button mat-button class="close-footer-btn" (click)="closeEvaluationDetails()">
            <i class="fas fa-times"></i> 
            {{ isHindiMode ? 'बंद करें' : 'Close' }}
          </button>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ['./daw-evaluation.component.css']
})
export class DawEvaluationComponent implements OnInit {
  @ViewChild('evaluationDetailsModal') evaluationDetailsModal!: TemplateRef<any>;

  private answerWritingService = inject(AnswerWritingService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  evaluations = signal<EvaluationItem[]>([]);
  isLoading = false;
  isHindiMode = false;
  selectedEvaluation: EvaluationItem | null = null;
  private detailsDialogRef: any;

  ngOnInit() {
    this.loadEvaluations();
  }

  toggleLanguage(isHindi: boolean) {
    this.isHindiMode = isHindi;
    this.loadEvaluations();
  }

  loadEvaluations() {
    this.isLoading = true;
    this.answerWritingService.getMyEvaluations(this.isHindiMode ? 'hi' : 'en').subscribe({
      next: (response) => {
        if (response.success) {
          this.evaluations.set(response.data);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.snackBar.open(
          this.isHindiMode ? 'मूल्यांकन लोड करने में विफल' : 'Failed to load evaluations',
          'Close',
          { duration: 3000 }
        );
        this.isLoading = false;
      }
    });
  }

  viewEvaluationDetails(item: EvaluationItem) {
    this.selectedEvaluation = item;
    this.detailsDialogRef = this.dialog.open(this.evaluationDetailsModal, {
      width: '750px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'evaluation-details-dialog',
      disableClose: true
    });
  }

  closeEvaluationDetails() {
    if (this.detailsDialogRef) {
      this.detailsDialogRef.close();
      this.detailsDialogRef = null;
      this.selectedEvaluation = null;
    }
  }
}