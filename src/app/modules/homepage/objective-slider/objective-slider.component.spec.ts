import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObjectiveSliderComponent } from './objective-slider.component';

describe('ObjectiveSliderComponent', () => {
  let component: ObjectiveSliderComponent;
  let fixture: ComponentFixture<ObjectiveSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ObjectiveSliderComponent]
    });
    fixture = TestBed.createComponent(ObjectiveSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
