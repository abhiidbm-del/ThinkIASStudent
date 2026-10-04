import { TestBed } from '@angular/core/testing';

import { LiveTestService } from './live-test.service';

describe('LiveTestService', () => {
  let service: LiveTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
