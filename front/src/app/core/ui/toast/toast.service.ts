import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error';

export interface Toast {
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toast = signal<Toast | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  show(message: string, type: ToastType = 'success'): void {
    this.toast.set({ message, type });
    this.clearTimeout();
    this.timeoutId = setTimeout(() => {
      this.toast.set(null);
      this.timeoutId = null;
    }, 3500);
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
