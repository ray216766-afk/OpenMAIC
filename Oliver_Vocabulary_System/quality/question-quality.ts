import type { ReviewExercise, ReviewExerciseType, VocabularyEntry } from '../types';

export const NONE_OF_THESE_PATTERN =
  /^(none of these|none of the above|all of the above|not sure)$/i;

/**
 * Concept nouns (and near-concept words) that must never be forced into antonym items.
 * Named in the quality spec: environment, perspective, evidence, method, process.
 */
export const NEVER_ANTONYM_WORDS = new Set([
  'environment',
  'perspective',
  'evidence',
  'method',
  'process',
  'context',
  'strategy',
  'structure',
  'approach',
  'factor',
  'criteria',
  'hypothesis',
  'phenomenon',
  'implication',
  'inference',
  'paradigm',
  'dichotomy',
  'proportion',
  'capacity',
  'impact',
  'consequence',
  'benefit',
  'outline',
  'focus',
  'variable',
  'component',
]);

const FUNCTION_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'to',
  'of',
  'in',
  'on',
  'for',
  'with',
  'from',
  'that',
  'this',
  'these',
  'those',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'as',
  'at',
  'by',
  'it',
  'its',
  'you',
  'we',
  'they',
  'he',
  'she',
  'his',
  'her',
  'their',
  'our',
  'not',
  'no',
  'so',
  'if',
  'than',
  'then',
  'into',
  'about',
  'over',
  'after',
  'before',
  'which',
  'who',
  'whom',
  'what',
  'when',
  'where',
  'how',
  'can',
  'could',
  'should',
  'would',
  'may',
  'might',
  'must',
  'will',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'your',
  'my',
]);

const VAGUE_STEMS = [
  /^after the debate,\s*we\s*_*\.?$/i,
  /the most accurate word was/i,
  /oliver decided that the most accurate word/i,
  /^after thinking carefully/i,
];

const ABSURD_OPTION = /\b(helicopter|magpie|unicorn|school uniform|celebration|stuff|things)\b/i;

export interface QualityCheck {
  ok: boolean;
  errors: string[];
}

export function normalizePos(value: string | undefined): 'verb' | 'noun' | 'adjective' | 'adverb' | 'other' {
  const pos = (value ?? '').toLowerCase();
  if (pos.includes('verb')) return 'verb';
  if (pos.includes('noun')) return 'noun';
  if (pos.includes('adj')) return 'adjective';
  if (pos.includes('adv')) return 'adverb';
  return 'other';
}

export function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z\s'-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !FUNCTION_WORDS.has(word));
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function isNoneOfThese(value: string): boolean {
  return NONE_OF_THESE_PATTERN.test(value.trim());
}

export function hasClearNearSynonym(entry: VocabularyEntry): boolean {
  const synonym = entry.synonyms.find((item) => item && item.trim() && item.toLowerCase() !== entry.word.toLowerCase());
  if (!synonym) return false;
  // Near-synonyms should be classroom-plain, not a rarer paraphrase of the same lemma.
  if (synonym.length > 16) return false;
  return true;
}

export function hasClearAntonym(entry: VocabularyEntry): boolean {
  const key = entry.word.toLowerCase();
  if (NEVER_ANTONYM_WORDS.has(key)) return false;
  const antonym = entry.antonyms.find((item) => item && item.trim());
  if (!antonym) return false;
  if (entry.synonyms.some((item) => item.toLowerCase() === antonym.toLowerCase())) return false;
  if (antonym.toLowerCase() === key) return false;
  return true;
}

export function hasClearDefinition(entry: VocabularyEntry): boolean {
  const definition = (entry.simple_definition || entry.definition || '').trim();
  if (definition.length < 12) return false;
  return contentWords(definition).length >= 3;
}

export function suitableQuestionTypes(entry: VocabularyEntry): ReviewExerciseType[] {
  const types: ReviewExerciseType[] = [];
  if (hasClearDefinition(entry)) types.push('meaning_matching');
  if (hasClearNearSynonym(entry)) types.push('synonym_selection');
  if (hasClearAntonym(entry)) types.push('antonym_selection');
  if (entry.example_sentence || (entry.common_collocations ?? entry.collocations).length > 0) {
    types.push('fill_in_the_blank');
    types.push('sentence_completion');
  }
  if (types.length === 0 && hasClearDefinition(entry)) types.push('meaning_matching');
  return types;
}

export function pickSuitableType(
  entry: VocabularyEntry,
  index: number,
  attempt = 0,
): ReviewExerciseType {
  const rotation: ReviewExerciseType[] = [
    'meaning_matching',
    'synonym_selection',
    'antonym_selection',
    'fill_in_the_blank',
    'sentence_completion',
  ];
  const suitable = suitableQuestionTypes(entry);
  const start = (index + attempt) % rotation.length;
  for (let offset = 0; offset < rotation.length; offset += 1) {
    const candidate = rotation[(start + offset) % rotation.length];
    if (suitable.includes(candidate)) return candidate;
  }
  return 'meaning_matching';
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function blankWordInSentence(sentence: string, word: string): string | null {
  const pattern = new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i');
  if (!pattern.test(sentence)) return null;
  return sentence.replace(pattern, '______');
}

export function stemHasSemanticClues(stem: string, entry: VocabularyEntry): boolean {
  const remainder = stem.replace(/_+/g, ' ');
  if (VAGUE_STEMS.some((pattern) => pattern.test(stem.trim()))) return false;
  const leftover = contentWords(remainder);
  if (leftover.length < 5) return false;

  const clueSource = [
    entry.simple_definition || entry.definition,
    ...(entry.common_collocations ?? entry.collocations),
    entry.example_sentence,
  ]
    .filter(Boolean)
    .join(' ');
  const clues = contentWords(clueSource).filter((word) => word !== entry.word.toLowerCase());
  const overlap = leftover.filter((word) => clues.includes(word));
  return overlap.length >= 1;
}

export function insertOption(stem: string, option: string): string {
  if (stem.includes('______')) return stem.replace('______', option);
  return `${stem} ${option}`;
}

function optionFitsClues(stem: string, optionEntry: VocabularyEntry, target: VocabularyEntry): boolean {
  if (optionEntry.word.toLowerCase() === target.word.toLowerCase()) return true;
  const remainder = contentWords(stem.replace(/_+/g, ' '));
  const optionClues = contentWords(
    [
      optionEntry.simple_definition || optionEntry.definition,
      ...(optionEntry.common_collocations ?? optionEntry.collocations),
      optionEntry.example_sentence,
    ].join(' '),
  );
  const overlap = remainder.filter((word) => optionClues.includes(word)).length;
  const targetClues = contentWords(
    [
      target.simple_definition || target.definition,
      ...(target.common_collocations ?? target.collocations),
      target.example_sentence,
    ].join(' '),
  );
  const targetOverlap = remainder.filter((word) => targetClues.includes(word)).length;
  // Another lemma is defensible if it shares as many (or more) contextual clues.
  return overlap >= 2 && overlap >= targetOverlap;
}

export function grammarPlausible(stem: string, option: string, pos: ReturnType<typeof normalizePos>): boolean {
  const before = stem.split('______')[0]?.trim().toLowerCase() ?? '';
  const last = before.split(/\s+/).filter(Boolean).pop() ?? '';
  if (['a', 'an', 'the', 'this', 'that', 'each', 'every', 'one'].includes(last)) {
    return pos === 'noun' || pos === 'adjective';
  }
  if (['to', 'will', 'would', 'can', 'could', 'should', 'must', 'we', 'they', 'i'].includes(last)) {
    return pos === 'verb';
  }
  if (['very', 'more', 'most', 'became', 'become', 'was', 'were', 'is', 'are'].includes(last)) {
    return pos === 'adjective' || pos === 'adverb';
  }
  if (option.length === 0) return false;
  return true;
}

export function definitionsTooClose(a: string, b: string): boolean {
  const left = contentWords(a);
  const right = contentWords(b);
  if (left.length === 0 || right.length === 0) return false;
  const overlap = left.filter((word) => right.includes(word)).length;
  const ratio = overlap / Math.min(left.length, right.length);
  return overlap >= 3 && ratio >= 0.5;
}

export function validateUniqueAnswer(
  exercise: Pick<ReviewExercise, 'type' | 'prompt' | 'options' | 'answer' | 'word'>,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
): QualityCheck {
  const errors: string[] = [];
  const options = exercise.options ?? [];
  if (options.filter((option) => option.trim().toLowerCase() === exercise.answer.trim().toLowerCase()).length !== 1) {
    errors.push(`"${exercise.word}" must have exactly one marked correct option`);
  }

  const byWord = new Map(master.map((item) => [item.word.toLowerCase(), item]));

  if (exercise.type === 'sentence_completion' || exercise.type === 'fill_in_the_blank') {
    if (!stemHasSemanticClues(exercise.prompt, entry)) {
      errors.push(`"${exercise.word}" stem is too vague to isolate a single meaning`);
    }
    const remainder = contentWords(exercise.prompt.replace(/_+/g, ' '));
    const vague = remainder.length < 5;
    const defensible: string[] = [];
    for (const option of options) {
      const optionEntry = byWord.get(option.toLowerCase());
      const pos = optionEntry ? normalizePos(optionEntry.part_of_speech) : normalizePos(entry.part_of_speech);
      if (!grammarPlausible(exercise.prompt, option, pos)) continue;
      if (!optionEntry) {
        if (option.toLowerCase() === entry.word.toLowerCase()) defensible.push(option);
        continue;
      }
      if (vague && pos === normalizePos(entry.part_of_speech)) {
        defensible.push(option);
        continue;
      }
      if (optionFitsClues(exercise.prompt, optionEntry, entry)) defensible.push(option);
    }
    const unique = [...new Set(defensible.map((item) => item.toLowerCase()))];
    if (unique.length > 1) {
      errors.push(
        `"${exercise.word}" stem is ambiguous; a Y5–Y6 speaker could defend ${unique.join(' and ')}`,
      );
    }
  }

  if (exercise.type === 'meaning_matching') {
    const close = options.filter(
      (option) =>
        option !== exercise.answer && definitionsTooClose(option, exercise.answer || entry.definition),
    );
    if (close.length > 0) {
      errors.push(`"${exercise.word}" meaning options are too close to distinguish`);
    }
  }

  if (exercise.type === 'synonym_selection') {
    const extraSynonyms = options.filter((option) =>
      entry.synonyms.some((synonym) => synonym.toLowerCase() === option.toLowerCase() && option !== exercise.answer),
    );
    if (extraSynonyms.length > 0) {
      errors.push(`"${exercise.word}" synonym item has more than one acceptable synonym`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateDistractors(
  exercise: Pick<ReviewExercise, 'type' | 'prompt' | 'options' | 'answer' | 'word'>,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
): QualityCheck {
  const errors: string[] = [];
  const options = exercise.options ?? [];
  if (options.length !== 4) errors.push(`"${exercise.word}" must have exactly 4 options`);
  if (new Set(options.map((option) => option.trim().toLowerCase())).size !== options.length) {
    errors.push(`"${exercise.word}" has duplicate options`);
  }
  for (const option of options) {
    if (isNoneOfThese(option)) errors.push(`"${exercise.word}" uses "none of these" as an escape option`);
    if (ABSURD_OPTION.test(option) && option !== exercise.answer) {
      errors.push(`"${exercise.word}" has an absurd or unrelated distractor: ${option}`);
    }
  }

  const byWord = new Map(master.map((item) => [item.word.toLowerCase(), item]));
  if (exercise.type === 'sentence_completion' || exercise.type === 'fill_in_the_blank') {
    const targetPos = normalizePos(entry.part_of_speech);
    for (const option of options) {
      const optionEntry = byWord.get(option.toLowerCase());
      const pos = optionEntry ? normalizePos(optionEntry.part_of_speech) : targetPos;
      if (!grammarPlausible(exercise.prompt, option, pos)) {
        errors.push(`"${exercise.word}" distractor "${option}" fails on grammar alone`);
      }
    }
  }

  if (exercise.type === 'meaning_matching') {
    const lengths = options.map((option) => option.length);
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    if (max > min * 4 && min < 20) {
      errors.push(`"${exercise.word}" meaning distractors are not similar in level/length`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateTeacherWorkbook(
  exercise: ReviewExercise,
  entry: VocabularyEntry,
): QualityCheck {
  const errors: string[] = [];
  if (!exercise.prompt.trim()) errors.push(`"${exercise.word}" has an empty prompt`);
  if ((exercise.options?.length ?? 0) !== 4) {
    errors.push(`"${exercise.word}" would need editing: workbook items need 4 options`);
  }
  if (isNoneOfThese(exercise.answer)) {
    errors.push(`"${exercise.word}" answers with "none of these"`);
  }
  if (
    (exercise.type === 'sentence_completion' || exercise.type === 'fill_in_the_blank') &&
    !stemHasSemanticClues(exercise.prompt, entry)
  ) {
    errors.push(`"${exercise.word}" stem does not test meaning through context`);
  }
  if (exercise.type === 'antonym_selection' && !hasClearAntonym(entry)) {
    errors.push(`"${exercise.word}" is not suitable for an antonym item`);
  }
  if (exercise.type === 'synonym_selection' && !hasClearNearSynonym(entry)) {
    errors.push(`"${exercise.word}" is not suitable for a synonym item`);
  }
  return { ok: errors.length === 0, errors };
}

export function validateReviewExercise(
  exercise: ReviewExercise,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
): QualityCheck {
  const errors = [
    ...validateTeacherWorkbook(exercise, entry).errors,
    ...validateDistractors(exercise, entry, master).errors,
    ...validateUniqueAnswer(exercise, entry, master).errors,
  ];
  return { ok: errors.length === 0, errors };
}

export function runVocabQa(
  exercises: ReviewExercise[],
  words: VocabularyEntry[],
  master: VocabularyEntry[],
): QualityCheck {
  const byWord = new Map(words.map((entry) => [entry.word.toLowerCase(), entry]));
  const errors: string[] = [];
  const noneCount = exercises.filter(
    (exercise) =>
      isNoneOfThese(exercise.answer) || exercise.options?.some((option) => isNoneOfThese(option)),
  ).length;
  if (noneCount > 0) {
    errors.push(`"none of these" appears on ${noneCount} item(s); do not use it as a default escape`);
  }

  for (const exercise of exercises) {
    const entry = byWord.get(exercise.word.toLowerCase()) ?? master.find((item) => item.word === exercise.word);
    if (!entry) {
      errors.push(`Missing vocabulary entry for ${exercise.word}`);
      continue;
    }
    const result = validateReviewExercise(exercise, entry, master);
    errors.push(...result.errors);
  }
  return { ok: errors.length === 0, errors };
}

export function similarLevel(a: VocabularyEntry, b: VocabularyEntry): boolean {
  if (Math.abs(a.level - b.level) <= 1) return true;
  const left = a.difficulty_score ?? a.level * 3;
  const right = b.difficulty_score ?? b.level * 3;
  return Math.abs(left - right) <= 3;
}
