import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChatMessageOutputType } from 'shared';
import type { Socket } from 'socket.io-client';
import { AuthService } from '../../auth/data-access/auth.service';
import { ChatService } from '../data-access/chat.service';
import { ToastService } from '../../../core/ui/toast/toast.service';

@Component({
  selector: 'app-chat-page',
  imports: [FormsModule],
  templateUrl: './chat-page.component.html',
  styleUrl: './chat-page.component.scss',
})
export class ChatPageComponent {
  readonly auth = inject(AuthService);
  private readonly chatService = inject(ChatService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messagesElement = viewChild<ElementRef<HTMLElement>>('messagesContainer');
  private socket: Socket | null = null;

  readonly messages = signal<ChatMessageOutputType[]>([]);
  readonly content = signal('');
  readonly isLoading = signal(true);
  readonly isSending = signal(false);
  readonly isConnected = signal(false);

  constructor() {
    this.loadHistory();
    this.connect();
    this.destroyRef.onDestroy(() => this.socket?.disconnect());
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.chatService.getHistory().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (messages) => {
        this.messages.set(messages);
        this.isLoading.set(false);
        this.scrollToBottom();
      },
      error: () => {
        this.toast.error("Impossible de charger l'historique du chat.");
        this.isLoading.set(false);
      },
    });
  }

  sendMessage(): void {
    const value = this.content().trim();
    if (!value || value.length > 1000 || this.isSending() || !this.socket?.connected) {
      return;
    }

    this.isSending.set(true);
    this.socket.emit(
      'message:send',
      { content: value },
      (response: { ok?: boolean; error?: string }) => {
        this.isSending.set(false);
        if (response?.ok) {
          this.content.set('');
          return;
        }
        this.toast.error(response?.error ?? "Impossible d'envoyer le message.");
      },
    );
  }

  onContentChange(value: string): void {
    this.content.set(value);
  }

  isMine(message: ChatMessageOutputType): boolean {
    return message.authorMatricule === this.auth.currentUser()?.matricule;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private connect(): void {
    this.socket = this.chatService.connect();
    this.socket.on('connect', () => {
      this.isConnected.set(true);
    });
    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      this.isSending.set(false);
    });
    this.socket.on('connect_error', () => {
      this.isConnected.set(false);
      this.toast.error('Connexion au chat impossible.');
    });
    this.socket.on('message:new', (message: ChatMessageOutputType) => {
      if (!this.messages().some((item) => item.id === message.id)) {
        this.messages.update((items) => [...items, message]);
        this.scrollToBottom();
      }
    });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.messagesElement()?.nativeElement;
      if (element) {
        element.scrollTop = element.scrollHeight;
      }
    });
  }
}
