import { loadQuestionBank } from '@/Naplan_Y5_System/bank';
import { apiSuccess } from '@/lib/server/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { resources, note } = loadQuestionBank();
  return apiSuccess({
    resources: resources.map((resource) => ({
      id: resource.id,
      domain: resource.domain,
      title: resource.title,
      source: resource.source,
      path: resource.path,
      year_level: resource.year_level,
      level: resource.level,
      strand: resource.strand,
      skill_tags: resource.skill_tags,
      question_count: resource.question_count,
      minutes: resource.minutes,
      passage_title: resource.passage_title,
      image_heavy: resource.image_heavy,
    })),
    note,
  });
}
