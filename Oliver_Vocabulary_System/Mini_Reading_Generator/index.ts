import type { MiniReading, ReadingQuestion, ReadingTheme, VocabularyEntry } from '../types';

const THEMES: ReadingTheme[] = [
  'adventure',
  'mystery',
  'science',
  'history',
  'character_challenge',
  'real_world',
];

interface PassagePlan {
  theme: ReadingTheme;
  title: string;
  paragraphs: string[];
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function embedWord(entry: VocabularyEntry): string {
  const example = entry.example_sentence.trim();
  if (example.endsWith('.')) return example;
  return `${example}.`;
}

function connective(theme: ReadingTheme, index: number): string {
  const bank: Record<ReadingTheme, string[]> = {
    adventure: [
      'The track ahead offered no easy answers.',
      'A thin wind moved through the gums.',
      'They had to decide before the light faded.',
    ],
    mystery: [
      'Nothing in the room quite matched the story they had been told.',
      'The next clue waited in plain sight.',
      'Someone, it seemed, had been careful — but not careful enough.',
    ],
    science: [
      'The result was clear enough to demand a second look.',
      'They recorded the observation before anyone could argue it away.',
      'A careful test would settle the question.',
    ],
    history: [
      'The old account left out the most important detail.',
      'What happened next changed how the town remembered the day.',
      'Later writers would argue about the motive, but not about the fact.',
    ],
    character_challenge: [
      'Pride made the next step harder than it needed to be.',
      'Honesty, once delayed, grew heavier.',
      'The choice would follow them into the classroom the next morning.',
    ],
    real_world: [
      'The scholarship hall was quiet in that particular way halls become before a test.',
      'Outside, a tram rattled past and ordinary life continued.',
      'There was still time to think, but not much.',
    ],
  };
  return pick(bank[theme], index);
}

function opening(theme: ReadingTheme, day: number): { title: string; start: string } {
  const openings: Record<ReadingTheme, { title: string; start: string }> = {
    adventure: {
      title: 'The Ridge Beyond School Camp',
      start: `On the third morning of school camp, the Year 6 group left the marked trail and climbed toward a ridge that the map showed only as a pale smudge. The scholarship students from Melbourne and Adelaide had been told to notice everything: the weather, the rock, and the way a person speaks when the path grows steep.`,
    },
    mystery: {
      title: 'The Locked Library Drawer',
      start: `After debating club, Oliver lingered in the school library because a drawer that was always locked had been left a finger-width open. Inside lay a faded timetable, a broken compass, and a note written in a hurried adult hand. The mystery was not dramatic. It was simply wrong, and that was enough.`,
    },
    science: {
      title: 'The Tank That Should Not Have Clouded',
      start: `In the science lab, the water sample from the local creek should have stayed clear. Instead it clouded within minutes, and the teacher asked the scholarship class to treat the change as evidence, not as a surprise. Oliver wrote the time, the temperature, and the first guess — then crossed the guess out.`,
    },
    history: {
      title: 'A Letter from the Goldfields',
      start: `The museum case in Ballarat held a miner's letter dated 1854. The ink had browned, but the argument was still sharp: food prices had risen, the licence felt unjust, and ordinary men were being asked to accept a rule they had never been invited to shape. Oliver read it twice before he trusted his own summary.`,
    },
    character_challenge: {
      title: 'The Score That Was Not His',
      start: `When the practice paper was returned, Oliver saw a mark that could not have been his. A neighbour's correct answers had been copied into his margin by a tired marker. He could have stayed silent. The hall clock kept its ordinary pace, as if the decision did not matter.`,
    },
    real_world: {
      title: 'Saturday Morning at the Exam Centre',
      start: `The independent school in Kew used its sports hall for the scholarship morning. Parents waited under the plane trees. Inside, the desks were too evenly spaced to feel friendly. Oliver sharpened a pencil he did not need and read the first English passage the way he had practised: slowly, then again.`,
    },
  };
  const selected = openings[theme];
  return day % 2 === 0
    ? selected
    : {
        title: selected.title,
        start: selected.start,
      };
}

function closing(theme: ReadingTheme): string {
  const closings: Record<ReadingTheme, string> = {
    adventure: `By the time they reached the fire trail again, nobody claimed the ridge had been easy. The better prize was this: they could describe what they had seen without exaggeration, and that skill would matter more than the view.`,
    mystery: `The librarian did not scold them. She only asked what the evidence actually proved. That question, Oliver realised, was the real lock on the drawer.`,
    science: `They did not solve the creek that afternoon. They did, however, refuse a sloppy conclusion, and in a scholarship science paper that refusal is often the beginning of a strong answer.`,
    history: `History, he decided, was not a costume. It was a record of pressure, choice, and consequence — the same three things a comprehension question likes to hide in ordinary sentences.`,
    character_challenge: `He walked to the marker's desk. The correction took less than a minute. The relief lasted longer, and it was the kind that still leaves a person able to look at a page.`,
    real_world: `When the supervisor said time was up, Oliver turned the paper over without panic. He had not known every word, but he had used the ones he knew with care, and that, his teacher always said, is how a native speaker earns marks.`,
  };
  return closings[theme];
}

function adjustLength(passage: string, extras: string[]): string {
  let text = passage.replace(/\s+/g, ' ').trim();
  let count = wordCount(text);
  let extraIndex = 0;
  while (count < 150 && extraIndex < extras.length) {
    text = `${text} ${extras[extraIndex]}`.replace(/\s+/g, ' ').trim();
    extraIndex += 1;
    count = wordCount(text);
  }
  if (count > 200) {
    const words = text.split(/\s+/);
    text = `${words.slice(0, 198).join(' ')}.`;
  }
  return text;
}

export function generateMiniReading(
  day: number,
  newWords: VocabularyEntry[],
  reviewWords: VocabularyEntry[],
): MiniReading {
  const theme = pick(THEMES, day - 1);
  const { title, start } = opening(theme, day);
  const featuredNew = newWords.slice(0, Math.max(5, Math.min(8, newWords.length)));
  const featuredReview = reviewWords.slice(0, 4);

  const body = featuredNew.map((entry) => embedWord(entry));
  const reviewLines = featuredReview.map((entry) => embedWord(entry));
  const bridges = [0, 1, 2].map((index) => connective(theme, day + index));

  const paragraphs = [
    start,
    bridges[0],
    ...body.slice(0, 3),
    bridges[1],
    ...body.slice(3),
    ...reviewLines,
    bridges[2],
    closing(theme),
  ];
  const extras = [
    'He checked the wording once more, because scholarship English rewards precision more than speed.',
    'A weaker writer would have reached for a simpler word; he kept the exact one.',
    'The passage on the exam would not be friendlier than this.',
  ];
  const passage = adjustLength(paragraphs.join(' '), extras);

  return {
    title,
    theme,
    passage,
    word_count: wordCount(passage),
    featured_new_words: featuredNew.map((entry) => entry.word),
    featured_review_words: featuredReview.map((entry) => entry.word),
  };
}

export function generateReadingQuestions(
  day: number,
  reading: MiniReading,
  newWords: VocabularyEntry[],
  reviewWords: VocabularyEntry[],
): ReadingQuestion[] {
  const vocab =
    newWords.find((entry) => reading.passage.toLowerCase().includes(entry.word.toLowerCase())) ??
    newWords[0];
  const review = reviewWords[0] ?? newWords[1];
  const themeIdea: Record<ReadingTheme, string> = {
    adventure: 'The group learns that careful observation matters more than a dramatic view.',
    mystery: 'A small irregularity at school becomes a test of evidence rather than excitement.',
    science: 'A cloudy sample teaches the class to separate observation from guesswork.',
    history: 'An old letter shows how pressure and fairness shaped a moment in the past.',
    character_challenge: 'A student chooses honesty over an undeserved mark.',
    real_world: 'A scholarship exam morning rewards careful reading more than panic.',
  };
  const falseIdeas = [
    'The characters give up and go home immediately.',
    'The passage is mainly a list of spelling rules.',
    'Someone wins a race and that is the only point.',
  ];

  const questions: ReadingQuestion[] = [
    {
      id: `RQ${String(day).padStart(3, '0')}-1`,
      type: 'vocabulary_in_context',
      prompt: `In this passage, "${vocab.word}" is used to mean:`,
      options: [
        vocab.definition,
        review?.definition ?? 'A loud celebration.',
        'A type of school uniform.',
        'A measurement of distance.',
      ],
      answer: vocab.definition,
    },
    {
      id: `RQ${String(day).padStart(3, '0')}-2`,
      type: 'main_idea',
      prompt: 'Which sentence best states the main idea of the passage?',
      options: [themeIdea[reading.theme], ...falseIdeas],
      answer: themeIdea[reading.theme],
    },
    {
      id: `RQ${String(day).padStart(3, '0')}-3`,
      type: 'inference',
      prompt: 'What can the reader reasonably infer about Oliver?',
      options: [
        'He tries to read situations carefully and choose precise words.',
        'He refuses to sit any scholarship test.',
        'He believes speed matters more than accuracy.',
        'He has already left primary school.',
      ],
      answer: 'He tries to read situations carefully and choose precise words.',
    },
    {
      id: `RQ${String(day).padStart(3, '0')}-4`,
      type: 'detail',
      prompt: 'Which detail is actually in the passage?',
      options: [
        reading.passage.includes('library')
          ? 'A library drawer or note plays a part in the scene.'
          : reading.passage.includes('creek')
            ? 'A water sample from a creek becomes cloudy.'
            : reading.passage.includes('sports hall')
              ? 'The exam is held in a sports hall.'
              : 'The setting is an Australian school or camp situation.',
        'Oliver flies a helicopter to the exam.',
        'The teacher cancels English forever.',
        'A talking magpie marks the papers.',
      ],
      answer: reading.passage.includes('library')
        ? 'A library drawer or note plays a part in the scene.'
        : reading.passage.includes('creek')
          ? 'A water sample from a creek becomes cloudy.'
          : reading.passage.includes('sports hall')
            ? 'The exam is held in a sports hall.'
            : 'The setting is an Australian school or camp situation.',
    },
  ];

  if (newWords[1]) {
    questions.push({
      id: `RQ${String(day).padStart(3, '0')}-5`,
      type: 'vocabulary_in_context',
      prompt: `Which word from today's list would best replace a vague word like "very hard" in a scholarship sentence?`,
      options: [newWords[1].word, 'nice', 'stuff', 'things'],
      answer: newWords[1].word,
    });
  }

  return questions;
}

export function _passagePlanForTests(theme: ReadingTheme, day: number): PassagePlan {
  const { title, start } = opening(theme, day);
  return { theme, title, paragraphs: [start, closing(theme)] };
}
