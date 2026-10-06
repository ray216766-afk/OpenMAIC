import type { NaplanQuestion, StudentQuestion } from './types';

export function toStudentQuestion(question: NaplanQuestion): StudentQuestion {
  return {
    id: question.id,
    resource_id: question.resource_id,
    number: question.number,
    domain: question.domain,
    strand: question.strand,
    skill_tag: question.skill_tag,
    difficulty: question.difficulty,
    prompt: question.prompt,
    options: question.options,
    response_kind: question.response_kind,
    image_heavy: question.image_heavy,
    scoreable: question.correct_answer != null,
  };
}
