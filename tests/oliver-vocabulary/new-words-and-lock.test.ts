import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  NewWordsExhaustedError,
  generateOliverVocabularyLessonDay,
  selectNewWords,
} from '../../Oliver_Vocabulary_System/Daily_Lesson_Generator';
import { markReadingQuiz } from '../../Oliver_Vocabulary_System/Review_Engine/reading';
import { answersMatch } from '../../Oliver_Vocabulary_System/Review_Engine/grade';
import { markReviewQuiz } from '../../Oliver_Vocabulary_System/Review_Engine/mark';
import {
  emptyProgressFile,
  loadLessonSnapshot,
  loadMaster,
  markFirstSeen,
  saveProgress,
} from '../../Oliver_Vocabulary_System/store';
import type {
  QuizAnswer,
  ReviewExercise,
  VocabularyEnginePaths,
} from '../../Oliver_Vocabulary_System/types';

function isolatedPaths(): VocabularyEnginePaths {
  const dir = mkdtempSync(join(tmpdir(), 'oliver-vocab-lock-'));
  const master = loadMaster();
  const masterPath = join(dir, 'Vocabulary_Master.json');
  const progressPath = join(dir, 'Vocabulary_Progress.json');
  writeFileSync(masterPath, JSON.stringify({ words: master }), 'utf8');
  saveProgress(emptyProgressFile(), { masterPath, progressPath });
  return { masterPath, progressPath };
}

function answersFor(exercises: ReviewExercise[], wrongEvery = 3): QuizAnswer[] {
  return exercises.map((exercise, index) => {
    const wrong = exercise.options?.find((option) => !answersMatch(option, exercise.answer));
    return {
      exerciseId: exercise.id,
      answer: index % wrongEvery === 0 && wrong ? wrong : exercise.answer,
    };
  });
}

describe('New Vocabulary is taught only once', () => {
  it('never reissues a Day 1 New word as New on a later day — only Review', () => {
    const paths = isolatedPaths();
    const day1 = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    const day1New = day1.lesson.new_vocabulary.map((card) => card.word);
    expect(day1New).toEqual(expect.arrayContaining(['analyse', 'significant', 'environment']));

    const day2 = generateOliverVocabularyLessonDay(2, paths, { persist: true });
    const day2New = day2.lesson.new_vocabulary.map((card) => card.word);
    const day2Review = day2.lesson.review_vocabulary.map((card) => card.word);

    expect(day2New.some((word) => day1New.includes(word))).toBe(false);
    expect(day1New.some((word) => day2Review.includes(word))).toBe(true);
    expect(day2.lesson.new_vocabulary).toHaveLength(10);
  });

  it('errors when Batch 1 unused New words are exhausted instead of wrapping', () => {
    const paths = isolatedPaths();
    const master = loadMaster(paths);
    let progress = emptyProgressFile();
    for (const entry of master) {
      progress = markFirstSeen(progress, entry.word, 1);
    }
    saveProgress(progress, paths);

    expect(() => selectNewWords(master, progress, 11)).toThrow(NewWordsExhaustedError);
    expect(() => generateOliverVocabularyLessonDay(11, paths, { persist: true })).toThrow(
      /Academic Core Batch 1 \(100\) has no unused new words left/,
    );
  });
});

describe('Locked day snapshot and review colours', () => {
  it('reloads the same lesson and the same submitted answers after lock', () => {
    const paths = isolatedPaths();
    const generated = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    const reviewAnswers = answersFor(generated.lesson.review_exercises, 3);
    const quiz = markReviewQuiz(paths, 1, reviewAnswers);

    const readingAnswers = generated.lesson.reading_questions.map((question, index) => ({
      questionId: question.id,
      answer: index === 0 ? (question.options[1] ?? question.answer) : question.answer,
    }));
    const reading = markReadingQuiz(paths, 1, readingAnswers);

    const reloaded = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    expect(reloaded.source).toBe('snapshot');
    expect(reloaded.locked).toBe(true);
    expect(reloaded.lesson.generated_at).toBe(generated.lesson.generated_at);
    expect(reloaded.lesson.new_vocabulary.map((card) => card.word)).toEqual(
      generated.lesson.new_vocabulary.map((card) => card.word),
    );
    expect(reloaded.lesson.review_exercises.map((item) => item.answer)).toEqual(
      generated.lesson.review_exercises.map((item) => item.answer),
    );
    expect(reloaded.review_attempt?.results.map((result) => result.given)).toEqual(
      quiz.results.map((result) => result.given),
    );
    expect(reloaded.reading_attempt?.results.map((result) => result.given)).toEqual(
      reading.results.map((result) => result.given),
    );

    const wrong = reloaded.review_attempt?.results.find((result) => !result.correct);
    const right = reloaded.review_attempt?.results.find((result) => result.correct);
    expect(wrong).toBeDefined();
    expect(right).toBeDefined();
    expect(wrong?.given).not.toBe(wrong?.expected);
    expect(right?.given).toBe(right?.expected);
  });

  it('does not create a new lesson when Generate is called again on a locked day', () => {
    const paths = isolatedPaths();
    const first = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    const second = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    const third = generateOliverVocabularyLessonDay(1, paths, { persist: false });

    expect(second.source).toBe('snapshot');
    expect(third.source).toBe('snapshot');
    expect(second.lesson.generated_at).toBe(first.lesson.generated_at);
    expect(third.lesson.mini_reading.passage).toBe(first.lesson.mini_reading.passage);
    expect(loadLessonSnapshot(paths, 1)?.lesson.generated_at).toBe(first.lesson.generated_at);
  });

  it('allows a clearly labeled parent/admin reset to generate a fresh Day X', () => {
    const paths = isolatedPaths();
    const first = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    markReviewQuiz(paths, 1, answersFor(first.lesson.review_exercises));

    const reset = generateOliverVocabularyLessonDay(1, paths, { persist: true, reset: true });
    expect(reset.source).toBe('generated');
    expect(reset.review_attempt).toBeNull();
    expect(reset.lesson.new_vocabulary.map((card) => card.word)).toEqual(
      first.lesson.new_vocabulary.map((card) => card.word),
    );
  });
});
