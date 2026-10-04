import { Component, AfterViewInit, OnInit, OnDestroy } from '@angular/core';
import Swiper from 'swiper';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

@Component({
  selector: 'app-objective-slider',
  templateUrl: './objective-slider.component.html',
  styleUrls: ['./objective-slider.component.css']
})
export class ObjectiveSliderComponent implements OnInit, AfterViewInit, OnDestroy {
  private swiper: Swiper | null = null;
  private languageCheckInterval: any;

  ngOnInit(): void {
    // Initial language setup
    this.updateObjectiveSliderLanguage();
    
    // Check for language changes every second
    this.languageCheckInterval = setInterval(() => {
      this.updateObjectiveSliderLanguage();
    }, 1000);
  }

  ngAfterViewInit(): void {
    this.initializeSwiper();
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
    this.swiper = new Swiper('.objective_slider', {
      modules: [Autoplay, Pagination, Navigation],
      slidesPerView: 4,
      spaceBetween: 20, 
      loop: true,
      autoplay: {
        delay: 2500,
        disableOnInteraction: false
      },
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      breakpoints: {
        0: {
          slidesPerView: 1,
          spaceBetween: 10
        },
        576: {
          slidesPerView: 2,
          spaceBetween: 15
        },
        992: {
          slidesPerView: 4,
          spaceBetween: 20
        }
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      }
    });
  }

  private updateObjectiveSliderLanguage(): void {
    const isHindi = localStorage.getItem('preferredLanguage') === 'hi';
    const enElements = document.querySelectorAll('.objective_slider .en');
    const hiElements = document.querySelectorAll('.objective_slider .hi');
    
    if (enElements.length > 0 && hiElements.length > 0) {
      if (isHindi) {
        enElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'none';
          htmlEl.style.visibility = 'hidden';
        });
        hiElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'inline';
          htmlEl.style.visibility = 'visible';
        });
      } else {
        enElements.forEach(el => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.display = 'inline';
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