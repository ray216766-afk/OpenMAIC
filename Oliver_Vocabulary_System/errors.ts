import { ACTIVE_BANK } from './normalize';

export class NewWordsExhaustedError extends Error {
  readonly code = 'NEW_WORDS_EXHAUSTED' as const;
  readonly unusedCount: number;
  readonly bankSize: number;

  constructor(unusedCount: number, bankSize = ACTIVE_BANK.wordCount) {
    const remainder =
      unusedCount === 0
        ? `${ACTIVE_BANK.label} has no unused new words left.`
        : `${ACTIVE_BANK.label} has only ${unusedCount} unused new word${unusedCount === 1 ? '' : 's'} left, which is fewer than 10.`;
    super(
      `${remainder} Words already taught as New stay in Review Vocabulary only. Use Parent/admin Reset this day, or wait for a later approved batch.`,
    );
    this.name = 'NewWordsExhaustedError';
    this.unusedCount = unusedCount;
    this.bankSize = bankSize;
  }
}

export class LessonQualityError extends Error {
  readonly code = 'LESSON_QUALITY_FAILED' as const;
  readonly issues: string[];

  constructor(issues: string[]) {
    const preview = issues.slice(0, 4).join(' · ');
    super(
      issues.length
        ? `Lesson generation failed quality checks: ${preview}`
        : 'Lesson generation failed quality checks.',
    );
    this.name = 'LessonQualityError';
    this.issues = issues;
  }
}
