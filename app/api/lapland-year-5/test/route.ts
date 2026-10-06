import { practicePaper } from '@/Naplan_Y5_System/captures';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiError('MISSING_REQUIRED_FIELD', 400, 'Test id is required');
  try {
    return apiSuccess(practicePaper(id));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Practice test not found';
    return apiError('INVALID_REQUEST', 404, message);
  }
}
