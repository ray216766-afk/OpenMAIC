// @vitest-environment jsdom

import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ReadingQuestionsSection } from '@/components/oliver-vocabulary/reading-questions';
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
  return createElement(ReadingQuestionsSection, {
    questions,
    answers,
    onSelect: (questionId, option) =>
      setAnswers((current) => ({ ...current, [questionId]: option })),
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
});
