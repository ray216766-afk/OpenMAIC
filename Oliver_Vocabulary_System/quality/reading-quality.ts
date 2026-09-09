import type { MiniReading, ReadingQuestion, VocabularyEntry } from '../types';

import { contentWords, wordCount, type QualityCheck } from './question-quality';

export const READING_WORD_MIN = 180;
export const READING_WORD_MAX = 220;
export const FEATURED_TARGET_MIN = 5;
export const FEATURED_TARGET_MAX = 8;

const EXAMPLE_DUMP_THRESHOLD = 3;

const DOMAIN_MARKERS = [
  /\b(drawer|locked library|broken compass)\b/i,
  /\b(drought|rainfall|habitat)\b/i,
  /\b(poem|poetry|stanza)\b/i,
  /\b(photosynthesis|chlorophyll)\b/i,
  /\b(organise (?:your )?notes|folder of notes)\b/i,
];

export function featuredTargets(reading: MiniReading): string[] {
  return [...reading.featured_new_words, ...reading.featured_review_words];
}

export function looksLikeConcatenatedExamples(
  passage: string,
  words: VocabularyEntry[],
): { dump: boolean; hits: string[] } {
  const lower = passage.toLowerCase();
  const hits = words
    .map((entry) => entry.example_sentence.replace(/\.+$/, '').trim().toLowerCase())
    .filter((example) => example.length > 20 && lower.includes(example));
  return { dump: hits.length >= EXAMPLE_DUMP_THRESHOLD, hits };
}

export function mixedDomainAntiPattern(passage: string): boolean {
  return DOMAIN_MARKERS.filter((pattern) => pattern.test(passage)).length >= 3;
}

export function passageContainsWord(passage: string, word: string): boolean {
  const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  return pattern.test(passage);
}

/**
 * Remove-the-vocabulary test: if target lemmas were unmarked / replaced with
 * simple stand-ins, does the text still read as one article?
 */
export function removeVocabularyStillCoherent(
  passage: string,
  targets: string[],
  fallbackPassage?: string,
): QualityCheck {
  const errors: string[] = [];
  const source = fallbackPassage ?? passage;
  const stripped = targets.reduce((text, word) => {
    const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    return text.replace(pattern, 'this');
  }, source);
  if (mixedDomainAntiPattern(stripped)) {
    errors.push('After removing target vocabulary the passage still jumps across unrelated domains');
  }
  if (wordCount(stripped) < 140) {
    errors.push('Passage collapses once target vocabulary is removed');
  }
  const sentences = stripped.split(/(?<=[.!?])\s+/).filter((item) => item.trim().length > 0);
  if (sentences.length < 6) {
    errors.push('Passage is too thin to stand as a real story/article without the target words');
  }
  return { ok: errors.length === 0, errors };
}

export function runReadingPassageQa(
  reading: MiniReading,
  candidateWords: VocabularyEntry[],
  fallbackPassage?: string,
): QualityCheck {
  const errors: string[] = [];
  const count = reading.word_count || wordCount(reading.passage);
  if (count < READING_WORD_MIN || count > READING_WORD_MAX) {
    errors.push(`Reading must be ${READING_WORD_MIN}–${READING_WORD_MAX} words (got ${count})`);
  }

  const targets = featuredTargets(reading);
  if (targets.length < FEATURED_TARGET_MIN || targets.length > FEATURED_TARGET_MAX) {
    errors.push(`Reading should weave ${FEATURED_TARGET_MIN}–${FEATURED_TARGET_MAX} naturally fitting targets (got ${targets.length})`);
  }

  for (const word of targets) {
    if (!passageContainsWord(reading.passage, word)) {
      errors.push(`Featured word "${word}" is not actually in the passage`);
    }
  }

  const dump = looksLikeConcatenatedExamples(reading.passage, candidateWords);
  if (dump.dump) {
    errors.push(
      `Passage looks like concatenated example sentences (${dump.hits.length} verbatim examples)`,
    );
  }

  if (mixedDomainAntiPattern(reading.passage)) {
    errors.push('Passage mixes unrelated domains (drawer / drought / poems / photosynthesis stuffing)');
  }

  errors.push(...removeVocabularyStillCoherent(reading.passage, targets, fallbackPassage).errors);
  return { ok: errors.length === 0, errors };
}

function optionSupportedByPassage(option: string, passage: string, minOverlap = 2): boolean {
  const clues = contentWords(option);
  if (clues.length === 0) return false;
  const haystack = contentWords(passage);
  const overlap = clues.filter((word) => haystack.includes(word)).length;
  return overlap >= Math.min(minOverlap, clues.length);
}

export function runReadingQuestionQa(
  questions: ReadingQuestion[],
  reading: MiniReading,
): QualityCheck {
  const errors: string[] = [];
  if (questions.length < 4 || questions.length > 5) {
    errors.push(`Reading should have 4–5 questions (got ${questions.length})`);
  }

  const types = new Set(questions.map((question) => question.type));
  for (const required of ['vocabulary_in_context', 'main_idea', 'inference', 'detail'] as const) {
    if (!types.has(required)) errors.push(`Missing required reading question type: ${required}`);
  }

  const seen = new Set<string>();
  for (const question of questions) {
    if (question.options.length !== 4) {
      errors.push(`${question.id} must have 4 options`);
    }
    if (!question.options.includes(question.answer)) {
      errors.push(`${question.id} answer is not among the options`);
    }
    if (new Set(question.options).size !== question.options.length) {
      errors.push(`${question.id} has duplicate options`);
    }
    if (seen.has(question.prompt)) errors.push(`${question.id} repeats a prompt`);
    seen.add(question.prompt);

    if (question.type === 'vocabulary_in_context') {
      const mentioned = featuredTargets(reading).find((word) =>
        new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(question.prompt),
      );
      if (mentioned && !passageContainsWord(reading.passage, mentioned)) {
        errors.push(`${question.id} asks about "${mentioned}", which is not in the finished passage`);
      }
    }

    if (question.type === 'detail' || question.type === 'cause_effect' || question.type === 'sequence') {
      if (!optionSupportedByPassage(question.answer, reading.passage, 2)) {
        errors.push(`${question.id} correct answer is not supported by the finished passage`);
      }
    }

    if (
      (question.type === 'main_idea' ||
        question.type === 'inference' ||
        question.type === 'authors_purpose') &&
      !optionSupportedByPassage(question.answer, reading.passage, 1)
    ) {
      errors.push(`${question.id} answer is not grounded in the finished passage`);
    }
  }

  return { ok: errors.length === 0, errors };
}
