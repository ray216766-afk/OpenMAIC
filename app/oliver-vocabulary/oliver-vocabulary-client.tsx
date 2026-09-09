'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Loader2, Sparkles } from 'lucide-react';

import { ChoiceOptions } from '@/components/oliver-vocabulary/choice-options';
import { ChoiceReviewHint } from '@/components/oliver-vocabulary/choice-review-hint';
import { ListenButton } from '@/components/oliver-vocabulary/listen-button';
import { ReadingQuestionsSection } from '@/components/oliver-vocabulary/reading-questions';
import { SubmitAnswersBar } from '@/components/oliver-vocabulary/submit-answers-bar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  type ChoiceReviewMark,
  choiceReviewPromptClass,
  choiceReviewPromptTone,
  choiceReviewTone,
} from '@/lib/oliver-vocabulary/choice-review';
import {
  readingAnswersFromAttempt,
  readingResultsFromAttempt,
  readingScoreFromAttempt,
  reviewAnswersFromAttempt,
  reviewResultsFromAttempt,
} from '@/lib/oliver-vocabulary/restore-attempt';
import { useBritishSpeech } from '@/lib/oliver-vocabulary/use-british-speech';
import { formatWordFamily } from '@/Oliver_Vocabulary_System/normalize';
import type {
  DailyLesson,
  FrozenReadingAttempt,
  FrozenReviewAttempt,
  ParentLessonReference,
  ProgressEntry,
  QuizAnswer,
  QuizItemResult,
  StudentVocabularyCard,
  WordFamily,
} from '@/Oliver_Vocabulary_System/types';

interface LessonPayload {
  success: boolean;
  action?: string;
  lesson?: DailyLesson;
  parent_reference?: ParentLessonReference;
  progress?: ProgressEntry[];
  locked?: boolean;
  source?: 'generated' | 'snapshot';
  review_attempt?: FrozenReviewAttempt | null;
  reading_attempt?: FrozenReadingAttempt | null;
  error?: string;
}

interface ProgressPayload {
  success: boolean;
  summary?: {
    master_word_count: number;
    active_bank?: string;
    active_bank_label?: string;
    expansion_target?: number;
    tracked_words: number;
    last_completed_day: number;
    locked_days?: number[];
    by_mastery: Record<string, number>;
  };
  progress?: { entries: ProgressEntry[] };
}

function familyLine(family: WordFamily | undefined): string {
  return formatWordFamily(family);
}

export function OliverVocabularyClient() {
  const [day, setDay] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [parent, setParent] = useState<ParentLessonReference | null>(null);
  const [progress, setProgress] = useState<ProgressEntry[]>([]);
  const [summary, setSummary] = useState<ProgressPayload['summary']>();
  const [showParent, setShowParent] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<string, string>>({});
  const [quizScore, setQuizScore] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<Record<string, QuizItemResult>>({});
  const [reviewMarked, setReviewMarked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [readingResults, setReadingResults] = useState<Record<string, ChoiceReviewMark>>({});
  const [readingScore, setReadingScore] = useState<string | null>(null);
  const [readingSubmitted, setReadingSubmitted] = useState(false);
  const [lessonLocked, setLessonLocked] = useState(false);
  const [lockedDays, setLockedDays] = useState<number[]>([]);
  const { supported: speechSupported, speakingId, toggle: toggleSpeech } = useBritishSpeech();

  const loadProgress = useCallback(async () => {
    const res = await fetch('/api/oliver-vocabulary/progress');
    const data = (await res.json()) as ProgressPayload;
    if (data.success) {
      setSummary(data.summary);
      setProgress(data.progress?.entries ?? []);
      setLockedDays(data.summary?.locked_days ?? []);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  const applyLessonPayload = useCallback((data: LessonPayload) => {
    if (!data.lesson) return;
    setLesson(data.lesson);
    setParent(data.parent_reference ?? null);
    setProgress(data.progress ?? []);
    setLessonLocked(Boolean(data.locked || data.source === 'snapshot'));

    if (data.review_attempt) {
      setAnswers(reviewAnswersFromAttempt(data.review_attempt));
      setQuizResults(reviewResultsFromAttempt(data.review_attempt));
      setQuizScore(
        `${data.review_attempt.correct}/${data.review_attempt.total} correct (${data.review_attempt.correct_rate}%)`,
      );
      setReviewMarked(true);
    } else {
      setAnswers({});
      setQuizResults({});
      setQuizScore(null);
      setReviewMarked(false);
    }

    if (data.reading_attempt) {
      setReadingAnswers(readingAnswersFromAttempt(data.reading_attempt));
      setReadingResults(readingResultsFromAttempt(data.reading_attempt));
      setReadingScore(readingScoreFromAttempt(data.reading_attempt));
      setReadingSubmitted(true);
    } else {
      setReadingAnswers({});
      setReadingResults({});
      setReadingScore(null);
      setReadingSubmitted(false);
    }
  }, []);

  const generate = useCallback(
    async (reset = false) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/oliver-vocabulary/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ day, persist: true, reset }),
        });
        const data = (await res.json()) as LessonPayload;
        if (!res.ok || !data.lesson) {
          throw new Error(data.error || 'Could not generate the lesson');
        }
        applyLessonPayload(data);
        await loadProgress();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Generation failed');
      } finally {
        setLoading(false);
      }
    },
    [applyLessonPayload, day, loadProgress],
  );

  const resetDay = useCallback(() => {
    const confirmed = window.confirm(
      `Parent/admin: Reset Day ${day}? This deletes the frozen lesson and submitted answers so the day can be generated again. Oliver's usual Open button will not do this.`,
    );
    if (!confirmed) return;
    void generate(true);
  }, [day, generate]);

  const applyQuiz = useCallback(
    (quiz: {
      correct: number;
      total: number;
      correct_rate: number;
      results?: QuizItemResult[];
    }) => {
      setQuizScore(`${quiz.correct}/${quiz.total} correct (${quiz.correct_rate}%)`);
      const nextResults: Record<string, QuizItemResult> = {};
      for (const result of quiz.results ?? []) {
        nextResults[result.exerciseId] = result;
      }
      setQuizResults(nextResults);
      setReviewMarked(true);
    },
    [],
  );

  const submitQuiz = useCallback(async () => {
    if (!lesson) return;
    // Same completed attempt: do not re-grade. Only Generate starts a new grade.
    if (reviewMarked) return;
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
        quiz?: {
          correct: number;
          total: number;
          correct_rate: number;
          results?: QuizItemResult[];
        };
      };
      if (data.quiz) {
        applyQuiz(data.quiz);
      }
      await loadProgress();
    } finally {
      setSubmitting(false);
    }
  }, [answers, applyQuiz, lesson, loadProgress, reviewMarked]);

  const submitReading = useCallback(async () => {
    if (!lesson || readingSubmitted) return;
    const payload = lesson.reading_questions
      .filter((question) => readingAnswers[question.id])
      .map((question) => ({ questionId: question.id, answer: readingAnswers[question.id] }));
    if (payload.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/oliver-vocabulary/reading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day: lesson.day, answers: payload }),
      });
      const data = (await res.json()) as {
        success: boolean;
        reading?: FrozenReadingAttempt;
        error?: string;
      };
      if (data.reading) {
        setReadingAnswers(readingAnswersFromAttempt(data.reading));
        setReadingResults(readingResultsFromAttempt(data.reading));
        setReadingScore(readingScoreFromAttempt(data.reading));
        setReadingSubmitted(true);
        setLessonLocked(true);
      }
    } finally {
      setSubmitting(false);
    }
  }, [lesson, readingAnswers, readingSubmitted]);

  const masteryCounts = useMemo(
    () => summary?.by_mastery ?? { New: 0, Learning: 0, Developing: 0, Mastered: 0 },
    [summary],
  );

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#1f2430]">
      <header className="border-b border-[#d9cfc0] bg-[#1f3a5f] text-[#f6f1e8]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8">
          <p className="text-xs tracking-[0.2em] uppercase text-[#d4b87a]">
            OpenMAIC · V1.1 · Academic Core Batch 1
          </p>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">
            Oliver Scholarship Vocabulary Master
          </h1>
          <p className="max-w-3xl text-sm text-[#e8dfd0]">
            English-only daily training for EduTest and Australian private-school scholarship
            English. The live bank is Academic Core Batch 1 (100 words). A word taught as New is
            never New again — only Review. The batch does not wrap. Later approved batches expand
            toward about 1500. Listen speaks each headword in standard British English (en-GB).
            Chinese is parent-only and never appears in the student lesson.
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
              onClick={() => void generate(false)}
              disabled={loading}
              className="bg-[#c9a227] text-[#1f2430] hover:bg-[#b8911c]"
              data-lesson-action={lockedDays.includes(day) ? 'open-locked' : 'generate'}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {lockedDays.includes(day)
                ? `Open locked Day ${day}`
                : `Generate Oliver Vocabulary Lesson Day ${day}`}
            </Button>
            {lockedDays.includes(day) ? (
              <Button
                variant="outline"
                onClick={resetDay}
                disabled={loading}
                data-reset-day
                className="border-[#d4b87a] text-[#f6f1e8] hover:bg-[#2a4d78]"
              >
                Parent/admin: Reset this day
              </Button>
            ) : null}
            <Link href="/" className="text-sm text-[#d4b87a] underline-offset-4 hover:underline">
              Back to OpenMAIC
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#e4d9c8] md:grid-cols-5">
          <Stat
            label="Bank"
            value={summary?.master_word_count ?? '—'}
            hint={summary?.active_bank_label ?? 'Academic Core Batch 1 (100)'}
          />
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
              Day 1 introduces the first ten unused Academic Core words (analyse, significant,
              environment…). Later days continue through unused words only. Already-taught words
              return in Review Vocabulary, never again as New. The 100-word batch does not wrap.
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
            {lessonLocked ? (
              <p
                className="rounded-lg bg-[#eef3f8] px-4 py-3 text-sm text-[#1f3a5f]"
                data-day-locked="true"
              >
                This day is locked. Opening it again loads the same lesson and your submitted
                answers (wrong in red, correct in green). Casual Generate will not create a new
                lesson. A parent or admin can use Reset this day if you truly need a fresh start.
              </p>
            ) : null}

            {showParent && parent && (
              <section className="rounded-xl bg-[#fff8e8] p-5 ring-1 ring-[#ead9a8]">
                <h3 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                  Parent reference only
                </h3>
                <ul className="grid gap-2 md:grid-cols-2">
                  {parent.words.map((word) => (
                    <li key={word.id} className="text-sm">
                      <span className="font-semibold">{word.word}</span> — {word.chinese}
                      {word.detailed_definition ? (
                        <span className="mt-1 block text-[#5c6574]">
                          {word.detailed_definition}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 1 · New Vocabulary</h3>
              <p className="mb-4 text-xs uppercase tracking-wide text-[#7a7266]">
                Word · Listen (British English, en-GB) · POS · Simple definition · Synonyms ·
                Antonyms · Word family · Collocations · Example · Creative upgrade
              </p>
              <div className="grid gap-4">
                {lesson.new_vocabulary.map((card) => (
                  <NewVocabularyCard
                    key={card.id}
                    card={card}
                    speakingId={speakingId}
                    speechSupported={speechSupported}
                    onToggleSpeech={toggleSpeech}
                  />
                ))}
              </div>
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 2 · Review Vocabulary</h3>
              <ul className="mb-4 flex flex-wrap gap-2">
                {lesson.review_vocabulary.map((card) => (
                  <li
                    key={card.id}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e4d9c8] bg-[#f6f1e8] px-2.5 py-1.5"
                  >
                    <span className="text-sm font-semibold text-[#1f3a5f]">{card.word}</span>
                    <ListenButton
                      word={card.word}
                      utteranceId={`review-word:${card.id}`}
                      text={card.word}
                      speakingId={speakingId}
                      supported={speechSupported}
                      onToggle={toggleSpeech}
                    />
                  </li>
                ))}
              </ul>
              <div className="grid gap-5">
                {lesson.review_exercises.map((exercise) => {
                  const marked = quizResults[exercise.id];
                  return (
                    <div
                      key={exercise.id}
                      data-review-result={
                        marked ? (marked.correct ? 'correct' : 'incorrect') : undefined
                      }
                    >
                      <p
                        data-review-prompt-tone={choiceReviewPromptTone(marked)}
                        className={choiceReviewPromptClass(marked)}
                      >
                        <span className="mr-2 text-xs uppercase tracking-wide text-[#c9a227]">
                          {exercise.type.replaceAll('_', ' ')}
                        </span>
                        {exercise.prompt}
                      </p>
                      {exercise.options ? (
                        <ChoiceOptions
                          name={exercise.id}
                          options={exercise.options}
                          selected={answers[exercise.id]}
                          disabled={reviewMarked}
                          optionTone={(option) => choiceReviewTone(option, marked)}
                          onSelect={(option) =>
                            setAnswers((current) => ({ ...current, [exercise.id]: option }))
                          }
                        />
                      ) : null}
                      <ChoiceReviewHint mark={marked} />
                    </div>
                  );
                })}
              </div>
              <SubmitAnswersBar
                section="review"
                onSubmit={() => void submitQuiz()}
                submitting={submitting}
                submitted={reviewMarked}
                score={quizScore}
                hint="Choose your review answers, then submit to lock them and see your score. The grade stays frozen for this attempt."
              />
            </section>

            <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
              <h3 className="font-serif text-xl">Section 3 · Mini Reading</h3>
              <p className="mt-1 text-sm text-[#7a7266]">
                {lesson.mini_reading.title} · {lesson.mini_reading.theme.replaceAll('_', ' ')} ·{' '}
                {lesson.mini_reading.word_count} words
              </p>
              <p className="mt-4 whitespace-pre-wrap leading-7">{lesson.mini_reading.passage}</p>
            </section>

            <ReadingQuestionsSection
              questions={lesson.reading_questions}
              answers={readingAnswers}
              results={readingResults}
              submitted={readingSubmitted}
              submitting={submitting}
              score={readingScore}
              onSubmit={() => void submitReading()}
              onSelect={(questionId, option) =>
                setReadingAnswers((current) => ({ ...current, [questionId]: option }))
              }
            />
          </>
        )}
      </main>
    </div>
  );
}

function NewVocabularyCard({
  card,
  speakingId,
  speechSupported,
  onToggleSpeech,
}: {
  card: StudentVocabularyCard;
  speakingId: string | null;
  speechSupported: boolean;
  onToggleSpeech: (id: string, text: string) => void;
}) {
  return (
    <article className="border-b border-[#efe6d8] pb-4 last:border-0">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="text-lg font-semibold text-[#1f3a5f]">
          {card.word}
          {card.part_of_speech ? (
            <span className="ml-2 text-sm font-normal text-[#7a7266]">
              {card.part_of_speech} · Level {card.level}
            </span>
          ) : null}
        </h4>
        <ListenButton
          word={card.word}
          utteranceId={`new-word:${card.id}`}
          text={card.word}
          speakingId={speakingId}
          supported={speechSupported}
          onToggle={onToggleSpeech}
        />
      </div>
      <p className="mt-1">{card.simple_definition || card.definition}</p>
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
        <strong>Collocations:</strong> {(card.common_collocations ?? card.collocations).join('; ')}
      </p>
      <div className="mt-1 flex flex-wrap items-start gap-2">
        <p className="italic">{card.example_sentence}</p>
        {card.example_sentence ? (
          <ListenButton
            word={card.word}
            utteranceId={`new-example:${card.id}`}
            text={card.example_sentence}
            speakingId={speakingId}
            supported={speechSupported}
            onToggle={onToggleSpeech}
            size="example"
          />
        ) : null}
      </div>
      {card.creative_writing_example ? (
        <p className="mt-1 text-sm text-[#1f3a5f]">{card.creative_writing_example}</p>
      ) : null}
    </article>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-[#7a7266]">{label}</p>
      <p className="font-serif text-2xl">{value}</p>
      {hint ? <p className="text-xs text-[#7a7266]">{hint}</p> : null}
    </div>
  );
}
