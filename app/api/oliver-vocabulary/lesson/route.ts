import { NextRequest } from 'next/server';

import {
  LessonQualityError,
  NewWordsExhaustedError,
  generateOliverVocabularyLessonDay,
} from '@/Oliver_Vocabulary_System/Daily_Lesson_Generator';
import { defaultEnginePaths } from '@/Oliver_Vocabulary_System/store';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';

function parseDay(value: unknown): number | null {
  const day = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(day) || day < 1) return null;
  return day;
}

function lessonResponse(day: number, persist: boolean, reset: boolean) {
  const result = generateOliverVocabularyLessonDay(day, defaultEnginePaths(), { persist, reset });
  return apiSuccess({
    action:
      result.source === 'snapshot'
        ? `Open locked Oliver Vocabulary Lesson Day ${day}`
        : `Generate Oliver Vocabulary Lesson Day ${day}`,
    ...result,
  });
}

function lessonError(error: unknown) {
  if (error instanceof NewWordsExhaustedError) {
    return apiError('INVALID_REQUEST', 409, error.message);
  }
  if (error instanceof LessonQualityError) {
    return apiError('GENERATION_FAILED', 422, error.message);
  }
  const message = error instanceof Error ? error.message : 'Lesson generation failed';
  return apiError('GENERATION_FAILED', 500, message);
}

export async function GET(req: NextRequest) {
  const day = parseDay(req.nextUrl.searchParams.get('day') ?? '1');
  if (!day) return apiError('INVALID_REQUEST', 400, 'day must be an integer >= 1');
  try {
    const persist = req.nextUrl.searchParams.get('persist') !== '0';
    return lessonResponse(day, persist, false);
  } catch (error) {
    return lessonError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      day?: unknown;
      persist?: boolean;
      reset?: boolean;
    };
    const day = parseDay(body.day ?? 1);
    if (!day) return apiError('INVALID_REQUEST', 400, 'day must be an integer >= 1');
    const result = generateOliverVocabularyLessonDay(day, defaultEnginePaths(), {
      persist: body.persist ?? true,
      reset: body.reset === true,
    });
    return apiSuccess({
      action:
        result.source === 'snapshot'
          ? `Open locked Oliver Vocabulary Lesson Day ${day}`
          : body.reset
            ? `Reset and generate Oliver Vocabulary Lesson Day ${day}`
            : `Generate Oliver Vocabulary Lesson Day ${day}`,
      ...result,
    });
  } catch (error) {
    return lessonError(error);
  }
}
