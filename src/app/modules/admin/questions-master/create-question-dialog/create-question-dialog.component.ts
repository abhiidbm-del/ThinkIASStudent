import { TranslatePipe } from '../../../../shared/i18n/translate.pipe';
// create-question-dialog.component.ts
import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, FormControl, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { QuestionService, Question } from '../../../../shared/services/question.service';
import { TagResponse } from '../../../../shared/services/tag.service';

interface QuestionFormData {
  question: {
    english: string;
    hindi: string;
  };
  description: {
    english: string;
    hindi: string;
  };
  options: Array<{
    english: string;
    hindi: string;
  }>;
  correctAnswer: number;
  tags: string[];
}

@Component({
  selector: 'app-create-question-dialog',
  standalone: true,
  imports: [TranslatePipe, 
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatAutocompleteModule
  ],
  templateUrl: './create-question-dialog.component.html',
  styleUrls: ['./create-question-dialog.component.css']
})
export class CreateQuestionDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private questionService = inject(QuestionService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateQuestionDialogComponent>);
  private data = inject(MAT_DIALOG_DATA);

  questionForm: FormGroup;
  isEdit = signal(false);
  loading = signal(false);
  isDragOver = signal(false);
  fileUploadLoading = signal(false);
  availableTags: TagResponse[] = [];

  constructor() {
    this.questionForm = this.createQuestionForm();
    this.isEdit.set(!!this.data.question);
    this.availableTags = this.data.tags || [];
  }

  createQuestionForm(): FormGroup {
    return this.fb.group({
      questions: this.fb.array([])
    });
  }

  get questions(): FormArray {
    return this.questionForm.get('questions') as FormArray;
  }

  ngOnInit() {
    if (this.isEdit()) {
      this.populateForm(this.data.question);
    }
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index);
  }

  addQuestion(questionData?: Partial<QuestionFormData>) {
    const defaultOptions = [
      { english: '', hindi: '' },
      { english: '', hindi: '' },
      { english: '', hindi: '' },
      { english: '', hindi: '' }
    ];

    const questionGroup = this.fb.group({
      question: this.fb.group({
        english: [questionData?.question?.english || '', Validators.required],
        hindi: [questionData?.question?.hindi || '']
      }),
      description: this.fb.group({
        english: [questionData?.description?.english || ''],
        hindi: [questionData?.description?.hindi || '']
      }),
      options: this.fb.array(
        (questionData?.options || defaultOptions).map((opt: any) => 
          this.fb.group({
            english: [opt.english || '', Validators.required],
            hindi: [opt.hindi || '']
          })
        )
      ),
      correctAnswer: [questionData?.correctAnswer ?? 0, [Validators.required, Validators.min(0), Validators.max(3)]],
      tags: [questionData?.tags || []]
    });

    this.questions.push(questionGroup);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  getOptions(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('options') as FormArray;
  }

  getQuestionControl(index: number, language: 'english' | 'hindi'): FormControl {
    return this.questions.at(index).get(`question.${language}`) as FormControl;
  }

  getDescriptionControl(index: number, language: 'english' | 'hindi'): FormControl {
    return this.questions.at(index).get(`description.${language}`) as FormControl;
  }

  getOptionControl(questionIndex: number, optionIndex: number, language: 'english' | 'hindi'): FormControl {
    const optionsArray = this.getOptions(questionIndex);
    return optionsArray.at(optionIndex).get(language) as FormControl;
  }

  getCorrectAnswerControl(index: number): FormControl {
    return this.questions.at(index).get('correctAnswer') as FormControl;
  }

  getTagsControl(index: number): FormControl {
    return this.questions.at(index).get('tags') as FormControl;
  }

  populateForm(question: Question) {
    this.clearAllQuestions();
    this.addQuestion(question);
  }

  clearAllQuestions() {
    while (this.questions.length > 0) {
      this.questions.removeAt(0);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileUpload(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFileUpload(file);
    }
  }

  async handleFileUpload(file: File) {
    if (!file.type.includes('text/plain')) {
      this.snackBar.open('Please upload only TXT files.', 'Close', { duration: 3000 });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.snackBar.open('File size should be less than 5MB', 'Close', { duration: 3000 });
      return;
    }

    this.fileUploadLoading.set(true);

    try {
      const text = await this.readTextFile(file);
      const questions = this.parseQuestionsFromText(text);
      
      if (questions.length > 0) {
        this.addQuestionsFromFile(questions);
        this.snackBar.open(`Successfully imported ${questions.length} questions from file`, 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('No questions found in the file. Please check the format.', 'Close', { duration: 5000 });
      }
    } catch (error) {
      console.error('Error reading file:', error);
      this.snackBar.open('Error reading file. Please try again with a different file.', 'Close', { duration: 3000 });
    } finally {
      this.fileUploadLoading.set(false);
    }
  }

  readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };
      
      reader.onerror = (e) => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, 'UTF-8');
    });
  }

  parseQuestionsFromText(text: string): QuestionFormData[] {
    const questions: QuestionFormData[] = [];
    const questionMap = new Map<number, { english?: any; hindi?: any }>();
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      const englishMatch = trimmedLine.match(/^Q(\d+)E\.\s*(.+)/i);
      if (englishMatch) {
        const questionNumber = parseInt(englishMatch[1]);
        const content = englishMatch[2];
        
        const parsedData = this.parseQuestionLine(content);
        if (parsedData) {
          if (!questionMap.has(questionNumber)) {
            questionMap.set(questionNumber, {});
          }
          questionMap.get(questionNumber)!.english = parsedData;
        }
      }
      
      const hindiMatch = trimmedLine.match(/^Q(\d+)H\.\s*(.+)/i);
      if (hindiMatch) {
        const questionNumber = parseInt(hindiMatch[1]);
        const content = hindiMatch[2];
        
        const parsedData = this.parseHindiQuestionLine(content);
        if (parsedData) {
          if (!questionMap.has(questionNumber)) {
            questionMap.set(questionNumber, {});
          }
          questionMap.get(questionNumber)!.hindi = parsedData;
        }
      }
    });

    questionMap.forEach((data, questionNumber) => {
      if (data.english) {
        const combinedQuestion: QuestionFormData = {
          question: {
            english: data.english.question || '',
            hindi: data.hindi?.question || ''
          },
          description: {
            english: data.english.description || '',
            hindi: data.hindi?.description || ''
          },
          options: this.combineOptions(data.english.options, data.hindi?.options),
          correctAnswer: data.english.correctAnswer ?? 0,
          tags: []
        };
        
        if (this.isQuestionComplete(combinedQuestion)) {
          questions.push(combinedQuestion);
        }
      }
    });

    const sortedQuestions = questions.sort((a, b) => {
      const aNum = this.getQuestionNumber(a, questionMap);
      const bNum = this.getQuestionNumber(b, questionMap);
      return aNum - bNum;
    });

    return sortedQuestions;
  }

  private getQuestionNumber(question: QuestionFormData, questionMap: Map<number, any>): number {
    for (const [num, data] of questionMap.entries()) {
      if (data.english?.question === question.question.english) {
        return num;
      }
    }
    return 0;
  }

  private combineOptions(englishOptions: string[], hindiOptions?: string[]): Array<{english: string, hindi: string}> {
    const combined = [];
    for (let i = 0; i < 4; i++) {
      combined.push({
        english: englishOptions[i] || '',
        hindi: (hindiOptions && hindiOptions[i]) || ''
      });
    }
    return combined;
  }

  parseQuestionLine(content: string): any {
    const cansMatch = content.match(/CANS?\.\s*([A-D])(?:\s|\.|$)/i);
    if (!cansMatch) return null;
    
    const correctAnswer = cansMatch[1].toUpperCase().charCodeAt(0) - 65;
    let processedContent = content.substring(0, cansMatch.index).trim();
    
    let description = '';
    const descMatch = processedContent.match(/DESC?\.\s*(.+?)(?=\s*CANS?\.|$)/i);
    if (descMatch) {
      description = descMatch[1].trim();
      processedContent = processedContent.substring(0, descMatch.index).trim();
    }
    
    const questionData = this.extractQuestionAndOptions(processedContent);
    
    if (!questionData) return null;
    
    return {
      question: questionData.question,
      description: description,
      options: questionData.options,
      correctAnswer: correctAnswer
    };
  }

  isQuestionComplete(question: QuestionFormData): boolean {
    const hasEnglishQuestion = !!question.question.english && question.question.english.trim().length > 0;
    const hasOptions = question.options.filter((opt: any) => 
      !!opt.english && opt.english.trim().length > 0
    ).length >= 2;

    return hasEnglishQuestion && hasOptions;
  }

  addQuestionsFromFile(questions: QuestionFormData[]) {
    if (!this.isEdit() || this.questions.length === 0) {
      this.clearAllQuestions();
    }
    
    questions.forEach((questionData) => {
      if (this.isQuestionComplete(questionData)) {
        this.addQuestion(questionData);
      }
    });

    this.questionForm.updateValueAndValidity();
  }

  parseHindiQuestionLine(content: string): any {
    let correctAnswer = 0;
    let processedContent = content;
    
    const cansMatch = content.match(/CANS?\.\s*([A-D])(?:\s|\.|$)/i);
    if (cansMatch) {
      correctAnswer = cansMatch[1].toUpperCase().charCodeAt(0) - 65;
      processedContent = content.substring(0, cansMatch.index).trim();
    } else {
      correctAnswer = 0;
    }
    
    let description = '';
    const descMatch = processedContent.match(/DESC?\.\s*(.+?)(?=\s*CANS?\.|$)/i);
    if (descMatch) {
      description = descMatch[1].trim();
      processedContent = processedContent.substring(0, descMatch.index).trim();
    }
    
    const questionData = this.extractHindiQuestionAndOptions(processedContent);
    
    if (!questionData) return null;
    
    return {
      question: questionData.question,
      description: description,
      options: questionData.options,
      correctAnswer: correctAnswer
    };
  }

  extractHindiQuestionAndOptions(content: string): { question: string; options: string[] } | null {
    const options = ['', '', '', ''];
    let questionText = '';
    
    const optionPattern = /(A\.|B\.|C\.|D\.)\s*([^A-Z]*?(?=(?:A\.|B\.|C\.|D\.|DESC\.|CANS\.|$)))/gi;
    
    let matches: RegExpExecArray | null;
    const foundOptions: { marker: string, text: string }[] = [];
    
    while ((matches = optionPattern.exec(content)) !== null) {
      const marker = matches[1];
      const text = matches[2].trim();
      foundOptions.push({ marker, text });
    }
    
    if (foundOptions.length === 0) {
      return this.extractQuestionAndOptions(content);
    }
    
    const firstOptionIndex = content.indexOf(foundOptions[0].marker);
    if (firstOptionIndex !== -1) {
      questionText = content.substring(0, firstOptionIndex).trim();
    }
    
    foundOptions.forEach(opt => {
      const index = opt.marker.charCodeAt(0) - 65;
      if (index >= 0 && index < 4) {
        let cleanText = opt.text
          .replace(/\s*DESC\..*$/i, '')
          .replace(/\s*CANS\..*$/i, '')
          .trim();
        options[index] = cleanText;
      }
    });
    
    return {
      question: questionText,
      options: options
    };
  }

  extractQuestionAndOptions(content: string): { question: string; options: string[] } | null {
    const options = ['', '', '', ''];
    let questionText = '';
    
    const optionMarkers = ['A.', 'B.', 'C.', 'D.'];
    const markerPositions: { marker: string, index: number }[] = [];
    
    optionMarkers.forEach(marker => {
      const index = content.indexOf(marker);
      if (index !== -1) {
        markerPositions.push({ marker, index });
      }
    });
    
    if (markerPositions.length === 0) return null;
    
    markerPositions.sort((a, b) => a.index - b.index);
    questionText = content.substring(0, markerPositions[0].index).trim();
    
    for (let i = 0; i < markerPositions.length; i++) {
      const currentMarker = markerPositions[i];
      const nextMarker = i < markerPositions.length - 1 ? markerPositions[i + 1] : null;
      
      const startIndex = currentMarker.index + currentMarker.marker.length;
      let endIndex = content.length;
      
      if (nextMarker) {
        endIndex = nextMarker.index;
      } else {
        const descIndex = content.indexOf('DESC', startIndex);
        const cansIndex = content.indexOf('CANS', startIndex);
        
        const possibleEnds = [descIndex, cansIndex].filter(idx => idx !== -1);
        if (possibleEnds.length > 0) {
          endIndex = Math.min(...possibleEnds);
        }
      }
      
      let optionText = content.substring(startIndex, endIndex).trim();
      optionText = optionText
        .replace(/\s*DESC\..*$/i, '')
        .replace(/\s*CANS\..*$/i, '')
        .trim();
      
      const optionIndex = currentMarker.marker.charCodeAt(0) - 65;
      if (optionIndex >= 0 && optionIndex < 4) {
        options[optionIndex] = optionText;
      }
    }
    
    return {
      question: questionText,
      options: options
    };
  }

  onSubmit() {
    if (this.questionForm.valid && this.questions.length > 0) {
      this.loading.set(true);
      
      const formData = this.questionForm.value;
      const questionsData = formData.questions.map((q: any) => ({
        question: q.question,
        description: q.description,
        options: q.options,
        correctAnswer: q.correctAnswer,
        tags: q.tags
      }));

      const requestPayload = { questions: questionsData };

      console.log('Submitting questions data:', requestPayload);

      if (this.isEdit()) {
        const questionId = this.data.question.uid;
        this.questionService.updateQuestion(questionId!, questionsData[0]).subscribe({
          next: () => {
            this.snackBar.open('Question updated successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading.set(false);
            console.error('Error:', error);
            this.snackBar.open(`Error updating question: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
          }
        });
      } else {
        this.questionService.createQuestions(requestPayload).subscribe({
          next: () => {
            this.snackBar.open('Questions created successfully', 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: (error) => {
            this.loading.set(false);
            console.error('Error:', error);
            this.snackBar.open(`Error creating questions: ${error.error?.message || 'Unknown error'}`, 'Close', { duration: 3000 });
          }
        });
      }
    } else if (this.questions.length === 0) {
      this.snackBar.open('Please add at least one question', 'Close', { duration: 3000 });
    } else {
      console.log('Form errors:', this.questionForm.errors);
      this.logFormErrors(this.questionForm);
    }
  }

  private logFormErrors(form: FormGroup | FormArray, path: string = '') {
    Object.keys(form.controls).forEach(key => {
      const control = form.get(key);
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.logFormErrors(control, path + key + '.');
      } else {
        if (control?.errors) {
          console.log(path + key, control.errors);
        }
      }
    });
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}