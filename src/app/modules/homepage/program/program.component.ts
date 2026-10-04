import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { environment } from '../../../../environment/environment';

export interface Program {
  _id?: string;
  programName: string;
  programNameHindi?: string; descriptionHindi?: string; durationHindi?: string; featuresHindi?: string[];
  programCategory: string;
  year: string;
  price: number;
  displayImage: string;
  discountedPrice?: number;
  description?: string;
  features?: string[];
  duration?: string;
  isActive?: boolean;
  order?: number;
}

@Component({
  selector: 'app-program',
  standalone: true,
  imports: [TranslatePipe, CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './program.component.html',
  styleUrls: ['./program.component.css']
})
export class ProgramComponent implements OnInit {
  allPrograms: Program[] = [];
  filteredPrograms: Program[] = [];
  categories: string[] = ['All', 'Mentorship Course', 'Optional Mentorship Course', 'Test Series', 'Optional Test Series', 'Essay', 'Prelims Program', 'Mains Program', 'Interview Program'];
  years: string[] = [];
  
  // Filter selections
  selectedCategory: string = 'All';
  selectedYear: string = 'All';
  
  isLoading = true;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchPrograms();
  }

  // Fetch active programs from backend
  fetchPrograms(): void {
    this.isLoading = true;
    this.http.get<any>(`${environment.apiUrl}/programs?activeOnly=true`).subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.allPrograms = response.data;
        } else if (Array.isArray(response)) {
          this.allPrograms = response;
        } else {
          this.allPrograms = [];
        }
        this.extractYears();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching programs:', error);
        this.errorMessage = 'Failed to load programs. Please try again later.';
        this.isLoading = false;
      }
    });
  }

  // Load demo data for testing
  loadDemoData(): void {
    this.allPrograms = [
      {
        _id: '1',
        programName: 'Public Administration Mentorship Program',
        programCategory: 'Mentorship Course',
        year: '2027',
        price: 17999,
        discountedPrice: 26999,
        displayImage: 'https://via.placeholder.com/400x250/4F46E5/ffffff?text=PUBLIC+ADMIN',
        description: 'Complete mentorship program for UPSC CSE 2027 with Public Administration optional.',
        features: ['Weekly mentorship sessions', 'Personalized study plan', 'Doubt clearing sessions'],
        duration: '12 months',
        isActive: true
      },
      {
        _id: '2',
        programName: 'Psychology Optional Mentorship Program',
        programCategory: 'Mentorship Course',
        year: '2027',
        price: 17999,
        discountedPrice: 26999,
        displayImage: 'https://via.placeholder.com/400x250/EC4899/ffffff?text=PSYCHOLOGY',
        description: 'Comprehensive psychology optional mentorship for UPSC CSE 2027.',
        features: ['Expert faculty', 'Test series included', 'Answer writing practice'],
        duration: '12 months',
        isActive: true
      }
    ];
    this.extractYears();
    this.applyFilters();
    this.isLoading = false;
  }

  // Extract unique years from programs
  extractYears(): void {
    const yearSet = new Set<string>();
    this.allPrograms.forEach(program => {
      if (program.year) {
        yearSet.add(program.year);
      }
    });
    this.years = Array.from(yearSet).sort().reverse();
  }

  // Apply category and year filters
  applyFilters(): void {
    this.filteredPrograms = this.allPrograms.filter(program => {
      const categoryMatch = this.selectedCategory === 'All' || program.programCategory === this.selectedCategory;
      const yearMatch = this.selectedYear === 'All' || program.year === this.selectedYear;
      return categoryMatch && yearMatch;
    });
  }

  // Handle category filter change
  onCategoryChange(): void {
    this.applyFilters();
  }

  // Handle year filter change
  onYearChange(): void {
    this.applyFilters();
  }

  // Reset all filters
  resetFilters(): void {
    this.selectedCategory = 'All';
    this.selectedYear = 'All';
    this.applyFilters();
  }

  // Get count for category
  getCategoryCount(category: string): number {
    if (category === 'All') {
      return this.allPrograms.length;
    }
    return this.allPrograms.filter(p => p.programCategory === category).length;
  }

  // Get count for year
  getYearCount(year: string): number {
    return this.allPrograms.filter(p => p.year === year).length;
  }

  // Handle image error
  handleImageError(event: any): void {
    event.target.src = 'assets/images/logo.png';
  }

  // Navigate to program details/batches page
  viewProgramBatches(program: Program): void {
    this.router.navigate(['/program', program._id]);
  }

  // Handle enroll button click
  enrollProgram(program: Program): void {
    this.router.navigate(['/program', program._id, 'enroll']);
  }

  // View program details
  viewProgramDetails(program: Program): void {
    this.router.navigate(['/program', program._id]);
  }

  trackProgram(_index: number, program: Program): string { return program._id || program.programName; }
}
