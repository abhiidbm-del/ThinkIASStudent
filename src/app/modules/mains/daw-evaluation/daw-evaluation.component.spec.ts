import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DawEvaluationComponent } from './daw-evaluation.component';

describe('DawEvaluationComponent', () => {
  let component: DawEvaluationComponent;
  let fixture: ComponentFixture<DawEvaluationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DawEvaluationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DawEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
