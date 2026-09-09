import { describe, expect, it } from 'vitest';

import {
  readingAnswersFromAttempt,
  readingResultsFromAttempt,
  reviewAnswersFromAttempt,
  reviewResultsFromAttempt,
} from '@/lib/oliver-vocabulary/restore-attempt';
import type { FrozenReadingAttempt, FrozenReviewAttempt } from '@/Oliver_Vocabulary_System/types';

const reviewAttempt: FrozenReviewAttempt = {
  fingerprint: 'fp',
  lesson_generated_at: '2026-09-09T00:00:00.000Z',
  marked_at: '2026-09-09T00:01:00.000Z',
  correct: 1,
  total: 2,
  correct_rate: 50,
  results: [
    {
      exerciseId: 'REV001-1',
      word: 'analyse',
      type: 'meaning_matching',
      expected: 'To examine carefully.',
      given: 'A celebration.',
      correct: false,
    },
    {
      exerciseId: 'REV001-2',
      word: 'significant',
      type: 'synonym_selection',
      expected: 'important',
      given: 'important',
      correct: true,
    },
  ],
};

const readingAttempt: FrozenReadingAttempt = {
  lesson_generated_at: '2026-09-09T00:00:00.000Z',
  marked_at: '2026-09-09T00:02:00.000Z',
  correct: 1,
  total: 1,
  correct_rate: 100,
  results: [
    {
      questionId: 'RQ001-1',
      given: 'To examine something carefully.',
      expected: 'To examine something carefully.',
      correct: true,
    },
  ],
};

describe('frozen attempt restore', () => {
  it('restores the original selected review and reading answers', () => {
    expect(reviewAnswersFromAttempt(reviewAttempt)).toEqual({
      'REV001-1': 'A celebration.',
      'REV001-2': 'important',
    });
    expect(reviewResultsFromAttempt(reviewAttempt)['REV001-1']?.correct).toBe(false);
    expect(reviewResultsFromAttempt(reviewAttempt)['REV001-2']?.correct).toBe(true);
    expect(readingAnswersFromAttempt(readingAttempt)).toEqual({
      'RQ001-1': 'To examine something carefully.',
    });
    expect(readingResultsFromAttempt(readingAttempt)['RQ001-1']).toEqual({
      given: 'To examine something carefully.',
      expected: 'To examine something carefully.',
      correct: true,
    });
  });
});
