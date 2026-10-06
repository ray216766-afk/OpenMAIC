import { submitPractice } from '@/Naplan_Y5_System/attempt';
import type { AnswerValue } from '@/Naplan_Y5_System/types';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    resourceId?: string;
    answers?: Record<string, AnswerValue | undefined>;
    bookmarks?: string[];
  };
  if (!body.resourceId) return apiError('MISSING_REQUIRED_FIELD', 400, 'resourceId is required');
  try {
    const result = submitPractice({
      resourceId: body.resourceId,
      answers: body.answers ?? {},
      bookmarks: body.bookmarks ?? [],
    });
    return apiSuccess({
      attempt: result.attempt,
      saved_wrong: result.saved_wrong,
      score_label: result.score_label,
      strand_summary: result.strand_summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not score the test';
    return apiError('INVALID_REQUEST', 404, message);
  }
}
