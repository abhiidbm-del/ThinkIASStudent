import { LanguageToggleComponent } from '../../../shared/i18n/language-toggle.component';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
// careers-page.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../../../environment/environment';

@Component({
  selector: 'app-careers-page',
  standalone: true,
  imports: [LanguageToggleComponent, TranslatePipe, CommonModule, FormsModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './careers-page.component.html',
  styleUrl: './careers-page.component.css'
})
export class CareersPageComponent implements OnInit, OnDestroy {
  @ViewChild('successNotice') set successNotice(element: ElementRef<HTMLElement> | undefined) {
    if (element) requestAnimationFrame(() => {
      element.nativeElement.focus();
      element.nativeElement.scrollIntoView({behavior:'smooth',block:'center'});
    });
  }
  // Jobs data
  jobs: any[] = [];
  filteredJobs: any[] = [];
  selectedJob: any = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalJobs = 0;
  
  // Filters
  filters = {
    type: '',
    location: '',
    hasVideo: false
  };
  
  // Application form
  applicationForm: FormGroup;
  selectedResume: File | null = null;
  isSubmitting = false;
  showApplicationModal = false;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  
  // API URL
  // private apiUrl = 'http://localhost:5000/api';
    private apiUrl = `${environment.apiUrl}`;
  
  
  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.applicationForm = this.createApplicationForm();
  }
  
  ngOnInit(): void {
    this.loadJobs();
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  createApplicationForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      contactNo: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
      demoVideoLink: ['', [Validators.pattern('https?://(www\\.)?(youtube\\.com|youtu\\.be|vimeo\\.com|loom\\.com|drive\\.google\\.com)/.*')]]
    });
  }
  
  loadJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    let url = `${this.apiUrl}/jobs?page=${this.currentPage}&limit=${this.pageSize}`;
    if (this.filters.type) url += `&type=${this.filters.type}`;
    if (this.filters.location) url += `&location=${encodeURIComponent(this.filters.location)}`;
    if (this.filters.hasVideo) url += `&requireVideo=true`;
    
    const subscription = this.http.get<any>(url).subscribe({
      next: (response) => {
        this.jobs = response.data;
        this.filteredJobs = response.data;
        this.totalPages = response.pagination.pages;
        this.totalJobs = response.pagination.total;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load jobs. Please try again.';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(subscription);
  }
  
  loadJobDetails(jobId: string): void {
    this.isLoading = true;
    const subscription = this.http.get<any>(`${this.apiUrl}/jobs/${jobId}`).subscribe({
      next: (response) => {
        this.selectedJob = response.data;
        this.isLoading = false;
        this.showApplicationModal = true;
        // Reset form when opening modal
        this.applicationForm.reset();
        this.selectedResume = null;
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to load job details.';
        this.isLoading = false;
      }
    });
    
    this.subscriptions.push(subscription);
  }
  
  applyForJob(jobId: string): void {
    if (this.isSubmitting) return;
    if (!this.selectedResume) { this.errorMessage = "Please upload your resume as a PDF."; return; }
    if (this.applicationForm.invalid) {
      Object.keys(this.applicationForm.controls).forEach(key => {
        this.applicationForm.get(key)?.markAsTouched();
      });
      return;
    }
    
    this.errorMessage = ''; this.successMessage = '';
    this.isSubmitting = true;
    const formData = new FormData();
    formData.append('name', this.applicationForm.get('name')?.value);
    formData.append('email', this.applicationForm.get('email')?.value);
    formData.append('contactNo', this.applicationForm.get('contactNo')?.value);
    
    if (this.applicationForm.get('demoVideoLink')?.value) {
      formData.append('demoVideoLink', this.applicationForm.get('demoVideoLink')?.value);
    }
    
    if (this.selectedResume) {
      formData.append('resume', this.selectedResume);
    }
    
    const subscription = this.http.post(`${this.apiUrl}/jobs/${jobId}/apply`, formData).subscribe({
      next: (response: any) => {
        this.successMessage = response.message || 'Application submitted successfully!';
        this.isSubmitting = false;
        this.showApplicationModal = false;
        this.applicationForm.reset();
        this.selectedResume = null;
        
        this.loadJobs();
      },
      error: (error) => {
        this.errorMessage = error.error?.message || 'Failed to submit application. Please try again.';
        this.isSubmitting = false;
        

      }
    });
    
    this.subscriptions.push(subscription);
  }
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf'];
      if (allowedTypes.includes(file.type) && file.size <= 10 * 1024 * 1024) {
        this.selectedResume = file;
      } else {
        this.selectedResume = null;
        this.errorMessage = 'Please upload a PDF up to 10 MB.';
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    }
  }
  
  applyFilters(): void {
    this.currentPage = 1;
    this.loadJobs();
  }
  
  resetFilters(): void {
    this.filters = {
      type: '',
      location: '',
      hasVideo: false
    };
    this.currentPage = 1;
    this.loadJobs();
  }
  
  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadJobs();
    }
  }
  
  closeModal(): void {
    this.showApplicationModal = false;
    this.selectedJob = null;
    this.applicationForm.reset();
    this.selectedResume = null;
  }
  
  getJobTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'full-time': 'badge-fulltime',
      'part-time': 'badge-parttime',
      'contract': 'badge-contract',
      'internship': 'badge-internship',
      'remote': 'badge-remote'
    };
    return classes[type] || 'badge-default';
  }
  
  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  getYouTubeEmbedUrl(url: string): string {
    if (!url) return '';
    // Convert youtube.com/watch?v= to embed format
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Convert youtu.be to embed format
    if (url.includes('youtu.be')) {
      const videoId = url.split('/').pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    // Return as is for other platforms
    return url;
  }
}
