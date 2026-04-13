import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastMessage {
  text: string;
  type: ToastType;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly messageSubject = new BehaviorSubject<ToastMessage | null>(null);
  readonly message$ = this.messageSubject.asObservable();
  private timer: ReturnType<typeof setTimeout> | null = null;

  private normalizeText(text: string): string {
    return String(text ?? '')
      .replace(/[✅❌⚠️ℹ️]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  show(text: string, type: ToastType = 'info', durationMs: number = 3500): void {
    const normalized = this.normalizeText(text);
    this.messageSubject.next({ text: normalized || 'Notification', type });

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.clear();
    }, durationMs);
  }

  clear(): void {
    this.messageSubject.next(null);
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
