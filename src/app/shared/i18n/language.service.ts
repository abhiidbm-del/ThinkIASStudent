import { Injectable } from '@angular/core';
import { HINDI } from './translations';
@Injectable({providedIn: 'root'})
export class LanguageService {
  get hindi(): boolean { return localStorage.getItem('preferredLanguage') === 'hi'; }
  set(language: 'en'|'hi'): void {
    localStorage.setItem('preferredLanguage', language);
    document.documentElement.lang = language;
    document.body.classList.remove('lang-en', 'lang-hi');
    document.body.classList.add(`lang-${language}`);
    window.dispatchEvent(new CustomEvent('preferredLanguageChanged', {detail: language}));
  }
  text(value: string | null | undefined): string { return this.hindi ? HINDI[value || ''] || value || '' : value || ''; }
  content(english: string | null | undefined, hindi?: string | null): string { return this.hindi ? hindi || this.text(english) : english || ''; }
}
