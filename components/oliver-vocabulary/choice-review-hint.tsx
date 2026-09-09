import type { ChoiceReviewMark } from '@/lib/oliver-vocabulary/choice-review';

export function ChoiceReviewHint({ mark }: { mark?: ChoiceReviewMark }) {
  if (!mark) return null;
  if (mark.correct) {
    return (
      <p className="mt-1 text-sm text-emerald-800" data-review-hint="correct">
        Correct
      </p>
    );
  }
  return (
    <p className="mt-1 text-sm font-medium text-red-800" data-review-hint="incorrect">
      Correct answer: <span data-correct-answer>{mark.expected}</span>
    </p>
  );
}
