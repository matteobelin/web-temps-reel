import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { AuthService } from './auth.service';

const user = {
  id: 1,
  matricule: 'A001',
  name: 'Alice',
  role: 'WAITER' as const,
  restaurantCode: 'PARIS',
  restaurantName: 'Paris',
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  const router = { navigate: vi.fn().mockResolvedValue(true) };

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Router, useValue: router },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.clearAllMocks();
  });

  it('stores and clears the current user', () => {
    service.setUser(user);
    expect(service.currentUser()).toEqual(user);
    expect(JSON.parse(sessionStorage.getItem('current-user')!)).toEqual(user);

    service.clearSession();
    expect(service.currentUser()).toBeNull();
    expect(sessionStorage.getItem('current-user')).toBeNull();
  });

  it('restores a session from the API and stores the user', () => {
    service.restoreSession().subscribe((result) => expect(result).toEqual(user));

    const request = http.expectOne('/api/auth/me');
    expect(request.request.withCredentials).toBe(true);
    request.flush(user);

    expect(service.currentUser()).toEqual(user);
  });

  it('clears the session and navigates after logout', async () => {
    service.setUser(user);

    const logout = service.logout();
    const request = http.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    request.flush({});
    await logout;

    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
