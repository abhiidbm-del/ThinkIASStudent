import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TagService } from '../../../shared/services/tag.service';
import { Tag } from '../../../core/models/tag.model';
@Component({
  selector: 'app-tag-master',
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './tag-master.component.html',
  styleUrl: './tag-master.component.css'
})
export class TagMasterComponent {

  tagForm: FormGroup;
  tags: Tag[] = [];
  isLoading = false;
  isSubmitting = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';
  editingTag: Tag | null = null;

  constructor(
    private fb: FormBuilder,
    private tagService: TagService
  ) {
    this.tagForm = this.createForm();
  }

  ngOnInit() {
    this.loadTags();
  }

  createForm(): FormGroup {
    return this.fb.group({
      tag: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]]
    });
  }

  loadTags(): void {
    this.isLoading = true;
    this.tagService.getTags().subscribe({
      next: (tags) => {
        this.tags = tags;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.showMessage('Error loading tags', 'error');
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.tagForm.valid) {
      this.isSubmitting = true;
      const tagValue = this.tagForm.get('tag')?.value;

      if (this.editingTag) {
        // Update existing tag
        this.tagService.updateTag(this.editingTag._id, tagValue).subscribe({
          next: (response) => {
            this.showMessage('Tag updated successfully!', 'success');
            this.loadTags();
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error updating tag:', error);
            this.showMessage('Error updating tag', 'error');
            this.isSubmitting = false;
          }
        });
      } else {
        // Create new tag
        this.tagService.createTag(tagValue).subscribe({
          next: (response) => {
            this.showMessage('Tag created successfully!', 'success');
            this.loadTags();
            this.resetForm();
            this.isSubmitting = false;
          },
          error: (error) => {
            console.error('Error creating tag:', error);
            this.showMessage('Error creating tag', 'error');
            this.isSubmitting = false;
          }
        });
      }
    } else {
      this.markFormGroupTouched();
      this.showMessage('Please fill the form correctly', 'error');
    }
  }

  editTag(tag: Tag): void {
    this.editingTag = tag;
    this.tagForm.patchValue({
      tag: tag.tag
    });
  }

  deleteTag(tag: Tag): void {
    if (confirm(`Are you sure you want to delete the tag "${tag.tag}"?`)) {
      this.tagService.deleteTag(tag._id).subscribe({
        next: (response) => {
          this.showMessage('Tag deleted successfully!', 'success');
          this.loadTags();
        },
        error: (error) => {
          console.error('Error deleting tag:', error);
          this.showMessage('Error deleting tag', 'error');
        }
      });
    }
  }

  resetForm(): void {
    this.tagForm.reset();
    this.editingTag = null;
  }

  markFormGroupTouched(): void {
    Object.keys(this.tagForm.controls).forEach(key => {
      this.tagForm.get(key)?.markAsTouched();
    });
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.tagForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
