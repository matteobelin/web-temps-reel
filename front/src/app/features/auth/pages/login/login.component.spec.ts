import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../data-access/auth.service';
import { ToastService } from '../../../../core/ui/toast/toast.service';

describe('LoginComponent', () => {
  const auth = {
    login: vi.fn(),
    setUser: vi.fn(),
  };
  const toast = { error: vi.fn() };
  const router = { navigate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: ToastService, useValue: toast },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('reports invalid forms without calling the API', async () => {
    const fixture = TestBed.createComponent(LoginComponent);

    await fixture.componentInstance.submit();

    expect(auth.login).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Renseignez correctement tous les champs.');
  });

  it('stores the user and navigates after a successful login', async () => {
    auth.login.mockReturnValue(of({ id: 1, matricule: 'A001' }));
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({
      matricule: 'A001',
      password: 'password123',
      restaurantCode: 'PARIS',
    });

    await fixture.componentInstance.submit();

    expect(auth.login).toHaveBeenCalledWith({
      matricule: 'A001',
      password: 'password123',
      restaurantCode: 'PARIS',
    });
    expect(auth.setUser).toHaveBeenCalledWith({ id: 1, matricule: 'A001' });
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
