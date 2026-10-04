import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IntegratedProgramComponent } from './integrated-program.component';

describe('IntegratedProgramComponent', () => {
  let component: IntegratedProgramComponent;
  let fixture: ComponentFixture<IntegratedProgramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntegratedProgramComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IntegratedProgramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
