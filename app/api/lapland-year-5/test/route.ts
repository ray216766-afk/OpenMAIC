import { loadQuestionBank, resourceQuestions } from '@/Naplan_Y5_System/bank';
import { toStudentQuestion } from '@/Naplan_Y5_System/student-view';
import { apiError, apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return apiError('MISSING_REQUIRED_FIELD', 400, 'Test id is required');
  const { resources } = loadQuestionBank();
  const resource = resources.find((item) => item.id === id);
  if (!resource) return apiError('INVALID_REQUEST', 404, 'Practice test not found');
  return apiSuccess({
    resource: {
      id: resource.id,
      domain: resource.domain,
      title: resource.title,
      level: resource.level,
      strand: resource.strand,
      minutes: resource.minutes,
      question_count: resource.question_count,
      passage_title: resource.passage_title,
      passage: resource.passage,
      image_heavy: resource.image_heavy,
      path: resource.path,
    },
    questions: resourceQuestions(id).map(toStudentQuestion),
  });
}
