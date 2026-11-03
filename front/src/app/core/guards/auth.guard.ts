import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/data-access/auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.currentUser()) {
    return true;
  }

  return authService.restoreSession().pipe(
    map(() => true),
    catchError(() => {
      authService.clearSession();
      return of(router.createUrlTree(['/login']));
    }),
  );
};
