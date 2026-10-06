import type { AnswerValue, ItemMark, NaplanQuestion, SkillSummary, StrandSummary } from '../types';

function fold(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function asList(value: AnswerValue | null): string[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

export function answersMatch(
  question: NaplanQuestion,
  given: AnswerValue | null,
): { correct: boolean; expected: string } | null {
  if (question.correct_answer == null || given == null) return null;
  const expectedList = asList(question.correct_answer);
  const givenList = asList(given).map(fold).filter(Boolean);
  if (givenList.length === 0) return null;
  const expectedFold = expectedList.map(fold);
  const correct =
    question.response_kind === 'multi'
      ? expectedFold.length === givenList.length &&
        expectedFold.every((item) => givenList.includes(item))
      : givenList.length === 1 && givenList[0] === expectedFold[0];
  return { correct, expected: expectedList.join(' · ') };
}

export function gradeQuestions(
  questions: NaplanQuestion[],
  answers: Record<string, AnswerValue | undefined>,
): { marks: ItemMark[]; correct: number; scored: number; total: number } {
  const marks = questions.map((question) => {
    const given = answers[question.id] ?? null;
    const judged = answersMatch(question, given);
    return {
      question_id: question.id,
      strand: question.strand,
      skill_tag: question.skill_tag,
      domain: question.domain,
      given,
      expected: judged?.expected ?? null,
      correct: judged ? judged.correct : null,
      scored: judged != null,
      prompt: question.prompt,
    } satisfies ItemMark;
  });
  const scoredMarks = marks.filter((mark) => mark.scored);
  return {
    marks,
    correct: scoredMarks.filter((mark) => mark.correct).length,
    scored: scoredMarks.length,
    total: marks.length,
  };
}

export function summarizeStrands(marks: ItemMark[]): StrandSummary[] {
  const order: string[] = [];
  for (const mark of marks) {
    if (!order.includes(mark.strand)) order.push(mark.strand);
  }
  return order.map((strand) => {
    const owned = marks.filter((mark) => mark.strand === strand && mark.scored);
    return {
      strand,
      correct: owned.filter((mark) => mark.correct).length,
      scored: owned.length,
    };
  });
}

export function summarizeSkills(marks: ItemMark[]): SkillSummary[] {
  const keys: string[] = [];
  for (const mark of marks) {
    const key = `${mark.domain}::${mark.skill_tag}`;
    if (!keys.includes(key)) keys.push(key);
  }
  return keys.map((key) => {
    const sample = marks.find((mark) => `${mark.domain}::${mark.skill_tag}` === key);
    const owned = marks.filter(
      (mark) => `${mark.domain}::${mark.skill_tag}` === key && mark.scored,
    );
    const correct = owned.filter((mark) => mark.correct).length;
    return {
      skill_tag: sample?.skill_tag ?? key,
      domain: sample?.domain ?? 'Reading',
      strand: sample?.strand ?? '',
      correct,
      scored: owned.length,
      accuracy: owned.length ? correct / owned.length : 0,
    };
  });
}
