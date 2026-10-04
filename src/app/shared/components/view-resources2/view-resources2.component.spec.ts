import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewResources2Component } from './view-resources2.component';

describe('ViewResources2Component', () => {
  let component: ViewResources2Component;
  let fixture: ComponentFixture<ViewResources2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewResources2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewResources2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
