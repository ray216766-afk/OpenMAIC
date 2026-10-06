import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

/** Parent browse page. Same server as Scholarship Vocabulary (`/oliver-vocabulary`). */
export const LAPLAND_YEAR_5_ROUTE = '/lapland-year-5';

export const QUESTION_BANK_DIR = path.join(process.cwd(), 'question-bank', 'Lapland-Year-5');

export const INVENTORY_CSV_PATH = path.join(
  QUESTION_BANK_DIR,
  'inventory',
  'year5-naplan-online-style-tests.csv',
);

export const SUBJECT_ORDER = ['Conventions of Language', 'Numeracy', 'Reading', 'Writing'] as const;

export const LEVEL_ORDER = ['Standard', 'Intermediate', 'Advanced', 'Mixed'] as const;

export type TestKind = 'practice' | 'sample' | 'written' | 'other';

export interface WordDoc {
  fileName: string;
  /** Posix path relative to `question-bank/Lapland-Year-5`. */
  relativePath: string;
  slug: string;
}

export interface InventoryTest {
  pack: string;
  subject: string;
  level: string;
  testType: string;
  kind: TestKind;
  title: string;
  strand: string;
  questions: number;
  minutes: number;
  /** Set only for Practice Test rows that have an uploaded Word document. */
  wordDoc: WordDoc | null;
  /** Short passage heading when the Word capture includes one. */
  passageTitle: string | null;
  /** Reading Tests 03 and 09 are mostly an image on the source site. */
  imageHeavy: boolean;
}

export interface StrandGroup {
  strand: string;
  tests: InventoryTest[];
}

export interface LevelGroup {
  level: string;
  strands: StrandGroup[];
  testCount: number;
  wordDocCount: number;
}

export interface SubjectGroup {
  subject: string;
  levels: LevelGroup[];
  testCount: number;
  wordDocCount: number;
}

export interface Year5Catalog {
  pack: string;
  practice: InventoryTest[];
  /** Sample and written rows. Never linked as practice downloads. */
  other: InventoryTest[];
}

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function docxContentType(): string {
  return DOCX_TYPE;
}

/**
 * Match key for an inventory title or a Word filename.
 * Drops filler words so `Year_5_Measurement___Geometry_Test_01.docx` matches
 * `Year 5 Measurement & Geometry 01`, and the earlier
 * `Year-5-Grammar-and-Punctuation-Test-01.docx` names still match.
 */
export function titleSlug(value: string): string {
  const words = value
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/\.docx$/i, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word && word !== 'and' && word !== 'test');
  return words.join('-');
}

export function strandFor(subject: string, title: string): string {
  if (subject === 'Conventions of Language') {
    if (/grammar/i.test(title)) return 'Grammar & Punctuation';
    if (/spelling/i.test(title)) return 'Spelling';
    return 'Conventions of Language';
  }
  if (subject === 'Numeracy') {
    if (/measurement/i.test(title)) return 'Measurement & Geometry';
    if (/number/i.test(title)) return 'Number & Algebra';
    if (/statistics/i.test(title)) return 'Statistics & Probability';
    return 'Numeracy';
  }
  return subject;
}

export function testKind(testType: string): TestKind {
  if (testType === 'Practice Test') return 'practice';
  if (testType === 'Sample Test') return 'sample';
  if (testType === 'Written Test') return 'written';
  return 'other';
}

/** Minimal CSV reader. Inventory cells are unquoted today; quotes are still handled. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n') {
      row.push(cell);
      cell = '';
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else if (ch !== '\r') {
      cell += ch;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

export function parseInventory(
  csvText: string,
): Omit<InventoryTest, 'wordDoc' | 'passageTitle' | 'imageHeavy'>[] {
  const table = parseCsv(csvText.trim());
  const header = table[0];
  if (!header) return [];
  const index = new Map(header.map((name, position) => [name.trim(), position]));
  const required = ['pack', 'subject', 'level', 'test_type', 'title', 'questions', 'minutes'];
  for (const column of required) {
    if (!index.has(column)) {
      throw new Error(`Year 5 inventory CSV is missing the "${column}" column`);
    }
  }

  return table.slice(1).map((cells) => {
    const read = (column: string) => (cells[index.get(column) ?? -1] ?? '').trim();
    const subject = read('subject');
    const title = read('title');
    const testType = read('test_type');
    return {
      pack: read('pack'),
      subject,
      level: read('level'),
      testType,
      kind: testKind(testType),
      title,
      strand: strandFor(subject, title),
      questions: Number(read('questions')) || 0,
      minutes: Number(read('minutes')) || 0,
    };
  });
}

export function listWordDocs(root = QUESTION_BANK_DIR): WordDoc[] {
  if (!existsSync(root)) return [];
  const docs: WordDoc[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        continue;
      }
      if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.docx')) continue;
      const relativePath = path.relative(root, full).split(path.sep).join('/');
      docs.push({
        fileName: entry.name,
        relativePath,
        slug: titleSlug(entry.name),
      });
    }
  };
  walk(root);
  docs.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  return docs;
}

/** Passage headings taken from the Reading Practice Word captures. */
export const READING_PASSAGE_TITLES: Record<string, string> = {
  'Year 5 Reading Test 01': 'Land clearing',
  'Year 5 Reading Test 02': 'The Miners Rest',
  'Year 5 Reading Test 04': 'Shocking discovery',
  'Year 5 Reading Test 05': 'Words can be fun',
  'Year 5 Reading Test 06': 'Pappadams',
  'Year 5 Reading Test 07': 'Add a bit more',
  'Year 5 Reading Test 08': 'This educational game feels more like therapy than fun.',
  'Year 5 Reading Test 09': 'Battlers of the Great Depression',
  'Year 5 Reading Test 10': 'Treasure Island',
  'Year 5 Reading Test 11': 'The secret of Yesterday Hills',
};

const IMAGE_HEAVY_READING = new Set(['Year 5 Reading Test 03', 'Year 5 Reading Test 09']);

export function attachWordDocs(
  tests: Omit<InventoryTest, 'wordDoc' | 'passageTitle' | 'imageHeavy'>[],
  docs: WordDoc[],
): InventoryTest[] {
  const bySlug = new Map<string, WordDoc>();
  for (const doc of docs) {
    if (!bySlug.has(doc.slug)) bySlug.set(doc.slug, doc);
  }
  return tests.map((test) => ({
    ...test,
    wordDoc: test.kind === 'practice' ? (bySlug.get(titleSlug(test.title)) ?? null) : null,
    passageTitle: READING_PASSAGE_TITLES[test.title] ?? null,
    imageHeavy: IMAGE_HEAVY_READING.has(test.title),
  }));
}

export function buildCatalog(
  tests: Omit<InventoryTest, 'wordDoc' | 'passageTitle' | 'imageHeavy'>[],
  docs: WordDoc[],
): Year5Catalog {
  const withDocs = attachWordDocs(tests, docs);
  return {
    pack: withDocs[0]?.pack ?? 'Year 5 NAPLAN Online-style Test Pack',
    practice: withDocs.filter((test) => test.kind === 'practice'),
    other: withDocs.filter((test) => test.kind !== 'practice'),
  };
}

function orderIndex(order: readonly string[], value: string): number {
  const index = order.indexOf(value);
  return index === -1 ? order.length : index;
}

export function groupTests(tests: InventoryTest[]): SubjectGroup[] {
  const subjects: string[] = [];
  for (const test of tests) {
    if (!subjects.includes(test.subject)) subjects.push(test.subject);
  }
  subjects.sort((a, b) => orderIndex(SUBJECT_ORDER, a) - orderIndex(SUBJECT_ORDER, b));

  return subjects.map((subject) => {
    const subjectTests = tests.filter((test) => test.subject === subject);
    const levels: string[] = [];
    for (const test of subjectTests) {
      if (!levels.includes(test.level)) levels.push(test.level);
    }
    levels.sort((a, b) => orderIndex(LEVEL_ORDER, a) - orderIndex(LEVEL_ORDER, b));

    const levelGroups: LevelGroup[] = levels.map((level) => {
      const levelTests = subjectTests.filter((test) => test.level === level);
      const strands: string[] = [];
      for (const test of levelTests) {
        if (!strands.includes(test.strand)) strands.push(test.strand);
      }
      const strandGroups = strands.map((strand) => ({
        strand,
        tests: levelTests.filter((test) => test.strand === strand),
      }));
      return {
        level,
        strands: strandGroups,
        testCount: levelTests.length,
        wordDocCount: levelTests.filter((test) => test.wordDoc).length,
      };
    });

    return {
      subject,
      levels: levelGroups,
      testCount: subjectTests.length,
      wordDocCount: subjectTests.filter((test) => test.wordDoc).length,
    };
  });
}

export function subjectAnchor(subject: string): string {
  return titleSlug(subject);
}

export function docxDownloadHref(relativePath: string): string {
  return `/api/lapland-year-5/docx?file=${encodeURIComponent(relativePath)}`;
}

export function loadCatalog(csvText?: string, docs: WordDoc[] = listWordDocs()): Year5Catalog {
  const text =
    csvText ?? (existsSync(INVENTORY_CSV_PATH) ? readFileSync(INVENTORY_CSV_PATH, 'utf8') : '');
  if (!text) {
    throw new Error(`Year 5 inventory CSV was not found at ${INVENTORY_CSV_PATH}`);
  }
  return buildCatalog(parseInventory(text), docs);
}

export function resolvePracticeDocx(
  requestedPath: string | null,
  catalog: Year5Catalog = loadCatalog(),
): { absolutePath: string; fileName: string } | null {
  if (!requestedPath) return null;
  const normalized = requestedPath.replace(/\\/g, '/').replace(/^\/+/, '');
  const parts = normalized.split('/');
  if (normalized.includes('\0') || parts.some((part) => part === '..' || part === '')) {
    return null;
  }
  const match = catalog.practice.find((test) => test.wordDoc?.relativePath === normalized);
  if (!match?.wordDoc) return null;

  const root = path.resolve(QUESTION_BANK_DIR);
  const absolutePath = path.resolve(root, normalized);
  if (absolutePath !== root && !absolutePath.startsWith(`${root}${path.sep}`)) return null;
  if (!absolutePath.toLowerCase().endsWith('.docx')) return null;
  if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) return null;

  return {
    absolutePath,
    fileName: path.basename(absolutePath).replace(/["\r\n]/g, ''),
  };
}
