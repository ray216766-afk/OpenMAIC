import type { ChoiceReviewMark } from '@/lib/oliver-vocabulary/choice-review';

import type { ItemMark } from '../types';

/** Adapter for the vocabulary review colours. Unscored items stay unmarked. */
export function choiceMarkFromItem(mark: ItemMark | undefined): ChoiceReviewMark | null {
  if (!mark?.scored || mark.correct == null || !mark.expected) return null;
  const given = Array.isArray(mark.given) ? mark.given.join(' · ') : (mark.given ?? '');
  return { given, expected: mark.expected, correct: mark.correct };
}
