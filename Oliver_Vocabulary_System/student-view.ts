import type { ParentVocabularyCard, StudentVocabularyCard, VocabularyEntry } from './types';

const CHINESE_CHAR = /[\u3400-\u9fff]/;

export function toStudentCard(entry: VocabularyEntry): StudentVocabularyCard {
  return {
    id: entry.id,
    word: entry.word,
    level: entry.level,
    category: entry.category,
    definition: entry.definition,
    synonyms: entry.synonyms,
    antonyms: entry.antonyms,
    word_family: entry.word_family,
    collocations: entry.collocations,
    example_sentence: entry.example_sentence,
    edutest_frequency: entry.edutest_frequency,
    writing_value: entry.writing_value,
  };
}

export function toParentCard(entry: VocabularyEntry): ParentVocabularyCard {
  return {
    ...toStudentCard(entry),
    chinese: entry.chinese,
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
