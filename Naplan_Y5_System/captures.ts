import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadQuestionBank } from './bank';
import { loadOpenMrcEntries, openMrcDataDir } from './openmrc-pack';
import { toStudentQuestion } from './student-view';
import type {
  NaplanDomain,
  NaplanQuestion,
  OpenMrcEntry,
  ResponseKind,
  StudentQuestion,
} from './types';

interface CaptureQuestion {
  n: number;
  stem?: string | null;
  options?: unknown;
  notes?: string | null;
  kind?: string | null;
}

interface CaptureFile {
  test_title?: string;
  passage?: string | null;
  questions: CaptureQuestion[];
}

export function capturePath(catalogId: string): string {
  if (!/^[a-z0-9-]+$/.test(catalogId)) {
    throw new Error('Practice test not found');
  }
  return join(openMrcDataDir(), 'captures', `${catalogId}.json`);
}

export function loadCapture(catalogId: string): CaptureFile {
  return JSON.parse(readFileSync(capturePath(catalogId), 'utf8')) as CaptureFile;
}

function entryFor(id: string): OpenMrcEntry {
  const entry = loadOpenMrcEntries().find((item) => item.id === id || item.bank_id === id);
  if (!entry) throw new Error('Practice test not found');
  return entry;
}

function domainOf(subject: string): NaplanDomain {
  if (subject === 'Numeracy') return 'Numeracy';
  if (subject === 'Reading') return 'Reading';
  return 'Language Conventions';
}

function fold(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function looksMulti(kind: string | null | undefined, stem: string): boolean {
  const blob = `${kind ?? ''} ${stem}`.toLowerCase();
  return (
    blob.includes('multi-select') ||
    blob.includes('choose two') ||
    blob.includes('select all') ||
    blob.includes('click-highlighted-words') ||
    blob.includes('drag-to-order')
  );
}

function normalizeOptions(
  raw: unknown,
  kind: string | null | undefined,
  stem: string,
): { options: string[]; responseKind: ResponseKind; extra: string } {
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    const lines = Object.entries(raw as Record<string, unknown>).map(([label, value]) => {
      const choices = Array.isArray(value) ? value.map(String).join(' / ') : String(value);
      return `${label}: ${choices}`;
    });
    return {
      options: [],
      responseKind: 'text',
      extra: lines.length ? `\n\n${lines.join('\n')}` : '',
    };
  }
  if (!Array.isArray(raw) || raw.length === 0) {
    return { options: [], responseKind: 'text', extra: '' };
  }
  const strings = raw.filter((item): item is string => typeof item === 'string');
  if (strings.length === 1 && /free-text/i.test(strings[0])) {
    return { options: [], responseKind: 'text', extra: '' };
  }
  const options =
    strings.length === 1 && strings[0].includes(' / ')
      ? strings[0]
          .split(' / ')
          .map((item) => item.trim())
          .filter(Boolean)
      : strings;
  return {
    options,
    responseKind: looksMulti(kind, stem) ? 'multi' : 'single',
    extra: '',
  };
}

function usableKey(
  key: string | string[] | null,
  responseKind: ResponseKind,
  options: string[],
  bankKind: ResponseKind,
): string | string[] | null {
  if (key == null || bankKind !== responseKind) return null;
  const list = Array.isArray(key) ? key : [key];
  if (responseKind === 'text') {
    return list.length === 1 && list[0].trim() && list[0].trim().length <= 40
      ? list[0].trim()
      : null;
  }
  const choices = new Set(options.map(fold));
  return list.every((item) => choices.has(fold(item))) ? key : null;
}

/** Questions Oliver sees and the server grades. `selected_answer` in the capture is ignored. */
export function captureQuestions(id: string): NaplanQuestion[] {
  const entry = entryFor(id);
  const capture = loadCapture(entry.id);
  const bankByNumber = new Map(
    loadQuestionBank()
      .questions.filter((question) => question.resource_id === entry.bank_id)
      .map((question) => [question.number, question]),
  );

  return capture.questions.map((question) => {
    const stem = question.stem?.trim() ?? '';
    const notes = question.notes ?? '';
    const normalized = normalizeOptions(
      question.options,
      question.kind,
      `${question.kind ?? ''} ${stem}`,
    );
    const prompt = `${stem || (notes.includes('stem text not captured') ? `Question ${question.n} is shown in a figure in the Word file.` : `Question ${question.n}`)}${normalized.extra}`;
    const bank = bankByNumber.get(question.n);
    const correct = usableKey(
      bank?.correct_answer ?? null,
      normalized.responseKind,
      normalized.options,
      bank?.response_kind ?? normalized.responseKind,
    );
    const imageHeavy =
      !stem ||
      /image-based|stem text not captured|\[image option/i.test(
        `${notes} ${JSON.stringify(question.options ?? '')}`,
      );
    return {
      id: `${entry.id}-q${String(question.n).padStart(2, '0')}`,
      resource_id: entry.id,
      number: question.n,
      domain: domainOf(entry.subject),
      strand: entry.topic,
      skill_tag: notes.trim() || entry.topic,
      difficulty: entry.level,
      prompt,
      options: normalized.options,
      response_kind: normalized.responseKind,
      correct_answer: correct,
      key_status: correct == null ? 'missing' : 'capture_suggestion',
      image_heavy: imageHeavy,
    };
  });
}

export function practicePaper(id: string): {
  resource: {
    id: string;
    title: string;
    level: string;
    strand: string;
    subject: string;
    question_count: number;
    passage_title: string | null;
    passage: string | null;
    path: string | null;
  };
  questions: StudentQuestion[];
} {
  const entry = entryFor(id);
  const capture = loadCapture(entry.id);
  const passage =
    typeof capture.passage === 'string' && capture.passage.trim() ? capture.passage.trim() : null;
  const questions = captureQuestions(entry.id).map(toStudentQuestion);
  return {
    resource: {
      id: entry.id,
      title: capture.test_title || entry.title,
      level: entry.level,
      strand: entry.topic,
      subject: entry.subject,
      question_count: questions.length,
      passage_title:
        passage
          ?.split('\n')
          .find((line) => line.trim())
          ?.trim() ?? entry.passage_title,
      passage,
      path: entry.path,
    },
    questions,
  };
}

export function captureCatalogIds(): string[] {
  return loadOpenMrcEntries().map((entry) => entry.id);
}
