"""Assign unique VAC0101–VAC1500 lemmas with the required level mix."""

from __future__ import annotations

try:
    from .batch1_exclude import FORBIDDEN
    from .catalog_extra import L1_EXTRA, L2_EXTRA, L3_EXTRA
    from .catalog_l1 import L1_ROWS
    from .catalog_l2 import L2_ROWS
    from .catalog_l3 import L3_ROWS
except ImportError:
    from batch1_exclude import FORBIDDEN
    from catalog_extra import L1_EXTRA, L2_EXTRA, L3_EXTRA
    from catalog_l1 import L1_ROWS
    from catalog_l2 import L2_ROWS
    from catalog_l3 import L3_ROWS

TARGET = {"1": 840, "2": 420, "3": 140}

# Too rare / single-niche / GRE-ish for Y5–Y6 high achievers.
RARE_REJECT = {
    "abrogate",
    "adumbrate",
    "arrogate",
    "cognisance",
    "didacticism",
    "encomium",
    "exegesis",
    "exigency",
    "expiate",
    "gainsay",
    "garrulity",
    "ineluctable",
    "inveigh",
    "inveigle",
    "lugubrious",
    "perquisite",
    "repine",
    "traduce",
    "vitiate",
    "wherewithal",
    "adumbrate",
    "emasculate",
}

# Everyday or too-basic leftover lemmas.
BASIC_REJECT = {
    "easy",
    "enough",
    "extra",
    "deep",
    "early",
    "empty",
    "false",
    "famous",
    "fantastic",
    "fresh",
    "friendly",
    "further",
    "future",
    "following",
    "cover",
    "continue",
    "double",
    "dine",
    "dislike",
    "useful",
    "surely",
    "nearly",
    "quietly",
    "truly",
    "daily",
    "weekly",
    "monthly",
    "basic",
    "clear",
    "common",
    "different",
    "strong",
    "simple",
    "usual",
    "everyday",
    "so-called",
    "second-hand",
    "try",
    "use",
    "learn",
    "understand",
    "wait",
    "share",
    "village",
    "title",
    "grade",
    "heading",
    "textbook",
    "workshop",
}


def _clean(rows: list[tuple[str, str, str]]) -> list[tuple[str, str, str]]:
    seen: set[str] = set()
    out: list[tuple[str, str, str]] = []
    for word, pos, theme in rows:
        key = word.strip().lower()
        if not key or key in seen:
            continue
        if key in FORBIDDEN or key in RARE_REJECT or key in BASIC_REJECT:
            continue
        if " " in key:
            continue
        seen.add(key)
        out.append((key, pos, theme))
    return out


def assign_lemmas() -> list[tuple[str, str, str, str]]:
    """Return (word, level, pos, theme) for exactly 1400 new lemmas."""
    pools = {
        "1": _clean(L1_ROWS) + _clean(L1_EXTRA),
        "2": _clean(L2_ROWS) + _clean(L2_EXTRA),
        "3": _clean(L3_ROWS) + _clean(L3_EXTRA),
    }
    used: set[str] = set()
    assigned: list[tuple[str, str, str, str]] = []
    # Prefer keeping a word at the lowest intended level if it appears in several pools.
    for level in ("1", "2", "3"):
        need = TARGET[level]
        got = 0
        for word, pos, theme in pools[level]:
            if word in used:
                continue
            assigned.append((word, level, pos, theme))
            used.add(word)
            got += 1
            if got >= need:
                break
        if got < need:
            raise SystemExit(
                f"Level {level} short: have {got}, need {need}. Add more unique lemmas."
            )
    if len(assigned) != 1400:
        raise SystemExit(f"Expected 1400 lemmas, got {len(assigned)}")
    return assigned


if __name__ == "__main__":
    rows = assign_lemmas()
    from collections import Counter

    print("assigned", len(rows))
    print("levels", Counter(r[1] for r in rows))
    print("pos", Counter(r[2] for r in rows))
    print("theme", Counter(r[3] for r in rows))
    print("first10", rows[:10])
    print("last5", rows[-5:])
