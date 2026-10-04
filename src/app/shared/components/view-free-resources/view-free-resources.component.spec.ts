import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewFreeResourcesComponent } from './view-free-resources.component';

describe('ViewFreeResourcesComponent', () => {
  let component: ViewFreeResourcesComponent;
  let fixture: ComponentFixture<ViewFreeResourcesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewFreeResourcesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewFreeResourcesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
