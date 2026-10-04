
import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../shared/services/auth.service';
import { TestService } from '../../../shared/services/test.service';
import { CreateTestDialogComponent } from '../create-test-dialog/create-test-dialog.component';

@Component({
  selector: 'app-live-tests',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatCheckboxModule
  ],
  templateUrl: './live-tests.component.html',
  styleUrl: './live-tests.component.css'
})
export class LiveTestsComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private testService = inject(TestService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  tests = signal<any[]>([]);
  now = Date.now();
  private clock: ReturnType<typeof setInterval> | null = null;
  search='';testFilter='all';sortOrder='newest';
  get filteredTests(){return this.tests().filter(test=>(this.testFilter==='all'||(this.testFilter==='completed'?test.submitted:!test.submitted))&&[test.title,test.description].join(' ').toLowerCase().includes(this.search.toLowerCase())).sort((a,b)=>(+new Date(b.startTime)-+new Date(a.startTime))*(this.sortOrder==='newest'?1:-1));}
  get completedTestsCount(){return this.tests().filter(test => test.submitted).length;}
  loading = signal(false);
  pdfDownloading = signal<string | null>(null);
  isAdmin = this.authService.currentUser()?.role === 'admin';

  // Rules modal state
  showRulesModal = false;
  showIntroPage = false; // New flag to toggle between rules and intro page
  rulesLanguage: 'english' | 'hindi' = 'english';
  agreeToRules = false;
  agreeToIntro = false; // New flag for intro page agreement
  selectedTest: any = null;
  showIntroductionModal = false;
  introductionTest: any = null;

  ngOnInit() {
    this.loadTests();
    this.clock = setInterval(() => this.now = Date.now(), 1000);
  }
  ngOnDestroy() { if (this.clock) clearInterval(this.clock); }
  countdown(test: any): string {
    if (!test?.startTime) return '';
    const ms = +new Date(test.startTime) - this.now;
    if (ms <= 0) return '';
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }

  loadTests() {
    this.loading.set(true);
    if (this.isAdmin) {
      this.testService.getAllTests().subscribe({
        next: (tests) => {
          this.tests.set(tests);
          this.loading.set(false);
        },
        error: (error) => {
          this.snackBar.open('Error loading tests', 'Close', { duration: 3000 });
          this.loading.set(false);
        }
      });
    } else {
      this.testService.getUpcomingTests().subscribe({
        next: (tests) => {
          this.tests.set(tests);
          this.loading.set(false);
        },
        error: (error) => {
          this.snackBar.open('Error loading tests', 'Close', { duration: 3000 });
          this.loading.set(false);
        }
      });
    }
  }

  openCreateTestDialog(test?: any) {
    // const dialogRef = this.dialog.open(CreateTestDialogComponent, {
    //   width: '90vw',
    //   maxWidth: '1200px',
    //   height: '90vh',
    //   maxHeight: '800px',
    //   panelClass: 'create-test-dialog-panel',
    //   autoFocus: false,
    //   data: { test: test || null }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     this.loadTests();
    //   }
    // });
  }

  editTest(test: any) {
    // this.openCreateTestDialog(test);
  }

  deleteTest(testId: string) {
    if (confirm('Are you sure you want to delete this test? This will also delete all associated results.')) {
      this.testService.deleteTest(testId).subscribe({
        next: () => {
          this.snackBar.open('Test deleted successfully', 'Close', { duration: 3000 });
          this.loadTests();
        },
        error: (error) => {
          this.snackBar.open('Error deleting test: ' + error.error?.message, 'Close', { duration: 3000 });
        }
      });
    }
  }

  // canStartTest(test: any): boolean {
  //   if (!test.startTime) return false;
  //   const now = new Date();
  //   const startTime = new Date(test.startTime);
  //   const endTime = new Date(startTime.getTime() + (test.duration || 0) * 60000);
  //   return now >= startTime && now <= endTime;
  // }

  canStartTest(test: any): boolean {
    if (test.canTake) return true;
    if (!test.startTime || !test.endTime) return false;
    const now = new Date();
    const startTime = new Date(test.startTime);
    const endTime = new Date(test.reopenUntil || test.endTime);
    if (test.reopened || test.reopenUntil) return now <= endTime;
    return now >= startTime && now <= endTime;
  }

  showTestRules(test: any) {
    if (this.countdown(test)) {
      this.router.navigate(['/take-test', test._id]);
      return;
    }
    if (this.canStartTest(test)) {
      this.selectedTest = test;
      this.showRulesModal = true;
      this.showIntroPage = false; // Start with rules page
      this.agreeToRules = false;
      this.agreeToIntro = false;
      this.rulesLanguage = 'english';
    } else {
      const now = new Date();
      const startTime = new Date(test.startTime);
      if (now < startTime) {
        this.snackBar.open('Test has not started yet', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Test has already ended', 'Close', { duration: 3000 });
      }
    }
  }

  cancelStartTest() {
    this.showRulesModal = false;
    this.showIntroPage = false;
    this.selectedTest = null;
    this.agreeToRules = false;
    this.agreeToIntro = false;
  }

  proceedToIntroPage() {
    if (this.agreeToRules && this.selectedTest) {
      this.showIntroPage = true;
    }
  }

  backToRules() {
    this.showIntroPage = false;
  }

  proceedToTest() {
    if (this.agreeToIntro && this.selectedTest) {
      this.showRulesModal = false;
      this.showIntroPage = false;
      this.startTest(this.selectedTest);
      this.selectedTest = null;
      this.agreeToRules = false;
      this.agreeToIntro = false;
    }
  }

  startTest(test: any) {
    if (this.canStartTest(test)) {
      this.router.navigate(['/take-test', test._id]);
    }
  }

  viewResults(testId: string) {
    this.router.navigate(['/prelims-results'], { queryParams: { testId } });
  }

  viewIntroduction(test: any) {
    this.introductionTest = test;
    this.showIntroductionModal = true;
  }

  closeIntroduction() {
    this.showIntroductionModal = false;
    this.introductionTest = null;
  }

  // PDF Download functionality
  downloadPdf(testId: string, type: 'en' | 'hi') {
    this.pdfDownloading.set(testId);
    
    const languageText = type === 'en' ? 'English' : 'Hindi';
    
    // Find the test to get the title for the filename
    const test = this.tests().find(t => t._id === testId);
    const testTitle = test?.title || 'test';
    
    this.testService.downloadQuestionPaperPdf(testId, type).subscribe({
      next: (response: any) => {
        if (response.success && response.base64) {
          this.downloadBase64Pdf(
            response.base64, 
            response.fileName || `question-paper-${testId}-${type}.pdf`,
            testTitle
          );
          this.snackBar.open(`${languageText} PDF downloaded successfully!`, 'Close', { duration: 3000 });
        } else {
          this.snackBar.open('Failed to generate PDF', 'Close', { duration: 3000 });
        }
        this.pdfDownloading.set(null);
      },
      error: (error) => {
        console.error('Error downloading PDF:', error);
        this.snackBar.open(`Error downloading ${languageText} PDF: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
        this.pdfDownloading.set(null);
      }
    });
  }

  private downloadBase64Pdf(base64Data: string, fileName: string, testTitle: string) {
    try {
      // Decode base64 string
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      
      // Add a descriptive title as data attribute for accessibility
      link.setAttribute('data-test-title', testTitle);
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Error processing PDF data:', error);
      this.snackBar.open('Error processing PDF file', 'Close', { duration: 3000 });
    }
  }
}