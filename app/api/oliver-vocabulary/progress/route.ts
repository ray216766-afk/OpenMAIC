import {
  ACTIVE_BANK,
  defaultEnginePaths,
  listLessonDays,
  loadMaster,
  loadProgress,
} from '@/Oliver_Vocabulary_System/store';
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
      active_bank: ACTIVE_BANK.id,
      active_bank_label: ACTIVE_BANK.label,
      expansion_target: ACTIVE_BANK.expansionTarget,
      tracked_words: progress.entries.length,
      last_completed_day: progress.last_completed_day,
      locked_days: listLessonDays(paths),
      by_mastery: byMastery,
      levels: {
        1: VOCABULARY_LEVELS[1],
        2: VOCABULARY_LEVELS[2],
        3: VOCABULARY_LEVELS[3],
      },
    },
  });
}
