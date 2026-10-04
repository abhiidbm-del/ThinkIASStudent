import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CountdownComponent, CountdownConfig } from 'ngx-countdown';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-register',
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
    MatIconModule,
    // CountdownComponent // Import as standalone component
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  registerForm: FormGroup;
  loading = signal(false);
  sendingOTP = signal(false);
  verifyingOTP = signal(false);
  otpSent = signal(false);
  otpVerified = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  showOTPField = signal(false);
  
  // Countdown configuration
  countdownConfig: CountdownConfig = { 
    leftTime: 600, // 10 minutes in seconds
    format: 'mm:ss',
    demand: true,
    prettyText: (text) => {
      return text.split(':').map(segment => 
        `<span style="font-size: 14px; color: #4CAF50;">${segment}</span>`
      ).join(':');
    }
  };
  
  remainingTime = signal(600);
  resendDisabled = signal(false);
  countdownRunning = signal(false);

  constructor() {
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    }, { validators: this.passwordMatchValidator });

    // Hide OTP field initially
    this.registerForm.get('otp')?.disable();
  }

  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Send OTP
  sendOTP() {
    if (this.registerForm.get('email')?.invalid) {
      this.snackBar.open('Please enter a valid email', 'Close', { duration: 3000 });
      return;
    }

    this.sendingOTP.set(true);
    this.authService.sendOTP(this.registerForm.get('email')?.value).subscribe({
      next: (response) => {
        this.sendingOTP.set(false);
        this.otpSent.set(true);
        this.showOTPField.set(true);
        this.registerForm.get('otp')?.enable();
        this.resendDisabled.set(true);
        this.countdownRunning.set(true);
        
        this.snackBar.open('OTP sent to your email!', 'Close', { duration: 3000 });
        
        // Enable resend after 60 seconds
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

  // Verify OTP
  verifyOTP() {
    if (this.registerForm.get('otp')?.invalid) {
      this.snackBar.open('Please enter a valid 6-digit OTP', 'Close', { duration: 3000 });
      return;
    }

    this.verifyingOTP.set(true);
    const { email, otp } = this.registerForm.value;
    
    this.authService.verifyOTP(email, otp).subscribe({
      next: (response) => {
        this.verifyingOTP.set(false);
        this.otpVerified.set(true);
        this.countdownRunning.set(false);
        this.snackBar.open('Email verified successfully!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        this.verifyingOTP.set(false);
        this.snackBar.open(error.error?.message || 'Invalid OTP', 'Close', { duration: 3000 });
      }
    });
  }

  // Resend OTP
  resendOTP() {
    if (this.resendDisabled()) return;
    
    this.sendOTP();
  }

  // Handle countdown events
  handleCountdownEvent(event: any) {
    if (event.action === 'notify') {
      this.remainingTime.set(event.left / 1000);
    }
    
    if (event.action === 'done') {
      this.otpSent.set(false);
      this.showOTPField.set(false);
      this.registerForm.get('otp')?.disable();
      this.registerForm.get('otp')?.setValue('');
      this.otpVerified.set(false);
      this.countdownRunning.set(false);
      this.snackBar.open('OTP expired. Please request a new one.', 'Close', { duration: 3000 });
    }
  }

  // Format remaining time
  formatRemainingTime(): string {
    const minutes = Math.floor(this.remainingTime() / 60);
    const seconds = Math.floor(this.remainingTime() % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  // Toggle password visibility
  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  // Start countdown
  startCountdown() {
    this.countdownRunning.set(true);
  }

  // Stop countdown
  stopCountdown() {
    this.countdownRunning.set(false);
  }

  // Final registration
  onSubmit() {
    if (!this.otpVerified()) {
      this.snackBar.open('Please verify your email first', 'Close', { duration: 3000 });
      return;
    }

    if (this.registerForm.valid) {
      this.loading.set(true);
      
      this.authService.register(this.registerForm.value).subscribe({
        next: (response) => {
          this.authService.setAuthData(response);
          this.router.navigate(['/dashboard']);
          this.snackBar.open('Registration successful! Welcome to ThinkCivil IAS', 'Close', { duration: 5000 });
        },
        error: (error) => {
          this.loading.set(false);
          this.snackBar.open(error.error?.message || 'Registration failed', 'Close', { duration: 3000 });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    } else {
      this.snackBar.open('Please fill all required fields correctly', 'Close', { duration: 3000 });
    }
  }
}