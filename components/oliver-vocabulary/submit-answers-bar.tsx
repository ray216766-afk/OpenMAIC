'use client';

import { Check, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface SubmitAnswersBarProps {
  section: 'review' | 'reading';
  onSubmit: () => void;
  submitting?: boolean;
  submitted: boolean;
  score?: string | null;
  hint: string;
}

export function SubmitAnswersBar({
  section,
  onSubmit,
  submitting = false,
  submitted,
  score,
  hint,
}: SubmitAnswersBarProps) {
  return (
    <div className="mt-6 flex flex-col gap-2" data-submit-answers-bar={section}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onSubmit}
          disabled={submitting || submitted}
          data-submit-answers={section}
          data-action={section === 'review' ? 'mark-review' : 'submit-reading'}
        >
          {submitting ? <Loader2 className="animate-spin" /> : <Check />}
          {submitted ? 'Answers submitted' : 'Submit answers'}
        </Button>
        {score ? (
          <p
            className="text-sm font-medium text-[#1f3a5f]"
            data-quiz-score
            data-score-section={section}
            data-review-frozen={submitted ? 'true' : undefined}
          >
            {score}
          </p>
        ) : null}
      </div>
      <p className="text-sm text-[#5c6574]">
        {submitted ? 'Your answers are locked for this attempt.' : hint}
      </p>
    </div>
  );
}
