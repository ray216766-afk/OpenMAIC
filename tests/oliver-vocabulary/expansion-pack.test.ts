import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { generateOliverVocabularyLessonDay } from '../../Oliver_Vocabulary_System/Daily_Lesson_Generator';
import { ACTIVE_BANK } from '../../Oliver_Vocabulary_System/normalize';
import { runReadingPassageQa, runReadingQuestionQa, runVocabQa } from '../../Oliver_Vocabulary_System/quality';
import {
  emptyProgressFile,
  loadMaster,
  markFirstSeen,
  saveProgress,
} from '../../Oliver_Vocabulary_System/store';
import type { VocabularyEnginePaths } from '../../Oliver_Vocabulary_System/types';

const expansionPath = join(
  process.cwd(),
  'Oliver_Vocabulary_System',
  ACTIVE_BANK.expansionRelativePath,
);
const batch1Path = join(process.cwd(), 'Oliver_Vocabulary_System', ACTIVE_BANK.relativePath);

describe('Academic Core expansion VAC0101–VAC1500', () => {
  it('is a continuous 1400-word pack with unique lemmas vs Batch 1', () => {
    const pack = JSON.parse(readFileSync(expansionPath, 'utf8')) as Array<{
      id: string;
      word: string;
      level: string;
      part_of_speech: string;
      chinese_meaning: string;
      simple_definition: string;
      example_sentence: string;
      common_collocations: string[];
      antonyms: string[];
      review_schedule: string[];
    }>;
    const batch1 = JSON.parse(readFileSync(batch1Path, 'utf8')) as Array<{ word: string }>;

    expect(pack).toHaveLength(1400);
    expect(pack[0]?.id).toBe('VAC0101');
    expect(pack.at(-1)?.id).toBe('VAC1500');
    expect(pack.map((row) => row.id)).toEqual(
      Array.from({ length: 1400 }, (_, index) => `VAC${String(index + 101).padStart(4, '0')}`),
    );

    const packWords = pack.map((row) => row.word.toLowerCase());
    expect(new Set(packWords).size).toBe(1400);
    const overlap = packWords.filter((word) =>
      batch1.some((row) => row.word.toLowerCase() === word),
    );
    expect(overlap).toEqual([]);

    const levels = pack.reduce<Record<string, number>>((acc, row) => {
      acc[row.level] = (acc[row.level] ?? 0) + 1;
      return acc;
    }, {});
    expect(levels['1']).toBe(840);
    expect(levels['2']).toBe(420);
    expect(levels['3']).toBe(140);

    expect(
      pack.every(
        (row) =>
          row.chinese_meaning &&
          row.simple_definition &&
          row.example_sentence.toLowerCase().includes(row.word.toLowerCase()) &&
          row.common_collocations.length >= 2 &&
          Array.isArray(row.antonyms) &&
          row.review_schedule.length === 5,
      ),
    ).toBe(true);
  });

  it('compiles into a 1500-word live master without wrapping Batch 1 IDs', () => {
    const master = loadMaster();
    expect(master).toHaveLength(1500);
    expect(master.slice(0, 3).map((entry) => entry.word)).toEqual([
      'analyse',
      'significant',
      'environment',
    ]);
    expect(master.filter((entry) => /^VAC01\d\d$/.test(entry.id)).length).toBeGreaterThan(0);
  });

  it('generates a new-day lesson whose New words come from the expansion pack', () => {
    const dir = mkdtempSync(join(tmpdir(), 'oliver-expand-lesson-'));
    const master = loadMaster();
    const paths: VocabularyEnginePaths = {
      masterPath: join(dir, 'Vocabulary_Master.json'),
      progressPath: join(dir, 'Vocabulary_Progress.json'),
    };
    writeFileSync(paths.masterPath, JSON.stringify({ words: master }), 'utf8');
    let progress = emptyProgressFile();
    for (const entry of master.filter((word) => word.level === 1 && /^VAC00/.test(word.id))) {
      progress = markFirstSeen(progress, entry.word, 1);
    }
    saveProgress(progress, paths);

    const result = generateOliverVocabularyLessonDay(7, paths, { persist: true });
    const newWords = result.lesson.new_vocabulary;
    expect(newWords.map((card) => card.word)).toEqual([
      'adapt',
      'adjust',
      'apply',
      'argue',
      'arrange',
      'assemble',
      'calculate',
      'categorise',
      'challenge',
      'clarify',
    ]);
    expect(newWords.every((card) => card.id >= 'VAC0101')).toBe(true);
    expect(result.lesson.mini_reading.word_count).toBeGreaterThanOrEqual(180);
    expect(result.lesson.mini_reading.word_count).toBeLessThanOrEqual(220);
    const featured =
      result.lesson.mini_reading.featured_new_words.length +
      result.lesson.mini_reading.featured_review_words.length;
    expect(featured).toBeGreaterThanOrEqual(5);
    expect(featured).toBeLessThanOrEqual(8);
    expect(
      result.lesson.reading_questions.every(
        (question) =>
          question.options.length === 4 && new Set(question.options).size === 4 && question.options.includes(question.answer),
      ),
    ).toBe(true);
    expect(runVocabQa(result.lesson.review_exercises, master, master).ok).toBe(true);
    expect(runReadingPassageQa(result.lesson.mini_reading, master).ok).toBe(true);
    expect(runReadingQuestionQa(result.lesson.reading_questions, result.lesson.mini_reading).ok).toBe(
      true,
    );
  });
});
