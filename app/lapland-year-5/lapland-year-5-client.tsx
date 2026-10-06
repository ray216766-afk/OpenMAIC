'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { PracticeSession, type SessionResult } from '@/components/lapland-year-5/practice-session';
import { LaplandShell } from '@/components/lapland-year-5/shell';
import type {
  AnswerValue,
  PracticeRecommendation,
  StrandSummary,
  StudentQuestion,
} from '@/Naplan_Y5_System/types';

interface ResourceCard {
  id: string;
  domain: string;
  title: string;
  level: string;
  strand: string;
  question_count: number;
  minutes: number;
  passage_title: string | null;
  image_heavy: boolean;
  path: string;
}

interface Paper {
  title: string;
  mode: 'practice' | 'placement';
  resourceId?: string;
  passageTitle?: string | null;
  passage?: string | null;
  questions: StudentQuestion[];
}

interface PlacementResult extends SessionResult {
  recommendations: PracticeRecommendation[];
}

const DOMAIN_ORDER = ['Language Conventions', 'Numeracy', 'Reading'];

export function LaplandYear5Client({
  initialResources = [],
}: {
  initialResources?: ResourceCard[];
}) {
  const [resources, setResources] = useState<ResourceCard[]>(initialResources);
  const [error, setError] = useState<string | null>(null);
  const [paper, setPaper] = useState<Paper | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PlacementResult | null>(null);

  useEffect(() => {
    void fetch('/api/lapland-year-5/resources')
      .then((response) => response.json())
      .then((data: { resources?: ResourceCard[]; error?: string }) => {
        if (!data.resources) throw new Error(data.error || 'Could not load the practice list');
        setResources(data.resources);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load'));
  }, []);

  async function startResource(id: string) {
    setError(null);
    setResult(null);
    const response = await fetch(`/api/lapland-year-5/test?id=${encodeURIComponent(id)}`);
    const data = (await response.json()) as {
      resource?: Paper & { id: string };
      questions?: StudentQuestion[];
      error?: string;
    };
    if (!response.ok || !data.resource || !data.questions) {
      setError(data.error || 'Could not open that test');
      return;
    }
    setPaper({
      title: data.resource.title,
      mode: 'practice',
      resourceId: data.resource.id,
      passageTitle: data.resource.passage_title,
      passage: data.resource.passage,
      questions: data.questions,
    });
  }

  async function startPlacement() {
    setError(null);
    setResult(null);
    const response = await fetch('/api/lapland-year-5/placement');
    const data = (await response.json()) as {
      title?: string;
      questions?: StudentQuestion[];
      error?: string;
    };
    if (!data.questions) {
      setError(data.error || 'Could not open the level test');
      return;
    }
    setPaper({
      title: data.title || 'Year 5 level test',
      mode: 'placement',
      questions: data.questions,
    });
  }

  async function submit(answers: Record<string, AnswerValue>, bookmarks: string[]) {
    if (!paper) return;
    setSubmitting(true);
    try {
      const response = await fetch(
        paper.mode === 'placement' ? '/api/lapland-year-5/placement' : '/api/lapland-year-5/quiz',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            paper.mode === 'placement'
              ? { answers, bookmarks }
              : { resourceId: paper.resourceId, answers, bookmarks },
          ),
        },
      );
      const data = (await response.json()) as {
        score_label?: string;
        strand_summary?: StrandSummary[];
        attempt?: { marks: SessionResult['marks'] };
        saved_wrong?: number;
        report?: { recommendations: PracticeRecommendation[] };
        error?: string;
      };
      if (!response.ok || !data.attempt || !data.score_label || !data.strand_summary) {
        throw new Error(data.error || 'Could not save this attempt');
      }
      setResult({
        score_label: data.score_label,
        strand_summary: data.strand_summary,
        marks: data.attempt.marks,
        saved_wrong: data.saved_wrong ?? 0,
        recommendations: data.report?.recommendations ?? [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <LaplandShell>
      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      ) : null}
      {paper ? (
        <>
          <PracticeSession
            title={paper.title}
            note={
              paper.mode === 'placement'
                ? '水平测试. Two items from each strand. Only capture suggestions are scored. Unscored items can be saved to the 错题题库.'
                : 'Practice mode only. Nothing is sent to Excel Test Zone.'
            }
            passageTitle={paper.passageTitle}
            passage={paper.passage}
            questions={paper.questions}
            submitting={submitting}
            result={result}
            onSubmit={(answers, bookmarks) => void submit(answers, bookmarks)}
            onExit={() => {
              setPaper(null);
              setResult(null);
            }}
          />
          {result && result.recommendations.length > 0 ? (
            <section className="rounded-xl bg-[#fff8e8] p-6 ring-1 ring-[#ead9a8]">
              <h3 className="font-serif text-xl">Weak spots and practice to do next</h3>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {result.recommendations.map((item) => (
                  <li key={item.resource_id}>
                    <button
                      type="button"
                      className="font-semibold text-[#1f3a5f] underline"
                      onClick={() => void startResource(item.resource_id)}
                    >
                      {item.title}
                    </button>
                    <span className="text-[#5c6574]"> — {item.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <>
          <section className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#e4d9c8] md:grid-cols-4">
            <Stat
              label="Practice tests"
              value={resources.length || '—'}
              hint="Each one can be started"
            />
            <Stat label="Domains" value="3" hint="Conventions, Numeracy, Reading" />
            <Stat label="Level test" value="水平测试" hint="Weak spots recommend practice" />
            <Stat
              label="Wrong-answer bank"
              value="错题题库"
              hint="Saved in Naplan_Y5_System/state"
            />
          </section>
          <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
            <h2 className="font-serif text-xl">Start the level test</h2>
            <p className="mt-2 max-w-3xl text-sm text-[#5c6574]">
              The level test samples each strand. Scored items use capture suggestions. Strands
              without a key still appear, and you can send those items to the 错题题库.
            </p>
            <button
              type="button"
              data-start-placement
              className="mt-4 rounded-md bg-[#c9a227] px-4 py-2 text-sm font-medium text-[#1f2430]"
              onClick={() => void startPlacement()}
            >
              Start level test
            </button>
            <Link
              href="/lapland-year-5/wrong-bank"
              className="ml-4 text-sm text-[#1f3a5f] underline"
            >
              Open 错题题库
            </Link>
          </section>
          {DOMAIN_ORDER.map((domain) => {
            const owned = resources.filter((resource) => resource.domain === domain);
            return (
              <section
                key={domain}
                className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]"
              >
                <h2 className="font-serif text-xl">{domain}</h2>
                <p className="mb-4 text-xs tracking-wide text-[#7a7266] uppercase">
                  {owned.length} practice tests
                </p>
                {domain === 'Reading' ? (
                  <p className="mb-4 text-sm text-[#5c6574]">
                    Passage titles are shown where the capture includes one. Tests 03 and 09 are
                    image-heavy passages.
                  </p>
                ) : null}
                <div className="flex flex-col gap-3">
                  {owned.map((resource) => (
                    <article key={resource.id} className="border-b border-[#efe6d8] pb-3">
                      <h3 className="font-semibold text-[#1f3a5f]">{resource.title}</h3>
                      {resource.passage_title ? (
                        <p className="text-sm">Passage: {resource.passage_title}</p>
                      ) : null}
                      <p className="text-sm text-[#5c6574]">
                        {resource.strand} · {resource.level} · {resource.question_count} questions ·{' '}
                        {resource.minutes} minutes
                        {resource.image_heavy ? ' · Image-heavy' : ''}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3">
                        <button
                          type="button"
                          data-start-resource={resource.id}
                          className="rounded-md bg-[#c9a227] px-3 py-1.5 text-sm font-medium text-[#1f2430]"
                          onClick={() => void startResource(resource.id)}
                        >
                          Start test
                        </button>
                        <a
                          className="text-sm text-[#1f3a5f] underline"
                          href={`/api/lapland-year-5/docx?file=${encodeURIComponent(resource.path)}`}
                        >
                          Download Word
                        </a>
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
