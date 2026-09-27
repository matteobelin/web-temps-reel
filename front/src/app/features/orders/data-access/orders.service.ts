import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type OrderInputType, type OrderOutputType } from 'shared';
import { Observable } from 'rxjs';

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
    return new Observable((subscriber) => {
      const source = new EventSource(`${API_URL}/events`, { withCredentials: true });
      source.onmessage = (event) => {
        try {
          subscriber.next(JSON.parse(event.data) as OrderOutputType);
        } catch (error) {
          subscriber.error(error);
          source.close();
        }
      };
      source.onerror = () => {
        subscriber.error(new Error('Order event stream disconnected'));
      };

      return () => source.close();
    });
  }
}
