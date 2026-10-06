'use client';

import { useState } from 'react';

import { ChoiceOptions } from '@/components/oliver-vocabulary/choice-options';
import type {
  PlacementRecommendation,
  PlacementReport,
  PlacementStudentQuestion,
} from '@/Naplan_Y5_System/types';

export function PlacementSit({
  title,
  description,
  questions,
  submitting,
  scoreLabel,
  report,
  onSubmit,
  onExit,
  onOpenEntry,
}: {
  title: string;
  description: string;
  questions: PlacementStudentQuestion[];
  submitting: boolean;
  scoreLabel: string | null;
  report: PlacementReport | null;
  onSubmit: (answers: Record<string, string>, teacherMarks: Record<string, boolean>) => void;
  onExit: () => void;
  onOpenEntry: (catalogId: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [teacherMarks, setTeacherMarks] = useState<Record<string, boolean>>({});
  const question = questions[index];
  const last = index === questions.length - 1;

  if (report && scoreLabel) {
    return (
      <PlacementResult
        scoreLabel={scoreLabel}
        report={report}
        questions={questions}
        answers={answers}
        teacherMarks={teacherMarks}
        submitting={submitting}
        onTeacherMark={(id, correct) =>
          setTeacherMarks((current) => ({ ...current, [id]: correct }))
        }
        onApply={() => onSubmit(answers, teacherMarks)}
        onExit={onExit}
        onOpenEntry={onOpenEntry}
      />
    );
  }

  if (!question) return null;

  return (
    <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-serif text-2xl">{title}</h2>
        <button type="button" className="text-sm text-[#1f3a5f] underline" onClick={onExit}>
          Back to the list
        </button>
      </div>
      <p className="mt-2 text-sm text-[#5c6574]">{description}</p>
      <p className="mt-2 text-sm text-[#5c6574]">
        Question {question.number} of {questions.length}. One item at a time, from the first to the
        last. A blank is allowed. Keys are not invented; a stored correct_answer is scored when it
        exists.
      </p>
      <p className="mt-4 text-xs tracking-wide text-[#c9a227] uppercase">
        {question.subject} · {question.strand} · {question.level}
        {question.scoreable ? '' : ' · no key yet'}
      </p>
      <p id={`placement-${question.id}`} className="mt-2 text-lg leading-7">
        {question.number}. {question.prompt}
      </p>
      <ChoiceOptions
        name={question.id}
        labelledBy={`placement-${question.id}`}
        options={question.options}
        selected={answers[question.id]}
        onSelect={(option) => setAnswers((current) => ({ ...current, [question.id]: option }))}
      />
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm text-[#1f3a5f] ring-1 ring-[#d9cfc0] disabled:opacity-40"
          disabled={index === 0 || submitting}
          onClick={() => setIndex((current) => Math.max(0, current - 1))}
        >
          Back
        </button>
        {last ? (
          <button
            type="button"
            data-finish-placement
            className="rounded-md bg-[#c9a227] px-4 py-2 text-sm font-medium text-[#1f2430] disabled:opacity-60"
            disabled={submitting}
            onClick={() => onSubmit(answers, teacherMarks)}
          >
            {submitting ? 'Saving…' : 'Finish placement test'}
          </button>
        ) : (
          <button
            type="button"
            data-placement-next
            className="rounded-md bg-[#1f3a5f] px-4 py-2 text-sm font-medium text-[#f6f1e8]"
            onClick={() => setIndex((current) => Math.min(questions.length - 1, current + 1))}
          >
            Next question
          </button>
        )}
      </div>
    </section>
  );
}

function PlacementResult({
  scoreLabel,
  report,
  questions,
  answers,
  teacherMarks,
  submitting,
  onTeacherMark,
  onApply,
  onExit,
  onOpenEntry,
}: {
  scoreLabel: string;
  report: PlacementReport;
  questions: PlacementStudentQuestion[];
  answers: Record<string, string>;
  teacherMarks: Record<string, boolean>;
  submitting: boolean;
  onTeacherMark: (id: string, correct: boolean) => void;
  onApply: () => void;
  onExit: () => void;
  onOpenEntry: (catalogId: string) => void;
}) {
  const pending = questions.filter((question) => !question.scoreable && answers[question.id]);
  const grouped = new Map<string, PlacementRecommendation[]>();
  for (const item of report.recommendations) {
    const list = grouped.get(item.strand) ?? [];
    list.push(item);
    grouped.set(item.strand, list);
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-2xl">Placement results</h2>
          <button type="button" className="text-sm text-[#1f3a5f] underline" onClick={onExit}>
            Back to the list
          </button>
        </div>
        <p className="mt-3 text-sm font-medium text-[#1f3a5f]" data-placement-score>
          {scoreLabel}
        </p>
        <p className="mt-2 text-sm text-[#5c6574]">
          Answered {report.answered} of {report.total}. A strand under 60% is a weak spot when a key
          or a teacher mark exists. Until a key is filled in, answered strands stay provisional and
          still recommend practice. Spelling stays on the practice list; this paper is light on
          spelling because those captures are audio-heavy.
        </p>
        <ul className="mt-4 flex flex-col gap-2 text-sm">
          {report.strands.map((strand) => (
            <li key={strand.strand} className="rounded-md bg-[#f6f1e8] px-3 py-2">
              <span className="font-semibold">{strand.strand}</span>
              <span className="text-[#5c6574]">
                {' '}
                · {strand.answered}/{strand.total} answered
                {strand.scored > 0
                  ? ` · ${strand.correct}/${strand.scored} scored (${Math.round((strand.accuracy ?? 0) * 100)}%)`
                  : ' · awaiting a key'}
                {strand.weak ? ' · weak spot' : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {pending.length > 0 ? (
        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
          <h3 className="font-serif text-xl">Teacher mark</h3>
          <p className="mt-2 text-sm text-[#5c6574]">
            These answers have no stored key. Mark them right or wrong to update the strand
            percentages. This does not write an Excel answer.
          </p>
          <ul className="mt-4 flex flex-col gap-4">
            {pending.map((question) => (
              <li key={question.id} className="border-b border-[#efe6d8] pb-3 text-sm">
                <p>
                  {question.number}. {question.prompt}
                </p>
                <p className="mt-1 text-[#5c6574]">
                  Your answer: {answers[question.id]}
                  {teacherMarks[question.id] == null
                    ? ''
                    : teacherMarks[question.id]
                      ? ' · marked correct'
                      : ' · marked incorrect'}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className="rounded-md px-3 py-1 ring-1 ring-[#d9cfc0]"
                    onClick={() => onTeacherMark(question.id, true)}
                  >
                    Mark correct
                  </button>
                  <button
                    type="button"
                    className="rounded-md px-3 py-1 ring-1 ring-[#d9cfc0]"
                    onClick={() => onTeacherMark(question.id, false)}
                  >
                    Mark incorrect
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="mt-4 rounded-md bg-[#1f3a5f] px-4 py-2 text-sm text-[#f6f1e8] disabled:opacity-60"
            disabled={submitting || Object.keys(teacherMarks).length === 0}
            onClick={onApply}
          >
            {submitting ? 'Saving…' : 'Update strand results'}
          </button>
        </section>
      ) : null}

      <section className="rounded-xl bg-[#fff8e8] p-6 ring-1 ring-[#ead9a8]">
        <h3 className="font-serif text-xl">Weak spots and practice to do next</h3>
        {report.recommendations.length === 0 ? (
          <p className="mt-2 text-sm text-[#5c6574]">
            No strand is under 60%, and no answered strand is still waiting on a key.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-4">
            {[...grouped.entries()].map(([strand, items]) => (
              <div key={strand}>
                <p className="text-xs tracking-wide text-[#7a7266] uppercase">{strand}</p>
                <ul className="mt-1 flex flex-col gap-2 text-sm">
                  {items.map((item) => (
                    <li key={item.catalog_id}>
                      <button
                        type="button"
                        className="font-semibold text-[#1f3a5f] underline"
                        data-open-entry={item.catalog_id}
                        onClick={() => onOpenEntry(item.catalog_id)}
                      >
                        {item.title}
                      </button>
                      <span className="text-[#5c6574]">
                        {' '}
                        · {item.level} — {item.reason}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
