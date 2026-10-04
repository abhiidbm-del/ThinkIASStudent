import { TestBed } from '@angular/core/testing';

import { DocumentVisibilityService } from './document-visibility.service';

describe('DocumentVisibilityService', () => {
  let service: DocumentVisibilityService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DocumentVisibilityService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
