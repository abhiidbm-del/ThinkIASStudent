import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectoryService } from '../../shared/services/directory.service';
import { DirectoryItem } from '../../core/models/directory.model';

interface BreadcrumbItem {
  name: string;
  id: string | null;
  item?: DirectoryItem;
}

@Component({
  selector: 'app-materials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './materials.component.html',
  styleUrls: ['./materials.component.css']
})
export class MaterialsComponent implements OnInit {
  // Data
  items: DirectoryItem[] = [];
  currentItem: DirectoryItem | null = null;
  breadcrumbs: BreadcrumbItem[] = [];
  
  // Track navigation history for breadcrumb
  navigationHistory: DirectoryItem[] = [];
  
  // UI State
  loading = false;
  
  // Messages
  infoMessage = '';
  errorMessage = '';
  
  constructor(private directoryService: DirectoryService) {}
  
  ngOnInit() {
    this.loadDirectoryTree();
    this.updateBreadcrumbs();
  }
  
  // Load directory tree
  loadDirectoryTree(parentId?: string | null) {
    this.loading = true;
    const apiParentId = parentId || undefined;
    
    this.directoryService.getDirectoryTree(apiParentId).subscribe({
      next: (response) => {
        this.items = response.items || [];
        this.loading = false;
        this.clearMessages();
      },
      error: (error) => {
        this.showError('Failed to load study materials', error);
      }
    });
  }
  
  // Navigate to item
  navigateTo(item: DirectoryItem) {
    if (item.type === 'folder') {
      if (this.currentItem) {
        this.navigationHistory.push(this.currentItem);
      }
      
      this.currentItem = item;
      this.updateBreadcrumbs();
      this.loadDirectoryTree(item._id);
    } else {
      this.openFile(item);
    }
  }
  
  // Update breadcrumbs
  updateBreadcrumbs() {
    const breadcrumbs: BreadcrumbItem[] = [];
    
    breadcrumbs.push({
      name: 'Root',
      id: null
    });
    
    if (this.navigationHistory.length > 0) {
      this.navigationHistory.forEach(item => {
        breadcrumbs.push({
          name: item.name,
          id: item._id,
          item: item
        });
      });
    }
    
    if (this.currentItem) {
      breadcrumbs.push({
        name: this.currentItem.name,
        id: this.currentItem._id,
        item: this.currentItem
      });
    }
    
    this.breadcrumbs = breadcrumbs;
  }
  
  // Navigate via breadcrumb
  navigateBreadcrumb(breadcrumb: BreadcrumbItem) {
    if (breadcrumb.id === null) {
      this.currentItem = null;
      this.navigationHistory = [];
      this.loadDirectoryTree();
      this.updateBreadcrumbs();
      return;
    }
    
    if (breadcrumb.item) {
      const itemIndex = this.navigationHistory.findIndex(item => 
        item._id === breadcrumb.id
      );
      
      if (itemIndex >= 0) {
        this.navigationHistory = this.navigationHistory.slice(0, itemIndex);
        this.currentItem = breadcrumb.item;
      } else if (this.currentItem && breadcrumb.id === this.currentItem._id) {
        return;
      }
      
      this.updateBreadcrumbs();
      this.loadDirectoryTree(breadcrumb.id);
    }
  }
  
  // Navigate up
  navigateUp() {
    if (this.navigationHistory.length > 0) {
      this.currentItem = this.navigationHistory.pop() || null;
      this.updateBreadcrumbs();
      this.loadDirectoryTree(this.currentItem?._id || null);
    } else if (this.currentItem) {
      this.currentItem = null;
      this.updateBreadcrumbs();
      this.loadDirectoryTree();
    }
  }
  
  // Open file link
  openFile(item: DirectoryItem) {
    if (item.type === 'file' && item.fileLink) {
      window.open(item.fileLink, '_blank');
    } else {
      this.infoMessage = 'File link is not available';
    }
  }
  
  // Helper methods
  private showError(message: string, error: any) {
    this.loading = false;
    this.errorMessage = `${message}: ${error.error?.message || error.message || 'Unknown error'}`;
    console.error(message, error);
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
  
  private clearMessages() {
    this.infoMessage = '';
    this.errorMessage = '';
  }
  
  // File icon methods
  getFileIconColor(item: DirectoryItem): string {
    if (!item.fileType) return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    
    switch (item.fileType) {
      case 'pdf': return 'linear-gradient(135deg, #fee2e2, #fecaca)';
      case 'image': return 'linear-gradient(135deg, #dbeafe, #bfdbfe)';
      case 'document': return 'linear-gradient(135deg, #dcfce7, #bbf7d0)';
      case 'video': return 'linear-gradient(135deg, #fce7f3, #fbcfe8)';
      case 'audio': return 'linear-gradient(135deg, #fef3c7, #fde68a)';
      default: return 'linear-gradient(135deg, #f1f5f9, #e2e8f0)';
    }
  }
  
  getFileIconClass(item: DirectoryItem): string {
    if (!item.fileType) return 'fa fa-file';
    
    switch (item.fileType) {
      case 'pdf': return 'fa fa-file-pdf-o';
      case 'image': return 'fa fa-image';
      case 'document': return 'fa fa-file-text';
      case 'video': return 'fa fa-video-camera';
      case 'audio': return 'fa fa-music';
      default: return 'fa fa-file';
    }
  }
  
  getFileTypeLabel(fileType?: string): string {
    if (!fileType || fileType === 'other') {
      return 'File';
    }
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  }
}