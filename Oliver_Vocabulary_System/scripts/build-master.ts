import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { MODULE_NAME, MODULE_VERSION, VOCABULARY_LEVELS } from '../types';
import { expandSeed, SEED_ROWS } from './seed-source';

const words = expandSeed(SEED_ROWS);
const counts = words.reduce<Record<string, number>>((acc, word) => {
  acc[word.level] = (acc[word.level] ?? 0) + 1;
  return acc;
}, {});

const unique = new Set(words.map((word) => word.word.toLowerCase()));
if (unique.size !== words.length) {
  const seen = new Set<string>();
  const dupes = words.filter((word) => {
    const key = word.word.toLowerCase();
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
  throw new Error(`Duplicate words: ${dupes.map((word) => word.word).join(', ')}`);
}

const payload = {
  module: MODULE_NAME,
  version: MODULE_VERSION,
  student: 'Oliver',
  philosophy: {
    audience: 'Native English speaker, Year 5–6 Australian Scholarship prep',
    student_language: 'English only',
    chinese_field: 'Parent reference only — never shown in student lessons',
    exams: [
      'EduTest',
      'Australian private school scholarship tests',
      'Academic Select style English',
    ],
  },
  levels: VOCABULARY_LEVELS,
  word_count: words.length,
  level_counts: counts,
  words,
};

const out = join(process.cwd(), 'Oliver_Vocabulary_System', 'Vocabulary_Master.json');
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(
  `Wrote ${words.length} words to Vocabulary_Master.json (${Object.entries(counts)
    .map(([level, count]) => `L${level}:${count}`)
    .join(', ')})\n`,
);
