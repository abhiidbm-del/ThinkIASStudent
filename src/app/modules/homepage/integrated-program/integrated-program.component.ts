import { PublicFooterComponent } from '../../../shared/components/public-footer/public-footer.component';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, inject, signal, EventEmitter, Output } from '@angular/core';
import { MentorshipProgram, UserService } from '../../../shared/services/user.service';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SupportFeature, SupportFeatureService } from '../../../shared/services/support-feature.service';

@Component({
  selector: 'app-integrated-program',
  imports: [PublicFooterComponent, TranslatePipe, CommonModule, RouterLink, HeaderComponent],
  templateUrl: './integrated-program.component.html',
  styleUrls: ['./integrated-program.component.css'],
})
export class IntegratedProgramComponent implements OnInit, AfterViewInit {
  

  private userService = inject(UserService);
  private supportFeatureService = inject(SupportFeatureService);
  programs: MentorshipProgram[] = [];  language: string = 'en';
  supportFeatures: SupportFeature[] = [];
    @Output() languageChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {
    this.detectLanguage();
    this.loadPrograms();
    this.loadSupportFeatures();
  }

  ngAfterViewInit(): void {
    this.initializeScrollAnimations();
    
  }

  detectLanguage(): void {
    // Check for saved language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      this.language = savedLang;
    } else {
      this.language = 'en';
      localStorage.setItem('preferredLanguage', 'en');
    }
    
    // Apply the language
    this.applyLanguage();
  }

  switchLanguage(lang: string): void {
    this.language = lang;
    localStorage.setItem('preferredLanguage', lang);
    this.applyLanguage();
  }

  applyLanguage(): void {
    // Remove any existing language classes from body
    document.body.classList.remove('lang-en', 'lang-hi');
    
    // Add the current language class to body
    document.body.classList.add(`lang-${this.language}`);
    
    // Hide all language elements first
    const allEnElements = document.querySelectorAll('.en');
    const allHiElements = document.querySelectorAll('.hi');
    
    allEnElements.forEach(el => {
      el.classList.remove('active');
      el.classList.add('inactive');
    });
    
    allHiElements.forEach(el => {
      el.classList.remove('active');
      el.classList.add('inactive');
    });
    
    // Show only elements for the current language
    if (this.language === 'en') {
      allEnElements.forEach(el => {
        el.classList.add('active');
        el.classList.remove('inactive');
      });
    } else {
      allHiElements.forEach(el => {
        el.classList.add('active');
        el.classList.remove('inactive');
      });
    }
  }

  toggleLanguage(): void {
    this.language = this.language === 'en' ? 'hi' : 'en';
    localStorage.setItem('preferredLanguage', this.language);
    this.applyLanguage();
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Adjust for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  private initializeScrollAnimations(): void {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.feature-card, .structure-card, .outcome-card, .mission-card')
      .forEach(el => observer.observe(el));
  }

  registerNow(): void {
    window.open('/register', '_blank');
  }

  loadPrograms() {
    this.userService.getActivePrograms().subscribe({
      next: (response: any) => {
        this.programs = response.data || [];
        setTimeout(() => {
        this.applyLanguage();
      }, 0);
      },
      error: (error) => {
        console.error('Error loading programs:', error);
        this.programs = [];
      }
    });
  }

  loadSupportFeatures(): void {
    this.supportFeatureService.getPublic().subscribe({
      next: response => {
        this.supportFeatures = response.data || [];
        setTimeout(() => {
          this.applyLanguage();
          this.initializeScrollAnimations();
        });
      },
      error: error => console.error('Error loading support features:', error)
    });
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN');
  }

  getMediumText(medium: string): string {
    if (medium === 'english/hindi') return 'English & Hindi';
    return medium;
  }

  handleLanguageChange(lang: string): void {
  this.switchLanguage(lang);
}
}
