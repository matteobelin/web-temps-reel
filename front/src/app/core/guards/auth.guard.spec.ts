import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/data-access/auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const router = {
    createUrlTree: vi.fn(() => ({ login: true })),
  };
  const auth = {
    currentUser: vi.fn(),
    restoreSession: vi.fn(),
    clearSession: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows an already authenticated user synchronously', () => {
    auth.currentUser.mockReturnValue({ id: 1 });

    expect(TestBed.runInInjectionContext(() => authGuard({} as never, {} as never))).toBe(true);
    expect(auth.restoreSession).not.toHaveBeenCalled();
  });

  it('restores a missing session', async () => {
    auth.currentUser.mockReturnValue(null);
    auth.restoreSession.mockReturnValue(of({ id: 1 }));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    await expect(firstValueFrom(result as ReturnType<typeof of>)).resolves.toBe(true);
  });

  it('redirects and clears the session when restoration fails', async () => {
    auth.currentUser.mockReturnValue(null);
    auth.restoreSession.mockReturnValue(throwError(() => new Error('Unauthorized')));

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

    await expect(firstValueFrom(result as ReturnType<typeof of>)).resolves.toEqual({ login: true });
    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
