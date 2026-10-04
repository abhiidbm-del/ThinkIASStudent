import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FreeQuizComponent } from './free-quiz.component';

describe('FreeQuizComponent', () => {
  let component: FreeQuizComponent;
  let fixture: ComponentFixture<FreeQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FreeQuizComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FreeQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
