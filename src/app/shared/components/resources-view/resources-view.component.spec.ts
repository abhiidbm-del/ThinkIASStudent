import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourcesViewComponent } from './resources-view.component';

describe('ResourcesViewComponent', () => {
  let component: ResourcesViewComponent;
  let fixture: ComponentFixture<ResourcesViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourcesViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourcesViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
