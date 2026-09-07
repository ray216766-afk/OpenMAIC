# Oliver Scholarship Vocabulary Master System — V1.0

Long-term English vocabulary training for **Oliver** (Year 5–6 Australian Scholarship prep). Target exams: EduTest, Australian private-school scholarship tests, and Academic Select style English.

This is **not ESL**. Oliver is a native English speaker. Student-facing content is English only. The `chinese` field exists solely for parent reference.

## How this sits in OpenMAIC

The engine is self-contained under `Oliver_Vocabulary_System/`. OpenMAIC exposes it through:

| Surface | Path |
| --- | --- |
| Student UI | http://localhost:3007/oliver-vocabulary |
| Generate lesson API | `POST /api/oliver-vocabulary/lesson` `{ "day": 25 }` |
| Progress API | `GET /api/oliver-vocabulary/progress` |
| Quiz / progress update | `POST /api/oliver-vocabulary/quiz` |
| CLI | `pnpm oliver:lesson -- 25` |
| Thin adapter | `lib/oliver-vocabulary/index.ts` |

The host app is configured to serve on **port 3007**.

## Run on port 3007

```bash
pnpm install
pnpm dev
# or
pnpm start
```

Both `dev` and `start` use `-p 3007`. Then open:

`http://localhost:3007/oliver-vocabulary`

## Generate Oliver Vocabulary Lesson Day XX

### UI

1. Open `/oliver-vocabulary`
2. Enter a day number (try **25**)
3. Click **Generate Oliver Vocabulary Lesson Day 25**

The page shows:

1. **New Vocabulary** — 10 words (no Chinese)
2. **Review Vocabulary** — 15 words + exercises
3. **Mini Reading** — 150–200 words
4. **Reading Questions** — 3–5 items

Use **Parent reference (Chinese)** to reveal translations from the database. They are never part of the student lesson payload.

Mark the review section to update `Vocabulary_Progress.json`.

### API

```bash
curl -s -X POST http://localhost:3007/api/oliver-vocabulary/lesson \
  -H 'Content-Type: application/json' \
  -d '{"day":25}'
```

`GET /api/oliver-vocabulary/lesson?day=25` also works.

### CLI

```bash
pnpm oliver:lesson -- 25
pnpm oliver:lesson -- --day 1 --print
pnpm oliver:lesson -- --day 25 --no-persist
```

`--print` writes the English-only student markdown to stdout. A JSON snapshot is written to `Oliver_Vocabulary_System/Lesson_Day_XXX.json`.

## Folder layout

```
Oliver_Vocabulary_System/
├── Vocabulary_Master.json      # seed database
├── Vocabulary_Progress.json    # live mastery store
├── Daily_Lesson_Generator/     # Day N curriculum + orchestration
├── Review_Engine/              # selection + exercises
├── Mini_Reading_Generator/     # 150–200 word passages + questions
├── Lesson_Template/            # student / parent lesson shape
├── types.ts                    # contracts + V2/V3 hooks
├── store.ts                    # JSON persistence
├── student-view.ts             # strips Chinese
├── extensions.ts               # reserved V2/V3 hooks
├── cli.ts
├── scripts/
│   ├── seed-source.ts          # curated compact seed
│   ├── seed-l2.ts … seed-l5.ts
│   ├── build-master.ts         # rebuild Vocabulary_Master.json
│   └── expand-vocabulary.ts    # merge curated packs toward ~1000
└── Documentation.md
```

## Vocabulary schema

```json
{
  "id": "VOC0001",
  "word": "reluctant",
  "level": 3,
  "category": "Emotion",
  "chinese": "不情愿的",
  "definition": "Not willing or eager to do something.",
  "synonyms": ["unwilling", "hesitant"],
  "antonyms": ["eager", "willing"],
  "word_family": { "noun": "reluctance" },
  "collocations": ["reluctant to admit", "reluctant decision"],
  "example_sentence": "Tom was reluctant to leave his family behind.",
  "edutest_frequency": 5,
  "writing_value": "Useful for character description"
}
```

Levels (no Year 5/6 split):

1. Core Upgrade Vocabulary
2. Character & Emotion Vocabulary
3. Advanced Reading Vocabulary
4. Academic Scholarship Vocabulary
5. High-Level Scholarship Vocabulary

V1 ships a curated starter of **300+** words across all five levels. Rebuild from source with:

```bash
pnpm oliver:build-master
```

### Expand toward ~1000

Do not auto-generate filler lists. Add a curated pack (same schema, or `{ "words": [...] }`):

```bash
pnpm oliver:expand -- --pack Oliver_Vocabulary_System/packs/batch-02.json
```

## Progress schema and mastery

```json
{
  "word": "reluctant",
  "first_seen": "Day 1",
  "review_count": 3,
  "correct_rate": 90,
  "mastery": "Mastered"
}
```

| Mastery | Rule |
| --- | --- |
| New | `review_count` is 0 |
| Learning | 1–2 reviews, or accuracy under 60% |
| Developing | 3–4 reviews and accuracy ≥ 60% |
| Mastered | 5+ reviews and accuracy ≥ 85% |

**Strong → Mastered.** If any display or import uses `Strong`, it is stored and compared as `Mastered`.

Review selection priority:

1. Recently learned
2. Incorrect
3. Low mastery
4. Spaced repetition

Day N is a stable curriculum slot (Day 1 = first ten level-ordered words, Day 2 = next ten, …). Review for Day N prefers words from Days 1..N-1, then fills from the bank so every lesson still has 15 review items.

Generating a lesson writes `first_seen`. Completing review exercises updates `review_count`, `correct_rate`, and mastery.

## Mini reading

Passages are English only, scholarship difficulty, Australian school/camp/exam settings. Themes rotate: adventure, mystery, science, history, character challenge, real-world. Each passage includes at least five of that day’s new words plus review words, then 3–5 questions (vocabulary in context, main idea, inference, detail).

## Extension points (not implemented)

V2 Writing Module and V3 Book Integration are reserved only:

```ts
import { reservedExtensions } from '@/Oliver_Vocabulary_System/extensions';
// reservedExtensions.writing.fromLesson(lesson) throws in V1
// reservedExtensions.books.plannedTitles === ['Hatchet', 'Nevermoor', 'Wonder']
```

Do not implement writing generation or book-specific vocabulary here. Future modules should consume a completed `DailyLesson` plus `ProgressEntry[]`.

## Tests

```bash
pnpm exec vitest run tests/oliver-vocabulary/engine.test.ts
```
