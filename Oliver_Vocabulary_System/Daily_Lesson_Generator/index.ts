import { NewWordsExhaustedError } from '../errors';
import { buildReviewExercises, selectReviewWords } from '../Review_Engine';
import { generateMiniReading, generateReadingQuestions } from '../Mini_Reading_Generator';
import { buildDailyLesson, buildParentReference } from '../Lesson_Template';
import { assertNoChinese, toParentCard, toStudentCard } from '../student-view';
import {
  collectSnapshotNewWords,
  defaultEnginePaths,
  loadLessonSnapshot,
  loadMaster,
  loadProgress,
  markFirstSeen,
  progressKey,
  resetLessonDay,
  saveLessonSnapshot,
  saveProgress,
  wasPresentedAsNew,
} from '../store';
import type {
  GenerateLessonResult,
  ProgressEntry,
  VocabularyEnginePaths,
  VocabularyEntry,
  VocabularyProgressFile,
} from '../types';

const NEW_WORD_COUNT = 10;
const REVIEW_WORD_COUNT = 15;

export { NewWordsExhaustedError };

function curriculumOrder(master: VocabularyEntry[]): VocabularyEntry[] {
  return [...master].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Curriculum-order window for Day N without wrapping.
 * Day 11+ on a 100-word / 10-per-day bank returns [] instead of repeating Day 1.
 */
export function curriculumSlice(
  master: VocabularyEntry[],
  day: number,
  count = NEW_WORD_COUNT,
): VocabularyEntry[] {
  const ordered = curriculumOrder(master);
  const start = (Math.max(1, day) - 1) * count;
  if (start >= ordered.length) return [];
  const window: VocabularyEntry[] = [];
  for (let i = start; i < ordered.length && window.length < count; i += 1) {
    const entry = ordered[i];
    if (!window.some((item) => item.word === entry.word)) window.push(entry);
  }
  return window;
}

export function presentedNewWordKeys(
  progress: VocabularyProgressFile,
  extraUsed: Iterable<string> = [],
): Set<string> {
  const used = new Set<string>();
  for (const entry of progress.entries) {
    if (wasPresentedAsNew(entry)) used.add(progressKey(entry.word));
  }
  for (const word of extraUsed) {
    if (word) used.add(progressKey(word));
  }
  return used;
}

export function unusedCurriculumWords(
  master: VocabularyEntry[],
  progress: VocabularyProgressFile,
  extraUsed: Iterable<string> = [],
): VocabularyEntry[] {
  const used = presentedNewWordKeys(progress, extraUsed);
  return curriculumOrder(master).filter((entry) => !used.has(progressKey(entry.word)));
}

/**
 * New Vocabulary is unused curriculum-order words only.
 * A lemma already presented as New / with first_seen (or a locked snapshot)
 * must never appear here again — Review Vocabulary only.
 * Does not wrap the 100-word batch. Fewer than 10 unused → NewWordsExhaustedError.
 */
export function selectNewWords(
  master: VocabularyEntry[],
  progress: VocabularyProgressFile,
  _day: number,
  count = NEW_WORD_COUNT,
  extraUsed: Iterable<string> = [],
): VocabularyEntry[] {
  const unused = unusedCurriculumWords(master, progress, extraUsed);
  if (unused.length < count) {
    throw new NewWordsExhaustedError(unused.length, master.length);
  }
  return unused.slice(0, count);
}

/** Words already taught as New, in curriculum order — preferred Review pool. */
export function priorCurriculumWords(
  master: VocabularyEntry[],
  progress: VocabularyProgressFile,
  extraUsed: Iterable<string> = [],
): VocabularyEntry[] {
  const used = presentedNewWordKeys(progress, extraUsed);
  return curriculumOrder(master).filter((entry) => used.has(progressKey(entry.word)));
}

export interface GenerateLessonOptions {
  persist?: boolean;
  /** Parent/admin only. Deletes the locked Day X snapshot and regenerates. */
  reset?: boolean;
}

function resultFromSnapshot(
  snapshot: NonNullable<ReturnType<typeof loadLessonSnapshot>>,
  progress: ProgressEntry[],
): GenerateLessonResult {
  return {
    lesson: snapshot.lesson,
    parent_reference: snapshot.parent_reference ?? { day: snapshot.lesson.day, words: [] },
    progress: snapshot.progress ?? progress,
    locked: true,
    source: 'snapshot',
    review_attempt: snapshot.review_attempt ?? null,
    reading_attempt: snapshot.reading_attempt ?? null,
  };
}

export function generateOliverVocabularyLessonDay(
  day: number,
  paths: VocabularyEnginePaths = defaultEnginePaths(),
  options: GenerateLessonOptions = {},
): GenerateLessonResult {
  if (!Number.isInteger(day) || day < 1) {
    throw new Error('Day must be an integer >= 1');
  }

  const persist = options.persist ?? true;
  const reset = options.reset ?? false;

  if (reset && persist) {
    resetLessonDay(paths, day);
  } else {
    const existing = loadLessonSnapshot(paths, day);
    if (existing) {
      return resultFromSnapshot(existing, loadProgress(paths).entries);
    }
  }

  const master = loadMaster(paths);
  let progress = loadProgress(paths);
  const snapshotNewWords = collectSnapshotNewWords(paths);
  const newEntries = selectNewWords(master, progress, day, NEW_WORD_COUNT, snapshotNewWords);
  if (newEntries.length < NEW_WORD_COUNT) {
    throw new NewWordsExhaustedError(newEntries.length, master.length);
  }

  const exclude = new Set(newEntries.map((entry) => entry.word));
  const preferredReview = priorCurriculumWords(master, progress, snapshotNewWords);
  const review = selectReviewWords(
    master,
    progress,
    day,
    exclude,
    REVIEW_WORD_COUNT,
    preferredReview,
  );
  const reading = generateMiniReading(day, newEntries, review.words);
  const questions = generateReadingQuestions(day, reading, newEntries, review.words);

  for (const entry of newEntries) {
    progress = markFirstSeen(progress, entry.word, day);
  }
  if (day > progress.last_completed_day) {
    progress = { ...progress, last_completed_day: day };
  }
  if (persist) saveProgress(progress, paths);

  const lesson = buildDailyLesson({
    day,
    newVocabulary: newEntries.map(toStudentCard),
    reviewVocabulary: review.words.map(toStudentCard),
    reviewExercises: buildReviewExercises(review.words, master, day),
    miniReading: reading,
    readingQuestions: questions,
  });
  assertNoChinese(lesson, `Day ${day} student lesson`);

  const result: GenerateLessonResult = {
    lesson,
    parent_reference: buildParentReference(day, newEntries.map(toParentCard)),
    progress: progress.entries,
    locked: persist,
    source: 'generated',
    review_attempt: null,
    reading_attempt: null,
  };
  if (persist) {
    saveLessonSnapshot(paths, {
      lesson: result.lesson,
      parent_reference: result.parent_reference,
      progress: result.progress,
      review_attempt: null,
      reading_attempt: null,
      locked: true,
    });
  }
  return result;
}

export const GENERATE_LESSON_ACTION = 'Generate Oliver Vocabulary Lesson Day XX';
