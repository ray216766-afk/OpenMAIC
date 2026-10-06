import type { Metadata } from 'next';

import { loadOpenMrcEntries, loadPlacementPack } from '@/Naplan_Y5_System/openmrc-pack';

import { LaplandYear5Client } from './lapland-year-5-client';

export const metadata: Metadata = {
  title: 'Lapland Year 5 Practice — OpenMAIC',
  description:
    'Start every Year 5 Conventions, Numeracy, and Reading practice test in OpenMAIC, then review the wrong-answer bank.',
};

export const dynamic = 'force-dynamic';

export default function LaplandYear5Page() {
  const entries = loadOpenMrcEntries();
  const placement = loadPlacementPack();
  return (
    <LaplandYear5Client
      initialEntries={entries}
      placementQuestionCount={placement.question_count}
    />
  );
}
