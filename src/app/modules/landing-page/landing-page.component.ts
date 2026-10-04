import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent implements AfterViewInit, OnInit {
  
  // Define email as a property to avoid template issues
  email = 'thinkcivil05@gmail.com';
  phone = '+91-9971534301';
  currentLanguage: string = 'en';

  ngOnInit() {
    // Initialize language on component load
    this.switchLanguage('en');
  }

  constructor(private router: Router) {}

  ngAfterViewInit() {
    this.initializeLanguageToggle();
    this.initializeSmoothScroll();
    this.initializeMobileMenu();
  }

  private initializeLanguageToggle() {
    const enBtn = document.getElementById('en-btn');
    const hiBtn = document.getElementById('hi-btn');
    
    if (enBtn && hiBtn) {
      enBtn.addEventListener('click', () => this.switchLanguage('en'));
      hiBtn.addEventListener('click', () => this.switchLanguage('hi'));
    }
  }

  private switchLanguage(lang: string) {
    this.currentLanguage = lang;
    
    const enElements = document.querySelectorAll('.en');
    const hiElements = document.querySelectorAll('.hi');
    const enBtn = document.getElementById('en-btn');
    const hiBtn = document.getElementById('hi-btn');
    
    // Update button active states
    if (enBtn && hiBtn) {
      if (lang === 'en') {
        enBtn.classList.add('active');
        hiBtn.classList.remove('active');
      } else {
        enBtn.classList.remove('active');
        hiBtn.classList.add('active');
      }
    }
    
    // Update content visibility
    if (lang === 'en') {
      enElements.forEach(el => (el as HTMLElement).style.display = 'block');
      hiElements.forEach(el => (el as HTMLElement).style.display = 'none');
      document.body.classList.remove('hindi');
    } else {
      enElements.forEach(el => (el as HTMLElement).style.display = 'none');
      hiElements.forEach(el => (el as HTMLElement).style.display = 'block');
      document.body.classList.add('hindi');
    }
  }

  private initializeSmoothScroll() {
    // Add smooth scroll functionality
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const href = anchor.getAttribute('href');
        if (href) {
          const target = document.querySelector(href);
          if (target) {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    });
  }

  private initializeMobileMenu() {
    // Add mobile menu toggle functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    
    if (menuToggle && nav) {
      menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
      });
    }
  }

  openView(type: string) {
  this.router.navigate(['/view', type]);
}

}