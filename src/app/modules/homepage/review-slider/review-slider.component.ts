import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { CommonModule } from '@angular/common';
import { Component, AfterViewInit, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';
import { Testimonial, TestimonialService } from '../../../shared/services/testimonial.service';

@Component({
  selector: 'app-review-slider',
  standalone: true,
  imports: [TranslatePipe, CommonModule],
  templateUrl: './review-slider.component.html',
  styleUrls: ['./review-slider.component.css']
})
export class ReviewSliderComponent implements OnInit, AfterViewInit, OnDestroy {
  private reviewSlider?: ElementRef<HTMLElement>;
  @ViewChild('reviewSlider')
  set reviewSliderElement(element: ElementRef<HTMLElement> | undefined) {
    this.reviewSlider = element;
    if (element) this.initializeWhenReady();
  }
  private swiper: Swiper | null = null;
  private languageCheckInterval: any;
  private viewReady = false;
  testimonials: Testimonial[] = [];
  sliderTestimonials: Testimonial[] = [];

  constructor(private testimonialService: TestimonialService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Initial language setup
    this.updateReviewSliderLanguage();
    
    // Check for language changes every second
    this.languageCheckInterval = setInterval(() => {
      this.updateReviewSliderLanguage();
    }, 1000);
    this.testimonialService.getPublicTestimonials().subscribe({
      next: response => {
        this.testimonials = response.data || [];
        this.sliderTestimonials = this.testimonials.length === 1
          ? [this.testimonials[0], { ...this.testimonials[0], _id: `${this.testimonials[0]._id}-duplicate` }]
          : this.testimonials;
        this.cdr.detectChanges();
        this.initializeWhenReady();
      },
      error: error => {
        console.error('Unable to load testimonials:', error);
        this.testimonials = [];
        this.sliderTestimonials = [];
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initializeWhenReady();
  }

  ngOnDestroy(): void {
    // Clean up interval
    if (this.languageCheckInterval) {
      clearInterval(this.languageCheckInterval);
    }
    
      if (this.swiper && typeof this.swiper.destroy === 'function') {
        this.swiper.destroy();
    }
  }

  private initializeSwiper(): void {
    const element = this.reviewSlider?.nativeElement;
    if (this.swiper || !element || this.testimonials.length === 0) return;
    this.swiper = new Swiper(element, {
      modules: [Autoplay, Pagination],
      slidesPerView: 1,
      loop: this.sliderTestimonials.length > 1,
      autoplay: {
        delay: 3000, // Increased delay for better reading
        disableOnInteraction: false
      },
      pagination: {
        el: element.querySelector<HTMLElement>('.swiper-pagination'),
        clickable: true
      },
      observer: true,
      observeParents: true
    });
  }

  private initializeWhenReady(): void {
    if (this.viewReady && this.reviewSlider && this.testimonials.length) {
      requestAnimationFrame(() => this.initializeSwiper());
    }
  }

  stars(rating: number): number[] {
    return Array.from({ length: Math.max(0, Math.min(5, Math.round(rating))) });
  }

  private updateReviewSliderLanguage(): void {
    const isHindi = localStorage.getItem('preferredLanguage') === 'hi';
    const enElements = document.querySelectorAll('.review_slider .en');
    const hiElements = document.querySelectorAll('.review_slider .hi');
    
    if (enElements.length > 0 && hiElements.length > 0) {
      if (isHindi) {
        enElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
        });
        hiElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'block';
          htmlEl.style.visibility = 'visible';
        });
      } else {
        enElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'block';
          htmlEl.style.visibility = 'visible';
        });
        hiElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
        });
      }
    }
  }
}
