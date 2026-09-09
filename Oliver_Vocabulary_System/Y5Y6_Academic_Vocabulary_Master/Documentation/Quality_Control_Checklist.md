# Quality Control Checklist — Y5–Y6 Academic Vocabulary Master

Use this checklist before approving any batch (Batch 1: VAC0001–VAC0100) and before generating AI daily lessons from that batch.

---

## A. File & Schema Integrity

- [ ] Output folder: `/workspace/Y5Y6_Academic_Vocabulary_Master/`
- [ ] JSON is a valid array of objects
- [ ] Exactly **100** entries in Batch 1
- [ ] Field names match the exact schema (no renamed keys)
- [ ] `review_schedule` is always `["Day 1","Day 3","Day 7","Day 14","Day 30"]`
- [ ] CSV opens in Excel without encoding glitches (UTF-8)
- [ ] Arrays in CSV flattened with `|` separator
- [ ] IDs are `VAC0001` … `VAC0100` with no gaps or duplicates
- [ ] `category` is `"Academic Core Vocabulary"` for every Batch 1 row

---

## B. Selection Quality

- [ ] No basic/everyday-only words (happy, big, walk, house, dog, etc.)
- [ ] Every word improves **complex reading** and/or **higher-level writing**
- [ ] Words are transferable across English / Science / HASS where possible
- [ ] Prefer strong word families; `word_family` populated meaningfully
- [ ] No duplicate lemmas (case-insensitive) within the batch
- [ ] High-value Academic Core represented (analyse, significant, evaluate, justify, perspective, consequence, impact, scarce, etc.) without being *only* those examples

---

## C. Level & Difficulty Distribution

- [ ] Levels use `"1"` | `"2"` | `"3"` (preferred)
- [ ] Approx. **~60** Level 1, **~30** Level 2, **~10** Level 3 for Batch 1
- [ ] `difficulty_score` is integer **1–10**
- [ ] Scores align with level: L1→1–4, L2→5–6, L3→7–10

---

## D. Definitions & Examples

- [ ] `simple_definition`: Y5-friendly, clear, one idea
- [ ] `detailed_definition`: richer but still age-appropriate
- [ ] `example_sentence`: natural; meaning obvious from context
- [ ] `creative_writing_example`: shows upgrade (ideally `Basic: … / Improved: …`)
- [ ] Australian English spelling where relevant (analyse, organisation, colour…)

---

## E. Lexical Relations

- [ ] `synonyms`: useful, similar difficulty, not obscure
- [ ] `antonyms`: only when meaningful; otherwise `[]`
- [ ] `common_collocations`: natural school/academic phrases
- [ ] `word_family`: related forms listed (verb/noun/adj/adv as applicable)
- [ ] `part_of_speech` matches primary classroom use of the headword

---

## F. Bilingual / Audience Split

- [ ] `chinese_meaning`: concise, accurate, **parent-only**
- [ ] No requirement for Oliver to study via Chinese
- [ ] Lesson materials generated from this DB keep student face English-only (see AI Lesson Generation Rules)

---

## G. Mental Gate (Per Word)

For each entry, confirm:

1. Valuable for a Y5–Y6 high achiever / scholarship prep?
2. Improves reading or academic writing?
3. Better / more precise than a simpler word he already knows?
4. Child-friendly definition?
5. Meaningful example + creative upgrade?
6. Not duplicated?
7. Transferable across contexts?

If any answer is “no,” replace the word before approval.

---

## H. Approval Gate

- [ ] Parent/teacher has reviewed sample (first 10 + last 5) and spot-checked Chinese
- [ ] Batch 1 approved **before** generating Academic Core 101–400
- [ ] No OpenMAIC repo files modified as part of this vocabulary work

---

## I. Post-Approval Lesson Spot-Check

When first daily lessons are generated from Batch 1:

- [ ] 10 new + 15 review + 180–220 word reading built topic-first (about 5–8 naturally fitting targets; do not force 10/10)
- [ ] 4–5 reading MCQs meet design rules and are aligned to the finished passage
- [ ] Review items do not force antonyms onto concept nouns; no default “none of these”
- [ ] Student English-only; parent Chinese pack separate

