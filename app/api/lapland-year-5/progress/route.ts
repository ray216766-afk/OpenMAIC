import { loadProgress } from '@/Naplan_Y5_System/store';
import { apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const progress = loadProgress();
  return apiSuccess({
    summary: {
      practice_attempts: progress.attempts.length,
      placement_attempts: progress.placements.length,
      updated_at: progress.updated_at,
    },
  });
}
