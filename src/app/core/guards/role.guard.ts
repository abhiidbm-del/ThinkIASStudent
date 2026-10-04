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

  if (currentUser.role !== expectedRole) {
    console.warn(`Access denied. Required role: ${expectedRole}, User role: ${currentUser.role}`);
    router.navigate(['/dashboard']);
    return false;
  }

  const requiredPlan = route.data['plan'] || route.data['kind'] || route.data['audience'] || route.data['section'];
  if (requiredPlan === 'pre' || requiredPlan === 'mains') {
    const type = currentUser.type;
    if (type === 'combo' || type === requiredPlan) {
      return true;
    }
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};