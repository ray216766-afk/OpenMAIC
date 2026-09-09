import { loadLessonSnapshot, saveLessonSnapshot } from '../store';
import type {
  FrozenReadingAttempt,
  FrozenReadingResult,
  ReadingQuestion,
  VocabularyEnginePaths,
} from '../types';

import { answersMatch } from './grade';

export interface ReadingAnswer {
  questionId: string;
  answer: string;
}

export function gradeReadingAnswers(
  questions: ReadingQuestion[],
  answers: ReadingAnswer[],
): { total: number; correct: number; correct_rate: number; results: FrozenReadingResult[] } {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const results: FrozenReadingResult[] = [];

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    results.push({
      questionId: question.id,
      given: answer.answer,
      expected: question.answer,
      correct: answersMatch(question.answer, answer.answer),
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

/**
 * Persist the first Section 4 submit against the locked lesson snapshot.
 * Repeat clicks return the frozen attempt (answers stay put, not reshuffled).
 */
export function markReadingQuiz(
  paths: VocabularyEnginePaths,
  day: number,
  answers: ReadingAnswer[],
): FrozenReadingAttempt {
  const snapshot = loadLessonSnapshot(paths, day);
  if (!snapshot) {
    throw new Error('Generate the lesson before submitting reading answers');
  }

  const existing = snapshot.reading_attempt;
  if (existing && existing.lesson_generated_at === snapshot.lesson.generated_at) {
    return existing;
  }

  const graded = gradeReadingAnswers(snapshot.lesson.reading_questions, answers);
  const attempt: FrozenReadingAttempt = {
    lesson_generated_at: snapshot.lesson.generated_at,
    marked_at: new Date().toISOString(),
    correct: graded.correct,
    total: graded.total,
    correct_rate: graded.correct_rate,
    results: graded.results,
  };
  saveLessonSnapshot(paths, {
    ...snapshot,
    locked: true,
    reading_attempt: attempt,
  });
  return attempt;
}
