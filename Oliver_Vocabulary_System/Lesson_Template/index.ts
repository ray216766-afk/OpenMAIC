import { MODULE_NAME, MODULE_VERSION } from '../types';
import type {
  DailyLesson,
  MiniReading,
  ParentLessonReference,
  ReadingQuestion,
  ReviewExercise,
  StudentVocabularyCard,
} from '../types';

export const STUDENT_NEW_WORD_FIELDS = [
  'Word',
  'Definition',
  'Synonyms',
  'Antonyms',
  'Word Family',
  'Common Collocations',
  'Example Sentence',
] as const;

export function buildLessonTitle(day: number): string {
  return `Oliver Vocabulary Lesson Day ${day}`;
}

export function buildDailyLesson(input: {
  day: number;
  newVocabulary: StudentVocabularyCard[];
  reviewVocabulary: StudentVocabularyCard[];
  reviewExercises: ReviewExercise[];
  miniReading: MiniReading;
  readingQuestions: ReadingQuestion[];
}): DailyLesson {
  return {
    module: MODULE_NAME,
    version: MODULE_VERSION,
    day: input.day,
    title: buildLessonTitle(input.day),
    generated_at: new Date().toISOString(),
    new_vocabulary: input.newVocabulary,
    review_vocabulary: input.reviewVocabulary,
    review_exercises: input.reviewExercises,
    mini_reading: input.miniReading,
    reading_questions: input.readingQuestions,
  };
}

export function buildParentReference(
  day: number,
  words: ParentLessonReference['words'],
): ParentLessonReference {
  return { day, words };
}

export function renderStudentMarkdown(lesson: DailyLesson): string {
  const family = (card: StudentVocabularyCard) =>
    Object.entries(card.word_family)
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ');

  const newBlock = lesson.new_vocabulary
    .map((card, index) => {
      return [
        `### ${index + 1}. ${card.word}`,
        `- Definition: ${card.definition}`,
        `- Synonyms: ${card.synonyms.join(', ')}`,
        `- Antonyms: ${card.antonyms.join(', ')}`,
        `- Word Family: ${family(card) || '—'}`,
        `- Common Collocations: ${card.collocations.join('; ')}`,
        `- Example Sentence: ${card.example_sentence}`,
      ].join('\n');
    })
    .join('\n\n');

  const reviewBlock = lesson.review_exercises
    .map((exercise, index) => {
      const options = exercise.options
        ?.map((option, i) => `   ${String.fromCharCode(65 + i)}. ${option}`)
        .join('\n');
      return `${index + 1}. (${exercise.type.replaceAll('_', ' ')}) ${exercise.prompt}${options ? `\n${options}` : ''}`;
    })
    .join('\n\n');

  const questions = lesson.reading_questions
    .map((question, index) => {
      const options = question.options
        .map((option, i) => `   ${String.fromCharCode(65 + i)}. ${option}`)
        .join('\n');
      return `${index + 1}. [${question.type.replaceAll('_', ' ')}] ${question.prompt}\n${options}`;
    })
    .join('\n\n');

  return [
    `# ${lesson.title}`,
    `${MODULE_NAME} — ${MODULE_VERSION}`,
    '',
    'Student view — English only.',
    '',
    '## Section 1: New Vocabulary',
    newBlock,
    '',
    '## Section 2: Review Vocabulary',
    reviewBlock,
    '',
    `## Section 3: Mini Reading — ${lesson.mini_reading.title}`,
    `Theme: ${lesson.mini_reading.theme.replaceAll('_', ' ')} · ${lesson.mini_reading.word_count} words`,
    '',
    lesson.mini_reading.passage,
    '',
    '## Section 4: Reading Questions',
    questions,
  ].join('\n');
}
