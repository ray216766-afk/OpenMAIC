import type { NaplanQuestion } from '../types';

export function exerciseIssues(question: NaplanQuestion): string[] {
  const issues: string[] = [];
  const unique = new Set(question.options.map((option) => option.trim().toLowerCase()));
  if (question.options.length > 0 && unique.size !== question.options.length) {
    issues.push(`${question.id} has duplicate options`);
  }
  if (question.response_kind === 'single' && question.correct_answer != null) {
    const expected = question.correct_answer;
    if (Array.isArray(expected) || !question.options.includes(expected)) {
      issues.push(`${question.id} key is not one of the options`);
    }
  }
  if (question.response_kind === 'multi' && Array.isArray(question.correct_answer)) {
    const missing = question.correct_answer.filter((answer) => !question.options.includes(answer));
    if (missing.length > 0) issues.push(`${question.id} multi key is not in the options`);
  }
  return issues;
}
