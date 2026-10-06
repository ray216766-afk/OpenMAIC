import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { loadQuestionBank } from '@/Naplan_Y5_System/bank';
import { gradeQuestions } from '@/Naplan_Y5_System/Review_Engine/grade';
import { exerciseIssues } from '@/Naplan_Y5_System/Review_Engine/exercises';
import { selectPlacementQuestions, weakSpotReport } from '@/Naplan_Y5_System/placement';
import {
  appendWrongItems,
  defaultEnginePaths,
  loadWrongBank,
  rememberAttempt,
} from '@/Naplan_Y5_System/store';
import { NAPLAN_DEV_PORT, type WrongItem } from '@/Naplan_Y5_System/types';

describe('Year 5 practice engine', () => {
  const previousRoot = process.env.NAPLAN_Y5_ROOT;

  afterEach(() => {
    if (previousRoot === undefined) delete process.env.NAPLAN_Y5_ROOT;
    else process.env.NAPLAN_Y5_ROOT = previousRoot;
  });

  it('keeps a port away from Vocabulary 2007 and Codex 3007', () => {
    expect(NAPLAN_DEV_PORT).toBe(4017);
    expect(NAPLAN_DEV_PORT).not.toBe(2007);
    expect(NAPLAN_DEV_PORT).not.toBe(3007);
  });

  it('loads 60 startable practice resources with one key per scored choice', () => {
    const { resources, questions } = loadQuestionBank();
    expect(resources).toHaveLength(60);
    expect(new Set(resources.map((resource) => resource.domain))).toEqual(
      new Set(['Language Conventions', 'Numeracy', 'Reading']),
    );
    expect(questions).toHaveLength(804);
    const keyIssues = questions.flatMap(exerciseIssues).filter((issue) => issue.includes('key'));
    expect(keyIssues).toEqual([]);
    expect(resources.every((resource) => resource.question_count > 0)).toBe(true);
  });

  it('scores capture suggestions and leaves missing keys unscored', () => {
    const graded = gradeQuestions(
      [
        {
          id: 'q1',
          resource_id: 'demo',
          number: 1,
          domain: 'Language Conventions',
          strand: 'Grammar & Punctuation',
          skill_tag: 'either...or pair',
          difficulty: 'Standard',
          prompt: 'either ___',
          options: ['yet', 'or'],
          response_kind: 'single',
          correct_answer: 'or',
          key_status: 'capture_suggestion',
          image_heavy: false,
        },
        {
          id: 'q2',
          resource_id: 'demo',
          number: 2,
          domain: 'Reading',
          strand: 'Reading',
          skill_tag: 'reading',
          difficulty: 'Standard',
          prompt: 'image',
          options: ['a', 'b'],
          response_kind: 'single',
          correct_answer: null,
          key_status: 'missing',
          image_heavy: true,
        },
      ],
      { q1: 'yet', q2: 'a' },
    );
    expect(graded.correct).toBe(0);
    expect(graded.scored).toBe(1);
    expect(graded.marks[0]?.correct).toBe(false);
    expect(graded.marks[1]?.scored).toBe(false);
  });

  it('builds a level test across strands and recommends weak practice', () => {
    const { resources, questions } = loadQuestionBank();
    const placement = selectPlacementQuestions(questions);
    expect(new Set(placement.map((question) => question.domain)).size).toBe(3);
    expect(placement.length).toBeGreaterThanOrEqual(10);
    const report = weakSpotReport(
      [
        {
          skill_tag: 'either...or pair',
          domain: 'Language Conventions',
          strand: 'Grammar & Punctuation',
          correct: 0,
          scored: 1,
          accuracy: 0,
        },
      ],
      resources,
    );
    expect(report.weak).toHaveLength(1);
    expect(report.recommendations.some((item) => item.domain === 'Language Conventions')).toBe(
      true,
    );
    expect(report.recommendations.some((item) => item.strand === 'Reading')).toBe(true);
  });

  it('appends wrong-bank items without dropping earlier ones', () => {
    const root = mkdtempSync(join(tmpdir(), 'naplan-y5-'));
    process.env.NAPLAN_Y5_ROOT = root;
    const paths = defaultEnginePaths(root);
    const item = (id: string): WrongItem => ({
      id,
      resource_id: 'y5-gp-01',
      question_id: id,
      title: 'Grammar',
      prompt: 'prompt',
      given: 'yet',
      expected: 'or',
      skill_tag: 'either...or pair',
      domain: 'Language Conventions',
      strand: 'Grammar & Punctuation',
      saved_at: '2026-10-06T00:00:00.000Z',
      reason: 'incorrect',
    });
    expect(appendWrongItems([item('a')], paths)).toBe(1);
    expect(appendWrongItems([item('a'), item('b')], paths)).toBe(1);
    expect(loadWrongBank(paths).items.map((entry) => entry.id)).toEqual(['a', 'b']);
    rememberAttempt(
      {
        id: 'attempt-1',
        kind: 'practice',
        resource_id: 'y5-gp-01',
        title: 'Grammar',
        submitted_at: '2026-10-06T00:00:00.000Z',
        correct: 0,
        scored: 1,
        total: 1,
        marks: [],
      },
      paths,
    );
    expect(loadWrongBank(paths).items).toHaveLength(2);
  });
});
