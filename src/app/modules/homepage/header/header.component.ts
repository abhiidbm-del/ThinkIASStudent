import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environment/environment';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { CommonModule, DatePipe } from '@angular/common';
import { AfterViewInit, Component, EventEmitter, HostListener, inject, Input, OnDestroy, OnInit, Output, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { RouterModule, Router } from '@angular/router';
import { ResourcesViewComponent } from '../../../shared/components/resources-view/resources-view.component';
import { ViewFreeResourcesComponent } from '../../../shared/components/view-free-resources/view-free-resources.component';
import { ViewResources2Component } from '../../../shared/components/view-resources2/view-resources2.component';
import { AuthService } from '../../../shared/services/auth.service';
import { FreeResourcePublicService } from '../../../shared/services/free-resource-public.service';
import { SimpleNewsService } from '../../../shared/services/simple-news.service';
import { UserService } from '../../../shared/services/user.service';
import { LanguageService } from '../../../shared/i18n/language.service';
import { ObjectiveSliderComponent } from '../objective-slider/objective-slider.component';
import { ReviewSliderComponent } from '../review-slider/review-slider.component';
import { SliderComponent } from '../slider/slider.component';
import { StudymaterialSliderComponent } from '../studymaterial-slider/studymaterial-slider.component';

@Component({
  selector: 'app-header',
  imports: [
    CommonModule,
    
    RouterModule
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
    providers: [DatePipe]

})
export class HeaderComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('announcementDialog') announcementDialog!: TemplateRef<any>;

  @Input() language!: string;
@Output() languageChange = new EventEmitter<string>();

  
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
    private languageService = inject(LanguageService);

  private http = inject(HttpClient);
  programs: any[] = [];
  programGroups = [
    {label:'Mentorship Program',hi:'मेंटरशिप प्रोग्राम',categories:['Mentorship Course','Optional Mentorship Course']},
    {label:'Test Series',hi:'टेस्ट सीरीज',categories:['Test Series','Optional Test Series']}
  ];
  groupPrograms(group:any){return this.programs.filter(p=>group.categories.includes(p.programCategory));}
  programDisplayName(program: any): string {
    if (this.currentLanguage !== 'hi') return program.programName;
    return program.programNameHindi?.trim() || this.languageService.text(program.programName);
  }
  announcements: any[] = [];
  announcementCount: number = 0;
  showAnnouncementDialog: boolean = false;

  modules: any[] = [];
  loadingModules: boolean = false;
  modulesError: boolean = false;
    activeNews: any = null;
  
  constructor(private datePipe: DatePipe, private dialog: MatDialog, private userService: UserService) {}
    showSplash = true;
    
  ngOnInit(): void {
    // AOS.init({
    //   duration: 1000,
    //   once: true,
    //   offset: 100
    // });
    
    this.http.get<any>(environment.apiUrl + '/programs?activeOnly=true').subscribe({next:r=>this.programs=r.data||[],error:()=>this.programs=[]});
    this.checkMobileView();
    this.initializeLanguage();
    this.startLiveClock();
    this.loadAnnouncements(); // Load announcements on init
    this.loadModules();

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

        this.closeAnnouncements();
  }
  
  ngAfterViewInit(): void {
    // AOS.refresh();
    this.updateLanguageButtons();
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.http.get<any>(environment.apiUrl + '/programs?activeOnly=true').subscribe({next:r=>this.programs=r.data||[],error:()=>this.programs=[]});
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

  // scrollToSection(sectionId: string): void {
  //   const element = document.getElementById(sectionId);
  //   if (element) {
  //     const yOffset = -80; // Adjust for fixed header
  //     const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
  //     window.scrollTo({ top: y, behavior: 'smooth' });
  //   }
  // }

  scrollToSection(sectionId: string): void {
  // Check if we're on the homepage
  const isHomePage = this.router.url === '/' || this.router.url === '/homepage';
  
  if (isHomePage) {
    // If on homepage, just scroll
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Adjust for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  } else {
    // If on another page, navigate to homepage with the section id as fragment
    this.router.navigate(['/homepage'], { fragment: sectionId }).then(() => {
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          const yOffset = -80;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 300); // Small delay to ensure DOM is loaded
    });
  }
}

  openView(type: string) {
  const dialogRef = this.dialog.open(ResourcesViewComponent, {
    data: { type: type },
    width: 'calc(100vw - 40px)',
    height: 'calc(100vh - 40px)',
    maxWidth: '1200px',
    maxHeight: '450px',
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
    maxHeight: '450px',
    panelClass: 'resources-dialog-container',
    disableClose: false,
    autoFocus: false
  });

  
  // Optional: Handle dialog close
  dialogRef.afterClosed().subscribe(() => {
    console.log('Dialog closed');
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
        maxHeight: '700px',
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
        this.languageChange.emit(lang);
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

  openFreeQuiz() {
  // navigate or open quiz page
  this.router.navigate(['/free-quiz']);
}
}
