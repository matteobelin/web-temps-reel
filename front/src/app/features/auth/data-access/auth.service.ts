import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  type UserInputRegistrationType,
  type UserInputType,
  type UserOutputType,
} from 'shared';
import { firstValueFrom } from 'rxjs';

import { API_URL } from '../../../core/config/api.config';
const USER_STORAGE_KEY = 'current-user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<UserOutputType | null>(this.readStoredUser());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  login(credentials: UserInputType) {
    return this.http.post<UserOutputType>(`${API_URL}/auth/login`, credentials, {
      withCredentials: true,
    });
  }

  register(credentials: UserInputRegistrationType) {
    return this.http.post<UserOutputType>(`${API_URL}/auth/register`, credentials, {
      withCredentials: true,
    });
  }

  setUser(user: UserOutputType): void {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    this.currentUser.set(user);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post(`${API_URL}/auth/logout`, {}, { withCredentials: true }));
    sessionStorage.removeItem(USER_STORAGE_KEY);
    this.currentUser.set(null);
    await this.router.navigate(['/login']);
  }

  private readStoredUser(): UserOutputType | null {
    const storedUser = sessionStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as UserOutputType;
    } catch {
      sessionStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }
}
