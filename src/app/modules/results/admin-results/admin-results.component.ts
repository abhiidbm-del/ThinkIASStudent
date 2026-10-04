// admin-results.component.ts - UPDATED WITH LANGUAGE SUPPORT
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { TestService, TestAnalytics } from '../../../shared/services/test.service';
import { AuthService } from '../../../shared/services/auth.service';

export interface TestRanking {
  _id: string;
  student: {
    _id: string;
    fullName: string;
    email: string;
  };
  score: number;
  totalMarks: number;
  percentage: number;
  rank: number;
  submittedAt: string;
  timeTaken: number;
}

@Component({
  selector: 'app-admin-results',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatFormFieldModule,
    MatRadioModule
  ],
  templateUrl: './admin-results.component.html',
  styleUrl: './admin-results.component.css'
})
export class AdminResultsComponent implements OnInit {
  private testService = inject(TestService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  allTests = signal<any[]>([]);
  selectedTestId = signal<string>('');
  rankings = signal<TestRanking[]>([]);
  analytics = signal<TestAnalytics | null>(null);
  loading = signal(false);
  analyticsLoading = signal(false);
  selectedLanguage: 'english' | 'hindi' = 'english';

  // Table columns
  rankingColumns: string[] = ['rank', 'student', 'score', 'percentage', 'timeTaken', 'submittedAt'];
  analyticsColumns: string[] = ['question', 'correctAnswers', 'incorrectAnswers', 'correctPercentage'];

  ngOnInit() {
    this.loadAllTests();
    this.route.queryParams.subscribe(params => {
      if (params['testId']) {
        this.selectedTestId.set(params['testId']);
        this.loadTestResults(params['testId']);
        this.loadTestAnalytics(params['testId']);
      }
    });
  }

  loadAllTests() {
    this.testService.getAllTests().subscribe({
      next: (tests) => {
        this.allTests.set(tests);
      },
      error: (error) => {
        console.error('Error loading tests:', error);
      }
    });
  }

  onTestSelectionChange(testId: string) {
    this.selectedTestId.set(testId);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { testId: testId },
      queryParamsHandling: 'merge'
    });
    this.loadTestResults(testId);
    this.loadTestAnalytics(testId);
  }

  loadTestResults(testId: string) {
    this.loading.set(true);
    this.testService.getTestResults(testId).subscribe({
      next: (results) => {
        this.rankings.set(results);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.loading.set(false);
      }
    });
  }

  loadTestAnalytics(testId: string) {
    this.analyticsLoading.set(true);
    this.testService.getTestAnalytics(testId).subscribe({
      next: (analytics) => {
        this.analytics.set(analytics);
        this.analyticsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.analyticsLoading.set(false);
      }
    });
  }

  // Language-specific text getters
  getQuestionText(question: any): string {
    if (!question) return '';
    return question[this.selectedLanguage] || question.english || '';
  }

  getDescriptionText(stat: any): string {
    if (!stat || !stat.description) return '';
    return stat.description[this.selectedLanguage] || stat.description.english || '';
  }

  hasDescription(stat: any): boolean {
    return !!(stat?.description && 
             (stat.description[this.selectedLanguage] || stat.description.english));
  }

  getRankColor(rank: number): string {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return '#cd7f32'; // bronze
    return '';
  }

  // Helper method to determine percentage class
  getPercentageClass(percentage: number): string {
    if (percentage >= 70) return 'high-percentage';
    if (percentage >= 40) return 'medium-percentage';
    return 'low-percentage';
  }

  exportResults() {
    // Simple CSV export implementation
    const rankings = this.rankings();
    if (rankings.length === 0) return;

    const headers = ['Rank', 'Student Name', 'Email', 'Score', 'Total Marks', 'Percentage', 'Time Taken (s)', 'Submitted At'];
    const csvData = rankings.map(rank => [
      rank.rank,
      rank.student.fullName,
      rank.student.email,
      rank.score,
      rank.totalMarks,
      rank.percentage + '%',
      rank.timeTaken,
      new Date(rank.submittedAt).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `test-results-${this.selectedTestId()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}