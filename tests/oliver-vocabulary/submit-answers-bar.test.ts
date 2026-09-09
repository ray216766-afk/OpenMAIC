// @vitest-environment jsdom

import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SubmitAnswersBar } from '@/components/oliver-vocabulary/submit-answers-bar';

describe('Submit answers bar', () => {
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

  it('shows a clear Submit answers control before review', () => {
    const onSubmit = vi.fn();
    act(() => {
      root.render(
        createElement(SubmitAnswersBar, {
          section: 'review',
          onSubmit,
          submitted: false,
          hint: 'Choose your review answers, then submit.',
        }),
      );
    });

    const button = container.querySelector<HTMLButtonElement>('[data-submit-answers="review"]');
    expect(button?.textContent).toContain('Submit answers');
    expect(button?.getAttribute('data-action')).toBe('mark-review');
    expect(button?.disabled).toBe(false);

    act(() => {
      button!.click();
    });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('locks the control after the attempt is submitted', () => {
    act(() => {
      root.render(
        createElement(SubmitAnswersBar, {
          section: 'reading',
          onSubmit: () => undefined,
          submitted: true,
          score: '1/2 correct (50%)',
          hint: 'unused after submit',
        }),
      );
    });

    const button = container.querySelector<HTMLButtonElement>('[data-submit-answers="reading"]');
    expect(button?.textContent).toContain('Answers submitted');
    expect(button?.disabled).toBe(true);
    expect(container.querySelector('[data-quiz-score]')?.textContent).toBe('1/2 correct (50%)');
    expect(container.querySelector('[data-review-frozen="true"]')).not.toBeNull();
  });
});
