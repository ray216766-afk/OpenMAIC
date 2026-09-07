# Vocabulary Selection Rules — Y5–Y6 Academic Vocabulary Master

**Purpose:** Curate high-value academic vocabulary for Oliver (Australian Year 5 native English high achiever, scholarship prep).  
**Scope:** Phase 1 Academic Core and subsequent category batches toward ~1500 total words.

---

## 1. Selection Philosophy

Every word must earn its place. Prefer words that:

1. **Improve complex reading** — appear frequently in NAPLAN, scholarship papers, science/HASS texts, and quality fiction.
2. **Upgrade writing** — replace vague or basic phrasing with precise academic expression.
3. **Transfer across subjects** — useful in English, Science, HASS, and persuasive/expository writing.
4. **Build word families** — roots that unlock analyse/analysis/analytical, evaluate/evaluation/evaluative, etc.
5. **Suit a native Y5–Y6 high achiever** — not baby words; not obscure GRE-level jargon.

**Reject:** happy, sad, big, small, walk, run, house, dog, nice, good, bad, and any word a typical Year 3 student already owns without stretch.

**Ask before adding:**
- Does this help Oliver *read harder texts* or *write more precisely*?
- Is there a simpler everyday synonym he already knows that this upgrades?
- Will a Chinese-speaking parent see clear value in the Chinese gloss?
- Is it Australian English where spelling differs (analyse, organisation, colour)?

---

## 2. Scoring Model (difficulty_score 1–10)

| Score | Level | Meaning |
|------:|:------|---------|
| 1–2 | 1 | Familiar academic; high frequency in Y5 texts |
| 3–4 | 1 | Essential Y5–Y6; may need explicit teaching |
| 5–6 | 2 | High-achievement; strong scholarship/NAPLAN stretch |
| 7–8 | 3 | Scholarship / advanced academic register |
| 9–10 | 3 | Rare but high-value; use sparingly in early batches |

**Consistency rule:** Level 1 → scores 1–4; Level 2 → 5–6; Level 3 → 7–10.  
Within a level, higher scores mark denser morphology, abstractness, or rarer school exposure.

---

## 3. Categories (Master Database)

| Category | Role |
|----------|------|
| **Academic Core Vocabulary** | Cross-curricular high-frequency academic words (Batch 1 focus) |
| **Persuasive & Argument** | claim, refute, bias, credible, assert… |
| **Science & Inquiry** | hypothesis, variable, observe, classify… |
| **HASS / Society** | civilisation, democracy, migration, heritage… |
| **Literary & Narrative** | foreshadow, atmosphere, protagonist, imagery… |
| **Precision Upgrades** | replacements for vague words (utilise→use carefully; etc.) |
| **Word Families & Morphology** | prefix/suffix clusters for transfer |
| **Scholarship Stretch** | denser abstract vocabulary for selective-entry prep |

Batch 1 is **Academic Core Vocabulary** only. Later batches fill other categories toward ~1500.

---

## 4. Difficulty Distribution (Overall Goals)

Across the full Academic Core (~400) and master set (~1500):

| Level | Label | Approx. share | Batch 1 (100) target |
|------:|-------|---------------|----------------------|
| **1** | Essential Y5–Y6 | ~60% | ~60 |
| **2** | High Achievement | ~30% | ~30 |
| **3** | Scholarship | ~10% | ~10 |

**Level field in data:** Prefer `"1"`, `"2"`, `"3"` (see README). Human-readable aliases “Level 1” etc. are acceptable in docs only.

---

## 5. Entry Quality Requirements

Each JSON entry must include:

| Field | Standard |
|-------|----------|
| `id` | VAC#### sequential (Batch 1: VAC0001–VAC0100) |
| `word` | Australian spelling where relevant |
| `category` | Exact category string |
| `level` | `"1"` \| `"2"` \| `"3"` |
| `part_of_speech` | Primary POS (e.g. verb, noun, adjective) |
| `chinese_meaning` | Concise **parent-only** Chinese |
| `simple_definition` | Y5-friendly, one clear sentence |
| `detailed_definition` | Slightly richer; still age-appropriate |
| `example_sentence` | Natural school/life context; meaning unmistakable |
| `creative_writing_example` | Prefer `Basic: … / Improved: …` upgrade pattern |
| `synonyms` | Useful, similar difficulty — not obscure |
| `antonyms` | Only when meaningful; else `[]` |
| `common_collocations` | Natural phrases learners actually meet |
| `word_family` | Related forms (analyse, analysis, analytical…) |
| `difficulty_score` | Integer 1–10 aligned with level |
| `review_schedule` | `["Day 1","Day 3","Day 7","Day 14","Day 30"]` |

---

## 6. QC Checklist (Pre-Commit)

Before locking a batch:

- [ ] Exactly N words as specified; no duplicates (case-insensitive lemma check)
- [ ] IDs sequential and unique
- [ ] Level counts approximate target distribution
- [ ] No basic/everyday-only words
- [ ] Every word improves reading **or** academic writing
- [ ] Australian spelling checked (analyse, organisation, favour, colour…)
- [ ] `simple_definition` readable by a strong Y5 without dictionary panic
- [ ] Examples demonstrate the target sense clearly
- [ ] Creative upgrades show real phrasing improvement
- [ ] Chinese meanings accurate and concise (parent-only)
- [ ] Synonyms useful; antonyms empty when forced
- [ ] Word families populated for morphology-rich lemmas
- [ ] JSON validates; CSV opens cleanly in Excel (arrays flattened with `|`)
- [ ] Mental gate passed for each word: valuable? better than simpler? transferable?

---

## 7. Batch Approval Gate

- **Batch 1 (words 001–100):** Generate → parent/teacher review → **wait for approval** before 101–400.
- Do not generate further Academic Core or other-category batches until Batch 1 is approved.

