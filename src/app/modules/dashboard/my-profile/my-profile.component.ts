import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
// my-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { Router, RouterLink } from '@angular/router';
import { MatSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { PaymentDialogComponent } from '../payment-dialog/payment-dialog.component';
import { Plan, PublicPlanService } from '../../../shared/services/public-plan.service';
import { AuthService } from '../../../shared/services/auth.service';

interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  purchasedPlanId?: string;
  planActivatedAt?: string;
  planExpiryAt?: string;
  __v: number;
}

@Component({
  selector: 'app-my-profile',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatChipsModule,
    MatSpinner,
    RouterLink
  ],
  templateUrl: './my-profile.component.html',
  styleUrl: './my-profile.component.css'
})
export class MyProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  currentPlan: Plan | null = null;
  loading = true;
  
  constructor(private router: Router, private dialog: MatDialog, private planService: PublicPlanService, private authService: AuthService) {}
  
  ngOnInit(): void {
    this.loadUserData();
    this.loadCurrentPlan();
    this.getUserInitials()
  }

  private loadCurrentPlan(): void {
    this.planService.getPlans().subscribe({
      next: plans => { this.currentPlan = plans.find(plan => plan.id === (this.user?.purchasedPlanId || this.user?.type)) || null; },
      error: error => console.error('Unable to load current plan:', error)
    });
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed
  }
  
  private loadUserData(): void {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        this.user = JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      this.loading = false;
    }
  }
  
  getUserInitials(): string {
    if (!this.user?.fullName) return 'U';
    
    const names = this.user.fullName.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return this.user.fullName[0].toUpperCase();
  }
  
  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  upgradePlan(): void {
    const selectedPlan = this.user?.type === 'pre' || this.user?.type === 'mains' ? 'combo' : 'pre';
    const dialogRef = this.dialog.open(PaymentDialogComponent, {
      width: '600px', maxWidth: '95vw', disableClose: true, data: { selectedPlan }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;
      this.authService.refreshUser().subscribe({ next: () => { this.loadUserData(); this.loadCurrentPlan(); } });
    });
  }
  
  isFreePlan(): boolean {
    return this.user?.type === 'free' || this.user?.type === 'fresh' || !this.user?.type;
  }
  
  getPlanColor(): string {
    const type = this.user?.type?.toLowerCase();
    switch(type) {
      case 'premium': return 'primary';
      case 'pro': return 'accent';
      case 'enterprise': return 'warn';
      default: return 'basic';
    }
  }
  
  getPlanDisplayName(): string {
    if (this.currentPlan?.name) return this.currentPlan.name;
    const type = this.user?.type;
    if (!type) return 'Free Plan';
    return type.charAt(0).toUpperCase() + type.slice(1) + ' Plan';
  }
}
