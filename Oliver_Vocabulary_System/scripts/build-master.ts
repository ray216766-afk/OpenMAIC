/**
 * Compile the live vocabulary bank from Academic Core Batch 1 plus any
 * expansion pack (VAC0101+). Batch 1 source files are not rewritten.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeMasterWords } from '../normalize';
import { ACTIVE_BANK, defaultModuleRoot } from '../store';
import { MODULE_NAME, MODULE_VERSION, VOCABULARY_LEVELS } from '../types';

const root = defaultModuleRoot();
const batch1Path = join(root, ACTIVE_BANK.relativePath);
const expansionPath = join(root, ACTIVE_BANK.expansionRelativePath);
const batch1 = normalizeMasterWords(JSON.parse(readFileSync(batch1Path, 'utf8')));
const extra = existsSync(expansionPath)
  ? normalizeMasterWords(JSON.parse(readFileSync(expansionPath, 'utf8')))
  : [];
const seen = new Set<string>();
const words = [];
for (const entry of [...batch1, ...extra]) {
  const key = entry.word.trim().toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  words.push(entry);
}
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
  source: extra.length
    ? `${ACTIVE_BANK.relativePath} + ${ACTIVE_BANK.expansionRelativePath}`
    : ACTIVE_BANK.relativePath,
  words,
};

const out = join(root, 'Vocabulary_Master.json');
writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
process.stdout.write(
  `Wrote ${words.length} Academic Core words to Vocabulary_Master.json (${Object.entries(counts)
    .map(([level, count]) => `L${level}:${count}`)
    .join(', ')})\n`,
);
