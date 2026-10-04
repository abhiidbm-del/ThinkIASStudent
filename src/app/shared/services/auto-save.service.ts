import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AutoSaveService {
  private readonly STORAGE_KEY = 'test_progress_';

  saveProgress(testId: string, data: any): void {
    const key = this.STORAGE_KEY + testId;
    localStorage.setItem(key, JSON.stringify(data));
  }

  loadProgress(testId: string): any {
    const key = this.STORAGE_KEY + testId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  clearProgress(testId: string): void {
    const key = this.STORAGE_KEY + testId;
    localStorage.removeItem(key);
  }

  clearAllProgress(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.STORAGE_KEY)) {
        localStorage.removeItem(key);
      }
    });
  }

  
}