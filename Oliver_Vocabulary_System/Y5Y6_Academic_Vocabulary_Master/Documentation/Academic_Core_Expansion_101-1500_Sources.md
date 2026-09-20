# Academic Core Expansion VAC0101–VAC1500 — Sources

**Date:** 2026-09-20  
**Compiler:** `Oliver_Vocabulary_System/scripts/academic-core-expansion/generate.py`  
**Bank:** Oliver Scholarship Vocabulary Master, Academic Core category  
**Audience:** Oliver, Australian Year 5–6 high literacy / scholarship (EduTest, private-school scholarship, Academic Select style)

## Provenance (honest)

This pack was **curated and compiled in-repo**. It is not a scraped dump of any single commercial word list, and it does not invent exam-board item banks.

Selection drew on public, well-known academic-vocabulary practice plus the project's own rules:

1. **Project rules (primary)**  
   `Y5Y6_Academic_Vocabulary_Master/Documentation/Vocabulary_Selection_Rules.md`  
   `Quality_Control_Checklist.md`  
   `AI_Lesson_Generation_Rules.md`  
   Batch 1 style in `Academic_Core_Batch_001_words_001-100.json` (VAC0001–VAC0100) — **read-only source of truth for those IDs**.

2. **Academic vocabulary research (orientation, not a copied list)**  
   - Averil Coxhead, *A New Academic Word List* (TESOL Quarterly, 2000) — used only as a familiarity map of cross-curricular academic lemmas. Headwords already in Batch 1, obvious derivatives, and US-only spellings were excluded.  
   - General academic / Tier 2 practice for upper-primary readers (precision upgrades over everyday words).

3. **Australian curriculum contexts (themes, not a syllabus transcript)**  
   - Science inquiry language typical of Y5–Y6 investigations (method, variable already in Batch 1; this pack adds habitat, ecosystem, photosynthesis, catchment, salinity, …).  
   - HASS: Federation, democracy, heritage, migration, parliament, First Nations / community / place language at classroom level.  
   - English: narrative craft and persuasion (metaphor, narrator, bias, claim, refute).

4. **Australian/British spelling**  
   Headwords use analyse-family *ise*, *our*, *re*, *ll* forms (`categorise`, `behaviour`, `centre` avoided as a US/AU clash by not using *center*, `skilful`, `judgement`, `artefact`, `vapour`, `demeanour`, `enthral`).

5. **Chinese glosses**  
   Parent-only concise glosses compiled with the entry. They are not student-facing and are not copied from a single dictionary edition.

6. **What was not used**  
   - No paywalled scholarship paper was transcribed.  
   - The archived V1.0 309-word seed (`archive/Vocabulary_Master_seed_v1_309.json`) was **not** copied as live IDs. A few high-value lemmas that also appear there were rewritten to Academic Core schema if they survived Batch 1 / quality filters.  
   - No student progress or locked lesson snapshots were read as a word source.

## Selection rationale

Every headword had to:

- Help a high-literacy Y5–Y6 student read harder texts or write more precisely  
- Be more specific than everyday filler  
- Sound natural in expository, narrative, lab, HASS, or exam prose  
- Be unique vs Batch 1 and within this pack (lemma, case, AU/US spelling, obvious derivative)  
- Prefer transferable word families and collocations  
- Avoid rare / obsolete / single-niche GRE jargon  

Level mix for this expansion (not Batch 1): Level 1 840, Level 2 420, Level 3 140 (target 840 / 420 / 140).

## Files produced

| File | Role |
| --- | --- |
| `data/Academic_Core_Expansion_101-1500.json` | 1400 new Academic Core entries, VAC0101–VAC1500 |
| `Documentation/Academic_Core_Expansion_101-1500_QA.md` | Unified QA |
| `Documentation/Academic_Core_Expansion_101-1500_QA_scores.json` | Per-word 10-criterion scores |
| `Oliver_Vocabulary_System/Vocabulary_Master.json` | Compiled runtime master after `pnpm oliver:expand` |

Batch 1 remains `data/Academic_Core_Batch_001_words_001-100.json`.
