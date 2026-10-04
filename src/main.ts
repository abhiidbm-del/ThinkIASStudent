import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => {
    console.error(err);
    const root = document.querySelector('app-root');
    if (root) {
      root.innerHTML = `<div style="padding:24px;font-family:sans-serif;color:#b00020"><h2>App failed to start</h2><pre style="white-space:pre-wrap">${String(err?.stack || err)}</pre></div>`;
    }
  });
