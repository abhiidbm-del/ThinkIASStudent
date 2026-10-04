import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { environment } from '../../../../environment/environment';

interface ProctorSession {
  _id: string;
  student?: { fullName?: string; email?: string; phone?: string };
  test?: { title?: string; name?: string };
  testModel: 'Test' | 'LiveTest';
  status: string;
  online: boolean;
  lastHeartbeatAt?: string;
  createdAt: string;
  recordingUrl?: string;
  latestSnapshotUrl?: string;
  snapshotCount: number;
  violations?: Array<{ type: string; occurredAt: string }>;
}

@Component({
  selector: 'app-exam-monitoring',
  standalone: true,
  imports: [TranslatePipe, CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './exam-monitoring.component.html',
  styleUrl: './exam-monitoring.component.css'
})
export class ExamMonitoringComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient);
  @ViewChild('liveVideo') liveVideo?: ElementRef<HTMLVideoElement>;
  sessions: ProctorSession[] = [];
  selected?: ProctorSession;
  loading = true;
  error = '';
  liveState = '';
  private refreshTimer?: number;
  private answerTimer?: number;
  private peer?: RTCPeerConnection;
  private requestId = '';
  private iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

  ngOnInit(): void {
    this.load();
    this.loadIceConfig();
    this.refreshTimer = window.setInterval(() => this.load(false), 10000);
  }

  load(showLoader = true): void {
    if (showLoader) this.loading = true;
    this.http.get<{ data: ProctorSession[] }>(`${environment.apiUrl}/proctoring/admin/sessions`).subscribe({
      next: response => {
        this.sessions = response.data || [];
        if (this.selected) {
          const updated = this.sessions.find(item => item._id === this.selected?._id);
          if (updated) {
            const justCompleted = this.selected.status !== 'completed' && updated.status === 'completed';
            this.selected = updated;
            if (justCompleted) {
              this.closePeer();
              this.liveState = 'Test completed. The final recording is ready below.';
            }
          }
        }
        this.loading = false;
        this.error = '';
      },
      error: () => { this.loading = false; this.error = 'Monitoring sessions could not be loaded.'; }
    });
  }

  select(session: ProctorSession): void {
    if (this.selected?._id !== session._id) this.stopLive();
    this.selected = session;
  }

  async watchLive(session: ProctorSession): Promise<void> {
    this.stopLive();
    this.selected = session;
    this.liveState = 'Connecting to student...';
    await new Promise(resolve => window.setTimeout(resolve));
    try {
      const peer = new RTCPeerConnection({ iceServers: this.iceServers });
      this.peer = peer;
      peer.addTransceiver('video', { direction: 'recvonly' });
      peer.addTransceiver('audio', { direction: 'recvonly' });
      peer.ontrack = event => {
        if (this.liveVideo) {
          this.liveVideo.nativeElement.srcObject = event.streams[0] || new MediaStream([event.track]);
          this.liveVideo.nativeElement.play().catch(() => undefined);
          this.liveState = 'Live';
        }
      };
      await peer.setLocalDescription(await peer.createOffer());
      await this.waitForIce(peer);
      const response = await this.http.post<{ data: { requestId: string } }>(
        `${environment.apiUrl}/proctoring/admin/sessions/${session._id}/live/offer`,
        { offer: peer.localDescription?.toJSON() }
      ).toPromise();
      this.requestId = response?.data.requestId || '';
      this.answerTimer = window.setInterval(() => this.pollAnswer(), 1500);
      this.pollAnswer();
    } catch {
      this.liveState = 'Unable to connect. Confirm that the student is online and screen sharing is active.';
      this.closePeer();
    }
  }

  deleteSession(session: ProctorSession, event?: Event): void {
    event?.stopPropagation();
    if (!confirm(`Delete this monitoring session for ${this.studentName(session)}? This cannot be undone.`)) return;
    this.http.delete(`${environment.apiUrl}/proctoring/admin/sessions/${session._id}`).subscribe({
      next: () => {
        if (this.selected?._id === session._id) {
          this.stopLive();
          this.selected = undefined;
        }
        this.load(false);
      },
      error: err => { this.error = err.error?.message || 'Unable to delete session'; }
    });
  }

  stopLive(): void {
    const sessionId = this.selected?._id;
    const requestId = this.requestId;
    this.closePeer();
    this.liveState = '';
    if (sessionId && requestId) {
      this.http.delete(`${environment.apiUrl}/proctoring/admin/sessions/${sessionId}/live`, { params: { requestId } }).subscribe({ error: () => undefined });
    }
  }

  studentName(session: ProctorSession): string { return session.student?.fullName || session.student?.email || 'Student'; }
  testName(session: ProctorSession): string { return session.test?.title || session.test?.name || session.testModel; }
  trackById(_index: number, session: ProctorSession): string { return session._id; }

  private pollAnswer(): void {
    if (!this.peer || !this.requestId || !this.selected || this.peer.remoteDescription) return;
    this.http.get<any>(`${environment.apiUrl}/proctoring/admin/sessions/${this.selected._id}/live/answer`, { params: { requestId: this.requestId } }).subscribe({
      next: response => {
        if (response?.data?.answer && this.peer && !this.peer.remoteDescription) {
          this.peer.setRemoteDescription(response.data.answer).catch(() => { this.liveState = 'Live connection failed.'; });
        }
      }
    });
  }

  private loadIceConfig(): void {
    this.http.get<any>(`${environment.apiUrl}/proctoring/ice-config`).subscribe({
      next: response => { if (response?.data?.iceServers?.length) this.iceServers = response.data.iceServers; }
    });
  }

  private waitForIce(peer: RTCPeerConnection): Promise<void> {
    if (peer.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise(resolve => {
      const done = () => { if (peer.iceGatheringState === 'complete') { peer.removeEventListener('icegatheringstatechange', done); resolve(); } };
      peer.addEventListener('icegatheringstatechange', done);
      window.setTimeout(() => { peer.removeEventListener('icegatheringstatechange', done); resolve(); }, 8000);
    });
  }

  private closePeer(): void {
    if (this.answerTimer) clearInterval(this.answerTimer);
    this.answerTimer = undefined;
    this.peer?.close();
    this.peer = undefined;
    this.requestId = '';
    if (this.liveVideo) this.liveVideo.nativeElement.srcObject = null;
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.stopLive();
  }
}
