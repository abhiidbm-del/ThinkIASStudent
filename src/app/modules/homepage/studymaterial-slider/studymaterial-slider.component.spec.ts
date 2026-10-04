import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudymaterialSliderComponent } from './studymaterial-slider.component';

describe('StudymaterialSliderComponent', () => {
  let component: StudymaterialSliderComponent;
  let fixture: ComponentFixture<StudymaterialSliderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [StudymaterialSliderComponent]
    });
    fixture = TestBed.createComponent(StudymaterialSliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
