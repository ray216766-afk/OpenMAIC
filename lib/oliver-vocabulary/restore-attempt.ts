import { formatChoiceScore, type ChoiceReviewMark } from '@/lib/oliver-vocabulary/choice-review';
import type {
  FrozenReadingAttempt,
  FrozenReviewAttempt,
  QuizItemResult,
} from '@/Oliver_Vocabulary_System/types';

export function reviewAnswersFromAttempt(
  attempt: FrozenReviewAttempt | null | undefined,
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const result of attempt?.results ?? []) {
    answers[result.exerciseId] = result.given;
  }
  return answers;
}

export function reviewResultsFromAttempt(
  attempt: FrozenReviewAttempt | null | undefined,
): Record<string, QuizItemResult> {
  const results: Record<string, QuizItemResult> = {};
  for (const result of attempt?.results ?? []) {
    results[result.exerciseId] = result;
  }
  return results;
}

export function readingAnswersFromAttempt(
  attempt: FrozenReadingAttempt | null | undefined,
): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const result of attempt?.results ?? []) {
    answers[result.questionId] = result.given;
  }
  return answers;
}

export function readingResultsFromAttempt(
  attempt: FrozenReadingAttempt | null | undefined,
): Record<string, ChoiceReviewMark> {
  const results: Record<string, ChoiceReviewMark> = {};
  for (const result of attempt?.results ?? []) {
    results[result.questionId] = {
      given: result.given,
      expected: result.expected,
      correct: result.correct,
    };
  }
  return results;
}

export function readingScoreFromAttempt(
  attempt: FrozenReadingAttempt | null | undefined,
): string | null {
  if (!attempt) return null;
  return formatChoiceScore(attempt.correct, attempt.total);
}
