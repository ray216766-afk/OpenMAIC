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
| `/lapland-year-5` | All 60 practice tests, each with Start, plus the level test |
| `/lapland-year-5/wrong-bank` | 错题题库 review |
| `GET /api/lapland-year-5/resources` | Resource index |
| `GET /api/lapland-year-5/test?id=` | One practice paper, without answer keys |
| `POST /api/lapland-year-5/quiz` | Submit a practice test |
| `GET/POST /api/lapland-year-5/placement` | Level test and weak-spot recommendations |
| `GET/POST /api/lapland-year-5/wrong-bank` | Read or bookmark the wrong-answer bank |
| `GET /api/lapland-year-5/progress` | Attempt counts |

## State

`Naplan_Y5_System/state/Progress.json` and `Wrong_Answer_Bank.json` are written on the machine that runs the app. The code adds attempts and wrong items. It does not delete or replace those files with an empty bank. They are gitignored so a pull does not wipe a local history.

Scoreable items use the capture suggestion stored in `data/question_bank.json`. That suggestion is not an official key. Items with no key can still be submitted and bookmarked into the 错题题库.
