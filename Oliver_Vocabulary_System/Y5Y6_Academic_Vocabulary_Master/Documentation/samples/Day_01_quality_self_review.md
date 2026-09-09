# Day 1 quality self-review (fresh generate)

Generated with `persist: false` against Academic Core Batch 1.  
Student markdown: `Day_01_quality_sample.md`  
JSON fixture: `tests/oliver-vocabulary/artifacts/day-01-quality-sample.json`

Locked live `Lesson_Day_XXX.json` files were **not** overwritten. This sample shows new quality on a fresh generate.

## Spec checks

| Gate | Result | Notes |
|------|--------|--------|
| Natural language > coverage | Pass | 5 of 10 new words in the reading. Unused: *environment, demonstrate, justify, perspective, impact* — tested on cards / later review, not stuffed into the camp walk. |
| One central idea | Pass | School-camp ridge walk: notice conditions; do not race. |
| Topic-first, not example-dump | Pass | No concatenated Day 1 example sentences (creek / debate / farmer’s drought / photosynthesis). |
| Remove-the-vocabulary test | Pass | If analyse / determine / evaluate / significant / consequence (and compare / investigate / method) were unmarked, it is still a camp article. |
| Density | Pass | 183 words, 8 targets (~1 / 23 words). |
| No forced antonyms | Pass | *environment, perspective, evidence, method, process* are not antonym items. *method* is sentence completion. |
| No default “none of these” | Pass | Zero occurrences in review options/answers. |
| Unique / contextual stems | Pass | Cloze items keep the clue after the blank (e.g. compare the two poems…; method you used so another student could repeat your test). |
| Reading questions aligned | Pass | Detail, vocab-in-context (*analyse*), main idea, inference, cause/effect — all grounded in the finished ridge passage. Distractors are misreadings of *this* walk, not helicopters. |
| Student English-only | Pass | Chinese only on the parent reference cards. |

## Passage (excerpt)

*The Ridge Beyond the Marked Trail* — adventure, 183 words.

Year 6 leaves the painted markers, notices weather and rock, investigates the slope, compares wet bark with dry dust, evaluates the safer line, treats the crumbling edge as a consequence, and analyses what they saw so the next pair will not slip. The prize is an accurate description, not a heroic tale.

## Residual limits (honest)

This generator is template-based, not an LLM. Slots are preferred-lemma matches inside a finished story. A human editor could still polish a phrase such as “a patient method mattered more than speed.” The architecture no longer builds a passage by joining one example sentence per word.

## How to re-check in the app

1. Open http://127.0.0.1:2007/oliver-vocabulary
2. Parent/admin: **Reset this day** on an unused test day (or Day 1 if you accept replacing a lock)
3. **Generate** and read Section 3 as a real article, then Section 2/4 for unique answers and colours after Submit
