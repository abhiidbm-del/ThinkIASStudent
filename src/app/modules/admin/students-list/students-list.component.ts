import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
// students-list.component.ts - FIXED VERSION
import { Component, inject, signal, OnInit, computed } from '@angular/core'; // ADD computed
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../../shared/services/user.service';

export interface Student {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
}

@Component({
  selector: 'app-students-list',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './students-list.component.html',
  styleUrl: './students-list.component.css'
})
export class StudentsListComponent implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private userService = inject(UserService)

  students = signal<Student[]>([]);
  loading = signal(true);
  displayedColumns: string[] = ['fullName', 'email', 'phone', 'joinedDate'];

  // ADD THIS COMPUTED PROPERTY
  recentStudentsCount = computed(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.students().filter((student: Student) => 
      new Date(student.createdAt) > oneMonthAgo
    ).length;
  });

  // Mock data - Replace with actual API call
  mockStudents: Student[] = [
    {
      _id: '1',
      fullName: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      role: 'student',
      createdAt: '2024-01-15T10:30:00.000Z'
    },
    {
      _id: '2',
      fullName: 'Jane Smith',
      email: 'jane@example.com',
      phone: '0987654321',
      role: 'student',
      createdAt: '2024-01-20T14:45:00.000Z'
    },
    {
      _id: '3',
      fullName: 'Mike Johnson',
      email: 'mike@example.com',
      phone: '5551234567',
      role: 'student',
      createdAt: '2024-02-01T09:15:00.000Z'
    },
    {
      _id: '4',
      fullName: 'Sarah Wilson',
      email: 'sarah@example.com',
      phone: '4445556666',
      role: 'student',
      createdAt: '2024-03-10T11:20:00.000Z' // Recent student
    }
  ];

  ngOnInit() {
    this.loadStudents();
  }

  loadStudents() {
    this.loading.set(true);
    
    // Simulate API call - Replace with actual service call
    // setTimeout(() => {
    //   this.students.set(this.mockStudents);
    //   this.loading.set(false);
    // }, 1000);
    
    // TODO: Replace with actual API call
    this.userService.getAllStudents().subscribe({
      next: (students) => {
        this.students.set(students);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.snackBar.open('Error loading students', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/dashboard']);
  }

  viewStudentResults(studentId: string) {
    // Navigate to student results page
    this.router.navigate(['/admin-results'], { 
      queryParams: { studentId: studentId } 
    });
  }

  exportStudents() {
    // Simple CSV export implementation
    const students = this.students();
    if (students.length === 0) return;

    const headers = ['Name', 'Email', 'Phone', 'Joined Date'];
    const csvData = students.map(student => [
      student.fullName,
      student.email,
      student.phone,
      new Date(student.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `students-list-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    this.snackBar.open('Students list exported successfully', 'Close', { duration: 3000 });
  }

  // REMOVED getRecentStudentsCount method from here - using computed property instead
}