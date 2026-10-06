import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { NaplanQuestion, NaplanResource, QuestionBankFile } from './types';

let cached: QuestionBankFile | null = null;
let cachedPath: string | null = null;

export function defaultBankPath(): string {
  const root = process.env.NAPLAN_Y5_ROOT || join(process.cwd(), 'Naplan_Y5_System');
  return join(root, 'data', 'question_bank.json');
}

export function loadQuestionBank(bankPath = defaultBankPath()): {
  resources: NaplanResource[];
  questions: NaplanQuestion[];
  note: string;
} {
  if (!cached || cachedPath !== bankPath) {
    cached = JSON.parse(readFileSync(bankPath, 'utf8')) as QuestionBankFile;
    cachedPath = bankPath;
  }
  return { resources: cached.resources, questions: cached.questions, note: cached.note };
}

export function resourceQuestions(resourceId: string, bankPath?: string): NaplanQuestion[] {
  return loadQuestionBank(bankPath).questions.filter(
    (question) => question.resource_id === resourceId,
  );
}
