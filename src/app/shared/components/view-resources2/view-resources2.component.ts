import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environment/environment';

interface BreadcrumbItem {
  name: string;
  path: string;
}

interface DirectoryItem {
  _id: string;
  name: string;
  type: 'folder' | 'file';
  category: string;
  path: string;
  fullPath: string;
  parent?: string;
  fileLink?: string;
  description?: string;
  fileType?: string;
  duration?: string;
  thumbnail?: string;
  children?: DirectoryItem[];
  _hasEnglish?: boolean;
  _hasHindi?: boolean;
}

@Component({
  selector: 'app-view-resources2',
  imports: [CommonModule],
  templateUrl: './view-resources2.component.html',
  styleUrl: './view-resources2.component.css'
})
export class ViewResources2Component implements OnInit {
  
  syllabusType: string = '';
  resourceType: number = 1; // 1 = Topicwise Directory, 2 = Video Lectures
  categoryMap: { [key: string]: string } = {
    'prelims': 'gs1-analysis',
    'mains': 'optional-subjects',
    'gs1': 'gs1-analysis',
    'gs2': 'gs2-analysis',
    'gs3': 'gs3-analysis',
    'gs4': 'gs4-analysis',
    'essay': 'essay-analysis',
    'optional': 'optional-subjects'
  };
  
  videoCategoryMap: { [key: string]: string } = {
    'prelims': 'gs1-videos',
    'mains': 'strategy-sessions',
    'gs1': 'gs1-videos',
    'gs2': 'gs2-videos',
    'gs3': 'gs3-videos',
    'gs4': 'gs4-videos',
    'essay': 'essay-videos',
    'optional': 'strategy-sessions',
    'strategy': 'strategy-sessions',
    'current': 'current-affairs',
    'mock': 'mock-interviews'
  };
  
  currentItems: DirectoryItem[] = [];
  currentParentId: string | null = null;
  breadcrumbs: BreadcrumbItem[] = [];
  isLoading: boolean = false;
  
  // API endpoints
  baseTopicwiseApiUrl: string = `${environment.apiUrl}/topicwiseDirectory`;
  baseVideoApiUrl: string = `${environment.apiUrl}/videoLecture`;

  constructor(
    public dialogRef: MatDialogRef<ViewResources2Component>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string, nType: number },
    private http: HttpClient
  ) {}

  ngOnInit() {
      
      this.syllabusType = this.data.type;
      this.resourceType = this.data.nType;

      console.log(this.resourceType);
      
    this.loadPublicDirectory();
  }

  getCategory(): string {
    if (this.resourceType === 2) {
      // Video Lectures
      return this.videoCategoryMap[this.syllabusType] || this.syllabusType;
    } else {
      // Topicwise Directory (default)
      return this.categoryMap[this.syllabusType] || this.syllabusType;
    }
  }

  getBaseApiUrl(): string {
    return this.resourceType === 2 ? this.baseVideoApiUrl : this.baseTopicwiseApiUrl;
  }

  getResourceTypeName(): string {
    return this.resourceType === 2 ? 'Video Lectures' : 'Topicwise Directory';
  }

  loadPublicDirectory() {
    this.isLoading = true;
    const category = this.getCategory();
    
    this.getPublicDirectoryTree(category, this.currentParentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentItems = response.tree || response.items || [];
          this.updateBreadcrumbs();
        } else {
          console.error('Failed to load directory:', response.message);
          this.currentItems = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading directory:', error);
        this.currentItems = [];
        this.isLoading = false;
      }
    });
  }

  getPublicDirectoryTree(category: string, parentId: string | null = null): Observable<any> {
    const baseUrl = this.getBaseApiUrl();
    let url = `${baseUrl}/public/tree/${category}`;
    
    if (parentId) {
      url += `?parentId=${parentId}`;
    }
    
    return this.http.get(url).pipe(
      catchError(error => {
        console.error('API Error:', error);
        return of({ success: false, message: 'Failed to fetch data', tree: [] });
      })
    );
  }

  navigateToFolder(folderId: string, folderName: string) {
    this.breadcrumbs.push({
      name: folderName,
      path: folderId
    });
    
    this.currentParentId = folderId;
    this.loadPublicDirectory();
  }

  navigateBreadcrumb(index: number) {
    if (index < this.breadcrumbs.length - 1) {
      this.breadcrumbs = this.breadcrumbs.slice(0, index + 1);
      
      if (index === 0) {
        this.currentParentId = null;
      } else {
        this.currentParentId = this.breadcrumbs[index].path;
      }
      
      this.loadPublicDirectory();
    }
  }

  updateBreadcrumbs() {
    const rootBreadcrumb: BreadcrumbItem = {
      name: this.getRootBreadcrumbName(),
      path: ''
    };
    
    if (this.breadcrumbs.length === 0) {
      this.breadcrumbs = [rootBreadcrumb];
    } else {
      this.breadcrumbs = [rootBreadcrumb, ...this.breadcrumbs.slice(1)];
    }
  }

  getRootBreadcrumbName(): string {
    const resourceType = this.resourceType === 2 ? 'Video Lectures' : 'Topicwise Analysis';
    const categoryName = this.formatName(this.getCategory());
    return `${categoryName} - ${resourceType}`;
  }

  formatName(name: string): string {
    const nameMap: { [key: string]: string } = {
      // Topicwise Directory names
      'gs1-analysis': 'GS Paper 1 Analysis',
      'gs2-analysis': 'GS Paper 2 Analysis',
      'gs3-analysis': 'GS Paper 3 Analysis',
      'gs4-analysis': 'GS Paper 4 Analysis',
      'essay-analysis': 'Essay Paper Analysis',
      'optional-subjects': 'Optional Subjects',
      'prelims': 'Prelims Analysis',
      'mains': 'Mains Analysis',
      
      // Video Lecture names
      'gs1-videos': 'GS Paper 1 Videos',
      'gs2-videos': 'GS Paper 2 Videos',
      'gs3-videos': 'GS Paper 3 Videos',
      'gs4-videos': 'GS Paper 4 Videos',
      'essay-videos': 'Essay Writing Videos',
      'strategy-sessions': 'Strategy Sessions',
      'current-affairs': 'Current Affairs',
      'mock-interviews': 'Mock Interviews'
    };
    
    return nameMap[name] || name
      .replace(/([A-Z])/g, ' $1')
      .replace(/-/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  isFolder(item: DirectoryItem): boolean {
    return item.type === 'folder';
  }

  openFile(fileLink: any) {
    if (fileLink) {
      window.open(fileLink, '_blank');
    }
  }

  goBack() {
    if (this.breadcrumbs.length > 1) {
      this.breadcrumbs.pop();
      
      if (this.breadcrumbs.length === 1) {
        this.currentParentId = null;
      } else {
        this.currentParentId = this.breadcrumbs[this.breadcrumbs.length - 1].path;
      }
      
      this.loadPublicDirectory();
    } else {
      this.dialogRef.close();
    }
  }

  getIconForFileType(fileType?: string): string {
    if (!fileType) return 'description';
    
    const iconMap: { [key: string]: string } = {
      // Topicwise Directory icons
      'pdf': 'picture_as_pdf',
      'image': 'image',
      'video': 'videocam',
      'audio': 'audiotrack',
      'document': 'description',
      'other': 'insert_drive_file',
      
      // Video Lecture icons
      'youtube': 'ondemand_video',
      'vimeo': 'play_circle',
      'drive': 'cloud',
      'movie': 'movie'  // Changed from 'video' to avoid duplicate
    };
    
    return iconMap[fileType] || 'insert_drive_file';
  }

  getFileTypeDisplay(item: DirectoryItem): string {
    if (this.resourceType === 2) {
      // Video Lectures
      if (item.duration) {
        return `Video • ${item.duration}`;
      }
      // return item.fileType ? this.formatFileType(item.fileType) : 'Video';
            return item.description || (item.fileType ? item.fileType.toUpperCase() : 'Video');

    } else {
      // Topicwise Directory
      return item.description || (item.fileType ? item.fileType.toUpperCase() : 'File');
    }
  }

  formatFileType(fileType: string): string {
    const typeMap: { [key: string]: string } = {
      'youtube': 'YouTube Video',
      'vimeo': 'Vimeo Video',
      'drive': 'Google Drive Video',
      'movie': 'Video File',
      'pdf': 'PDF Document',
      'image': 'Image',
      'audio': 'Audio',
      'document': 'Document'
    };
    
    return typeMap[fileType] || fileType.charAt(0).toUpperCase() + fileType.slice(1);
  }

  // Helper methods for template
  getHeaderIcon(): string {
    return this.resourceType === 2 ? 'fa-video-camera' : 'fa-graduation-cap';
  }

  getHomeIcon(): string {
    return 'fa-home';
  }

  getFileClass(item: DirectoryItem): string {
    let classes = 'file';
    if (this.resourceType === 2) {
      classes += ' video-item';
    }
    if (!item?.fileLink) {
      classes += ' unavailable';
    }
    return classes;
  }

  getActionIcon(item: DirectoryItem): string {
    if (this.resourceType === 2) {
      return item.fileType === 'youtube' ? 'fa-youtube-play' : 'fa-play-circle';
    }
    return 'fa-external-link';
  }
}