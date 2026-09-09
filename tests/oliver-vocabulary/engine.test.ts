import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { generateOliverVocabularyLessonDay } from '../../Oliver_Vocabulary_System/Daily_Lesson_Generator';
import { renderStudentMarkdown } from '../../Oliver_Vocabulary_System/Lesson_Template';
import { ACTIVE_BANK } from '../../Oliver_Vocabulary_System/normalize';
import { containsChinese } from '../../Oliver_Vocabulary_System/student-view';
import {
  applyReviewOutcome,
  deriveMastery,
  emptyProgressFile,
  loadMaster,
  normalizeMastery,
  saveProgress,
} from '../../Oliver_Vocabulary_System/store';
import type { VocabularyEnginePaths } from '../../Oliver_Vocabulary_System/types';

function isolatedPaths(): VocabularyEnginePaths {
  const dir = mkdtempSync(join(tmpdir(), 'oliver-vocab-'));
  const master = loadMaster();
  const masterPath = join(dir, 'Vocabulary_Master.json');
  const progressPath = join(dir, 'Vocabulary_Progress.json');
  writeFileSync(masterPath, JSON.stringify({ words: master }), 'utf8');
  saveProgress(emptyProgressFile(), { masterPath, progressPath });
  return { masterPath, progressPath };
}

describe('Oliver Scholarship Vocabulary Master V1.1 — Academic Core Batch 1', () => {
  it('loads Academic Core Batch 1 as the live 100-word bank', () => {
    const master = loadMaster();
    const levels = new Set(master.map((entry) => entry.level));
    expect(master.length).toBe(ACTIVE_BANK.wordCount);
    expect(master.length).toBe(100);
    expect(levels).toEqual(new Set([1, 2, 3]));
    expect(master.every((entry) => entry.id.startsWith('VAC'))).toBe(true);
    expect(
      master.every(
        (entry) =>
          entry.chinese &&
          entry.simple_definition &&
          entry.example_sentence &&
          entry.review_schedule.length > 0,
      ),
    ).toBe(true);
    expect(master.slice(0, 3).map((entry) => entry.word)).toEqual([
      'analyse',
      'significant',
      'environment',
    ]);
  });

  it('generates Day 1 from Academic Core (analyse, significant, environment)', () => {
    const result = generateOliverVocabularyLessonDay(1, isolatedPaths(), { persist: false });
    const newWords = result.lesson.new_vocabulary.map((card) => card.word);
    expect(newWords).toEqual(expect.arrayContaining(['analyse', 'significant', 'environment']));
    expect(newWords[0]).toBe('analyse');
    expect(result.lesson.new_vocabulary[0].part_of_speech).toBe('verb');
    expect(result.lesson.new_vocabulary[0].creative_writing_example).toMatch(/analysed/i);
    expect(result.lesson.new_vocabulary[0]).not.toHaveProperty('chinese');
    expect(result.parent_reference.words[0].chinese).toBe('分析');
    expect(result.parent_reference.words[0].detailed_definition).toMatch(/examine/i);
  });

  it('generates Day 25 with the required lesson sections', () => {
    const result = generateOliverVocabularyLessonDay(25, isolatedPaths(), { persist: true });
    expect(result.lesson.title).toBe('Oliver Vocabulary Lesson Day 25');
    expect(result.lesson.new_vocabulary).toHaveLength(10);
    expect(result.lesson.review_vocabulary).toHaveLength(15);
    expect(result.lesson.review_exercises).toHaveLength(15);
    expect(result.lesson.reading_questions.length).toBeGreaterThanOrEqual(4);
    expect(result.lesson.reading_questions.length).toBeLessThanOrEqual(5);
    expect(result.lesson.mini_reading.word_count).toBeGreaterThanOrEqual(180);
    expect(result.lesson.mini_reading.word_count).toBeLessThanOrEqual(220);
    expect(result.lesson.mini_reading.featured_new_words.length).toBeGreaterThanOrEqual(5);
    const featured =
      result.lesson.mini_reading.featured_new_words.length +
      result.lesson.mini_reading.featured_review_words.length;
    expect(featured).toBeLessThanOrEqual(8);
    expect(result.parent_reference.words).toHaveLength(10);
    expect(result.parent_reference.words.every((word) => word.chinese)).toBe(true);
  });

  it('keeps the student lesson English-only', () => {
    const result = generateOliverVocabularyLessonDay(1, isolatedPaths(), { persist: false });
    expect(containsChinese(result.lesson)).toBe(false);
    expect(containsChinese(renderStudentMarkdown(result.lesson))).toBe(false);
    expect(result.lesson.new_vocabulary[0]).not.toHaveProperty('chinese');
  });

  it('uses unused curriculum-order words and tracks first seen', () => {
    const paths = isolatedPaths();
    const first = generateOliverVocabularyLessonDay(3, paths, { persist: true });
    const second = generateOliverVocabularyLessonDay(3, paths, { persist: true });
    expect(first.lesson.new_vocabulary.map((card) => card.word)).toEqual(
      second.lesson.new_vocabulary.map((card) => card.word),
    );
    expect(first.lesson.new_vocabulary[0].word).toBe('analyse');
    expect(first.progress.some((entry) => entry.first_seen === 'Day 3')).toBe(true);
    expect(first.progress.some((entry) => entry.presented_as_new)).toBe(true);
    expect(second.source).toBe('snapshot');
    expect(second.locked).toBe(true);
  });

  it('maps Strong to Mastered and updates quiz outcomes', () => {
    expect(normalizeMastery('Strong')).toBe('Mastered');
    expect(deriveMastery({ review_count: 0, correct_rate: 0 })).toBe('New');
    expect(deriveMastery({ review_count: 2, correct_rate: 50 })).toBe('Learning');
    expect(deriveMastery({ review_count: 3, correct_rate: 70 })).toBe('Developing');
    expect(deriveMastery({ review_count: 5, correct_rate: 90 })).toBe('Mastered');

    const paths = isolatedPaths();
    let progress = emptyProgressFile();
    progress = applyReviewOutcome(progress, 'analyse', 2, true);
    progress = applyReviewOutcome(progress, 'analyse', 3, true);
    progress = applyReviewOutcome(progress, 'analyse', 4, true);
    progress = applyReviewOutcome(progress, 'analyse', 5, true);
    progress = applyReviewOutcome(progress, 'analyse', 6, true);
    saveProgress(progress, paths);
    const analysed = progress.entries.find((entry) => entry.word === 'analyse');
    expect(analysed?.mastery).toBe('Mastered');
    expect(analysed?.correct_rate).toBe(100);
  });
});
