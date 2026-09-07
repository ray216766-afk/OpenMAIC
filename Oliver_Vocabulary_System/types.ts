/**
 * Oliver Scholarship Vocabulary Master System — V1.1 (Academic Core Batch 1)
 * Shared contracts for the reusable vocabulary learning engine.
 *
 * Student-facing content is English only. The `chinese` field exists solely
 * for parent reference and must never appear in student lesson payloads.
 */

export const MODULE_NAME = 'Oliver Scholarship Vocabulary Master System';
export const MODULE_VERSION = 'V1.1';

/** Live Academic Core uses levels 1–3. 4–5 remain only for the archived V1.0 seed. */
export const VOCABULARY_LEVELS = {
  1: 'Essential Y5–Y6',
  2: 'High Achievement',
  3: 'Scholarship Stretch',
  4: 'Academic Scholarship Vocabulary (archive)',
  5: 'High-Level Scholarship Vocabulary (archive)',
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
  /** Academic Core stores morphology as a related-forms list. */
  related?: string[];
}

export interface VocabularyEntry {
  id: string;
  word: string;
  level: VocabularyLevel;
  category: string;
  /** Parent-only reference. Never send to student views. */
  chinese: string;
  /** Student-facing simple definition (from `simple_definition`). */
  definition: string;
  simple_definition: string;
  detailed_definition?: string;
  synonyms: string[];
  antonyms: string[];
  word_family: WordFamily;
  collocations: string[];
  common_collocations: string[];
  example_sentence: string;
  creative_writing_example?: string;
  part_of_speech?: string;
  difficulty_score?: number;
  review_schedule: string[];
  edutest_frequency: number;
  writing_value: string;
  source_schema?: string;
}

export interface StudentVocabularyCard {
  id: string;
  word: string;
  level: VocabularyLevel;
  category: string;
  definition: string;
  simple_definition: string;
  synonyms: string[];
  antonyms: string[];
  word_family: WordFamily;
  collocations: string[];
  common_collocations: string[];
  example_sentence: string;
  creative_writing_example?: string;
  part_of_speech?: string;
  difficulty_score?: number;
  review_schedule: string[];
  edutest_frequency: number;
  writing_value: string;
}

export interface ParentVocabularyCard extends StudentVocabularyCard {
  chinese: string;
  detailed_definition?: string;
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
  /** Live bank id, e.g. Academic_Core_Batch_001. */
  active_bank?: string;
  /** Human note when progress is wiped for a bank switch. */
  progress_note?: string;
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
