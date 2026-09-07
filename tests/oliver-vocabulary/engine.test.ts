import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { generateOliverVocabularyLessonDay } from '../../Oliver_Vocabulary_System/Daily_Lesson_Generator';
import { renderStudentMarkdown } from '../../Oliver_Vocabulary_System/Lesson_Template';
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

describe('Oliver Scholarship Vocabulary Master V1.0', () => {
  it('seeds at least 200 words across all five levels', () => {
    const master = loadMaster();
    const levels = new Set(master.map((entry) => entry.level));
    expect(master.length).toBeGreaterThanOrEqual(200);
    expect(levels).toEqual(new Set([1, 2, 3, 4, 5]));
    expect(
      master.every((entry) => entry.chinese && entry.definition && entry.example_sentence),
    ).toBe(true);
  });

  it('generates Day 25 with the required lesson sections', () => {
    const result = generateOliverVocabularyLessonDay(25, isolatedPaths(), { persist: true });
    expect(result.lesson.title).toBe('Oliver Vocabulary Lesson Day 25');
    expect(result.lesson.new_vocabulary).toHaveLength(10);
    expect(result.lesson.review_vocabulary).toHaveLength(15);
    expect(result.lesson.review_exercises).toHaveLength(15);
    expect(result.lesson.reading_questions.length).toBeGreaterThanOrEqual(3);
    expect(result.lesson.reading_questions.length).toBeLessThanOrEqual(5);
    expect(result.lesson.mini_reading.word_count).toBeGreaterThanOrEqual(150);
    expect(result.lesson.mini_reading.word_count).toBeLessThanOrEqual(200);
    expect(result.lesson.mini_reading.featured_new_words.length).toBeGreaterThanOrEqual(5);
    expect(result.parent_reference.words).toHaveLength(10);
    expect(result.parent_reference.words.every((word) => word.chinese)).toBe(true);
  });

  it('keeps the student lesson English-only', () => {
    const result = generateOliverVocabularyLessonDay(1, isolatedPaths(), { persist: false });
    expect(containsChinese(result.lesson)).toBe(false);
    expect(containsChinese(renderStudentMarkdown(result.lesson))).toBe(false);
    expect(result.lesson.new_vocabulary[0]).not.toHaveProperty('chinese');
  });

  it('uses a stable Day N curriculum and tracks first seen', () => {
    const paths = isolatedPaths();
    const first = generateOliverVocabularyLessonDay(3, paths, { persist: true });
    const second = generateOliverVocabularyLessonDay(3, paths, { persist: true });
    expect(first.lesson.new_vocabulary.map((card) => card.word)).toEqual(
      second.lesson.new_vocabulary.map((card) => card.word),
    );
    expect(first.progress.some((entry) => entry.first_seen === 'Day 3')).toBe(true);
  });

  it('maps Strong to Mastered and updates quiz outcomes', () => {
    expect(normalizeMastery('Strong')).toBe('Mastered');
    expect(deriveMastery({ review_count: 0, correct_rate: 0 })).toBe('New');
    expect(deriveMastery({ review_count: 2, correct_rate: 50 })).toBe('Learning');
    expect(deriveMastery({ review_count: 3, correct_rate: 70 })).toBe('Developing');
    expect(deriveMastery({ review_count: 5, correct_rate: 90 })).toBe('Mastered');

    const paths = isolatedPaths();
    let progress = emptyProgressFile();
    progress = applyReviewOutcome(progress, 'reluctant', 2, true);
    progress = applyReviewOutcome(progress, 'reluctant', 3, true);
    progress = applyReviewOutcome(progress, 'reluctant', 4, true);
    progress = applyReviewOutcome(progress, 'reluctant', 5, true);
    progress = applyReviewOutcome(progress, 'reluctant', 6, true);
    saveProgress(progress, paths);
    const reluctant = progress.entries.find((entry) => entry.word === 'reluctant');
    expect(reluctant?.mastery).toBe('Mastered');
    expect(reluctant?.correct_rate).toBe(100);
  });
});
