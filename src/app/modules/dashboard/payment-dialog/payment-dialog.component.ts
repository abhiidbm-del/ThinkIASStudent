import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
// src/app/modules/dashboard/payment-dialog/payment-dialog.component.ts

import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../shared/services/auth.service';
import { environment } from '../../../../environment/environment';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, firstValueFrom } from 'rxjs';

declare var Razorpay: any;

export interface PaymentDialogData {
  selectedPlan?: string;
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
}

export interface Plan {
  id: string;
  name: string;
  baseAmount: number;
  totalAmount: number;
  duration: string;
  features: string[];
  nameHindi?: string; subtitleHindi?: string; badgeHindi?: string; durationHindi?: string; featuresHindi?: string[];
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  description?: string;
  isOneTimePerUser: boolean;
  discountAmount: number;
}

export interface RazorpayConfig {
  success: boolean;
  razorpayKeyId: string;
  currency: string;
}

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatInputModule,
    MatTooltipModule
  ],
  templateUrl: './payment-dialog.component.html',
  styleUrls: ['./payment-dialog.component.css']
})
export class PaymentDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  paymentForm: FormGroup;
  selectedPlan = signal<Plan | null>(null);
  processing = signal<boolean>(false);
  razorpayLoaded = signal<boolean>(false);
  razorpayConfigLoaded = signal<boolean>(false);
  applyingCoupon = signal<boolean>(false);
  couponApplied = signal<Coupon | null>(null);
  couponError = signal<string | null>(null);

  razorpayKeyId = signal<string>('');
  razorpayCurrency = signal<string>('INR');
  plans = signal<Plan[]>([]);

  // Computed signals
  isProcessing = computed(() => this.processing());
  isApplyingCoupon = computed(() => this.applyingCoupon());
  hasCouponApplied = computed(() => this.couponApplied() !== null);
  getCouponApplied = computed(() => this.couponApplied());
  getCouponError = computed(() => this.couponError());
  getSelectedPlan = computed(() => this.selectedPlan());
  getPlans = computed(() => this.plans());
  isFreeCoupon = computed(() => {
    const coupon = this.couponApplied();
    return coupon?.discountType === 'percentage' && coupon?.discountValue === 100;
  });

  constructor() {
    this.paymentForm = this.fb.group({
      plan: ['', Validators.required],
      couponCode: [''],
      programId: [''],
      batchId: [{value: '', disabled: true}],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  async ngOnInit() {
    this.loadPlans();
    this.loadOwnership();
    this.loadPrograms();
    await this.loadRazorpayConfig();
    this.setupCouponListener();
    if (this.razorpayKeyId()) {
      await this.loadRazorpayScript();
    }
  }

  private async loadRazorpayConfig(): Promise<void> {
    try {
      const config = await firstValueFrom(
        this.http.get<RazorpayConfig>(`${environment.apiUrl}/config/razorpay-config`)
      );
      if (config.success && config.razorpayKeyId) {
        this.razorpayKeyId.set(config.razorpayKeyId);
        this.razorpayCurrency.set(config.currency || 'INR');
        this.razorpayConfigLoaded.set(true);
      }
    } catch (error) {
      console.error('Failed to load Razorpay config:', error);
    }
  }

  activePlanIds = signal<string[]>([]);
  ownershipLoading = signal(true);
  ownershipError = signal('');
  alreadyOwned = computed(() => this.activePlanIds().includes(this.selectedPlan()?.id || ''));
  loadOwnership(): void {
    this.ownershipLoading.set(true); this.ownershipError.set('');
    this.http.get<{planIds:string[]}>(environment.apiUrl + '/payments/active-plans').subscribe({
      next: r => { this.activePlanIds.set(r.planIds); this.ownershipLoading.set(false); },
      error: () => { this.ownershipLoading.set(false); this.ownershipError.set('Unable to check your active plans. Please retry.'); }
    });
  }
  programs = signal<any[]>([]);
  batches = signal<any[]>([]);
  batchLoading = signal(false);
  programsLoading = signal(false);
  programsError = signal('');
  enrollmentError = signal('');
  loadPrograms(refresh = false): void {
    if (this.programsLoading()) return;
    const previouslyEmpty = this.programs().length === 0;
    this.programsLoading.set(true); this.programsError.set('');
    this.http.get<any>(environment.apiUrl + '/programs?activeOnly=true').subscribe({
      next: r => {
        const programs = r.data || []; this.programs.set(programs); this.programsLoading.set(false);
        const user = this.authService.getCurrentUser() as any;
        const preferred = (refresh ? this.paymentForm.value.programId : '') || this.data.programId || user?.programId?._id || user?.programId;
        const keepPlanOnly = refresh && !previouslyEmpty && !this.paymentForm.value.programId;
        const program = keepPlanOnly ? null : programs.find((p: any) => p._id === preferred) || (programs.length === 1 ? programs[0] : null);
        const programId = program?._id || '';
        if (!refresh || this.paymentForm.value.programId !== programId) {
          this.paymentForm.patchValue({programId}); this.onProgramChange(programId);
        }
      },
      error: () => { this.programsLoading.set(false); this.programsError.set('Programs could not be loaded. Retry to select a batch.'); }
    });
  }
  onProgramChange(programId: string): void {
    this.paymentForm.patchValue({batchId: ''}); this.batches.set([]); this.enrollmentError.set('');
    const batch = this.paymentForm.get('batchId')!;
    if (programId) batch.enable(); else batch.disable();
    batch.setValidators(programId ? [Validators.required] : []); batch.updateValueAndValidity();
    if (!programId) { this.batchLoading.set(false); return; }
    this.batchLoading.set(true);
    this.http.get<any>(environment.apiUrl + '/programs/' + programId + '/batches').subscribe({
      next: r => { if(this.paymentForm.value.programId !== programId) return; this.batches.set(r.data || []); this.batchLoading.set(false); if(this.data.batchId && this.batches().some(b=>b._id===this.data.batchId)){this.paymentForm.patchValue({batchId:this.data.batchId});this.data.batchId=undefined;} if (!this.batches().length) this.enrollmentError.set('No active batches for this program. Choose another program.'); },
      error: () => { if(this.paymentForm.value.programId !== programId) return; this.batchLoading.set(false); this.enrollmentError.set('Unable to load batches. Please select the program again.'); }
    });
  }
  private loadPlans(): void {
    this.http.get<Plan[]>(`${environment.apiUrl}/plans`).subscribe({
      next: (plans) => {
        this.plans.set(plans);
        if (!this.data.selectedPlan && plans.length) this.data.selectedPlan=plans[0].id;
        if (this.data.selectedPlan) {
          const defaultPlan = plans.find(p => p.id === this.data.selectedPlan);
          if (defaultPlan) {
            this.selectedPlan.set(defaultPlan);
            this.paymentForm.patchValue({ plan: defaultPlan.id });
          }
        }
      },
      error: (error) => {
        console.error('Failed to load plans:', error);
        this.snackBar.open('Failed to load plans', 'Close', { duration: 3000 });
      }
    });
  }

  private setupCouponListener(): void {
    this.paymentForm.get('couponCode')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(code => {
          if (!code || code.length < 3) {
            this.couponApplied.set(null);
            this.couponError.set(null);
            return of(null);
          }
          this.applyingCoupon.set(true);
          this.couponError.set(null);
          const plan = this.selectedPlan();
          if (!plan) {
            this.applyingCoupon.set(false);
            this.couponError.set('Please select a plan first');
            return of(null);
          }
          return this.http.post<any>(`${environment.apiUrl}/coupons/validate`, {
            code: code,
            planId: plan.id,
            amount: plan.totalAmount
          }).pipe(
            catchError(error => {
              this.applyingCoupon.set(false);
              this.couponError.set(error.error?.message || 'Invalid coupon');
              return of(null);
            })
          );
        })
      )
      .subscribe(response => {
        this.applyingCoupon.set(false);
        if (response?.success && response.coupon) {
          this.couponApplied.set(response.coupon);
          this.couponError.set(null);
          this.snackBar.open('Coupon applied!', 'Close', { duration: 2000 });
        }
      });
  }

  private loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        this.razorpayLoaded.set(true);
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.razorpayLoaded.set(true);
        resolve(true);
      };
      script.onerror = () => {
        this.razorpayLoaded.set(false);
        resolve(false);
      };
      document.body.appendChild(script);
    });
  }

  onPlanChange(planId: string): void {
    const plan = this.plans().find(p => p.id === planId);
    if (plan) {
      this.selectedPlan.set(plan);
      this.paymentForm.patchValue({ couponCode: '' });
      this.couponApplied.set(null);
      this.couponError.set(null);
    }
  }

  getPlanAmount(): number {
    return this.selectedPlan()?.totalAmount || 0;
  }

  getDiscountAmount(): number {
    const coupon = this.couponApplied();
    const plan = this.selectedPlan();
    if (!coupon || !plan) return 0;
    return Math.min(plan.totalAmount, Math.max(0, coupon.discountAmount));
  }

  calculateTotal(): number {
    return this.getPlanAmount() - this.getDiscountAmount();
  }

  calculateTotalInPaise(): number {
    return Math.round(this.calculateTotal() * 100);
  }

  isFreePlan(): boolean {
    return this.calculateTotal() === 0;
  }

  isDisabled(): boolean {
    return this.ownershipLoading() || !!this.ownershipError() || this.alreadyOwned() || this.processing() || this.paymentForm.invalid || !this.selectedPlan() || this.batchLoading() || (!this.isFreePlan() && !this.razorpayConfigLoaded());
  }

  isCouponInputDisabled(): boolean {
    return this.processing() || this.couponApplied() !== null;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  async onPayNow(): Promise<void> {
    if (this.isDisabled()) return;
    if (this.paymentForm.invalid) {
      this.markFormGroupTouched(this.paymentForm);
      return;
    }

    if (!this.selectedPlan()) {
      this.snackBar.open('Please select a plan', 'Close', { duration: 3000 });
      return;
    }

    if (!this.isFreePlan() && !this.razorpayConfigLoaded()) {
      this.snackBar.open('Payment configuration not loaded', 'Close', { duration: 3000 });
      return;
    }

    if (this.isFreePlan()) {
      this.activateFreePlan();
      return;
    }

    this.processing.set(true);

    const isLoaded = await this.loadRazorpayScript();
    if (!isLoaded) {
      this.snackBar.open('Failed to load payment gateway', 'Close', { duration: 5000 });
      this.processing.set(false);
      return;
    }

    this.createOrder().subscribe({
      next: (orderResponse: any) => {
        if (!orderResponse?.orderId) {
          this.snackBar.open('Invalid order response', 'Close', { duration: 5000 });
          this.processing.set(false);
          return;
        }
        setTimeout(() => this.openRazorpayCheckout(orderResponse), 100);
      },
      error: (error) => {
        console.error('Order creation failed:', error);
        this.processing.set(false);
        this.snackBar.open(error.error?.message || 'Failed to create order', 'Close', { duration: 5000 });
      }
    });
  }

  private createOrder() {
    const plan = this.selectedPlan();
    const coupon = this.couponApplied();
    
    const orderData = {
      planId: plan?.id || '',
      couponCode: coupon?.code || '',
      programId: this.paymentForm.value.programId || undefined,
      batchId: this.paymentForm.value.batchId || undefined
    };

    return this.http.post(`${environment.apiUrl}/payments/create-order`, orderData);
  }

  private openRazorpayCheckout(orderData: any): void {
    const plan = this.selectedPlan();
    const orderId = orderData.orderId;
    
    if (!orderId?.startsWith('order_')) {
      this.snackBar.open('Invalid order ID', 'Close');
      this.processing.set(false);
      return;
    }

    const options = {
      key: this.razorpayKeyId(),
      amount: orderData.amount,
      currency: 'INR',
      name: 'ThinkCivil',
      description: plan?.name || 'Plan Payment',
      image: 'https://thinkcivil.com/assets/logo.png',
      order_id: orderId,
      handler: (response: any) => this.handlePaymentSuccess(response),
      modal: {
        ondismiss: () => {
          this.processing.set(false);
          this.snackBar.open('Payment cancelled', 'Close', { duration: 3000 });
        }
      },
      prefill: {
        name: this.authService.getCurrentUser()?.fullName || '',
        email: this.authService.getCurrentUser()?.email || '',
        contact: this.authService.getCurrentUser()?.phone || ''
      },
      theme: { color: '#3f51b5' }
    };

    try {
      const razorpay = new Razorpay(options);
      razorpay.open();
      razorpay.on('payment.failed', (response: any) => {
        console.error('Payment failed:', response.error);
        this.processing.set(false);
        this.snackBar.open(`Payment failed: ${response.error.description}`, 'Close');
      });
    } catch (error) {
      console.error('Failed to open Razorpay:', error);
      this.processing.set(false);
      this.snackBar.open('Failed to open payment gateway', 'Close');
    }
  }

  private activateFreePlan(): void {
    this.processing.set(true);
    const plan = this.selectedPlan();
    const coupon = this.couponApplied();

    this.http.post(`${environment.apiUrl}/payments/activate-free-plan`, {
      planId: plan?.id,
      planName: plan?.name,
      programId: this.paymentForm.value.programId || undefined,
      batchId: this.paymentForm.value.batchId || undefined,
      couponCode: coupon?.code,
      discountAmount: this.getDiscountAmount(),
      isFree: true
    }).subscribe({
      next: (response: any) => {
        this.processing.set(false);
        this.snackBar.open('🎉 Plan activated successfully!', 'Close', { duration: 6000 });
        this.finishPlanActivation(true);
      },
      error: (error) => {
        this.processing.set(false);
        this.snackBar.open(error.error?.message || 'Activation failed', 'Close', { duration: 5000 });
      }
    });
  }

  private handlePaymentSuccess(response: any): void {
    const verificationData = {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
      planId: this.selectedPlan()?.id,
      amount: this.calculateTotal(),
      couponCode: this.couponApplied()?.code,
      discountAmount: this.getDiscountAmount()
    };

    this.verifyPayment(verificationData).subscribe({
      next: (verificationResponse: any) => {
        this.processing.set(false);
        if (verificationResponse.success) {
          this.snackBar.open('🎉 Payment successful!', 'Close', { duration: 6000 });
          this.finishPlanActivation(false);
        }
      },
      error: (error) => {
        this.processing.set(false);
        this.snackBar.open('Payment verification failed', 'Close', { duration: 5000 });
      }
    });
  }

  private verifyPayment(verificationData: any) {
    return this.http.post(`${environment.apiUrl}/payments/verify-payment`, verificationData);
  }

  private finishPlanActivation(isFree: boolean): void {
    this.authService.refreshUser().subscribe({
      next: () => {
        this.processing.set(false);
        this.snackBar.open('Plan activated successfully!', 'Close', { duration: 6000 });
        this.dialogRef.close({ success: true, isFree });
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.processing.set(false);
        this.dialogRef.close({ success: true, isFree });
        this.snackBar.open('Plan activated. Refresh the page to update your menu.', 'Close', { duration: 6000 });
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }

  removeCoupon(): void {
    this.paymentForm.patchValue({ couponCode: '' });
    this.couponApplied.set(null);
    this.couponError.set(null);
  }

  logout() {
    this.authService.logout();
  }
}
