import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TakeDemoTestComponent } from './take-demo-test.component';

describe('TakeDemoTestComponent', () => {
  let component: TakeDemoTestComponent;
  let fixture: ComponentFixture<TakeDemoTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TakeDemoTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TakeDemoTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
