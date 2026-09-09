import type { QuizAnswer, QuizResult, ReviewExercise } from '../types';

export function answersMatch(expected: string, given: string): boolean {
  return expected.trim().toLowerCase() === given.trim().toLowerCase();
}

export function reviewAttemptFingerprint(day: number, answers: QuizAnswer[]): string {
  const normalized = [...answers]
    .map((item) => ({
      exerciseId: item.exerciseId,
      answer: item.answer.trim().toLowerCase(),
    }))
    .sort((a, b) => a.exerciseId.localeCompare(b.exerciseId));
  return JSON.stringify({ day, answers: normalized });
}

export type GradedReview = Pick<QuizResult, 'total' | 'correct' | 'correct_rate' | 'results'>;

/**
 * Grade the student's answers against the exercises they were shown.
 * Never regenerates items. Same exercises + same answers => same result.
 */
export function gradeReviewAnswers(
  exercises: ReviewExercise[],
  answers: QuizAnswer[],
): GradedReview {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const results: GradedReview['results'] = [];

  for (const answer of answers) {
    const exercise = byId.get(answer.exerciseId);
    if (!exercise) continue;
    const correct = answersMatch(exercise.answer, answer.answer);
    results.push({
      exerciseId: exercise.id,
      word: exercise.word,
      type: exercise.type,
      expected: exercise.answer,
      given: answer.answer,
      correct,
    });
  }

  const correctCount = results.filter((result) => result.correct).length;
  return {
    total: results.length,
    correct: correctCount,
    correct_rate: results.length ? Math.round((correctCount / results.length) * 100) : 0,
    results,
  };
}
