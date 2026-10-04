// view-free-resources.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FreeResourcePublicService, PublicFreeResourceItem } from '../../../shared/services/free-resource-public.service';

interface BreadcrumbItem {
  name: string;
  path: string;
  id?: string;
  type: 'module' | 'folder' | 'file';
}

@Component({
  selector: 'app-view-free-resources',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-free-resources.component.html',
  styleUrls: ['./view-free-resources.component.css']
})
export class ViewFreeResourcesComponent implements OnInit {
  // Module data passed from parent
  moduleData: any = null;
  
  // Current language
  currentLanguage: string = 'en';
  
  // Data
  currentItems: PublicFreeResourceItem[] = [];
  currentParentId: string | null = null;
  
  // UI State
  isLoading: boolean = false;
  breadcrumbs: BreadcrumbItem[] = [];
  
  constructor(
    public dialogRef: MatDialogRef<ViewFreeResourcesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { module: any },
    private freeResourcePublicService: FreeResourcePublicService
  ) {}

  ngOnInit() {
    // Get language preference
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang) {
      this.currentLanguage = savedLang;
    }
    
    // Get module data
    this.moduleData = this.data.module;
    
    // Load the module content
    this.loadModuleContent();
  }

  // Load module content
  loadModuleContent() {
    this.isLoading = true;
    
    // Set parent ID to module ID to get its contents
    this.currentParentId = this.moduleData._id;
    
    this.loadDirectoryTree(this.moduleData._id);
  }

  // Load directory tree with proper typing
  loadDirectoryTree(parentId?: string | null) {
    this.isLoading = true;
    
    this.freeResourcePublicService.getPublicDirectoryTree(parentId || undefined).subscribe({
      next: (response) => {
        this.currentItems = response.items || [];
        this.updateBreadcrumbs();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load directory', error);
        this.currentItems = [];
        this.isLoading = false;
      }
    });
  }

  // Update breadcrumbs
  updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    // Add module as root
    breadcrumbs.push({
      name: this.getModuleName(),
      path: '',
      type: 'module'
    });
    
    // Add navigation history
    if (this.breadcrumbs.length > 1) {
      breadcrumbs.push(...this.breadcrumbs.slice(1));
    }
    
    this.breadcrumbs = breadcrumbs;
  }

  // Navigate to folder
  navigateToFolder(folderId: string, folderName: string) {
    this.breadcrumbs.push({
      name: folderName,
      path: folderId,
      id: folderId,
      type: 'folder'
    });
    
    this.currentParentId = folderId;
    this.loadDirectoryTree(folderId);
  }

  // Navigate via breadcrumb
  navigateBreadcrumb(index: number) {
    if (index < this.breadcrumbs.length - 1) {
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      
      if (index === 0) {
        // Back to module root
        this.currentParentId = this.moduleData._id;
      } else {
        this.currentParentId = this.breadcrumbs[index].id || null;
      }
      
      this.loadDirectoryTree(this.currentParentId);
    }
  }

  // Navigate up
  goBack() {
    if (this.breadcrumbs.length > 1) {
      this.breadcrumbs.pop();
      
      if (this.breadcrumbs.length === 1) {
        this.currentParentId = this.moduleData._id;
      } else {
        this.currentParentId = this.breadcrumbs[this.breadcrumbs.length - 1].id || null;
      }
      
      this.loadDirectoryTree(this.currentParentId);
    } else {
      this.dialogRef.close();
    }
  }

  // Open file with proper typing
  openFile(fileLink: string | undefined) {
    if (fileLink) {
      window.open(fileLink, '_blank');
    }
  }

  // Copy file link to clipboard
  copyFileLink(item: PublicFreeResourceItem) {
    if (item.type === 'file' && item.fileLink) {
      navigator.clipboard.writeText(item.fileLink).then(() => {
        this.showToast('Link copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy link', err);
        this.showToast('Failed to copy link', 'error');
      });
    }
  }

  // Show toast message
  showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#10b981' : '#ef4444'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }

  // Helper methods for template
  getModuleName(): string {
    if (this.currentLanguage === 'hi' && this.moduleData?.nameHi) {
      return this.moduleData.nameHi;
    }
    return this.moduleData?.name || 'Module';
  }

  getItemName(item: PublicFreeResourceItem): string {
    if (this.currentLanguage === 'hi' && item.nameHi) {
      return item.nameHi;
    }
    return item.name;
  }

  getResourceTypeName(): string {
    return 'Free Resources';
  }

  getHeaderIcon(): string {
    return 'fa-graduation-cap';
  }

  getHomeIcon(): string {
    return 'fa-home';
  }

  isFolder(item: PublicFreeResourceItem): boolean {
    return item.type === 'folder';
  }

  getIconForFileType(fileType?: string): string {
    if (!fileType) return 'description';
    
    const iconMap: { [key: string]: string } = {
      'pdf': 'picture_as_pdf',
      'image': 'image',
      'video': 'videocam',
      'audio': 'audiotrack',
      'document': 'description',
      'other': 'insert_drive_file'
    };
    
    return iconMap[fileType] || 'insert_drive_file';
  }

  getFileTypeDisplay(item: PublicFreeResourceItem): string {
    if (item.fileType) {
      const typeMap: { [key: string]: string } = {
        'pdf': 'PDF Document',
        'image': 'Image',
        'video': 'Video',
        'audio': 'Audio',
        'document': 'Document',
        'other': 'File'
      };
      return typeMap[item.fileType] || item.fileType.charAt(0).toUpperCase() + item.fileType.slice(1);
    }
    return 'File';
  }

  getFileClass(item: PublicFreeResourceItem): string {
    let classes = 'file';
    if (!item?.fileLink) {
      classes += ' unavailable';
    }
    return classes;
  }

  getActionIcon(item: PublicFreeResourceItem): string {
    return 'fa-external-link';
  }

  // Language switching
  switchLanguage(lang: string) {
    this.currentLanguage = lang;
    localStorage.setItem('preferredLanguage', lang);
    this.updateBreadcrumbs();
  }
}