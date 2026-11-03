import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type OrderInputType, type OrderOutputType } from 'shared';
import { Observable, defer, timer } from 'rxjs';
import { retry } from 'rxjs/operators';

import { API_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);

  getOrders() {
    return this.http.get<OrderOutputType[]>(`${API_URL}/orders`, {
      withCredentials: true,
    });
  }

  createOrder(order: OrderInputType) {
    return this.http.post<OrderOutputType>(`${API_URL}/orders/create`, order, {
      withCredentials: true,
      headers: { 'Idempotency-Key': crypto.randomUUID() },
    });
  }

  advanceOrder(orderId: number) {
    return this.http.patch<OrderOutputType>(`${API_URL}/orders/${orderId}/advance`, {}, {
      withCredentials: true,
    });
  }

  cancelOrder(orderId: number) {
    return this.http.patch<OrderOutputType>(`${API_URL}/orders/${orderId}/cancel`, {}, {
      withCredentials: true,
    });
  }

  orderEvents(): Observable<OrderOutputType> {
    let lastEventId = '';
    const connect = defer(() => new Observable<OrderOutputType>((subscriber) => {
      const query = lastEventId ? `?lastEventId=${encodeURIComponent(lastEventId)}` : '';
      const source = new EventSource(`${API_URL}/events${query}`, { withCredentials: true });
      const handleEvent = (event: MessageEvent<string>) => {
        try {
          if (event.lastEventId) lastEventId = event.lastEventId;
          subscriber.next(JSON.parse(event.data) as OrderOutputType);
        } catch (error) {
          subscriber.error(error);
          source.close();
        }
      };
      source.onmessage = handleEvent;
      source.onerror = () => {
        source.close();
        subscriber.error(new Error('Order event stream disconnected'));
      };

      return () => {
        source.onmessage = null;
        source.close();
      };
    }));

    return connect.pipe(
      retry({
        delay: (_error, retryCount) => timer(Math.min(30_000, 500 * 2 ** Math.min(retryCount - 1, 6))),
      }),
    );
  }
}
