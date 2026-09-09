import { buildReviewExercises, selectReviewWords } from '../Review_Engine';
import { generateMiniReading, generateReadingQuestions } from '../Mini_Reading_Generator';
import { buildDailyLesson, buildParentReference } from '../Lesson_Template';
import { assertNoChinese, toParentCard, toStudentCard } from '../student-view';
import {
  defaultEnginePaths,
  loadMaster,
  loadProgress,
  markFirstSeen,
  saveLessonSnapshot,
  saveProgress,
} from '../store';
import type {
  GenerateLessonResult,
  VocabularyEnginePaths,
  VocabularyEntry,
  VocabularyProgressFile,
} from '../types';

const NEW_WORD_COUNT = 10;
const REVIEW_WORD_COUNT = 15;

function curriculumOrder(master: VocabularyEntry[]): VocabularyEntry[] {
  return [...master].sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    return a.id.localeCompare(b.id);
  });
}

export function curriculumSlice(
  master: VocabularyEntry[],
  day: number,
  count = NEW_WORD_COUNT,
): VocabularyEntry[] {
  const ordered = curriculumOrder(master);
  const start = ((Math.max(1, day) - 1) * count) % ordered.length;
  const window: VocabularyEntry[] = [];
  for (let i = 0; i < ordered.length && window.length < count; i += 1) {
    const entry = ordered[(start + i) % ordered.length];
    if (!window.some((item) => item.word === entry.word)) window.push(entry);
  }
  return window;
}

/**
 * Day N is a stable curriculum slot: words (N-1)*10 .. N*10-1 in level then id order.
 * Academic Core Batch 1 therefore starts Day 1 on VAC0001–VAC0010 (analyse, significant, …).
 * Generating the same day always yields the same ten new words.
 */
export function selectNewWords(
  master: VocabularyEntry[],
  _progress: VocabularyProgressFile,
  day: number,
  count = NEW_WORD_COUNT,
): VocabularyEntry[] {
  return curriculumSlice(master, day, count);
}

export function priorCurriculumWords(
  master: VocabularyEntry[],
  day: number,
  count = NEW_WORD_COUNT,
): VocabularyEntry[] {
  if (day <= 1) return [];
  const seen = new Set<string>();
  const prior: VocabularyEntry[] = [];
  for (let priorDay = 1; priorDay < day; priorDay += 1) {
    for (const entry of curriculumSlice(master, priorDay, count)) {
      const key = entry.word.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      prior.push(entry);
    }
  }
  return prior;
}

export function generateOliverVocabularyLessonDay(
  day: number,
  paths: VocabularyEnginePaths = defaultEnginePaths(),
  options: { persist?: boolean } = {},
): GenerateLessonResult {
  if (!Number.isInteger(day) || day < 1) {
    throw new Error('Day must be an integer >= 1');
  }

  const persist = options.persist ?? true;
  const master = loadMaster(paths);
  let progress = loadProgress(paths);
  const newEntries = selectNewWords(master, progress, day);
  if (newEntries.length < NEW_WORD_COUNT) {
    throw new Error(`Need at least ${NEW_WORD_COUNT} vocabulary entries to build a daily lesson`);
  }

  const exclude = new Set(newEntries.map((entry) => entry.word));
  const preferredReview = priorCurriculumWords(master, day);
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

  const result = {
    lesson,
    parent_reference: buildParentReference(day, newEntries.map(toParentCard)),
    progress: progress.entries,
  };
  if (persist) {
    // Pin the shown exercises so Mark review cannot re-roll after progress updates.
    saveLessonSnapshot(paths, { ...result, review_attempt: null });
  }
  return result;
}

export const GENERATE_LESSON_ACTION = 'Generate Oliver Vocabulary Lesson Day XX';
