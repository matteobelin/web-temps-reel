import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { AuthService } from '../features/auth/data-access/auth.service';
import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent', () => {
  const auth = { logout: vi.fn().mockResolvedValue(undefined) };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
  });

  it('delegates logout to the authentication service', () => {
    const component = TestBed.runInInjectionContext(() => new AppShellComponent());

    component.logout();

    expect(auth.logout).toHaveBeenCalledOnce();
  });
});
