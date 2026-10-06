import { bookmarkQuestion, loadWrongBank } from '@/Naplan_Y5_System/store';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const bank = loadWrongBank();
  return apiSuccess({ items: bank.items, updated_at: bank.updated_at });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { resourceId?: string; questionId?: string };
  if (!body.resourceId || !body.questionId) {
    return apiError('MISSING_REQUIRED_FIELD', 400, 'resourceId and questionId are required');
  }
  const item = bookmarkQuestion(body.resourceId, body.questionId);
  if (!item) return apiError('INVALID_REQUEST', 404, 'Question not found');
  return apiSuccess({ item });
}
