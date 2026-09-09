import { describe, expect, it } from 'vitest';

import {
  choosePassageTopic,
  generateMiniReading,
  generateReadingQuestions,
} from '../../Oliver_Vocabulary_System/Mini_Reading_Generator';
import {
  looksLikeConcatenatedExamples,
  mixedDomainAntiPattern,
  passageContainsWord,
  runReadingPassageQa,
  runReadingQuestionQa,
} from '../../Oliver_Vocabulary_System/quality';
import { loadMaster } from '../../Oliver_Vocabulary_System/store';
import type { VocabularyEntry } from '../../Oliver_Vocabulary_System/types';

function dayWords(start: number, count: number): VocabularyEntry[] {
  return loadMaster().slice(start, start + count);
}

describe('Reading is topic-first, not a vocab dump', () => {
  it('chooses a story/topic before fitting words', () => {
    const first = choosePassageTopic(1, 0);
    const second = choosePassageTopic(1, 1);
    expect(first.title.length).toBeGreaterThan(0);
    expect(first.paragraphs.join(' ')).not.toMatch(/\{word\}/);
    expect(first.facts.centralIdea.length).toBeGreaterThan(20);
    expect(second.id).not.toBe(first.id);
  });

  it('builds one coherent passage and only weaves naturally fitting words', () => {
    const newWords = dayWords(0, 10);
    const review = dayWords(10, 15);
    const reading = generateMiniReading(1, newWords, review);

    expect(reading.word_count).toBeGreaterThanOrEqual(180);
    expect(reading.word_count).toBeLessThanOrEqual(220);
    const featured = [...reading.featured_new_words, ...reading.featured_review_words];
    expect(featured.length).toBeGreaterThanOrEqual(5);
    expect(featured.length).toBeLessThanOrEqual(8);
    for (const word of featured) {
      expect(passageContainsWord(reading.passage, word)).toBe(true);
    }

    const dump = looksLikeConcatenatedExamples(reading.passage, newWords);
    expect(dump.dump).toBe(false);
    expect(mixedDomainAntiPattern(reading.passage)).toBe(false);
    expect(runReadingPassageQa(reading, [...newWords, ...review], reading.fallbackPassage).ok).toBe(
      true,
    );

    // Unused Day 1 words are allowed — quality over 10/10 coverage.
    expect(reading.featured_new_words.length).toBeLessThanOrEqual(10);
  });

  it('does not concatenate per-word example sentences into a fake passage', () => {
    const newWords = dayWords(0, 10);
    const reading = generateMiniReading(3, newWords, dayWords(10, 8));
    const verbatim = newWords.filter((entry) =>
      reading.passage.toLowerCase().includes(entry.example_sentence.replace(/\.+$/, '').toLowerCase()),
    );
    expect(verbatim.length).toBeLessThan(3);
    expect(reading.passage).not.toMatch(/The Locked Library Drawer/);
  });
});

describe('Reading questions follow the finished passage', () => {
  it('mixes required types and keeps every answer aligned', () => {
    const newWords = dayWords(0, 10);
    const review = dayWords(10, 15);
    const reading = generateMiniReading(1, newWords, review);
    const questions = generateReadingQuestions(1, reading, newWords, review);
    const types = questions.map((question) => question.type);

    expect(questions.length).toBeGreaterThanOrEqual(4);
    expect(questions.length).toBeLessThanOrEqual(5);
    expect(types).toContain('vocabulary_in_context');
    expect(types).toContain('main_idea');
    expect(types).toContain('inference');
    expect(types).toContain('detail');
    expect(runReadingQuestionQa(questions, reading).ok).toBe(true);

    const vocab = questions.find((question) => question.type === 'vocabulary_in_context');
    const mentioned = newWords.find((entry) => vocab?.prompt.includes(`"${entry.word}"`));
    if (mentioned) {
      expect(passageContainsWord(reading.passage, mentioned.word)).toBe(true);
    }
  });
});
