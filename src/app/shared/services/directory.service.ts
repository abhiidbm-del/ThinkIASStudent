import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environment/environment';
import { 
  DirectoryItem, 
  CreateFolderRequest, 
  CreateFileRequest, 
  UpdateFileRequest, 
  RenameRequest,
  DirectoryTreeResponse,
  DirectoryResponse
} from '../../core/models/directory.model';

@Injectable({
  providedIn: 'root'
})
export class DirectoryService {
  private apiUrl = `${environment.apiUrl}/directories`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get directory tree (accessible to both admin and students)
  getDirectoryTree(parentId?: string | null): Observable<DirectoryTreeResponse> {
    let params = new HttpParams();
    if (parentId) {
      params = params.set('parentId', parentId);
    }

    return this.http.get<DirectoryTreeResponse>(`${this.apiUrl}/tree`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Admin only methods - these won't be used by students
  // createFolder(name: string, parentId: string | null = null): Observable<DirectoryResponse> {
  //   const request: CreateFolderRequest = { name, parentId };
  //   return this.http.post<DirectoryResponse>(`${this.apiUrl}/folders`, request, {
  //     headers: this.getHeaders()
  //   });
  // }

  // createFile(name: string, parentId: string | null, fileLink: string, description: string = ''): Observable<DirectoryResponse> {
  //   const request: CreateFileRequest = { name, parentId, fileLink, description };
  //   return this.http.post<DirectoryResponse>(`${this.apiUrl}/files`, request, {
  //     headers: this.getHeaders()
  //   });
  // }

  // updateFile(fileId: string, name: string, fileLink: string, description: string = ''): Observable<DirectoryResponse> {
  //   const request: UpdateFileRequest = { name, fileLink, description };
  //   return this.http.put<DirectoryResponse>(`${this.apiUrl}/files/${fileId}`, request, {
  //     headers: this.getHeaders()
  //   });
  // }

  // renameItem(itemId: string, newName: string): Observable<DirectoryResponse> {
  //   const request: RenameRequest = { newName };
  //   return this.http.put<DirectoryResponse>(`${this.apiUrl}/${itemId}/rename`, request, {
  //     headers: this.getHeaders()
  //   });
  // }

  // deleteItem(itemId: string): Observable<{ message: string; item: { _id: string; name: string; type: string } }> {
  //   return this.http.delete<{ message: string; item: { _id: string; name: string; type: string } }>(`${this.apiUrl}/${itemId}`, {
  //     headers: this.getHeaders()
  //   });
  // }
}