import { TestBed } from '@angular/core/testing';

import { ModuleTestService } from './module-test.service';

describe('ModuleTestService', () => {
  let service: ModuleTestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModuleTestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
