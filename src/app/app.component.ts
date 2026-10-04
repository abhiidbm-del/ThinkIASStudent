import { HeaderComponent } from './modules/homepage/header/header.component';
import { PublicFooterComponent } from './shared/components/public-footer/public-footer.component';
import { LanguageToggleComponent } from './shared/i18n/language-toggle.component';
import { TranslatePipe } from './shared/i18n/translate.pipe';
import { Component, inject, signal, computed, ViewChild, OnInit, OnDestroy, AfterViewChecked, HostListener, ElementRef } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { filter, Subscription } from 'rxjs';
import { AuthService } from './shared/services/auth.service';
import { FullscreenService } from './shared/services/fullscreen.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NotificationService, StudentNotification } from './shared/services/notification.service';
import { ProctoringService } from './shared/services/proctoring.service';
import { MenuItem } from './core/models/user.model';

// Define user interface locally
interface User {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeaderComponent, PublicFooterComponent, LanguageToggleComponent, TranslatePipe, 
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatBadgeModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {
  readonly proctoring = inject(ProctoringService);
  recordingError = '';
  async retryRecording() {
    this.recordingError = '';
    try { await this.proctoring.finish(); }
    catch { this.recordingError = 'Recording upload failed. Keep this page open and retry.'; }
  }
  title = 'ThinkCivil IAS';
  authService = inject(AuthService);
  fullscreenService = inject(FullscreenService);
  router = inject(Router);
  breakpointObserver = inject(BreakpointObserver);
  notificationService = inject(NotificationService);
  
  @ViewChild('sidenav') sidenav!: MatSidenav;
  @ViewChild('profileContainer') profileContainer!: ElementRef;
  @ViewChild('notificationContainer') notificationContainer!: ElementRef;
  @ViewChild('shellPreview') shellPreview?: ElementRef<HTMLVideoElement>;
  
  currentRoute = signal('');
  standalonePublicPage = computed(() => {
    const segment = this.firstPathSegment(this.currentRoute() || this.router.url);
    return !segment || ['homepage', 'integrated-program', 'landing-page'].includes(segment);
  });
  publicLayout = computed(() => ['careers-page', 'programs', 'program', 'program-faqs', 'terms', 'payment-policies'].includes(this.firstPathSegment(this.currentRoute() || this.router.url)));
  navMenuItems = computed(() => this.withSeriesMenus(this.authService.menuItems(), this.authService.currentUser()));
  isMobile = signal(false);
  sidenavOpen = signal(true);
  showProfileDropdown = signal(false);
  showNotifications = signal(false);
   private expandedMenus = signal<Set<string>>(new Set(['Prelims', 'Mains']));
  
  private breakpointSubscription!: Subscription;

  constructor() {
    // Track current route
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      if (this.authService.isLoggedIn() && !this.notificationService.notifications().length) this.notificationService.load();
      this.currentRoute.set(event.url);
      // Close sidenav on mobile after navigation
      if (this.isMobile()) {
        this.closeSidenav();
      }
      // Close profile dropdown on route change
      this.closeProfileDropdown();
    });
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.notificationService.load();
      this.authService.refreshUser().subscribe({ error: error => console.error('Unable to refresh navigation:', error) });
    }
    // Watch for screen size changes
    this.breakpointSubscription = this.breakpointObserver
      .observe([
        Breakpoints.Handset,
        Breakpoints.TabletPortrait,
        '(max-width: 768px)'
      ])
      .subscribe(result => {
        const isMobileNow = result.matches;
        this.isMobile.set(isMobileNow);
        
        // Adjust sidenav state based on screen size
        if (isMobileNow) {
          this.closeSidenav();
        } else {
          this.sidenavOpen.set(true);
          if (this.sidenav) {
            this.sidenav.open();
          }
        }
        
        // Close profile dropdown on screen size change
        this.closeProfileDropdown();
      });
  }

  ngAfterViewChecked() {
    const video = this.shellPreview?.nativeElement;
    if (this.proctoring.active() && video) this.proctoring.bindPreview(video);
  }

  toggleNotifications() { this.showNotifications.update(value => !value); }

  openNotification(item: StudentNotification) {
    this.notificationService.markRead(item);
    this.showNotifications.set(false);
    if (item.link) this.router.navigateByUrl(item.link);
  }

  enablePush() {
    this.notificationService.enablePush().catch(error => alert(error.message));
  }

  ngOnDestroy() {
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Close dropdown if clicked outside
    if (this.showProfileDropdown() && 
        this.profileContainer && 
        !this.profileContainer.nativeElement.contains(event.target)) {
      this.closeProfileDropdown();
    }
    if (this.showNotifications() &&
        this.notificationContainer &&
        !this.notificationContainer.nativeElement.contains(event.target)) {
      this.showNotifications.set(false);
    }
  }

  // Get user data directly from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Error parsing user data:', e);
        return null;
      }
    }
    return null;
  }

  // Get user initials for avatar
  getUserInitials(): string {
    const user = this.getCurrentUser();
    if (!user?.fullName) return 'U';
    
    const names = user.fullName.split(' ');
    if (names.length > 1) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return user.fullName[0].toUpperCase();
  }

  // Toggle profile dropdown
  toggleProfileDropdown(): void {
    this.showProfileDropdown.update(value => !value);
  }

  // Close profile dropdown
  closeProfileDropdown(): void {
    this.showProfileDropdown.set(false);
  }

  // Get sidenav mode based on screen size
  getSidenavMode(): 'over' | 'side' {
    return this.isMobile() ? 'over' : 'side';
  }

  getMenuIcon(item: MenuItem): string {
    const label = item.name.toLowerCase();
    const iconMap: Record<string, string> = {
      dashboard: 'dashboard',
      home: 'home',
      prelims: 'school',
      mains: 'edit_note',
      result: 'insights',
      test: 'quiz',
      quiz: 'quiz',
      material: 'library_books',
      study: 'menu_book',
      profile: 'person',
      setting: 'settings',
      notification: 'notifications',
      answer: 'rate_review',
      evaluation: 'fact_check',
      tracker: 'track_changes',
      meeting: 'groups'
    };

    const match = Object.keys(iconMap).find(key => label.includes(key));
    return match ? iconMap[match] : item.icon || 'chevron_right';
  }

  // Check if sidenav should be open
  isSidenavOpen(): boolean {
    return this.sidenavOpen();
  }

  // Handle sidenav toggle
  onSidenavToggle(isOpen: boolean) {
    this.sidenavOpen.set(isOpen);
  }

  // Close sidenav
  closeSidenav() {
    this.sidenavOpen.set(false);
    if (this.sidenav) {
      this.sidenav.close();
    }
  }

  // Open sidenav
  openSidenav() {
    this.sidenavOpen.set(true);
    if (this.sidenav) {
      this.sidenav.open();
    }
  }

  // Toggle sidenav
  toggleSidenav() {
    if (this.isMobile()) {
      if (this.sidenavOpen()) {
        this.closeSidenav();
      } else {
        this.openSidenav();
      }
    } else {
      this.sidenavOpen.set(!this.sidenavOpen());
      if (this.sidenav) {
        this.sidenav.toggle();
      }
    }
  }

  // Close sidenav on mobile when clicking a link
  closeSidenavOnMobile() {
    if (this.isMobile()) {
      this.closeSidenav();
    }
  }

  toggleMenu(menuName: string): void {
    this.expandedMenus.update(menus => {
      const updated = new Set(menus);
      updated.has(menuName) ? updated.delete(menuName) : updated.add(menuName);
      return updated;
    });
  }

  isMenuExpanded(menuName: string): boolean { return this.expandedMenus().has(menuName); }

  // Computed property for route name
  currentRouteName = computed(() => {
    const route = this.currentRoute();
    if (route.includes('/take-test')) return 'Test Session';
    return 'Fullscreen Mode';
  });

  // Show header only for specific fullscreen routes
  showFullscreenHeader(): boolean {
    const route = this.currentRoute();
    return route.includes('/take-test');
  }

  private firstPathSegment(url: string): string {
    return (url || '').split(/[?#]/)[0].split('/').filter(Boolean)[0] || '';
  }

  private withSeriesMenus(items: MenuItem[], user: { role?: string; type?: string } | null): MenuItem[] {
    if (user?.role !== 'student') return items;
    const hasTop = (path: string) => items.some(item => item.path === path);
    const extras: MenuItem[] = [];
    if ((user.type === 'pre' || user.type === 'combo') && !hasTop('/prelims-test-series')) {
      extras.push({ name: 'Prelims Test Series', path: '/prelims-test-series', icon: 'event_note' });
    }
    if ((user.type === 'mains' || user.type === 'combo') && !hasTop('/mains-test-series')) {
      extras.push({ name: 'Mains Test Series', path: '/mains-test-series', icon: 'event_note' });
    }
    const withoutNested = items.map(item => !item.children?.length ? item : {
      ...item,
      children: item.children.filter(child => child.path !== '/prelims-test-series' && child.path !== '/mains-test-series')
    });
    const insertAt = Math.min(1, withoutNested.length);
    return [...withoutNested.slice(0, insertAt), ...extras, ...withoutNested.slice(insertAt)];
  }

  logout() {
    this.closeProfileDropdown();
    this.authService.logout();
    // Exit fullscreen if active
    if (this.fullscreenService.isFullscreen()) {
      this.fullscreenService.exitFullscreen();
    }
  }
}
