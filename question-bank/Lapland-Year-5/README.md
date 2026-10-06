# Lapland Year 5

Excel Test Zone NAPLAN-style Practice captures for Oliver Year 5.

Word documents have the exercises first and the answers on the last page. These captures are not official keys. Practice mode only.

## Browse page

Open `/lapland-year-5` on port **4017** (`pnpm exec next dev --hostname 127.0.0.1 --port 4017`). Do not use Vocabulary Master’s port 2007 or Codex’s port 3007. The main page lists all 60 Practice tests from `data/main-page-entries.json` (title, topic, question count, level, subject). Each one can be started, and the Word file downloads when it is in this folder. **Start Placement Test** sits through `data/placement-test-v1.json` one question at a time. Missed and bookmarked items collect in `/lapland-year-5/wrong-bank`. See `Naplan_Y5_System/README.md`.

## Layout

- `data/main-page-entries.json` — the 60 rows shown on `/lapland-year-5`.
- `data/resources-catalog.json` — the same 60 tests with strand, level, and timing.
- `data/placement-test-v1.json` — the 26-question level test. `correct_answer` is null until a key is filled in; the app does not invent one.
- `inventory/year5-naplan-online-style-tests.csv` — pack inventory (all subjects and levels).
- `Conventions-of-Language/Standard/` — Standard Practice batch: Grammar & Punctuation Tests 01–04 and Spelling Tests 01–04.
- `Conventions-of-Language/Intermediate/` — Intermediate Practice batch: Grammar & Punctuation Tests 05–08 and Spelling Tests 05–08.
- `Conventions-of-Language/Advanced/` — Advanced Practice batch: Grammar & Punctuation Tests 09–12 and Spelling Tests 09–12. Conventions Practice (Grammar & Punctuation and Spelling) is complete. Sample tests are not in these folders.
- `Numeracy/Standard/`, `Numeracy/Intermediate/`, and `Numeracy/Advanced/` — Numeracy Practice Word docs (Measurement & Geometry, Number & Algebra, Statistics & Probability). Some items are image-heavy and the Word files include placeholder text where a figure could not be captured.
- `Reading/Standard/`, `Reading/Intermediate/`, and `Reading/Advanced/` — Reading Practice Tests 01–12. Passage titles are on the browse page where the capture includes one. Tests 03 and 09 are image-heavy passages. Writing is not in this practice bank; those written tests spend attempt credits.
