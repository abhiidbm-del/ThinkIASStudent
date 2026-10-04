// shared/services/tag.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Tag } from '../../core/models/tag.model';
import { environment } from '../../../environment/environment';

export interface TagResponse {
  _id: string;
  tag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TagService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/tags`;

  getTags(): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.apiUrl);
  }

  createTag(tagName: string): Observable<Tag> {
    return this.http.post<Tag>(this.apiUrl, { tag: tagName });
  }

  updateTag(tagId: string, tagName: string): Observable<Tag> {
    return this.http.put<Tag>(`${this.apiUrl}/${tagId}`, { tag: tagName });
  }

  deleteTag(tagId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${tagId}`);
  }
}