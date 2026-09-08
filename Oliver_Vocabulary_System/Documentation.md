# Oliver Scholarship Vocabulary Master System — V1.1

Long-term English vocabulary training for **Oliver** (Year 5–6 Australian Scholarship prep). Target exams: EduTest, Australian private-school scholarship tests, and Academic Select style English.

This is **not ESL**. Oliver is a native English speaker. Student-facing content is English only. `chinese_meaning` / `chinese` exists solely for parent reference.

## Active bank

The live lesson bank is **Academic Core Batch 1 (100 words, VAC0001–VAC0100)**.

| Item | Value |
| --- | --- |
| Source of truth | `Y5Y6_Academic_Vocabulary_Master/data/Academic_Core_Batch_001_words_001-100.json` |
| Compiled snapshot | `Vocabulary_Master.json` (rebuilt with `pnpm oliver:build-master`) |
| Archived V1.0 seed | `archive/Vocabulary_Master_seed_v1_309.json` (not used for lessons) |
| Expansion path | Later approved batches toward **~1500** words. Do not generate Batch 2+ here. |

Day 1 new words are the first ten Level 1 Academic Core lemmas (analyse, significant, environment, …).

## Progress reset

`Vocabulary_Progress.json` was **wiped** when the live bank switched from the V1.0 309-word seed to Academic Core Batch 1. Day 1 starts clean. Old seed mastery is not migrated because IDs, lemmas, and levels do not match.

## How this sits in OpenMAIC

The engine is self-contained under `Oliver_Vocabulary_System/`. OpenMAIC exposes it through:

| Surface | Path |
| --- | --- |
| Student UI | http://127.0.0.1:2007/oliver-vocabulary |
| Generate lesson API | `POST /api/oliver-vocabulary/lesson` `{ "day": 1 }` |
| Progress API | `GET /api/oliver-vocabulary/progress` |
| Quiz / progress update | `POST /api/oliver-vocabulary/quiz` |
| CLI | `pnpm oliver:lesson -- --day 1` |
| Thin adapter | `lib/oliver-vocabulary/index.ts` |

This Vocabulary Master entry serves on **port 2007**. It does not use 3007, so it will not fight an existing local Vocabulary/OpenMAIC instance that is already on 3007.

## Local run on port 2007

Requirements:

- **Node.js >= 22.19.0**
- **pnpm** >= 10 (Windows PowerShell: if `pnpm` is not found, use `pnpm.cmd`)

```bash
git clone https://github.com/ray216766-afk/OpenMAIC.git
cd OpenMAIC
pnpm install
pnpm dev
```

On Windows PowerShell, the same steps are `pnpm.cmd install` then `pnpm.cmd dev` when the `pnpm` shim is missing.

`pnpm start` uses the same launcher after `pnpm build`. Both commands bind Next.js to **`0.0.0.0:2007`** with a fixed port. The launcher does not increment to another port and does not stop an existing process.

**`0.0.0.0` is the listen/bind address, not a browser URL.** Open one of these instead:

- Local: http://127.0.0.1:2007/oliver-vocabulary
- Local: http://localhost:2007/oliver-vocabulary
- Network: `http://<detected-lan-ip>:2007/oliver-vocabulary`

The launcher prints the detected LAN IPv4 (non-loopback, excluding `169.254.x.x` link-local). Do not type `http://0.0.0.0:2007` in the browser.

### Firewall / port diagnostics

If the page does not load:

1. Confirm something is listening on 2007: `ss -ltnp | grep 2007` (Linux/macOS) or `netstat -ano | findstr :2007` (Windows).
2. If 2007 is busy, free it yourself. This launcher will not kill the other process or move to another port.
3. Allow inbound TCP **2007** on the host firewall for phone/LAN access.
4. Keep any existing 3007 app running if you need it. This entry is **2007** only.

## Generate Oliver Vocabulary Lesson Day XX

### UI

1. Open `/oliver-vocabulary`
2. Enter a day number (try **1**)
3. Click **Generate Oliver Vocabulary Lesson Day 1**

The page shows:

1. **New Vocabulary** — 10 words (English only: POS, simple definition, family, collocations, example, creative upgrade) plus a **Listen** speaker on each word
2. **Review Vocabulary** — 15 headwords with Listen, plus exercises (prefers prior days and `review_schedule`)
3. **Mini Reading** — 150–200 words
4. **Reading Questions** — 3–5 items

Use **Parent reference (Chinese)** to reveal `chinese_meaning` and the richer `detailed_definition`. They are never part of the student lesson payload.

Mark the review section to update `Vocabulary_Progress.json`.

### API

```bash
curl -s -X POST http://127.0.0.1:2007/api/oliver-vocabulary/lesson \
  -H 'Content-Type: application/json' \
  -d '{"day":1}'
```

`GET /api/oliver-vocabulary/lesson?day=1` also works.

### CLI

```bash
pnpm oliver:lesson -- --day 1
pnpm oliver:lesson -- --day 1 --print
pnpm oliver:lesson -- --day 1 --no-persist
```

`--print` writes the English-only student markdown to stdout. A JSON snapshot is written to `Oliver_Vocabulary_System/Lesson_Day_XXX.json`.

## Folder layout

```
Oliver_Vocabulary_System/
├── Y5Y6_Academic_Vocabulary_Master/
│   ├── data/Academic_Core_Batch_001_words_001-100.json   # live canonical bank
│   ├── data/Vocabulary_Master_from_Batch001.json         # mapped engine view
│   └── Documentation/                                    # selection / lesson / QC rules
├── Vocabulary_Master.json      # compiled runtime snapshot of Batch 1
├── archive/Vocabulary_Master_seed_v1_309.json
├── Vocabulary_Progress.json    # live mastery store (reset for Batch 1)
├── Daily_Lesson_Generator/     # Day N curriculum + orchestration
├── Review_Engine/              # selection + exercises
├── Mini_Reading_Generator/     # 150–200 word passages + questions
├── Lesson_Template/            # student / parent lesson shape
├── types.ts                    # contracts + V2/V3 hooks
├── normalize.ts                # Academic Core → engine schema
├── store.ts                    # JSON persistence
├── student-view.ts             # strips Chinese
├── extensions.ts               # reserved V2/V3 hooks
├── cli.ts
├── scripts/
│   ├── build-master.ts         # compile Batch 1 → Vocabulary_Master.json
│   └── expand-vocabulary.ts    # merge later approved packs toward ~1500
└── Documentation.md
```

## Vocabulary schema

Canonical Academic Core fields:

```json
{
  "id": "VAC0001",
  "word": "analyse",
  "level": "1",
  "category": "Academic Core Vocabulary",
  "part_of_speech": "verb",
  "chinese_meaning": "分析",
  "simple_definition": "To look closely at something so you can understand how it works or what it means.",
  "detailed_definition": "To examine information, ideas, or evidence carefully…",
  "example_sentence": "In science, we analyse the data from our plant experiment…",
  "creative_writing_example": "Basic: We looked at the results. / Improved: We analysed…",
  "synonyms": ["examine", "study", "investigate"],
  "antonyms": ["ignore", "overlook"],
  "common_collocations": ["analyse data", "analyse a text"],
  "word_family": ["analyse", "analysis", "analytical"],
  "difficulty_score": 3,
  "review_schedule": ["Day 1", "Day 3", "Day 7", "Day 14", "Day 30"]
}
```

The loader maps `chinese_meaning` → parent-only `chinese`, `simple_definition` → student `definition`, and `common_collocations` → `collocations`.

Levels (Academic Core):

1. Essential Y5–Y6
2. High Achievement
3. Scholarship Stretch

Rebuild the compiled snapshot with:

```bash
pnpm oliver:build-master
```

### Expand toward ~1500

Do not auto-generate filler lists or Batch 2+ words here. After a later batch is approved, merge a curated pack:

```bash
pnpm oliver:expand -- --pack Oliver_Vocabulary_System/Y5Y6_Academic_Vocabulary_Master/data/Academic_Core_Batch_002.json
```

## Progress schema and mastery

```json
{
  "word": "analyse",
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
4. Spaced repetition + each word’s `review_schedule` (Day 1 / 3 / 7 / 14 / 30)

Day N is a stable curriculum slot (Day 1 = first ten level-ordered Academic Core words, Day 2 = next ten, …). Review for Day N prefers words from Days 1..N-1, then fills from the bank so every lesson still has 15 review items.

Generating a lesson writes `first_seen`. Completing review exercises updates `review_count`, `correct_rate`, and mastery.

## Listen — standard British English (en-GB)

Each new-word card and each review headword has a **Listen** speaker control on `/oliver-vocabulary`.

- Playback uses the browser **Web Speech API** (`speechSynthesis`). No API key is required.
- The utterance language is always **`en-GB`** (standard British English).
- Voice selection prefers en-GB voices such as Google UK English and Microsoft Hazel / Daniel. **en-AU is never preferred.**
- Clicking Listen on another word stops the previous utterance. The active button shows a Speaking state.
- Student view is English-only. Listen never speaks Chinese (parent-reference translations stay silent).
- Example-sentence Listen on new-word cards is optional; the primary action speaks the headword.

OpenMAIC cloud TTS is not required for this control. Keyless Listen must keep working even when no TTS provider is configured.

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
pnpm exec vitest run tests/oliver-vocabulary/engine.test.ts tests/oliver-vocabulary/british-speech.test.ts tests/oliver-vocabulary/local-access.test.ts
```
