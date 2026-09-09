import {
  blankWordInSentence,
  definitionsTooClose,
  grammarPlausible,
  hasClearAntonym,
  isNoneOfThese,
  normalizePos,
  pickSuitableType,
  similarLevel,
  stemHasSemanticClues,
  suitableQuestionTypes,
  validateReviewExercise,
} from '../quality';
import type { ReviewExercise, ReviewExerciseType, VocabularyEntry } from '../types';

export interface BuildExercisesOptions {
  attempt?: number;
}

export function shuffle<T>(items: T[], seed: number): T[] {
  const next = [...items];
  let state = seed || 1;
  for (let i = next.length - 1; i > 0; i -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const j = state % (i + 1);
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function uniqueOptions(correct: string, distractors: string[], seed: number, size = 4): string[] {
  const pool = [
    correct,
    ...distractors.filter((item) => item && item !== correct && !isNoneOfThese(item)),
  ];
  const picked = shuffle([...new Set(pool)], seed).slice(0, size);
  if (!picked.includes(correct)) {
    picked[picked.length - 1] = correct;
  }
  while (picked.length < size) {
    picked.push(`option ${picked.length + 1}`);
  }
  return shuffle(picked, seed + 7);
}

function otherDefinitions(master: VocabularyEntry[], entry: VocabularyEntry): string[] {
  return master
    .filter((item) => item.word !== entry.word)
    .map((item) => item.simple_definition || item.definition)
    .filter(
      (definition): definition is string =>
        Boolean(definition) && !definitionsTooClose(definition, entry.simple_definition || entry.definition),
    );
}

function otherSynonyms(master: VocabularyEntry[], entry: VocabularyEntry): string[] {
  const banned = new Set(
    [entry.word, ...entry.synonyms, entry.antonyms[0] ?? ''].map((item) => item.toLowerCase()),
  );
  return master
    .filter((item) => item.word !== entry.word && similarLevel(item, entry))
    .flatMap((item) => item.synonyms.slice(0, 1))
    .filter((item) => item && !banned.has(item.toLowerCase()) && !isNoneOfThese(item));
}

function otherAntonyms(master: VocabularyEntry[], entry: VocabularyEntry): string[] {
  const banned = new Set(
    [entry.word, ...entry.synonyms, ...entry.antonyms].map((item) => item.toLowerCase()),
  );
  const fromAntonyms = master
    .filter((item) => item.word !== entry.word && hasClearAntonym(item))
    .flatMap((item) => item.antonyms.slice(0, 1))
    .filter((item) => item && !banned.has(item.toLowerCase()) && !isNoneOfThese(item));
  const padding = samePosWords(master, entry)
    .map((item) => item.word)
    .filter((word) => !banned.has(word.toLowerCase()));
  return [...fromAntonyms, ...padding];
}

function samePosWords(master: VocabularyEntry[], entry: VocabularyEntry): VocabularyEntry[] {
  const pos = normalizePos(entry.part_of_speech);
  const banned = new Set(
    [entry.word, ...entry.synonyms].map((item) => item.toLowerCase()),
  );
  return master.filter((item) => {
    if (banned.has(item.word.toLowerCase())) return false;
    if (normalizePos(item.part_of_speech) !== pos && pos !== 'other') return false;
    return similarLevel(item, entry);
  });
}

function collocationStem(entry: VocabularyEntry): string | null {
  const colo = (entry.common_collocations ?? entry.collocations)[0];
  if (!colo) return null;
  const blanked = blankWordInSentence(colo, entry.word);
  if (blanked) {
    return `In careful academic writing, the missing word belongs here: "${blanked}".`;
  }
  if (colo.toLowerCase().startsWith(entry.word.toLowerCase())) {
    const rest = colo.slice(entry.word.length).trim();
    return `Choose the precise word: students ______ ${rest} when they want a clear academic sentence.`;
  }
  return `Choose the precise word that completes this school phrase: ______ ${colo}.`;
}

function contextualStems(entry: VocabularyEntry): string[] {
  const stems: string[] = [];
  const fromExample = blankWordInSentence(entry.example_sentence, entry.word);
  if (fromExample) stems.push(fromExample);
  const colo = collocationStem(entry);
  if (colo) stems.push(colo);
  const improved = entry.creative_writing_example?.split('/').pop()?.replace(/^Improved:\s*/i, '').trim();
  if (improved) {
    const blankedImproved = blankWordInSentence(improved, entry.word);
    if (blankedImproved) stems.push(blankedImproved);
  }
  return stems.filter((stem) => stemHasSemanticClues(stem, entry));
}

function meaningExercise(
  id: string,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
  seed: number,
): ReviewExercise {
  const answer = entry.simple_definition || entry.definition;
  return {
    id,
    type: 'meaning_matching',
    word: entry.word,
    prompt: `Which definition matches "${entry.word}"?`,
    options: uniqueOptions(answer, otherDefinitions(master, entry), seed),
    answer,
  };
}

function synonymExercise(
  id: string,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
  seed: number,
): ReviewExercise {
  const answer = entry.synonyms.find((item) => item && item.toLowerCase() !== entry.word.toLowerCase()) ?? entry.word;
  return {
    id,
    type: 'synonym_selection',
    word: entry.word,
    prompt: `Choose the best near-synonym for "${entry.word}".`,
    options: uniqueOptions(answer, otherSynonyms(master, entry), seed),
    answer,
  };
}

function antonymExercise(
  id: string,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
  seed: number,
): ReviewExercise {
  const answer = entry.antonyms[0];
  return {
    id,
    type: 'antonym_selection',
    word: entry.word,
    prompt: `Choose the clearest opposite of "${entry.word}".`,
    options: uniqueOptions(answer, otherAntonyms(master, entry), seed),
    answer,
  };
}

function completionDistractors(
  entry: VocabularyEntry,
  master: VocabularyEntry[],
  stem: string,
): string[] {
  return samePosWords(master, entry)
    .filter((item) => grammarPlausible(stem, item.word, normalizePos(item.part_of_speech)))
    .filter((item) => {
      const optionClues = (item.common_collocations ?? item.collocations).join(' ').toLowerCase();
      const stemText = stem.toLowerCase();
      return !optionClues.split(/\s+/).some((token) => token.length > 4 && stemText.includes(token));
    })
    .map((item) => item.word);
}

function fillExercise(
  id: string,
  entry: VocabularyEntry,
  master: VocabularyEntry[],
  seed: number,
  type: 'fill_in_the_blank' | 'sentence_completion',
): ReviewExercise | null {
  for (const stem of contextualStems(entry)) {
    const options = uniqueOptions(entry.word, completionDistractors(entry, master, stem), seed);
    const exercise: ReviewExercise = {
      id,
      type,
      word: entry.word,
      prompt: type === 'sentence_completion' ? `${stem}` : stem,
      options,
      answer: entry.word,
      hint: type === 'fill_in_the_blank' ? 'Use the exact target word.' : undefined,
    };
    if (validateReviewExercise(exercise, entry, master).ok) return exercise;
  }
  return null;
}

export function buildReviewExercise(
  entry: VocabularyEntry,
  type: ReviewExerciseType,
  master: VocabularyEntry[],
  id: string,
  seed: number,
): ReviewExercise | null {
  if (!suitableQuestionTypes(entry).includes(type)) return null;
  if (type === 'meaning_matching') return meaningExercise(id, entry, master, seed);
  if (type === 'synonym_selection') return synonymExercise(id, entry, master, seed);
  if (type === 'antonym_selection') return antonymExercise(id, entry, master, seed);
  if (type === 'fill_in_the_blank') return fillExercise(id, entry, master, seed, 'fill_in_the_blank');
  return fillExercise(id, entry, master, seed, 'sentence_completion');
}

export function buildReviewExercises(
  reviewWords: VocabularyEntry[],
  master: VocabularyEntry[],
  day: number,
  options: BuildExercisesOptions = {},
): ReviewExercise[] {
  const attempt = options.attempt ?? 0;
  return reviewWords.map((entry, index) => {
    const id = `REV${String(day).padStart(3, '0')}-${index + 1}`;
    const seed = day * 100 + index + attempt * 17;
    const preferred = pickSuitableType(entry, index, attempt);
    const order = [preferred, ...suitableQuestionTypes(entry).filter((type) => type !== preferred)];
    for (const type of order) {
      const built = buildReviewExercise(entry, type, master, id, seed);
      if (!built) continue;
      if (validateReviewExercise(built, entry, master).ok) return built;
    }
    return meaningExercise(id, entry, master, seed);
  });
}
