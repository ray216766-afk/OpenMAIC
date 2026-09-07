import type { Metadata } from 'next';

import { OliverVocabularyClient } from './oliver-vocabulary-client';

export const metadata: Metadata = {
  title: 'Oliver Scholarship Vocabulary Master — OpenMAIC',
  description:
    'English-only daily scholarship vocabulary lessons for Oliver: new words, review, mini reading, and progress tracking.',
};

export const dynamic = 'force-dynamic';

export default function OliverVocabularyPage() {
  return <OliverVocabularyClient />;
}
