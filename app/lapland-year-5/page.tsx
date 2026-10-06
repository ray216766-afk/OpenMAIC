import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

import {
  LAPLAND_YEAR_5_ROUTE,
  type InventoryTest,
  type SubjectGroup,
  docxDownloadHref,
  groupTests,
  loadCatalog,
  subjectAnchor,
} from '@/lib/lapland-year-5/catalog';

export const metadata: Metadata = {
  title: 'Lapland Year 5 Practice — OpenMAIC',
  description:
    'Excel Test Zone NAPLAN-style Practice for Oliver Year 5. Browse every practice test by subject, strand, and level, and download Word documents that have been uploaded.',
};

export const dynamic = 'force-dynamic';

export default function LaplandYear5Page() {
  const catalog = loadCatalog();
  const practiceGroups = groupTests(catalog.practice);
  const otherGroups = groupTests(catalog.other);
  const wordDocs = catalog.practice.filter((test) => test.wordDoc).length;
  const questionTotal = catalog.practice.reduce((sum, test) => sum + test.questions, 0);

  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#1f2430]">
      <header className="border-b border-[#d9cfc0] bg-[#1f3a5f] text-[#f6f1e8]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8">
          <p className="text-xs tracking-[0.2em] uppercase text-[#d4b87a]">
            OpenMAIC · Lapland Year 5 · Practice mode
          </p>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">Oliver Year 5 Practice</h1>
          <p className="max-w-3xl text-sm text-[#e8dfd0]">
            Excel Test Zone NAPLAN-style Practice captures for Oliver Year 5. Every Practice test in
            the pack is listed on this page, grouped by subject and strand. Word documents have the
            exercises first and the answers on the last page. These captures are not official keys.
            Practice mode only.
          </p>
          <p className="text-sm text-[#e8dfd0]">
            Browse at <span className="text-[#d4b87a]">{LAPLAND_YEAR_5_ROUTE}</span>
            {catalog.pack ? ` · ${catalog.pack}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
            {practiceGroups.map((group) => (
              <a
                key={group.subject}
                href={`#${subjectAnchor(group.subject)}`}
                className="text-[#d4b87a] underline-offset-4 hover:underline"
              >
                {group.subject}
              </a>
            ))}
            <a
              href="#sample-and-written"
              className="text-[#d4b87a] underline-offset-4 hover:underline"
            >
              Sample and written
            </a>
            <Link
              href="/oliver-vocabulary"
              className="text-[#d4b87a] underline-offset-4 hover:underline"
            >
              Scholarship Vocabulary
            </Link>
            <Link href="/" className="text-[#d4b87a] underline-offset-4 hover:underline">
              Back to OpenMAIC
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">
        <section className="grid gap-3 rounded-xl bg-white p-5 shadow-sm ring-1 ring-[#e4d9c8] md:grid-cols-4">
          <Stat
            label="Practice tests"
            value={catalog.practice.length}
            hint="Visible on this page"
          />
          <Stat
            label="Word docs ready"
            value={wordDocs}
            hint={`${catalog.practice.length - wordDocs} still to upload`}
          />
          <Stat
            label="Practice questions"
            value={questionTotal}
            hint="Counted from the inventory"
          />
          <Stat
            label="Subjects"
            value={practiceGroups.length}
            hint="Conventions, Numeracy, Reading"
          />
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
          <h2 className="font-serif text-xl">Practice map</h2>
          <p className="mb-4 text-xs tracking-wide text-[#7a7266] uppercase">
            Subject · level · test count · Word documents uploaded
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e4d9c8] text-xs tracking-wide text-[#7a7266] uppercase">
                  <th className="py-2 pr-3 font-medium">Subject</th>
                  <th className="py-2 pr-3 font-medium">Standard</th>
                  <th className="py-2 pr-3 font-medium">Intermediate</th>
                  <th className="py-2 pr-3 font-medium">Advanced</th>
                  <th className="py-2 font-medium">Word docs</th>
                </tr>
              </thead>
              <tbody>
                {practiceGroups.map((group) => (
                  <tr key={group.subject} className="border-b border-[#efe6d8] last:border-0">
                    <td className="py-2 pr-3 font-semibold text-[#1f3a5f]">
                      <a href={`#${subjectAnchor(group.subject)}`} className="hover:underline">
                        {group.subject}
                      </a>
                    </td>
                    <td className="py-2 pr-3">{levelCount(group, 'Standard')}</td>
                    <td className="py-2 pr-3">{levelCount(group, 'Intermediate')}</td>
                    <td className="py-2 pr-3">{levelCount(group, 'Advanced')}</td>
                    <td className="py-2">
                      {group.wordDocCount} of {group.testCount}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2 pr-3 font-semibold text-[#1f3a5f]">
                    <a href="#writing" className="hover:underline">
                      Writing
                    </a>
                  </td>
                  <td className="py-2 pr-3 text-[#7a7266]" colSpan={4}>
                    No Practice tests. Written tests are listed in the separate section below.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {practiceGroups.map((group) => (
          <SubjectSection key={group.subject} group={group} />
        ))}

        <section
          id="sample-and-written"
          className="rounded-xl bg-[#fff8e8] p-6 shadow-sm ring-1 ring-[#ead9a8]"
        >
          <h2 className="font-serif text-xl">Sample and written tests</h2>
          <p className="mt-2 max-w-3xl text-sm text-[#5c6574]">
            These inventory rows are Sample or Written tests, not Practice mode. They are listed so
            the full pack is visible. They are not offered as practice downloads.
          </p>
          <div className="mt-6 flex flex-col gap-8">
            {otherGroups.map((group) => (
              <div key={group.subject} id={group.subject === 'Writing' ? 'writing' : undefined}>
                <h3 className="font-serif text-lg text-[#1f3a5f]">
                  {group.subject}
                  <span className="ml-2 text-sm font-normal text-[#7a7266]">
                    {group.testCount} {group.testCount === 1 ? 'test' : 'tests'}
                  </span>
                </h3>
                {group.levels.map((level) => (
                  <div key={level.level} className="mt-4">
                    {level.strands.map((strand) => (
                      <div key={strand.strand} className="mt-3">
                        <p className="text-xs tracking-wide text-[#7a7266] uppercase">
                          {level.level} · {strand.strand}
                        </p>
                        <ul className="mt-2 divide-y divide-[#ead9a8]">
                          {strand.tests.map((test) => (
                            <li key={test.title} className="py-3">
                              <p className="font-semibold">{test.title}</p>
                              <p className="mt-1 text-sm text-[#5c6574]">
                                {test.testType} · {test.questions}{' '}
                                {test.questions === 1 ? 'question' : 'questions'} · {test.minutes}{' '}
                                minutes · Not a practice download
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function SubjectSection({ group }: { group: SubjectGroup }) {
  return (
    <section
      id={subjectAnchor(group.subject)}
      className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]"
    >
      <h2 className="font-serif text-xl">{group.subject}</h2>
      <p className="mb-4 text-xs tracking-wide text-[#7a7266] uppercase">
        {group.testCount} practice tests · {group.wordDocCount} Word{' '}
        {group.wordDocCount === 1 ? 'document' : 'documents'} uploaded
      </p>
      <div className="flex flex-col gap-6">
        {group.levels.map((level) => (
          <div key={level.level}>
            <h3 className="text-sm font-semibold tracking-wide text-[#c9a227] uppercase">
              {level.level}
              <span className="ml-2 font-normal text-[#7a7266]">
                {level.testCount} tests · {level.wordDocCount} Word docs
              </span>
            </h3>
            {level.strands.map((strand) => (
              <div key={strand.strand} className="mt-3">
                <p className="text-sm font-semibold text-[#1f3a5f]">{strand.strand}</p>
                <div className="mt-1">
                  {strand.tests.map((test) => (
                    <TestRow key={test.title} test={test} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function TestRow({ test }: { test: InventoryTest }) {
  return (
    <article className="border-b border-[#efe6d8] py-3 last:border-0">
      <h4 className="text-base font-semibold text-[#1f3a5f]">{test.title}</h4>
      <p className="mt-1 text-sm text-[#5c6574]">
        {test.strand} · {test.level} · {test.questions} questions · {test.minutes} minutes
      </p>
      {test.wordDoc ? (
        <a
          href={docxDownloadHref(test.wordDoc.relativePath)}
          className="mt-2 inline-flex items-center gap-2 rounded-md bg-[#c9a227] px-3 py-1.5 text-sm font-medium text-[#1f2430] hover:bg-[#b8911c]"
        >
          <BookOpen className="size-4" aria-hidden="true" />
          Download Word
        </a>
      ) : (
        <p className="mt-2 text-sm text-[#7a7266]">Word doc not uploaded yet</p>
      )}
    </article>
  );
}

function levelCount(group: SubjectGroup, level: string): number {
  return group.levels.find((entry) => entry.level === level)?.testCount ?? 0;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div>
      <p className="text-xs tracking-wide text-[#7a7266] uppercase">{label}</p>
      <p className="font-serif text-2xl">{value}</p>
      {hint ? <p className="text-xs text-[#7a7266]">{hint}</p> : null}
    </div>
  );
}
