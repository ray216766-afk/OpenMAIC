import { describe, expect, it } from 'vitest';

import { submitPractice } from '@/Naplan_Y5_System/attempt';
import { captureCatalogIds, captureQuestions, practicePaper } from '@/Naplan_Y5_System/captures';
import { loadOpenMrcEntries } from '@/Naplan_Y5_System/openmrc-pack';

describe('practice capture files', () => {
  it('wires every main-page id to a capture with the same question count', () => {
    const entries = loadOpenMrcEntries();
    expect(captureCatalogIds()).toEqual(entries.map((entry) => entry.id));
    expect(entries).toHaveLength(60);
    for (const entry of entries) {
      const paper = practicePaper(entry.id);
      expect(paper.resource.id).toBe(entry.id);
      expect(paper.questions).toHaveLength(entry.question_count);
      expect(paper.questions.every((question) => question.prompt.trim().length > 0)).toBe(true);
    }
  });

  it('starts Grammar Test 01 from the capture and hides selected_answer', () => {
    const paper = practicePaper('conventions-grammar-punctuation-01');
    const first = paper.questions[0];
    expect(first?.prompt).toContain('Tennis is played either');
    expect(first?.options).toEqual(['yet', 'or', 'nor', 'and']);
    expect(first?.scoreable).toBe(true);
    const payload = JSON.stringify(paper);
    expect(payload).not.toContain('selected_answer');
    expect(payload).not.toContain('exceltestzone');
    expect(payload).not.toContain('correct_answer');
    const reading = practicePaper('reading-test-01');
    expect(reading.resource.passage).toContain('Land clearing');
    expect(reading.questions[0]?.options[0]).toContain('world food shortage');
    const spelling = practicePaper('conventions-spelling-01');
    expect(spelling.questions[0]?.options).toEqual([]);
    expect(spelling.questions[0]?.response_kind).toBe('text');
  });

  it('scores a stored key and leaves a capture selected_answer unused', () => {
    const questions = captureQuestions('conventions-grammar-punctuation-01');
    const first = questions[0];
    expect(first?.correct_answer).toBe('or');
    const result = submitPractice({
      resourceId: 'conventions-grammar-punctuation-01',
      answers: { 'conventions-grammar-punctuation-01-q01': 'yet' },
    });
    expect(result.attempt.marks[0]?.correct).toBe(false);
    expect(result.attempt.marks[0]?.expected).toBe('or');
    expect(result.score_label).toContain('0/1');
    expect(result.saved_wrong).toBeGreaterThanOrEqual(1);
  });
});
