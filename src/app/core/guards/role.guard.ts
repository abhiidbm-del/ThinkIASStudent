// guards/role.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];
  const currentUser = authService.currentUser();

  // If no user is logged in, redirect to login
  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  // Check if user has the required role
  if (currentUser.role === expectedRole) {
    return true;
  }

  // If user doesn't have required role, redirect to dashboard with appropriate message
  console.warn(`Access denied. Required role: ${expectedRole}, User role: ${currentUser.role}`);
  router.navigate(['/dashboard']);
  return false;
};