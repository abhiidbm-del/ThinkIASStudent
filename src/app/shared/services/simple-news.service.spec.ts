import { TestBed } from '@angular/core/testing';

import { SimpleNewsService } from './simple-news.service';

describe('SimpleNewsService', () => {
  let service: SimpleNewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SimpleNewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
