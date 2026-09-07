import type { ParentVocabularyCard, StudentVocabularyCard, VocabularyEntry } from './types';

const CHINESE_CHAR = /[\u3400-\u9fff]/;

export function toStudentCard(entry: VocabularyEntry): StudentVocabularyCard {
  const definition = entry.simple_definition || entry.definition;
  const collocations = entry.common_collocations?.length
    ? entry.common_collocations
    : entry.collocations;
  return {
    id: entry.id,
    word: entry.word,
    level: entry.level,
    category: entry.category,
    definition,
    simple_definition: definition,
    synonyms: entry.synonyms,
    antonyms: entry.antonyms,
    word_family: entry.word_family,
    collocations,
    common_collocations: collocations,
    example_sentence: entry.example_sentence,
    creative_writing_example: entry.creative_writing_example,
    part_of_speech: entry.part_of_speech,
    difficulty_score: entry.difficulty_score,
    review_schedule: entry.review_schedule,
    edutest_frequency: entry.edutest_frequency,
    writing_value: entry.writing_value,
  };
}

export function toParentCard(entry: VocabularyEntry): ParentVocabularyCard {
  return {
    ...toStudentCard(entry),
    chinese: entry.chinese,
    detailed_definition: entry.detailed_definition,
  };
}

export function assertNoChinese(value: unknown, label = 'student payload'): void {
  const text = JSON.stringify(value);
  if (CHINESE_CHAR.test(text)) {
    throw new Error(`${label} must be English only; Chinese leaked into student content`);
  }
}

export function containsChinese(value: unknown): boolean {
  return CHINESE_CHAR.test(JSON.stringify(value));
}
