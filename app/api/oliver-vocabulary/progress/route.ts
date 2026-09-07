import { defaultEnginePaths, loadMaster, loadProgress } from '@/Oliver_Vocabulary_System/store';
import { VOCABULARY_LEVELS } from '@/Oliver_Vocabulary_System/types';
import { apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';

export async function GET() {
  const paths = defaultEnginePaths();
  const master = loadMaster(paths);
  const progress = loadProgress(paths);
  const byMastery = progress.entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.mastery] = (acc[entry.mastery] ?? 0) + 1;
    return acc;
  }, {});
  return apiSuccess({
    progress,
    summary: {
      master_word_count: master.length,
      tracked_words: progress.entries.length,
      last_completed_day: progress.last_completed_day,
      by_mastery: byMastery,
      levels: VOCABULARY_LEVELS,
    },
  });
}
