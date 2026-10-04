import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SyllabusItem, BreadcrumbItem } from '../../../core/models/user.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AdminService } from '../../../shared/services/admin.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-resources-view',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './resources-view.component.html',
  styleUrls: ['./resources-view.component.css']
})
export class ResourcesViewComponent implements OnInit {
  
  syllabusType: string = '';
  currentData: any = {};
  breadcrumbs: BreadcrumbItem[] = [];
  currentPath: string[] = [];
  isLoading: boolean = false;
  private originalApiData: any = {};
  currentLanguage: string = 'en';

  languageMap: { [key: string]: { name: string, code: string } } = {
    'en': { name: 'English', code: 'EN' },
    'hi': { name: 'हिंदी', code: 'HI' }
  };

  constructor(
    public dialogRef: MatDialogRef<ResourcesViewComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { type: string },
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.syllabusType = this.data.type;
    this.currentPath = [this.syllabusType];
    this.initializeLanguage();
    this.loadData();
    this.updateBreadcrumbs();
  }

  private initializeLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && (savedLang === 'en' || savedLang === 'hi')) {
      this.currentLanguage = savedLang;
    } else {
      this.currentLanguage = 'en';
      localStorage.setItem('preferredLanguage', 'en');
    }
  }

  switchLanguage(lang: string) {
    if (lang === 'en' || lang === 'hi') {
      this.currentLanguage = lang;
      localStorage.setItem('preferredLanguage', lang);
      this.loadData();
    }
  }

  getLanguageDisplayName(): string {
    return this.languageMap[this.currentLanguage]?.name || 'English';
  }

  getLanguageCode(): string {
    return this.languageMap[this.currentLanguage]?.code || 'EN';
  }

  loadData() {
    this.isLoading = true;

    if (this.currentPath.length === 1) {
      // Root level - fetch from API
      this.adminService.getSyllabus(this.syllabusType).subscribe({
        next: (apiData) => {
          this.originalApiData = apiData;
          this.currentData = this.transformApiData(apiData, this.syllabusType);
          this.isLoading = false;
        },
        error: (error) => {
          console.error(`Error loading ${this.syllabusType} syllabus data:`, error);
          this.currentData = {};
          this.isLoading = false;
        }
      });
    } else {
      // Nested level - navigate through the path
      let data = this.originalApiData;
      
      if (this.syllabusType === 'mains' && this.currentPath[1] === 'Optional') {
        data = this.getMainsOptionalData(this.currentPath);
      } else {
        for (let i = 1; i < this.currentPath.length; i++) {
          if (data && data[this.currentPath[i]]) {
            data = data[this.currentPath[i]];
          } else {
            data = {};
            break;
          }
        }
      }
      
      this.currentData = data;
      this.isLoading = false;
    }
  }

  // Check if a document is empty (all fields are null)
  private isEmptyDocument(doc: any): boolean {
    if (!doc) return true;
    
    // Check all relevant fields
    const fieldsToCheck = [
      'fileNameEnglish', 'fileLinkEnglish', 'descriptionEnglish',
      'fileNameHindi', 'fileLinkHindi', 'descriptionHindi',
      'fileName', 'fileLink', 'description'
    ];
    
    return fieldsToCheck.every(field => 
      doc[field] === null || doc[field] === undefined || doc[field] === ''
    );
  }

  private getMainsOptionalData(path: string[]): any {
    if (path.length === 2) {
      // Level 2: Show all optional subjects
      const result: any = {};
      if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
        this.originalApiData.optionalSubjects.forEach((subject: any) => {
          if (subject.subjectName) {
            result[subject.subjectName] = {
              _isFolder: true,
              _documents: subject.documents || []
            };
          }
        });
      }
      return result;
    } else if (path.length === 3) {
      // Level 3: Show documents for a specific subject
      const subjectName = path[2];
      const result: any = {};
      
      if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
        const subject = this.originalApiData.optionalSubjects.find((s: any) => 
          s.subjectName.toLowerCase() === subjectName.toLowerCase()
        );
        
        if (subject && subject.documents) {
          subject.documents.forEach((doc: any, index: number) => {
            // Only add non-empty documents
            if (!this.isEmptyDocument(doc)) {
              result[index] = this.getLanguageSpecificDocument(doc);
            }
          });
        }
      }
      return result;
    }
    
    return {};
  }

  private getLanguageSpecificDocument(doc: any): any {
    if (!doc) return {};
    
    // If the document is empty, return empty object
    if (this.isEmptyDocument(doc)) {
      return {};
    }
    
    if (this.currentLanguage === 'en') {
      return {
        fileLink: doc.fileLinkEnglish || doc.fileLink,
        fileName: doc.fileNameEnglish || doc.fileName,
        description: doc.descriptionEnglish || doc.description,
        _hasEnglish: !!(doc.fileNameEnglish || doc.fileLinkEnglish),
        _hasHindi: !!(doc.fileNameHindi || doc.fileLinkHindi)
      };
    } else if (this.currentLanguage === 'hi') {
      return {
        fileLink: doc.fileLinkHindi || doc.fileLinkEnglish || doc.fileLink,
        fileName: doc.fileNameHindi || doc.fileNameEnglish || doc.fileName,
        description: doc.descriptionHindi || doc.descriptionEnglish || doc.description,
        _hasEnglish: !!(doc.fileNameEnglish || doc.fileLinkEnglish),
        _hasHindi: !!(doc.fileNameHindi || doc.fileLinkHindi)
      };
      }
      
    // Fallback to English
    return {
      fileLink: doc.fileLinkEnglish || doc.fileLink,
      fileName: doc.fileNameEnglish || doc.fileName,
      description: doc.descriptionEnglish || doc.description,
      _hasEnglish: !!(doc.fileNameEnglish || doc.fileLinkEnglish),
      _hasHindi: !!(doc.fileNameHindi || doc.fileLinkHindi)
    };
  }

  // Check if transformed data is empty
  private isTransformedDataEmpty(transformedData: any): boolean {
    if (!transformedData) return true;
    
    const keys = this.getObjectKeys(transformedData);
    
    // Check if all items are either empty or unavailable
    return keys.every(key => {
      const item = transformedData[key];
      if (this.isFolder(item)) {
        // For folders, check if they're empty
        return this.countItems(item, key) === 0;
      } else {
        // For files, check if they're empty/unavailable
        return this.isEmptyDocument(item) || !item.fileLink;
      }
    });
  }

  private transformApiData(apiData: any, syllabusType: string): any {
    if (!apiData) return {};

    let transformedData: any = {};
    
    if (syllabusType === 'prelims') {
      transformedData = this.transformPrelimsData(apiData);
    } else if (syllabusType === 'mains') {
      transformedData = this.transformMainsData(apiData);
    }
    
    // Filter out empty items
    return this.filterEmptyItems(transformedData, syllabusType);
  }

  // Filter out empty items from transformed data
  private filterEmptyItems(data: any, syllabusType: string): any {
    if (!data) return {};
    
    const result: any = {};
    
    Object.keys(data).forEach(key => {
      if (key.startsWith('_')) {
        // Keep internal properties
        result[key] = data[key];
      } else {
        const item = data[key];
        
        if (this.isFolder(item)) {
          // Keep folder only if it has items
          if (this.countItems(item, key) > 0) {
            result[key] = item;
          }
        } else {
          // Keep file only if it's not empty
          if (!this.isEmptyDocument(item) && item.fileLink) {
            result[key] = item;
          }
        }
      }
    });
    
    return result;
  }

  private transformPrelimsData(apiData: any): any {
    if (!apiData) return {};
    
    const transformedData: any = {};
    
    // Transform each paper (gs1, gs2) only if they have data
    ['gs1', 'gs2'].forEach(paper => {
      if (apiData[paper] && !this.isEmptyDocument(apiData[paper])) {
        transformedData[paper] = this.getLanguageSpecificDocument(apiData[paper]);
      }
    });

    return transformedData;
  }

  private transformMainsData(apiData: any): any {
    if (!apiData) return {};
    
    const transformedData: any = {};
    
    // Transform direct fields only if they have data
    ['gs1', 'gs2', 'gs3', 'gs4', 'essay'].forEach(field => {
      if (apiData[field] && !this.isEmptyDocument(apiData[field])) {
        transformedData[field] = this.getLanguageSpecificDocument(apiData[field]);
      }
    });

    // Add Optional folder only if optionalSubjects exist and have data
    if (apiData.optionalSubjects && 
        Array.isArray(apiData.optionalSubjects) && 
        apiData.optionalSubjects.length > 0) {
      
      // Check if any optional subject has documents
      const hasValidSubjects = apiData.optionalSubjects.some((subject: any) => 
        subject.documents && subject.documents.length > 0
      );
      
      if (hasValidSubjects) {
        transformedData['Optional'] = {
          _isFolder: true,
          _description: 'Optional Subjects',
          _itemCount: apiData.optionalSubjects.length
        };
      }
    }

    return transformedData;
  }

  // Update the isEmpty check in the template method
  hasVisibleData(): boolean {
    if (!this.currentData) return false;
    
    const keys = this.getObjectKeys(this.currentData);
    
    // Check if there are any visible items (non-empty files or non-empty folders)
    return keys.some(key => {
      const item = this.currentData[key];
      
      if (this.isFolder(item)) {
        // Folder is visible if it has items
        return this.countItems(item, key) > 0;
      } else {
        // File is visible if it's not empty and has a link
        return !this.isEmptyDocument(item) && item.fileLink;
      }
    });
  }

  updateBreadcrumbs() {
    this.breadcrumbs = this.currentPath.map((path, index) => {
      const fullPath = this.currentPath.slice(0, index + 1);
      return {
        name: this.formatName(path),
        path: fullPath.join('/')
      };
    });
  }

  formatName(name: string): string {
    if (name.match(/^gs[1-4]$/i)) {
      return name.toUpperCase();
    }
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  isFolder(item: any): boolean {
    return (item && typeof item === 'object' && (item._isFolder || !item.fileLink));
  }

  navigateToFolder(key: string) {
    this.currentPath.push(key);
    this.loadData();
    this.updateBreadcrumbs();
  }

  navigateBreadcrumb(index: number) {
    this.currentPath = this.currentPath.slice(0, index + 1);
    this.loadData();
    this.updateBreadcrumbs();
  }

  openFile(fileLink: string) {
    if (fileLink) {
      window.open(fileLink, '_blank');
    }
  }

  goBack() {
    if (this.currentPath.length > 1) {
      this.currentPath.pop();
      this.loadData();
      this.updateBreadcrumbs();
    } else {
      this.dialogRef.close();
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  getObjectKeys(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj).filter(key => !key.startsWith('_'));
  }

  formatItemName(name: string): string {
    if (!isNaN(Number(name))) {
      return `Document ${Number(name) + 1}`;
    }
    
    return name
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }

  countItems(obj: any, key?: string): number {
    if (!obj) return 0;

    // Handle special cases for mains optional subjects
    if (this.syllabusType === 'mains') {
      if (key === 'Optional' && obj._itemCount) {
        return obj._itemCount;
      }
      
      if (obj._documents && Array.isArray(obj._documents)) {
        // Count only non-empty documents
        return obj._documents.filter((doc: any) => !this.isEmptyDocument(doc)).length;
      }
      
      if (this.currentPath.length === 2 && this.currentPath[1] === 'Optional') {
        if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
          return this.originalApiData.optionalSubjects.length;
        }
      }
      
      if (this.currentPath.length === 3 && this.currentPath[1] === 'Optional') {
        const subjectName = this.currentPath[2];
        if (this.originalApiData.optionalSubjects && Array.isArray(this.originalApiData.optionalSubjects)) {
          const subject = this.originalApiData.optionalSubjects.find((s: any) => 
            s.subjectName.toLowerCase() === subjectName.toLowerCase()
          );
          if (subject && subject.documents) {
            // Count only non-empty documents
            return subject.documents.filter((doc: any) => !this.isEmptyDocument(doc)).length;
          }
        }
      }
    }

    // Default counting logic
    const keys = this.getObjectKeys(obj);
    
    // If it's a file object, check if it's non-empty
    if (obj.fileLink) {
      return this.isEmptyDocument(obj) ? 0 : 1;
    }
    
    return keys.length;
  }

  getLanguageIndicator(item: any): string {
    if (!item) return '';
    
    if (this.currentLanguage === 'en') {
      return 'EN';
    } else if (this.currentLanguage === 'hi') {
      return 'HI';
    }
    
    return '';
  }

  private syllabusData: { [key: string]: any } = {};
}