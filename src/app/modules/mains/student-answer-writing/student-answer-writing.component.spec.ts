import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentAnswerWritingComponent } from './student-answer-writing.component';

describe('StudentAnswerWritingComponent', () => {
  let component: StudentAnswerWritingComponent;
  let fixture: ComponentFixture<StudentAnswerWritingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentAnswerWritingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentAnswerWritingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
