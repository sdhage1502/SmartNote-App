import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService); // Inject AuthService
  const router = inject(Router);           // Inject Router

  return authService.isAuthenticated().pipe(
    take(1),                               // Only take the first value
    map((isAuthenticated) => {
      if (isAuthenticated) return true;    // ✅ Allow access
      return router.createUrlTree(['/login']); // ❌ Redirect to login
    })
  );
};
