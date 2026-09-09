import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { ACTIVE_BANK, normalizeMasterWords } from './normalize';
import {
  MASTERY_ALIASES,
  MODULE_NAME,
  MODULE_VERSION,
  type DailyLesson,
  type FrozenReviewAttempt,
  type LessonSnapshotFile,
  type MasteryLevel,
  type ParentLessonReference,
  type ProgressEntry,
  type VocabularyEntry,
  type VocabularyEnginePaths,
  type VocabularyProgressFile,
} from './types';

export const DEFAULT_STUDENT = 'Oliver';
export { ACTIVE_BANK } from './normalize';

export const ARCHIVE_SEED_RELATIVE_PATH = 'archive/Vocabulary_Master_seed_v1_309.json';
export const COMPILED_MASTER_RELATIVE_PATH = 'Vocabulary_Master.json';

export const PROGRESS_RESET_NOTE =
  'Progress was reset when the live bank switched from the V1.0 309-word seed to Academic Core Batch 1 (100 words, VAC0001–VAC0100). Day 1 starts clean. The old seed is archived at archive/Vocabulary_Master_seed_v1_309.json and is not used for lessons.';

export function defaultModuleRoot(): string {
  return join(process.cwd(), 'Oliver_Vocabulary_System');
}

export function resolveMasterPath(root = defaultModuleRoot()): string {
  const academic = join(root, ACTIVE_BANK.relativePath);
  if (existsSync(academic)) return academic;
  const compiled = join(root, COMPILED_MASTER_RELATIVE_PATH);
  if (existsSync(compiled)) return compiled;
  throw new Error(`No Academic Core or compiled Vocabulary_Master.json found under ${root}`);
}

export function defaultEnginePaths(root = defaultModuleRoot()): VocabularyEnginePaths {
  return {
    masterPath: resolveMasterPath(root),
    progressPath: join(root, 'Vocabulary_Progress.json'),
  };
}

export function lessonSnapshotPath(paths: VocabularyEnginePaths, day: number): string {
  return join(dirname(paths.progressPath), `Lesson_Day_${String(day).padStart(3, '0')}.json`);
}

export function loadLessonSnapshot(
  paths: VocabularyEnginePaths,
  day: number,
): LessonSnapshotFile | null {
  const filePath = lessonSnapshotPath(paths, day);
  if (!existsSync(filePath)) return null;
  const parsed = JSON.parse(readFileSync(filePath, 'utf8')) as LessonSnapshotFile;
  if (!parsed?.lesson?.review_exercises) return null;
  return parsed;
}

export function saveLessonSnapshot(
  paths: VocabularyEnginePaths,
  snapshot: {
    lesson: DailyLesson;
    parent_reference?: ParentLessonReference;
    progress?: ProgressEntry[];
    review_attempt?: FrozenReviewAttempt | null;
  },
): void {
  const filePath = lessonSnapshotPath(paths, snapshot.lesson.day);
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  renameSync(tmp, filePath);
}

export function emptyProgressFile(): VocabularyProgressFile {
  return {
    student: DEFAULT_STUDENT,
    module: MODULE_NAME,
    version: MODULE_VERSION,
    active_bank: ACTIVE_BANK.id,
    progress_note: PROGRESS_RESET_NOTE,
    updated_at: null,
    last_completed_day: 0,
    entries: [],
  };
}

export function loadMaster(paths: VocabularyEnginePaths = defaultEnginePaths()): VocabularyEntry[] {
  const raw = readFileSync(paths.masterPath, 'utf8');
  const words = normalizeMasterWords(JSON.parse(raw));
  if (words.length === 0) {
    throw new Error(`Vocabulary master has no words: ${paths.masterPath}`);
  }
  return words;
}

export function loadProgress(
  paths: VocabularyEnginePaths = defaultEnginePaths(),
): VocabularyProgressFile {
  if (!existsSync(paths.progressPath)) {
    return emptyProgressFile();
  }
  const raw = readFileSync(paths.progressPath, 'utf8');
  const parsed = JSON.parse(raw) as VocabularyProgressFile;
  return {
    ...emptyProgressFile(),
    ...parsed,
    entries: (parsed.entries ?? []).map(normalizeProgressEntry),
  };
}

export function saveProgress(
  progress: VocabularyProgressFile,
  paths: VocabularyEnginePaths = defaultEnginePaths(),
): void {
  const next: VocabularyProgressFile = {
    ...progress,
    module: MODULE_NAME,
    version: MODULE_VERSION,
    student: progress.student || DEFAULT_STUDENT,
    active_bank: progress.active_bank || ACTIVE_BANK.id,
    progress_note: progress.progress_note || PROGRESS_RESET_NOTE,
    updated_at: new Date().toISOString(),
    entries: progress.entries.map(normalizeProgressEntry),
  };
  mkdirSync(dirname(paths.progressPath), { recursive: true });
  const tmp = `${paths.progressPath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  renameSync(tmp, paths.progressPath);
}

export function normalizeMastery(value: string | undefined): MasteryLevel {
  if (!value) return 'New';
  return MASTERY_ALIASES[value] ?? 'New';
}

export function normalizeProgressEntry(entry: ProgressEntry): ProgressEntry {
  const correct = entry.correct_count ?? 0;
  const incorrect = entry.incorrect_count ?? 0;
  const attempts = correct + incorrect;
  const correctRate =
    attempts > 0 ? Math.round((correct / attempts) * 100) : (entry.correct_rate ?? 0);
  return {
    ...entry,
    first_seen: entry.first_seen || 'Day 0',
    review_count: entry.review_count ?? 0,
    correct_count: correct,
    incorrect_count: incorrect,
    correct_rate: correctRate,
    mastery: deriveMastery({
      ...entry,
      correct_count: correct,
      incorrect_count: incorrect,
      correct_rate: correctRate,
    }),
  };
}

/**
 * Mastery bands (documented in Documentation.md):
 * - New: unseen or no successful reviews yet
 * - Learning: 1–2 reviews or accuracy under 60%
 * - Developing: 3–4 reviews or accuracy 60–84%
 * - Mastered: 5+ reviews and accuracy ≥ 85%
 * Display alias "Strong" maps to Mastered.
 */
export function deriveMastery(
  entry: Pick<ProgressEntry, 'review_count' | 'correct_rate'>,
): MasteryLevel {
  const reviews = entry.review_count ?? 0;
  const rate = entry.correct_rate ?? 0;
  if (reviews <= 0) return 'New';
  if (reviews >= 5 && rate >= 85) return 'Mastered';
  if (reviews >= 3 && rate >= 60) return 'Developing';
  return 'Learning';
}

export function progressKey(word: string): string {
  return word.trim().toLowerCase();
}

export function getProgressEntry(
  progress: VocabularyProgressFile,
  word: string,
): ProgressEntry | undefined {
  const key = progressKey(word);
  return progress.entries.find((entry) => progressKey(entry.word) === key);
}

export function upsertProgressEntry(
  progress: VocabularyProgressFile,
  update: ProgressEntry,
): VocabularyProgressFile {
  const key = progressKey(update.word);
  const entries = [...progress.entries];
  const index = entries.findIndex((entry) => progressKey(entry.word) === key);
  const next = normalizeProgressEntry(update);
  if (index >= 0) entries[index] = next;
  else entries.push(next);
  return { ...progress, entries };
}

export function markFirstSeen(
  progress: VocabularyProgressFile,
  word: string,
  day: number,
): VocabularyProgressFile {
  const existing = getProgressEntry(progress, word);
  if (existing) return progress;
  return upsertProgressEntry(progress, {
    word,
    first_seen: `Day ${day}`,
    review_count: 0,
    correct_rate: 0,
    mastery: 'New',
    correct_count: 0,
    incorrect_count: 0,
    last_reviewed_day: undefined,
    next_review_day: day + 1,
  });
}

export function applyReviewOutcome(
  progress: VocabularyProgressFile,
  word: string,
  day: number,
  correct: boolean,
): VocabularyProgressFile {
  const existing = getProgressEntry(progress, word) ?? {
    word,
    first_seen: `Day ${day}`,
    review_count: 0,
    correct_rate: 0,
    mastery: 'New' as const,
    correct_count: 0,
    incorrect_count: 0,
  };
  const correctCount = (existing.correct_count ?? 0) + (correct ? 1 : 0);
  const incorrectCount = (existing.incorrect_count ?? 0) + (correct ? 0 : 1);
  const reviewCount = existing.review_count + 1;
  const interval = spacedIntervalDays(reviewCount, correct, existing.correct_rate);
  return upsertProgressEntry(progress, {
    ...existing,
    review_count: reviewCount,
    correct_count: correctCount,
    incorrect_count: incorrectCount,
    last_reviewed_day: day,
    next_review_day: day + interval,
    correct_rate: 0,
    mastery: 'New',
  });
}

export function spacedIntervalDays(
  reviewCount: number,
  lastCorrect: boolean,
  previousRate: number,
): number {
  if (!lastCorrect) return 1;
  if (reviewCount <= 1) return 1;
  if (reviewCount === 2) return 3;
  if (previousRate >= 85 && reviewCount >= 5) return 10;
  if (previousRate >= 70) return 6;
  return 4;
}

export function firstSeenDayNumber(firstSeen: string | undefined): number {
  if (!firstSeen) return 0;
  const match = /Day\s+(\d+)/i.exec(firstSeen);
  return match ? Number(match[1]) : 0;
}
