import { placementPaper, submitPlacement } from '@/Naplan_Y5_System/attempt';
import type { AnswerValue } from '@/Naplan_Y5_System/types';
import { apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return apiSuccess(placementPaper());
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    answers?: Record<string, AnswerValue | undefined>;
    bookmarks?: string[];
    teacherMarks?: Record<string, boolean | undefined>;
  };
  const result = submitPlacement({
    answers: body.answers ?? {},
    bookmarks: body.bookmarks ?? [],
    teacherMarks: body.teacherMarks,
  });
  return apiSuccess({
    attempt: result.attempt,
    report: result.report,
    saved_wrong: result.saved_wrong,
    score_label: result.score_label,
    strand_summary: result.strand_summary,
  });
}
