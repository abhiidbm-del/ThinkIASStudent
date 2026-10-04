import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReviewSliderComponent } from './review-slider.component';

describe('ReviewSliderComponent', () => {
  let component: ReviewSliderComponent;
  let fixture: ComponentFixture<ReviewSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ReviewSliderComponent]
    });
    fixture = TestBed.createComponent(ReviewSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
