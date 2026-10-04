import { SubmissionPdfComponent } from '../../../shared/components/submission-pdf/submission-pdf.component';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';

// live-test.component.ts
import { Component, inject, signal, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LiveTestService } from '../../../shared/services/live-test.service';
import { ProctoringService } from '../../../shared/services/proctoring.service';

// ============================================
// INTERFACES
// ============================================
export type TestStatus = 'available' | 'submitted' | 'upcoming' | 'expired' | 'in-progress';

export interface LiveTest {
  _id: string;
  title: string;
  titleHi?: string;
  type: 'Full-Length' | 'Sectional';
  subject: string;
  startDateTime: Date | string;
  endDateTime: Date | string;
  duration: number;
  description?: string;
  descriptionHi?: string;
  meetLink: string;
  isActive?: boolean;
  questionPaperPDF?: string;
  questionPaperPDFHi?: string;
  questions?: Question[];
  instructions?: string;
  status?: TestStatus;
  isAvailable?: boolean;
  isUpcoming?: boolean;
  isExpired?: boolean;
}

export interface Question {
  questionText: string;
  questionTextHi?: string;
  marks?: number;
}

export interface TestParticipation {
  _id: string;
  testId: LiveTest;
  joinedAt: Date | string;
  submittedAt?: Date | string; answerPDF?: string; answerPDFKey?: string; originalName?: string; status?: string;
  isLate: boolean;
}

@Component({
  selector: 'app-live-test',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatTabsModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  template: `
    <!-- ==========================================
    MAIN CONTAINER
    ========================================== -->
    <div class="student-live-test">
      <div *ngIf="proctoring.pendingRecording()" role="status">
        <p>{{ ((proctoring.uploading() ? 'Test finished. Saving screen recording...' : 'Your answer is submitted. Retry saving the recording before leaving this page.')) | t }}</p>
        <button class="btn-primary" [disabled]="proctoring.uploading()" (click)="retryRecording()">{{ 'Retry recording upload' | t }}</button>
      </div>
      
      <!-- ==========================================
      HEADER
      ========================================== -->
      <div class="header">
        <div class="header-top">
          <div class="header-title">
            <h1>
              <i class="fas fa-video"></i> 
              {{ isHindiMode ? 'लाइव टेस्ट' : 'Live Tests' }}
            </h1>
            <p>{{ isHindiMode ? 'UPSC मेन्स लाइव टेस्ट में शामिल हों' : 'Join UPSC Mains Live Test Sessions' }}</p>
          </div>
          <div class="lang-toggle">
            <button class="lang-btn" [class.active]="!isHindiMode" (click)="toggleLanguage(false)">English</button>
            <button class="lang-btn" [class.active]="isHindiMode" (click)="toggleLanguage(true)">हिंदी</button>
          </div>
        </div>
      </div>

      <!-- ==========================================
      TABS
      ========================================== -->
      <mat-tab-group>
        <!-- Available Tests Tab -->
        <mat-tab [label]="isHindiMode ? 'उपलब्ध टेस्ट' : 'Available Tests'">
          <div class="tab-content">
            
            <div class="test-list-filters"><input aria-label="Search Mains tests" placeholder="Search tests" [(ngModel)]="testSearch"><select aria-label="Filter Mains tests" [(ngModel)]="testFilter"><option value="all">All tests</option><option value="submitted">Completed</option><option value="not-started">Not started</option></select></div>
            <!-- Loading State -->
            <div *ngIf="isLoading" class="loader">
              <div class="spinner"></div>
              <p>{{ isHindiMode ? 'लोड हो रहा...' : 'Loading...' }}</p>
            </div>

            <!-- Empty State -->
            <div *ngIf="!isLoading && filteredTests.length === 0" class="empty-state">
              <i class="fas fa-video-slash empty-icon"></i>
              <h3>{{ isHindiMode ? 'कोई लाइव टेस्ट उपलब्ध नहीं' : 'No Live Tests Available' }}</h3>
              <p>{{ isHindiMode ? 'कृपया बाद में वापस आएं' : 'Please check back later' }}</p>
            </div>

            <!-- Tests Table -->
            <div *ngIf="!isLoading && filteredTests.length > 0" class="test-card-grid">
              
                  <article class="test-summary-card" *ngFor="let test of filteredTests">
                    <div class="name-cell">
                      <strong>{{ isHindiMode ? (test.titleHi || test.title) : test.title }}</strong>
                      <span class="test-type-badge" [class.full-length]="test.type === 'Full-Length'" [class.sectional]="test.type === 'Sectional'">
                        {{ test.type === 'Full-Length' ? (isHindiMode ? 'पूर्ण' : 'Full') : (isHindiMode ? 'अनुभागीय' : 'Sectional') }}
                      </span>
                    </div>
                    <div class="desc-cell">
                      {{ isHindiMode ? (test.descriptionHi || test.description || '—') : (test.description || '—') | slice:0:60 }}{{ (isHindiMode ? (test.descriptionHi || test.description || '') : (test.description || '')).length > 60 ? '...' : '' }}
                    </div>
                    <div class="date-cell">
                      <div class="date-info">
                        <span><i class="fas fa-calendar-alt"></i> {{ formatDate(test.startDateTime) }}</span>
                        <span><i class="fas fa-arrow-right"></i></span>
                        <span><i class="fas fa-calendar-check"></i> {{ formatDate(test.endDateTime) }}</span>
                      </div>
                      <div class="time-info">
                        <span><i class="far fa-clock"></i> {{ formatTime(test.startDateTime) }}</span>
                        <span><i class="fas fa-arrow-right"></i></span>
                        <span>{{ formatTime(test.endDateTime) }}</span>
                      </div>
                    </div>
                    <div class="status-cell">
                      <span class="status-badge" 
                            [class.available]="test.status === 'available'"
                            [class.in-progress]="test.status === 'in-progress'"
                            [class.submitted]="test.status === 'submitted'"
                            [class.upcoming]="test.status === 'upcoming'"
                            [class.expired]="test.status === 'expired'">
                        <i class="fas" 
                           [class.fa-check-circle]="test.status === 'available'"
                           [class.fa-play-circle]="test.status === 'in-progress'"
                           [class.fa-check-double]="test.status === 'submitted'"
                           [class.fa-clock]="test.status === 'upcoming'"
                           [class.fa-ban]="test.status === 'expired'"></i>
                        {{ getStatusText(test.status) }}
                      </span>
                    </div>
                    <div class="actions-cell">
                      <div *ngIf="test.status === 'available' || test.status === 'in-progress'" class="action-buttons">
                        <button class="icon-btn view-btn" 
                                (click)="viewTestDetails(test)" 
                                [title]="isHindiMode ? 'विवरण देखें' : 'View Details'">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button class="icon-btn join-btn" 
                                (click)="openLiveTest(test)" 
                                [title]="isHindiMode ? 'टेस्ट में शामिल हों' : 'Join Test'">
                          <i class="fas fa-video"></i>
                        </button>
                      </div>
                      <div *ngIf="test.status === 'submitted'" class="submitted-text">
                        <i class="fas fa-check-circle"></i> {{ isHindiMode ? 'जमा किया' : 'Submitted' }}
                      </div>
                      <div *ngIf="test.status === 'upcoming'" class="upcoming-text">
                        <i class="fas fa-hourglass-half"></i> {{ getUpcomingMessage(test) }} · {{ getFormattedTimeRemaining(test) }}
                      </div>
                      <div *ngIf="test.status === 'expired'" class="expired-text">
                        <i class="fas fa-ban"></i> {{ isHindiMode ? 'समाप्त' : 'Expired' }}
                      </div>
                    </div>
                  </article>
                
              
            </div>
          </div>
        </mat-tab>

        <!-- My Participation Tab -->
        <mat-tab [label]="isHindiMode ? 'मेरी भागीदारी' : 'My Participation'">
          <div class="tab-content">
            <div *ngIf="isLoadingParticipation" class="loader">
              <div class="spinner"></div>
              <p>{{ isHindiMode ? 'लोड हो रहा...' : 'Loading...' }}</p>
            </div>
            <div *ngIf="!isLoadingParticipation && myParticipations().length === 0" class="empty-state">
              <i class="fas fa-folder-open"></i>
              <h3>{{ isHindiMode ? 'कोई भागीदारी नहीं' : 'No Participation' }}</h3>
              <p>{{ isHindiMode ? 'आपने अभी तक किसी लाइव टेस्ट में भाग नहीं लिया है' : "You haven't participated in any live test yet" }}</p>
              <button class="btn-primary" (click)="switchToAvailableTab()">{{ isHindiMode ? 'उपलब्ध टेस्ट देखें' : 'Browse Tests' }}</button>
            </div>
            <div *ngIf="!isLoadingParticipation && myParticipations().length > 0" class="table-container">
              <table class="participation-table">
                <thead>
                  <tr>
                    <th>{{ isHindiMode ? 'टेस्ट का नाम' : 'Test Name' }}</th>
                    <th>{{ isHindiMode ? 'तिथि' : 'Date' }}</th>
                    <th>{{ isHindiMode ? 'स्थिति' : 'Status' }}</th>
                    <th>{{ isHindiMode ? 'कार्रवाई' : 'Action' }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let participation of myParticipations()">
                    <td class="name-cell">
                      <strong class="participation-title">{{ isHindiMode ? (participation.testId?.titleHi || participation.testId?.title) : participation.testId?.title }}</strong>
                      <span class="participation-original" *ngIf="participation.originalName">{{participation.originalName}}</span>
                      <button class="answer-sheet-btn" *ngIf="participation.answerPDF || participation.answerPDFKey" (click)="openSubmissionFile(participation._id)"><i class="fas fa-file-pdf"></i>{{ 'View answer sheet' | t }}</button>
                    </td>
                    <td>{{ (participation.submittedAt || participation.joinedAt) | date:'dd MMM yyyy, hh:mm a' }}</td>
                    <td>
                      <span class="status-badge" [class.ontime]="!participation.isLate" [class.late]="participation.isLate">
                        <i class="fas" [class.fa-check]="!participation.isLate" [class.fa-clock]="participation.isLate"></i>
                        {{ participation.isLate ? (isHindiMode ? 'देर से' : 'Late') : (isHindiMode ? 'समय पर' : 'On Time') }}
                      </span>
                    </td>
                    <td>
                      <button class="participation-details-btn" [disabled]="!participation.testId" (click)="viewParticipationDetails(participation)">
                        <i class="fas fa-eye"></i><span>{{ isHindiMode ? 'विवरण' : 'View details' }}</span>
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

    <!-- ==========================================
    TEST DETAILS MODAL
    ========================================== -->
    <ng-template #testDetailsModal>
      <div class="modal-container" *ngIf="selectedTestDetail">
        <div class="modal-header">
          <h2>{{ isHindiMode ? (selectedTestDetail.titleHi || selectedTestDetail.title) : selectedTestDetail.title }}</h2>
          <button class="close-btn" (click)="closeTestDetailsModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="info-section">
            <h4>{{ isHindiMode ? 'विवरण:' : 'Description:' }}</h4>
            <p>{{ isHindiMode ? (selectedTestDetail.descriptionHi || selectedTestDetail.description || '—') : (selectedTestDetail.description || '—') }}</p>
          </div>
          <div class="info-section">
            <h4>{{ isHindiMode ? 'टेस्ट जानकारी:' : 'Test Information:' }}</h4>
            <div class="info-grid">
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'प्रकार:' : 'Type:' }}</span>
                <span>{{ selectedTestDetail.type === 'Full-Length' ? (isHindiMode ? 'पूर्ण लंबाई' : 'Full-Length') : (isHindiMode ? 'अनुभागीय' : 'Sectional') }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'विषय:' : 'Subject:' }}</span>
                <span>{{ selectedTestDetail.subject }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'अवधि:' : 'Duration:' }}</span>
                <span>{{ selectedTestDetail.duration }} {{ isHindiMode ? 'मिनट' : 'minutes' }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'प्रारंभ:' : 'Start:' }}</span>
                <span>{{ formatDateTime(selectedTestDetail.startDateTime) }}</span>
              </div>
              <div class="info-row">
                <span class="label">{{ isHindiMode ? 'समाप्ति:' : 'End:' }}</span>
                <span>{{ formatDateTime(selectedTestDetail.endDateTime) }}</span>
              </div>
            </div>
          </div>
          <div class="info-section" *ngIf="selectedTestDetail.instructions">
            <h4>{{ isHindiMode ? 'निर्देश:' : 'Instructions:' }}</h4>
            <div class="instructions-box">
              <p>{{ selectedTestDetail.instructions }}</p>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="closeTestDetailsModal()">{{ isHindiMode ? 'बंद करें' : 'Close' }}</button>
        </div>
      </div>
    </ng-template>

    <!-- ==========================================
    LIVE TEST FLOW MODAL (EXISTING - UNCHANGED)
    ========================================== -->
    <ng-template #liveTestFlowModal>
      <div class="modal-container live-test-flow-container">
        <div class="modal-header">
          <h2>
            <i class="fas fa-video"></i> 
            {{ isHindiMode ? 'लाइव टेस्ट में शामिल हों' : 'Join Live Test' }}
          </h2>
          <button class="close-btn" (click)="closeLiveTestFlow()">×</button>
        </div>
        <div class="modal-body live-test-body">
          
          <!-- Step Indicator -->
          <div class="step-indicator">
            <div class="step-dot" [class.active]="flowStep >= 1" [class.done]="flowStep > 1">
              {{ flowStep > 1 ? '✓' : '1' }}
            </div>
            <div class="step-line" [class.done]="flowStep > 1"></div>
            <div class="step-dot" [class.active]="flowStep >= 2" [class.done]="flowStep > 2">
              {{ flowStep > 2 ? '✓' : '2' }}
            </div>
            <div class="step-line" [class.done]="flowStep > 2"></div>
            <div class="step-dot" [class.active]="flowStep >= 3" [class.done]="flowStep > 3">
              {{ flowStep > 3 ? '✓' : '3' }}
            </div>
          </div>

          <div class="step-labels">
            <span>{{ isHindiMode ? 'जानकारी' : 'Info' }}</span>
            <span>{{ isHindiMode ? 'कैमरा' : 'Camera' }}</span>
            <span>{{ isHindiMode ? 'शामिल हों' : 'Join' }}</span>
          </div>

          <!-- STEP 1 -->
          <div *ngIf="flowStep === 1">
            <div class="test-info-box">
              <h4 class="info-title">{{ isHindiMode ? (selectedTest?.titleHi || selectedTest?.title) : selectedTest?.title }}</h4>
              <div class="info-row-grid">
                <span class="info-item">📅 <strong>{{ formatDate(selectedTest?.startDateTime || '') }}</strong></span>
                <span class="info-item">🕐 <strong>{{ formatTime(selectedTest?.startDateTime || '') }}</strong></span>
                <span class="info-item">⏱ <strong>{{ selectedTest?.duration }} min</strong></span>
                <span class="info-item">📚 <strong>{{ selectedTest?.subject }}</strong></span>
              </div>
              <p *ngIf="selectedTest?.description" class="info-description">
                📋 {{ isHindiMode ? (selectedTest?.descriptionHi || selectedTest?.description) : selectedTest?.description }}
              </p>
            </div>

            <ul class="rules-list">
              <li>
                <span class="rule-icon">📸</span>
                {{ isHindiMode ? 'टेस्ट के दौरान कैमरा एक्सेस ' : 'Camera access is ' }}<strong class="highlight">{{ isHindiMode ? 'अनिवार्य' : 'mandatory' }}</strong>{{ isHindiMode ? ' है' : '' }}
              </li>
              <li>
                <span class="rule-icon">🔇</span>
                {{ isHindiMode ? 'टेस्ट के दौरान माइक्रोफोन ' : 'Keep microphone ' }}<strong>{{ isHindiMode ? 'म्यूट' : 'muted' }}</strong>{{ isHindiMode ? ' रखें' : '' }}
              </li>
              <li>
                <span class="rule-icon">📓</span>
                {{ isHindiMode ? 'अपनी उत्तर पुस्तिका और पेन तैयार रखें' : 'Keep your answer booklet and pens ready' }}
              </li>
              <li>
                <span class="rule-icon">💡</span>
                {{ isHindiMode ? 'अच्छी रोशनी सुनिश्चित करें — चेहरा स्पष्ट दिखना चाहिए' : 'Ensure good lighting — face must be clearly visible' }}
              </li>
              <li>
                <span class="rule-icon">🔕</span>
                {{ isHindiMode ? 'फोन को साइलेंट मोड पर रखें' : 'Put phone on silent mode' }}
              </li>
            </ul>

            <div class="continue-row">
              <button class="btn-primary continue-btn" (click)="goToFlowStep(2)">
                {{ isHindiMode ? 'कैमरा सेटअप पर जाएं →' : 'Go to Camera Setup →' }}
              </button>
            </div>
          </div>

          <!-- STEP 2 -->
          <div *ngIf="flowStep === 2">
            <div class="camera-zone" [class.active]="cameraActive">
              <div class="camera-placeholder" *ngIf="!cameraActive">
                <span class="camera-icon">📷</span>
                <p>{{ isHindiMode ? 'कैमरा स्टार्ट करें' : 'Start your camera' }}</p>
              </div>
              <div class="camera-sim" [class.show]="cameraActive">
                <div class="camera-avatar" *ngIf="!videoElement?.nativeElement?.srcObject">👤</div>
                <video #videoElement autoplay muted playsinline class="camera-video" *ngIf="cameraActive"></video>
              </div>
              <div class="camera-overlay">
                <span class="camera-dot" [class.active]="cameraActive"></span>
                <span class="camera-status">
                  {{ cameraActive ? (isHindiMode ? 'कैमरा सक्रिय' : 'Camera Active') : (isHindiMode ? 'कैमरा बंद' : 'Camera Offline') }}
                </span>
              </div>
            </div>

            <div class="camera-controls">
              <button class="btn-camera" (click)="toggleCamera()" [class.active]="cameraActive">
                {{ cameraActive ? (isHindiMode ? '⏹ कैमरा और स्क्रीन बंद करें' : '⏹ Stop Camera & Screen') : (isHindiMode ? '📹 कैमरा और स्क्रीन शेयर करें' : '📹 Start Camera & Share Test Screen') }}
              </button>
              <button class="btn-success" (click)="verifyCamera()" [disabled]="!cameraActive">
                ✅ {{ isHindiMode ? 'कैमरा और स्क्रीन ठीक हैं' : 'Camera & Screen OK' }} — {{ isHindiMode ? 'टेस्ट लिंक प्राप्त करें' : 'Get Test Link' }}
              </button>
              <button class="btn-outline" (click)="goToFlowStep(1)">← {{ isHindiMode ? 'वापस' : 'Back' }}</button>
            </div>

            <p class="privacy-note">
              🔒 {{ isHindiMode ? 'कैमरा और पोर्टल स्क्रीन अपने आप रिकॉर्ड होंगी। अनुमति एक बार दें — पोर्टल में कहीं भी जाएँ, रिकॉर्डिंग चलती रहेगी।' : 'Camera and this portal tab are recorded automatically. Allow once — recording continues anywhere you go in the portal.' }}
            </p>
          </div>

          <!-- STEP 3 - UPDATED WITH NEW BUTTON -->
          <div *ngIf="flowStep === 3" class="success-content">
            <span class="success-icon">✅</span>
            <h3 class="success-title">{{ isHindiMode ? 'सत्यापन पूर्ण!' : 'Verification Complete!' }}</h3>
            <p class="success-description">
              {{ isHindiMode ? 'कैमरा सक्रिय है। गूगल मीट सेशन में शामिल होने के लिए नीचे क्लिक करें।' : 'Camera is active. Click below to join the Google Meet session.' }}
              <strong class="highlight">{{ isHindiMode ? 'टेस्ट के दौरान कैमरा ऑन रखें।' : 'Keep camera ON throughout the test.' }}</strong>
            </p>

            <div class="meet-link-box" *ngIf="selectedTest?.meetLink">
              <span class="meet-label">🔗 {{ isHindiMode ? 'आपका गूगल मीट लिंक' : 'Your Google Meet Link' }}</span>
              <span class="meet-url">{{ selectedTest?.meetLink }}</span>
            </div>

            <!-- Action Buttons Row -->
            <div class="step-3-actions">
              <button class="btn-meet" (click)="joinMeet()">
                🎥 {{ isHindiMode ? 'अब गूगल मीट में शामिल हों' : 'Join Google Meet Now' }}
              </button>
              
              <button class="btn-go-live-test" (click)="openGoToLiveTestModal()">
                <i class="fas fa-external-link-alt"></i> 
                {{ isHindiMode ? 'लाइव टेस्ट पर जाएं' : 'Go to Live Test' }}
              </button>
            </div>

            <p class="privacy-note">
              📸 {{ isHindiMode ? 'कैमरा ऑन रखें' : 'Keep camera ON' }} &nbsp;•&nbsp; 
              📓 {{ isHindiMode ? 'पुस्तिका तैयार' : 'Booklet ready' }} &nbsp;•&nbsp; 
              ⏱ {{ selectedTest?.duration }} min
            </p>
          </div>
        </div>
      </div>
    </ng-template>

    <!-- ==========================================
    GO TO LIVE TEST DETAIL MODAL (NEW)
    ========================================== -->
    <ng-template #goToLiveTestDetailModal>
      <div class="modal-container go-live-test-detail-modal" *ngIf="selectedTest">
        <div class="modal-header">
          <h2><i class="fas fa-video"></i> {{ isHindiMode ? 'लाइव टेस्ट' : 'Live Test' }}</h2>
          <button class="close-btn" (click)="closeGoToLiveTestDetailModal()">×</button>
        </div>
        <div class="modal-body go-live-test-detail-body">
          
          <!-- Test Header -->
          <div class="detail-test-header">
            <h3>{{ isHindiMode ? (selectedTest.titleHi || selectedTest.title) : selectedTest.title }}</h3>
            <div class="detail-test-meta">
              <span class="meta-item"><i class="fas fa-book"></i> {{ selectedTest.subject }}</span>
              <span class="meta-item"><i class="fas fa-clock"></i> {{ selectedTest.duration }} {{ isHindiMode ? 'मिनट' : 'minutes' }}</span>
              <span class="status-badge" [class.available]="selectedTest.status === 'available'"
                    [class.in-progress]="selectedTest.status === 'in-progress'"
                    [class.upcoming]="selectedTest.status === 'upcoming'"
                    [class.expired]="selectedTest.status === 'expired'">
                <i class="fas" [class.fa-check-circle]="selectedTest.status === 'available'"
                   [class.fa-play-circle]="selectedTest.status === 'in-progress'"
                   [class.fa-clock]="selectedTest.status === 'upcoming'"
                   [class.fa-ban]="selectedTest.status === 'expired'"></i>
                {{ getStatusText(selectedTest.status) }}
              </span>
            </div>
          </div>

          <!-- Timer Section -->
          <div class="detail-timer-section" *ngIf="isTestActive(selectedTest) || isTestUpcoming(selectedTest)">
            <div class="detail-timer-display">
              <div class="detail-timer-icon"><i class="fas fa-hourglass-half"></i></div>
              <div class="detail-timer-content">
                <div class="detail-timer-label">{{ isTestActive(selectedTest) ? (isHindiMode ? 'शेष समय' : 'Time Remaining') : (isHindiMode ? 'टेस्ट शुरू होने में' : 'Test Starts In') }}</div>
                <div class="detail-timer-value">{{ getFormattedTimeRemaining(selectedTest) }}</div>
              </div>
            </div>
            <mat-progress-bar *ngIf="isTestActive(selectedTest)" mode="determinate" [value]="getTimeProgress(selectedTest)" color="primary"></mat-progress-bar>
          </div>

          <!-- Warning Messages -->
          <div class="detail-warning-messages" *ngIf="isTestActive(selectedTest)">
            <div class="warning warning-10min" *ngIf="showTenMinWarning(selectedTest)">
              <i class="fas fa-exclamation-triangle"></i> {{ isHindiMode ? '⚠️ केवल 10 मिनट शेष हैं! कृपया अपना उत्तर जल्दी जमा करें।' : '⚠️ Only 10 minutes remaining! Please submit your answers soon.' }}
            </div>
            <div class="warning warning-5min" *ngIf="showFiveMinWarning(selectedTest)">
              <i class="fas fa-exclamation-circle"></i> {{ isHindiMode ? '🚨 केवल 5 मिनट शेष हैं! कृपया अपना उत्तर तुरंत जमा करें।' : '🚨 Only 5 minutes remaining! Please submit your answers immediately.' }}
            </div>
          </div>

          <!-- Description -->
          <div class="detail-section" *ngIf="selectedTest.description">
            <h4>{{ isHindiMode ? 'विवरण' : 'Description' }}</h4>
            <p>{{ isHindiMode ? (selectedTest.descriptionHi || selectedTest.description) : selectedTest.description }}</p>
          </div>

          <!-- Instructions -->
          <div class="detail-section" *ngIf="selectedTest.instructions">
            <h4>{{ isHindiMode ? 'निर्देश' : 'Instructions' }}</h4>
            <p>{{ selectedTest.instructions }}</p>
          </div>

          <!-- Questions -->
          <div class="detail-section" *ngIf="selectedTest.questions && selectedTest.questions.length > 0">
            <h4>{{ isHindiMode ? 'प्रश्न' : 'Questions' }}</h4>
            <div class="detail-questions-list">
              <div *ngFor="let question of selectedTest.questions; let i = index" class="detail-question-item">
                <span class="detail-q-number">Q{{ i + 1 }}.</span>
                <div class="detail-q-text">
                  <p class="en">{{ question.questionText }}</p>
                  <p class="hi" *ngIf="question.questionTextHi">{{ question.questionTextHi }}</p>
                  <span class="marks" *ngIf="question.marks">{{ question.marks }} {{ isHindiMode ? 'अंक' : 'marks' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- PDF Download -->
          <div class="detail-section" *ngIf="selectedTest.questionPaperPDF || selectedTest.questionPaperPDFHi">
            <h4>{{ isHindiMode ? 'प्रश्न पत्र' : 'Question Papers' }}</h4>
            <div class="detail-pdf-buttons">
              <button class="pdf-btn english" (click)="downloadPDF(selectedTest, 'en')" *ngIf="selectedTest.questionPaperPDF">
                <i class="fas fa-file-pdf"></i> English PDF
              </button>
              <button class="pdf-btn hindi" (click)="downloadPDF(selectedTest, 'hi')" *ngIf="selectedTest.questionPaperPDFHi">
                <i class="fas fa-file-pdf"></i> हिंदी PDF
              </button>
            </div>
          </div>

          <!-- Upload Response -->
          <div class="detail-section upload-section-detail" *ngIf="canSubmit(selectedTest)">
            <h4>{{ isHindiMode ? 'उत्तर जमा करें' : 'Submit Answers' }}</h4>
            <div class="detail-upload-buttons">
              <button class="upload-btn english" (click)="openSubmissionModal(selectedTest, 'en')" [disabled]="isSubmitting">
                <i class="fas fa-upload"></i> {{ isHindiMode ? 'अंग्रेजी उत्तर जमा करें' : 'Submit English Answer' }}
              </button>
              <button class="upload-btn hindi" (click)="openSubmissionModal(selectedTest, 'hi')" [disabled]="isSubmitting">
                <i class="fas fa-upload"></i> {{ isHindiMode ? 'हिंदी उत्तर जमा करें' : 'Submit Hindi Answer' }}
              </button>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" (click)="closeGoToLiveTestDetailModal()">{{ isHindiMode ? 'बंद करें' : 'Close' }}</button>
        </div>
      </div>
    </ng-template>

    <!-- ==========================================
    SUBMISSION MODAL (NEW)
    ========================================== -->
    <ng-template #submissionModal>
      <div class="modal-container submission-modal-container">
        <div class="modal-header">
          <h2>{{ isHindiMode ? 'उत्तर जमा करें' : 'Submit Answer' }}</h2>
          <button class="close-btn" (click)="closeSubmissionModal()">×</button>
        </div>
        <div class="modal-body">
          <div class="submission-info">
            <div class="submission-test-name">
              <strong>{{ isHindiMode ? 'टेस्ट:' : 'Test:' }}</strong> {{ isHindiMode ? (selectedTest?.titleHi || selectedTest?.title) : selectedTest?.title }}
            </div>
            <div class="submission-language">
              <span class="lang-badge" [class.english]="selectedLanguage === 'en'" [class.hindi]="selectedLanguage === 'hi'">
                {{ selectedLanguage === 'en' ? 'English' : 'हिंदी' }}
              </span>
            </div>
          </div>
          <div class="instruction-message">
            <i class="fas fa-info-circle"></i>
            <p>{{ isHindiMode ? 'कृपया अपना उत्तर PDF फ़ाइल में अपलोड करें' : 'Please upload your answer as a PDF file' }}</p>
          </div>
          <div class="file-upload-area" (dragover)="$event.preventDefault()" (drop)="onFileDrop($event)">
            <input type="file" #fileInput accept=".pdf" (change)="onFileSelected($event)" style="display:none;">
            <div *ngIf="!selectedFile" class="file-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>{{ isHindiMode ? 'PDF फ़ाइल यहाँ ड्रैग करें या' : 'Drag & drop PDF file here or' }}</p>
              <button class="btn-browse" (click)="fileInput.click()">{{ isHindiMode ? 'ब्राउज़ करें' : 'Browse' }}</button>
              <span class="file-hint">{{ isHindiMode ? 'केवल PDF फ़ाइलें स्वीकार की जाती हैं' : 'Only PDF files are accepted' }}</span>
            </div>
            <div *ngIf="selectedFile" class="file-selected">
              <i class="fas fa-file-pdf"></i>
              <div class="file-info">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
              </div>
              <button class="btn-remove" (click)="removeSelectedFile()"><i class="fas fa-times"></i></button>
            </div>
          </div>
          <div class="submission-modal-actions">
            <button class="btn-cancel" (click)="closeSubmissionModal()">{{ isHindiMode ? 'रद्द करें' : 'Cancel' }}</button>
            <button class="btn-submit" (click)="submitAnswer()" [disabled]="!selectedFile || isSubmitting">
              <mat-spinner *ngIf="isSubmitting" diameter="20"></mat-spinner>
              <span *ngIf="!isSubmitting"><i class="fas fa-check"></i> {{ isHindiMode ? 'जमा करें' : 'Submit' }}</span>
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styleUrls: ['./live-test.component.css']
})
export class LiveTestComponent implements OnInit, OnDestroy {
  openSubmissionFile(submissionId: string) { this.dialog.open(SubmissionPdfComponent, {data:{submissionId},width:'95vw',maxWidth:'1100px'}); }
  testSearch='';testFilter='all';
  get filteredTests(){return this.availableTests().filter(test=>(this.testFilter==='all'||(this.testFilter==='submitted'?test.status==='submitted':test.status!=='submitted'))&&[test.title,test.titleHi,test.description].join(' ').toLowerCase().includes(this.testSearch.toLowerCase()));}

  // ============================================
  // VIEW CHILDREN
  // ============================================
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('testDetailsModal') testDetailsModal!: TemplateRef<any>;
  @ViewChild('liveTestFlowModal') liveTestFlowModal!: TemplateRef<any>;
  @ViewChild('goToLiveTestDetailModal') goToLiveTestDetailModal!: TemplateRef<any>;
  @ViewChild('submissionModal') submissionModal!: TemplateRef<any>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  // ============================================
  // INJECTED SERVICES
  // ============================================
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private liveTestService = inject(LiveTestService);
  readonly proctoring = inject(ProctoringService);

  // ============================================
  // SIGNALS
  // ============================================
  availableTests = signal<LiveTest[]>([]);
  myParticipations = signal<TestParticipation[]>([]);
  isLoading = false;
  isLoadingParticipation = false;
  get isHindiMode(): boolean { return localStorage.getItem('preferredLanguage') === 'hi'; }
  set isHindiMode(value: boolean) { localStorage.setItem('preferredLanguage', value ? 'hi' : 'en'); }

  // ============================================
  // FLOW STATE
  // ============================================
  selectedTest: LiveTest | null = null;
  selectedTestDetail: LiveTest | null = null;
  flowStep = 1;
  cameraActive = false;
  private mediaStream: MediaStream | null = null;
  private testDetailsDialogRef: any;
  private liveTestFlowRef: any;
  private goToLiveTestDetailRef: any;
  private submissionDialogRef: any;

  // ============================================
  // SUBMISSION STATE
  // ============================================
  selectedFile: File | null = null;
  selectedLanguage: string = '';
  isSubmitting = false;

  // ============================================
  // TIMER STATE
  // ============================================
  private timerInterval: any = null;
  private timeRemaining = 0;
  private totalDuration = 0;

  // ============================================
  // LIFECYCLE HOOKS
  // ============================================
  ngOnInit() {
    this.loadAvailableTests();
    this.loadMyParticipations();
  }

  loadMyParticipations() {
    this.isLoadingParticipation = true;
    this.liveTestService.getMyParticipations().subscribe({
      next: response => { this.myParticipations.set(response.data || []); this.isLoadingParticipation = false; },
      error: () => { this.isLoadingParticipation = false; }
    });
  }

  ngOnDestroy() {
    this.detachLocalCamera();
    this.clearTimer();
  }

  // ============================================
  // LANGUAGE TOGGLE
  // ============================================
  toggleLanguage(isHindi: boolean) {
    this.isHindiMode = isHindi;
    this.loadAvailableTests();
  }

  // ============================================
  // LOAD TESTS
  // ============================================
  loadAvailableTests() {
    this.isLoading = true;
    
    this.liveTestService.getAllStudentTests().subscribe({
      next: (response) => {
        if (response.success) {
          this.availableTests.set(response.data);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tests:', error);
        this.snackBar.open(
          this.isHindiMode ? 'टेस्ट लोड करने में त्रुटि' : 'Error loading tests',
          'Close',
          { duration: 3000 }
        );
        this.isLoading = false;
      }
    });
  }

  // ============================================
  // HELPERS
  // ============================================
  formatDate(date: Date | string): string {
    if (!date) return '—';
    try {
      const d = new Date(date);
      return d.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '—';
    }
  }

  formatTime(date: Date | string): string {
    if (!date) return '—';
    try {
      const d = new Date(date);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  formatDateTime(date: Date | string): string {
    if (!date) return '—';
    try {
      const d = new Date(date);
      return d.toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  }

  getStatusText(status?: TestStatus): string {
    if (!status) return '—';
    switch (status) {
      case 'available': return this.isHindiMode ? 'उपलब्ध' : 'Available';
      case 'in-progress': return this.isHindiMode ? 'चल रहा है' : 'In Progress';
      case 'submitted': return this.isHindiMode ? 'जमा किया' : 'Submitted';
      case 'upcoming': return this.isHindiMode ? 'आगामी' : 'Upcoming';
      case 'expired': return this.isHindiMode ? 'समाप्त' : 'Expired';
      default: return '—';
    }
  }

  getUpcomingMessage(test: LiveTest): string {
    const startDate = new Date(test.startDateTime);
    const formattedDate = startDate.toLocaleString(this.isHindiMode ? 'hi-IN' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return this.isHindiMode ? `आरंभ: ${formattedDate}` : `Starts: ${formattedDate}`;
  }

  canJoin(test: LiveTest): boolean {
    return test.status === 'available' || test.status === 'in-progress';
  }

  canSubmit(test: LiveTest): boolean {
    return test.status === 'available' || test.status === 'in-progress';
  }

  isTestActive(test: LiveTest): boolean {
    if (!test) return false;
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date((test as any).reopenUntil || test.endDateTime);
    if ((test as any).reopened || (test as any).reopenUntil) return now <= end;
    return now >= start && now <= end;
  }

  isTestUpcoming(test: LiveTest): boolean {
    if (!test) return false;
    const now = new Date();
    const start = new Date(test.startDateTime);
    return now < start;
  }

  // ============================================
  // TIMER FUNCTIONS
  // ============================================
  getTimeRemaining(test: LiveTest): number {
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date((test as any).reopenUntil || test.endDateTime);
    
    let remaining = 0;
    if (now < start) {
      remaining = (start.getTime() - now.getTime()) / 1000;
    } else if (now >= start && now <= end) {
      remaining = (end.getTime() - now.getTime()) / 1000;
    }
    return Math.max(0, remaining);
  }

  getFormattedTimeRemaining(test: LiveTest): string {
    const seconds = this.getTimeRemaining(test);
    if (seconds <= 0) return '00:00:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  getTimeProgress(test: LiveTest): number {
    const total = this.totalDuration || 1;
    if (total <= 0) return 0;
    const remaining = this.getTimeRemaining(test);
    const elapsed = total - remaining;
    return Math.min(100, (elapsed / total) * 100);
  }

  showTenMinWarning(test: LiveTest): boolean {
    const seconds = this.getTimeRemaining(test);
    const minutes = Math.floor(seconds / 60);
    return minutes === 10;
  }

  showFiveMinWarning(test: LiveTest): boolean {
    const seconds = this.getTimeRemaining(test);
    const minutes = Math.floor(seconds / 60);
    return minutes === 5;
  }

  startTimer(test: LiveTest) {
    this.clearTimer();
    const now = new Date();
    const start = new Date(test.startDateTime);
    const end = new Date((test as any).reopenUntil || test.endDateTime);

    if (now < start) {
      this.totalDuration = (start.getTime() - now.getTime()) / 1000;
    } else if (now >= start && now <= end) {
      this.totalDuration = (end.getTime() - now.getTime()) / 1000;
    } else {
      this.timeRemaining = 0;
      return;
    }

    this.timeRemaining = this.totalDuration;
    this.timerInterval = setInterval(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) {
        this.clearTimer();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ============================================
  // TEST DETAILS
  // ============================================
  viewTestDetails(test: LiveTest) {
    this.selectedTestDetail = test;
    this.testDetailsDialogRef = this.dialog.open(this.testDetailsModal, {
      width: '650px',
      panelClass: 'custom-dialog',
      disableClose: true
    });
  }

  closeTestDetailsModal() {
    if (this.testDetailsDialogRef) {
      this.testDetailsDialogRef.close();
      this.selectedTestDetail = null;
    }
  }

  // ============================================
  // OPEN LIVE TEST FLOW (EXISTING)
  // ============================================
  openLiveTest(test: LiveTest) {
    if (test.status !== 'available' && test.status !== 'in-progress') {
      this.snackBar.open(
        this.isHindiMode ? 'यह टेस्ट अभी उपलब्ध नहीं है' : 'This test is not currently available',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.selectedTest = test;
    this.flowStep = 1;
    this.cameraActive = this.proctoring.active() && this.proctoring.currentTestId === test._id;
    if (this.proctoring.active() && this.proctoring.currentTestId !== test._id) this.stopCamera();

    this.liveTestFlowRef = this.dialog.open(this.liveTestFlowModal, {
      width: 'min(550px, 96vw)',
      maxWidth: '96vw',
      panelClass: 'custom-dialog',
      disableClose: true
    });
  }

  closeLiveTestFlow() {
    if (this.isSubmitting) return;
    this.detachLocalCamera();
    if (this.liveTestFlowRef) {
      this.liveTestFlowRef.close();
    }
  }

  goToFlowStep(step: number) {
    this.flowStep = step;
    if (step === 2 && !this.proctoring.active() && !this.proctoring.starting()) {
      setTimeout(() => this.startCamera(), 120);
    }
  }

  // ============================================
  // GO TO LIVE TEST DETAIL MODAL (NEW)
  // ============================================
  openGoToLiveTestModal() {
    if (!this.selectedTest) return;
    if (!this.proctoring.active()) {
      this.snackBar.open(
        this.isHindiMode ? 'लाइव टेस्ट के लिए रिकॉर्डिंग चालू रखें।' : 'Keep exam recording on for the live test.',
        'Close',
        { duration: 5000 }
      );
      return;
    }
    
    this.startTimer(this.selectedTest);
    this.goToLiveTestDetailRef = this.dialog.open(this.goToLiveTestDetailModal, {
      width: 'min(750px, 96vw)',
      maxWidth: '96vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog',
      disableClose: true
    });
  }

  closeGoToLiveTestDetailModal() {
    this.clearTimer();
    if (this.goToLiveTestDetailRef) {
      this.goToLiveTestDetailRef.close();
      this.goToLiveTestDetailRef = null;
    }
  }

  downloadPDF(test: LiveTest, language: 'en' | 'hi') {
    const url = language === 'hi' ? test.questionPaperPDFHi : test.questionPaperPDF;
    if (url) {
      window.open(url, '_blank');
    } else {
      this.snackBar.open(
        this.isHindiMode ? 'PDF उपलब्ध नहीं' : 'PDF not available',
        'Close',
        { duration: 3000 }
      );
    }
  }

  // ============================================
  // SUBMISSION MODAL
  // ============================================
  openSubmissionModal(test: LiveTest, language: string) {
    if (!this.canSubmit(test)) {
      this.snackBar.open(
        this.isHindiMode ? 'आप इस टेस्ट के लिए उत्तर जमा नहीं कर सकते' : 'You cannot submit answers for this test',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.selectedTest = test;
    this.selectedLanguage = language;
    this.selectedFile = null;

    this.submissionDialogRef = this.dialog.open(this.submissionModal, {
      width: 'min(550px, 96vw)',
      maxWidth: '96vw',
      panelClass: 'custom-dialog',
      disableClose: true
    });
  }

  closeSubmissionModal() {
    if (this.isSubmitting) return;
    if (this.submissionDialogRef) {
      this.submissionDialogRef.close();
      this.submissionDialogRef = null;
    }
    this.selectedFile = null;
    this.selectedLanguage = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        this.snackBar.open(
          this.isHindiMode ? `PDF चुना गया: ${file.name}` : `PDF selected: ${file.name}`,
          'Close',
          { duration: 2000 }
        );
      } else {
        this.snackBar.open(
          this.isHindiMode ? 'कृपया PDF फ़ाइल चुनें' : 'Please select a PDF file',
          'Close',
          { duration: 3000 }
        );
      }
    }
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf') {
        this.selectedFile = file;
        this.snackBar.open(
          this.isHindiMode ? `PDF चुना गया: ${file.name}` : `PDF selected: ${file.name}`,
          'Close',
          { duration: 2000 }
        );
      } else {
        this.snackBar.open(
          this.isHindiMode ? 'कृपया PDF फ़ाइल चुनें' : 'Please select a PDF file',
          'Close',
          { duration: 3000 }
        );
      }
    }
  }

  removeSelectedFile() {
    this.selectedFile = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  submitAnswer() {
    if (this.isSubmitting) return;
    if (!this.selectedFile || !this.selectedTest || !this.selectedLanguage) {
      this.snackBar.open(
        this.isHindiMode ? 'कृपया PDF फ़ाइल चुनें' : 'Please select a PDF file',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.isSubmitting = true;

    this.liveTestService.submitLiveTestAnswer(this.selectedTest._id, this.selectedFile, this.selectedLanguage).subscribe({
      next: async (response) => {
        try {
          await this.proctoring.finish();
          this.snackBar.open(
            response.message || (this.isHindiMode ? 'उत्तर और रिकॉर्डिंग सफलतापूर्वक जमा हो गए!' : 'Answers and recording submitted successfully!'),
            'Close',
            { duration: 4000 }
          );
        } catch {
          this.snackBar.open(
            this.isHindiMode ? 'उत्तर जमा हो गया, लेकिन रिकॉर्डिंग अपलोड नहीं हुई।' : 'Answer submitted, but the recording upload failed.',
            'Close',
            { duration: 6000 }
          );
        } finally {
          this.isSubmitting = false;
          this.closeSubmissionModal();
          this.closeGoToLiveTestDetailModal();
          if (this.liveTestFlowRef) {
            this.liveTestFlowRef.close();
            this.liveTestFlowRef = null;
          }
          this.mediaStream = null;
          this.cameraActive = false;
          this.selectedTest = null;
          this.loadAvailableTests();
          this.loadMyParticipations();
          this.isSubmitting = false;
        }
      },
      error: (error) => {
        console.error('Submit error:', error);
        this.snackBar.open(
          error.error?.message || (this.isHindiMode ? 'जमा करने में त्रुटि' : 'Submission failed'),
          'Close',
          { duration: 3000 }
        );
        this.isSubmitting = false;
      }
    });
  }

  // ============================================
  // CAMERA CONTROLS (EXISTING)
  // ============================================
  async toggleCamera() {
    if (this.cameraActive) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    if (this.proctoring.pendingRecording()) {
      this.snackBar.open('Please retry saving the previous recording first.', 'Close', { duration: 5000 });
      return;
    }
    if (this.proctoring.starting()) return;
    if (this.proctoring.active()) {
      this.cameraActive = true;
      await new Promise(resolve => setTimeout(resolve, 50));
      if (this.videoElement) this.proctoring.bindPreview(this.videoElement.nativeElement);
      return;
    }
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }

      this.mediaStream = stream;
      this.cameraActive = true;
      await new Promise(resolve => setTimeout(resolve, 50));

      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = stream;
        await this.videoElement.nativeElement.play();
      }
      if (this.selectedTest) await this.proctoring.startLiveTest(this.selectedTest._id, stream, this.videoElement?.nativeElement);

      this.snackBar.open(
        this.isHindiMode ? 'लाइव रिकॉर्डिंग चालू है।' : 'Live recording is on.',
        'Close',
        { duration: 2500 }
      );
    } catch (error) {
      console.error('Camera error:', error);
      this.snackBar.open(
        this.isHindiMode ? 'कैमरा / स्क्रीन अनुमति नहीं मिली। मोबाइल पर कैमरा अनुमति दें।' : 'Unable to access camera or screen. On mobile, allow camera permission.',
        'Close',
        { duration: 5000 }
      );
      this.cameraActive = false;
    }
  }

  detachLocalCamera() {
    this.cameraActive = false;
    this.mediaStream = null;
    if (this.videoElement) this.videoElement.nativeElement.srcObject = null;
  }

  stopCamera() {
    if (this.proctoring.active()) this.proctoring.stopWithoutUpload();
    this.detachLocalCamera();
  }

  async retryRecording() {
    try {
      await this.proctoring.finish();
      this.snackBar.open('Recording saved successfully.', 'Close', { duration: 4000 });
    } catch {
      this.snackBar.open('Recording upload failed. Keep this page open and retry.', 'Close', { duration: 6000 });
    }
  }

  async verifyCamera() {
    if (!this.cameraActive) {
      this.snackBar.open(
        this.isHindiMode ? 'कृपया पहले कैमरा स्टार्ट करें' : 'Please start your camera first',
        'Close',
        { duration: 3000 }
      );
      return;
    }
    if (!this.proctoring.active() && this.mediaStream && this.selectedTest && this.videoElement) {
      try {
        await this.proctoring.startLiveTest(this.selectedTest._id, this.mediaStream, this.videoElement.nativeElement);
      } catch {
        this.snackBar.open(this.isHindiMode ? 'लाइव मॉनिटरिंग कनेक्ट नहीं हुई। कृपया दोबारा प्रयास करें।' : 'Live monitoring could not connect. Please try again.', 'Close', { duration: 5000 });
        return;
      }
    }
    if (!this.proctoring.active()) {
      this.snackBar.open(this.isHindiMode ? 'लाइव मॉनिटरिंग आवश्यक है।' : 'Live monitoring connection is required.', 'Close', { duration: 4000 });
      return;
    }
    this.goToFlowStep(3);
    this.snackBar.open(
      this.isHindiMode ? '✅ कैमरा सत्यापित!' : '✅ Camera verified!',
      'Close',
      { duration: 2000 }
    );
  }

  // ============================================
  // JOIN MEET (EXISTING)
  // ============================================
  joinMeet() {
    if (!this.selectedTest?.meetLink) {
      this.snackBar.open(
        this.isHindiMode ? 'मीट लिंक उपलब्ध नहीं' : 'No meet link available',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    window.open(this.selectedTest.meetLink, '_blank');
    this.snackBar.open(
      this.isHindiMode ? 'गूगल मीट खोला जा रहा है...' : 'Opening Google Meet...',
      'Close',
      { duration: 3000 }
    );

    console.log(`Student joined test: ${this.selectedTest.title}`);
  }

  // ============================================
  // VIEW PARTICIPATION
  // ============================================
  viewParticipationDetails(participation: TestParticipation) {
    this.snackBar.open(
      this.isHindiMode ? 'विवरण जल्द ही उपलब्ध' : 'Details coming soon',
      'Close',
      { duration: 3000 }
    );
  }

  // ============================================
  // SWITCH TAB
  // ============================================
  switchToAvailableTab() {
    const tabs = document.querySelector('mat-tab-group') as any;
    if (tabs) tabs.selectedIndex = 0;
  }
}
