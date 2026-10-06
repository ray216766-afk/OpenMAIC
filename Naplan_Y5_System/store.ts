import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { loadQuestionBank } from './bank';
import type {
  AttemptRecord,
  EnginePaths,
  ItemMark,
  ProgressFile,
  WrongBankFile,
  WrongItem,
} from './types';
import { MODULE_NAME, MODULE_VERSION } from './types';

export function defaultModuleRoot(): string {
  return process.env.NAPLAN_Y5_ROOT || join(process.cwd(), 'Naplan_Y5_System');
}

export function defaultEnginePaths(root = defaultModuleRoot()): EnginePaths {
  return {
    bankPath: join(root, 'data', 'question_bank.json'),
    progressPath: join(root, 'state', 'Progress.json'),
    wrongBankPath: join(root, 'state', 'Wrong_Answer_Bank.json'),
  };
}

function readJson<T>(filePath: string): T | null {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8')) as T;
}

/** Write a new file. Never deletes an existing progress or wrong-bank file first. */
function writeJson(filePath: string, value: unknown): void {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  renameSync(tmp, filePath);
}

export function emptyProgress(): ProgressFile {
  return {
    student: 'Oliver',
    module: MODULE_NAME,
    version: MODULE_VERSION,
    updated_at: null,
    attempts: [],
    placements: [],
  };
}

export function loadProgress(paths = defaultEnginePaths()): ProgressFile {
  return readJson<ProgressFile>(paths.progressPath) ?? emptyProgress();
}

export function saveProgress(progress: ProgressFile, paths = defaultEnginePaths()): void {
  writeJson(paths.progressPath, progress);
}

export function emptyWrongBank(): WrongBankFile {
  return { version: MODULE_VERSION, updated_at: null, items: [] };
}

export function loadWrongBank(paths = defaultEnginePaths()): WrongBankFile {
  return readJson<WrongBankFile>(paths.wrongBankPath) ?? emptyWrongBank();
}

export function saveWrongBank(bank: WrongBankFile, paths = defaultEnginePaths()): void {
  writeJson(paths.wrongBankPath, bank);
}

export function rememberAttempt(attempt: AttemptRecord, paths = defaultEnginePaths()): void {
  const progress = loadProgress(paths);
  if (attempt.kind === 'placement') progress.placements.push(attempt);
  else progress.attempts.push(attempt);
  progress.updated_at = attempt.submitted_at;
  saveProgress(progress, paths);
}

export function wrongId(resourceId: string, questionId: string): string {
  return `${resourceId}:${questionId}`;
}

export function appendWrongItems(items: WrongItem[], paths = defaultEnginePaths()): number {
  const bank = loadWrongBank(paths);
  const seen = new Set(bank.items.map((item) => item.id));
  let added = 0;
  for (const item of items) {
    if (seen.has(item.id)) continue;
    bank.items.push(item);
    seen.add(item.id);
    added += 1;
  }
  if (added > 0) {
    bank.updated_at = new Date().toISOString();
    saveWrongBank(bank, paths);
  }
  return added;
}

export function wrongItemsFromMarks(
  marks: ItemMark[],
  resourceId: string,
  title: string,
  bookmarks: string[] = [],
): WrongItem[] {
  const now = new Date().toISOString();
  const items: WrongItem[] = [];
  for (const mark of marks) {
    const incorrect = mark.scored && mark.correct === false;
    const bookmarked = bookmarks.includes(mark.question_id);
    if (!incorrect && !bookmarked) continue;
    items.push({
      id: wrongId(resourceId, mark.question_id),
      resource_id: resourceId,
      question_id: mark.question_id,
      title,
      prompt: mark.prompt,
      given: mark.given,
      expected: mark.expected,
      skill_tag: mark.skill_tag,
      domain: mark.domain,
      strand: mark.strand,
      saved_at: now,
      reason: incorrect ? 'incorrect' : 'bookmarked',
    });
  }
  return items;
}

export function bookmarkQuestion(
  resourceId: string,
  questionId: string,
  paths = defaultEnginePaths(),
): WrongItem | null {
  const { questions, resources } = loadQuestionBank(paths.bankPath);
  const question = questions.find(
    (item) => item.id === questionId && item.resource_id === resourceId,
  );
  const resource = resources.find((item) => item.id === resourceId);
  if (!question || !resource) return null;
  const item: WrongItem = {
    id: wrongId(resourceId, questionId),
    resource_id: resourceId,
    question_id: questionId,
    title: resource.title,
    prompt: question.prompt,
    given: null,
    expected: null,
    skill_tag: question.skill_tag,
    domain: question.domain,
    strand: question.strand,
    saved_at: new Date().toISOString(),
    reason: 'bookmarked',
  };
  appendWrongItems([item], paths);
  return item;
}
