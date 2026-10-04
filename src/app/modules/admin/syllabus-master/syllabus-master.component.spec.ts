import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyllabusMasterComponent } from './syllabus-master.component';

describe('SyllabusMasterComponent', () => {
  let component: SyllabusMasterComponent;
  let fixture: ComponentFixture<SyllabusMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SyllabusMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SyllabusMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
