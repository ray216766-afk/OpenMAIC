/**
 * Normalize Academic Core (and legacy seed) records into the live engine schema.
 * Canonical source: Y5Y6 Academic Vocabulary Master Batch files.
 */

import type { VocabularyEntry, VocabularyLevel, WordFamily } from './types';

export const ACTIVE_BANK = {
  id: 'Academic_Core_Batch_001',
  label: 'Academic Core Batch 1 (100)',
  wordCount: 100,
  expansionTarget: 1500,
  relativePath: 'Y5Y6_Academic_Vocabulary_Master/data/Academic_Core_Batch_001_words_001-100.json',
  defaultReviewSchedule: ['Day 1', 'Day 3', 'Day 7', 'Day 14', 'Day 30'] as const,
} as const;

export function asVocabularyLevel(value: unknown): VocabularyLevel {
  const n = typeof value === 'string' ? Number(value) : Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return 1;
}

export function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function asWordFamily(value: unknown): WordFamily {
  if (Array.isArray(value)) return { related: asStringArray(value) };
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const related = asStringArray(row.related);
    return {
      noun: typeof row.noun === 'string' ? row.noun : undefined,
      verb: typeof row.verb === 'string' ? row.verb : undefined,
      adjective: typeof row.adjective === 'string' ? row.adjective : undefined,
      adverb: typeof row.adverb === 'string' ? row.adverb : undefined,
      plural: typeof row.plural === 'string' ? row.plural : undefined,
      related: related.length > 0 ? related : undefined,
    };
  }
  return {};
}

export function formatWordFamily(family: WordFamily | undefined): string {
  if (!family) return '';
  if (family.related?.length) return family.related.join(', ');
  return Object.entries(family)
    .filter(([key, value]) => key !== 'related' && Boolean(value))
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

export function reviewScheduleOffsets(schedule?: string[]): number[] {
  const labels = schedule?.length ? schedule : [...ACTIVE_BANK.defaultReviewSchedule];
  const offsets = labels
    .map((label) => {
      const match = /Day\s+(\d+)/i.exec(label);
      return match ? Math.max(0, Number(match[1]) - 1) : Number.NaN;
    })
    .filter((value) => Number.isFinite(value));
  return offsets.length > 0 ? offsets : [0, 2, 6, 13, 29];
}

export function normalizeVocabularyEntry(raw: unknown): VocabularyEntry {
  const row = (raw ?? {}) as Record<string, unknown>;
  const word = String(row.word ?? '').trim();
  const simple = String(row.simple_definition ?? row.definition ?? '').trim();
  const detailed = String(row.detailed_definition ?? '').trim();
  const chinese = String(row.chinese_meaning ?? row.chinese ?? '').trim();
  const collocations = asStringArray(row.common_collocations ?? row.collocations);
  const schedule = asStringArray(row.review_schedule);
  const creative = String(row.creative_writing_example ?? '').trim();
  const partOfSpeech = String(row.part_of_speech ?? '').trim();
  const difficulty =
    typeof row.difficulty_score === 'number' && Number.isFinite(row.difficulty_score)
      ? row.difficulty_score
      : undefined;

  return {
    id: String(row.id ?? ''),
    word,
    level: asVocabularyLevel(row.level),
    category: String(row.category ?? 'Academic Core Vocabulary'),
    chinese,
    definition: simple,
    simple_definition: simple,
    detailed_definition: detailed || undefined,
    synonyms: asStringArray(row.synonyms),
    antonyms: asStringArray(row.antonyms),
    word_family: asWordFamily(row.word_family),
    collocations,
    common_collocations: collocations,
    example_sentence: String(row.example_sentence ?? '').trim(),
    creative_writing_example: creative || undefined,
    part_of_speech: partOfSpeech || undefined,
    difficulty_score: difficulty,
    review_schedule: schedule.length > 0 ? schedule : [...ACTIVE_BANK.defaultReviewSchedule],
    edutest_frequency: typeof row.edutest_frequency === 'number' ? row.edutest_frequency : 8,
    writing_value: String(row.writing_value ?? 'Academic Core — improves precise academic expression'),
    source_schema:
      typeof row.source_schema === 'string'
        ? row.source_schema
        : 'Y5Y6_Academic_Vocabulary_Master_V1',
  };
}

export function extractRawWords(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { words?: unknown }).words)) {
    return (parsed as { words: unknown[] }).words;
  }
  return [];
}

export function normalizeMasterWords(parsed: unknown): VocabularyEntry[] {
  const words = extractRawWords(parsed)
    .map(normalizeVocabularyEntry)
    .filter((entry) => entry.id && entry.word && entry.definition);
  const seen = new Set<string>();
  return words.filter((entry) => {
    const key = entry.word.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
