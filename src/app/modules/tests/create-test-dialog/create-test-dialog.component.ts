import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TestService } from '../../../shared/services/test.service';
import { QuestionService } from '../../../shared/services/question.service';
import { FormsModule } from '@angular/forms';

interface Question {
  _id: string;
  uid: string;
  question: {
    english: string;
    hindi: string;
    _id?: string;
  };
  options: Array<{
    english: string;
    hindi: string;
    _id?: string;
  }>;
  correctAnswer: number;
  description?: {
    english: string;
    hindi: string;
  };
  tags: string[]; // Array of tag IDs
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Tag {
  _id: string;
  tag: string;
  questionCount: number;
}

interface UidInput {
  value: string;
  status?: 'loading' | 'success' | 'error' | null;
  message?: string;
}

@Component({
  selector: 'app-create-test-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './create-test-dialog.component.html',
  styleUrl: './create-test-dialog.component.css'
})
export class CreateTestDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private testService = inject(TestService);
  private questionService = inject(QuestionService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateTestDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);

  testForm: FormGroup;
  isEdit = signal(false);
  loading = signal(false);
  questionsLoading = signal(false);
  
  // Questions from API
  allQuestions = signal<Question[]>([]);
  availableQuestions = signal<Question[]>([]);
  selectedQuestions = signal<Question[]>([]);
  filteredQuestions = signal<Question[]>([]);
  
  // Tags
  tags = signal<Tag[]>([]);
  tagsLoading = signal(false);
  currentFilterTag = signal<string | null>(null);
  showTagFilter = signal(false);
  
  // Add by UID functionality
  showAddByUid = signal(false);
  uidInputs = signal<UidInput[]>([{ value: '' }]);
  
  // Search control for questions
  questionSearchControl = new FormControl('');
  selectAllChecked = signal(false);

  constructor() {
    this.testForm = this.createTestForm();
    this.isEdit.set(!!this.data.test);
  }

  setDefaultDateTime() {
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000);
    
    const formattedDateTime = this.formatDateTimeForInput(startTime);
    
    this.testForm.patchValue({
      startTime: formattedDateTime
    });
  }

  private formatDateTimeForInput(date: Date): string {
    const year = date.getFullYear();
    const month = this.padZero(date.getMonth() + 1);
    const day = this.padZero(date.getDate());
    const hours = this.padZero(date.getHours());
    const minutes = this.padZero(date.getMinutes());
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getMinDateTime(): string {
    return this.formatDateTimeForInput(new Date());
  }

  private padZero(num: number): string {
    return num.toString().padStart(2, '0');
  }

  futureDateValidator(control: FormControl): { [key: string]: any } | null {
    if (!control.value) {
      return null;
    }
    
    const selectedTime = new Date(control.value);
    const now = new Date();
    
    const bufferTime = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (selectedTime < bufferTime) {
      return { 'pastDate': 'Start time must be at least 5 minutes from now' };
    }
    
    return null;
  }

  onDateTimeChange() {
    const startTimeControl = this.testForm.get('startTime');
    if (startTimeControl?.errors?.['pastDate']) {
      this.snackBar.open('Start time must be at least 5 minutes from now', 'Close', { duration: 3000 });
      const minTime = new Date(new Date().getTime() + 5 * 60 * 1000);
      this.testForm.patchValue({
        startTime: this.formatDateTimeForInput(minTime)
      });
    }
  }

  createTestForm(): FormGroup {
    return this.fb.group({
      title: ['', Validators.required],
      description: [''],
      startTime: ['', [Validators.required, this.futureDateValidator.bind(this)]],
      duration: ['', [Validators.required, Validators.min(1)]],
      marksPerQuestion: [1, [Validators.required, Validators.min(1)]],
      negativeMarks: [0, [Validators.min(0)]],
      selectedQuestionUids: [[], Validators.required]
    });
  }

  ngOnInit() {
    // Load questions first, then populate form if editing
    this.loadAvailableQuestions().then(() => {
      if (this.isEdit()) {
        this.populateForm(this.data.test);
      } else {
        this.setDefaultDateTime();
      }
    });
    
    this.loadTags();
  }

  loadAvailableQuestions(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.questionsLoading.set(true);
      this.questionService.getAllQuestions().subscribe({
        next: (response: any) => {
          // Map the response to ensure it matches our Question interface
          const questions: Question[] = (response.questions || []).map((q: any) => ({
            _id: q._id,
            uid: q.uid,
            question: {
              english: q.question?.english || '',
              hindi: q.question?.hindi || '',
              _id: q.question?._id
            },
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            description: q.description,
            tags: q.tags || [],
            isActive: q.isActive !== undefined ? q.isActive : true,
            createdAt: q.createdAt,
            updatedAt: q.updatedAt
          }));
          
          this.allQuestions.set(questions);
          this.availableQuestions.set(questions);
          this.filteredQuestions.set(questions);
          this.questionsLoading.set(false);
          resolve();
        },
        error: (error) => {
          console.error('Error loading questions:', error);
          this.snackBar.open('Error loading questions', 'Close', { duration: 3000 });
          this.questionsLoading.set(false);
          reject(error);
        }
      });
    });
  }

  populateForm(test: any) {
    console.log('Populating form with test data:', test);
    
    const startTime = new Date(test.startTime);
    const formattedDate = this.formatDateTimeForInput(startTime);

    // Get the UIDs from questionUids
    const questionUids = test.questionUids || [];

    this.testForm.patchValue({
      title: test.title,
      description: test.description,
      startTime: formattedDate,
      duration: test.duration,
      marksPerQuestion: test.marksPerQuestion || 1,
      negativeMarks: test.negativeMarks || 0,
      selectedQuestionUids: questionUids
    });

    // Now that questions are loaded, find the selected questions
    this.setSelectedQuestionsFromUids(questionUids);
  }

  setSelectedQuestionsFromUids(questionUids: string[]) {
    if (questionUids.length > 0) {
      const allQuestions = this.allQuestions();
      const selectedQuestions = allQuestions.filter(q => 
        questionUids.includes(q.uid)
      );
      
      console.log('Setting selected questions:', selectedQuestions);
      this.selectedQuestions.set(selectedQuestions);
      
      // Update select all state
      const filteredQuestions = this.filteredQuestions();
      const allFilteredUids = filteredQuestions.map(q => q.uid);
      const selectedInFilter = selectedQuestions.filter(q => 
        allFilteredUids.includes(q.uid)
      );
      this.selectAllChecked.set(selectedInFilter.length === filteredQuestions.length);
    }
  }

  loadTags() {
    this.tagsLoading.set(true);
    // Assuming you have a tag service or can call the API directly
    // For now, I'll assume you have a method in QuestionService to get tags
    this.questionService.getTags().subscribe({
      next: (response: any) => {
        const tags: Tag[] = (response || []).map((tag: any) => ({
          _id: tag._id,
          tag: tag.tag,
          questionCount: 0 // We'll calculate this after
        }));
        
        // Calculate question counts for each tag
        this.calculateTagQuestionCounts(tags);
        this.tags.set(tags);
        this.tagsLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading tags:', error);
        this.tagsLoading.set(false);
      }
    });
  }

  calculateTagQuestionCounts(tags: Tag[]) {
    const allQuestions = this.allQuestions();
    
    // Create a map for tag ID to tag object
    const tagMap = new Map<string, Tag>();
    tags.forEach(tag => {
      tagMap.set(tag._id, tag);
    });
    
    // Calculate counts
    tags.forEach(tag => {
      // Questions with this specific tag ID
      const count = allQuestions.filter(q => q.tags.includes(tag._id)).length;
      tag.questionCount = count;
    });
    
    // Add "None" tag for questions with no tags
    const noneQuestions = allQuestions.filter(q => !q.tags || q.tags.length === 0);
    if (noneQuestions.length > 0) {
      tags.push({
        _id: 'none',
        tag: 'None',
        questionCount: noneQuestions.length
      });
    }
  }

  // Filter by Tag functionality methods
  toggleTagFilter() {
    this.showTagFilter.set(!this.showTagFilter());
  }

  applyTagFilter(tag: Tag) {
    this.currentFilterTag.set(tag.tag);
    this.showTagFilter.set(false);
    
    // Filter questions based on tag
    const allQuestions = this.allQuestions();
    let filtered: Question[];
    
    if (tag._id === 'none') {
      // Show questions with no tags
      filtered = allQuestions.filter(q => !q.tags || q.tags.length === 0);
    } else {
      // Show questions with this specific tag
      filtered = allQuestions.filter(q => q.tags && q.tags.includes(tag._id));
    }
    
    this.filteredQuestions.set(filtered);
    
    // Update available questions for the dropdown
    this.availableQuestions.set(filtered);
    
    // Update selected questions based on filtered list
    const selectedUids = this.testForm.get('selectedQuestionUids')?.value || [];
    const selected = this.allQuestions().filter(q => selectedUids.includes(q.uid));
    this.selectedQuestions.set(selected);
    
    this.snackBar.open(`Filtered by tag: ${tag.tag} (${filtered.length} questions)`, 'Close', { duration: 3000 });
  }

  clearTagFilter() {
    this.currentFilterTag.set(null);
    this.showTagFilter.set(false);
    
    // Reset to show all questions
    this.filteredQuestions.set(this.allQuestions());
    this.availableQuestions.set(this.allQuestions());
    
    // Update selected questions
    const selectedUids = this.testForm.get('selectedQuestionUids')?.value || [];
    const selected = this.allQuestions().filter(q => selectedUids.includes(q.uid));
    this.selectedQuestions.set(selected);
    
    this.snackBar.open('Tag filter cleared', 'Close', { duration: 2000 });
  }

  getQuestionTags(question: Question): string {
    if (!question.tags || question.tags.length === 0) {
      return 'None';
    }
    
    const allTags = this.tags();
    const tagNames = question.tags
      .map(tagId => {
        const tag = allTags.find(t => t._id === tagId);
        return tag ? tag.tag : 'Unknown';
      })
      .filter(tagName => tagName !== 'Unknown');
    
    return tagNames.length > 0 ? tagNames.join(', ') : 'None';
  }

  // Add by UID functionality methods
  toggleAddByUid() {
    this.showAddByUid.set(!this.showAddByUid());
    if (!this.showAddByUid()) {
      this.uidInputs.set([{ value: '' }]);
    }
  }

  onUidInputChange(index: number, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.uidInputs.update(inputs => {
      inputs[index] = { ...inputs[index], value, status: null, message: undefined };
      return [...inputs];
    });
  }

  addUid() {
    const currentInputs = this.uidInputs();
    const lastInput = currentInputs[currentInputs.length - 1];
    
    if (!lastInput.value.trim()) {
      this.snackBar.open('Please enter a UID before adding another', 'Close', { duration: 2000 });
      return;
    }
    
    this.uidInputs.update(inputs => [...inputs, { value: '' }]);
  }

  removeUidInput(index: number) {
    this.uidInputs.update(inputs => {
      inputs.splice(index, 1);
      return [...inputs];
    });
  }

  clearUids() {
    this.uidInputs.set([{ value: '' }]);
  }

  async processUids() {
    const inputs = this.uidInputs();
    const validUids = inputs.map(input => input.value.trim()).filter(uid => uid.length > 0);
    
    if (validUids.length === 0) {
      this.snackBar.open('Please enter at least one UID', 'Close', { duration: 2000 });
      return;
    }
    
    // Reset all statuses
    this.uidInputs.update(inputs => inputs.map(input => ({
      ...input,
      status: 'loading' as const,
      message: 'Processing...'
    })));
    
    try {
      // Find questions by UIDs from all questions (not filtered)
      const allQuestions = this.allQuestions();
      const foundQuestions: Question[] = [];
      const notFoundUids: string[] = [];
      
      // Check each UID
      validUids.forEach((uid, index) => {
        const question = allQuestions.find(q => q.uid === uid);
        if (question) {
          foundQuestions.push(question);
          // Update status to success
          this.uidInputs.update(inputs => {
            inputs[index] = {
              ...inputs[index],
              status: 'success',
              message: 'Question found'
            };
            return [...inputs];
          });
        } else {
          notFoundUids.push(uid);
          // Update status to error
          this.uidInputs.update(inputs => {
            inputs[index] = {
              ...inputs[index],
              status: 'error',
              message: 'Question not found'
            };
            return [...inputs];
          });
        }
      });
      
      if (foundQuestions.length > 0) {
        // Add found questions to selection
        const currentUids = this.testForm.get('selectedQuestionUids')?.value || [];
        const newUids = foundQuestions.map(q => q.uid);
        const updatedUids = [...new Set([...currentUids, ...newUids])]; // Remove duplicates
        
        // Update form and selected questions
        this.testForm.patchValue({
          selectedQuestionUids: updatedUids
        });
        
        // Update selected questions list
        this.setSelectedQuestionsFromUids(updatedUids);
        
        // Update select all state based on filtered questions
        const filteredQuestions = this.filteredQuestions();
        const allFilteredUids = filteredQuestions.map(q => q.uid);
        const selectedInFilter = updatedUids.filter(uid => allFilteredUids.includes(uid));
        this.selectAllChecked.set(selectedInFilter.length === filteredQuestions.length);
        
        // Show success message
        this.snackBar.open(
          `Added ${foundQuestions.length} question(s). ${notFoundUids.length > 0 ? notFoundUids.length + ' not found.' : ''}`,
          'Close',
          { duration: 3000 }
        );
        
        // Close the UID section
        setTimeout(() => {
          this.showAddByUid.set(false);
          this.uidInputs.set([{ value: '' }]);
        }, 1000);
      } else {
        this.snackBar.open('No questions found with the provided UIDs', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error processing UIDs:', error);
      this.snackBar.open('Error processing UIDs', 'Close', { duration: 3000 });
    }
  }

  onQuestionSelectionChange(selectedUids: string[]) {
    this.setSelectedQuestionsFromUids(selectedUids);
  }

  toggleSelectAll() {
    const currentUids = this.testForm.get('selectedQuestionUids')?.value || [];
    const filteredQuestions = this.filteredQuestions();
    const allFilteredUids = filteredQuestions.map(q => q.uid);
    
    // Check if all filtered questions are selected
    const allFilteredSelected = allFilteredUids.every(uid => currentUids.includes(uid));
    
    if (allFilteredSelected) {
      // If all filtered questions are selected, deselect them
      const remainingUids = currentUids.filter((uid: string) => !allFilteredUids.includes(uid));
      this.testForm.patchValue({
        selectedQuestionUids: remainingUids
      });
      
      this.setSelectedQuestionsFromUids(remainingUids);
      this.selectAllChecked.set(false);
    } else {
      // Select all filtered questions
      const updatedUids = [...new Set([...currentUids, ...allFilteredUids])];
      this.testForm.patchValue({
        selectedQuestionUids: updatedUids
      });
      
      this.setSelectedQuestionsFromUids(updatedUids);
      this.selectAllChecked.set(true);
    }
  }

  clearAll() {
    // Always clear all selections regardless of current state
    this.testForm.patchValue({
      selectedQuestionUids: []
    });
    this.selectedQuestions.set([]);
    this.selectAllChecked.set(false);
    this.snackBar.open('All questions cleared', 'Close', { duration: 2000 });
  }

  removeQuestion(index: number) {
    const currentSelectedQuestions = [...this.selectedQuestions()];
    const questionToRemove = currentSelectedQuestions[index];
    
    // Remove from selected questions array
    currentSelectedQuestions.splice(index, 1);
    this.selectedQuestions.set(currentSelectedQuestions);
    
    // Update form control
    const currentUids = this.testForm.get('selectedQuestionUids')?.value || [];
    const updatedUids = currentUids.filter((uid: string) => uid !== questionToRemove.uid);
    
    this.testForm.patchValue({
      selectedQuestionUids: updatedUids
    });
    
    // Update select all state based on filtered questions
    const filteredQuestions = this.filteredQuestions();
    const allFilteredUids = filteredQuestions.map(q => q.uid);
    const selectedInFilter = updatedUids.filter((uid:any) => allFilteredUids.includes(uid));
    this.selectAllChecked.set(selectedInFilter.length === filteredQuestions.length);
    
    this.snackBar.open('Question removed from test', 'Close', { duration: 2000 });
  }

  getQuestionDisplayText(question: Question): string {
    const engText = question.question.english;
    return engText.length > 100 ? engText.substring(0, 100) + '...' : engText;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  capitalizeTitle(event: Event) {
    const input = event.target as HTMLInputElement;
    const value = input.value;
    const capitalizedValue = value.replace(/(^|\s)([a-z])/g, (_match, spacing, letter) => `${spacing}${letter.toUpperCase()}`);

    if (value === capitalizedValue) return;

    const cursorPosition = input.selectionStart;
    this.testForm.get('title')?.setValue(capitalizedValue, { emitEvent: false });
    if (cursorPosition !== null) {
      input.setSelectionRange(cursorPosition, cursorPosition);
    }
  }

  onSubmit() {
    if (this.testForm.valid && this.selectedQuestions().length > 0) {
      this.loading.set(true);
      
      const formValue = this.testForm.value;
      const testData = {
        title: formValue.title,
        description: formValue.description,
        startTime: new Date(formValue.startTime).toISOString(),
        duration: formValue.duration,
        marksPerQuestion: formValue.marksPerQuestion,
        negativeMarks: formValue.negativeMarks,
        questionUids: formValue.selectedQuestionUids
      };

      console.log('Submitting test data:', testData);

      const operation = this.isEdit() 
        ? this.testService.updateTest(this.data.test._id, testData)
        : this.testService.createTest(testData);

      operation.subscribe({
        next: () => {
          this.snackBar.open(`Test ${this.isEdit() ? 'updated' : 'created'} successfully`, 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('Error:', error);
          this.snackBar.open(`Error ${this.isEdit() ? 'updating' : 'creating'} test: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    } else if (this.selectedQuestions().length === 0) {
      this.snackBar.open('Please select at least one question', 'Close', { duration: 3000 });
    } else {
      this.snackBar.open('Please fill all required fields', 'Close', { duration: 3000 });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}