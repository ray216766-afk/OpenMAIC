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
| **Mini reading** | **180–250 words** | Must weave **all 10 new words** naturally |
| **Comprehension** | **5 MCQs** | Mix meaning, inference, collocation, and usage |

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

## 4. Mini Reading (180–250 words)

**Must:**
- Include **all 10 new words** in natural context (no forced stuffing).
- Read like a quality Y5–Y6 information or narrative-expository piece (Australian topics welcome: environment, school inquiry, community, sport science, history).
- Keep vocabulary load manageable: new words are the stretch; surrounding language stays clear.
- Stay **English-only** for the student version.
- Prefer Australian spelling and local references where natural (organisation, analyse, harbour, etc.).

**Must not:**
- Gloss new words in Chinese inside the student reading.
- Use the words as a disconnected word list in sentences that don’t form a coherent text.
- Exceed 250 or fall under 180 words (count body text only).

**Optional parent appendix:** 2–3 Chinese bullet points on theme + which words to listen for at home.

---

## 5. Multiple-Choice Questions (×5)

Design five questions that together cover:

1. **Literal meaning** — which definition fits the word in context  
2. **Contextual inference** — what the author implies using Word X  
3. **Collocation / usage** — which phrase is natural  
4. **Synonym / precision** — best upgrade or closest synonym in context  
5. **Transfer** — which sentence uses the word correctly (or identify misuse)

Rules:
- Exactly **4 options (A–D)** each; one correct answer.
- Distractors plausible for Y5–Y6 (common confusions, near-synonyms).
- No trick questions based on obscure senses.
- Answer key for parent/teacher; student sheet may hide answers until review.
- English-only for Oliver; Chinese explanations of *why* an answer is correct may appear on the parent key only.

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
- [ ] Mini reading 180–250 words; all 10 new words present and natural
- [ ] 5 MCQs with clear single answers and strong distractors
- [ ] Student pack English-only
- [ ] Parent pack has Chinese meanings + brief coaching note
- [ ] Australian spelling throughout
- [ ] No duplicate New words ever (first_seen / presented-as-new never wrap back into New Vocabulary)
- [ ] Level mix appropriate (not 10× Level 3 in one day)

---

## 9. Source of Truth

All lemmas, definitions, examples, collocations, and review schedules come from the Master Database JSON/CSV.  
Do not invent alternate core definitions that contradict the database without updating the DB first.

