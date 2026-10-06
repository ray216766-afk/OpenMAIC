import type { ReactNode } from 'react';
import Link from 'next/link';

import { NAPLAN_DEV_PORT } from '@/Naplan_Y5_System/types';

export function LaplandShell({
  children,
  eyebrow = 'OpenMAIC · Lapland Year 5 · Practice mode',
}: {
  children: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#1f2430]">
      <header className="border-b border-[#d9cfc0] bg-[#1f3a5f] text-[#f6f1e8]">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8">
          <p className="text-xs tracking-[0.2em] text-[#d4b87a] uppercase">{eyebrow}</p>
          <h1 className="font-serif text-3xl leading-tight md:text-4xl">Oliver Year 5 Practice</h1>
          <p className="max-w-3xl text-sm text-[#e8dfd0]">
            NAPLAN-style practice runs inside OpenMAIC. Excel Test Zone is not contacted. Capture
            suggestions are not official keys. Word files still have the exercises first and any
            captured answers on the last page.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm">
            <Link
              href="/lapland-year-5"
              className="text-[#d4b87a] underline-offset-4 hover:underline"
            >
              Practice list
            </Link>
            <Link
              href="/lapland-year-5/wrong-bank"
              className="text-[#d4b87a] underline-offset-4 hover:underline"
            >
              错题题库
            </Link>
            <Link
              href="/oliver-vocabulary"
              className="text-[#d4b87a] underline-offset-4 hover:underline"
            >
              Scholarship Vocabulary
            </Link>
            <span className="text-[#e8dfd0]">Port {NAPLAN_DEV_PORT}</span>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-8">{children}</main>
    </div>
  );
}
