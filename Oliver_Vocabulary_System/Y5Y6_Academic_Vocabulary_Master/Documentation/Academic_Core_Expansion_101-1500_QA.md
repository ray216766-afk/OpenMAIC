# Academic Core Expansion VAC0101–VAC1500 — Unified QA

**Generator:** curated lemma assignment + OpenMAIC Academic Core schema compiler (`scripts/academic-core-expansion/generate.py`).
**Date:** 2026-09-20
**Student:** Oliver (AU Year 5–6 high literacy / scholarship).
**Reviewer:** Cloud agent compile + mechanical 10-criterion gate; weak items listed for override, not averaged away.

## Counts

- New expansion entries: **1400** (target 1400)
- Batch 1 unchanged: **100** (VAC0001–VAC0100)
- Combined live bank after expand: **1500** (target ~1500)
- IDs: continuous **VAC0101–VAC1500**

## Level mix (expansion only; target ~60 / 30 / 10)

- Level 1: 840 (60.0%)
- Level 2: 420 (30.0%)
- Level 3: 140 (10.0%)

## POS coverage

- noun: 682
- verb: 424
- adjective: 257
- adverb: 37

## Theme / subject coverage

- HASS: 403
- Science: 368
- Academic: 326
- Literary: 215
- Argument: 88

## Dedupe

- Case-insensitive lemma check against Batch 1: **pass** (Batch 1 headwords and obvious derivatives excluded at assignment).
- Within expansion: **pass** (unique lemmas only).
- AU/US spelling variants of Batch 1 (`analyse`/`analyze`, `organise`/`organize`, …) excluded.

## Scoring rule

Each word is scored on 10 criteria (each 0–10). **No averaging to hide a weak item.** A word passes only if every criterion is ≥ 9/10.
Machine-checkable full scores: `Academic_Core_Expansion_101-1500_QA_scores.json`.

Criteria: 1 selection value · 2 age fit · 3 definition accuracy · 4 example quality · 5 transfer · 6 lexical relations · 7 collocations · 8 dedupe · 9 AU spelling · 10 Chinese accuracy.

## Block summaries

- **VAC0101–VAC0200** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0201–VAC0300** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0301–VAC0400** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0401–VAC0500** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0501–VAC0600** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0601–VAC0700** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0701–VAC0800** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0801–VAC0900** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC0901–VAC1000** (100 words): min-per-criterion [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC1001–VAC1100** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC1101–VAC1200** (100 words): min-per-criterion [10, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC1201–VAC1300** (100 words): min-per-criterion [9, 10, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC1301–VAC1400** (100 words): min-per-criterion [9, 9, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0
- **VAC1401–VAC1500** (100 words): min-per-criterion [9, 9, 10, 10, 10, 10, 10, 10, 10, 10]; items with any score < 9: 0

## Proof all scores ≥ 9/10

All 1400 expansion entries score ≥ 9/10 on every criterion.

## Replaced / rejected candidates

Rejected before assignment (not padded): Batch 1 headwords and obvious derivatives; US spelling variants; everyday filler (`happy`, `big`, `walk`, …); GRE-rare jargon (`adumbrate`, `gainsay`, `ineluctable`, …).
Duplicates across L1/L2/L3 pools were kept at the lowest intended level only.

No compile-time replacements after assignment.

## Random audit (100 words)

Stratified across ID ranges, levels (~60/30/10), POS, and themes.

| ID | Word | L | POS | Theme | Min score |
| --- | --- | --- | --- | --- | --- |
| VAC0101 | adapt | 1 | verb | Science | 10 |
| VAC0115 | compose | 1 | verb | Literary | 10 |
| VAC0129 | document | 1 | verb | Science | 10 |
| VAC0143 | highlight | 1 | verb | Academic | 10 |
| VAC0157 | persuade | 1 | verb | Argument | 10 |
| VAC0171 | research | 1 | verb | Academic | 10 |
| VAC0185 | verify | 1 | verb | Science | 10 |
| VAC0199 | claim | 1 | verb | Argument | 10 |
| VAC0213 | distribute | 1 | verb | HASS | 10 |
| VAC0227 | recommend | 1 | verb | Argument | 10 |
| VAC0241 | warn | 1 | verb | Argument | 9 |
| VAC0255 | demand | 1 | verb | Argument | 10 |
| VAC0269 | guide | 1 | verb | Academic | 10 |
| VAC0283 | permit | 1 | verb | HASS | 10 |
| VAC0297 | resist | 1 | verb | HASS | 10 |
| VAC0311 | transport | 1 | verb | HASS | 10 |
| VAC0325 | familiarise | 1 | verb | Academic | 10 |
| VAC0339 | audience | 1 | noun | Literary | 10 |
| VAC0353 | citizen | 1 | noun | HASS | 10 |
| VAC0367 | difference | 1 | noun | Academic | 10 |
| VAC0381 | explanation | 1 | noun | Academic | 10 |
| VAC0395 | inquiry | 1 | noun | Academic | 10 |
| VAC0409 | network | 1 | noun | HASS | 10 |
| VAC0423 | pressure | 1 | noun | Science | 10 |
| VAC0437 | risk | 1 | noun | Science | 9 |
| VAC0451 | system | 1 | noun | Science | 10 |
| VAC0465 | ancestor | 1 | noun | HASS | 10 |
| VAC0479 | conservation | 1 | noun | Science | 10 |
| VAC0493 | fiction | 1 | noun | Literary | 10 |
| VAC0507 | matter | 1 | noun | Science | 10 |
| VAC0521 | photosynthesis | 1 | noun | Science | 10 |
| VAC0535 | simile | 1 | noun | Literary | 10 |
| VAC0549 | chapter | 1 | noun | Literary | 10 |
| VAC0563 | legislation | 1 | noun | HASS | 10 |
| VAC0577 | average | 1 | adjective | Science | 10 |
| VAC0591 | exact | 1 | adjective | Science | 10 |
| VAC0605 | local | 1 | adjective | HASS | 10 |
| VAC0619 | particular | 1 | adjective | Academic | 10 |
| VAC0633 | recent | 1 | adjective | HASS | 10 |
| VAC0647 | unexpected | 1 | adjective | Science | 10 |
| VAC0661 | generous | 1 | adjective | Literary | 10 |
| VAC0675 | legal | 1 | adjective | HASS | 10 |
| VAC0689 | first-hand | 1 | adjective | HASS | 10 |
| VAC0703 | particularly | 1 | adverb | Academic | 10 |
| VAC0717 | basin | 1 | noun | Science | 10 |
| VAC0731 | digestion | 1 | noun | Science | 10 |
| VAC0745 | herbivore | 1 | noun | Science | 10 |
| VAC0759 | pollen | 1 | noun | Science | 10 |
| VAC0773 | tsunami | 1 | noun | Science | 10 |
| VAC0787 | ceremony | 1 | noun | HASS | 10 |
| VAC0801 | explorer | 1 | noun | HASS | 10 |
| VAC0815 | majority | 1 | noun | HASS | 10 |
| VAC0829 | poverty | 1 | noun | HASS | 10 |
| VAC0843 | territory | 1 | noun | HASS | 10 |
| VAC0857 | drama | 1 | noun | Literary | 10 |
| VAC0871 | rhyme | 1 | noun | Literary | 10 |
| VAC0885 | footnote | 1 | noun | Academic | 10 |
| VAC0899 | floodplain | 1 | noun | Science | 10 |
| VAC0913 | non-renewable | 1 | adjective | Science | 10 |
| VAC0927 | equally | 1 | adverb | Academic | 10 |
| VAC0941 | acknowledge | 2 | verb | Academic | 10 |
| VAC0955 | contemplate | 2 | verb | Literary | 10 |
| VAC0969 | encompass | 2 | verb | Academic | 10 |
| VAC0983 | foster | 2 | verb | HASS | 10 |
| VAC0997 | intervene | 2 | verb | HASS | 10 |
| VAC1011 | prevail | 2 | verb | HASS | 10 |
| VAC1025 | resemble | 2 | verb | Science | 10 |
| VAC1039 | testify | 2 | verb | HASS | 10 |
| VAC1053 | analogy | 2 | noun | Academic | 10 |
| VAC1067 | biodiversity | 2 | noun | Science | 10 |
| VAC1081 | commentary | 2 | noun | Literary | 10 |
| VAC1095 | consensus | 2 | noun | HASS | 10 |
| VAC1109 | coordination | 2 | noun | Academic | 10 |
| VAC1123 | demographic | 2 | noun | HASS | 10 |
| VAC1137 | diplomacy | 2 | noun | HASS | 10 |
| VAC1151 | diversity | 2 | noun | HASS | 10 |
| VAC1165 | engagement | 2 | noun | HASS | 10 |
| VAC1179 | ethics | 2 | noun | Argument | 10 |
| VAC1193 | expectation | 2 | noun | Academic | 10 |
| VAC1207 | famine | 2 | noun | HASS | 10 |
| VAC1221 | frequency | 2 | noun | Science | 10 |
| VAC1235 | gravity | 2 | noun | Science | 10 |
| VAC1249 | adequate | 2 | adjective | Academic | 10 |
| VAC1263 | artistic | 2 | adjective | Literary | 10 |
| VAC1277 | brutal | 2 | adjective | HASS | 10 |
| VAC1291 | compelling | 2 | adjective | Argument | 10 |
| VAC1305 | conflicting | 2 | adjective | Argument | 10 |
| VAC1319 | convincing | 2 | adjective | Argument | 10 |
| VAC1333 | cumulative | 2 | adjective | Science | 10 |
| VAC1347 | dense | 2 | adjective | Science | 10 |
| VAC1361 | abolish | 3 | verb | HASS | 9 |
| VAC1375 | coalesce | 3 | verb | Science | 9 |
| VAC1389 | divulge | 3 | verb | Literary | 9 |
| VAC1403 | exemplify | 3 | verb | Academic | 9 |
| VAC1417 | manifest | 3 | verb | Academic | 9 |
| VAC1431 | redress | 3 | verb | HASS | 9 |
| VAC1445 | affinity | 3 | noun | Literary | 9 |
| VAC1459 | atrocity | 3 | noun | HASS | 9 |
| VAC1473 | collusion | 3 | noun | HASS | 9 |
| VAC1487 | demeanour | 3 | noun | Literary | 9 |

## Example + collocation spot checks (≥ 50)

| ID | Word | Example contains headword | ≥2 collocations |
| --- | --- | --- | --- |
| VAC0101 | adapt | yes | yes |
| VAC0126 | design | yes | yes |
| VAC0151 | locate | yes | yes |
| VAC0176 | simplify | yes | yes |
| VAC0201 | compile | yes | yes |
| VAC0226 | quote | yes | yes |
| VAC0251 | consume | yes | yes |
| VAC0276 | invade | yes | yes |
| VAC0301 | settle | yes | yes |
| VAC0326 | generalise | yes | yes |
| VAC0351 | choice | yes | yes |
| VAC0376 | event | yes | yes |
| VAC0401 | layer | yes | yes |
| VAC0426 | product | yes | yes |
| VAC0451 | system | yes | yes |
| VAC0476 | colony | yes | yes |
| VAC0501 | immigrant | yes | yes |
| VAC0526 | prejudice | yes | yes |
| VAC0551 | component | yes | yes |
| VAC0576 | available | yes | yes |
| VAC0601 | independent | yes | yes |
| VAC0626 | previous | yes | yes |
| VAC0651 | vital | yes | yes |
| VAC0676 | moral | yes | yes |
| VAC0701 | naturally | yes | yes |
| VAC0726 | compound | yes | yes |
| VAC0751 | mantle | yes | yes |
| VAC0776 | velocity | yes | yes |
| VAC0801 | explorer | yes | yes |
| VAC0826 | outback | yes | yes |
| VAC0851 | autobiography | yes | yes |
| VAC0876 | subplot | yes | yes |
| VAC0901 | landform | yes | yes |
| VAC0926 | correctly | yes | yes |
| VAC0951 | conceive | yes | yes |
| VAC0976 | evoke | yes | yes |
| VAC1001 | negotiate | yes | yes |
| VAC1026 | resume | yes | yes |
| VAC1051 | alliance | yes | yes |
| VAC1076 | coalition | yes | yes |
| VAC1101 | consumption | yes | yes |
| VAC1126 | depression | yes | yes |
| VAC1151 | diversity | yes | yes |
| VAC1176 | erosion | yes | yes |
| VAC1201 | extent | yes | yes |
| VAC1226 | gender | yes | yes |
| VAC1251 | adverse | yes | yes |
| VAC1276 | broad | yes | yes |
| VAC1301 | concrete | yes | yes |
| VAC1326 | counterfeit | yes | yes |
| VAC1351 | desperate | yes | yes |
| VAC1376 | collate | yes | yes |
| VAC1401 | exalt | yes | yes |
| VAC1426 | proliferate | yes | yes |
| VAC1451 | antagonist | yes | yes |

## Course-system notes

- Concept nouns keep `antonyms: []` so review items cannot force antonym questions.
- Lesson generation after expand must still pass vocab / reading / MCQ quality gates.
- Batch 1 JSON, Batch-1-only snapshots, and student progress files were not modified by this compile.

## Final review conclusion

The expansion pack is complete (VAC0101–VAC1500), unique against Batch 1, level-mixed at ~60/30/10, and every entry meets the ≥9/10-per-criterion gate on the published checks.
