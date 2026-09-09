import { describe, expect, it } from 'vitest';

import { loadMaster } from '../../Oliver_Vocabulary_System/store';
import {
  NEVER_ANTONYM_WORDS,
  hasClearAntonym,
  suitableQuestionTypes,
  validateReviewExercise,
  validateUniqueAnswer,
} from '../../Oliver_Vocabulary_System/quality';
import { buildReviewExercises } from '../../Oliver_Vocabulary_System/Review_Engine';
import type { ReviewExercise, VocabularyEntry } from '../../Oliver_Vocabulary_System/types';

function entry(word: string): VocabularyEntry {
  const found = loadMaster().find((item) => item.word === word);
  if (!found) throw new Error(`Missing ${word}`);
  return found;
}

describe('Question-type suitability', () => {
  it('never forces antonyms for environment, perspective, evidence, method, process', () => {
    for (const word of ['environment', 'perspective', 'evidence', 'method', 'process']) {
      const item = entry(word);
      expect(NEVER_ANTONYM_WORDS.has(word)).toBe(true);
      expect(hasClearAntonym(item)).toBe(false);
      expect(suitableQuestionTypes(item)).not.toContain('antonym_selection');
    }
  });

  it('allows a clear antonym pair such as scarce → abundant', () => {
    const scarce = entry('scarce');
    expect(hasClearAntonym(scarce)).toBe(true);
    expect(suitableQuestionTypes(scarce)).toContain('antonym_selection');
    expect(scarce.antonyms[0]).toMatch(/abundant|plentiful/i);
  });

  it('does not emit antonym items for unsuitable review words', () => {
    const master = loadMaster();
    const unsuitable = ['environment', 'perspective', 'evidence', 'method', 'process'].map(entry);
    const extra = master.filter((item) => !unsuitable.some((row) => row.word === item.word)).slice(0, 10);
    const exercises = buildReviewExercises([...unsuitable, ...extra], master, 1);
    for (const word of ['environment', 'perspective', 'evidence', 'method', 'process']) {
      const item = exercises.find((exercise) => exercise.word === word);
      expect(item, word).toBeTruthy();
      expect(item?.type).not.toBe('antonym_selection');
    }
  });
});

describe('none-of-these is not a default escape', () => {
  it('never uses none of these as an answer or option on generated review items', () => {
    const master = loadMaster();
    const review = master.slice(0, 15);
    const exercises = buildReviewExercises(review, master, 2);
    expect(exercises).toHaveLength(15);
    for (const exercise of exercises) {
      expect(exercise.answer.toLowerCase()).not.toMatch(/none of these|none of the above/);
      expect(exercise.options?.some((option) => /none of these|none of the above/i.test(option))).toBe(
        false,
      );
    }
  });
});

describe('Unique answer and sentence-completion context', () => {
  it('rejects a vague stem where evaluate and determine are both defensible', () => {
    const evaluate = entry('evaluate');
    const master = loadMaster();
    const ambiguous: ReviewExercise = {
      id: 'REV000-x',
      type: 'sentence_completion',
      word: 'evaluate',
      prompt: 'After the debate, we ______.',
      options: ['evaluate', 'determine', 'organise', 'scarce'],
      answer: 'evaluate',
    };
    const unique = validateUniqueAnswer(ambiguous, evaluate, master);
    const full = validateReviewExercise(ambiguous, evaluate, master);
    expect(unique.ok).toBe(false);
    expect(full.ok).toBe(false);
    expect(unique.errors.join(' ')).toMatch(/ambiguous|context|defend/i);
  });

  it('accepts a contextual evaluate stem that a teacher could keep', () => {
    const evaluate = entry('evaluate');
    const master = loadMaster();
    const clear: ReviewExercise = {
      id: 'REV000-y',
      type: 'sentence_completion',
      word: 'evaluate',
      prompt:
        'After the debate, we ______ which arguments were supported by strong evidence using clear criteria.',
      options: ['evaluate', 'organise', 'demonstrate', 'summarise'],
      answer: 'evaluate',
    };
    expect(validateReviewExercise(clear, evaluate, master).ok).toBe(true);
  });

  it('builds sentence-completion or cloze items that keep clues after the blank', () => {
    const master = loadMaster();
    const evaluate = entry('evaluate');
    const exercises = buildReviewExercises(
      [evaluate, ...master.filter((item) => item.word !== 'evaluate').slice(0, 14)],
      master,
      4,
    );
    const completion = exercises.find(
      (exercise) =>
        exercise.word === 'evaluate' &&
        (exercise.type === 'sentence_completion' || exercise.type === 'fill_in_the_blank'),
    );
    if (completion) {
      const afterBlank = completion.prompt.split('______')[1] ?? '';
      expect(completion.prompt).toContain('______');
      expect(afterBlank.trim().length).toBeGreaterThan(10);
    }
  });
});
