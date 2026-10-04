import { TestBed } from '@angular/core/testing';

import { FreeResourcePublicService } from './free-resource-public.service';

describe('FreeResourcePublicService', () => {
  let service: FreeResourcePublicService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FreeResourcePublicService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
