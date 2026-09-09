import type { ChoiceOptionTone } from '@/components/oliver-vocabulary/choice-options';

export interface ChoiceReviewMark {
  given: string;
  expected: string;
  correct: boolean;
}

/**
 * Review colours: the expected option is always revealed; a wrong pick stays red.
 */
export function choiceReviewTone(option: string, mark?: ChoiceReviewMark | null): ChoiceOptionTone {
  if (!mark) return 'default';
  if (option === mark.expected) return 'correct';
  if (option === mark.given && !mark.correct) return 'incorrect';
  return 'default';
}

/** Prompt colour after submit: correct = green, wrong = red. */
export function choiceReviewPromptClass(mark?: ChoiceReviewMark | null): string {
  if (!mark) return 'font-medium';
  return mark.correct ? 'font-medium text-emerald-800' : 'font-medium text-red-800';
}

export function choiceReviewPromptTone(
  mark?: ChoiceReviewMark | null,
): 'correct' | 'incorrect' | undefined {
  if (!mark) return undefined;
  return mark.correct ? 'correct' : 'incorrect';
}

export function gradeChoiceSelections(
  items: Array<{ id: string; answer: string }>,
  answers: Record<string, string>,
): { results: Record<string, ChoiceReviewMark>; correct: number; total: number } {
  const results: Record<string, ChoiceReviewMark> = {};
  let correct = 0;
  let total = 0;

  for (const item of items) {
    const given = answers[item.id];
    if (!given) continue;
    total += 1;
    const isCorrect = given.trim().toLowerCase() === item.answer.trim().toLowerCase();
    if (isCorrect) correct += 1;
    results[item.id] = {
      given,
      expected: item.answer,
      correct: isCorrect,
    };
  }

  return { results, correct, total };
}

export function formatChoiceScore(correct: number, total: number): string {
  const rate = total ? Math.round((correct / total) * 100) : 0;
  return `${correct}/${total} correct (${rate}%)`;
}
