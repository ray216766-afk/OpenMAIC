'use client';

import { useState } from 'react';

import { ChoiceOptions } from '@/components/oliver-vocabulary/choice-options';
import { ChoiceReviewHint } from '@/components/oliver-vocabulary/choice-review-hint';
import { SubmitAnswersBar } from '@/components/oliver-vocabulary/submit-answers-bar';
import { choiceReviewPromptClass, choiceReviewTone } from '@/lib/oliver-vocabulary/choice-review';
import { choiceMarkFromItem } from '@/Naplan_Y5_System/Review_Engine/mark';
import type {
  AnswerValue,
  ItemMark,
  StrandSummary,
  StudentQuestion,
} from '@/Naplan_Y5_System/types';

export interface SessionResult {
  score_label: string;
  strand_summary: StrandSummary[];
  marks: ItemMark[];
  saved_wrong: number;
}

export function PracticeSession({
  title,
  note,
  passageTitle,
  passage,
  questions,
  submitting,
  result,
  onSubmit,
  onExit,
}: {
  title: string;
  note?: string;
  passageTitle?: string | null;
  passage?: string | null;
  questions: StudentQuestion[];
  submitting: boolean;
  result: SessionResult | null;
  onSubmit: (answers: Record<string, AnswerValue>, bookmarks: string[]) => void;
  onExit: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const marks = new Map(result?.marks.map((mark) => [mark.question_id, mark]));

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <button type="button" className="text-sm text-[#1f3a5f] underline" onClick={onExit}>
          Back to the list
        </button>
      </div>
      {note ? <p className="mt-2 text-sm text-[#5c6574]">{note}</p> : null}
      {passageTitle ? (
        <p className="mt-3 font-semibold text-[#1f3a5f]">Passage: {passageTitle}</p>
      ) : null}
      {passage ? <p className="mt-3 whitespace-pre-wrap leading-7">{passage}</p> : null}

      <div className="mt-6 flex flex-col gap-6">
        {questions.map((question) => {
          const mark = marks.get(question.id);
          const choiceMark = choiceMarkFromItem(mark);
          const selected = answers[question.id];
          return (
            <article key={question.id} className="border-b border-[#efe6d8] pb-4 last:border-0">
              <p className={choiceReviewPromptClass(choiceMark)}>
                <span className="mr-2 text-xs tracking-wide text-[#c9a227] uppercase">
                  {question.strand}
                  {question.scoreable ? '' : ' · no key'}
                </span>
                {question.number}. {question.prompt}
              </p>
              {question.image_heavy ? (
                <p className="mt-1 text-sm text-[#7a7266]">
                  Image-heavy item. The figure is in the Word file.
                </p>
              ) : null}
              {question.response_kind === 'text' || question.options.length === 0 ? (
                <input
                  className="mt-2 w-full rounded-md border border-[#e4d9c8] px-3 py-2"
                  value={typeof selected === 'string' ? selected : ''}
                  disabled={Boolean(result)}
                  onChange={(event) =>
                    setAnswers((current) => ({ ...current, [question.id]: event.target.value }))
                  }
                />
              ) : question.response_kind === 'multi' ? (
                <MultiOptions
                  name={question.id}
                  options={question.options}
                  selected={Array.isArray(selected) ? selected : []}
                  disabled={Boolean(result)}
                  mark={mark}
                  onChange={(next) =>
                    setAnswers((current) => ({ ...current, [question.id]: next }))
                  }
                />
              ) : (
                <ChoiceOptions
                  name={question.id}
                  options={question.options}
                  selected={typeof selected === 'string' ? selected : undefined}
                  disabled={Boolean(result)}
                  optionTone={(option) => choiceReviewTone(option, choiceMark)}
                  onSelect={(option) =>
                    setAnswers((current) => ({ ...current, [question.id]: option }))
                  }
                />
              )}
              <ChoiceReviewHint mark={choiceMark ?? undefined} />
              {!question.scoreable && !result ? (
                <label className="mt-2 flex items-center gap-2 text-sm text-[#5c6574]">
                  <input
                    type="checkbox"
                    checked={bookmarks.includes(question.id)}
                    onChange={() =>
                      setBookmarks((current) =>
                        current.includes(question.id)
                          ? current.filter((id) => id !== question.id)
                          : [...current, question.id],
                      )
                    }
                  />
                  Save this item to the 错题题库
                </label>
              ) : null}
            </article>
          );
        })}
      </div>

      {result ? (
        <div className="mt-6 rounded-lg bg-[#eef3f8] px-4 py-3 text-sm text-[#1f3a5f]">
          <p data-score-label>{result.score_label}</p>
          <p className="mt-1">{result.saved_wrong} item(s) added to the 错题题库.</p>
          <ul className="mt-3 grid gap-1">
            {result.strand_summary.map((strand) => (
              <li key={strand.strand}>
                {strand.strand}:{' '}
                {strand.scored === 0 ? 'not scored' : `${strand.correct}/${strand.scored}`}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <SubmitAnswersBar
          section="review"
          submitting={submitting}
          submitted={false}
          onSubmit={() => onSubmit(answers, bookmarks)}
          hint="Submit to lock this attempt. Scoreable items use the capture suggestion, not an official key."
        />
      )}
    </section>
  );
}

function MultiOptions({
  name,
  options,
  selected,
  disabled,
  mark,
  onChange,
}: {
  name: string;
  options: string[];
  selected: string[];
  disabled: boolean;
  mark?: ItemMark;
  onChange: (next: string[]) => void;
}) {
  const expected = mark?.expected?.split(' · ') ?? [];
  return (
    <div className="mt-2 flex flex-col gap-2">
      {options.map((option) => {
        const checked = selected.includes(option);
        const tone =
          mark?.scored && expected.includes(option)
            ? 'correct'
            : mark?.scored && checked
              ? 'incorrect'
              : 'default';
        return (
          <label
            key={`${name}:${option}`}
            data-option-tone={tone}
            className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
              tone === 'correct'
                ? 'border-emerald-700 bg-emerald-50 text-emerald-950'
                : tone === 'incorrect'
                  ? 'border-red-600 bg-red-50 text-red-900'
                  : checked
                    ? 'border-[#1f3a5f] bg-[#eef3f8]'
                    : 'border-[#e4d9c8]'
            }`}
          >
            <input
              type="checkbox"
              className="mt-1"
              checked={checked}
              disabled={disabled}
              onChange={() =>
                onChange(
                  checked ? selected.filter((item) => item !== option) : [...selected, option],
                )
              }
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}
