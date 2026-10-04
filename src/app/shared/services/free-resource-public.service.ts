import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface PublicFreeResourceItem {
  _id: string;
  name: string;
  nameHi: string;
  type: 'module' | 'folder' | 'file';
  fullPath: string;
  fileLink?: string;
  fileDescription?: string;
  fileType?: string;
  createdAt: string;
  updatedAt: string;
  children?: PublicFreeResourceItem[];
}

export interface ApiResponse {
  message: string;
  modules?: PublicFreeResourceItem[];
  items?: PublicFreeResourceItem[];
  module?: PublicFreeResourceItem;
  file?: PublicFreeResourceItem;
}

@Injectable({
  providedIn: 'root'
})
export class FreeResourcePublicService {
  private apiUrl = `${environment.apiUrl}/freeResource/public`;

  constructor(private http: HttpClient) {}

  // Get all public modules
  getPublicModules(): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/modules`);
  }

  // Get public directory tree
  getPublicDirectoryTree(parentId?: string): Observable<ApiResponse> {
    const params: any = {};
    if (parentId) {
      params.parentId = parentId;
    }
    return this.http.get<ApiResponse>(`${this.apiUrl}/tree`, { params });
  }

  // Get complete public module tree
  getPublicModuleTree(moduleId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/modules/${moduleId}/tree`);
  }

  // Get specific file info
  getPublicFile(fileId: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.apiUrl}/files/${fileId}`);
  }

  // Helper method to determine file icon
  getFileIconClass(fileType?: string): string {
    if (!fileType) return 'fa fa-file';
    
    switch (fileType) {
      case 'pdf': return 'fa fa-file-pdf';
      case 'image': return 'fa fa-image';
      case 'document': return 'fa fa-file-text';
      case 'video': return 'fa fa-video';
      case 'audio': return 'fa fa-music';
      default: return 'fa fa-file';
    }
  }

  // Helper method to determine file icon color
  getFileIconColor(fileType?: string): string {
    if (!fileType) return '#e2e8f0';
    
    switch (fileType) {
      case 'pdf': return '#fecaca';
      case 'image': return '#bfdbfe';
      case 'document': return '#bbf7d0';
      case 'video': return '#fbcfe8';
      case 'audio': return '#fde68a';
      default: return '#e2e8f0';
    }
  }

  // Helper method to get file type label
  getFileTypeLabel(fileType?: string): string {
    if (!fileType || fileType === 'other') {
      return 'File';
    }
    return fileType.charAt(0).toUpperCase() + fileType.slice(1);
  }

  // Helper method to check if module has Hindi name
  hasHindiName(module: PublicFreeResourceItem): boolean {
    return !!module.nameHi && module.nameHi.trim().length > 0;
  }
}