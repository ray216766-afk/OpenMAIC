import { reviewScheduleOffsets } from '../normalize';
import { firstSeenDayNumber, getProgressEntry } from '../store';
import type { ProgressEntry, VocabularyEntry, VocabularyProgressFile } from '../types';

const REVIEW_TARGET = 15;

export interface ReviewSelection {
  words: VocabularyEntry[];
  reasons: Record<string, string>;
}

function recencyScore(entry: ProgressEntry | undefined, day: number): number {
  const seen = firstSeenDayNumber(entry?.first_seen);
  if (!seen) return 0;
  const age = Math.max(0, day - seen);
  if (age <= 2) return 100 - age * 8;
  if (age <= 7) return 70 - age * 3;
  return Math.max(10, 40 - age);
}

function incorrectScore(entry: ProgressEntry | undefined): number {
  if (!entry) return 0;
  const incorrect = entry.incorrect_count ?? 0;
  if (incorrect <= 0 && (entry.correct_rate ?? 100) >= 85) return 0;
  if ((entry.correct_rate ?? 100) < 50) return 95 + incorrect;
  if ((entry.correct_rate ?? 100) < 70) return 75 + incorrect;
  return incorrect * 12;
}

function lowMasteryScore(entry: ProgressEntry | undefined): number {
  switch (entry?.mastery) {
    case 'New':
      return 80;
    case 'Learning':
      return 70;
    case 'Developing':
      return 40;
    case 'Mastered':
      return 8;
    default:
      return 50;
  }
}

function scheduledReviewScore(
  word: VocabularyEntry,
  record: ProgressEntry | undefined,
  day: number,
): number {
  const seen = firstSeenDayNumber(record?.first_seen);
  if (!seen) return 0;
  const age = Math.max(0, day - seen);
  const offsets = reviewScheduleOffsets(word.review_schedule);
  if (offsets.includes(age)) return 95;
  const next = offsets.find((offset) => offset > age);
  if (next !== undefined && next - age <= 1) return 55;
  const lastDue = [...offsets].reverse().find((offset) => offset < age);
  if (lastDue !== undefined && age - lastDue <= 2) return 40;
  return 0;
}

function spacedScore(entry: ProgressEntry | undefined, day: number): number {
  if (!entry) return 20;
  const due = entry.next_review_day ?? firstSeenDayNumber(entry.first_seen) + 1;
  if (day >= due) return 60 + Math.min(30, day - due);
  return Math.max(0, 15 - (due - day));
}

function selectionReason(entry: ProgressEntry | undefined, day: number): string {
  const scores = {
    recently_learned: recencyScore(entry, day),
    incorrect: incorrectScore(entry),
    low_mastery: lowMasteryScore(entry),
    spaced_repetition: spacedScore(entry, day),
  };
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'spaced_repetition';
}

/**
 * Priority: (1) recently learned (2) incorrect (3) low mastery (4) spaced repetition.
 * When history is thin (early days), fill from remaining unseen/low-level words
 * so every lesson still ships 15 review items.
 */
export function selectReviewWords(
  master: VocabularyEntry[],
  progress: VocabularyProgressFile,
  day: number,
  excludeWords: Set<string>,
  count = REVIEW_TARGET,
  preferred: VocabularyEntry[] = [],
): ReviewSelection {
  const exclude = new Set([...excludeWords].map((word) => word.toLowerCase()));
  const preferredKeys = new Set(preferred.map((entry) => entry.word.toLowerCase()));
  const pool = preferred.length > 0 ? preferred : master;

  const ranked = pool
    .filter((entry) => !exclude.has(entry.word.toLowerCase()))
    .map((entry) => {
      const record = getProgressEntry(progress, entry.word);
      const seen = firstSeenDayNumber(record?.first_seen);
      const preferredBoost = preferredKeys.has(entry.word.toLowerCase()) ? 12 : 0;
      const scheduleBoost = scheduledReviewScore(entry, record, day);
      const score =
        recencyScore(record, day) * 4 +
        incorrectScore(record) * 3 +
        lowMasteryScore(record) * 2 +
        spacedScore(record, day) +
        scheduleBoost * 2 +
        preferredBoost +
        Math.max(0, 4 - entry.level);
      const eligible =
        Boolean(record) || seen > 0 || preferredKeys.has(entry.word.toLowerCase()) || day === 1;
      return { entry, record, score: eligible ? score : score * 0.35, seen };
    })
    .sort((a, b) => {
      if (Boolean(a.record) !== Boolean(b.record)) return a.record ? -1 : 1;
      if (b.score !== a.score) return b.score - a.score;
      return a.entry.id.localeCompare(b.entry.id);
    });

  const chosen: VocabularyEntry[] = [];
  const reasons: Record<string, string> = {};
  for (const row of ranked) {
    if (chosen.length >= count) break;
    chosen.push(row.entry);
    reasons[row.entry.word] = selectionReason(row.record, day);
  }

  if (chosen.length < count) {
    for (const entry of master) {
      if (chosen.length >= count) break;
      if (exclude.has(entry.word.toLowerCase())) continue;
      if (chosen.some((item) => item.word === entry.word)) continue;
      chosen.push(entry);
      reasons[entry.word] = 'low_mastery';
    }
  }

  return { words: chosen.slice(0, count), reasons };
}

export { buildReviewExercise, buildReviewExercises } from './exercises';
export type { BuildExercisesOptions } from './exercises';

export { answersMatch, gradeReviewAnswers, reviewAttemptFingerprint } from './grade';
export { markReviewQuiz, quizFromFrozenAttempt } from './mark';
export { gradeReadingAnswers, markReadingQuiz } from './reading';
export type { ReadingAnswer } from './reading';
