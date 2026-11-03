import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(OrdersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('fetches orders with credentials', () => {
    service.getOrders().subscribe((orders) => expect(orders).toEqual([]));

    const request = http.expectOne('/api/v1/orders');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });

  it('creates, advances and cancels orders', () => {
    const order = { table: 4, meals: [] } as never;

    service.createOrder(order).subscribe();
    const createRequest = http.expectOne('/api/v1/orders/create');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(order);
    expect(createRequest.request.headers.get('Idempotency-Key')).toMatch(/.+/);
    createRequest.flush({});

    service.advanceOrder(12).subscribe();
    const advanceRequest = http.expectOne('/api/v1/orders/12/advance');
    expect(advanceRequest.request.method).toBe('PATCH');
    advanceRequest.flush({});

    service.cancelOrder(12).subscribe();
    const cancelRequest = http.expectOne('/api/v1/orders/12/cancel');
    expect(cancelRequest.request.method).toBe('PATCH');
    cancelRequest.flush({});
  });

  it('reconnects the event stream with the last received event id', async () => {
    class FakeEventSource {
      static instances: FakeEventSource[] = [];
      onmessage: ((event: MessageEvent<string>) => void) | null = null;
      onerror: (() => void) | null = null;
      close = vi.fn();

      constructor(public readonly url: string) {
        FakeEventSource.instances.push(this);
      }
    }
    vi.stubGlobal('EventSource', FakeEventSource);

    const subscription = service.orderEvents().subscribe({
      next: vi.fn(),
    });
    const first = FakeEventSource.instances[0];
    first.onmessage?.(new MessageEvent('message', {
      data: JSON.stringify({ id: 1 }),
      lastEventId: '41',
    }));
    first.onerror?.();

    await new Promise((resolve) => setTimeout(resolve, 550));

    expect(FakeEventSource.instances[1].url).toBe('/api/v1/events?lastEventId=41');
    subscription.unsubscribe();
    expect(first.close).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
