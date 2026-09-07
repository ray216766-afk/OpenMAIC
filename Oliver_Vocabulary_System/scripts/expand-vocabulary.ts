/**
 * Path to expand the live Academic Core bank toward ~1500 words.
 *
 * Usage:
 *   pnpm oliver:expand -- --pack path/to/extra-words.json
 *
 * Extra pack format: Academic Core schema or engine schema (array or { words: [...] }).
 * IDs from the pack are kept when present.
 *
 * This script does not invent filler words. Add curated, approved batches only.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { normalizeMasterWords } from '../normalize';
import { ACTIVE_BANK, loadMaster } from '../store';
import { MODULE_NAME, MODULE_VERSION, VOCABULARY_LEVELS } from '../types';

function parseArgs(argv: string[]): { pack?: string; out?: string } {
  const packIndex = argv.findIndex((arg) => arg === '--pack');
  const outIndex = argv.findIndex((arg) => arg === '--out');
  return {
    pack: packIndex >= 0 ? argv[packIndex + 1] : undefined,
    out: outIndex >= 0 ? argv[outIndex + 1] : undefined,
  };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const current = loadMaster();
  const compiledPath = join(process.cwd(), 'Oliver_Vocabulary_System', 'Vocabulary_Master.json');
  if (!args.pack) {
    process.stdout.write(
      [
        `Live bank: ${ACTIVE_BANK.label} (${current.length} words)`,
        `Expansion target: ~${ACTIVE_BANK.expansionTarget}`,
        'To add a later approved batch (do not invent Batch 2+ here):',
        '  pnpm oliver:expand -- --pack Oliver_Vocabulary_System/Y5Y6_Academic_Vocabulary_Master/data/Academic_Core_Batch_002.json',
        'Pack entries must be high-quality Academic Core / scholarship vocabulary.',
        '',
      ].join('\n'),
    );
    return;
  }

  const extra = normalizeMasterWords(JSON.parse(readFileSync(args.pack, 'utf8')));
  const merged = [];
  const seen = new Set<string>();
  for (const entry of [...current, ...extra]) {
    const key = entry.word.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(entry);
  }

  const counts = merged.reduce<Record<string, number>>((acc, word) => {
    acc[word.level] = (acc[word.level] ?? 0) + 1;
    return acc;
  }, {});
  const payload = {
    module: MODULE_NAME,
    version: MODULE_VERSION,
    student: 'Oliver',
    active_bank: ACTIVE_BANK.id,
    expansion_target: ACTIVE_BANK.expansionTarget,
    levels: {
      1: VOCABULARY_LEVELS[1],
      2: VOCABULARY_LEVELS[2],
      3: VOCABULARY_LEVELS[3],
    },
    word_count: merged.length,
    level_counts: counts,
    words: merged,
  };
  const out = args.out ?? compiledPath;
  writeFileSync(out, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  process.stdout.write(
    `Merged ${extra.length} pack entries. Master now has ${merged.length} unique words.\n`,
  );
}

main();
