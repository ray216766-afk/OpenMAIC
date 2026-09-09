import { reviewScheduleOffsets } from '../normalize';
import { firstSeenDayNumber, getProgressEntry } from '../store';
import type {
  ProgressEntry,
  ReviewExercise,
  ReviewExerciseType,
  VocabularyEntry,
  VocabularyProgressFile,
} from '../types';

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

function otherWords(
  master: VocabularyEntry[],
  word: string,
  field: 'synonyms' | 'definition',
): string[] {
  return master
    .filter((entry) => entry.word !== word)
    .map((entry) => (field === 'synonyms' ? entry.synonyms[0] : entry.definition))
    .filter((value): value is string => Boolean(value));
}

function shuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  let state = seed || 1;
  for (let i = next.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function uniqueOptions(correct: string, distractors: string[], seed: number, size = 4): string[] {
  const pool = [correct, ...distractors.filter((item) => item && item !== correct)];
  const picked = shuffle([...new Set(pool)], seed).slice(0, size);
  if (!picked.includes(correct)) {
    picked[picked.length - 1] = correct;
  }
  return shuffle(picked, seed + 7);
}

function blankExample(entry: VocabularyEntry): string {
  const pattern = new RegExp(`\\b${entry.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  if (pattern.test(entry.example_sentence)) {
    return entry.example_sentence.replace(pattern, '______');
  }
  return `The scholarship candidate remained ______ even when the question was difficult.`.replace(
    '______',
    '______',
  );
}

export function buildReviewExercises(
  reviewWords: VocabularyEntry[],
  master: VocabularyEntry[],
  day: number,
): ReviewExercise[] {
  const types: ReviewExerciseType[] = [
    'meaning_matching',
    'synonym_selection',
    'antonym_selection',
    'fill_in_the_blank',
    'sentence_completion',
  ];

  return reviewWords.map((entry, index) => {
    const type = types[index % types.length];
    const seed = day * 100 + index;
    if (type === 'meaning_matching') {
      return {
        id: `REV${String(day).padStart(3, '0')}-${index + 1}`,
        type,
        word: entry.word,
        prompt: `Which definition matches "${entry.word}"?`,
        options: uniqueOptions(
          entry.definition,
          otherWords(master, entry.word, 'definition'),
          seed,
        ),
        answer: entry.definition,
      };
    }
    if (type === 'synonym_selection') {
      const answer = entry.synonyms[0] ?? entry.definition;
      const distractors = master
        .filter((item) => item.word !== entry.word)
        .flatMap((item) => item.synonyms.slice(0, 1));
      return {
        id: `REV${String(day).padStart(3, '0')}-${index + 1}`,
        type,
        word: entry.word,
        prompt: `Choose the best synonym for "${entry.word}".`,
        options: uniqueOptions(answer, distractors, seed),
        answer,
      };
    }
    if (type === 'antonym_selection') {
      const answer = entry.antonyms[0] ?? 'none of these';
      const distractors = master
        .filter((item) => item.word !== entry.word)
        .flatMap((item) => item.antonyms.slice(0, 1));
      return {
        id: `REV${String(day).padStart(3, '0')}-${index + 1}`,
        type,
        word: entry.word,
        prompt: `Choose the best antonym for "${entry.word}".`,
        options: uniqueOptions(answer, distractors, seed),
        answer,
      };
    }
    if (type === 'fill_in_the_blank') {
      const distractors = master
        .filter((item) => item.word !== entry.word)
        .map((item) => item.word);
      return {
        id: `REV${String(day).padStart(3, '0')}-${index + 1}`,
        type,
        word: entry.word,
        prompt: blankExample(entry),
        options: uniqueOptions(entry.word, distractors, seed),
        answer: entry.word,
        hint: 'Use the exact target word.',
      };
    }
    const stem = entry.example_sentence.includes(entry.word)
      ? entry.example_sentence.split(new RegExp(`\\b${entry.word}\\b`, 'i'))[0].trim()
      : `After thinking carefully, Oliver decided that the most accurate word was`;
    return {
      id: `REV${String(day).padStart(3, '0')}-${index + 1}`,
      type: 'sentence_completion',
      word: entry.word,
      prompt: `${stem} ______`,
      options: uniqueOptions(
        entry.word,
        master.filter((item) => item.word !== entry.word).map((item) => item.word),
        seed,
      ),
      answer: entry.word,
    };
  });
}

export { answersMatch, gradeReviewAnswers, reviewAttemptFingerprint } from './grade';
export { markReviewQuiz, quizFromFrozenAttempt } from './mark';
