import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadQuestionBank } from './bank';
import { answersMatch, summarizeStrands } from './Review_Engine/grade';
import type {
  AnswerValue,
  ItemMark,
  NaplanDomain,
  NaplanQuestion,
  OpenMrcEntry,
  PlacementRecommendation,
  PlacementReport,
  PlacementStrandReport,
  PlacementStudentQuestion,
  StrandSummary,
} from './types';

/** Strands under this accuracy are weak once a key or a teacher mark exists. */
export const WEAK_THRESHOLD = 0.6;
export const RECOMMEND_PER_STRAND = 3;

const LEVEL_RANK: Record<string, number> = {
  Standard: 0,
  Intermediate: 1,
  Advanced: 2,
};

export interface PackQuestion {
  source_id: string;
  source_title: string;
  subject: string;
  strand: string;
  level: string;
  n: number;
  stem: string;
  options: string[] | null;
  kind: string;
  notes: string;
  placement_id: string;
  correct_answer: string | string[] | null;
  scoring: string;
}

interface PlacementFile {
  id: string;
  title: string;
  description: string;
  question_count: number;
  estimated_minutes: number;
  scoring_note: string;
  questions: PackQuestion[];
  recommendation_rules: {
    weak_threshold_pct: number;
    recommend_per_weak_strand: number;
    prefer_same_strand_same_or_lower_level: boolean;
  };
}

interface EntryFile {
  total: number;
  entries: Array<{
    id: string;
    title: string;
    topic: string;
    subject: string;
    level: string;
    question_count: number;
  }>;
}

export function openMrcDataDir(): string {
  return join(process.cwd(), 'question-bank', 'Lapland-Year-5', 'data');
}

export function bankTitleForCatalog(title: string): string {
  return title
    .replace(' Measurement & Geometry Test ', ' Measurement & Geometry ')
    .replace(' Number & Algebra Test ', ' Number & Algebra ')
    .replace(' Statistics & Probability Test ', ' Statistics & Probability ');
}

export function loadOpenMrcEntries(): OpenMrcEntry[] {
  const file = JSON.parse(
    readFileSync(join(openMrcDataDir(), 'main-page-entries.json'), 'utf8'),
  ) as EntryFile;
  const { resources } = loadQuestionBank();
  return file.entries.map((entry) => {
    const bank = resources.find((resource) => resource.title === bankTitleForCatalog(entry.title));
    if (!bank) {
      throw new Error(`No practice Word test matches ${entry.title}`);
    }
    return {
      id: entry.id,
      title: entry.title,
      topic: entry.topic,
      subject: entry.subject,
      level: entry.level,
      question_count: entry.question_count,
      bank_id: bank.id,
      path: bank.path,
      minutes: bank.minutes,
      passage_title: bank.passage_title,
      image_heavy: bank.image_heavy,
    };
  });
}

export function loadPlacementPack(): PlacementFile {
  return JSON.parse(
    readFileSync(join(openMrcDataDir(), 'placement-test-v1.json'), 'utf8'),
  ) as PlacementFile;
}

function domainOf(subject: string): NaplanDomain {
  if (subject === 'Numeracy') return 'Numeracy';
  if (subject === 'Reading') return 'Reading';
  return 'Language Conventions';
}

function asNaplan(question: PackQuestion): NaplanQuestion {
  return {
    id: question.placement_id,
    resource_id: question.source_id,
    number: question.n,
    domain: domainOf(question.subject),
    strand: question.strand,
    skill_tag: question.notes || question.strand,
    difficulty: question.level,
    prompt: question.stem,
    options: question.options ?? [],
    response_kind: 'single',
    correct_answer: question.correct_answer,
    key_status: question.correct_answer == null ? 'missing' : 'capture_suggestion',
    image_heavy: false,
  };
}

export function placementStudentPaper(): {
  id: string;
  title: string;
  description: string;
  question_count: number;
  estimated_minutes: number;
  scoring_note: string;
  questions: PlacementStudentQuestion[];
} {
  const pack = loadPlacementPack();
  return {
    id: pack.id,
    title: pack.title,
    description: pack.description,
    question_count: pack.question_count,
    estimated_minutes: pack.estimated_minutes,
    scoring_note: pack.scoring_note,
    questions: pack.questions.map((question, index) => ({
      id: question.placement_id,
      number: index + 1,
      strand: question.strand,
      level: question.level,
      subject: question.subject,
      prompt: question.stem,
      options: question.options ?? [],
      scoreable: question.correct_answer != null,
      source_id: question.source_id,
      source_title: question.source_title,
    })),
  };
}

function answeredValue(value: AnswerValue | undefined): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function highestLevel(levels: string[]): string {
  return levels.reduce((best, level) =>
    (LEVEL_RANK[level] ?? 0) > (LEVEL_RANK[best] ?? 0) ? level : best,
  );
}

function recommendStrand(
  strand: string,
  anchor: string,
  entries: OpenMrcEntry[],
  reason: string,
): PlacementRecommendation[] {
  const ceiling = LEVEL_RANK[anchor] ?? 0;
  return entries
    .filter((entry) => entry.topic === strand && (LEVEL_RANK[entry.level] ?? 99) <= ceiling)
    .sort((left, right) => {
      const leftDistance = ceiling - (LEVEL_RANK[left.level] ?? 0);
      const rightDistance = ceiling - (LEVEL_RANK[right.level] ?? 0);
      if (leftDistance !== rightDistance) return leftDistance - rightDistance;
      return left.id.localeCompare(right.id);
    })
    .slice(0, RECOMMEND_PER_STRAND)
    .map((entry) => ({
      catalog_id: entry.id,
      resource_id: entry.bank_id,
      title: entry.title,
      strand: entry.topic,
      level: entry.level,
      subject: entry.subject,
      reason,
    }));
}

/**
 * Score a placement sitting.
 * `correct_answer` is read from the pack. While it is null, nothing is invented:
 * the attempt is stored, and a teacher mark can set a provisional right/wrong.
 * Filling `correct_answer` later turns on the same grader.
 */
export function analysePlacementQuestions(
  questions: PackQuestion[],
  entries: OpenMrcEntry[],
  answers: Record<string, AnswerValue | undefined>,
  teacherMarks: Record<string, boolean | undefined> = {},
): {
  marks: ItemMark[];
  correct: number;
  scored: number;
  total: number;
  keyed: number;
  score_label: string;
  strand_summary: StrandSummary[];
  report: PlacementReport;
} {
  const marks: ItemMark[] = [];
  const rows: Array<{
    strand: string;
    subject: string;
    level: string;
    answered: boolean;
    scored: boolean;
    correct: boolean | null;
    pending: boolean;
  }> = [];

  for (const question of questions) {
    const naplan = asNaplan(question);
    const given = answeredValue(answers[question.placement_id]);
    const teacherMark = teacherMarks[question.placement_id];
    let correct: boolean | null = null;
    let scored = false;
    let expected: string | null = null;
    if (question.correct_answer != null && given) {
      const judged = answersMatch(naplan, given);
      if (judged) {
        correct = judged.correct;
        scored = true;
        expected = judged.expected;
      }
    } else if (question.correct_answer == null && given && typeof teacherMark === 'boolean') {
      correct = teacherMark;
      scored = true;
    }
    const pending = question.correct_answer == null && !scored;
    marks.push({
      question_id: question.placement_id,
      strand: question.strand,
      skill_tag: naplan.skill_tag,
      domain: naplan.domain,
      given,
      expected,
      correct,
      scored,
      prompt: question.stem,
    });
    rows.push({
      strand: question.strand,
      subject: question.subject,
      level: question.level,
      answered: given != null,
      scored,
      correct,
      pending,
    });
  }

  const strandOrder: string[] = [];
  for (const row of rows) {
    if (!strandOrder.includes(row.strand)) strandOrder.push(row.strand);
  }

  const strands: PlacementStrandReport[] = strandOrder.map((strand) => {
    const owned = rows.filter((row) => row.strand === strand);
    const scoredRows = owned.filter((row) => row.scored);
    const correct = scoredRows.filter((row) => row.correct).length;
    const accuracy = scoredRows.length > 0 ? correct / scoredRows.length : null;
    const answered = owned.filter((row) => row.answered).length;
    const weak = accuracy == null ? answered > 0 : accuracy < WEAK_THRESHOLD;
    return {
      strand,
      subject: owned[0]?.subject ?? '',
      answered,
      total: owned.length,
      correct,
      scored: scoredRows.length,
      accuracy,
      pending_keys: owned.filter((row) => row.pending).length,
      weak,
      levels: [...new Set(owned.map((row) => row.level))],
    };
  });

  const recommendations: PlacementRecommendation[] = [];
  for (const strand of strands.filter((item) => item.weak)) {
    const owned = rows.filter((row) => row.strand === strand.strand);
    const missed = owned
      .filter((row) => row.scored && row.correct === false)
      .map((row) => row.level);
    const anchor = missed.length > 0 ? highestLevel(missed) : 'Standard';
    const percent = strand.accuracy == null ? null : Math.round(strand.accuracy * 100);
    const reason =
      percent == null
        ? `${strand.strand}: ${strand.answered}/${strand.total} answered, no key yet. Provisional practice at Standard or below.`
        : `${strand.strand}: ${strand.correct}/${strand.scored} (${percent}%) is below 60%. Practice at ${anchor} or below.`;
    recommendations.push(...recommendStrand(strand.strand, anchor, entries, reason));
  }

  const keyed = questions.filter((question) => question.correct_answer != null).length;
  const answered = rows.filter((row) => row.answered).length;
  const scored = marks.filter((mark) => mark.scored).length;
  const correct = marks.filter((mark) => mark.correct).length;
  const scoreLabel =
    keyed === 0
      ? `Answered ${answered} of ${questions.length}. No key is stored yet, so this sitting stays provisional until correct_answer is filled in.`
      : `${correct}/${scored} matched a stored key (${scored === 0 ? 0 : Math.round((correct / scored) * 100)}%). ${questions.length - keyed} item${questions.length - keyed === 1 ? '' : 's'} still have no key.`;

  return {
    marks,
    correct,
    scored,
    total: questions.length,
    keyed,
    score_label: scoreLabel,
    strand_summary: summarizeStrands(marks),
    report: {
      answered,
      total: questions.length,
      keyed,
      strands,
      weak: strands.filter((strand) => strand.weak),
      recommendations,
    },
  };
}

export function analysePlacementAttempt(input: {
  answers: Record<string, AnswerValue | undefined>;
  teacherMarks?: Record<string, boolean | undefined>;
}) {
  return analysePlacementQuestions(
    loadPlacementPack().questions,
    loadOpenMrcEntries(),
    input.answers,
    input.teacherMarks ?? {},
  );
}
