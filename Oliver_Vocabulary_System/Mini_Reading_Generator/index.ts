import {
  FEATURED_TARGET_MAX,
  FEATURED_TARGET_MIN,
  READING_WORD_MAX,
  READING_WORD_MIN,
  normalizePos,
  passageContainsWord,
  runReadingPassageQa,
  runReadingQuestionQa,
  wordCount,
} from '../quality';
import type {
  MiniReading,
  ReadingQuestion,
  ReadingQuestionType,
  ReadingTheme,
  VocabularyEntry,
} from '../types';

import {
  PASSAGE_BLUEPRINTS,
  type BlueprintFacts,
  type PassageBlueprint,
  type PassageSlot,
} from './blueprints';

export interface GenerateReadingOptions {
  attempt?: number;
}

export interface BuiltPassage extends MiniReading {
  blueprintId: string;
  centralIdea: string;
  fallbackPassage: string;
  facts: BlueprintFacts;
}

export interface SlotAssignment {
  slotId: string;
  word: string;
  source: 'new' | 'review';
}

const THEMES: ReadingTheme[] = [
  'adventure',
  'mystery',
  'science',
  'history',
  'character_challenge',
  'real_world',
];

const EXPANDERS: Record<string, string> = {
  'creek-colour':
    'They packed the jars away and left the creek as they had found it, except for the notes that would have to do the talking later.',
  'ridge-trail':
    'On the walk back, nobody claimed the ridge had been easy, only that they could now describe it without showing off.',
  'sports-day-ribbon':
    'Ms Nguyen put the sleeve back on the table and called the captains, as if the afternoon could now continue in the ordinary way.',
  'goldfields-letter':
    'Oliver copied one sentence into his book — not to decorate the page, but so he would not flatten the writer into a cartoon miner.',
  'undeserved-mark':
    'On the way out of the hall he did not look for praise; he only wanted the paper to tell the truth.',
  'exam-morning':
    'Outside, a tram rattled past and ordinary Saturday continued, which was a useful reminder that the paper was work, not theatre.',
};

export function tagsFor(entry: VocabularyEntry): string[] {
  const tags = new Set<string>();
  const blob = [
    entry.word,
    entry.simple_definition || entry.definition,
    ...(entry.common_collocations ?? entry.collocations),
    entry.example_sentence,
  ]
    .join(' ')
    .toLowerCase();
  if (
    /environment|habitat|wildlife|nature|creek|pollution|surroundings/.test(blob) ||
    entry.word === 'environment'
  ) {
    tags.add('environment');
  }
  if (
    /investigat|observ|eviden|method|analys|conclu|hypothes|experiment|sample|determin|evaluat|identif|compar/.test(
      blob,
    )
  ) {
    tags.add('inquiry');
  }
  if (/justif|perspect|argument|claim|opinion|debate|reason|persuasi/.test(blob)) {
    tags.add('argument');
  }
  if (/exam|scholarship|classroom|reading|strateg|school|paper/.test(blob)) tags.add('school');
  if (/histor|museum|past|ancient|goldfield/.test(blob)) tags.add('history');
  if (/honest|courage|character|admit/.test(blob)) tags.add('character');
  if (/camp|ridge|trail|climb/.test(blob)) tags.add('adventure');
  tags.add(normalizePos(entry.part_of_speech));
  return [...tags];
}

export function choosePassageTopic(day: number, attempt = 0): PassageBlueprint {
  const theme = THEMES[(Math.max(1, day) - 1 + attempt) % THEMES.length];
  const themed = PASSAGE_BLUEPRINTS.filter((item) => item.theme === theme);
  if (themed.length > 0) return themed[attempt % themed.length];
  return PASSAGE_BLUEPRINTS[(Math.max(1, day) - 1 + attempt) % PASSAGE_BLUEPRINTS.length];
}

export function scoreWordForSlot(entry: VocabularyEntry, slot: PassageSlot): number {
  const pos = normalizePos(entry.part_of_speech);
  const word = entry.word.toLowerCase();
  let score = 0;
  if (slot.preferred.some((item) => item.toLowerCase() === word)) score += 8;
  if (pos !== 'other' && slot.pos.includes(pos)) score += 3;
  const tags = tagsFor(entry);
  score += slot.tags.filter((tag) => tags.includes(tag)).length * 2;
  if (pos !== 'other' && !slot.pos.includes(pos) && !slot.preferred.includes(word)) score -= 4;
  return score;
}

function assignWords(
  blueprint: PassageBlueprint,
  newWords: VocabularyEntry[],
  reviewWords: VocabularyEntry[],
): SlotAssignment[] {
  const usedWords = new Set<string>();
  const usedSlots = new Set<string>();
  const chosen: SlotAssignment[] = [];

  const consider = (pool: VocabularyEntry[], source: 'new' | 'review') => {
    const pairs: Array<{ entry: VocabularyEntry; slot: PassageSlot; score: number }> = [];
    for (const entry of pool) {
      if (usedWords.has(entry.word.toLowerCase())) continue;
      for (const slot of blueprint.slots) {
        if (usedSlots.has(slot.id)) continue;
        const score = scoreWordForSlot(entry, slot);
        const preferredHit = slot.preferred.some(
          (item) => item.toLowerCase() === entry.word.toLowerCase(),
        );
        // Prefer designed slot matches. Do not squeeze a merely same-POS word
        // into a slot that already names the lemmas that fit (evaluate ≠ compare).
        if (slot.preferred.length > 0 && !preferredHit && score < 11) continue;
        if (score >= 5) pairs.push({ entry, slot, score });
      }
    }
    pairs.sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
    for (const pair of pairs) {
      if (chosen.length >= FEATURED_TARGET_MAX) break;
      if (usedWords.has(pair.entry.word.toLowerCase()) || usedSlots.has(pair.slot.id)) continue;
      usedWords.add(pair.entry.word.toLowerCase());
      usedSlots.add(pair.slot.id);
      chosen.push({ slotId: pair.slot.id, word: pair.entry.word, source });
    }
  };

  consider(newWords, 'new');
  // Review lemmas may fill leftover preferred slots (up to the density cap).
  consider(reviewWords, 'review');
  return chosen;
}

function fillTemplate(
  blueprint: PassageBlueprint,
  assignments: SlotAssignment[],
): { passage: string; fallbackPassage: string } {
  const bySlot = new Map(assignments.map((item) => [item.slotId, item.word]));
  const fill = (useFallback: boolean): string => {
    let text = blueprint.paragraphs.join(' ');
    for (const slot of blueprint.slots) {
      const token = useFallback ? slot.fallback : (bySlot.get(slot.id) ?? slot.fallback);
      const phrase = slot.phrase.replace('{word}', token);
      text = text.replaceAll(`{${slot.id}}`, phrase);
    }
    return text.replace(/\s+/g, ' ').trim();
  };
  return { passage: fill(false), fallbackPassage: fill(true) };
}

function adjustStoryLength(blueprint: PassageBlueprint, passage: string): string {
  let text = passage.replace(/\s+/g, ' ').trim();
  const expander = EXPANDERS[blueprint.id];
  if (wordCount(text) < READING_WORD_MIN && expander && !text.includes(expander)) {
    text = `${text} ${expander}`.replace(/\s+/g, ' ').trim();
  }
  if (wordCount(text) > READING_WORD_MAX) {
    const sentences = text.split(/(?<=[.!?])\s+/);
    while (sentences.length > 6 && wordCount(sentences.join(' ')) > READING_WORD_MAX) {
      const last = sentences[sentences.length - 1];
      if (expander && last === expander) {
        sentences.pop();
        continue;
      }
      break;
    }
    text = sentences.join(' ');
  }
  return text;
}

function toMiniReading(
  blueprint: PassageBlueprint,
  assignments: SlotAssignment[],
  passage: string,
  fallbackPassage: string,
): BuiltPassage {
  return {
    title: blueprint.title,
    theme: blueprint.theme,
    passage,
    word_count: wordCount(passage),
    featured_new_words: assignments.filter((item) => item.source === 'new').map((item) => item.word),
    featured_review_words: assignments.filter((item) => item.source === 'review').map((item) => item.word),
    blueprintId: blueprint.id,
    centralIdea: blueprint.facts.centralIdea,
    fallbackPassage,
    facts: blueprint.facts,
  };
}

export function assembleReading(
  blueprint: PassageBlueprint,
  newWords: VocabularyEntry[],
  reviewWords: VocabularyEntry[],
): BuiltPassage {
  const assignments = assignWords(blueprint, newWords, reviewWords);
  const filled = fillTemplate(blueprint, assignments);
  const passage = adjustStoryLength(blueprint, filled.passage);
  const fallbackPassage = adjustStoryLength(blueprint, filled.fallbackPassage);
  return toMiniReading(blueprint, assignments, passage, fallbackPassage);
}

export function generateMiniReading(
  day: number,
  newWords: VocabularyEntry[],
  reviewWords: VocabularyEntry[],
  options: GenerateReadingOptions = {},
): BuiltPassage {
  const start = options.attempt ?? 0;
  const candidates = newWords.concat(reviewWords);
  let last: BuiltPassage | null = null;

  for (let offset = 0; offset < PASSAGE_BLUEPRINTS.length; offset += 1) {
    const blueprint = choosePassageTopic(day, start + offset);
    const built = assembleReading(blueprint, newWords, reviewWords);
    last = built;
    if (runReadingPassageQa(built, candidates, built.fallbackPassage).ok) return built;
  }

  return last ?? toMiniReading(PASSAGE_BLUEPRINTS[0], [], PASSAGE_BLUEPRINTS[0].paragraphs.join(' '), '');
}

function otherDefinitions(words: VocabularyEntry[], used: string): string[] {
  return words
    .filter((entry) => entry.word !== used)
    .map((entry) => entry.simple_definition || entry.definition)
    .filter((item): item is string => Boolean(item));
}

function rotate<T>(items: T[], seed: number): T[] {
  if (items.length === 0) return items;
  const index = Math.abs(seed) % items.length;
  return items.slice(index).concat(items.slice(0, index));
}

function optionsFor(answer: string, distractors: string[], seed: number): string[] {
  const unique = [answer, ...distractors.filter((item) => item && item !== answer)];
  const picked = unique.slice(0, 4);
  if (!picked.includes(answer)) picked[picked.length - 1] = answer;
  while (picked.length < 4) picked.push('This idea is not supported by the passage.');
  return rotate([...new Set(picked)], seed + 3);
}

function vocabInPassage(reading: MiniReading, words: VocabularyEntry[]): VocabularyEntry | undefined {
  return words.find((entry) => passageContainsWord(reading.passage, entry.word));
}

function factsFor(reading: MiniReading | BuiltPassage): BlueprintFacts {
  if ('facts' in reading && reading.facts) return reading.facts;
  const match = PASSAGE_BLUEPRINTS.find((item) => item.title === reading.title);
  return (
    match?.facts ?? {
      centralIdea: 'The passage follows one event and asks the reader to notice it carefully.',
      details: ['The setting is an Australian school situation.'],
      inferences: [{ claim: 'The students are expected to think carefully.', evidence: reading.passage }],
      purpose: 'To describe one event clearly.',
      falseMainIdeas: [
        'The characters give up before the work begins.',
        'The passage is mainly a list of spelling rules.',
        'Someone wins a race and that is the only point.',
      ],
    }
  );
}

export function generateReadingQuestions(
  day: number,
  reading: MiniReading | BuiltPassage,
  newWords: VocabularyEntry[],
  reviewWords: VocabularyEntry[],
): ReadingQuestion[] {
  const facts = factsFor(reading);
  const pool = [...newWords, ...reviewWords];
  const vocab = vocabInPassage(reading, pool) ?? newWords[0];
  const detail = facts.details.find((item) =>
    item
      .toLowerCase()
      .split(/\W+/)
      .some((word) => word.length > 4 && reading.passage.toLowerCase().includes(word)),
  ) ?? facts.details[0];

  const otherIdeas =
    facts.falseMainIdeas?.slice(0, 3) ??
    PASSAGE_BLUEPRINTS.filter((item) => item.title !== reading.title)
      .map((item) => item.facts.centralIdea)
      .slice(0, 3);

  const falseDetails = [
    'The class cancelled the activity and went home before anything was recorded.',
    'A visiting reporter took over and published the answer that morning.',
    'The teacher announced a prize for the fastest finished page.',
  ];

  const inference = facts.inferences[0];
  const falseInferences = [
    'He wants the quickest possible conclusion, even without support.',
    'He has already decided that nothing in the scene is worth noticing.',
    'He is only interested in winning a public prize.',
  ];

  const seed = day * 11;
  const questions: ReadingQuestion[] = [
    {
      id: `RQ${String(day).padStart(3, '0')}-1`,
      type: 'detail',
      prompt: 'Which detail is actually in the passage?',
      options: optionsFor(detail, falseDetails, seed),
      answer: detail,
    },
    {
      id: `RQ${String(day).padStart(3, '0')}-2`,
      type: 'vocabulary_in_context',
      prompt: `In this passage, "${vocab.word}" is used to mean:`,
      options: optionsFor(
        vocab.simple_definition || vocab.definition,
        otherDefinitions(pool, vocab.word),
        seed + 1,
      ),
      answer: vocab.simple_definition || vocab.definition,
    },
    {
      id: `RQ${String(day).padStart(3, '0')}-3`,
      type: 'main_idea',
      prompt: 'Which sentence best states the main idea of the whole passage?',
      options: optionsFor(facts.centralIdea, otherIdeas, seed + 2),
      answer: facts.centralIdea,
    },
    {
      id: `RQ${String(day).padStart(3, '0')}-4`,
      type: 'inference',
      prompt: 'What can the reader reasonably infer from the passage?',
      options: optionsFor(inference.claim, falseInferences, seed + 3),
      answer: inference.claim,
    },
  ];

  const extraType: ReadingQuestionType = facts.causeEffect
    ? 'cause_effect'
    : facts.sequence
      ? 'sequence'
      : 'authors_purpose';

  if (extraType === 'cause_effect' && facts.causeEffect) {
    questions.push({
      id: `RQ${String(day).padStart(3, '0')}-5`,
      type: 'cause_effect',
      prompt: 'Which cause-and-effect relationship is supported by the passage?',
      options: optionsFor(
        `${facts.causeEffect.cause} This led to: ${facts.causeEffect.effect}`,
        [
          'A prize was offered, so everyone rushed and ignored the facts.',
          'The activity was cancelled, so no notes were kept.',
          'A film version of the event replaced what actually happened.',
        ],
        seed + 4,
      ),
      answer: `${facts.causeEffect.cause} This led to: ${facts.causeEffect.effect}`,
    });
  } else if (extraType === 'sequence' && facts.sequence) {
    questions.push({
      id: `RQ${String(day).padStart(3, '0')}-5`,
      type: 'sequence',
      prompt: 'Which order best matches the passage?',
      options: optionsFor(
        facts.sequence.join(' → '),
        [
          'They published a conclusion → they collected notes → they arrived.',
          'They packed up first → they invented a rumour → they left without looking.',
          'They awarded a prize → they skipped the evidence → they went home.',
        ],
        seed + 4,
      ),
      answer: facts.sequence.join(' → '),
    });
  } else {
    questions.push({
      id: `RQ${String(day).padStart(3, '0')}-5`,
      type: 'authors_purpose',
      prompt: "What is the author's main purpose in this passage?",
      options: optionsFor(facts.purpose, [
        'To list spelling rules for a test.',
        'To advertise a sports brand.',
        'To argue that careful reading is a waste of time.',
      ], seed + 4),
      answer: facts.purpose,
    });
  }

  const checked = runReadingQuestionQa(questions, reading);
  if (checked.ok) return questions;
  return questions.slice(0, 4);
}

export function _passagePlanForTests(theme: ReadingTheme, day: number): { theme: ReadingTheme; title: string; paragraphs: string[] } {
  const blueprint =
    PASSAGE_BLUEPRINTS.find((item) => item.theme === theme) ?? choosePassageTopic(day, 0);
  return { theme: blueprint.theme, title: blueprint.title, paragraphs: blueprint.paragraphs };
}

export { PASSAGE_BLUEPRINTS };
export type { PassageBlueprint, SlotAssignment as ReadingSlotAssignment };
