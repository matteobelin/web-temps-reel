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

    const request = http.expectOne('/api/orders');
    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });

  it('creates, advances and cancels orders', () => {
    const order = { table: 4, meals: [] } as never;

    service.createOrder(order).subscribe();
    const createRequest = http.expectOne('/api/orders/create');
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(order);
    createRequest.flush({});

    service.advanceOrder(12).subscribe();
    const advanceRequest = http.expectOne('/api/orders/12/advance');
    expect(advanceRequest.request.method).toBe('PATCH');
    advanceRequest.flush({});

    service.cancelOrder(12).subscribe();
    const cancelRequest = http.expectOne('/api/orders/12/cancel');
    expect(cancelRequest.request.method).toBe('PATCH');
    cancelRequest.flush({});
  });
});
