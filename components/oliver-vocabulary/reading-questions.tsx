'use client';

import type { ReadingQuestion } from '@/Oliver_Vocabulary_System/types';
import type { ChoiceReviewMark } from '@/lib/oliver-vocabulary/choice-review';
import {
  choiceReviewPromptClass,
  choiceReviewPromptTone,
  choiceReviewTone,
} from '@/lib/oliver-vocabulary/choice-review';

import { ChoiceOptions } from './choice-options';
import { ChoiceReviewHint } from './choice-review-hint';
import { SubmitAnswersBar } from './submit-answers-bar';

interface ReadingQuestionsSectionProps {
  questions: ReadingQuestion[];
  answers: Record<string, string>;
  onSelect: (questionId: string, option: string) => void;
  results?: Record<string, ChoiceReviewMark>;
  submitted?: boolean;
  submitting?: boolean;
  score?: string | null;
  onSubmit?: () => void;
}

export function ReadingQuestionsSection({
  questions,
  answers,
  onSelect,
  results,
  submitted = false,
  submitting = false,
  score,
  onSubmit,
}: ReadingQuestionsSectionProps) {
  return (
    <section
      className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]"
      data-section="reading-questions"
    >
      <h3 className="font-serif text-xl">Section 4 · Reading Questions</h3>
      <ol className="mt-4 grid list-decimal gap-5 pl-5">
        {questions.map((question) => {
          const promptId = `${question.id}-prompt`;
          const marked = results?.[question.id];
          return (
            <li
              key={question.id}
              data-reading-question={question.id}
              data-review-result={marked ? (marked.correct ? 'correct' : 'incorrect') : undefined}
            >
              <p
                id={promptId}
                data-review-prompt-tone={choiceReviewPromptTone(marked)}
                className={choiceReviewPromptClass(marked)}
              >
                {question.prompt}
              </p>
              <p className="text-xs uppercase tracking-wide text-[#c9a227]">
                {question.type.replaceAll('_', ' ')}
              </p>
              <ChoiceOptions
                name={question.id}
                options={question.options}
                selected={answers[question.id]}
                labelledBy={promptId}
                disabled={submitted}
                optionTone={(option) => choiceReviewTone(option, marked)}
                onSelect={(option) => onSelect(question.id, option)}
              />
              <ChoiceReviewHint mark={marked} />
            </li>
          );
        })}
      </ol>
      {onSubmit ? (
        <SubmitAnswersBar
          section="reading"
          onSubmit={onSubmit}
          submitting={submitting}
          submitted={submitted}
          score={score}
          hint="Choose an answer for each question, then submit to see which are correct."
        />
      ) : null}
    </section>
  );
}
