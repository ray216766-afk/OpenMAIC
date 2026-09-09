import type { ReadingTheme } from '../types';

export type SlotPos = 'verb' | 'noun' | 'adjective' | 'adverb';

export interface PassageSlot {
  id: string;
  tags: string[];
  pos: SlotPos[];
  preferred: string[];
  fallback: string;
  /** Phrase containing {word}; must serve the central story, not a vocab dump. */
  phrase: string;
}

export interface BlueprintFacts {
  details: string[];
  inferences: { claim: string; evidence: string }[];
  causeEffect?: { cause: string; effect: string };
  sequence?: string[];
  purpose: string;
  centralIdea: string;
  /** Wrong main ideas that still sound like a reading of THIS passage. */
  falseMainIdeas: string[];
}

export interface PassageBlueprint {
  id: string;
  theme: ReadingTheme;
  title: string;
  tags: string[];
  /** Story-first paragraphs. Use {slotId} markers only. */
  paragraphs: string[];
  slots: PassageSlot[];
  facts: BlueprintFacts;
}

function slot(
  id: string,
  phrase: string,
  fallback: string,
  pos: SlotPos[],
  tags: string[],
  preferred: string[] = [],
): PassageSlot {
  return { id, phrase, fallback, pos, tags, preferred };
}

export const PASSAGE_BLUEPRINTS: PassageBlueprint[] = [
  {
    id: 'creek-colour',
    theme: 'science',
    title: 'The Creek That Changed Colour',
    tags: ['inquiry', 'environment', 'science'],
    paragraphs: [
      `On Tuesday the Year 6 science group walked from the oval to Merri Creek with clipboards and sample jars. Near the footbridge the water looked ordinary. Twenty metres downstream it had turned a dull grey. Nobody invented a monster. They had to notice what was there, then decide what the change might mean.`,
      `Ms Chen asked the class to {observe} the banks, the current, and any smell before they dipped a jar. Oliver wrote the time and temperature first, because a fair {method} mattered. If one pair scooped foam and another took mid-stream water, they would not be looking at the same thing.`,
      `In the lab they tried to {determine} whether soap, soil, or stormwater had entered the creek. They needed {evidence}, not a favourite guess. Last night's storm was one {factor}: it had washed dust from the oval into the drain. The class began to {analyse} colour, temperature, and the banks. The change was {significant} enough to record, and keeping the stretch clean meant looking after the local {environment}.`,
      `Later they would {evaluate} which explanation fitted the jars. Ms Chen wanted them to {conclude} only what the samples could support. That careful {process} was slower than a quick answer, but a scholarship science paper rewards staying with the facts.`,
    ],
    slots: [
      slot('observe', '{word}', 'study', ['verb'], ['inquiry'], ['observe', 'investigate', 'analyse']),
      slot('method', '{word}', 'way of working', ['noun'], ['inquiry'], ['method', 'approach', 'strategy', 'process']),
      slot('determine', '{word}', 'work out', ['verb'], ['inquiry'], ['determine', 'identify', 'establish']),
      slot('evidence', '{word}', 'clear facts', ['noun'], ['inquiry'], ['evidence']),
      slot('factor', '{word}', 'reason', ['noun'], ['inquiry', 'environment'], ['factor', 'consequence', 'impact']),
      slot('analyse', '{word}', 'sort through', ['verb'], ['inquiry'], ['analyse', 'compare', 'assess']),
      slot('significant', '{word}', 'large', ['adjective'], ['inquiry'], ['significant', 'essential']),
      slot('environment', '{word}', 'surroundings', ['noun'], ['environment'], ['environment']),
      slot('evaluate', '{word}', 'judge', ['verb'], ['inquiry', 'argument'], ['evaluate', 'assess']),
      slot('conclude', '{word}', 'decide', ['verb'], ['inquiry'], ['conclude']),
      slot('process', '{word}', 'series of steps', ['noun'], ['inquiry'], ['process', 'method', 'approach']),
    ],
    facts: {
      centralIdea:
        'A grey stretch of creek becomes a careful science investigation, not a dramatic rumour.',
      details: [
        'The Year 6 group sampled Merri Creek after noticing grey water downstream of the footbridge.',
        'Oliver recorded the time and temperature before collecting water.',
        'Last night’s storm had washed dust from the oval into the drain.',
      ],
      inferences: [
        {
          claim: 'The class is expected to stay with the facts instead of inventing a bigger story.',
          evidence: 'Ms Chen wants them to conclude only what the samples can support.',
        },
      ],
      causeEffect: {
        cause: 'A storm washed dust from the oval into the drain.',
        effect: 'The creek water turned grey downstream.',
      },
      sequence: [
        'They noticed the grey water',
        'They sampled the creek',
        'They compared notes in the lab',
      ],
      purpose: 'To show why careful method and evidence matter more than a quick story.',
      falseMainIdeas: [
        'The class invents a monster to explain why the creek turned grey.',
        'Ms Chen wants a dramatic newsletter story more than accurate samples.',
        'The visit is mainly a race to collect the most jars.',
      ],
    },
  },
  {
    id: 'ridge-trail',
    theme: 'adventure',
    title: 'The Ridge Beyond the Marked Trail',
    tags: ['adventure', 'school', 'inquiry'],
    paragraphs: [
      `On the third morning of school camp, the Year 6 group left the painted markers and climbed toward a ridge the map showed only as a pale smudge. They had been told to notice the weather, the rock, and the way a person speaks when the path grows steep. A thin wind moved through the gums. Nobody treated the walk as a race.`,
      `Ms Hart asked them to {observe} the slope before anyone crossed the loose stone. A patient {strategy} mattered more than speed. Oliver paused and tried to {identify} which trees still held last night's rain, then {compare} the wet bark with the dry dust. The group had to {determine} whether the safer line was longer but sound, or shorter and likely to crumble.`,
      `The crumbling edge was one {factor} they could not ignore. They did not need a heroic tale. They needed to {analyse} what they had seen so the next pair would not slip. The change underfoot was {significant} enough to slow the line. By the fire trail, the better prize was this: they could describe the ridge without exaggeration.`,
    ],
    slots: [
      slot('observe', '{word}', 'study', ['verb'], ['inquiry', 'adventure'], ['observe', 'investigate']),
      slot('strategy', '{word}', 'plan', ['noun'], ['school', 'inquiry'], ['strategy', 'approach', 'method']),
      slot('identify', '{word}', 'pick out', ['verb'], ['inquiry'], ['identify', 'recognise', 'determine']),
      slot('compare', '{word}', 'check', ['verb'], ['inquiry'], ['compare', 'contrast']),
      slot('determine', '{word}', 'work out', ['verb'], ['inquiry'], ['determine', 'evaluate', 'assess']),
      slot('factor', '{word}', 'detail', ['noun'], ['inquiry'], ['factor', 'consequence', 'impact']),
      slot('analyse', '{word}', 'think through', ['verb'], ['inquiry'], ['analyse', 'evaluate']),
      slot('significant', '{word}', 'serious', ['adjective'], ['inquiry'], ['significant', 'essential']),
    ],
    facts: {
      centralIdea:
        'The camp walk rewards careful observation and a safe plan more than a dramatic view.',
      details: [
        'The Year 6 group left the painted markers and climbed toward a ridge.',
        'A thin wind moved through the gums.',
        'By the fire trail, they could describe the ridge without exaggeration.',
      ],
      inferences: [
        {
          claim: 'The students are expected to notice conditions, not just reach the top.',
          evidence: 'They had been told to notice weather, rock, and how people speak when the path steepens.',
        },
      ],
      causeEffect: {
        cause: 'The slope had loose stone and a crumbling edge.',
        effect: 'The group slowed and had to judge which line was safer.',
      },
      purpose: 'To show that careful noticing is the real prize of the ridge walk.',
      falseMainIdeas: [
        'The walk is treated as a race to the ridge and back.',
        'The students ignore the loose stone and take every shortcut.',
        'The camp journal wants a heroic tale more than an accurate description.',
      ],
    },
  },
  {
    id: 'sports-day-ribbon',
    theme: 'mystery',
    title: 'The Missing Sports-Day Ribbon',
    tags: ['inquiry', 'school', 'argument'],
    paragraphs: [
      `After lunch on sports day, the Year 6 marshalling table was missing the house championship ribbon, still meant to be in its cardboard sleeve. The hall was noisy, but the puzzle was small. The ribbon had been there when the last race was called. It was not there when the captains came for the scores.`,
      `Ms Nguyen did not search every bag. She asked Oliver's group to {investigate} the table as if it were a scene in a novel — except the novel had to match the room. They needed {evidence}, not a favourite suspect. Oliver stopped to {observe} the table edge. A wet ring from a water bottle sat where the sleeve had been. The rush of captains was one {factor} they could not ignore.`,
      `From a marshal's {perspective}, the table had been crowded, not cursed. The class had to {determine} whether the ribbon had been knocked into the medal crate or carried off with the score sheets. Any claim would have to {justify} itself with what the table still showed. When they found the sleeve under the crate, nobody cheered. They had simply refused a sloppy story.`,
    ],
    slots: [
      slot('investigate', '{word}', 'look into', ['verb'], ['inquiry'], ['investigate', 'analyse']),
      slot('evidence', '{word}', 'solid facts', ['noun'], ['inquiry'], ['evidence']),
      slot('observe', '{word}', 'look at', ['verb'], ['inquiry'], ['observe', 'identify']),
      slot('factor', '{word}', 'detail', ['noun'], ['inquiry'], ['factor', 'consequence']),
      slot('perspective', '{word}', 'point of view', ['noun'], ['argument'], ['perspective']),
      slot('determine', '{word}', 'work out', ['verb'], ['inquiry'], ['determine', 'conclude', 'identify']),
      slot('justify', '{word}', 'support', ['verb'], ['argument'], ['justify', 'demonstrate']),
    ],
    facts: {
      centralIdea:
        'A missing sports-day ribbon is solved by evidence on the marshalling table, not by rumour.',
      details: [
        'The house championship ribbon disappeared from the Year 6 marshalling table after lunch.',
        'A wet ring from a water bottle marked where the sleeve had been.',
        'The sleeve was later found under a crate of leftover medals.',
      ],
      inferences: [
        {
          claim: 'The ribbon was misplaced in the rush, not stolen as part of a grand plot.',
          evidence: 'The wet ring, crowded table, and sleeve under the crate support an ordinary accident.',
        },
      ],
      causeEffect: {
        cause: 'Captains rushed the crowded marshalling table.',
        effect: 'The ribbon sleeve was knocked under the medal crate.',
      },
      purpose: 'To show that a small school mystery is solved by evidence, not excitement.',
      falseMainIdeas: [
        'The ribbon is treated as the start of a famous criminal case.',
        'Ms Nguyen searches every bag before anyone looks at the table.',
        'The captains are blamed without any look at the marshalling table.',
      ],
    },
  },
  {
    id: 'goldfields-letter',
    theme: 'history',
    title: 'The Letter in the Goldfields Case',
    tags: ['history', 'argument', 'inquiry'],
    paragraphs: [
      `The museum case in Ballarat held a miner's letter dated 1854. The ink had browned, but the argument was still sharp: food prices had risen, the licence felt unjust, and ordinary men were being asked to accept a rule they had never been invited to shape. Oliver read it twice before he trusted his own summary.`,
      `From a modern student's {perspective}, the letter was a school object behind glass. From the writer's {context}, it was a warning sent home before the next licence hunt. The class had to {analyse} the words without turning them into a costume drama. {evidence} They tried to {determine} whether the writer wanted pity, support, or simply a true record.`,
      `{consequence} History, Oliver decided, was not a parade of hats and picks. It was a record of pressure, choice, and what followed. {justify} The museum card asked visitors to {compare} this letter with a later newspaper report, and that task — not the glass case — was the real work of the afternoon.`,
    ],
    slots: [
      slot('perspective', '{word}', 'point of view', ['noun'], ['argument', 'history'], ['perspective']),
      slot('context', '{word}', 'situation', ['noun'], ['history', 'argument'], ['context']),
      slot('analyse', '{word}', 'look closely at', ['verb'], ['inquiry', 'history'], ['analyse', 'interpret']),
      slot(
        'evidence',
        'The stained paper was {word} of a real complaint, not a story invented for tourists.',
        'proof',
        ['noun'],
        ['inquiry', 'history'],
        ['evidence'],
      ),
      slot('determine', '{word}', 'work out', ['verb'], ['inquiry'], ['determine', 'evaluate', 'identify']),
      slot(
        'consequence',
        'One {word} of the rising fees, the letter said, was that families could not keep both food and a licence.',
        'result',
        ['noun'],
        ['history'],
        ['consequence', 'impact'],
      ),
      slot(
        'justify',
        'A careful reader had to {word} that reading with lines from the letter, not with a film they had seen.',
        'support',
        ['verb'],
        ['argument'],
        ['justify', 'demonstrate'],
      ),
      slot(
        'compare',
        '{word}',
        'look at',
        ['verb'],
        ['inquiry', 'history'],
        ['compare', 'contrast'],
      ),
    ],
    facts: {
      centralIdea:
        'An 1854 goldfields letter is a record of pressure and fairness, not a costume-drama prop.',
      details: [
        'The museum case in Ballarat held a miner’s letter dated 1854.',
        'The writer complained about food prices and an unjust licence.',
        'Visitors were asked to compare the letter with a later newspaper report.',
      ],
      inferences: [
        {
          claim: 'Oliver wants an accurate reading rather than a colourful story.',
          evidence: 'He reads the letter twice and refuses to turn it into a costume drama.',
        },
      ],
      causeEffect: {
        cause: 'Licence fees and food prices rose.',
        effect: 'Families struggled to keep both food and a licence.',
      },
      purpose: 'To treat a historical letter as evidence of pressure and choice.',
      falseMainIdeas: [
        'The letter is mainly a costume-drama prop about hats and picks.',
        'Oliver decides museum objects behind glass cannot be taken seriously.',
        'The visit is about filming a tourist story rather than reading the words.',
      ],
    },
  },
  {
    id: 'undeserved-mark',
    theme: 'character_challenge',
    title: 'The Mark That Was Not His',
    tags: ['character', 'school', 'argument'],
    paragraphs: [
      `When the practice paper was returned, Oliver saw a mark that could not have been his. A neighbour's correct answers had been copied into his margin by a tired marker. He could have stayed silent. The hall clock kept its ordinary pace, as if the decision did not matter.`,
      `From his {perspective}, keeping the extra points would be easy to hide and hard to forget. He tried to {evaluate} the choice the way his teacher asked them to judge a character in a novel: not by what felt comfortable, but by what he could {justify} in the morning. {consequence} {evidence}`,
      `He walked to the marker's desk. The correction took less than a minute. {demonstrate} The relief lasted longer, and it was the kind that still leaves a person able to look at a page. Nobody made a speech. The {impact} was quiet, and that was the point.`,
    ],
    slots: [
      slot('perspective', '{word}', 'point of view', ['noun'], ['argument', 'character'], ['perspective']),
      slot('evaluate', '{word}', 'weigh', ['verb'], ['argument', 'character'], ['evaluate', 'assess', 'consider']),
      slot('justify', '{word}', 'defend', ['verb'], ['argument'], ['justify']),
      slot(
        'consequence',
        'One {word} of staying silent would be a score he had not earned.',
        'result',
        ['noun'],
        ['character'],
        ['consequence', 'impact'],
      ),
      slot(
        'evidence',
        'The extra ticks in another handwriting were {word} enough; he did not need a bigger drama.',
        'proof',
        ['noun'],
        ['inquiry'],
        ['evidence'],
      ),
      slot(
        'demonstrate',
        'The short walk did {word} something his essay on honesty had only described.',
        'show',
        ['verb'],
        ['character', 'argument'],
        ['demonstrate'],
      ),
      slot('impact', '{word}', 'effect', ['noun'], ['character'], ['impact', 'consequence']),
    ],
    facts: {
      centralIdea:
        'A student chooses to correct an undeserved mark rather than keep points he did not earn.',
      details: [
        'A tired marker had copied a neighbour’s correct answers into Oliver’s margin.',
        'He walked to the marker’s desk and the correction took less than a minute.',
        'Nobody made a speech about it.',
      ],
      inferences: [
        {
          claim: 'Oliver knows the extra mark would trouble him even if nobody else noticed.',
          evidence: 'He says keeping the points would be easy to hide and hard to forget.',
        },
      ],
      causeEffect: {
        cause: 'A marker copied another student’s answers into Oliver’s paper.',
        effect: 'Oliver received a mark that was not his.',
      },
      purpose: 'To show that honesty can be a small, quiet action rather than a speech.',
      falseMainIdeas: [
        'Oliver keeps the extra points because nobody else would notice.',
        'The marker is publicly blamed in a long speech to the hall.',
        'The story is mainly about how fast the practice paper was marked.',
      ],
    },
  },
  {
    id: 'exam-morning',
    theme: 'real_world',
    title: 'Saturday Morning at the Exam Centre',
    tags: ['school', 'inquiry', 'argument'],
    paragraphs: [
      `The independent school in Kew used its sports hall for the scholarship morning. Parents waited under the plane trees. Inside, the desks were too evenly spaced to feel friendly. Oliver sharpened a pencil he did not need and read the first English passage the way he had practised: slowly, then again.`,
      `{strategy} He tried to {identify} what the writer wanted him to notice, not just which word looked hard. {context} A weaker reader would rush. He chose to {analyse} the second paragraph until the main idea sat still. {relevant}`,
      `When a question asked him to {evaluate} the narrator's reason for leaving, he looked back for {evidence} instead of inventing a feeling. {accurate} The supervisor said time was up. Oliver turned the paper over without panic. He had not known every word, but he had used the ones he knew with care, and that is how a native speaker earns marks.`,
    ],
    slots: [
      slot(
        'strategy',
        'A steady reading {word} mattered more than finishing first.',
        'plan',
        ['noun'],
        ['school'],
        ['strategy', 'approach', 'method'],
      ),
      slot('identify', '{word}', 'pick out', ['verb'], ['inquiry', 'school'], ['identify', 'recognise']),
      slot(
        'context',
        'The {word} of the passage — a coastal town after a storm — explained why the boats were gone.',
        'setting',
        ['noun'],
        ['school', 'argument'],
        ['context'],
      ),
      slot('analyse', '{word}', 'look closely at', ['verb'], ['inquiry'], ['analyse', 'interpret']),
      slot(
        'relevant',
        'Only the {word} details belonged in the answer: the boats, the weather, and the empty jetty.',
        'on-topic',
        ['adjective'],
        ['argument', 'school'],
        ['relevant', 'specific', 'essential'],
      ),
      slot('evaluate', '{word}', 'judge', ['verb'], ['argument', 'inquiry'], ['evaluate', 'assess']),
      slot('evidence', '{word}', 'lines in the text', ['noun'], ['inquiry'], ['evidence']),
      slot(
        'accurate',
        'An {word} answer names the reason in the passage, not a reason that merely sounds wise.',
        'exact',
        ['adjective'],
        ['inquiry', 'school'],
        ['accurate', 'specific'],
      ),
    ],
    facts: {
      centralIdea:
        'A scholarship exam morning rewards careful reading and text-based answers more than panic or speed.',
      details: [
        'The exam was held in a sports hall at an independent school in Kew.',
        'Parents waited under the plane trees.',
        'The first English passage was set in a coastal town after a storm.',
      ],
      inferences: [
        {
          claim: 'Oliver values accuracy over finishing first.',
          evidence: 'He rereads, looks back for evidence, and turns the paper over without panic.',
        },
      ],
      causeEffect: {
        cause: 'He reads slowly and checks the passage.',
        effect: 'He can answer with reasons from the text rather than invented feelings.',
      },
      purpose: 'To show that careful, evidence-based reading earns marks on a scholarship paper.',
      falseMainIdeas: [
        'Oliver tries to finish first and invents feelings for the narrator.',
        'The morning is mainly about the plane trees and the tram outside.',
        'The passage argues that unknown words make a scholarship paper hopeless.',
      ],
    },
  },
];

export function blueprintById(id: string): PassageBlueprint | undefined {
  return PASSAGE_BLUEPRINTS.find((item) => item.id === id);
}

export function blueprintsForTheme(theme: ReadingTheme): PassageBlueprint[] {
  return PASSAGE_BLUEPRINTS.filter((item) => item.theme === theme);
}
