import { NextRequest } from 'next/server';

import { generateOliverVocabularyLessonDay } from '@/Oliver_Vocabulary_System/Daily_Lesson_Generator';
import {
  applyReviewOutcome,
  defaultEnginePaths,
  loadProgress,
  saveProgress,
} from '@/Oliver_Vocabulary_System/store';
import type { QuizAnswer, QuizResult } from '@/Oliver_Vocabulary_System/types';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { day?: unknown; answers?: QuizAnswer[] };
    const day = Number(body.day);
    if (!Number.isInteger(day) || day < 1) {
      return apiError('INVALID_REQUEST', 400, 'day must be an integer >= 1');
    }
    const answers = body.answers ?? [];
    if (!Array.isArray(answers) || answers.length === 0) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'answers are required');
    }

    const paths = defaultEnginePaths();
    const generated = generateOliverVocabularyLessonDay(day, paths, { persist: false });
    const byId = new Map(
      generated.lesson.review_exercises.map((exercise) => [exercise.id, exercise]),
    );
    let progress = loadProgress(paths);
    const results: QuizResult['results'] = [];

    for (const answer of answers) {
      const exercise = byId.get(answer.exerciseId);
      if (!exercise) continue;
      const correct = answer.answer.trim().toLowerCase() === exercise.answer.trim().toLowerCase();
      progress = applyReviewOutcome(progress, exercise.word, day, correct);
      results.push({
        exerciseId: exercise.id,
        word: exercise.word,
        type: exercise.type,
        expected: exercise.answer,
        given: answer.answer,
        correct,
      });
    }

    if (day > progress.last_completed_day) {
      progress = { ...progress, last_completed_day: day };
    }
    saveProgress(progress, paths);

    const correctCount = results.filter((result) => result.correct).length;
    const quiz: QuizResult = {
      day,
      total: results.length,
      correct: correctCount,
      correct_rate: results.length ? Math.round((correctCount / results.length) * 100) : 0,
      results,
      progress: progress.entries,
    };
    return apiSuccess({ quiz });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Quiz marking failed';
    return apiError('INTERNAL_ERROR', 500, message);
  }
}
