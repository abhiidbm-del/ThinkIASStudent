import { Component, inject, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { interval, Subscription } from 'rxjs';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.css'
})
export class ForgotPasswordComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private timerSubscription?: Subscription;

  // Form steps
  currentStep = signal<'email' | 'otp' | 'reset'>('email');
  
  // Forms
  emailForm: FormGroup;
  otpForm: FormGroup;
  resetForm: FormGroup;
  
  // Loading states
  sendingOTP = signal(false);
  verifyingOTP = signal(false);
  resettingPassword = signal(false);
  
  // OTP state
  otpSent = signal(false);
  otpVerified = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  
  // Timer
  remainingTime = signal(600);
  resendDisabled = signal(false);
  email = signal('');

  constructor() {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.otpForm = this.fb.group({
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });

    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  // Start timer
  startTimer() {
    this.remainingTime.set(600);
    
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
    
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingTime() > 0) {
        this.remainingTime.update(time => time - 1);
      } else {
        this.timerSubscription?.unsubscribe();
        this.otpSent.set(false);
        this.snackBar.open('OTP expired. Please request a new one.', 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
    }
  }

  // Step 1: Send OTP
  sendPasswordResetOTP() {
    if (this.emailForm.invalid) {
      this.snackBar.open('Please enter a valid email', 'Close', { duration: 3000 });
      return;
    }

    this.sendingOTP.set(true);
    const email = this.emailForm.get('email')?.value;
    this.email.set(email);

    this.authService.sendPasswordResetOTP(email).subscribe({
      next: (response) => {
        this.sendingOTP.set(false);
        this.otpSent.set(true);
        this.currentStep.set('otp');
        this.resendDisabled.set(true);
        this.startTimer();
        
        this.snackBar.open('OTP sent to your email!', 'Close', { duration: 3000 });
        
        setTimeout(() => {
          this.resendDisabled.set(false);
        }, 60000);
      },
      error: (error) => {
        this.sendingOTP.set(false);
        this.snackBar.open(error.error?.message || 'Failed to send OTP', 'Close', { duration: 3000 });
      }
    });
  }

  // Step 2: Verify OTP
  verifyPasswordResetOTP() {
    if (this.otpForm.invalid) {
      this.snackBar.open('Please enter a valid 6-digit OTP', 'Close', { duration: 3000 });
      return;
    }

    this.verifyingOTP.set(true);
    const otp = this.otpForm.get('otp')?.value;

    this.authService.verifyPasswordResetOTP(this.email(), otp).subscribe({
      next: (response) => {
        this.verifyingOTP.set(false);
        this.otpVerified.set(true);
        this.currentStep.set('reset');
        this.timerSubscription?.unsubscribe();
        
        this.snackBar.open('OTP verified successfully!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.verifyingOTP.set(false);
        this.snackBar.open(error.error?.message || 'Invalid OTP', 'Close', { duration: 3000 });
      }
    });
  }

  // Step 3: Reset Password
  resetPassword() {
    if (this.resetForm.invalid) {
      this.snackBar.open('Please fill all fields correctly', 'Close', { duration: 3000 });
      return;
    }

    this.resettingPassword.set(true);
    const { newPassword, confirmPassword } = this.resetForm.value;
    const otp = this.otpForm.get('otp')?.value;

    this.authService.resetPassword(this.email(), otp, newPassword, confirmPassword).subscribe({
      next: (response) => {
        this.resettingPassword.set(false);
        this.snackBar.open('Password reset successful! You can now login.', 'Close', { duration: 5000 });
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.resettingPassword.set(false);
        this.snackBar.open(error.error?.message || 'Failed to reset password', 'Close', { duration: 3000 });
      }
    });
  }

  // Resend OTP
  resendOTP() {
    if (this.resendDisabled()) return;
    this.sendPasswordResetOTP();
  }

  // Format remaining time
  formatRemainingTime(): string {
    const minutes = Math.floor(this.remainingTime() / 60);
    const seconds = Math.floor(this.remainingTime() % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // Go back to previous step
  goBack() {
    if (this.currentStep() === 'reset') {
      this.currentStep.set('otp');
    } else if (this.currentStep() === 'otp') {
      this.currentStep.set('email');
    }
  }
}