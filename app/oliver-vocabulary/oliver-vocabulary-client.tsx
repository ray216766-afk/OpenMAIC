'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Check, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  DailyLesson,
  ParentLessonReference,
  ProgressEntry,
  QuizAnswer,
} from '@/Oliver_Vocabulary_System/types';

interface LessonPayload {
  success: boolean;
  action?: string;
  lesson?: DailyLesson;
  parent_reference?: ParentLessonReference;
  progress?: ProgressEntry[];
  error?: string;
}

interface ProgressPayload {
  success: boolean;
  summary?: {
    master_word_count: number;
    tracked_words: number;
    last_completed_day: number;
    by_mastery: Record<string, number>;
  };
  progress?: { entries: ProgressEntry[] };
}

function familyLine(family: Record<string, string | undefined>): string {
  return Object.entries(family)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join(' · ');
}

export function OliverVocabularyClient() {
  const [day, setDay] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [parent, setParent] = useState<ParentLessonReference | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [summary, setSummary] = useState<ProgressPayload['summary']>();
  const [showParent, setShowParent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProgress = useCallback(async () => {
    const res = await fetch('/api/oliver-vocabulary/progress');
    const data = (await res.json()) as ProgressPayload;
    if (data.success) {
      setSummary(data.summary);
      setProgress(data.progress?.entries ?? []);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    setQuizScore(null);
    setAnswers({});
    try {
      const res = await fetch('/api/oliver-vocabulary/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, persist: true }),
      });
      const data = (await res.json()) as LessonPayload;
      if (!res.ok || !data.lesson) {
        throw new Error(data.error || 'Could not generate the lesson');
      }
      setLesson(data.lesson);
      setParent(data.parent_reference ?? null);
      setProgress(data.progress ?? []);
      await loadProgress();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  }, [day, loadProgress]);

  const submitQuiz = useCallback(async () => {
    if (!lesson) return;
    const payload: QuizAnswer[] = lesson.review_exercises
      .filter((exercise) => answers[exercise.id])
      .map((exercise) => ({ exerciseId: exercise.id, answer: answers[exercise.id] }));
    if (payload.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/oliver-vocabulary/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: lesson.day, answers: payload }),
      });
      const data = (await res.json()) as {
        success: boolean;
        quiz?: { correct: number; total: number; correct_rate: number };
      };
      if (data.quiz) {
        setQuizScore(
          `${data.quiz.correct}/${data.quiz.total} correct (${data.quiz.correct_rate}%)`,
        );
      }
      await loadProgress();
    } finally {
      setSubmitting(false);
    }
  }, [answers, lesson, loadProgress]);

  const masteryCounts = useMemo(
    () => summary?.by_mastery ?? { New: 0, Learning: 0, Developing: 0, Mastered: 0 },
    [summary],
  );

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#1f2430]">
      <header className="border-b border-[#d9cfc0] bg-[#1f3a5f] text-[#f6f1e8]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8">
          <p className="text-xs tracking-[0.2em] uppercase text-[#d4b87a]">OpenMAIC · V1.0</p>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">
            Oliver Scholarship Vocabulary Master
          </h1>
          <p className="max-w-3xl text-sm text-[#e8dfd0]">
            English-only daily training for EduTest and Australian private-school scholarship
            English. Chinese is stored for parent reference and never appears in the student lesson.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <label className="text-sm text-[#e8dfd0]" htmlFor="day-input">
              Day
            </label>
            <Input
              id="day-input"
              type="number"
              min={1}
              value={day}
              onChange={(event) => setDay(Math.max(1, Number(event.target.value) || 1))}
              className="w-24 bg-white text-[#1f2430]"
            />
            <Button
              onClick={() => void generate()}
              disabled={loading}
              className="bg-[#c9a227] text-[#1f2430] hover:bg-[#b8911c]"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              Generate Oliver Vocabulary Lesson Day {day}
            </Button>
            <Link href="/" className="text-sm text-[#d4b87a] underline-offset-4 hover:underline">
              Back to OpenMAIC
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#e4d9c8] md:grid-cols-5">
          <Stat label="Bank" value={summary?.master_word_count ?? '—'} />
          <Stat label="Tracked" value={summary?.tracked_words ?? progress.length} />
          <Stat label="New" value={masteryCounts.New ?? 0} />
          <Stat
            label="Learning / Developing"
            value={`${masteryCounts.Learning ?? 0} / ${masteryCounts.Developing ?? 0}`}
          />
          <Stat label="Mastered" value={masteryCounts.Mastered ?? 0} />
        </section>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

        {!lesson && (
          <div className="rounded-xl border border-dashed border-[#cfc3ae] bg-white/60 px-6 py-16 text-center">
            <BookOpen className="mx-auto mb-3 text-[#1f3a5f]" />
            <p className="font-serif text-xl">Ready to generate a day.</p>
            <p className="mt-2 text-sm text-[#5c6574]">
              Day 1 introduces the first ten Core Upgrade words. Day 25 is a mid-curriculum
              scholarship set with a full review from earlier days.
            </p>
          </div>
        )}

        {lesson && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">{lesson.title}</h2>
              <Button variant="outline" onClick={() => setShowParent((value) => !value)}>
                {showParent ? 'Hide parent Chinese' : 'Parent reference (Chinese)'}
              </Button>
            </div>

            {showParent && parent && (
              <section className="rounded-xl bg-[#fff8e8] p-5 ring-1 ring-[#ead9a8]">
                <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                  Parent reference only
                </h3>
                <ul className="grid gap-2 md:grid-cols-2">
                  {parent.words.map((word) => (
                    <li key={word.id} className="text-sm">
                      <span className="font-semibold">{word.word}</span> — {word.chinese}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 1 · New Vocabulary</h3>
              <p className="mb-4 text-xs uppercase tracking-wide text-[#7a7266]">
                Word · Definition · Synonyms · Antonyms · Word family · Collocations · Example
              </p>
              <div className="grid gap-4">
                {lesson.new_vocabulary.map((card) => (
                  <article key={card.id} className="border-b border-[#efe6d8] pb-4 last:border-0">
                    <h4 className="text-lg font-semibold text-[#1f3a5f]">{card.word}</h4>
                    <p className="mt-1">{card.definition}</p>
                    <p className="mt-2 text-sm text-[#5c6574]">
                      <strong>Synonyms:</strong> {card.synonyms.join(', ') || '—'}
                    </p>
                    <p className="text-sm text-[#5c6574]">
                      <strong>Antonyms:</strong> {card.antonyms.join(', ') || '—'}
                    </p>
                    <p className="text-sm text-[#5c6574]">
                      <strong>Word family:</strong> {familyLine(card.word_family) || '—'}
                    </p>
                    <p className="text-sm text-[#5c6574]">
                      <strong>Collocations:</strong> {card.collocations.join('; ')}
                    </p>
                    <p className="mt-1 italic">{card.example_sentence}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 2 · Review Vocabulary</h3>
              <p className="mb-4 text-sm text-[#5c6574]">
                {lesson.review_vocabulary.map((card) => card.word).join(' · ')}
              </p>
              <div className="grid gap-5">
                {lesson.review_exercises.map((exercise) => (
                  <div key={exercise.id}>
                    <p className="font-medium">
                      <span className="mr-2 text-xs uppercase tracking-wide text-[#c9a227]">
                        {exercise.type.replaceAll('_', ' ')}
                      </span>
                      {exercise.prompt}
                    </p>
                    <div className="mt-2 flex flex-col gap-2">
                      {exercise.options?.map((option) => (
                        <label
                          key={option}
                          className={cn(
                            'flex cursor-pointer items-start gap-2 rounded-md border px-3 py-2 text-sm',
                            answers[exercise.id] === option
                              ? 'border-[#1f3a5f] bg-[#eef3f8]'
                              : 'border-[#e4d9c8]',
                          )}
                        >
                          <input
                            type="radio"
                            className="mt-1"
                            name={exercise.id}
                            checked={answers[exercise.id] === option}
                            onChange={() =>
                              setAnswers((current) => ({ ...current, [exercise.id]: option }))
                            }
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button onClick={() => void submitQuiz()} disabled={submitting}>
                  {submitting ? <Loader2 className="animate-spin" /> : <Check />}
                  Mark review and update progress
                </Button>
                {quizScore && <p className="text-sm font-medium text-[#1f3a5f]">{quizScore}</p>}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 3 · Mini Reading</h3>
              <p className="mt-1 text-sm text-[#7a7266]">
                {lesson.mini_reading.title} · {lesson.mini_reading.theme.replaceAll('_', ' ')} ·{' '}
                {lesson.mini_reading.word_count} words
              </p>
              <p className="mt-4 whitespace-pre-wrap leading-7">{lesson.mini_reading.passage}</p>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 4 · Reading Questions</h3>
              <ol className="mt-4 grid list-decimal gap-5 pl-5">
                {lesson.reading_questions.map((question) => (
                  <li key={question.id}>
                    <p className="font-medium">{question.prompt}</p>
                    <p className="text-xs uppercase tracking-wide text-[#c9a227]">
                      {question.type.replaceAll('_', ' ')}
                    </p>
                    <ul className="mt-2 grid gap-1 text-sm">
                      {question.options.map((option) => (
                        <li key={option} className="rounded bg-[#f6f1e8] px-3 py-1.5">
                          {option}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#7a7266]">{label}</p>
      <p className="font-serif text-2xl">{value}</p>
    </div>
  );
}
