import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-slider',
  templateUrl: './slider.component.html',
  styleUrls: ['./slider.component.css'],
  imports: [RouterLink]
})
export class SliderComponent implements OnInit, AfterViewInit, OnDestroy {
  private swiper: Swiper | null = null;
  private languageChangeListener: any;

  ngOnInit(): void {
    // Initialize language display
    this.updateSliderLanguage();
    
    // Listen for language changes
    this.languageChangeListener = () => {
      setTimeout(() => {
        this.updateSliderLanguage();
      }, 100);
    };
    
    document.addEventListener('languageChanged', this.languageChangeListener);
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
  }

  ngOnDestroy(): void {
    try {
      if (this.swiper && typeof this.swiper.destroy === 'function') {
        this.swiper.destroy();
      }
    } finally {
      if (this.languageChangeListener) {
        document.removeEventListener('languageChanged', this.languageChangeListener);
      }
    }
  }

  private initializeSwiper(): void {
    this.swiper = new Swiper('.mySwiper', {
      modules: [Autoplay, Pagination, Navigation],
      slidesPerView: 1,
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      }
    });
  }

  private updateSliderLanguage(): void {
    const isHindi = localStorage.getItem('preferredLanguage') === 'hi';
    const enElements = this.swiper?.el?.querySelectorAll('.en');
    const hiElements = this.swiper?.el?.querySelectorAll('.hi');
    
    if (enElements && hiElements) {
      if (isHindi) {
        enElements.forEach(el => (el as HTMLElement).style.display = 'none');
        hiElements.forEach(el => (el as HTMLElement).style.display = 'block');
      } else {
        enElements.forEach(el => (el as HTMLElement).style.display = 'block');
        hiElements.forEach(el => (el as HTMLElement).style.display = 'none');
      }

    }
  }
}