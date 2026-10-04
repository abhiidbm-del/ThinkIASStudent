import { TestBed } from '@angular/core/testing';

import { AnswerWritingService } from './answer-writing.service';

describe('AnswerWritingService', () => {
  let service: AnswerWritingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnswerWritingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
