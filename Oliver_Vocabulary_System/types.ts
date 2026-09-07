/**
 * Oliver Scholarship Vocabulary Master System — V1.0
 * Shared contracts for the reusable vocabulary learning engine.
 *
 * Student-facing content is English only. The `chinese` field exists solely
 * for parent reference and must never appear in student lesson payloads.
 */

export const MODULE_NAME = 'Oliver Scholarship Vocabulary Master System';
export const MODULE_VERSION = 'V1.0';

export const VOCABULARY_LEVELS = {
  1: 'Core Upgrade Vocabulary',
  2: 'Character & Emotion Vocabulary',
  3: 'Advanced Reading Vocabulary',
  4: 'Academic Scholarship Vocabulary',
  5: 'High-Level Scholarship Vocabulary',
} as const;

export type VocabularyLevel = 1 | 2 | 3 | 4 | 5;

export type MasteryLevel = 'New' | 'Learning' | 'Developing' | 'Mastered';

/** Legacy / display alias. Always persist and compare as Mastered. */
export const MASTERY_ALIASES: Record<string, MasteryLevel> = {
  New: 'New',
  Learning: 'Learning',
  Developing: 'Developing',
  Mastered: 'Mastered',
  Strong: 'Mastered',
};

export interface WordFamily {
  noun?: string;
  verb?: string;
  adjective?: string;
  adverb?: string;
  plural?: string;
}

export interface VocabularyEntry {
  id: string;
  word: string;
  level: VocabularyLevel;
  category: string;
  /** Parent-only reference. Never send to student views. */
  chinese: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  word_family: WordFamily;
  collocations: string[];
  example_sentence: string;
  edutest_frequency: number;
  writing_value: string;
}

export interface StudentVocabularyCard {
  id: string;
  word: string;
  level: VocabularyLevel;
  category: string;
  definition: string;
  synonyms: string[];
  antonyms: string[];
  word_family: WordFamily;
  collocations: string[];
  example_sentence: string;
  edutest_frequency: number;
  writing_value: string;
}

export interface ParentVocabularyCard extends StudentVocabularyCard {
  chinese: string;
}

export interface ProgressEntry {
  word: string;
  first_seen: string;
  review_count: number;
  correct_rate: number;
  mastery: MasteryLevel;
  /** Internal scheduling fields — not part of the student-facing schema. */
  last_reviewed_day?: number;
  incorrect_count?: number;
  correct_count?: number;
  next_review_day?: number;
}

export interface VocabularyProgressFile {
  student: string;
  module: string;
  version: string;
  updated_at: string | null;
  last_completed_day: number;
  entries: ProgressEntry[];
}

export type ReviewExerciseType =
  | 'meaning_matching'
  | 'synonym_selection'
  | 'antonym_selection'
  | 'fill_in_the_blank'
  | 'sentence_completion';

export interface ReviewExercise {
  id: string;
  type: ReviewExerciseType;
  word: string;
  prompt: string;
  options?: string[];
  answer: string;
  /** English-only hint; never includes Chinese. */
  hint?: string;
}

export type ReadingTheme =
  | 'adventure'
  | 'mystery'
  | 'science'
  | 'history'
  | 'character_challenge'
  | 'real_world';

export interface MiniReading {
  title: string;
  theme: ReadingTheme;
  passage: string;
  word_count: number;
  featured_new_words: string[];
  featured_review_words: string[];
}

export type ReadingQuestionType = 'vocabulary_in_context' | 'main_idea' | 'inference' | 'detail';

export interface ReadingQuestion {
  id: string;
  type: ReadingQuestionType;
  prompt: string;
  options: string[];
  answer: string;
}

export interface DailyLesson {
  module: typeof MODULE_NAME;
  version: typeof MODULE_VERSION;
  day: number;
  title: string;
  generated_at: string;
  new_vocabulary: StudentVocabularyCard[];
  review_vocabulary: StudentVocabularyCard[];
  review_exercises: ReviewExercise[];
  mini_reading: MiniReading;
  reading_questions: ReadingQuestion[];
}

export interface ParentLessonReference {
  day: number;
  words: ParentVocabularyCard[];
}

export interface GenerateLessonResult {
  lesson: DailyLesson;
  parent_reference: ParentLessonReference;
  progress: ProgressEntry[];
}

export interface QuizAnswer {
  exerciseId: string;
  answer: string;
}

export interface QuizResult {
  day: number;
  total: number;
  correct: number;
  correct_rate: number;
  results: Array<{
    exerciseId: string;
    word: string;
    type: ReviewExerciseType;
    expected: string;
    given: string;
    correct: boolean;
  }>;
  progress: ProgressEntry[];
}

/**
 * V2 Writing Module — extension hook only. Do not implement writing generation here.
 * Future writers should consume a completed DailyLesson plus progress.
 */
export interface WritingModuleHook {
  readonly module: 'writing-v2';
  fromLesson(lesson: DailyLesson): never;
}

/**
 * V3 Book Integration — extension hook only.
 * Planned titles: Hatchet, Nevermoor, Wonder.
 */
export interface BookIntegrationHook {
  readonly module: 'book-v3';
  readonly plannedTitles: readonly ['Hatchet', 'Nevermoor', 'Wonder'];
  attachBookVocabulary(_title: string, _entries: VocabularyEntry[]): never;
}

export interface VocabularyEnginePaths {
  masterPath: string;
  progressPath: string;
}
