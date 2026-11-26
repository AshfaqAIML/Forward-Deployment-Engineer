#!/usr/bin/env python3
"""audit_lang_curr.py — Audits A, D, G.

A. Language: sentence length, long sentences, abbreviations at first use,
   glossary coverage of technical terms.
G. Beginner experience: terms a novice needs that are neither defined in the
   text ("X means/is …") nor in the glossary; per-lesson readability stats.
D. Curriculum: prerequisite DAG consistency, stage ordering, difficulty
   progression (minutes/position), objectives-vs-content keyword coverage,
   subject → FDE competency mapping.
"""
import json
import re
from collections import defaultdict

SEED = "/home/z/my-project/download/fde-academy-backend/seed/content.json"
R = []


def check(area, name, cond, detail=""):
    R.append((area, name, bool(cond), str(detail)[:200]))
    print(f"  {'✓' if cond else '△'} {area}/{name} {('— ' + str(detail)[:130]) if detail else ''}")


def sentences(text):
    text = re.sub(r"\s+", " ", text)
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z\"“0-9£])", text)
    return [p for p in parts if len(p.split()) >= 3]


def main():
    seed = json.load(open(SEED, encoding="utf-8"))
    glossary_terms = {g["term"].lower(): g for g in seed["glossary"]}
    # every glossary synonym/key too
    gloss_keys = set(glossary_terms) | {g["key"].replace("-", " ") for g in seed["glossary"]}

    # ---------- collect lesson prose ----------
    lesson_prose = {}
    for l in seed["lessons"]:
        chunks = []
        for b in l["content"]:
            if b["t"] == "p":
                chunks.append(b["x"])
            elif b["t"] == "exercise":
                chunks.append(b.get("prompt", ""))
                if b.get("solution"):
                    chunks.append(b["solution"])
            elif b["t"] == "callout":
                chunks.append(b.get("x", ""))
            elif b["t"] == "steps":
                for s in b.get("steps", []):
                    if s.get("note"):
                        chunks.append(s["note"])
        lesson_prose[l["code"]] = " ".join(chunks)

    all_prose = " ".join(lesson_prose.values())

    # ---------- A1: sentence lengths ----------
    sents = sentences(all_prose)
    lens = [len(s.split()) for s in sents]
    avg = sum(lens) / max(1, len(lens))
    long_s = [(lesson_prose.index(p) if False else None, s) for s in sents if len(s.split()) > 38]
    # locate long sentences
    long_loc = []
    for code, text in lesson_prose.items():
        for s in sentences(text):
            if len(s.split()) > 38:
                long_loc.append((code, len(s.split()), s[:90]))
    check("A", f"average sentence length {avg:.1f} words (target < 25)", avg < 25, f"{avg:.1f}")
    check("A", f"sentences over 38 words: {len(long_loc)}", len(long_loc) <= 6, f"{len(long_loc)} long sentences")
    for code, n, s in long_loc[:8]:
        print(f"      • {code} ({n}w): {s}…")

    # ---------- A2: abbreviations introduced? ----------
    ABBREVIATIONS = ["FDE", "API", "SDK", "CMS", "JSON", "HTTP", "DB", "UI", "AI", "SQL",
                     "ORM", "SaaS", "LMS", "CSV", "PDF", "DOCX"]
    full_forms = {
        "FDE": "forward deployed engineer", "API": "application programming interface",
        "SDK": "software development kit", "CMS": "content management",
        "JSON": "javascript object notation", "HTTP": "hypertext transfer protocol",
        "SQL": "structured query language", "AI": "artificial intelligence",
        "CSV": "comma-separated values", "PDF": "portable document format",
        "ORM": "object-relational mapping",
    }
    miss_abbr = []
    for ab in ABBREVIATIONS:
        used = re.search(rf"\b{ab}\b", all_prose)
        if not used:
            continue
        introduced = bool(re.search(rf"{ab}\s*\(|\b{re.escape(full_forms.get(ab, ''))}\b", all_prose, re.I))
        in_gloss = any(ab.lower() in t or full_forms.get(ab, "###") in json.dumps(g).lower() for t, g in glossary_terms.items())
        if not (introduced or in_gloss):
            miss_abbr.append(ab)
    check("A", "abbreviations all introduced or glossary-defined", not miss_abbr, f"unexplained: {miss_abbr}")

    # ---------- A3/G: technical terms a beginner needs ----------
    TECH = ["spreadsheet", "break-even", "contribution", "fixed cost", "variable cost",
            "unit price", "profit", "revenue", "dividend", "remainder", "denominator",
            "numerator", "equivalent", "expression", "factoris", "expand", "inequality",
            "truth table", "connective", "proof", "node", "edge", "graph", "path",
            "loop", "accumulator", "variable", "function", "argument", "boolean",
            "conditional", "pseudocode", "commit", "repository", "terminal",
            "prompt engineering", "embedding", "token", "context window", "dataset"]
    undefined = defaultdict(list)
    for term in TECH:
        pat = re.compile(rf"\b{re.escape(term)}", re.I)
        used_in = [code for code, text in lesson_prose.items() if pat.search(text)]
        if not used_in:
            continue
        defined_in_text = bool(re.search(rf"{re.escape(term)}[^.]*?\b(is|means|are)\b[^.]*", all_prose, re.I)
                               or re.search(rf"\(the {re.escape(term)}", all_prose, re.I)
                               or re.search(rf"{re.escape(term)}\s*[:—-]", all_prose, re.I)
                               or re.search(rf"\b{re.escape(term)}\b[^.]*?\b(called|the practice of|tells you|says)\b", all_prose, re.I))
        in_glossary = any(term.split()[0] in t for t in gloss_keys)
        if not (defined_in_text or in_glossary):
            undefined[term] = used_in
    check("G", "every technical term defined or glossary-covered",
          not undefined, f"gaps: {dict((k, v[:3]) for k, v in undefined.items())}")

    # ---------- G: lessons reference earlier concepts? forward references ----------
    # a beginner-red-flag: a lesson using a term defined only in a LATER lesson
    first_use, first_def = {}, {}
    for code, text in lesson_prose.items():
        for term in TECH:
            if re.search(rf"\b{re.escape(term)}", text, re.I) and term not in first_use:
                first_use[term] = code
            if re.search(rf"{re.escape(term)}[^.]*?\b(is|means)\b", text, re.I) and term not in first_def:
                first_def[term] = code
    forward = {t: (first_use[t], first_def.get(t)) for t in first_use
               if t in first_def and first_def[t] != first_use[t]}
    check("G", "no term used before its defining lesson", len(forward) == 0,
          f"forward refs: {forward}")

    # ---------- D: curriculum ----------
    stages = {s["number"]: s for s in seed["stages"]}
    courses = seed["courses"]
    prereqs = seed["coursePrereqs"]
    course_stage = {c["code"]: c.get("stageNumber", c.get("stage")) for c in courses}
    # lessons per course
    by_course = defaultdict(list)
    for l in seed["lessons"]:
        by_course[l["courseCode"]].append(l)
    for c in courses:
        code = c["code"]
        ls = by_course.get(code, [])
        # positions are per module/chapter: group by module then check order
        mods = defaultdict(list)
        for l in ls:
            mods[l.get("moduleTitle") or l.get("chapterTitle") or "module"].append(l.get("position", 0))
        ok_pos = all(v == sorted(v) for v in mods.values()) and len(ls) > 0
        check("D", f"course {code}: {len(ls)} lessons in module order", ok_pos,
              {k[:20]: v for k, v in list(mods.items())[:4]})

    # prerequisite DAG: prereq course must be an EARLIER stage
    bad_prereq = []
    for p in prereqs:
        pair = p if isinstance(p, list) else [p.get("courseCode"), p.get("prereqCourseCode") or p.get("prereqCode")]
        a, b = (pair + [None, None])[:2]
        if a and b and course_stage.get(a) and course_stage.get(b):
            if course_stage[b] > course_stage[a]:
                bad_prereq.append((a, b))
    check("D", f"all {len(prereqs)} prerequisites point to earlier stages", not bad_prereq, bad_prereq)

    # difficulty progression: minutes should not decrease sharply between stages
    stage_avg_min = {}
    for l in seed["lessons"]:
        stage = l.get("stageNumber")
        stage_avg_min.setdefault(stage, []).append(l.get("minutes", 0))
    avgs = {s: sum(v) / len(v) for s, v in sorted(stage_avg_min.items())}
    vals = list(avgs.values())
    monotonicish = all(b >= a - 8 for a, b in zip(vals, vals[1:]))
    check("D", f"lesson minutes rise or stay flat across stages {1}→{max(avgs)}", monotonicish,
          {s: round(v) for s, v in avgs.items()})

    # objectives vs content: objective keywords appear in the lesson content
    gaps = []
    for l in seed["lessons"]:
        text = json.dumps(l["content"]).lower()
        for o in l.get("objectives", []):
            kws = [w for w in re.findall(r"[a-z]{5,}", o.lower())
                   if w not in ("about", "using", "their", "which", "business", "before", "without", "questions", "answers", "confidence", "correctly", "recognise", "explain", "understand")]
            if kws and not any(k in text for k in kws):
                gaps.append(f"{l['code']}: '{o[:44]}'")
    check("D", f"objectives match taught content (34 lessons)", len(gaps) <= 3, gaps[:4])

    # subjects → FDE competency: every course belongs to a stage with a project
    proj_by_stage = defaultdict(int)
    for p in seed["projects"]:
        proj_by_stage[p.get("stageNumber")] += 1
    orphan = [c["code"] for c in courses if c.get("stageNumber") not in proj_by_stage and c["code"] != "start"]
    check("D", "every non-orientation course has stage projects", not orphan, orphan)

    fails = [r for r in R if not r[2]]
    print(f"\nLANGUAGE+CURRICULUM: {len(R) - len(fails)}/{len(R)} checks passed, {len(fails)} flagged")
    json.dump([{"area": a, "name": n, "pass": p, "detail": d} for a, n, p, d in R],
              open("/home/z/my-project/audit/findings_lang_curr.json", "w"), indent=1)
    return R


if __name__ == "__main__":
    main()
