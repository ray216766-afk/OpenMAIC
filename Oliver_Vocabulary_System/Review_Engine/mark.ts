import {
  applyReviewOutcome,
  loadLessonSnapshot,
  loadProgress,
  saveLessonSnapshot,
  saveProgress,
} from '../store';
import type { FrozenReviewAttempt, QuizAnswer, QuizResult, VocabularyEnginePaths } from '../types';

import { gradeReviewAnswers, reviewAttemptFingerprint } from './grade';

export function quizFromFrozenAttempt(
  day: number,
  attempt: FrozenReviewAttempt,
  progress: QuizResult['progress'],
): QuizResult {
  return {
    day,
    total: attempt.total,
    correct: attempt.correct,
    correct_rate: attempt.correct_rate,
    results: attempt.results,
    progress,
  };
}

/**
 * Mark review against the lesson snapshot the student was shown.
 * Regenerating after progress updates would remap REV###-N ids onto new
 * words/answers and make the same clicks score differently.
 * The first successful mark for a generated lesson is frozen.
 */
export function markReviewQuiz(
  paths: VocabularyEnginePaths,
  day: number,
  answers: QuizAnswer[],
): QuizResult {
  const snapshot = loadLessonSnapshot(paths, day);
  if (!snapshot) {
    throw new Error('Generate the lesson before marking review');
  }

  const progress = loadProgress(paths);
  const existing = snapshot.review_attempt;
  if (existing && existing.lesson_generated_at === snapshot.lesson.generated_at) {
    return quizFromFrozenAttempt(day, existing, progress.entries);
  }

  const graded = gradeReviewAnswers(snapshot.lesson.review_exercises, answers);
  let nextProgress = progress;
  for (const result of graded.results) {
    nextProgress = applyReviewOutcome(nextProgress, result.word, day, result.correct);
  }
  if (day > nextProgress.last_completed_day) {
    nextProgress = { ...nextProgress, last_completed_day: day };
  }
  saveProgress(nextProgress, paths);

  const attempt: FrozenReviewAttempt = {
    fingerprint: reviewAttemptFingerprint(day, answers),
    lesson_generated_at: snapshot.lesson.generated_at,
    marked_at: new Date().toISOString(),
    correct: graded.correct,
    total: graded.total,
    correct_rate: graded.correct_rate,
    results: graded.results,
  };
  saveLessonSnapshot(paths, {
    ...snapshot,
    progress: nextProgress.entries,
    review_attempt: attempt,
    locked: true,
  });

  return {
    day,
    ...graded,
    progress: nextProgress.entries,
  };
}
