#!/usr/bin/env python3
"""Build the Year 5 practice bank from question-bank Word captures.

Capture selections are not official keys. Unmappable or "not captured" answers
stay null so the app does not pretend to score them.
"""

from __future__ import annotations

import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
BANK_DIR = ROOT / "question-bank" / "Lapland-Year-5"
OUT = Path(__file__).resolve().parents[1] / "data" / "question_bank.json"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

PASSAGE_TITLES = {
    "Year 5 Reading Test 01": "Land clearing",
    "Year 5 Reading Test 02": "The Miners Rest",
    "Year 5 Reading Test 04": "Shocking discovery",
    "Year 5 Reading Test 05": "Words can be fun",
    "Year 5 Reading Test 06": "Pappadams",
    "Year 5 Reading Test 07": "Add a bit more",
    "Year 5 Reading Test 08": "This educational game feels more like therapy than fun.",
    "Year 5 Reading Test 09": "Battlers of the Great Depression",
    "Year 5 Reading Test 10": "Treasure Island",
    "Year 5 Reading Test 11": "The secret of Yesterday Hills",
}
IMAGE_HEAVY_READING = {"Year 5 Reading Test 03", "Year 5 Reading Test 09"}


def paragraphs(path: Path) -> list[str]:
    root = ET.fromstring(zipfile.ZipFile(path).read("word/document.xml"))
    lines: list[str] = []
    for paragraph in root.iter(f"{W}p"):
        bits: list[str] = []
        for node in paragraph.iter(f"{W}t"):
            if node.text:
                bits.append(node.text)
        line = "".join(bits).strip()
        if line:
            lines.append(line)
    return lines


def norm(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower())


def resource_id(title: str) -> str:
    number = re.search(r"(\d+)\s*$", title)
    suffix = number.group(1) if number else "00"
    if "Grammar" in title:
        return f"y5-gp-{suffix}"
    if "Spelling" in title:
        return f"y5-spelling-{suffix}"
    if "Measurement" in title:
        return f"y5-measurement-{suffix}"
    if "Number" in title:
        return f"y5-number-{suffix}"
    if "Statistics" in title:
        return f"y5-statistics-{suffix}"
    if "Reading" in title:
        return f"y5-reading-{suffix}"
    return f"y5-{norm(title)[:24]}"


def domain_for(subject: str) -> str:
    if subject == "Reading":
        return "Reading"
    if subject == "Numeracy":
        return "Numeracy"
    return "Language Conventions"


def strand_for(title: str, subject: str) -> str:
    if "Grammar" in title:
        return "Grammar & Punctuation"
    if "Spelling" in title:
        return "Spelling"
    if "Measurement" in title:
        return "Measurement & Geometry"
    if "Number" in title:
        return "Number & Algebra"
    if "Statistics" in title:
        return "Statistics & Probability"
    return subject


def parse_key(raw: str) -> tuple[str | None, str]:
    text = raw.strip()
    if "not captured" in text.lower():
        return None, "missing"
    match = re.match(r"^(.*?)\s+\((.*)\)\s*$", text)
    value = match.group(1).strip() if match else text
    if not value or "not captured" in value.lower():
        return None, "missing"
    return value, "capture_suggestion"


def map_key(value: str, options: list[dict[str, str]], choose_many: bool) -> list[str] | None:
    if not value:
        return None
    by_letter = {item["letter"]: item["text"] for item in options}

    def one(part: str) -> str | None:
        part = part.strip().rstrip(".")
        if re.fullmatch(r"[A-H]", part):
            return by_letter.get(part)
        folded = norm(part)
        for item in options:
            if norm(item["text"]) == folded:
                return item["text"]
        return None

    if not options:
        if len(value) <= 40 and "→" not in value and ";" not in value:
            return [value.strip()]
        return None

    parts = [part.strip() for part in re.split(r",\s*", value) if part.strip()]
    if choose_many or len(parts) > 1:
        mapped = [one(part) for part in parts]
        if mapped and all(mapped):
            return mapped  # type: ignore[return-value]
    single = one(value)
    if single:
        return [single]
    return None


def parse_docx(path: Path) -> tuple[dict, list[dict]]:
    lines = paragraphs(path)
    title = lines[0]
    level = "Standard"
    minutes = 0
    for line in lines[:6]:
        level_match = re.search(r"Level:\s*([A-Za-z]+)", line)
        if level_match:
            level = level_match.group(1)
        time_match = re.search(r"Time:\s*(\d+)", line)
        if time_match:
            minutes = int(time_match.group(1))

    subject = "Conventions of Language"
    relative = path.relative_to(BANK_DIR).as_posix()
    if relative.startswith("Numeracy/"):
        subject = "Numeracy"
    elif relative.startswith("Reading/"):
        subject = "Reading"
    if subject == "Numeracy":
        title = re.sub(r"\s+Test\s+(\d+)$", r" \1", title)
    strand = strand_for(title, subject)
    domain = domain_for(subject)
    rid = resource_id(title)

    answer_at = next(
        (i for i, line in enumerate(lines) if re.match(r"^Answers\s*\(", line)),
        len(lines),
    )
    body = lines[:answer_at]
    keys: dict[int, str] = {}
    for line in lines[answer_at:]:
        match = re.match(r"^Q(\d+):\s*(.*)$", line)
        if match:
            keys[int(match.group(1))] = match.group(2)

    passage_lines: list[str] = []
    if "Reading passage" in body:
        start = body.index("Reading passage") + 1
        end = body.index("Exercises") if "Exercises" in body else start
        passage_lines = body[start:end]

    questions: list[dict] = []
    indexes = [i for i, line in enumerate(body) if re.match(r"^Question\s+\d+", line)]
    for offset, start in enumerate(indexes):
        end = indexes[offset + 1] if offset + 1 < len(indexes) else len(body)
        block = body[start:end]
        number_match = re.match(r"^Question\s+(\d+)", block[0])
        number = int(number_match.group(1)) if number_match else offset + 1
        prompt_bits: list[str] = []
        options: list[dict[str, str]] = []
        note = ""
        for line in block[1:]:
            option = re.match(r"^([A-H])\.\s*(.*)$", line)
            if option:
                options.append({"letter": option.group(1), "text": option.group(2).strip()})
                continue
            if line.startswith("Note:"):
                note = line.split(":", 1)[1].strip()
                continue
            if line in {"(free-text answer)", "Exercises"}:
                continue
            prompt_bits.append(line)
        prompt = " ".join(prompt_bits).strip() or block[0]
        choose_many = bool(re.search(r"choose two|choose \d|which sentences", prompt, re.I))
        raw_key = keys.get(number)
        parsed, status = parse_key(raw_key) if raw_key else (None, "missing")
        mapped = map_key(parsed, options, choose_many) if parsed else None
        if mapped is None:
            status = "missing"
            correct: str | list[str] | None = None
            kind = "text" if not options else ("multi" if choose_many else "single")
        else:
            correct = mapped if len(mapped) > 1 else mapped[0]
            kind = "text" if not options else ("multi" if len(mapped) > 1 or choose_many else "single")
            if kind == "multi" and isinstance(correct, str):
                correct = [correct]
        image_heavy = "image" in note.lower() or "not available as text" in prompt.lower()
        skill = note or strand
        questions.append(
            {
                "id": f"{rid}-q{number:02d}",
                "resource_id": rid,
                "number": number,
                "domain": domain,
                "strand": strand,
                "skill_tag": skill,
                "difficulty": level,
                "prompt": prompt,
                "options": [item["text"] for item in options],
                "response_kind": kind,
                "correct_answer": correct,
                "key_status": status if correct is not None else "missing",
                "image_heavy": image_heavy,
            }
        )

    skill_tags = []
    for question in questions:
        if question["skill_tag"] not in skill_tags:
            skill_tags.append(question["skill_tag"])
    resource = {
        "id": rid,
        "domain": domain,
        "title": title,
        "source": "Excel Test Zone NAPLAN-style Practice capture",
        "path": relative,
        "year_level": 5,
        "level": level,
        "strand": strand,
        "skill_tags": skill_tags[:8],
        "question_count": len(questions),
        "minutes": minutes,
        "passage_title": PASSAGE_TITLES.get(title),
        "passage": "\n".join(passage_lines).strip() or None,
        "image_heavy": title in IMAGE_HEAVY_READING
        or any(question["image_heavy"] for question in questions),
    }
    return resource, questions


def main() -> None:
    resources = []
    questions = []
    for path in sorted(BANK_DIR.rglob("*.docx")):
        resource, items = parse_docx(path)
        resources.append(resource)
        questions.extend(items)
    order = {"Language Conventions": 0, "Numeracy": 1, "Reading": 2}
    level_order = {"Standard": 0, "Intermediate": 1, "Advanced": 2}
    resources.sort(key=lambda item: (order.get(item["domain"], 9), level_order.get(item["level"], 9), item["id"]))
    payload = {
        "version": 1,
        "note": "Capture suggestions are not official NAPLAN keys. Missing keys stay null.",
        "resources": resources,
        "questions": questions,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    keyed = sum(1 for question in questions if question["correct_answer"] is not None)
    print(f"resources {len(resources)} questions {len(questions)} keyed {keyed}")
    for resource in resources:
        owned = [question for question in questions if question["resource_id"] == resource["id"]]
        print(
            f"{resource['id']:22} {resource['question_count']:3} "
            f"keyed {sum(1 for question in owned if question['correct_answer'] is not None):3} "
            f"{resource['title']}"
        )


if __name__ == "__main__":
    main()
