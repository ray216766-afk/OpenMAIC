// @vitest-environment jsdom

import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ChoiceOptions } from '@/components/oliver-vocabulary/choice-options';

function Harness({
  revealed,
}: {
  revealed?: { given: string; expected: string; correct: boolean };
}) {
  const [selected, setSelected] = useState('A celebration.');
  return createElement(ChoiceOptions, {
    name: 'REV001-1',
    options: ['To examine carefully.', 'A celebration.', 'A uniform.'],
    selected,
    disabled: Boolean(revealed),
    optionTone: (option) => {
      if (!revealed) return 'default';
      if (option === revealed.given && !revealed.correct) return 'incorrect';
      if (option === revealed.expected && revealed.correct) return 'correct';
      return 'default';
    },
    onSelect: setSelected,
  });
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

  it('marks the chosen wrong answer in red and freezes the radios', () => {
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
    expect(
      [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')].every(
        (radio) => radio.disabled,
      ),
    ).toBe(true);
  });
});
