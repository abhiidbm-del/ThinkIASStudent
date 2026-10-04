import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { AfterViewChecked, Component, computed, ElementRef, inject, signal, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../shared/services/auth.service';
import { TestService } from '../../shared/services/test.service';
import { LiveTest, LiveTestService } from '../../shared/services/live-test.service';
import { PaymentDialogComponent } from './payment-dialog/payment-dialog.component';
import { UserService } from '../../shared/services/user.service';

import { Plan, PublicPlanService } from '../../shared/services/public-plan.service';
import { Testimonial, TestimonialService } from '../../shared/services/testimonial.service';
import { ReviewSliderComponent } from '../homepage/review-slider/review-slider.component';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    ReviewSliderComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  private authService = inject(AuthService);
  private testService = inject(TestService);
  private liveTestService = inject(LiveTestService);
  private userService = inject(UserService);
  private planService = inject(PublicPlanService);
  private http = inject(HttpClient);

  private router = inject(Router);
  private dialog = inject(MatDialog);

  currentUser = this.authService.currentUser;
  upcomingTests = signal<any[]>([]);
  prelimsExams = signal<any[]>([]);
  mainsExams = signal<any[]>([]);
  prelimsCompletedCount = computed(() => this.prelimsExams().filter(exam => !!exam.result).length);
  mainsCompletedCount = computed(() => this.mainsExams().filter(exam => !!exam.result).length);
  liveTests = signal<LiveTest[]>([]);
  liveClock = signal(0);
  recentResults = signal<any[]>([]);
  activePlanIds = signal<string[]>([]);
  completedTestsCount = signal<number>(0);
  totalTestsCount = signal<number>(0);
  totalStudentsCount = signal<number>(0);
  totalResultsCount = signal<number>(0);
  
  loading = signal<boolean>(true);
  plans = signal<Plan[]>([]);
  @ViewChild('performanceChart') performanceChart?: ElementRef<HTMLCanvasElement>;
  private performanceChartInstance: Chart | null = null;
  private liveTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    this.planService.getPlans().subscribe({ next: plans => this.plans.set(plans), error: error => console.error('Error loading plans:', error) });
    this.userService.getActivePlanIds().subscribe({
      next: response => this.activePlanIds.set(response.planIds || []),
      error: error => console.error('Error loading active plans:', error)
    });
    const user = this.currentUser();
    
    if (user?.role === 'student') {
      if (user.type === 'fresh') {
        this.loadFreshStudentData();
      } else {
        if (user.type === 'pre' || user.type === 'combo') {
          this.loadPreStudentData();
        }
        if (user.type === 'mains' || user.type === 'combo') {
          this.loadLiveTests();
        }
        if (user.type === 'mains') {
          this.loading.set(false);
        }
      }
    } else if (user?.role === 'admin') {
      this.loadAdminData();
    }
  }

  ngOnDestroy() {
    this.performanceChartInstance?.destroy();
    if (this.liveTimer) {
      clearInterval(this.liveTimer);
      this.liveTimer = null;
    }
  }

  ngAfterViewChecked() {
    if (!this.performanceChartInstance && this.recentResults().length) {
      this.renderPerformanceChart();
    }
  }

  // Open payment dialog
  openPaymentDialog(plan: string) {
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { selectedPlan: plan },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.ngOnInit();
        // Payment was successful, reload user data
        console.log('Payment completed successfully');
        // You can add logic here to refresh the user data if needed
      } else {
        console.log('Payment cancelled');
      }
    });
  }

  loadFreshStudentData() {
    this.loading.set(true);
    
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);

    // this.testService.getUpcomingTests().subscribe({
    //   next: (tests) => {
    //     this.upcomingTests.set(tests.slice(0, 2));
    //   },
    //   error: (error) => {
    //     console.error('Error loading upcoming tests:', error);
    //   }
    // });
  }

  loadPreStudentData() {
    this.loading.set(true);
    this.loadSeriesExams('pre');
    
    this.testService.getUpcomingTests().subscribe({
      next: (tests) => {
        this.upcomingTests.set(tests.slice(0, 3));
      },
      error: (error) => {
        console.error('Error loading upcoming tests:', error);
      }
    });

    this.testService.getStudentResults().subscribe({
      next: (results) => {
        const attemptedResults = results.filter(result =>
          !!result?._id && !!result.test?._id
        );
        this.recentResults.set(attemptedResults.slice(0, 5));
        this.completedTestsCount.set(attemptedResults.length);
        this.loading.set(false);
        setTimeout(() => this.renderPerformanceChart());
      },
      error: (error) => {
        console.error('Error loading student results:', error);
        this.loading.set(false);
      }
    });
  }

  loadLiveTests() {
    this.loadSeriesExams('mains');
    this.liveTestService.getAllStudentTests().subscribe({
      next: (response) => {
        const tests = (response.data || []).filter((test) => test.status !== 'expired').slice(0, 3);
        this.liveTests.set(tests);
        if (!this.liveTimer) {
          this.liveTimer = setInterval(() => this.liveClock.update((value) => value + 1), 1000);
        }
      },
      error: (error) => console.error('Error loading live tests:', error)
    });
  }

  private loadSeriesExams(kind: 'pre' | 'mains') {
    const path = kind === 'pre' ? 'prelims-ts' : 'mains-ts';
    this.http.get<any>(`${environment.apiUrl}/${path}/student/all`).subscribe({
      next: response => {
        const exams = (response.data || []).flatMap((series: any) =>
          (series.testDates || [])
            .filter((slot: any) => !!slot.exam)
            .map((slot: any) => ({
              ...slot,
              seriesName: series.name,
              examTitle: slot.exam.title || series.name,
              startTime: slot.exam.startTime || slot.date,
              duration: slot.exam.duration || slot.duration
            }))
        ).sort((first: any, second: any) => {
          const firstTime = new Date(first.startTime).getTime();
          const secondTime = new Date(second.startTime).getTime();
          const now = Date.now();
          const firstUpcoming = firstTime >= now;
          const secondUpcoming = secondTime >= now;
          if (firstUpcoming !== secondUpcoming) return firstUpcoming ? -1 : 1;
          return firstUpcoming ? firstTime - secondTime : secondTime - firstTime;
        });
        (kind === 'pre' ? this.prelimsExams : this.mainsExams).set(exams);
      },
      error: error => console.error(`Error loading ${kind} series exams:`, error)
    });
  }

  isLiveTestActive(test: LiveTest): boolean {
    this.liveClock();
    const now = Date.now();
    const start = new Date(test.startDateTime).getTime();
    const end = new Date(test.endDateTime).getTime();
    return now >= start && now <= end && test.status !== 'submitted';
  }

  liveTestCountdown(test: LiveTest): string {
    this.liveClock();
    const now = Date.now();
    const start = new Date(test.startDateTime).getTime();
    const end = new Date(test.endDateTime).getTime();
    const remaining = Math.max(0, (now < start ? start : end) - now) / 1000;
    const hours = Math.floor(remaining / 3600);
    const minutes = Math.floor((remaining % 3600) / 60);
    const secs = Math.floor(remaining % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  private renderPerformanceChart() {
    const canvas = this.performanceChart?.nativeElement;
    const results = [...this.recentResults()].reverse();
    if (!canvas || results.length === 0) return;

    this.performanceChartInstance?.destroy();
    this.performanceChartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: results.map(result => result.test?.title || 'Test'),
        datasets: [{
          data: results.map(result => this.getResultPercentage(result)),
          borderColor: '#198754',
          backgroundColor: 'rgba(25, 135, 84, .12)',
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#198754',
          pointBorderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3,
          fill: true,
          tension: .35
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: context => `${Number(context.parsed.y ?? 0).toFixed(1)}% of total marks` } }
        },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: value => `${value}%` }, grid: { color: '#e7eef2' } },
          x: { grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 5 } }
        }
      }
    });
  }

  private getResultPercentage(result: any): number {
    const percentage = Number(result.percentage);
    if (Number.isFinite(percentage)) return Math.max(0, Math.min(100, percentage));

    const score = Number(result.score);
    const totalMarks = Number(result.totalMarks);
    return totalMarks > 0 ? Math.max(0, Math.min(100, (score / totalMarks) * 100)) : 0;
  }

  loadAdminData() {
    this.loading.set(true);
    
    this.testService.getPlatformStatistics().subscribe({
      next: (stats) => {
        this.totalStudentsCount.set(stats.totalStudents);
        this.totalResultsCount.set(stats.totalResults);
        this.totalTestsCount.set(stats.totalTests);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading platform statistics:', error);
        this.loadFallbackAdminData();
      }
    });
  }

  loadFallbackAdminData() {
    this.testService.getAllResults().subscribe({
      next: (results) => {
        this.totalResultsCount.set(results.length);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading results:', error);
        this.loading.set(false);
      }
    });
  }

  getRecentPerformance(): string {
    const results = this.recentResults();
    if (results.length === 0) return 'No tests taken yet';
    
    const avgPercentage = results.reduce((sum, result) => sum + parseFloat(result.percentage), 0) / results.length;
    return `Average: ${avgPercentage.toFixed(1)}%`;
  }

  getUserTypeLabel(): string {
    const type = this.currentUser()?.type;
    return type === 'pre' ? 'Prelims' : type === 'mains' ? 'Mains' : type === 'combo' ? 'Prelims + Mains' : 'Fresh Student';
  }

  getPurchasedPlanNames(): string[] {
    const activeIds = this.activePlanIds();
    return this.plans()
      .filter(plan => activeIds.includes(plan.id))
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map(plan => plan.name);
  }

  navigateToStudentsList() {
    this.router.navigate(['/students-list']);
  }
  // getMe(){
  //   this.userService.getMe().subscribe({
  //     next: (results:any) => {
  //       console.log(results)
  //     },
  //     error: (error:any) => {
  //       // console.error('Error loading results:', error);
  //       // this.loading.set(false);
  //     }
  //   });
  // }
}
