import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { DemoTestService } from '../../../shared/services/demo-test.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-demo-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './demo-test.component.html',
  styleUrl: './demo-test.component.css'
})
export class DemoTestComponent implements OnInit {
  private demoTestService = inject(DemoTestService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  // Test data
  tests = signal<any[]>([]);
  filteredTests = signal<any[]>([]);
  completedTests = signal<any[]>([]);
  loading = signal(false);

  // Filters
  searchTerm = '';
  sortBy: 'newest' | 'oldest' | 'title' | 'duration' = 'newest';
  selectedFilter: 'all' | 'completed' | 'not-started' = 'all';

  // Instructions modal
  showInstructionsModal = false;
  selectedTest: any = null;
  instructionsLanguage: 'english' | 'hindi' = 'english';
  agreeToInstructions = false;

  // Computed values
  averageScore = computed(() => {
    const completed = this.completedTests();
    if (completed.length === 0) return 0;
    
    const totalPercentage = completed.reduce((sum, test) => sum + (test.result?.percentage || 0), 0);
    return Math.round(totalPercentage / completed.length);
  });

  ngOnInit() {
    this.loadDemoTests();
  }

  loadDemoTests() {
    this.loading.set(true);
    this.demoTestService.getAvailableDemoTests().subscribe({
      next: (tests) => {
        console.log('Loaded demo tests:', tests);
        // Filter out inactive tests
        const activeTests = tests.filter((test: any) => test.isActive !== false);
        
        // Set the tests
        this.tests.set(activeTests);
        
        // Load result data for completed tests
        this.loadResultsForCompletedTests(activeTests);
      },
      error: (error) => {
        console.error('Error loading demo tests:', error);
        this.snackBar.open('Failed to load demo tests', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadResultsForCompletedTests(tests: any[]) {
    const completedTestsList: any[] = [];
    const completedTestIds = tests.filter(test => test.submitted === true);
    
    if (completedTestIds.length === 0) {
      this.completedTests.set([]);
      this.filterTests();
      this.loading.set(false);
      return;
    }
    
    // Load results for each completed test
    const resultRequests = completedTestIds.map(test => 
      this.demoTestService.getStudentDemoTestResult(test._id)
    );
    
    forkJoin(resultRequests).subscribe({
      next: (results) => {
        // Attach results to their respective tests
        tests.forEach(test => {
          if (test.submitted) {
            const result = results.find((r: any) => r.testId === test._id || r.test?._id === test._id);
            if (result) {
              test.result = {
                score: result.score,
                totalMarks: result.totalMarks,
                percentage: ((result.score / result.totalMarks) * 100).toFixed(1)
              };
              completedTestsList.push(test);
            }
          }
        });
        
        this.completedTests.set(completedTestsList);
        this.filterTests();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading results for completed tests:', error);
        // Still show tests even if results fail to load
        this.filterTests();
        this.loading.set(false);
      }
    });
  }

  filterTests() {
    let filtered = [...this.tests()];

    // Apply search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(test => 
        test.title?.toLowerCase().includes(term) ||
        test.description?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.selectedFilter !== 'all') {
      const isCompleted = this.selectedFilter === 'completed';
      filtered = filtered.filter(test => test.submitted === isCompleted);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'oldest':
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'duration':
          return (a.duration || 0) - (b.duration || 0);
        default:
          return 0;
      }
    });

    this.filteredTests.set(filtered);
  }

  setFilter(filter: 'all' | 'completed' | 'not-started') {
    this.selectedFilter = filter;
    this.filterTests();
  }

  resetFilters() {
    this.searchTerm = '';
    this.sortBy = 'newest';
    this.selectedFilter = 'all';
    this.filterTests();
  }

  showTestInstructions(test: any) {
    console.log('Showing instructions for test:', test);
    this.selectedTest = test;
    this.showInstructionsModal = true;
    this.agreeToInstructions = false;
    this.instructionsLanguage = 'english';
  }

  closeInstructionsModal() {
    this.showInstructionsModal = false;
    this.selectedTest = null;
    this.agreeToInstructions = false;
  }

  startDemoTest() {
    console.log('startDemoTest called, selectedTest:', this.selectedTest);
    
    if (!this.selectedTest) {
      console.error('No test selected');
      this.snackBar.open('Error: No test selected', 'Close', { duration: 3000 });
      this.closeInstructionsModal();
      return;
    }
    
    if (this.agreeToInstructions) {
      const testId = this.selectedTest._id;
      console.log('Starting demo test with ID:', testId);
      this.closeInstructionsModal();
      
      // First check if test is available
      this.demoTestService.checkDemoTestAvailability(testId).subscribe({
        next: (response) => {
          console.log('Test availability check:', response);
          if (response.canTake) {
            this.router.navigate(['/take-demo-test', testId]);
          } else {
            this.snackBar.open(response.reason || 'This test is not available', 'Close', { duration: 4000 });
          }
        },
        error: (error) => {
          console.error('Error checking test availability:', error);
          this.snackBar.open('Error checking test availability', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.snackBar.open('Please agree to the instructions first', 'Close', { duration: 3000 });
    }
  }

  retakeTest(test: any) {
    if (!test || !test._id) {
      console.error('Invalid test for retake:', test);
      return;
    }
    
    if (confirm('Are you sure you want to retake this demo test? Your previous attempt will be saved.')) {
      this.demoTestService.checkDemoTestAvailability(test._id).subscribe({
        next: (response) => {
          if (response.canTake) {
            this.router.navigate(['/take-demo-test', test._id]);
          } else {
            this.snackBar.open(response.reason || 'This test is not available', 'Close', { duration: 4000 });
          }
        },
        error: (error) => {
          console.error('Error checking test availability:', error);
          this.snackBar.open('Error checking test availability', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewResults(test: any) {
  console.log('Viewing results for test:', test);
  
  // Navigate to the same result-detail component but with a flag indicating it's a demo test
  this.router.navigate(['/result-detail', test._id], {
    queryParams: { 
      testId: test._id,
      isDemoTest: 'true'  // Add this flag to indicate it's a demo test
    }
  });
}

  getIntroPreview(introPage: string): SafeHtml {
    if (!introPage) return '';
    
    // Sanitize the HTML content
    const sanitized = this.sanitizer.sanitize(1, introPage) || '';
    
    // Create a preview (strip HTML and truncate)
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitized;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    const previewText = plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
    return this.sanitizer.bypassSecurityTrustHtml(previewText);
  }

  getScoreColor(percentage: number): string {
    if (percentage >= 80) return '#4caf50';
    if (percentage >= 60) return '#2196f3';
    if (percentage >= 40) return '#ff9800';
    return '#f44336';
  }
}