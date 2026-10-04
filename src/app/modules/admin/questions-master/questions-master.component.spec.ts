import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionsMasterComponent } from './questions-master.component';

describe('QuestionsMasterComponent', () => {
  let component: QuestionsMasterComponent;
  let fixture: ComponentFixture<QuestionsMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionsMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionsMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
