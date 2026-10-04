// shared/services/module.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

export interface ModuleName {
  english: string;
  hindi: string;
}

export interface Module {
  _id: string;
  name: ModuleName;
  image: string;
  icon: string;
  order: number;
  isActive: boolean;
  type: 'module' | 'folder' | 'file';
  parent: string | null;
  fullPath: string;
  fileLink?: string;
  fileDescription?: string;
  fileType?: 'pdf' | 'image' | 'video' | 'audio' | 'document' | 'other';
  createdAt: string;
  updatedAt: string;
  children?: Module[];
}

export interface DirectoryContents {
  items: Module[];
}

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private http = inject(HttpClient);
  // IMPORTANT: Use '/api/module' (singular) to match your backend mounting
  private apiUrl = `${environment.apiUrl}/module`;

  // ============ Module Operations ============
  getPublicModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}/public`);
  }

  getAdminModules(): Observable<Module[]> {
    return this.http.get<Module[]>(`${this.apiUrl}/admin`);  // Keep as /admin
  }

  createModule(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/`, data);
  }

  updateModule(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteModule(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  toggleModuleStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  updateModuleOrder(id: string, order: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/order`, { order });
  }

  // ============ Directory Operations ============
  createFolder(data: { nameEnglish: string; nameHindi: string; parentId: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/folders`, data);
  }

  createFile(data: { 
    nameEnglish: string; 
    nameHindi: string; 
    parentId: string; 
    fileLink: string; 
    fileDescription: string 
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/files`, data);
  }

  getDirectoryContents(parentId: string): Observable<DirectoryContents> {
    return this.http.get<DirectoryContents>(`${this.apiUrl}/directory/${parentId}`);
  }

  getItem(id: string): Observable<{ item: Module }> {
    return this.http.get<{ item: Module }>(`${this.apiUrl}/item/${id}`);
  }

  updateFile(id: string, data: { 
    nameEnglish?: string; 
    nameHindi?: string; 
    fileLink?: string; 
    fileDescription?: string 
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/files/${id}`, data);
  }

  renameFolder(id: string, data: { nameEnglish: string; nameHindi?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/folders/${id}`, data);
  }

  deleteDirectoryItem(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/directory/${id}`);
  }

  // ============ Public Directory APIs ============
  getPublicDirectoryTree(moduleId?: string, parentId?: string): Observable<DirectoryContents> {
    let params = '';
    if (moduleId) params = `?moduleId=${moduleId}`;
    else if (parentId) params = `?parentId=${parentId}`;
    return this.http.get<DirectoryContents>(`${this.apiUrl}/public/directory${params}`);
  }

  getPublicModuleTree(moduleId: string): Observable<{ module: Module }> {
    return this.http.get<{ module: Module }>(`${this.apiUrl}/public/module-tree/${moduleId}`);
  }

  getPublicFile(fileId: string): Observable<{ file: Module }> {
    return this.http.get<{ file: Module }>(`${this.apiUrl}/public/file/${fileId}`);
  }

  // ============ Helper Methods ============
  getImageUrl(image: string): string {
    if (!image) return 'assets/images/default-module.jpg';
    if (image.startsWith('data:image')) return image;
    if (image.startsWith('http')) return image;
    return `http://localhost:5000/${image}`;
  }

  getDisplayName(item: Module): string {
    const isHindi = localStorage.getItem('preferredLanguage') === 'hi';
    return isHindi && item.name.hindi ? item.name.hindi : item.name.english;
  }

  hasHindiName(item: Module): boolean {
    return !!item.name?.hindi;
  }

  getFileIconClass(fileType?: string): string {
    switch(fileType) {
      case 'pdf': return 'fa fa-file-pdf-o';
      case 'image': return 'fa fa-file-image-o';
      case 'video': return 'fa fa-file-video-o';
      case 'audio': return 'fa fa-file-audio-o';
      case 'document': return 'fa fa-file-word-o';
      default: return 'fa fa-file-o';
    }
  }

  getFileIconColor(fileType?: string): string {
    switch(fileType) {
      case 'pdf': return '#ef4444';
      case 'image': return '#10b981';
      case 'video': return '#3b82f6';
      case 'audio': return '#f59e0b';
      case 'document': return '#8b5cf6';
      default: return '#6b7280';
    }
  }

  getFileTypeLabel(fileType?: string): string {
    switch(fileType) {
      case 'pdf': return 'PDF Document';
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'audio': return 'Audio';
      case 'document': return 'Document';
      default: return 'File';
    }
  }
}