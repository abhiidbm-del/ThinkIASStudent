// studymaterial-slider.component.ts
import { Component, AfterViewInit, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import Swiper from 'swiper';
import { Autoplay, Pagination } from 'swiper/modules';
import { ModuleService, Module } from '../../../shared/services/module.service';
import { ViewFreeResourcesComponent } from '../../../shared/components/view-free-resources/view-free-resources.component';
import { ResourceViewerComponent } from '../../../shared/components/resource-viewer/resource-viewer.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-studymaterial-slider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './studymaterial-slider.component.html',
  styleUrls: ['./studymaterial-slider.component.css']
})
export class StudymaterialSliderComponent implements OnInit, AfterViewInit, OnDestroy {
  private moduleService = inject(ModuleService);
  private dialog = inject(MatDialog);
  private router= inject(Router)

  
  modules: Module[] = [];
  loading = true;
  error: string | null = null;
  
  private swiper: Swiper | null = null;
  private languageCheckInterval: any;
  private isSwiperInitialized = false;

  ngOnInit(): void {
    this.loadModules();
    this.updateStudyMaterialLanguage();
    this.languageCheckInterval = setInterval(() => {
      this.updateStudyMaterialLanguage();
    }, 500);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.modules.length > 0 && !this.isSwiperInitialized) {
        this.initializeSwiper();
      }
    }, 500);
  }

  ngOnDestroy(): void {
    if (this.languageCheckInterval) {
      clearInterval(this.languageCheckInterval);
    }
    if (this.swiper) {
        if (this.swiper && typeof this.swiper.destroy === 'function') {
          this.swiper.destroy();
        }
      this.swiper = null;
      this.isSwiperInitialized = false;
    }
  }

  private loadModules(): void {
    this.loading = true;
    this.moduleService.getPublicModules().subscribe({
      next: (modules) => {
        this.modules = modules;
        this.loading = false;
        setTimeout(() => {
          if (!this.isSwiperInitialized) {
            this.initializeSwiper();
          }
        }, 100);
      },
      error: (error) => {
        console.error('Error loading modules:', error);
        this.error = 'Failed to load modules';
        this.loading = false;
      }
    });
  }

  private initializeSwiper(): void {
    if (this.isSwiperInitialized || this.modules.length === 0) return;
    
    try {
      this.swiper = new Swiper('.study_slider', {
        modules: [Autoplay, Pagination],
        slidesPerView: 1,
        spaceBetween: 20,
        loop: this.modules.length > 2,
        autoplay: {
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true
        },
        pagination: {
          el: '.swiper-pagination',
          clickable: true
        },
        breakpoints: {
          768: { slidesPerView: 2, spaceBetween: 26 },
          1200: { slidesPerView: 3, spaceBetween: 30 }
        },
        observer: true,
        observeParents: true
      });
      
      this.isSwiperInitialized = true;
    } catch (error) {
      console.error('Swiper initialization error:', error);
    }
  }

  private updateStudyMaterialLanguage(): void {
    const isHindi = localStorage.getItem('preferredLanguage') === 'hi';
    const enElements = document.querySelectorAll('.study_slider .en');
    const hiElements = document.querySelectorAll('.study_slider .hi');
    
    if (enElements.length > 0 && hiElements.length > 0) {
      if (isHindi) {
        enElements.forEach(el => (el as HTMLElement).style.display = 'none');
        hiElements.forEach(el => (el as HTMLElement).style.display = 'inline');
      } else {
        enElements.forEach(el => (el as HTMLElement).style.display = 'inline');
        hiElements.forEach(el => (el as HTMLElement).style.display = 'none');
      }
    }
  }

  getImageUrl(image: string): string {
    if (!image) return '../../assets/images/study-default.png';
    if (image.startsWith('data:image')) return image;
    if (image.startsWith('http')) return image;
    return `http://localhost:5000/${image}`;
  }

  // Open the module content in dialog
  // In studymaterial-slider.component.ts, update the openModuleContent method:

// In studymaterial-slider.component.ts, update the openModuleContent method:

openModuleContent(module: Module): void {
  console.log('Opening module:', module);
  
  this.dialog.open(ResourceViewerComponent, {
    width: '90vw',
    maxWidth: '1200px',
    height: '90vh',
    maxHeight: '800px',
    panelClass: 'resource-viewer-dialog',
    data: {
      module: module,
      resourceType: 'all'  // Use 'all' instead of 'study-material'
    }
  });
}

openModuleTest(module: Module): void {
  // Navigate to module test page with module id and name
  this.router.navigate(['/module-test', module._id, module.name.english]);
}
}