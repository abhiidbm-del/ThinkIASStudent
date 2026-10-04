import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environment/environment';
import { recordingDraft } from './recording-draft';

@Injectable({ providedIn: 'root' })
export class ProctoringService {
  readonly active = signal(false);
  readonly screenActive = signal(false);
  readonly pendingRecording = signal(false);
  readonly uploading = signal(false);
  readonly starting = signal(false);
  private finishPromise?: Promise<void>;
  private stream?: MediaStream;
  private sourceStreams: MediaStream[] = [];
  private compositeFrame?: number;
  private recorder?: MediaRecorder;
  private chunks: Blob[] = [];
  private sessionId = '';
  private draftOwner = '';
  private recordedMime = 'video/webm';
  private readonly restorePromise: Promise<void>;
  private heartbeatTimer?: number;
  private snapshotTimer?: number;
  private livePollTimer?: number;
  private livePeer?: RTCPeerConnection;
  private liveRequestId = '';
  private pollingLive = false;
  private preview?: HTMLVideoElement;
  currentTestId = '';
  private iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];
  constructor(private http: HttpClient) {
    this.restorePromise = this.restoreDraft();
  }

  private async restoreDraft(): Promise<void> {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.draftOwner = user._id || user.id || '';
      const draft = await recordingDraft(this.draftOwner);
      if (draft) {
        this.sessionId = draft.sessionId;
        this.chunks = [draft.blob];
        this.recordedMime = draft.blob.type;
        this.pendingRecording.set(true);
      }
    } catch { /* In-memory retry remains available if browser storage is unavailable. */ }
  }

  bindPreview(video: HTMLVideoElement) {
    if (this.preview === video && video.srcObject === this.stream) return;
    this.preview = video;
    video.muted = true;
    video.playsInline = true;
    if (this.stream) {
      video.srcObject = this.stream;
      video.play().catch(() => undefined);
    }
  }

  private isMobileDevice(): boolean {
    return window.matchMedia('(max-width: 1024px), (pointer: coarse)').matches;
  }

  private async capturePortalScreen(): Promise<MediaStream | null> {
    const media = navigator.mediaDevices;
    if (!media?.getDisplayMedia) return null;
    return media.getDisplayMedia({
      video: { displaySurface: 'browser', frameRate: { ideal: 15, max: 20 } },
      audio: true,
      preferCurrentTab: true,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'include'
    } as DisplayMediaStreamOptions);
  }

  async start(testId: string, preview: HTMLVideoElement): Promise<void> {
    await this.restorePromise;
    if (this.active() || this.starting()) return;
    if (this.pendingRecording()) throw new Error('Please retry the previous recording upload first.');
    this.starting.set(true);
    try {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      } catch {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      }
      await this.initializeSession(testId, this.stream, preview, 'Test');
    } catch (error) {
      this.stopWithoutUpload();
      throw error;
    } finally {
      this.starting.set(false);
    }
  }

  async startWithStream(testId: string, stream: MediaStream, preview: HTMLVideoElement, testType: 'Test'|'LiveTest' = 'LiveTest'): Promise<void> {
    await this.restorePromise;
    if (this.active()) return;
    if (this.pendingRecording()) throw new Error('Please retry the previous recording upload first.');
    this.stream = stream;
    try { await this.initializeSession(testId, stream, preview, testType); }
    catch (error) { this.stopWithoutUpload(); throw error; }
  }

  async startLiveTest(testId: string, cameraStream: MediaStream, preview?: HTMLVideoElement): Promise<void> {
    await this.restorePromise;
    if (this.active() && this.currentTestId === testId) {
      if (preview) this.bindPreview(preview);
      return;
    }
    if (this.active()) return;
    if (this.pendingRecording()) throw new Error('Please retry the previous recording upload first.');
    this.starting.set(true);
    let screenStream: MediaStream | null = null;
    try {
      screenStream = await this.capturePortalScreen();
    } catch (error) {
      if (!this.isMobileDevice()) {
        this.starting.set(false);
        cameraStream.getTracks().forEach(track => track.stop());
        try { await firstValueFrom(this.http.post(`${environment.apiUrl}/proctoring/sessions`, { testId, consent: false, testType: 'LiveTest' })); } catch { /* Preserve the original capture error. */ }
        throw error;
      }
    }

    this.sourceStreams = screenStream ? [cameraStream, screenStream] : [cameraStream];
    this.screenActive.set(true);
    screenStream?.getVideoTracks()[0]?.addEventListener('ended', () => {
      this.screenActive.set(false);
      this.violation('screen_share_stopped');
    });

    try {
      const output = screenStream ? await this.createCompositeStream(screenStream, cameraStream) : cameraStream;
      await this.initializeSession(testId, output, preview, 'LiveTest');
    } catch (error) {
      this.stopWithoutUpload();
      throw error;
    } finally {
      this.starting.set(false);
    }
  }

  private async createCompositeStream(screen: MediaStream, camera: MediaStream): Promise<MediaStream> {
    const screenVideo = document.createElement('video');
    const cameraVideo = document.createElement('video');
    for (const video of [screenVideo, cameraVideo]) {
      video.muted = true;
      video.playsInline = true;
    }
    screenVideo.srcObject = screen;
    cameraVideo.srcObject = camera;
    await Promise.all([screenVideo.play(), cameraVideo.play()]);

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(screenVideo.videoWidth || 1280, 1280);
    canvas.height = Math.round(canvas.width * (screenVideo.videoHeight || 720) / (screenVideo.videoWidth || 1280));
    const context = canvas.getContext('2d');
    const draw = () => {
      if (context) {
        context.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        const pipWidth = Math.round(canvas.width * .22);
        const pipHeight = Math.round(pipWidth * 3 / 4);
        const margin = Math.round(canvas.width * .015);
        context.fillStyle = '#fff';
        context.fillRect(canvas.width - pipWidth - margin - 3, canvas.height - pipHeight - margin - 3, pipWidth + 6, pipHeight + 6);
        context.drawImage(cameraVideo, canvas.width - pipWidth - margin, canvas.height - pipHeight - margin, pipWidth, pipHeight);
      }
      this.compositeFrame = requestAnimationFrame(draw);
    };
    draw();

    const output = canvas.captureStream(15);
    const audioTrack = camera.getAudioTracks()[0] || screen.getAudioTracks()[0];
    if (audioTrack) output.addTrack(audioTrack);
    return output;
  }

  private async initializeSession(testId: string, stream: MediaStream, preview: HTMLVideoElement | undefined, testType: 'Test'|'LiveTest'): Promise<void> {
    this.stream = stream;
    this.currentTestId = testId;
    if (preview) this.bindPreview(preview);
    else if (this.preview) this.bindPreview(this.preview);
    if (this.preview) await this.preview.play().catch(() => undefined);
    const response = await firstValueFrom(this.http.post<any>(`${environment.apiUrl}/proctoring/sessions`, { testId, consent: true, testType }));
    this.sessionId = response.data._id;
    await this.loadIceConfig();
    const mimeType = ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find(type => MediaRecorder.isTypeSupported(type));
    this.recorder = new MediaRecorder(this.stream, { ...(mimeType ? { mimeType } : {}), videoBitsPerSecond: 350000, audioBitsPerSecond: 32000 });
    this.recordedMime = this.recorder.mimeType;
    this.chunks = [];
    this.recorder.ondataavailable = event => { if (event.data.size) this.chunks.push(event.data); };
    this.recorder.start(5000);
    this.active.set(true);
    this.heartbeatTimer = window.setInterval(() => this.heartbeat(), 30000);
    this.snapshotTimer = window.setInterval(() => this.captureSnapshot(), 30000);
    this.livePollTimer = window.setInterval(() => this.pollLiveOffer(), 2000);
    this.pollLiveOffer();
    await this.captureSnapshot();
  }

  violation(type: string) {
    if (this.sessionId) this.http.patch(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/heartbeat`, { violation: type }).subscribe();
  }

  finish(): Promise<void> {
    if (this.finishPromise) return this.finishPromise;
    this.finishPromise = this.finishRecording().finally(() => { this.finishPromise = undefined; });
    return this.finishPromise;
  }

  private async finishRecording(): Promise<void> {
    if (!this.sessionId) return;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    this.stopLiveSharing();
    if (this.recorder && this.recorder.state !== 'inactive') {
      await new Promise<void>(resolve => { this.recorder!.onstop = () => resolve(); this.recorder!.stop(); });
    }
    this.stream?.getTracks().forEach(track => track.stop());
    this.sourceStreams.forEach(source => source.getTracks().forEach(track => track.stop()));
    if (this.compositeFrame !== undefined) cancelAnimationFrame(this.compositeFrame);
    this.active.set(false);
    this.screenActive.set(false);
    this.pendingRecording.set(true);
    this.uploading.set(true);
    try {
      const mimeType = (this.recorder?.mimeType || this.recordedMime).startsWith('video/mp4') ? 'video/mp4' : 'video/webm';
      const blob = new Blob(this.chunks, { type: mimeType });
      try { await recordingDraft(this.draftOwner, { owner: this.draftOwner, sessionId: this.sessionId, blob }); } catch { /* Retain the in-memory recording on quota/storage failure. */ }
      await firstValueFrom(this.http.post(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/end`, {}));
      const form = new FormData(); form.append('recording', blob, `exam-${Date.now()}.${mimeType === 'video/mp4' ? 'mp4' : 'webm'}`);
      await firstValueFrom(this.http.post(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/complete`, form));
      try { await recordingDraft(this.draftOwner, null); } catch { /* A later retry is idempotent. */ }
      this.pendingRecording.set(false);
      this.reset();
    } finally {
      this.uploading.set(false);
    }
  }

  stopWithoutUpload() {
    if (this.finishPromise || this.pendingRecording()) return;
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    this.stopLiveSharing();
    if (this.recorder?.state !== 'inactive') this.recorder?.stop();
    this.stream?.getTracks().forEach(track => track.stop());
    this.reset();
  }

  private heartbeat() { this.http.patch(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/heartbeat`, {}).subscribe(); }
  private async loadIceConfig(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<any>(`${environment.apiUrl}/proctoring/ice-config`));
      if (response?.data?.iceServers?.length) this.iceServers = response.data.iceServers;
    } catch { /* Default STUN configuration remains available. */ }
  }

  private pollLiveOffer(): void {
    if (!this.active() || !this.sessionId || !this.stream || this.pollingLive) return;
    this.pollingLive = true;
    this.http.get<any>(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/live/offer`).subscribe({
      next: response => {
        this.pollingLive = false;
        if (this.active() && response?.data?.requestId && response.data.requestId !== this.liveRequestId) {
          this.answerLiveRequest(response.data.requestId, response.data.offer).catch(() => this.closeLivePeer());
        }
      },
      error: () => { this.pollingLive = false; }
    });
  }

  private async answerLiveRequest(requestId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    this.closeLivePeer();
    const peer = new RTCPeerConnection({ iceServers: this.iceServers });
    this.livePeer = peer;
    this.liveRequestId = requestId;
    this.stream?.getTracks().forEach(track => peer.addTrack(track, this.stream!));
    await peer.setRemoteDescription(offer);
    await peer.setLocalDescription(await peer.createAnswer());
    await this.waitForIce(peer);
    await firstValueFrom(this.http.post(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/live/answer`, {
      requestId, answer: peer.localDescription?.toJSON()
    }));
  }

  private waitForIce(peer: RTCPeerConnection): Promise<void> {
    if (peer.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise(resolve => {
      const done = () => { if (peer.iceGatheringState === 'complete') { peer.removeEventListener('icegatheringstatechange', done); resolve(); } };
      peer.addEventListener('icegatheringstatechange', done);
      window.setTimeout(() => { peer.removeEventListener('icegatheringstatechange', done); resolve(); }, 8000);
    });
  }

  private closeLivePeer(): void { this.livePeer?.close(); this.livePeer = undefined; this.liveRequestId = ''; }
  private stopLiveSharing(): void {
    if (this.livePollTimer) clearInterval(this.livePollTimer);
    this.livePollTimer = undefined;
    this.closeLivePeer();
  }
  private async captureSnapshot(video: HTMLVideoElement = this.preview!) {
    if (!video?.videoWidth || !this.sessionId) return;
    const canvas = document.createElement('canvas'); canvas.width = 480; canvas.height = Math.round(480 * video.videoHeight / video.videoWidth);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', .72));
    if (!blob) return;
    const form = new FormData(); form.append('snapshot', blob, `snapshot-${Date.now()}.jpg`);
    this.http.post(`${environment.apiUrl}/proctoring/sessions/${this.sessionId}/snapshot`, form).subscribe();
  }
  private reset() {
    this.stopLiveSharing();
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.snapshotTimer) clearInterval(this.snapshotTimer);
    this.stream?.getTracks().forEach(track => track.stop());
    if (this.compositeFrame !== undefined) cancelAnimationFrame(this.compositeFrame);
    this.sourceStreams.forEach(source => source.getTracks().forEach(track => track.stop()));
    this.active.set(false);
    this.screenActive.set(false);
    this.sessionId = '';
    this.currentTestId = '';
    this.chunks = [];
    this.stream = undefined;
    this.sourceStreams = [];
    this.compositeFrame = undefined;
    this.recorder = undefined;
  }
}
