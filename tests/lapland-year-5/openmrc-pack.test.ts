import { describe, expect, it } from 'vitest';

import {
  analysePlacementQuestions,
  loadOpenMrcEntries,
  loadPlacementPack,
  placementStudentPaper,
} from '@/Naplan_Y5_System/openmrc-pack';
import type { PackQuestion } from '@/Naplan_Y5_System/openmrc-pack';

function answerFirst(questions: PackQuestion[]): Record<string, string> {
  return Object.fromEntries(
    questions.map((question) => [question.placement_id, question.options?.[0] ?? '']),
  );
}

describe('OpenMRC Year 5 pack', () => {
  it('lists all 60 catalog entries with a Word file, including spelling', () => {
    const entries = loadOpenMrcEntries();
    expect(entries).toHaveLength(60);
    expect(new Set(entries.map((entry) => entry.subject))).toEqual(
      new Set(['Conventions of Language', 'Numeracy', 'Reading']),
    );
    expect(entries.filter((entry) => entry.topic === 'Spelling')).toHaveLength(12);
    expect(entries.every((entry) => entry.question_count > 0)).toBe(true);
    expect(entries.every((entry) => entry.bank_id && entry.path?.endsWith('.docx'))).toBe(true);
    expect(entries.reduce((sum, entry) => sum + entry.question_count, 0)).toBe(804);
  });

  it('serves the 26-question placement paper without answer keys', () => {
    const pack = loadPlacementPack();
    const paper = placementStudentPaper();
    expect(pack.questions).toHaveLength(26);
    expect(paper.question_count).toBe(26);
    expect(paper.questions.map((question) => question.id)[0]).toBe('P01');
    expect(paper.questions.map((question) => question.number)).toEqual(
      Array.from({ length: 26 }, (_, index) => index + 1),
    );
    expect(paper.questions.every((question) => !('correct_answer' in question))).toBe(true);
    expect(paper.questions.every((question) => question.scoreable === false)).toBe(true);
    expect(pack.questions.every((question) => question.correct_answer == null)).toBe(true);
    expect(new Set(paper.questions.map((question) => question.strand))).toEqual(
      new Set([
        'Grammar & Punctuation',
        'Reading',
        'Number & Algebra',
        'Measurement & Geometry',
        'Statistics & Probability',
      ]),
    );
  });

  it('recommends provisional practice while every key is empty', () => {
    const pack = loadPlacementPack();
    const entries = loadOpenMrcEntries();
    const report = analysePlacementQuestions(pack.questions, entries, answerFirst(pack.questions));
    expect(report.keyed).toBe(0);
    expect(report.scored).toBe(0);
    expect(report.report.answered).toBe(26);
    expect(report.report.weak.map((strand) => strand.strand)).toEqual([
      'Grammar & Punctuation',
      'Reading',
      'Number & Algebra',
      'Measurement & Geometry',
      'Statistics & Probability',
    ]);
    for (const strand of report.report.weak) {
      const picks = report.report.recommendations.filter((item) => item.strand === strand.strand);
      expect(picks.length).toBeGreaterThan(0);
      expect(picks.length).toBeLessThanOrEqual(3);
      expect(picks.every((item) => item.level === 'Standard')).toBe(true);
    }
    expect(report.score_label).toContain('No key is stored yet');
  });

  it('scores filled keys and keeps recommendations at the missed level or below', () => {
    const pack = loadPlacementPack();
    const entries = loadOpenMrcEntries();
    const answers = answerFirst(pack.questions);
    const keyed = pack.questions.map((question) => {
      if (question.strand !== 'Grammar & Punctuation' || !question.options) return question;
      const correct = question.level === 'Standard' ? question.options[1] : question.options[0];
      return { ...question, correct_answer: correct };
    });
    const report = analysePlacementQuestions(keyed, entries, answers);
    const grammar = report.report.weak.find((strand) => strand.strand === 'Grammar & Punctuation');
    expect(grammar?.scored).toBe(6);
    expect(grammar?.correct).toBe(3);
    expect((grammar?.accuracy ?? 1) < 0.6).toBe(true);
    const picks = report.report.recommendations.filter(
      (item) => item.strand === 'Grammar & Punctuation',
    );
    expect(picks).toHaveLength(3);
    expect(picks.every((item) => item.level === 'Standard')).toBe(true);
  });

  it('lets a teacher mark stand in until a key exists', () => {
    const pack = loadPlacementPack();
    const entries = loadOpenMrcEntries();
    const first = pack.questions[0];
    expect(first).toBeDefined();
    if (!first?.options?.[0]) throw new Error('missing first option');
    const missed = analysePlacementQuestions(
      pack.questions,
      entries,
      { [first.placement_id]: first.options[0] },
      { [first.placement_id]: false },
    );
    const grammar = missed.report.strands.find(
      (strand) => strand.strand === 'Grammar & Punctuation',
    );
    expect(grammar?.scored).toBe(1);
    expect(grammar?.correct).toBe(0);
    expect(grammar?.weak).toBe(true);
    expect(missed.report.weak.map((strand) => strand.strand)).toEqual(['Grammar & Punctuation']);

    const passed = analysePlacementQuestions(
      pack.questions,
      entries,
      { [first.placement_id]: first.options[0] },
      { [first.placement_id]: true },
    );
    expect(passed.report.weak.some((strand) => strand.strand === 'Grammar & Punctuation')).toBe(
      false,
    );
  });
});
