import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DocumentVisibilityService {
  private visibilitySubject = new Subject<boolean>();
  private isTabSwitch = new Subject<void>(); // New subject for tab switches
  
  visibilityChanged$ = this.visibilitySubject.asObservable();
  tabSwitched$ = this.isTabSwitch.asObservable(); // New observable for tab switches

  constructor() {
    // Listen for visibility changes (refresh/minimize)
    document.addEventListener('visibilitychange', () => {
      console.log('Visibility change detected, hidden:', document.hidden);
      this.visibilitySubject.next(!document.hidden);
    });

    // Listen for window blur/focus events (tab switches)
    window.addEventListener('blur', (event) => {
      // Only trigger on tab switch, not on window minimize
      if (document.visibilityState === 'visible') {
        console.log('Tab switch detected via blur event');
        this.isTabSwitch.next();
      }
    });

    window.addEventListener('focus', (event) => {
      console.log('Window/tab focus regained');
    });

    // Alternative: Also listen for pagehide/pageshow for better detection
    window.addEventListener('pagehide', (event) => {
      console.log('Page hiding (tab switch/close)');
    });

    window.addEventListener('pageshow', (event) => {
      console.log('Page showing (tab switch back)');
    });
  }

  // Helper method to check if document is currently visible
  isDocumentVisible(): boolean {
    return document.visibilityState === 'visible';
  }
}