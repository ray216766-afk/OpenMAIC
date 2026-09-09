import { NextRequest } from 'next/server';

import { markReadingQuiz } from '@/Oliver_Vocabulary_System/Review_Engine/reading';
import { defaultEnginePaths } from '@/Oliver_Vocabulary_System/store';
import type { ReadingAnswer } from '@/Oliver_Vocabulary_System/Review_Engine/reading';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { day?: unknown; answers?: ReadingAnswer[] };
    const day = Number(body.day);
    if (!Number.isInteger(day) || day < 1) {
      return apiError('INVALID_REQUEST', 400, 'day must be an integer >= 1');
    }
    const answers = body.answers ?? [];
    if (!Array.isArray(answers) || answers.length === 0) {
      return apiError('MISSING_REQUIRED_FIELD', 400, 'answers are required');
    }

    const reading = markReadingQuiz(defaultEnginePaths(), day, answers);
    return apiSuccess({ reading });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reading marking failed';
    return apiError('INTERNAL_ERROR', 500, message);
  }
}
