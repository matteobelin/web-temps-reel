import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => vi.useRealTimers());

  it('shows a success toast by default and clears it after the timeout', () => {
    service.show('Saved');
    expect(service.toast()).toEqual({ message: 'Saved', type: 'success' });

    vi.advanceTimersByTime(3499);
    expect(service.toast()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(service.toast()).toBeNull();
  });

  it('replaces an existing toast and supports error notifications', () => {
    service.success('Saved');
    service.error('Failed');

    expect(service.toast()).toEqual({ message: 'Failed', type: 'error' });
    vi.advanceTimersByTime(3500);
    expect(service.toast()).toBeNull();
  });
});
