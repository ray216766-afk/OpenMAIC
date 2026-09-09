// @vitest-environment jsdom

import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChoiceOptions } from '@/components/oliver-vocabulary/choice-options';
import { ChoiceReviewHint } from '@/components/oliver-vocabulary/choice-review-hint';
import { choiceReviewTone } from '@/lib/oliver-vocabulary/choice-review';

function Harness({
  revealed,
}: {
  revealed?: { given: string; expected: string; correct: boolean };
}) {
  const [selected, setSelected] = useState('A celebration.');
  return createElement(
    'div',
    null,
    createElement(ChoiceOptions, {
      name: 'REV001-1',
      options: ['To examine carefully.', 'A celebration.', 'A uniform.'],
      selected,
      disabled: Boolean(revealed),
      optionTone: (option) => choiceReviewTone(option, revealed),
      onSelect: setSelected,
    }),
    createElement(ChoiceReviewHint, { mark: revealed }),
  );
}

describe('review choice options', () => {
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

  it('marks the chosen wrong answer in red and reveals the correct answer', () => {
    act(() => {
      root.render(
        createElement(Harness, {
          revealed: {
            given: 'A celebration.',
            expected: 'To examine carefully.',
            correct: false,
          },
        }),
      );
    });

    const wrong = container.querySelector('[data-option-tone="incorrect"]');
    expect(wrong?.textContent).toContain('A celebration.');
    expect(wrong?.className).toContain('border-red-600');
    expect(wrong?.className).toContain('bg-red-50');

    const expected = container.querySelector('[data-option-tone="correct"]');
    expect(expected?.textContent).toContain('To examine carefully.');
    expect(expected?.className).toContain('border-emerald-700');

    expect(container.querySelector('[data-review-hint="incorrect"]')?.textContent).toContain(
      'Correct answer: To examine carefully.',
    );
    expect(container.querySelector('[data-correct-answer]')?.textContent).toBe(
      'To examine carefully.',
    );
    expect(
      [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].every(
        (radio) => radio.disabled,
      ),
    ).toBe(true);
  });

  it('marks a correct pick without a wrong-answer hint', () => {
    act(() => {
      root.render(
        createElement(Harness, {
          revealed: {
            given: 'To examine carefully.',
            expected: 'To examine carefully.',
            correct: true,
          },
        }),
      );
    });

    expect(container.querySelector('[data-option-tone="incorrect"]')).toBeNull();
    expect(container.querySelector('[data-option-tone="correct"]')?.textContent).toContain(
      'To examine carefully.',
    );
    expect(container.querySelector('[data-review-hint="correct"]')?.textContent).toBe('Correct');
  });
});
