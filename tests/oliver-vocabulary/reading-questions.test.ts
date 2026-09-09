// @vitest-environment jsdom

import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ReadingQuestionsSection } from '@/components/oliver-vocabulary/reading-questions';
import {
  type ChoiceReviewMark,
  gradeChoiceSelections,
} from '@/lib/oliver-vocabulary/choice-review';
import type { ReadingQuestion } from '@/Oliver_Vocabulary_System/types';

const questions: ReadingQuestion[] = [
  {
    id: 'RQ001-1',
    type: 'vocabulary_in_context',
    prompt: 'In this passage, "analyse" is used to mean:',
    options: [
      'To examine something carefully.',
      'A loud celebration.',
      'A type of school uniform.',
    ],
    answer: 'To examine something carefully.',
  },
  {
    id: 'RQ001-2',
    type: 'main_idea',
    prompt: 'Which sentence best states the main idea of the passage?',
    options: [
      'Careful observation matters more than a dramatic view.',
      'The characters give up and go home immediately.',
    ],
    answer: 'Careful observation matters more than a dramatic view.',
  },
];

function Harness() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, ChoiceReviewMark>>({});
  const [submitted, setSubmitted] = useState(false);
  return createElement(ReadingQuestionsSection, {
    questions,
    answers,
    results,
    submitted,
    onSelect: (questionId, option) =>
      setAnswers((current) => ({ ...current, [questionId]: option })),
    onSubmit: () => {
      if (submitted) return;
      const graded = gradeChoiceSelections(questions, answers);
      if (graded.total === 0) return;
      setResults(graded.results);
      setSubmitted(true);
    },
  });
}

describe('Section 4 reading questions', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('lets the student select an option and updates the checked radio', () => {
    act(() => {
      root.render(createElement(Harness));
    });

    const firstQuestion = container.querySelector('[data-reading-question="RQ001-1"]');
    expect(firstQuestion).not.toBeNull();

    const radios = firstQuestion!.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(radios).toHaveLength(3);
    expect([...radios].every((radio) => !radio.disabled && radio.checked === false)).toBe(true);

    act(() => {
      radios[1].click();
    });

    expect(radios[1].checked).toBe(true);
    expect(radios[0].checked).toBe(false);
    expect(radios[1].closest('label')?.className).toContain('border-[#1f3a5f]');

    act(() => {
      radios[0].click();
    });

    expect(radios[0].checked).toBe(true);
    expect(radios[1].checked).toBe(false);

    const secondQuestion = container.querySelector('[data-reading-question="RQ001-2"]');
    const secondRadios = secondQuestion!.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    expect(secondRadios[0].checked).toBe(false);

    act(() => {
      secondRadios[0].click();
    });

    expect(secondRadios[0].checked).toBe(true);
    expect(radios[0].checked).toBe(true);
  });

  it('offers Submit answers and then shows red wrongs plus the correct answer', () => {
    act(() => {
      root.render(createElement(Harness));
    });

    const submit = container.querySelector<HTMLButtonElement>('[data-submit-answers="reading"]');
    expect(submit?.textContent).toContain('Submit answers');
    expect(submit?.disabled).toBe(false);

    const firstRadios = container
      .querySelector('[data-reading-question="RQ001-1"]')!
      .querySelectorAll<HTMLInputElement>('input[type="radio"]');

    act(() => {
      firstRadios[1].click();
    });
    act(() => {
      submit!.click();
    });

    const firstQuestion = container.querySelector('[data-reading-question="RQ001-1"]');
    expect(firstQuestion?.getAttribute('data-review-result')).toBe('incorrect');
    expect(firstQuestion?.querySelector('[data-option-tone="incorrect"]')?.textContent).toContain(
      'A loud celebration.',
    );
    expect(firstQuestion?.querySelector('[data-option-tone="correct"]')?.textContent).toContain(
      'To examine something carefully.',
    );
    expect(firstQuestion?.querySelector('[data-correct-answer]')?.textContent).toBe(
      'To examine something carefully.',
    );
    expect(
      [...firstQuestion!.querySelectorAll<HTMLInputElement>('input[type="radio"]')].every(
        (radio) => radio.disabled,
      ),
    ).toBe(true);
    expect(container.querySelector('[data-submit-answers="reading"]')?.textContent).toContain(
      'Answers submitted',
    );
    expect(container.querySelector('[data-submit-answers="reading"]')).toHaveProperty(
      'disabled',
      true,
    );
  });
});
