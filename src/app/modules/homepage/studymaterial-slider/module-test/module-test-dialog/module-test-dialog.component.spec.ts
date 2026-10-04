import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModuleTestDialogComponent } from './module-test-dialog.component';

describe('ModuleTestDialogComponent', () => {
  let component: ModuleTestDialogComponent;
  let fixture: ComponentFixture<ModuleTestDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleTestDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModuleTestDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
