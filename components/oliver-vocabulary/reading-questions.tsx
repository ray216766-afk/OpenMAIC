'use client';

import type { ReadingQuestion } from '@/Oliver_Vocabulary_System/types';

import { ChoiceOptions } from './choice-options';

interface ReadingQuestionsSectionProps {
  questions: ReadingQuestion[];
  answers: Record<string, string>;
  onSelect: (questionId: string, option: string) => void;
}

export function ReadingQuestionsSection({
  questions,
  answers,
  onSelect,
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
          return (
            <li key={question.id} data-reading-question={question.id}>
              <p id={promptId} className="font-medium">
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
                onSelect={(option) => onSelect(question.id, option)}
              />
            </li>
          );
        })}
      </ol>
    </section>
  );
}
