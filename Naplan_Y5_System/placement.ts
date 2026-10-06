import type {
  NaplanQuestion,
  NaplanResource,
  PracticeRecommendation,
  SkillSummary,
  WeakSpotReport,
} from './types';

const PLACEMENT_STRANDS = [
  'Grammar & Punctuation',
  'Spelling',
  'Measurement & Geometry',
  'Number & Algebra',
  'Statistics & Probability',
  'Reading',
] as const;

/** Two items per strand. Keyed Standard items are preferred so the report can score. */
export function selectPlacementQuestions(questions: NaplanQuestion[]): NaplanQuestion[] {
  const picked: NaplanQuestion[] = [];
  for (const strand of PLACEMENT_STRANDS) {
    const pool = questions.filter((question) => question.strand === strand);
    const keyed = pool.filter(
      (question) => question.correct_answer != null && question.difficulty === 'Standard',
    );
    const source =
      keyed.length > 0 ? keyed : pool.filter((question) => question.difficulty === 'Standard');
    const seen = new Set<string>();
    for (const question of source) {
      if (seen.has(question.resource_id)) continue;
      seen.add(question.resource_id);
      picked.push(question);
      if (seen.size === 2) break;
    }
  }
  return picked;
}

export function weakSpotReport(
  skills: SkillSummary[],
  resources: NaplanResource[],
): WeakSpotReport {
  const weak = skills.filter((skill) => skill.scored > 0 && skill.accuracy < 0.67);
  const recommendations: PracticeRecommendation[] = [];
  const seen = new Set<string>();

  const add = (resource: NaplanResource | undefined, reason: string) => {
    if (!resource || seen.has(resource.id)) return;
    seen.add(resource.id);
    recommendations.push({
      resource_id: resource.id,
      title: resource.title,
      domain: resource.domain,
      strand: resource.strand,
      reason,
    });
  };

  for (const skill of weak) {
    const resource = resources.find(
      (item) => item.strand === skill.strand && item.skill_tags.includes(skill.skill_tag),
    );
    add(
      resource ??
        resources.find((item) => item.strand === skill.strand && item.level === 'Standard'),
      `${skill.skill_tag}: ${skill.correct}/${skill.scored} on the level test`,
    );
  }

  for (const strand of PLACEMENT_STRANDS) {
    const scored = skills
      .filter((skill) => skill.strand === strand)
      .reduce((sum, skill) => sum + skill.scored, 0);
    if (scored > 0) continue;
    add(
      resources.find((item) => item.strand === strand && item.level === 'Standard'),
      `${strand} has no capture key on the level test. Start the Standard practice set and save unsure items to the wrong-answer bank.`,
    );
  }

  return { skills, weak, recommendations };
}
