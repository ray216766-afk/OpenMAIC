import { describe, expect, it } from 'vitest';

import {
  choiceReviewTone,
  formatChoiceScore,
  gradeChoiceSelections,
} from '@/lib/oliver-vocabulary/choice-review';

describe('choice review helpers', () => {
  it('keeps wrong picks red and always reveals the expected option', () => {
    const wrong = { given: 'A celebration.', expected: 'To examine carefully.', correct: false };
    expect(choiceReviewTone('A celebration.', wrong)).toBe('incorrect');
    expect(choiceReviewTone('To examine carefully.', wrong)).toBe('correct');
    expect(choiceReviewTone('A uniform.', wrong)).toBe('default');
  });

  it('marks a correct pick calmly as correct', () => {
    const right = { given: 'important', expected: 'important', correct: true };
    expect(choiceReviewTone('important', right)).toBe('correct');
    expect(choiceReviewTone('tiny', right)).toBe('default');
  });

  it('grades only answered reading items and formats the score', () => {
    const graded = gradeChoiceSelections(
      [
        { id: 'RQ001-1', answer: 'To examine something carefully.' },
        { id: 'RQ001-2', answer: 'Careful observation matters more than a dramatic view.' },
      ],
      { 'RQ001-1': 'A loud celebration.' },
    );

    expect(graded.total).toBe(1);
    expect(graded.correct).toBe(0);
    expect(graded.results['RQ001-1']).toEqual({
      given: 'A loud celebration.',
      expected: 'To examine something carefully.',
      correct: false,
    });
    expect(graded.results['RQ001-2']).toBeUndefined();
    expect(formatChoiceScore(1, 2)).toBe('1/2 correct (50%)');
  });
});
