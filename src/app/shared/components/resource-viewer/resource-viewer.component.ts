// shared/components/resource-viewer/resource-viewer.component.ts
import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ModuleService, Module } from '../../../shared/services/module.service';

export interface ResourceViewerData {
  module: Module;
  resourceType?: 'pyq' | 'notes' | 'test' | 'all';
  resourceFolderName?: string;
  title?: string;
}

interface BreadcrumbItem {
  name: string;
  id: string;
  type: 'module' | 'folder';
}

@Component({
  selector: 'app-resource-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resource-viewer.component.html',
  styleUrls: ['./resource-viewer.component.css']
})
export class ResourceViewerComponent implements OnInit, OnDestroy {
  
  // Data
  moduleData: Module | null = null;
  resourceType: 'pyq' | 'notes' | 'test' | 'all' = 'all';
  resourceFolderName: string = '';
  
  // UI State
  isLoading: boolean = false;
  currentLanguage: string = 'en';
  currentItems: Module[] = [];
  breadcrumbs: BreadcrumbItem[] = [];
  dialogTitle: string = '';
  folderNotFound: boolean = false;
  
  // Subscriptions
  private languageCheckInterval: any;

  constructor(
    public dialogRef: MatDialogRef<ResourceViewerComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ResourceViewerData,
    private moduleService: ModuleService
  ) {}

  ngOnInit(): void {
    // Get language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    this.currentLanguage = savedLang === 'hi' ? 'hi' : 'en';
    
    // Set up language change listener
    this.languageCheckInterval = setInterval(() => {
      const newLang = localStorage.getItem('preferredLanguage') === 'hi' ? 'hi' : 'en';
      if (newLang !== this.currentLanguage) {
        this.currentLanguage = newLang;
        this.updateLanguage();
      }
    }, 500);
    
    // Get module data
    this.moduleData = this.data.module;
    
    // Set resource type - default to 'all' if not provided or if it's an invalid value
    const providedType = this.data.resourceType;
    if (providedType === 'pyq' || providedType === 'notes' || providedType === 'test' || providedType === 'all') {
      this.resourceType = providedType;
    } else {
      this.resourceType = 'all'; // Default for 'study-material' or any other value
    }
    
    this.resourceFolderName = this.data.resourceFolderName || this.getDefaultFolderName();
    this.dialogTitle = this.data.title || this.getDefaultTitle();
    
    console.log('ResourceViewer initialized with:', {
      module: this.moduleData,
      resourceType: this.resourceType,
      resourceFolderName: this.resourceFolderName
    });
    
    // Load content
    this.loadContent();
  }

  ngOnDestroy(): void {
    if (this.languageCheckInterval) {
      clearInterval(this.languageCheckInterval);
    }
  }

  private getDefaultFolderName(): string {
    const folderNames: Record<string, string> = {
      pyq: 'PYQ',
      notes: 'Notes',
      test: 'Test',
      all: ''
    };
    return folderNames[this.resourceType];
  }

  private getDefaultTitle(): string {
    if (!this.moduleData) return 'Resources';
    
    const moduleName = this.getSafeName(this.moduleData);
    
    const titles: Record<string, string> = {
      pyq: this.currentLanguage === 'en' ? `${moduleName} - PYQ` : `${moduleName} - पिछले प्रश्न`,
      notes: this.currentLanguage === 'en' ? `${moduleName} - Notes` : `${moduleName} - नोट्स`,
      test: this.currentLanguage === 'en' ? `${moduleName} - Tests` : `${moduleName} - टेस्ट`,
      all: moduleName
    };
    
    return titles[this.resourceType];
  }

  private getSafeName(item: Module): string {
    if (!item || !item.name) return 'Module';
    if (this.currentLanguage === 'hi' && item.name.hindi) {
      return item.name.hindi;
    }
    return item.name.english || 'Module';
  }

  private updateLanguage(): void {
    this.dialogTitle = this.getDefaultTitle();
    this.updateBreadcrumbNames();
    // Refresh current items display
    if (this.currentItems.length > 0) {
      this.currentItems = [...this.currentItems];
    }
  }

  private updateBreadcrumbNames(): void {
    this.breadcrumbs = this.breadcrumbs.map(crumb => ({
      ...crumb,
      name: crumb.type === 'module' && this.moduleData ? this.getSafeName(this.moduleData) : crumb.name
    }));
  }

  private getModuleDisplayName(): string {
    if (!this.moduleData) return '';
    return this.getSafeName(this.moduleData);
  }

  private loadContent(): void {
    if (!this.moduleData) return;
    
    this.isLoading = true;
    this.folderNotFound = false;
    
    // For all resource types, load the module tree
    this.loadModuleTree();
  }

  private loadModuleTree(): void {
    if (!this.moduleData) return;
    
    console.log('Loading module tree for:', this.moduleData._id);
    
    this.breadcrumbs = [
      { name: this.getModuleDisplayName(), id: this.moduleData._id, type: 'module' }
    ];
    
    this.moduleService.getPublicModuleTree(this.moduleData._id).subscribe({
      next: (response) => {
        console.log('Module tree response:', response);
        
        if (response && response.module) {
          const moduleTree = response.module;
          const children = moduleTree.children || [];
          
          console.log('Module children:', children);
          
          // If we're filtering for a specific resource type (PYQ/Notes/Test)
          if (this.resourceType !== 'all') {
            // Find the target folder
            const targetFolder = this.findFolderByName(children, this.resourceFolderName);
            
            if (targetFolder) {
              console.log('Target folder found:', targetFolder);
              this.currentItems = targetFolder.children || [];
              this.breadcrumbs.push({
                name: this.getItemDisplayName(targetFolder),
                id: targetFolder._id,
                type: 'folder'
              });
            } else {
              // Try to find by Hindi name
              const hindiFolderName = this.getHindiFolderName();
              const targetFolderHindi = this.findFolderByName(children, hindiFolderName, true);
              
              if (targetFolderHindi) {
                console.log('Target folder found (Hindi):', targetFolderHindi);
                this.currentItems = targetFolderHindi.children || [];
                this.breadcrumbs.push({
                  name: this.getItemDisplayName(targetFolderHindi),
                  id: targetFolderHindi._id,
                  type: 'folder'
                });
              } else {
                console.log('Target folder not found:', this.resourceFolderName);
                this.folderNotFound = true;
                this.currentItems = [];
              }
            }
          } else {
            // Show all items in the module
            this.currentItems = children;
          }
        } else {
          console.error('Invalid module tree response');
          this.currentItems = [];
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load module tree:', error);
        this.currentItems = [];
        this.isLoading = false;
      }
    });
  }

  private findFolderByName(items: Module[], folderName: string, isHindi: boolean = false): Module | null {
    if (!items || !items.length) return null;
    
    for (const item of items) {
      if (item.type === 'folder') {
        const itemName = isHindi ? (item.name?.hindi || '') : (item.name?.english || '');
        if (itemName.trim().toLowerCase() === folderName.trim().toLowerCase()) {
          return item;
        }
      }
    }
    for (const item of items) {
      const nested = this.findFolderByName(item.children || [], folderName, isHindi);
      if (nested) return nested;
    }
    return null;
  }

  private getHindiFolderName(): string {
    const hindiNames: Record<string, string> = {
      pyq: 'पिछले प्रश्न',
      notes: 'नोट्स',
      test: 'टेस्ट',
      all: ''
    };
    return hindiNames[this.resourceType] || '';
  }

  // Navigation Methods
  navigateToFolder(folder: Module): void {
    if (folder.type !== 'folder') return;
    
    console.log('Navigating to folder:', folder);
    
    this.breadcrumbs.push({
      name: this.getItemDisplayName(folder),
      id: folder._id,
      type: 'folder'
    });
    
    // If the folder has children, use them; otherwise load from API
    if (folder.children && folder.children.length > 0) {
      this.currentItems = folder.children;
    } else {
      // Load folder contents from API
      this.loadFolderContents(folder._id);
    }
  }

  private loadFolderContents(folderId: string): void {
    this.isLoading = true;
    
    this.moduleService.getPublicDirectoryTree(undefined, folderId).subscribe({
      next: (response) => {
        console.log('Folder contents:', response);
        this.currentItems = response?.items || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load folder contents:', error);
        this.currentItems = [];
        this.isLoading = false;
      }
    });
  }

  navigateToBreadcrumb(index: number): void {
    if (index >= this.breadcrumbs.length - 1) return;
    
    this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
    
    if (index === 0) {
      // Back to module root
      this.loadModuleTree();
    } else {
      // Navigate to the specific folder in the breadcrumb
      const folderId = this.breadcrumbs[index].id;
      this.loadFolderContents(folderId);
    }
  }

  goBack(): void {
    if (this.breadcrumbs.length > 1) {
      this.breadcrumbs.pop();
      
      if (this.breadcrumbs.length === 1) {
        this.loadModuleTree();
      } else {
        const folderId = this.breadcrumbs[this.breadcrumbs.length - 1].id;
        this.loadFolderContents(folderId);
      }
    } else {
      this.closeDialog();
    }
  }

  // File Actions
  openFile(fileLink: string | undefined): void {
    if (fileLink) {
      window.open(fileLink, '_blank');
    }
  }

  copyFileLink(item: Module): void {
    if (item.type === 'file' && item.fileLink) {
      navigator.clipboard.writeText(item.fileLink).then(() => {
        this.showToast('Link copied to clipboard!', 'success');
      }).catch(err => {
        console.error('Failed to copy link:', err);
        this.showToast('Failed to copy link', 'error');
      });
    }
  }

  // Helper Methods
  getItemDisplayName(item: Module): string {
    if (!item || !item.name) return 'Item';
    if (this.currentLanguage === 'hi' && item.name.hindi) {
      return item.name.hindi;
    }
    return item.name.english || 'Item';
  }

  getHeaderIcon(): string {
    const icons: Record<string, string> = {
      pyq: 'fa-question-circle',
      notes: 'fa-book',
      test: 'fa-pencil-square-o',
      all: 'fa-folder-open'
    };
    return icons[this.resourceType] || 'fa-folder-open';
  }

  getHomeIcon(): string {
    return 'fa-home';
  }

  isFolder(item: Module): boolean {
    return item?.type === 'folder';
  }

  getFileIconClass(fileType?: string): string {
    const icons: Record<string, string> = {
      'pdf': 'fa-file-pdf-o',
      'image': 'fa-file-image-o',
      'video': 'fa-file-video-o',
      'audio': 'fa-file-audio-o',
      'document': 'fa-file-word-o',
      'other': 'fa-file-o'
    };
    return icons[fileType || 'other'] || 'fa-file-o';
  }

  getFileIconColor(fileType?: string): string {
    const colors: Record<string, string> = {
      'pdf': '#ef4444',
      'image': '#10b981',
      'video': '#3b82f6',
      'audio': '#f59e0b',
      'document': '#8b5cf6',
      'other': '#6b7280'
    };
    return colors[fileType || 'other'] || '#6b7280';
  }

  getFileTypeDisplay(item: Module): string {
    if (!item || !item.fileType) return this.currentLanguage === 'en' ? 'File' : 'फ़ाइल';
    
    const typeMap: Record<string, { en: string; hi: string }> = {
      'pdf': { en: 'PDF Document', hi: 'पीडीएफ दस्तावेज़' },
      'image': { en: 'Image', hi: 'छवि' },
      'video': { en: 'Video', hi: 'वीडियो' },
      'audio': { en: 'Audio', hi: 'ऑडियो' },
      'document': { en: 'Document', hi: 'दस्तावेज़' },
      'other': { en: 'File', hi: 'फ़ाइल' }
    };
    
    return typeMap[item.fileType]?.[this.currentLanguage as 'en' | 'hi'] || 'File';
  }

  getEmptyMessage(): string {
    if (this.folderNotFound) {
      const folderMessages: Record<string, string> = {
        pyq: this.currentLanguage === 'en' ? 'PYQ folder not found in this module' : 'इस मॉड्यूल में पिछले प्रश्न फ़ोल्डर नहीं मिला',
        notes: this.currentLanguage === 'en' ? 'Notes folder not found in this module' : 'इस मॉड्यूल में नोट्स फ़ोल्डर नहीं मिला',
        test: this.currentLanguage === 'en' ? 'Test folder not found in this module' : 'इस मॉड्यूल में टेस्ट फ़ोल्डर नहीं मिला',
        all: this.currentLanguage === 'en' ? 'No items found' : 'कोई आइटम नहीं मिला'
      };
      return folderMessages[this.resourceType] || (this.currentLanguage === 'en' ? 'Folder not found' : 'फ़ोल्डर नहीं मिला');
    }
    
    if (this.resourceType !== 'all') {
      const resourceName = this.resourceType === 'pyq' ? (this.currentLanguage === 'en' ? 'PYQ' : 'पिछले प्रश्न') : 
                           this.resourceType === 'notes' ? (this.currentLanguage === 'en' ? 'Notes' : 'नोट्स') : 
                           (this.currentLanguage === 'en' ? 'Test' : 'टेस्ट');
      return this.currentLanguage === 'en' 
        ? `No ${resourceName} content available in this module yet.`
        : `इस मॉड्यूल में अभी तक कोई ${resourceName} सामग्री उपलब्ध नहीं है।`;
    }
    
    return this.currentLanguage === 'en' 
      ? 'This module is empty'
      : 'यह मॉड्यूल खाली है';
  }

  // UI Helpers
  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 100000;
      animation: slideIn 0.3s ease;
      font-size: 14px;
      font-family: inherit;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
