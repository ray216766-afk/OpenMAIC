import { loadQuestionBank } from './bank';
import { analysePlacementAttempt, placementStudentPaper } from './openmrc-pack';
import { gradeQuestions, summarizeStrands } from './Review_Engine/grade';
import { appendWrongItems, rememberAttempt, wrongItemsFromMarks } from './store';
import type { AnswerValue, AttemptRecord, PlacementReport } from './types';

function nowId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export function submitPractice(input: {
  resourceId: string;
  answers: Record<string, AnswerValue | undefined>;
  bookmarks?: string[];
}): {
  attempt: AttemptRecord;
  saved_wrong: number;
  score_label: string;
  strand_summary: ReturnType<typeof summarizeStrands>;
} {
  const { resources, questions } = loadQuestionBank();
  const resource = resources.find((item) => item.id === input.resourceId);
  if (!resource) throw new Error('Practice test not found');
  const owned = questions.filter((question) => question.resource_id === resource.id);
  const graded = gradeQuestions(owned, input.answers);
  const keyed = owned.filter((question) => question.correct_answer != null).length;
  const submittedAt = new Date().toISOString();
  const attempt: AttemptRecord = {
    id: nowId(resource.id),
    kind: 'practice',
    resource_id: resource.id,
    title: resource.title,
    submitted_at: submittedAt,
    correct: graded.correct,
    scored: graded.scored,
    total: graded.total,
    marks: graded.marks,
  };
  rememberAttempt(attempt);
  const saved = appendWrongItems(
    wrongItemsFromMarks(graded.marks, resource.id, resource.title, input.bookmarks ?? []),
  );
  return {
    attempt,
    saved_wrong: saved,
    score_label: scoreLabel(graded.correct, graded.scored, graded.total, keyed),
    strand_summary: summarizeStrands(graded.marks),
  };
}

export function placementPaper() {
  const paper = placementStudentPaper();
  return {
    id: paper.id,
    title: paper.title,
    description: paper.description,
    question_count: paper.question_count,
    estimated_minutes: paper.estimated_minutes,
    scoring_note: paper.scoring_note,
    questions: paper.questions,
  };
}

export function submitPlacement(input: {
  answers: Record<string, AnswerValue | undefined>;
  bookmarks?: string[];
  teacherMarks?: Record<string, boolean | undefined>;
}): {
  attempt: AttemptRecord;
  report: PlacementReport;
  saved_wrong: number;
  score_label: string;
  strand_summary: ReturnType<typeof summarizeStrands>;
} {
  const graded = analysePlacementAttempt({
    answers: input.answers,
    teacherMarks: input.teacherMarks,
  });
  const submittedAt = new Date().toISOString();
  const attempt: AttemptRecord = {
    id: nowId('placement'),
    kind: 'placement',
    resource_id: null,
    title: 'Year 5 placement test',
    submitted_at: submittedAt,
    correct: graded.correct,
    scored: graded.scored,
    total: graded.total,
    marks: graded.marks,
  };
  rememberAttempt(attempt);
  const saved = appendWrongItems(
    wrongItemsFromMarks(graded.marks, 'placement', 'Year 5 placement test', input.bookmarks ?? []),
  );
  return {
    attempt,
    report: graded.report,
    saved_wrong: saved,
    score_label: graded.score_label,
    strand_summary: graded.strand_summary,
  };
}

export function scoreLabel(correct: number, scored: number, total: number, keyed = scored): string {
  const withoutKey = total - keyed;
  const blank = Math.max(keyed - scored, 0);
  if (keyed === 0) {
    return `Submitted ${total} items. No capture key to score — save unsure items to the wrong-answer bank.`;
  }
  if (scored === 0) {
    return `No scoreable answers submitted. ${withoutKey} item${withoutKey === 1 ? '' : 's'} had no key.`;
  }
  const rate = Math.round((correct / scored) * 100);
  const blankNote =
    blank > 0 ? ` ${blank} scoreable item${blank === 1 ? '' : 's'} left blank.` : '';
  const missingNote =
    withoutKey > 0 ? ` ${withoutKey} item${withoutKey === 1 ? '' : 's'} had no key.` : '';
  return `${correct}/${scored} matched the capture suggestion (${rate}%).${blankNote}${missingNote}`;
}
