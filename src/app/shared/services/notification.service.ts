import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment';
import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';

export interface StudentNotification { titleHindi?: string; bodyHindi?: string; _id: string; title: string; body: string; link?: string; type: string; isRead: boolean; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<StudentNotification[]>([]);
  readonly unread = signal(0);
  constructor(private readonly http: HttpClient) {}
  load() {
    this.http.get<{ data: StudentNotification[] }>(`${environment.apiUrl}/notifications`).subscribe({ next: ({ data }) => {
      this.notifications.set(data); this.unread.set(data.filter(item => !item.isRead).length);
    }});
  }
  markRead(item: StudentNotification) {
    if (!item.isRead) this.http.patch(`${environment.apiUrl}/notifications/${item._id}/read`, {}).subscribe(() => this.load());
  }
  async enablePush() {
    if (!await isSupported()) throw new Error('Push notifications are not supported in this browser.');
    if (!environment.firebase.apiKey || !environment.firebaseVapidKey) throw new Error('Firebase web configuration is missing.');
    if (await Notification.requestPermission() !== 'granted') throw new Error('Notification permission was not granted.');
    const app = getApps()[0] || initializeApp(environment.firebase);
    const messaging = getMessaging(app);
    const encodedConfig = btoa(JSON.stringify(environment.firebase));
    const serviceWorkerRegistration = await navigator.serviceWorker.register(`/firebase-messaging-sw.js?config=${encodeURIComponent(encodedConfig)}`);
    const token = await getToken(messaging, { vapidKey: environment.firebaseVapidKey, serviceWorkerRegistration });
    await this.http.post(`${environment.apiUrl}/notifications/device-token`, { token, platform: 'web', language: localStorage.getItem('preferredLanguage') === 'hi' ? 'hi' : 'en' }).toPromise();
    onMessage(messaging, () => this.load());
  }
}
