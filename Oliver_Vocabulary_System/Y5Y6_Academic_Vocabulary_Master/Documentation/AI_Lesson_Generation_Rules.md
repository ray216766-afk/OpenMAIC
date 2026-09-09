# AI Lesson Generation Rules — Daily Academic Vocabulary Lessons

**Audience split:**
- **Oliver (student):** English-only materials — definitions, readings, questions, feedback.
- **Parent (Chinese-speaking):** Chinese glosses, progress notes, and coaching tips — **parent-only**, never mixed into Oliver’s worksheet face.

---

## 1. Daily Lesson Structure

Each daily lesson contains:

| Block | Count / Length | Rules |
|-------|----------------|-------|
| **New words** | Exactly **10** | Unused curriculum-order words from the current batch. Never re-issue a word that already has `first_seen` / was shown as New. Do **not** wrap the 100-word batch. If fewer than 10 unused remain, stop with a clear exhausted-batch message. |
| **Review words** | Exactly **15** | From prior days per `review_schedule` (Day 1, 3, 7, 14, 30) |
| **Mini reading** | **180–220 words** | Topic/story first. Weave only the **5–8** new/review words that fit naturally. Unused words are tested in Review, not forced into the passage. |
| **Comprehension** | **4–5 MCQs** | Written only after the passage is finished. Mix Vocab in Context, Main Idea, Inference, Detail/Evidence; optional Cause/Effect, Sequence, or Author's Purpose. |

Total focus words per day: 25 (10 new + 15 review). Do not overload with extra new lemmas.

---

## 2. New Words (×10)

1. Take the next **unused** lemmas in curriculum order (level, then id). Already-taught New words are Review-only.
2. Prefer **related themes** when possible (environment, argument, investigation) so the mini reading coheres.
3. Present for Oliver in English only:
   - word + POS
   - simple_definition
   - example_sentence
   - 1–2 collocations
   - optional: one “Basic → Improved” upgrade line
4. Parent sheet may include `chinese_meaning` and a one-line “why this word matters” tip in Chinese.

---

## 3. Review Words (×15)

1. Select strictly from spaced-repetition schedule:
   - Day 1 (same-day quick revisit after introduction)
   - Day 3, Day 7, Day 14, Day 30
2. Review tasks (rotate): synonym match, fill-the-blank with collocation, rewrite a basic sentence, odd-one-out, short oral “use it in a science/HASS sentence.”
3. If a word fails twice, flag for **extra review** without adding new lemmas that day.

---

## 4. Mini Reading (180–220 words)

**Priority order:** Natural language > Coherence > Unique answer quality > Learning value > Vocabulary coverage.  
Never sacrifice quality to force every target word into the passage.

**Required architecture (topic-first):**
1. Choose a topic / story / investigation / event / explanation / argument.
2. Build **one coherent passage** with one central idea. Every sentence must serve that idea.
3. Select only the vocabulary that fits naturally (about **one target every 20–35 words**; **5–8** words in a 180–220 word piece is enough).
4. Integrate those words so a reader would still accept the text if the targets were unmarked.
5. Generate reading questions **only after** the passage is finished.

**Forbidden architecture:** vocab list → one sentence per word → concatenate → call it a passage.  
Anti-pattern: mysterious drawer + drought sentence + compare poems + organise notes + photosynthesis dump.

**Must:**
- Read like a quality Y5–Y6 information or narrative-expository piece (Australian topics welcome).
- Keep surrounding language clear; new words are the stretch, not the whole texture.
- Stay **English-only** for the student version.
- Prefer Australian spelling and local references where natural (organisation, analyse, harbour, etc.).

**Must not:**
- Gloss new words in Chinese inside the student reading.
- Force 10/10 new-word coverage.
- Exceed 220 or fall under 180 words (count body text only).

**Remove-the-vocabulary test:** if bolded targets were unmarked, would it still feel like a real story/article? If no, rewrite.

**Optional parent appendix:** 2–3 Chinese bullet points on theme + which words to listen for at home.

---

## 5. Review questions and reading questions

### 5a. Vocab question-type suitability

Before generating a review item, decide whether the word is suitable for that type:

| Type | Use only when |
|------|----------------|
| **Meaning matching** | Clear age-appropriate definition; unambiguous; distinguishable distractors. |
| **Synonym** | A clear near-synonym exists (significant→important, scarce→limited). Do not force weak pairs. |
| **Antonym** | A clear opposite exists (scarce→abundant). **Never** antonym for *environment, perspective, evidence, method, process* and similar concept nouns. Pick another type. |
| **Sentence completion / cloze** | The stem tests meaning through context and has enough semantic clues. |

Do **not** use “none of these” because a word has no antonym or because distractors failed. Rare intentional use only; frequent use means the wrong question type was chosen.

**Unique-answer rule:** exactly one clearly correct option. Internally insert each option; check grammar, meaning, and whether a Y5–Y6 native speaker could defend it. If more than one could work, rewrite. Reject vague stems such as “After the debate, we _____.” where *evaluate* and *determine* are both possible — add context.

**Distractors:** grammatically plausible, semantically distinguishable, similar level, not absurd, not obviously unrelated. Avoid distractors that fail on grammar alone when the task is meaning.

**Teacher workbook test:** would a teacher put this in a Y5–Y6 workbook without editing? If no, regenerate.

### 5b. Reading questions (after the passage exists)

Mix **4–5** items, in roughly this difficulty order: literal Detail → Vocab in Context → Main Idea → Inference. Optional fifth: Cause/Effect, Sequence, or Author's Purpose.

Rules:
- Every answer must be supported by the **finished** passage.
- Exactly **4 options (A–D)**; one correct answer.
- Distractors plausible for Y5–Y6 (other coherent misreadings), not helicopters or talking magpies.
- No trick questions based on obscure senses.
- English-only for Oliver; Chinese rationales may appear on the parent key only.

## 5c. Internal QA gates

Before a lesson is returned to the API/UI, all three must pass (else regenerate):

1. **Vocab QA** — suitability, no default none-of-these, unique answers, contextual stems, distractor quality, teacher-workbook test.
2. **Reading passage QA** — topic-first, 180–220 words, 5–8 natural targets, no example-sentence dump, one central idea, remove-the-vocabulary test.
3. **Reading question QA** — required type mix; every answer grounded in the finished text.

Locked `Lesson_Day_XXX.json` snapshots stay as they were generated. New quality applies on a fresh generate or after **Reset this day**.

---

## 6. Language Policy (Strict)

| Material | Language |
|----------|----------|
| Student definitions, reading, MCQs, writing prompts | **English only** |
| Parent meanings, coaching tips, answer rationales (optional) | **Chinese allowed / preferred** |
| Word cards shown to Oliver | English; Chinese on reverse/parent pack only |

Never ask Oliver to translate into Chinese as part of the academic vocab lesson (native English pathway).

---

## 7. Writing Micro-Task (Optional Daily Add-on)

If time allows (2–4 minutes):
- One “Basic → Improved” rewrite using 1–2 of today’s new words, modelled on `creative_writing_example`.
- Or a 2-sentence opinion using at least two new words accurately.

---

## 8. Generation Checklist (AI / Teacher)

Before publishing a daily lesson:

- [ ] 10 new + 15 review confirmed from master DB IDs
- [ ] Mini reading 180–220 words; topic-first; only naturally fitting targets (about 5–8); unused words tested elsewhere
- [ ] 4–5 reading MCQs written from the finished passage, with clear single answers and strong distractors
- [ ] Review items pass suitability + unique-answer + no default “none of these”
- [ ] Student pack English-only
- [ ] Parent pack has Chinese meanings + brief coaching note
- [ ] Australian spelling throughout
- [ ] No duplicate New words ever (first_seen / presented-as-new never wrap back into New Vocabulary)
- [ ] Level mix appropriate (not 10× Level 3 in one day)

---

## 9. Source of Truth

All lemmas, definitions, examples, collocations, and review schedules come from the Master Database JSON/CSV.  
Do not invent alternate core definitions that contradict the database without updating the DB first.

