import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { generateOliverVocabularyLessonDay } from '../../Oliver_Vocabulary_System/Daily_Lesson_Generator';
import {
  answersMatch,
  gradeReviewAnswers,
  reviewAttemptFingerprint,
} from '../../Oliver_Vocabulary_System/Review_Engine/grade';
import { markReviewQuiz } from '../../Oliver_Vocabulary_System/Review_Engine/mark';
import {
  emptyProgressFile,
  loadMaster,
  loadProgress,
  saveProgress,
} from '../../Oliver_Vocabulary_System/store';
import type {
  QuizAnswer,
  ReviewExercise,
  VocabularyEnginePaths,
} from '../../Oliver_Vocabulary_System/types';

function isolatedPaths(): VocabularyEnginePaths {
  const dir = mkdtempSync(join(tmpdir(), 'oliver-vocab-grade-'));
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

describe('Oliver review grading determinism', () => {
  it('grades the same answers against the same exercises identically', () => {
    const exercises: ReviewExercise[] = [
      {
        id: 'REV001-1',
        type: 'meaning_matching',
        word: 'analyse',
        prompt: 'Which definition matches "analyse"?',
        options: ['To examine carefully.', 'A celebration.', 'A uniform.'],
        answer: 'To examine carefully.',
      },
      {
        id: 'REV001-2',
        type: 'synonym_selection',
        word: 'significant',
        prompt: 'Choose the best synonym for "significant".',
        options: ['important', 'tiny', 'noisy'],
        answer: 'important',
      },
    ];
    const answers: QuizAnswer[] = [
      { exerciseId: 'REV001-1', answer: 'A celebration.' },
      { exerciseId: 'REV001-2', answer: 'important' },
    ];

    const first = gradeReviewAnswers(exercises, answers);
    const second = gradeReviewAnswers(exercises, answers);
    expect(second).toEqual(first);
    expect(first.correct).toBe(1);
    expect(first.total).toBe(2);
    expect(first.results.map((result) => result.correct)).toEqual([false, true]);
    expect(reviewAttemptFingerprint(1, answers)).toBe(
      reviewAttemptFingerprint(1, [...answers].reverse()),
    );
  });

  it('keeps Mark review score and correct/incorrect set frozen on repeat submit', () => {
    const paths = isolatedPaths();
    const generated = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    const answers = answersFor(generated.lesson.review_exercises);

    const first = markReviewQuiz(paths, 1, answers);
    const progressAfterFirst = loadProgress(paths);
    const second = markReviewQuiz(paths, 1, answers);
    const third = markReviewQuiz(paths, 1, answers);

    expect(second.correct).toBe(first.correct);
    expect(second.total).toBe(first.total);
    expect(second.correct_rate).toBe(first.correct_rate);
    expect(second.results).toEqual(first.results);
    expect(third.results).toEqual(first.results);

    const progressAfterRepeat = loadProgress(paths);
    expect(progressAfterRepeat.entries.map((entry) => [entry.word, entry.review_count])).toEqual(
      progressAfterFirst.entries.map((entry) => [entry.word, entry.review_count]),
    );
  });

  it('does not re-grade a frozen lesson against a regenerated review set', () => {
    const paths = isolatedPaths();
    const shown = generateOliverVocabularyLessonDay(1, paths, { persist: true });
    const answers = answersFor(shown.lesson.review_exercises, 2);
    const frozen = markReviewQuiz(paths, 1, answers);

    // Progress now changed. The old quiz route regenerated with persist:false,
    // remapping REV001-N onto other words while the student answers stayed put.
    const regenerated = generateOliverVocabularyLessonDay(1, paths, { persist: false });
    const remapped = gradeReviewAnswers(regenerated.lesson.review_exercises, answers);
    const repeat = markReviewQuiz(paths, 1, answers);

    expect(repeat.results).toEqual(frozen.results);
    expect(repeat.correct).toBe(frozen.correct);
    expect(repeat.results.map((result) => result.expected)).toEqual(
      frozen.results.map((result) => result.expected),
    );
    const remappedKeys = remapped.results.map(
      (result) => `${result.exerciseId}:${result.expected}`,
    );
    const frozenKeys = frozen.results.map((result) => `${result.exerciseId}:${result.expected}`);
    const regeneratedAnswersMoved = regenerated.lesson.review_exercises.some(
      (exercise, index) => exercise.answer !== shown.lesson.review_exercises[index]?.answer,
    );
    if (regeneratedAnswersMoved) {
      expect(remappedKeys).not.toEqual(frozenKeys);
    }
  });
});
