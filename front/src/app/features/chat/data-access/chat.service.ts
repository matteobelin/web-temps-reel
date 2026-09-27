import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { type ChatMessageOutputType } from 'shared';
import { io, type Socket } from 'socket.io-client';

import { API_URL } from '../../../core/config/api.config';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly http = inject(HttpClient);

  getHistory(before?: number) {
    let params = new HttpParams();
    if (before) {
      params = params.set('before', before);
    }
    return this.http.get<ChatMessageOutputType[]>(`${API_URL}/chat/messages`, {
      params,
      withCredentials: true,
    });
  }

  connect(): Socket {
    return io('/chat', {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket'],
    });
  }
}
