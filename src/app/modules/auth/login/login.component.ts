import { Component, inject, signal, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  private dialog = inject(MatDialog);
  @ViewChild('inactiveDialog') inactiveDialog!: TemplateRef<unknown>;
  loginForm: FormGroup;
  loading = signal(false);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit() {
  if (!this.loginForm.valid) return;

  this.loading.set(true);

  const email = String(this.loginForm.value.email || '').trim();
  const password = String(this.loginForm.value.password || '');
  this.authService.login({ email, password }).subscribe({
    next: (response: any) => {
      this.loading.set(false);

      // ❌ BLOCK non-students FIRST
      if (response?.user?.role !== 'student') {
        this.snackBar.open(
          'Access denied. Only students are allowed to login.',
          'Close',
          { duration: 3000 }
        );

        // VERY IMPORTANT
        this.authService.logout();
        return;
      }

      // ✅ Allow student
      this.authService.setAuthData(response);
      const returnUrl=this.route.snapshot.queryParamMap.get('returnUrl');
      this.router.navigateByUrl(returnUrl?.startsWith('/program/') ? returnUrl : '/dashboard');
      this.snackBar.open('Login successful!', 'Close', {
        duration: 3000
      });
    },

    error: (error) => {
      this.loading.set(false);
      if (error?.error?.code === 'ACCOUNT_INACTIVE') { this.dialog.open(this.inactiveDialog, {width: '440px', maxWidth: '95vw'}); return; }
      this.snackBar.open(
        error?.error?.message || 'Login failed',
        'Close',
        { duration: 3000 }
      );
    }
  });
}

}