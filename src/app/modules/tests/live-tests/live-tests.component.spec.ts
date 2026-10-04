import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveTestsComponent } from './live-tests.component';

describe('LiveTestsComponent', () => {
  let component: LiveTestsComponent;
  let fixture: ComponentFixture<LiveTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveTestsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
