#!/usr/bin/env npx tsx
/**
 * CLI: Generate Oliver Vocabulary Lesson Day XX
 *
 *   pnpm oliver:lesson -- 25
 *   pnpm oliver:lesson -- --day 1 --print
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { generateOliverVocabularyLessonDay } from './Daily_Lesson_Generator';
import { renderStudentMarkdown } from './Lesson_Template';
import { defaultEnginePaths, defaultModuleRoot } from './store';

function parseDay(argv: string[]): number {
  const dayFlag = argv.findIndex((arg) => arg === '--day' || arg === '-d');
  if (dayFlag >= 0) {
    const value = Number(argv[dayFlag + 1]);
    if (Number.isInteger(value) && value >= 1) return value;
  }
  const positional = argv.find((arg) => /^\d+$/.test(arg));
  if (positional) return Number(positional);
  return 1;
}

function main(): void {
  const argv = process.argv.slice(2);
  const day = parseDay(argv);
  const persist = !argv.includes('--no-persist');
  const printMarkdown = argv.includes('--print') || argv.includes('-p');
  const paths = defaultEnginePaths();
  const result = generateOliverVocabularyLessonDay(day, paths, { persist });
  const outDir = defaultModuleRoot();
  const jsonPath = join(outDir, `Lesson_Day_${String(day).padStart(3, '0')}.json`);
  writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  const markdown = renderStudentMarkdown(result.lesson);
  if (printMarkdown) {
    process.stdout.write(`${markdown}\n`);
  }
  process.stdout.write(
    [
      `Generated ${result.lesson.title}`,
      `New words: ${result.lesson.new_vocabulary.length}`,
      `Review words: ${result.lesson.review_vocabulary.length}`,
      `Reading: ${result.lesson.mini_reading.word_count} words`,
      `Questions: ${result.lesson.reading_questions.length}`,
      `Wrote ${jsonPath}`,
      persist ? `Updated ${paths.progressPath}` : 'Progress not persisted (--no-persist)',
      '',
    ].join('\n'),
  );
}

main();
