/**
 * Compile the live vocabulary bank from Academic Core Batch 1.
 * Does not invent Batch 2+ words. The archived V1.0 seed is not the source.
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ACTIVE_BANK, defaultModuleRoot, loadMaster } from '../store';
import { MODULE_NAME, MODULE_VERSION, VOCABULARY_LEVELS } from '../types';

const root = defaultModuleRoot();
const words = loadMaster();
const counts = words.reduce<Record<string, number>>((acc, word) => {
  acc[String(word.level)] = (acc[word.level] ?? 0) + 1;
  return acc;
}, {});

const unique = new Set(words.map((word) => word.word.toLowerCase()));
if (unique.size !== words.length) {
  throw new Error('Duplicate lemmas in the Academic Core bank');
}

const payload = {
  module: MODULE_NAME,
  version: MODULE_VERSION,
  student: 'Oliver',
  active_bank: ACTIVE_BANK.id,
  active_bank_label: ACTIVE_BANK.label,
  expansion_target: ACTIVE_BANK.expansionTarget,
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
  levels: {
    1: VOCABULARY_LEVELS[1],
    2: VOCABULARY_LEVELS[2],
    3: VOCABULARY_LEVELS[3],
  },
  word_count: words.length,
  level_counts: counts,
  source: ACTIVE_BANK.relativePath,
  words,
};

const out = join(root, 'Vocabulary_Master.json');
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(
  `Wrote ${words.length} Academic Core words to Vocabulary_Master.json (${Object.entries(counts)
    .map(([level, count]) => `L${level}:${count}`)
    .join(', ')})\n`,
);
