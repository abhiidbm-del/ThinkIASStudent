import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceViewerComponent } from './resource-viewer.component';

describe('ResourceViewerComponent', () => {
  let component: ResourceViewerComponent;
  let fixture: ComponentFixture<ResourceViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
