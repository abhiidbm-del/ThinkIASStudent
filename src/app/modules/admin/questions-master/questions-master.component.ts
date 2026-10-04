import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
// questions-master.component.ts
import { Component, inject, signal, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { QuestionService, Question, QuestionsResponse, PaginationInfo } from '../../../shared/services/question.service';
import { TagService, TagResponse } from '../../../shared/services/tag.service';
import { CreateQuestionDialogComponent } from './create-question-dialog/create-question-dialog.component';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';

@Component({
  selector: 'app-questions-master',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    TruncatePipe
  ],
  templateUrl: './questions-master.component.html',
  styleUrls: ['./questions-master.component.css']
})
export class QuestionsMasterComponent implements OnInit {
  private questionService = inject(QuestionService);
  private tagService = inject(TagService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private viewDialogRef: MatDialogRef<any> | null = null;

  @ViewChild('viewDialogTemplate') viewDialogTemplate!: TemplateRef<any>;

  questions = signal<Question[]>([]);
  tags = signal<TagResponse[]>([]);
  loading = signal(false);
  selectedQuestion: Question | null = null;

  // Pagination signals
  totalQuestions = signal(0);
  pageSize = signal(10);
  currentPage = signal(0);
  paginationInfo = signal<PaginationInfo | null>(null);

  ngOnInit() {
    this.loadQuestions();
    this.loadTags();
  }

  loadQuestions() {
    this.loading.set(true);
    
    // Calculate page for API (API pages start from 1, but our currentPage is 0-based)
    const page = this.currentPage() + 1;
    const limit = this.pageSize();

    this.questionService.getQuestions(page, limit).subscribe({
      next: (response: QuestionsResponse) => {
        this.questions.set(response.questions);
        this.paginationInfo.set(response.pagination);
        this.totalQuestions.set(response.pagination.totalQuestions);
        this.loading.set(false);
      },
      error: (error) => {
        this.snackBar.open('Error loading questions', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  loadTags() {
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags.set(tags);
      },
      error: (error) => {
        this.snackBar.open('Error loading tags', 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadQuestions();
  }

  getQuestionId(question: Question): string {
    return question.uid || 'N/A';
  }

  openViewDialog(question: Question) {
    this.selectedQuestion = question;
    this.viewDialogRef = this.dialog.open(this.viewDialogTemplate, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'view-question-dialog-panel',
      autoFocus: false
    });

    this.viewDialogRef.afterClosed().subscribe(() => {
      this.selectedQuestion = null;
    });
  }

  closeViewDialog() {
    if (this.viewDialogRef) {
      this.viewDialogRef.close();
    }
  }

  openCreateQuestionDialog(question?: Question) {
    const dialogRef = this.dialog.open(CreateQuestionDialogComponent, {
      width: '90vw',
      maxWidth: '1200px',
      height: '90vh',
      maxHeight: '800px',
      panelClass: 'create-question-dialog-panel',
      autoFocus: false,
      data: { 
        question: question || null,
        tags: this.tags()
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadQuestions();
      }
    });
  }

  editQuestion(question: Question) {
    this.closeViewDialog();
    this.openCreateQuestionDialog(question);
  }

  deleteQuestion(question: Question) {
    const questionId = question.uid;
    if (!questionId) {
      this.snackBar.open('Cannot delete question: Invalid ID', 'Close', { duration: 3000 });
      return;
    }

    if (confirm('Are you sure you want to delete this question?')) {
      this.questionService.deleteQuestion(questionId).subscribe({
        next: () => {
          this.snackBar.open('Question deleted successfully', 'Close', { duration: 3000 });
          this.loadQuestions();
        },
        error: (error) => {
          this.snackBar.open('Error deleting question: ' + error.error?.message, 'Close', { duration: 3000 });
        }
      });
    }
  }

  getTagName(tagId: string): string {
    const tag = this.tags().find(t => t._id === tagId);
    return tag ? tag.tag : tagId;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Helper method to get current page info for display
  getCurrentPageInfo(): string {
    const pagination = this.paginationInfo();
    if (!pagination) return '';
    
    const startItem = (this.currentPage() * this.pageSize()) + 1;
    const endItem = Math.min(startItem + this.pageSize() - 1, this.totalQuestions());
    
    return `Showing ${startItem}-${endItem} of ${this.totalQuestions()} questions`;
  }
}