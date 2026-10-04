import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AdminService } from '../../../shared/services/admin.service';
import { SyllabusItem, SyllabusPayload } from '../../../core/models/syllabus.model';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-syllabus-master',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './syllabus-master.component.html',
  styleUrls: ['./syllabus-master.component.css']
})
export class SyllabusMasterComponent implements OnInit {
  prelimsForm: FormGroup;
  mainsForm: FormGroup;
  activeTab: 'prelims' | 'mains' = 'prelims';
  isLoading = false;
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private fb: FormBuilder,
    private adminService: AdminService
  ) {
    this.prelimsForm = this.createPrelimsForm();
    this.mainsForm = this.createMainsForm();
  }

  ngOnInit() {
    this.loadPrelimsData();
  }

  // PRELIMS FORM (No changes needed)
  createPrelimsForm(): FormGroup {
    return this.fb.group({
      gs1: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      }),
      gs2: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      })
    });
  }

  get prelimsGs1Form(): FormGroup { return this.prelimsForm.get('gs1') as FormGroup; }
  get prelimsGs2Form(): FormGroup { return this.prelimsForm.get('gs2') as FormGroup; }

  // MAINS FORM - Updated for new payload structure
  createMainsForm(): FormGroup {
    return this.fb.group({
      gs1: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      }),
      gs2: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      }),
      gs3: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      }),
      gs4: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      }),
      essay: this.fb.group({
        fileName: ['', Validators.required],
        fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
        description: ['', Validators.required]
      }),
      optionalSubjects: this.fb.array([])
    });
  }

  get mainsGs1Form(): FormGroup { return this.mainsForm.get('gs1') as FormGroup; }
  get mainsGs2Form(): FormGroup { return this.mainsForm.get('gs2') as FormGroup; }
  get mainsGs3Form(): FormGroup { return this.mainsForm.get('gs3') as FormGroup; }
  get mainsGs4Form(): FormGroup { return this.mainsForm.get('gs4') as FormGroup; }
  get mainsEssayForm(): FormGroup { return this.mainsForm.get('essay') as FormGroup; }
  get optionalSubjects(): FormArray { return this.mainsForm.get('optionalSubjects') as FormArray; }

  // Optional Subject Methods - Updated to include description
  // createOptionalSubject(): FormGroup {
  //   return this.fb.group({
  //     subjectName: ['', Validators.required],
  //     documents: this.fb.array([this.createDocument()])
  //   });
  // }

  // createDocument(): FormGroup {
  //   return this.fb.group({
  //     fileName: ['', Validators.required],
  //     fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
  //     description: ['', Validators.required] // Added description field
  //   });
  // }

  // addOptionalSubject(): void {
  //   this.optionalSubjects.push(this.createOptionalSubject());
  // }

  // removeOptionalSubject(index: number): void {
  //   this.optionalSubjects.removeAt(index);
  // }

  // getDocuments(optionalSubjectIndex: number): FormArray {
  //   return this.optionalSubjects.at(optionalSubjectIndex).get('documents') as FormArray;
  // }

  // addDocument(optionalSubjectIndex: number): void {
  //   this.getDocuments(optionalSubjectIndex).push(this.createDocument());
  // }

  // removeDocument(optionalSubjectIndex: number, documentIndex: number): void {
  //   this.getDocuments(optionalSubjectIndex).removeAt(documentIndex);
  // }

  // Tab Management (No changes)
  switchTab(tab: 'prelims' | 'mains'): void {
    this.activeTab = tab;
    if (tab === 'prelims') {
      this.loadPrelimsData();
    } else {
      this.loadMainsData();
    }
  }

  // Data Loading - Updated for new payload structure
  loadPrelimsData(): void {
    this.isLoading = true;
    this.adminService.getSyllabus('prelims').subscribe({
      next: (data) => {
        this.populatePrelimsForm(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading prelims data:', error);
        this.showMessage('Error loading prelims data', 'error');
        this.isLoading = false;
      }
    });
  }

  loadMainsData(): void {
    this.isLoading = true;
    this.adminService.getSyllabus('mains').subscribe({
      next: (data) => {
        this.populateMainsForm(data);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading mains data:', error);
        this.showMessage('Error loading mains data', 'error');
        this.isLoading = false;
      }
    });
  }

  populatePrelimsForm(data: any): void {
    if (data['gs1']) {
      this.prelimsGs1Form.patchValue({
        fileName: data['gs1']?.fileName || '',
        fileLink: data['gs1']?.fileLink || '',
        description: data['gs1']?.description || ''
      });
    }

    if (data['gs2']) {
      this.prelimsGs2Form.patchValue({
        fileName: data['gs2']?.fileName || '',
        fileLink: data['gs2']?.fileLink || '',
        description: data['gs2']?.description || ''
      });
    }
  }

  // populateMainsForm(data: any): void {
  //   // Clear existing optional subjects
  //   this.optionalSubjects.clear();

  //   // Populate GS papers and Essay
  //   if (data['gs1']) {
  //     this.mainsGs1Form.patchValue({
  //       fileName: data['gs1']?.fileName || '',
  //       fileLink: data['gs1']?.fileLink || '',
  //       description: data['gs1']?.description || ''
  //     });
  //   }

  //   if (data['gs2']) {
  //     this.mainsGs2Form.patchValue({
  //       fileName: data['gs2']?.fileName || '',
  //       fileLink: data['gs2']?.fileLink || '',
  //       description: data['gs2']?.description || ''
  //     });
  //   }

  //   if (data['gs3']) {
  //     this.mainsGs3Form.patchValue({
  //       fileName: data['gs3']?.fileName || '',
  //       fileLink: data['gs3']?.fileLink || '',
  //       description: data['gs3']?.description || ''
  //     });
  //   }

  //   if (data['gs4']) {
  //     this.mainsGs4Form.patchValue({
  //       fileName: data['gs4']?.fileName || '',
  //       fileLink: data['gs4']?.fileLink || '',
  //       description: data['gs4']?.description || ''
  //     });
  //   }

  //   if (data['essay']) {
  //     this.mainsEssayForm.patchValue({
  //       fileName: data['essay']?.fileName || '',
  //       fileLink: data['essay']?.fileLink || '',
  //       description: data['essay']?.description || ''
  //     });
  //   }

  //   // Populate Optional Subjects - Updated for new array structure
  //   if (data['optionalSubjects'] && Array.isArray(data['optionalSubjects'])) {
  //     data['optionalSubjects'].forEach((subjectData: any) => {
  //       const subject = this.createOptionalSubject();
  //       subject.patchValue({ subjectName: subjectData.subjectName });
        
  //       const documents = subject.get('documents') as FormArray;
  //       documents.clear();
        
  //       if (subjectData.documents && Array.isArray(subjectData.documents)) {
  //         subjectData.documents.forEach((doc: any) => {
  //           documents.push(this.fb.group({
  //             fileName: [doc.fileName || ''],
  //             fileLink: [doc.fileLink || ''],
  //             description: [doc.description || '']
  //           }));
  //         });
  //       }
        
  //       this.optionalSubjects.push(subject);
  //     });
  //   }
  // }

  // Form Submission - Updated for new payload structure
  onSubmitPrelims(): void {
    if (this.prelimsForm.valid) {
      this.isLoading = true;
      
      const payload = {
        gs1: this.prelimsGs1Form.value,
        gs2: this.prelimsGs2Form.value
      };

      this.adminService.saveSyllabus('prelims', payload).subscribe({
        next: (response) => {
          this.showMessage('Prelims syllabus saved successfully!', 'success');
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error saving prelims syllabus:', error);
          this.showMessage('Error saving prelims syllabus', 'error');
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.prelimsForm);
      this.showMessage('Please fill all required fields correctly', 'error');
    }
  }

  // onSubmitMains(): void {
  //   if (this.mainsForm.valid) {
  //     this.isLoading = true;
      
  //     // Build payload according to desired structure
  //     const payload: any = {
  //       gs1: this.mainsGs1Form.value,
  //       gs2: this.mainsGs2Form.value,
  //       gs3: this.mainsGs3Form.value,
  //       gs4: this.mainsGs4Form.value,
  //       essay: this.mainsEssayForm.value,
  //       optionalSubjects: [] // Changed from "Optional" to "optionalSubjects" as array
  //     };

  //     // Build optional subjects as array
  //     this.optionalSubjects.controls.forEach((subjectGroup) => {
  //       const subjectData = {
  //         subjectName: subjectGroup.get('subjectName')?.value,
  //         documents: (subjectGroup.get('documents') as FormArray).controls.map(docGroup => docGroup.value)
  //       };
  //       payload.optionalSubjects.push(subjectData);
  //     });

  //     this.adminService.saveSyllabus('mains', payload).subscribe({
  //       next: (response) => {
  //         this.showMessage('Mains syllabus saved successfully!', 'success');
  //         this.isLoading = false;
  //       },
  //       error: (error) => {
  //         console.error('Error saving mains syllabus:', error);
  //         this.showMessage('Error saving mains syllabus', 'error');
  //         this.isLoading = false;
  //       }
  //     });
  //   } else {
  //     this.markFormGroupTouched(this.mainsForm);
  //     this.showMessage('Please fill all required fields correctly', 'error');
  //   }
  // }

  // Utility Methods
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(group => {
          if (group instanceof FormGroup) {
            this.markFormGroupTouched(group);
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  // Helper method for template
  getMainsFormGroup(groupName: string): FormGroup {
    return this.mainsForm.get(groupName) as FormGroup;
  }

  // Optional Subject Methods - Updated to include description
createOptionalSubject(): FormGroup {
  return this.fb.group({
    subjectName: ['', Validators.required],
    documents: this.fb.array([this.createDocument()])
  });
}

createDocument(): FormGroup {
  return this.fb.group({
    fileName: ['', Validators.required],
    fileLink: ['', [Validators.required, Validators.pattern('https?://.+')]],
    description: ['', Validators.required] // Added description field
  });
}

addOptionalSubject(): void {
  this.optionalSubjects.push(this.createOptionalSubject());
}

removeOptionalSubject(index: number): void {
  this.optionalSubjects.removeAt(index);
}

getDocuments(optionalSubjectIndex: number): FormArray {
  return this.optionalSubjects.at(optionalSubjectIndex).get('documents') as FormArray;
}

addDocument(optionalSubjectIndex: number): void {
  this.getDocuments(optionalSubjectIndex).push(this.createDocument());
}

removeDocument(optionalSubjectIndex: number, documentIndex: number): void {
  this.getDocuments(optionalSubjectIndex).removeAt(documentIndex);
}

populateMainsForm(data: any): void {
  // Clear existing optional subjects
  this.optionalSubjects.clear();

  // Populate GS papers and Essay
  if (data['gs1']) {
    this.mainsGs1Form.patchValue({
      fileName: data['gs1']?.fileName || '',
      fileLink: data['gs1']?.fileLink || '',
      description: data['gs1']?.description || ''
    });
  }

  if (data['gs2']) {
    this.mainsGs2Form.patchValue({
      fileName: data['gs2']?.fileName || '',
      fileLink: data['gs2']?.fileLink || '',
      description: data['gs2']?.description || ''
    });
  }

  if (data['gs3']) {
    this.mainsGs3Form.patchValue({
      fileName: data['gs3']?.fileName || '',
      fileLink: data['gs3']?.fileLink || '',
      description: data['gs3']?.description || ''
    });
  }

  if (data['gs4']) {
    this.mainsGs4Form.patchValue({
      fileName: data['gs4']?.fileName || '',
      fileLink: data['gs4']?.fileLink || '',
      description: data['gs4']?.description || ''
    });
  }

  if (data['essay']) {
    this.mainsEssayForm.patchValue({
      fileName: data['essay']?.fileName || '',
      fileLink: data['essay']?.fileLink || '',
      description: data['essay']?.description || ''
    });
  }

  // Populate Optional Subjects - Updated for new array structure
  if (data['optionalSubjects'] && Array.isArray(data['optionalSubjects'])) {
    data['optionalSubjects'].forEach((subjectData: any) => {
      const subject = this.createOptionalSubject();
      subject.patchValue({ subjectName: subjectData.subjectName });
      
      const documents = subject.get('documents') as FormArray;
      documents.clear();
      
      if (subjectData.documents && Array.isArray(subjectData.documents)) {
        subjectData.documents.forEach((doc: any) => {
          documents.push(this.fb.group({
            fileName: [doc.fileName || ''],
            fileLink: [doc.fileLink || ''],
            description: [doc.description || '']
          }));
        });
      }
      
      this.optionalSubjects.push(subject);
    });
  }
}

onSubmitMains(): void {
  if (this.mainsForm.valid) {
    this.isLoading = true;
    
    // Build payload according to desired structure
    const payload: any = {
      gs1: this.mainsGs1Form.value,
      gs2: this.mainsGs2Form.value,
      gs3: this.mainsGs3Form.value,
      gs4: this.mainsGs4Form.value,
      essay: this.mainsEssayForm.value,
      optionalSubjects: [] // Changed from "Optional" to "optionalSubjects" as array
    };

    // Build optional subjects as array
    this.optionalSubjects.controls.forEach((subjectGroup) => {
      const subjectData = {
        subjectName: subjectGroup.get('subjectName')?.value,
        documents: (subjectGroup.get('documents') as FormArray).controls.map(docGroup => docGroup.value)
      };
      payload.optionalSubjects.push(subjectData);
    });

    this.adminService.saveSyllabus('mains', payload).subscribe({
      next: (response) => {
        this.showMessage('Mains syllabus saved successfully!', 'success');
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error saving mains syllabus:', error);
        this.showMessage('Error saving mains syllabus', 'error');
        this.isLoading = false;
      }
    });
  } else {
    this.markFormGroupTouched(this.mainsForm);
    this.showMessage('Please fill all required fields correctly', 'error');
  }
}

// Add this method to your SyllabusMasterComponent class
getMainsControl(groupName: string, controlName: string): any {
  const group = this.mainsForm.get(groupName);
  return group ? group.get(controlName) : null;
}
}