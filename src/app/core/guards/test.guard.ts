import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { TestService } from '../../shared/services/test.service';

@Injectable({
  providedIn: 'root'
})
export class TestGuard implements CanActivate {
  constructor(
    private testService: TestService,
    private router: Router
  ) {}

  canActivate(route: any) {
    const testId = route.params['id'];
    return true;
    
    // return this.testService.canStartTest(testId).pipe(
    //   map(canStart => {
    //     if (canStart) {
    //       return true;
    //     } else {
    //       this.router.navigate(['/live-tests']);
    //       return false;
    //     }
    //   }),
    //   catchError(() => {
    //     this.router.navigate(['/live-tests']);
    //     return of(false);
    //   })
    // );
  }
}