import type { Metadata } from 'next';

import { loadQuestionBank } from '@/Naplan_Y5_System/bank';

import { LaplandYear5Client } from './lapland-year-5-client';

export const metadata: Metadata = {
  title: 'Lapland Year 5 Practice — OpenMAIC',
  description:
    'Start every Year 5 Conventions, Numeracy, and Reading practice test in OpenMAIC, then review the wrong-answer bank.',
};

export const dynamic = 'force-dynamic';

export default function LaplandYear5Page() {
  const { resources } = loadQuestionBank();
  return (
    <LaplandYear5Client
      initialResources={resources.map((resource) => ({
        id: resource.id,
        domain: resource.domain,
        title: resource.title,
        level: resource.level,
        strand: resource.strand,
        question_count: resource.question_count,
        minutes: resource.minutes,
        passage_title: resource.passage_title,
        image_heavy: resource.image_heavy,
        path: resource.path,
      }))}
    />
  );
}
