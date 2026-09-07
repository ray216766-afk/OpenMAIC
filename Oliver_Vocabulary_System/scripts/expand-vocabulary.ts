/**
 * Path to expand the seed toward ~1000 scholarship words.
 *
 * Usage:
 *   pnpm oliver:expand -- --pack path/to/extra-words.json
 *
 * Extra pack format: an array of vocabulary entries (or { words: [...] })
 * matching the Vocabulary_Master schema. IDs are reassigned.
 *
 * This script does not invent filler words. Add curated packs only.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { VocabularyEntry } from '../types';
import { MODULE_NAME, MODULE_VERSION, VOCABULARY_LEVELS } from '../types';

function parseArgs(argv: string[]): { pack?: string; out?: string } {
  const packIndex = argv.findIndex((arg) => arg === '--pack');
  const outIndex = argv.findIndex((arg) => arg === '--out');
  return {
    pack: packIndex >= 0 ? argv[packIndex + 1] : undefined,
    out: outIndex >= 0 ? argv[outIndex + 1] : undefined,
  };
}

function asWords(raw: unknown): VocabularyEntry[] {
  if (Array.isArray(raw)) return raw as VocabularyEntry[];
  if (raw && typeof raw === 'object' && Array.isArray((raw as { words?: unknown }).words)) {
    return (raw as { words: VocabularyEntry[] }).words;
  }
  throw new Error('Pack must be an array or { words: [...] }');
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const masterPath = join(process.cwd(), 'Oliver_Vocabulary_System', 'Vocabulary_Master.json');
  const current = asWords(JSON.parse(readFileSync(masterPath, 'utf8')));
  if (!args.pack) {
    process.stdout.write(
      [
        `Current Vocabulary_Master.json: ${current.length} words`,
        'To expand toward ~1000, add a curated pack:',
        '  pnpm oliver:expand -- --pack Oliver_Vocabulary_System/packs/batch-02.json',
        'Pack entries must be high-quality scholarship vocabulary, not translated word lists.',
        '',
      ].join('\n'),
    );
    return;
  }

  const extra = asWords(JSON.parse(readFileSync(args.pack, 'utf8')));
  const merged: VocabularyEntry[] = [];
  const seen = new Set<string>();
  for (const entry of [...current, ...extra]) {
    const key = entry.word.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push({
      ...entry,
      id: `VOC${String(merged.length + 1).padStart(4, '0')}`,
    });
  }

  const counts = merged.reduce<Record<string, number>>((acc, word) => {
    acc[word.level] = (acc[word.level] ?? 0) + 1;
    return acc;
  }, {});
  const payload = {
    module: MODULE_NAME,
    version: MODULE_VERSION,
    student: 'Oliver',
    levels: VOCABULARY_LEVELS,
    word_count: merged.length,
    level_counts: counts,
    words: merged,
  };
  const out = args.out ?? masterPath;
  writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `Merged ${extra.length} pack entries. Master now has ${merged.length} unique words.\n`,
  );
}

main();
