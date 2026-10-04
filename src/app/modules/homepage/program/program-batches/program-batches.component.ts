import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../../../dashboard/payment-dialog/payment-dialog.component';
import { ProgramFaqsComponent } from '../../program-faqs/program-faqs.component';
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { environment } from '../../../../../environment/environment';
import { LanguageService } from '../../../../shared/i18n/language.service';

export interface Program {
  _id?: string;
  programName: string;
  programNameHindi?: string; descriptionHindi?: string; durationHindi?: string; featuresHindi?: string[]; displayImageHindi?: string;
  programCategory: string;
  year: string;
  price: number;
  displayImage: string;
  discountedPrice?: number;
  description?: string;
  features?: string[];
  duration?: string;
  isActive?: boolean;
  order?: number;
}

export interface Batch {
  _id: string;
  programId: string;
  batchName: string;
  batchNameHindi?: string; durationHindi?: string;
  startDate: Date;
  endDate: Date;
  duration: string;
  brochureHindi: string;
  brochureEnglish: string;
  order: number;
  isActive: boolean;
}

@Component({
  selector: 'app-program-batches',
  standalone: true,
  imports: [ProgramFaqsComponent, TranslatePipe, CommonModule, HttpClientModule, FormsModule, RouterModule],
  template: `
    <div class="batches-page">
      <!-- Program Header -->
      <div class="program-header" [style.backgroundImage]="'linear-gradient(120deg, #102a43 0%, #1d5374 62%, #198754 100%)'">
        <div class="container">
          <div class="program-info" *ngIf="program">
            <div class="program-image">
              <img [src]="programImage(program)" [alt]="program.programName" (error)="handleImageError($event)">
            </div>
            <div class="program-details">
              <div class="program-category-badge">
                <i class="fas" 
                   [class.fa-chalkboard-user]="program.programCategory === 'Mentorship Course'"
                   [class.fa-graduation-cap]="program.programCategory === 'Optional Mentorship Course'"
                   [class.fa-file-alt]="program.programCategory === 'Test Series'"
                   [class.fa-pen-ruler]="program.programCategory === 'Optional Test Series'"
                   [class.fa-pencil-alt]="program.programCategory === 'Essay'">
                </i>
                {{ program.programCategory | t }}
              </div>
              <h1>{{ program.programName | t:program.programNameHindi }}</h1>
              <p class="description">{{ program.description | t:program.descriptionHindi }}</p>
              <div class="program-meta">
                <span class="meta-item">
                  <i class="fas fa-calendar-alt"></i>
                  {{ 'Year' | t }}: {{ program.year }}
                </span>
                <span class="meta-item" *ngIf="program.duration">
                  <i class="fas fa-clock"></i>
                  {{ 'Duration:' | t }} {{ formatDuration(program.duration, program.durationHindi) }}
                </span>
                <span class="meta-item">
                  <i class="fas fa-tag"></i>
                  {{ 'Price' | t }}:
                  <span *ngIf="program.discountedPrice">
                    <span class="current-price">{{ formatCurrency(program.discountedPrice) }}</span>
                    <span class="original-price">{{ formatCurrency(program.price) }}</span>
                  </span>
                  <span *ngIf="!program.discountedPrice">
                    {{ formatCurrency(program.price) }}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Batches Section -->
      <div class="batches-section">
        <div class="container">
          <h2 class="section-title">
            <i class="fas fa-layer-group"></i>{{ 'Available Batches' | t }}</h2>
          
          <!-- Loading State -->
          <div *ngIf="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>{{ 'Loading batches...' | t }}</p>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage && !isLoading" class="error-container">
            <i class="fas fa-exclamation-triangle"></i>
            <p>{{ errorMessage | t }}</p>
          </div>

          <!-- No Batches -->
          <div *ngIf="!isLoading && !errorMessage && batches.length === 0" class="no-batches">
            <i class="fas fa-calendar-times"></i>
            <h3>{{ 'No batches available' | t }}</h3>
            <p>{{ 'Currently there are no active batches for this program. Please check back later.' | t }}</p>
            <button class="btn btn-primary" (click)="goBack()">
              <i class="fas fa-arrow-left"></i> {{ 'Browse Other Programs' | t }}
            </button>
          </div>

          <p role="alert">{{ mentorshipError | t }}</p>
          <section *ngIf="mentorships.length">
            <h2>{{ 'Mentorship Program Details' | t }}</h2>
            <label>{{ 'Medium' | t }}
              <select [(ngModel)]="medium">
                <option value="">{{ 'All mediums' | t }}</option>
                <option value="english">{{ 'English' | t }}</option>
                <option value="hindi">{{ 'Hindi' | t }}</option>
              </select>
            </label>
            <div style="overflow-x:auto">
              <table style="width:100%">
                <thead><tr><th>{{ 'Program / Batch' | t }}</th><th>{{ 'Duration' | t }}</th><th>{{ 'Start date' | t }}</th><th>{{ 'Medium' | t }}</th><th>{{ 'Fee' | t }}</th><th>{{ 'Brochure' | t }}</th></tr></thead>
                <tbody>
                  <tr *ngFor="let m of filteredMentorships">
                    <td>{{ m.name | t:m.nameHindi }}<p>{{ m.batchId?.batchName | t:m.batchId?.batchNameHindi }}</p></td>
                    <td>{{ formatDuration(m.duration, m.durationHindi) }}</td>
                    <td>{{ formatLocalizedDate(m.startDate) }}</td>
                    <td>{{ formatMedium(m.medium) }}</td>
                    <td>{{ formatCurrency(m.fee) }}</td>
                    <td><a *ngIf="m.brochureEnglish" [href]="m.brochureEnglish" target="_blank" rel="noopener">{{ 'English' | t }}</a> <a *ngIf="m.brochureHindi" [href]="m.brochureHindi" target="_blank" rel="noopener">{{ 'Hindi' | t }}</a></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <!-- Batches Grid -->
          <div *ngIf="!isLoading && !errorMessage && batches.length > 0" class="batches-grid">
            <div class="batch-card" *ngFor="let batch of batches">
              <div class="batch-header">
                <h3>{{ batch.batchName | t:batch.batchNameHindi }}</h3>
                <span class="batch-status">{{ 'Active' | t }}</span>
              </div>
              
              <div class="batch-dates">
                <div class="date-item">
                  <i class="fas fa-calendar-alt"></i>
                  <div>
                    <span class="label">{{ 'Start Date' | t }}</span>
                    <strong>{{ formatLocalizedDate(batch.startDate) }}</strong>
                  </div>
                </div>
                <div class="date-arrow">
                  <i class="fas fa-arrow-right"></i>
                </div>
                <div class="date-item">
                  <i class="fas fa-calendar-check"></i>
                  <div>
                    <span class="label">{{ 'End Date' | t }}</span>
                    <strong>{{ formatLocalizedDate(batch.endDate) }}</strong>
                  </div>
                </div>
              </div>
              
              <div class="batch-duration">
                <i class="fas fa-hourglass-half"></i>
                <span>{{ 'Duration:' | t }} {{ formatDuration(batch.duration, batch.durationHindi) }}</span>
              </div>
              
              <div class="batch-brochures" *ngIf="batch.brochureHindi || batch.brochureEnglish">
                <div class="brochure-title">
                  <i class="fas fa-file-pdf"></i>
                  <span>{{ 'Program Brochures' | t }}</span>
                </div>
                <div class="brochure-links">
                  <a *ngIf="brochureLink(batch, 'hi')" [href]="brochureLink(batch, 'hi')" target="_blank" class="brochure-link hindi hi">
                    <i class="fas fa-language"></i>
                    {{ 'Hindi Brochure' | t }}
                  </a>
                  <a *ngIf="brochureLink(batch, 'en')" [href]="brochureLink(batch, 'en')" target="_blank" class="brochure-link english en">
                    <i class="fas fa-file-alt"></i>{{ 'English Brochure' | t }}</a>
                </div>
              </div>
              
              <button class="enroll-btn" (click)="enrollInBatch(batch)">
                <i class="fas fa-arrow-right"></i>
                {{ 'Register Now' | t }}
              </button>
            </div>
          </div>
        </div>
      </div>
      <app-program-faqs [programId]="programId"></app-program-faqs>
    </div>
  `,
  styleUrls: ['./program-batches.component.css']
})
export class ProgramBatchesComponent implements OnInit {
  private language = inject(LanguageService);
  programId: string = '';
  program: Program | null = null;
  batches: Batch[] = [];
  mentorships:any[]=[]; medium=''; mentorshipError='';
  get filteredMentorships(){return this.mentorships.filter(m=>!this.medium||m.medium===this.medium||m.medium==='english/hindi');}
  isLoading = true;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.programId = this.route.snapshot.paramMap.get('id') || '';
    if (this.programId) {
      this.fetchProgramDetails();
      this.fetchBatches();
      this.http.get<any>(environment.apiUrl+'/mentorship',{params:{programId:this.programId}}).subscribe({next:r=>this.mentorships=r.data||[],error:()=>this.mentorshipError='Unable to load mentorship details.'});
    } else {
      this.goBack();
    }
  }

  fetchProgramDetails(): void {
    this.http.get<any>(`${environment.apiUrl}/programs/${this.programId}`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.program = response.data;
        }
      },
      error: (error) => {
        console.error('Error fetching program:', error);
        this.errorMessage = 'Failed to load program details';
      }
    });
  }

  fetchBatches(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/programs/${this.programId}/batches`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.batches = response.data;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching batches:', error);
        this.errorMessage = 'Failed to load batches. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  enrollInBatch(batch: Batch): void {
    if (!localStorage.getItem('token')) {
      this.router.navigate(['/login'], {queryParams: {returnUrl: '/program/' + this.programId}}); return;
    }
    this.dialog.open(PaymentDialogComponent, {width:'600px',maxWidth:'95vw',data:{programId:this.programId,batchId:batch._id}});
  }

  goBack(): void {
    this.router.navigate(['/programs'], { queryParams: { category: this.program?.programCategory || null } });
  }

  handleImageError(event: any): void {
    event.target.src = 'assets/images/logo.png';
  }

  programImage(program: Program): string {
    if (this.language.hindi && program.displayImageHindi) {
      return program.displayImageHindi;
    }
    return program.displayImage;
  }

  brochureLink(batch: Batch, lang: 'en' | 'hi'): string {
    const hindiSite = this.language.hindi;
    if (hindiSite) {
      return lang === 'hi' ? (batch.brochureHindi || batch.brochureEnglish || '') : '';
    }
    return lang === 'en' ? (batch.brochureEnglish || batch.brochureHindi || '') : '';
  }

  formatLocalizedDate(value: string | Date): string {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    const locale = this.language.hindi ? 'hi-IN' : 'en-IN';
    return new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  }

  formatDuration(english?: string, hindi?: string): string {
    if (!this.language.hindi || !english) return english || '';
    if (hindi) return hindi;
    return english
      .replace(/\bmonths\b/gi, 'महीने')
      .replace(/\bmonth\b/gi, 'महीना')
      .replace(/\byears\b/gi, 'वर्ष')
      .replace(/\byear\b/gi, 'वर्ष')
      .replace(/\bdays\b/gi, 'दिन')
      .replace(/\bday\b/gi, 'दिन')
      .replace(/\bweeks\b/gi, 'सप्ताह')
      .replace(/\bweek\b/gi, 'सप्ताह');
  }

  formatCurrency(value: number): string {
    const locale = this.language.hindi ? 'hi-IN' : 'en-IN';
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
  }

  formatMedium(value?: string): string {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'english') return this.language.text('English');
    if (normalized === 'hindi') return this.language.text('Hindi');
    if (normalized === 'english/hindi' || normalized === 'english / hindi') return this.language.text('English / Hindi');
    return value || '';
  }
}
