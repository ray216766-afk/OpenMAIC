'use client';

import { useEffect, useState } from 'react';

import { LaplandShell } from '@/components/lapland-year-5/shell';
import type { WrongItem } from '@/Naplan_Y5_System/types';

export function WrongBankClient() {
  const [items, setItems] = useState<WrongItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/lapland-year-5/wrong-bank')
      .then((response) => response.json())
      .then((data: { items?: WrongItem[]; error?: string }) => {
        if (!data.items) throw new Error(data.error || 'Could not load the wrong-answer bank');
        setItems(data.items);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load'));
  }, []);

  return (
    <LaplandShell eyebrow="OpenMAIC · 错题题库">
      <section className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-[#e4d9c8]">
        <h2 className="font-serif text-2xl">Wrong-answer bank</h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5c6574]">
          Items Oliver missed on a scoreable question, or marked for review, are stored in{' '}
          <code>Naplan_Y5_System/state/Wrong_Answer_Bank.json</code>. The app adds to that file and
          does not clear it. The same browser keeps the file on this machine across sessions.
        </p>
        {error ? <p className="mt-4 text-sm text-red-800">{error}</p> : null}
        {items && items.length === 0 ? (
          <p className="mt-6 text-sm text-[#5c6574]">No saved items yet.</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-4">
          {items?.map((item) => (
            <article key={item.id} className="border-b border-[#efe6d8] pb-3">
              <p className="text-xs tracking-wide text-[#c9a227] uppercase">
                {item.domain} · {item.strand} ·{' '}
                {item.reason === 'incorrect' ? 'missed' : 'bookmarked'}
              </p>
              <h3 className="font-semibold text-[#1f3a5f]">{item.title}</h3>
              <p className="mt-1 text-sm">{item.prompt}</p>
              <p className="mt-1 text-sm text-[#5c6574]">
                Skill: {item.skill_tag}
                {item.expected ? ` · Capture suggestion: ${item.expected}` : ''}
              </p>
            </article>
          ))}
        </div>
      </section>
    </LaplandShell>
  );
}
