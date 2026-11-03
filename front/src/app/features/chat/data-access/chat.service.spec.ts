import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { io } from 'socket.io-client';
import { ChatService } from './chat.service';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ connected: false })),
}));

describe('ChatService', () => {
  let service: ChatService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ChatService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('gets history with optional pagination', () => {
    service.getHistory(25).subscribe((messages) => expect(messages).toEqual([]));

    const request = http.expectOne((req) => req.url === '/api/v1/chat/messages');
    expect(request.request.params.get('before')).toBe('25');
    expect(request.request.withCredentials).toBe(true);
    request.flush([]);
  });

  it('does not send a before parameter for the first page', () => {
    service.getHistory().subscribe();

    const request = http.expectOne('/api/v1/chat/messages');
    expect(request.request.params.has('before')).toBe(false);
    request.flush([]);
  });

  it('connects to the chat namespace with websocket credentials', () => {
    const socket = { connected: false };
    const socketIo = vi.mocked(io);
    socketIo.mockReturnValue(socket as never);

    expect(service.connect()).toBe(socket);
    expect(socketIo).toHaveBeenCalledWith('/chat', {
      path: '/socket.io',
      withCredentials: true,
      transports: ['websocket'],
    });
  });
});
