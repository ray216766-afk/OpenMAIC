'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { PlacementSit } from '@/components/lapland-year-5/placement-sit';
import { PracticeSession, type SessionResult } from '@/components/lapland-year-5/practice-session';
import { LaplandShell } from '@/components/lapland-year-5/shell';
import type {
  AnswerValue,
  OpenMrcEntry,
  PlacementReport,
  PlacementStudentQuestion,
  StrandSummary,
  StudentQuestion,
} from '@/Naplan_Y5_System/types';

interface PracticePaper {
  title: string;
  resourceId: string;
  passageTitle?: string | null;
  passage?: string | null;
  questions: StudentQuestion[];
}

interface PlacementPaper {
  title: string;
  description: string;
  questions: PlacementStudentQuestion[];
}

const SUBJECTS = ['All', 'Conventions of Language', 'Numeracy', 'Reading'] as const;
const LEVELS = ['All', 'Standard', 'Intermediate', 'Advanced'] as const;
const TOPICS = [
  'All',
  'Grammar & Punctuation',
  'Spelling',
  'Reading',
  'Number & Algebra',
  'Measurement & Geometry',
  'Statistics & Probability',
] as const;

export function LaplandYear5Client({
  initialEntries,
  placementQuestionCount,
}: {
  initialEntries: OpenMrcEntry[];
  placementQuestionCount: number;
}) {
  const [entries, setEntries] = useState<OpenMrcEntry[]>(initialEntries);
  const [error, setError] = useState<string | null>(null);
  const [practice, setPractice] = useState<PracticePaper | null>(null);
  const [placement, setPlacement] = useState<PlacementPaper | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [practiceResult, setPracticeResult] = useState<SessionResult | null>(null);
  const [placementScore, setPlacementScore] = useState<string | null>(null);
  const [placementReport, setPlacementReport] = useState<PlacementReport | null>(null);
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('All');
  const [topic, setTopic] = useState<(typeof TOPICS)[number]>('All');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('All');
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/lapland-year-5/resources')
      .then((response) => response.json())
      .then((data: { entries?: OpenMrcEntry[]; error?: string }) => {
        if (!data.entries) throw new Error(data.error || 'Could not load the practice list');
        setEntries(data.entries);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load'));
  }, []);

  useEffect(() => {
    if (!focusId || placement || practice) return;
    document.getElementById(`entry-${focusId}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, [focusId, placement, practice, subject, topic, level]);

  const visible = entries.filter((entry) => {
    if (subject !== 'All' && entry.subject !== subject) return false;
    if (topic !== 'All' && entry.topic !== topic) return false;
    if (level !== 'All' && entry.level !== level) return false;
    return true;
  });

  async function startResource(bankId: string) {
    setError(null);
    setPracticeResult(null);
    setPlacement(null);
    setPlacementReport(null);
    setPlacementScore(null);
    const response = await fetch(`/api/lapland-year-5/test?id=${encodeURIComponent(bankId)}`);
    const data = (await response.json()) as {
      resource?: PracticePaper & {
        id: string;
        passage_title?: string | null;
        passage?: string | null;
      };
      questions?: PracticePaper['questions'];
      error?: string;
    };
    if (!response.ok || !data.resource || !data.questions) {
      setError(data.error || 'Could not open that test');
      return;
    }
    setPractice({
      title: data.resource.title,
      resourceId: data.resource.id,
      passageTitle: data.resource.passage_title,
      passage: data.resource.passage,
      questions: data.questions,
    });
  }

  async function startPlacement() {
    setError(null);
    setPractice(null);
    setPracticeResult(null);
    setPlacementReport(null);
    setPlacementScore(null);
    const response = await fetch('/api/lapland-year-5/placement');
    const data = (await response.json()) as PlacementPaper & { error?: string };
    if (!data.questions?.length) {
      setError(data.error || 'Could not open the placement test');
      return;
    }
    setPlacement({
      title: data.title,
      description: data.description,
      questions: data.questions,
    });
  }

  async function submitPractice(answers: Record<string, AnswerValue>, bookmarks: string[]) {
    if (!practice) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/lapland-year-5/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId: practice.resourceId, answers, bookmarks }),
      });
      const data = (await response.json()) as {
        score_label?: string;
        strand_summary?: StrandSummary[];
        attempt?: { marks: SessionResult['marks'] };
        saved_wrong?: number;
        error?: string;
      };
      if (!response.ok || !data.attempt || !data.score_label || !data.strand_summary) {
        throw new Error(data.error || 'Could not save this attempt');
      }
      setPracticeResult({
        score_label: data.score_label,
        strand_summary: data.strand_summary,
        marks: data.attempt.marks,
        saved_wrong: data.saved_wrong ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function submitPlacement(
    answers: Record<string, string>,
    teacherMarks: Record<string, boolean>,
  ) {
    setSubmitting(true);
    try {
      const response = await fetch('/api/lapland-year-5/placement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, teacherMarks }),
      });
      const data = (await response.json()) as {
        score_label?: string;
        report?: PlacementReport;
        error?: string;
      };
      if (!response.ok || !data.score_label || !data.report) {
        throw new Error(data.error || 'Could not save the placement test');
      }
      setPlacementScore(data.score_label);
      setPlacementReport(data.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  function openEntry(catalogId: string) {
    setPlacement(null);
    setPlacementReport(null);
    setPlacementScore(null);
    setPractice(null);
    setSubject('All');
    setTopic('All');
    setLevel('All');
    setFocusId(catalogId);
  }

  return (
    <LaplandShell>
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {placement ? (
        <PlacementSit
          title={placement.title}
          description={placement.description}
          questions={placement.questions}
          submitting={submitting}
          scoreLabel={placementScore}
          report={placementReport}
          onSubmit={(answers, teacherMarks) => void submitPlacement(answers, teacherMarks)}
          onExit={() => {
            setPlacement(null);
            setPlacementReport(null);
            setPlacementScore(null);
          }}
          onOpenEntry={openEntry}
        />
      ) : practice ? (
        <PracticeSession
          title={practice.title}
          note="Practice mode only. Nothing is sent to Excel Test Zone."
          passageTitle={practice.passageTitle}
          passage={practice.passage}
          questions={practice.questions}
          submitting={submitting}
          result={practiceResult}
          onSubmit={(answers, bookmarks) => void submitPractice(answers, bookmarks)}
          onExit={() => {
            setPractice(null);
            setPracticeResult(null);
          }}
        />
      ) : (
        <>
          <section className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#e4d9c8] md:grid-cols-4">
            <Stat
              label="Practice tests"
              value={entries.length || '—'}
              hint="Each one can be started"
            />
            <Stat label="Subjects" value="3" hint="Conventions, Numeracy, Reading" />
            <Stat
              label="Placement"
              value={`${placementQuestionCount} items`}
              hint="水平测试, one question at a time"
            />
            <Stat
              label="Wrong-answer bank"
              value="错题题库"
              hint="Saved in Naplan_Y5_System/state"
            />
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
            <h2 className="font-serif text-xl">Start Placement Test</h2>
            <p className="mt-2 max-w-3xl text-sm text-[#5c6574]">
              Sit the {placementQuestionCount}-question level test from start to finish. After you
              submit, strands under 60% recommend practice from this list. Until a key is filled in,
              the result records what you answered and still points at practice. Spelling tests stay
              in the list below; the placement paper is light on spelling because those captures are
              audio-heavy.
            </p>
            <button
              type="button"
              data-start-placement
              className="mt-4 rounded-md bg-[#c9a227] px-4 py-2 text-sm font-medium text-[#1f2430]"
              onClick={() => void startPlacement()}
            >
              Start Placement Test
            </button>
            <Link
              href="/lapland-year-5/wrong-bank"
              className="ml-4 text-sm text-[#1f3a5f] underline"
            >
              Open 错题题库
            </Link>
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
            <h2 className="font-serif text-xl">All practice tests</h2>
            <p className="mt-1 text-sm text-[#5c6574]">
              Showing {visible.length} of {entries.length}. Each card has the title, topic, question
              count, and level.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <FilterRow label="Subject" value={subject} options={SUBJECTS} onChange={setSubject} />
              <FilterRow label="Topic" value={topic} options={TOPICS} onChange={setTopic} />
              <FilterRow label="Level" value={level} options={LEVELS} onChange={setLevel} />
            </div>
          </section>
          {SUBJECTS.filter((name) => name !== 'All').map((name) => {
            const owned = visible.filter((entry) => entry.subject === name);
            if (owned.length === 0) return null;
            return (
              <section
                key={name}
                className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]"
              >
                <h2 className="font-serif text-xl">{name}</h2>
                <p className="mb-4 text-xs tracking-wide text-[#7a7266] uppercase">
                  {owned.length} practice tests
                </p>
                {name === 'Reading' ? (
                  <p className="mb-4 text-sm text-[#5c6574]">
                    Passage titles are shown where the capture includes one. Tests 03 and 09 are
                    image-heavy passages.
                  </p>
                ) : null}
                <div className="flex flex-col gap-3">
                  {owned.map((entry) => (
                    <article
                      key={entry.id}
                      id={`entry-${entry.id}`}
                      data-catalog-id={entry.id}
                      className={`border-b border-[#efe6d8] pb-3 ${
                        focusId === entry.id
                          ? 'rounded-md bg-[#fff8e8] px-3 py-2 ring-2 ring-[#c9a227]'
                          : ''
                      }`}
                    >
                      <h3 className="font-semibold text-[#1f3a5f]">{entry.title}</h3>
                      {entry.passage_title ? (
                        <p className="text-sm">Passage: {entry.passage_title}</p>
                      ) : null}
                      <p className="text-sm text-[#5c6574]">
                        {entry.topic} · {entry.level} · {entry.question_count} questions
                        {entry.image_heavy ? ' · Image-heavy' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          data-start-resource={entry.bank_id}
                          className="rounded-md bg-[#c9a227] px-3 py-1.5 text-sm font-medium text-[#1f2430]"
                          onClick={() => void startResource(entry.bank_id)}
                        >
                          Start test
                        </button>
                        {entry.path ? (
                          <a
                            className="text-sm text-[#1f3a5f] underline"
                            href={`/api/lapland-year-5/docx?file=${encodeURIComponent(entry.path)}`}
                          >
                            Download Word
                          </a>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
          <section className="rounded-xl bg-[#fff8e8] p-6 ring-1 ring-[#ead9a8]">
            <h2 className="font-serif text-xl">Writing is not in this practice bank</h2>
            <p className="mt-2 text-sm text-[#5c6574]">
              The four written tests spend attempt credits, so they are not startable here. Sample
              tests are not practice downloads either.
            </p>
          </section>
        </>
      )}
    </LaplandShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-[#7a7266] uppercase">{label}</p>
      <p className="font-serif text-2xl">{value}</p>
      <p className="text-xs text-[#7a7266]">{hint}</p>
    </div>
  );
}

function FilterRow<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (next: T) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 text-xs tracking-wide text-[#7a7266] uppercase">{label}</span>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          className={`rounded-full px-3 py-1 text-sm ${
            value === option
              ? 'bg-[#1f3a5f] text-[#f6f1e8]'
              : 'bg-[#f6f1e8] text-[#1f2430] ring-1 ring-[#e4d9c8]'
          }`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
