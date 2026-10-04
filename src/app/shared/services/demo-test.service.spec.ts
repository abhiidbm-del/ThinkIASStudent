import { TestBed } from '@angular/core/testing';

import { DemoTestService } from './demo-test.service';

describe('DemoTestService', () => {
  let service: DemoTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DemoTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
