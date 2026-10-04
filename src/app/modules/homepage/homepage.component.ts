import { AfterViewInit, Component, ElementRef, OnInit, HostListener, OnDestroy, inject, Inject, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import * as AOS from 'aos';
import { StudymaterialSliderComponent } from './studymaterial-slider/studymaterial-slider.component';
import { ReviewSliderComponent } from './review-slider/review-slider.component';
import { ObjectiveSliderComponent } from './objective-slider/objective-slider.component';
import { SliderComponent } from './slider/slider.component';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ResourcesViewComponent } from '../../shared/components/resources-view/resources-view.component';
import { UserService } from '../../shared/services/user.service';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { AuthService } from '../../shared/services/auth.service';
import { ViewResources2Component } from '../../shared/components/view-resources2/view-resources2.component';
import { FreeResourcePublicService } from '../../shared/services/free-resource-public.service';
import { ViewFreeResourcesComponent } from '../../shared/components/view-free-resources/view-free-resources.component';
import { SimpleNewsService } from '../../shared/services/simple-news.service';
import { HeaderComponent } from './header/header.component';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProgramComponent } from './program/program.component';
import { PlanSliderComponent } from './plan-slider/plan-slider.component';
import Swiper from 'swiper';
import { Autoplay, Navigation } from 'swiper/modules';

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [
    CommonModule,
    StudymaterialSliderComponent, 
    ReviewSliderComponent, 
    ObjectiveSliderComponent, 
    SliderComponent,
    RouterModule,
    HeaderComponent,
    ProgramComponent,
    PlanSliderComponent
  ],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css'],
  providers: [DatePipe]
})
export class HomepageComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('announcementDialog') announcementDialog!: TemplateRef<any>;
  
  currentDate = new Date();
  // isMobileMenuOpen = false;
    isMobileMenuOpen: boolean = false;
    activeMobileDropdown: string = '';
    isMobileView = false;
    currentLanguage: string = 'en';
    private timerInterval: any;
    private overlayRef?: OverlayRef;
    private router= inject(Router)
    private freeResource= inject(FreeResourcePublicService)
    private overlay = inject(Overlay)
    private viewContainerRef = inject(ViewContainerRef);
    private authService = inject(AuthService);
    private newsService = inject(SimpleNewsService);

  announcements: any[] = [];
  announcementCount: number = 0;
  showAnnouncementDialog: boolean = false;

  modules: any[] = [];
  loadingModules: boolean = false;
  modulesError: boolean = false;
    activeNews: any = null;

      videos: any[] = [];
        safeVideoUrls: Map<string, SafeResourceUrl> = new Map(); // Cache for safe URLs
      private videoSwiper?: Swiper;
      private videoSlider?: ElementRef<HTMLElement>;
      private viewReady = false;
  
  constructor(private datePipe: DatePipe,
     private dialog: MatDialog,
     private userService: UserService,
        private sanitizer: DomSanitizer) {}
    showSplash = true;

      @ViewChild('videoSlider')
      set videoSliderElement(element: ElementRef<HTMLElement> | undefined) {
        this.videoSlider = element;
        if (element) this.initializeVideoSlider();
      }
    
  ngOnInit(): void {
    try {
      const aos = (AOS as { default?: { init: Function }; init?: Function }).default || AOS;
      aos.init?.({
        duration: 1000,
        once: true,
        offset: 100
      });
    } catch { /* Homepage still renders if animation library fails to load. */ }
    
    this.checkMobileView();
    this.initializeLanguage();
    this.startLiveClock();
    this.loadAnnouncements(); // Load announcements on init
    this.loadModules();
    this.loadVideos();

    setTimeout(() => {
      this.showSplash = false;
    }, 3000); // 2 seconds
    this.loadNews();
  }
  
  ngOnDestroy(): void {
    // Clear the interval when component is destroyed to prevent memory leaks
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.videoSwiper?.destroy();

        this.closeAnnouncements();
  }
  
  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initializeVideoSlider();
    try { (AOS as { default?: { refresh: Function }; refresh?: Function }).default?.refresh?.() || (AOS as { refresh?: Function }).refresh?.(); } catch { /* ignore */ }
    this.updateLanguageButtons();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkMobileView();
  }
  
  checkMobileView() {
    this.isMobileView = window.innerWidth < 992;
    if (!this.isMobileView) {
      this.isMobileMenuOpen = false;
    }
  }
  
  // toggleMobileMenu() {
  //   this.isMobileMenuOpen = !this.isMobileMenuOpen;
  // }
  
  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
  
  formatDate(date: Date, format: string): string {
    return this.datePipe.transform(date, format) || '';
  }
  
  // Live clock functionality
  private startLiveClock() {
    // Update immediately
    this.currentDate = new Date();
    
    // Update every second (1000ms)
    this.timerInterval = setInterval(() => {
      this.currentDate = new Date();
    }, 1000);
  }
  
  // Language switching methods
  private initializeLanguage() {
    // Check if language is stored in localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
    this.switchLanguage(this.currentLanguage);
  }
  
  // switchLanguage(lang: string) {
  //   this.currentLanguage = lang;
    
  //   // Store preference in localStorage
  //   localStorage.setItem('preferredLanguage', lang);
    
  //   // Update all language-specific elements
  //   const enElements = document.querySelectorAll('.en');
  //   const hiElements = document.querySelectorAll('.hi');
  //   const enButtons = document.querySelectorAll('.en-btn');
  //   const hiButtons = document.querySelectorAll('.hi-btn');
    
  //   // Update content visibility
  //   if (lang === 'en') {
  //     enElements.forEach(el => (el as HTMLElement).style.display = 'block');
  //     hiElements.forEach(el => (el as HTMLElement).style.display = 'none');
  //     document.body.classList.remove('hindi');
      
  //     // Update buttons
  //     enButtons.forEach(btn => btn.classList.add('active'));
  //     hiButtons.forEach(btn => btn.classList.remove('active'));
  //   } else {
  //     enElements.forEach(el => (el as HTMLElement).style.display = 'none');
  //     hiElements.forEach(el => (el as HTMLElement).style.display = 'block');
  //     document.body.classList.add('hindi');
      
  //     // Update buttons
  //     enButtons.forEach(btn => btn.classList.remove('active'));
  //     hiButtons.forEach(btn => btn.classList.add('active'));
  //   }
  // }
  
  private updateLanguageButtons() {
    const enButtons = document.querySelectorAll('.en-btn');
    const hiButtons = document.querySelectorAll('.hi-btn');
    
    enButtons.forEach(btn => {
      btn.addEventListener('click', () => this.switchLanguage('en'));
    });
    
    hiButtons.forEach(btn => {
      btn.addEventListener('click', () => this.switchLanguage('hi'));
    });
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Close all dropdowns when menu closes
    if (!this.isMobileMenuOpen) {
      this.activeMobileDropdown = '';
    }
  }

  toggleMobileDropdown(dropdownId: string) {
    if (this.activeMobileDropdown === dropdownId) {
      this.activeMobileDropdown = '';
    } else {
      this.activeMobileDropdown = dropdownId;
    }
  }

  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Adjust for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }

  openView(type: string) {
  const dialogRef = this.dialog.open(ResourcesViewComponent, {
    data: { type: type },
    width: 'calc(100vw - 40px)',
    height: 'calc(100vh - 40px)',
    maxWidth: '1200px',
    maxHeight: '600px',
    panelClass: 'resources-dialog-container',
    disableClose: false,
    autoFocus: false
  });
  
  // Optional: Handle dialog close
  dialogRef.afterClosed().subscribe(() => {
    console.log('Dialog closed');
  });
}

openViewR(type: string, nType: number) {
  console.log(nType);
  
  const dialogRef = this.dialog.open(ViewResources2Component, {
    data: { type: type, nType: nType },
    width: 'calc(100vw - 40px)',
    height: 'calc(100vh - 40px)',
    maxWidth: '1200px',
    maxHeight: '600px',
    panelClass: 'resources-dialog-container',
    disableClose: false,
    autoFocus: false
  });

  
  // Optional: Handle dialog close
  dialogRef.afterClosed().subscribe(() => {
    console.log('Dialog closed');
  });
}


loadVideos() {
    this.userService.getAllVideos().subscribe({
      next: (res: any) => {
        if (res.data && res.data.length > 0) {
          this.videos = res.data;
          // Pre-calculate all safe URLs at once
          this.precalculateSafeUrls();
        } else {
          this.videos = [];
          this.safeVideoUrls.clear();
        }
      },
      error: (err) => {
        console.error('Error loading videos:', err);
        this.videos = [];
        this.safeVideoUrls.clear();
      }
    });
  }

  // Pre-calculate all safe URLs once
  private precalculateSafeUrls() {
    this.safeVideoUrls.clear();
    this.videos.forEach(video => {
      if (video.videoId) {
        const embedUrl = `https://www.youtube.com/embed/${video.videoId}`;
        this.safeVideoUrls.set(video.videoId, this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl));
      }
    });
  }

  // Get cached safe URL - much more efficient
  getSafeUrl(videoId: string): SafeResourceUrl | null {
    return this.safeVideoUrls.get(videoId) || null;
  }

  private initializeVideoSlider(): void {
    if (!this.viewReady || !this.videoSlider || this.videos.length <= 3 || this.videoSwiper) return;

    requestAnimationFrame(() => {
      const element = this.videoSlider?.nativeElement;
      if (!element || this.videoSwiper) return;

      this.videoSwiper = new Swiper(element, {
        modules: [Autoplay, Navigation],
        spaceBetween: 24,
        slidesPerView: 1,
        slidesPerGroup: 1,
        autoplay: {
          delay: 3500,
          disableOnInteraction: true,
          pauseOnMouseEnter: true
        },
        navigation: {
          nextEl: element.querySelector<HTMLElement>('.video-next'),
          prevEl: element.querySelector<HTMLElement>('.video-prev')
        },
        breakpoints: {
          576: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 20 },
          992: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 24 }
        }
      });
    });
  }

  


loadAnnouncements() {
    this.userService.getAllAnnouncement().subscribe({
      next: (res: any) => {
        if (res.success) {
          this.announcements = res.data || [];
          this.announcementCount = res.count || 0;
        }
      },
      error: (err: any) => {
        console.error('Error loading announcements:', err);
        this.announcements = [];
        this.announcementCount = 0;
      }
    });
  }

  loadModules() {
    this.loadingModules = true;
    this.modulesError = false;
    
    this.freeResource.getPublicModules().subscribe({
      next: (res: any) => {
        this.loadingModules = false;
        if (res && res.modules && Array.isArray(res.modules)) {
          this.modules = res.modules;
        } else {
          this.modules = [];
        }
      },
      error: (err: any) => {
        console.error('Error loading modules:', err);
        this.loadingModules = false;
        this.modulesError = true;
        this.modules = [];
      }
    });
  }

  openFreeResourceModule(module: any) {
    // Open the dialog with module data
    const dialogRef = this.dialog.open(ViewFreeResourcesComponent, {
        width: '90vw',
        maxWidth: '1200px',
        height: '90vh',
        maxHeight: '450px',
        panelClass: 'resource-viewer-dialog',
        data: {
            module: module, // Pass the module object
            isFreeResource: true // Flag to indicate it's a free resource module
        }
    });

    dialogRef.afterClosed().subscribe(result => {
        console.log('The dialog was closed');
    });
}
  
  // Open announcements dialog
  openAnnouncements() {
    if (this.showAnnouncementDialog || !this.announcementDialog) return;
    
    // Create overlay
    const overlayRef = this.overlay.create({
        hasBackdrop: true,
        backdropClass: 'announcement-backdrop',
        positionStrategy: this.overlay.position()
            .global()
            .centerHorizontally()
            .centerVertically(),
        width: '90%',
        maxWidth: '800px',
        maxHeight: '80vh',
        scrollStrategy: this.overlay.scrollStrategies.block()
    });

    // Create portal from template
    const portal = new TemplatePortal(this.announcementDialog, this.viewContainerRef);
    overlayRef.attach(portal);
    
    this.overlayRef = overlayRef;
    this.showAnnouncementDialog = true;

    // Apply current language immediately after dialog is attached
    setTimeout(() => {
        this.applyDialogLanguage();
    }, 0);

    // Handle backdrop click
    overlayRef.backdropClick().subscribe(() => {
        this.closeAnnouncements();
    });
}

// Helper method to apply language to dialog
private applyDialogLanguage() {
    // Wait for the dialog to be rendered in DOM
    setTimeout(() => {
        const dialog = document.querySelector('.announcement-dialog');
        if (!dialog) return;

        const enElements = dialog.querySelectorAll('.en');
        const hiElements = dialog.querySelectorAll('.hi');
        
        // Apply current language from this.currentLanguage
        if (this.currentLanguage === 'en') {
            enElements.forEach(el => (el as HTMLElement).style.display = 'block');
            hiElements.forEach(el => (el as HTMLElement).style.display = 'none');
        } else {
            enElements.forEach(el => (el as HTMLElement).style.display = 'none');
            hiElements.forEach(el => (el as HTMLElement).style.display = 'block');
        }
    }, 10);
}

// Update your switchLanguage method to also update the dialog if it's open
switchLanguage(lang: string) {
    this.currentLanguage = lang;
    
    // Store preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
    window.dispatchEvent(new CustomEvent('preferredLanguageChanged', { detail: lang }));
    
    // Update all language-specific elements on the page
    const enElements = document.querySelectorAll('.en');
    const hiElements = document.querySelectorAll('.hi');
    const enButtons = document.querySelectorAll('.en-btn');
    const hiButtons = document.querySelectorAll('.hi-btn');
    
    // Update content visibility
    if (lang === 'en') {
        enElements.forEach(el => (el as HTMLElement).style.display = 'block');
        hiElements.forEach(el => (el as HTMLElement).style.display = 'none');
        document.body.classList.remove('hindi');
        
        // Update buttons
        enButtons.forEach(btn => btn.classList.add('active'));
        hiButtons.forEach(btn => btn.classList.remove('active'));
    } else {
        enElements.forEach(el => (el as HTMLElement).style.display = 'none');
        hiElements.forEach(el => (el as HTMLElement).style.display = 'block');
        document.body.classList.add('hindi');
        
        // Update buttons
        enButtons.forEach(btn => btn.classList.remove('active'));
        hiButtons.forEach(btn => btn.classList.add('active'));
    }
    
    // Also update dialog language if it's open
    if (this.showAnnouncementDialog) {
        this.applyDialogLanguage();
    }
}

  closeAnnouncements() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = undefined;
      this.showAnnouncementDialog = false;
    }
  }

  onLogin(){
        this.authService.logout();
    setTimeout(() => {
    this.router.navigate(['/login']);
        }, 1000);

  }

  loadNews() {
    this.newsService.getActiveNews().subscribe({
      next: (response) => {
        this.activeNews = response.news;
      },
      error: (error) => {
        console.error('Failed to load news:', error);
        // Set default news if API fails
        this.activeNews = {
          text: 'Welcome to ThinkCivil IAS - Your partner in UPSC preparation journey!',
          textHi: 'थिंकसिविल आईएएस में आपका स्वागत है - यूपीएससी की तैयारी की यात्रा में आपका साथी!'
        };
      }
    });
  }
}
