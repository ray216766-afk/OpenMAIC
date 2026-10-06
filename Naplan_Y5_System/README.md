# OpenMRC Year 5 NAPLAN practice

Practice for Oliver runs in this OpenMAIC app. Excel Test Zone is not contacted.

## Port

Use **4017**. Do not use Vocabulary Master’s port 2007 or Codex’s port 3007.

```bash
pnpm exec next dev --hostname 127.0.0.1 --port 4017
```

- Practice list and level test: http://127.0.0.1:4017/lapland-year-5
- Wrong-answer bank: http://127.0.0.1:4017/lapland-year-5/wrong-bank

## Routes

| Path | Purpose |
| --- | --- |
| `/lapland-year-5` | All 60 practice entries (title, topic, count, level) and Start Placement Test |
| `/lapland-year-5/wrong-bank` | 错题题库 review |
| `GET /api/lapland-year-5/resources` | Resource index |
| `GET /api/lapland-year-5/test?id=` | One practice paper from `data/captures/{id}.json`, without answer keys |
| `POST /api/lapland-year-5/quiz` | Submit a practice test |
| `GET/POST /api/lapland-year-5/placement` | 26-question level test, one item at a time, then weak-strand practice links |
| `GET/POST /api/lapland-year-5/wrong-bank` | Read or bookmark the wrong-answer bank |
| `GET /api/lapland-year-5/progress` | Attempt counts |

## State

`Naplan_Y5_System/state/Progress.json` and `Wrong_Answer_Bank.json` are written on the machine that runs the app. The code adds attempts and wrong items. It does not delete or replace those files with an empty bank. They are gitignored so a pull does not wipe a local history.

Scoreable practice items use the capture suggestion stored in `data/question_bank.json`. That suggestion is not an official key. Items with no key can still be submitted and bookmarked into the 错题题库.

The placement paper is `question-bank/Lapland-Year-5/data/placement-test-v1.json`. `correct_answer` is null in that file. The grader scores a question only after that field is filled, or after a teacher mark on the results screen. It does not invent Excel Test Zone answers. A strand under 60% (or an answered strand that still has no key) recommends up to three practice tests in the same topic, at that level or below.
