import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateTestDialogComponent } from './create-test-dialog.component';

describe('CreateTestDialogComponent', () => {
  let component: CreateTestDialogComponent;
  let fixture: ComponentFixture<CreateTestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTestDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateTestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
