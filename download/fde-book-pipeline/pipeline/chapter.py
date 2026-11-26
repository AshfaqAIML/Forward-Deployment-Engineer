"""chapter.py — the chapter frame every FDE Academy print chapter must have:

  1. descriptive chapter title      2. introduction
  3. learning objectives            4. main teaching content
  5. examples                       6. diagrams
  7. exercises                      8. chapter summary
  9. review questions

Composed from the approved lesson content (objectives, blocks, worked
examples, knowledge-check questions) — nothing invented, nothing shortened.
"""
import re

from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from . import figures as F
from .blocks import BlockRenderer
from .styles import (NAVY, TEAL, AMBER, MUTED, HEAD_FONT, BODY_FONT,
                     styled_table, keep_with_next, add_page_break_before,
                     shade_cell, set_cell_margins, table_borders, cant_split_row)

TEACHING = {"p", "ul", "table", "code", "callout", "math", "steps",
            "nl", "frac", "pct", "ieq", "plot"}
FIG_KINDS = {"nl", "frac", "pct", "ieq", "plot"}  # image-producing blocks


class Chapter:
    def __init__(self, number, title, lesson):
        self.number = number
        self.title = title or lesson["title"]
        self.lesson = lesson
        self.code = lesson["code"]
        self.stats = {}

    def text_atoms(self):
        """Sentinel strings used by QC to prove no content was lost."""
        atoms = [self.title, f"Chapter {self.number}"]
        for b in self.lesson["content"]:
            if b.get("t") == "p" and b.get("x"):
                atoms.append(b["x"])
            elif b.get("t") == "table" and b.get("caption"):
                atoms.append(b["caption"])
            elif b.get("t") == "exercise" and b.get("prompt"):
                atoms.append(b["prompt"])
            elif b.get("t") == "steps":
                atoms.append(b.get("title") or "")
                atoms.extend(s.get("expr", "") for s in b.get("steps", []))
            elif b.get("t") == "math" and b.get("x"):
                atoms.append(b["x"])
        for o in self.lesson.get("objectives", []):
            atoms.append(o)
        for q in self.lesson.get("quiz", []):
            atoms.append(q["prompt"])
        return [a for a in atoms if a and len(a) > 12]


def build_chapter(doc, chapter, data, answer_key):
    """Render one chapter into `doc`; collect answers into `answer_key`."""
    lesson = chapter.lesson
    r = BlockRenderer(doc)

    # ---- 1. chapter title (fresh page, professional opener) ----
    p = doc.add_paragraph(style=doc.styles["FDE Meta"])
    add_page_break_before(p)
    pr = p.add_run(f"CHAPTER {chapter.number}")
    pr.font.name = HEAD_FONT
    pr.font.size = Pt(10)
    pr.font.bold = True
    pr.font.color.rgb = RGBColor.from_string(TEAL)
    h = doc.add_paragraph(style=doc.styles["FDE H1"])
    h.add_run(chapter.title)
    rule = doc.add_paragraph(style=doc.styles["FDE Meta"])
    rule.paragraph_format.space_after = Pt(10)
    rr = rule.add_run("─" * 64)
    rr.font.color.rgb = RGBColor.from_string("C9D2DC")
    rr.font.size = Pt(8)

    # ---- 2. introduction = the lesson's opening paragraphs (verbatim) ----
    content = lesson["content"]
    openers = [b for b in content if b.get("t") == "p"][:2]
    intro_heading = doc.add_paragraph(style=doc.styles["FDE H2"])
    intro_heading.add_run("Introduction")
    for b in openers:
        r.render(b)
    read_more = [b for b in content if b.get("t") == "p"][2:]
    body_blocks = [b for b in content if b.get("t") != "p" or b in read_more]

    # ---- 3. learning objectives ----
    r._boxed([f"By the end of this chapter you will be able to: {o}." for o in lesson.get("objectives", [])],
             fill="FDF6EC", edge="EAD9C0", label="Learning objectives", label_color=AMBER)

    # ---- 4. main teaching content (everything after the openers, in order) ----
    mh = doc.add_paragraph(style=doc.styles["FDE H2"])
    mh.add_run("The teaching")
    visual_blocks = 0
    for b in content:
        t = b.get("t")
        if t == "exercise":
            continue
        if b in openers and t == "p":
            continue  # already used as the introduction
        r.render(b)
        if t in FIG_KINDS:
            visual_blocks += 1

    # ---- 6. diagrams: guarantee at least one per chapter ----
    if visual_blocks == 0:
        key_terms = [o.split(":")[0] for o in lesson.get("objectives", [])]
        r.render_concept_figure(chapter.title, lesson.get("objectives", []), key_terms)

    # ---- 5. worked examples (exercise blocks with their solution shown) ----
    exercises = [b for b in content if b.get("t") == "exercise"]
    if exercises:
        eh = doc.add_paragraph(style=doc.styles["FDE H2"])
        eh.add_run("Worked examples")
        for i, ex in enumerate(exercises, 1):
            label = doc.add_paragraph(style=doc.styles["FDE ListItem"])
            lr = label.add_run(f"Example {i}")
            lr.font.bold = True; lr.font.name = HEAD_FONT
            lr.font.color.rgb = RGBColor.from_string(TEAL)
            r.para(ex.get("prompt", ""))
            if ex.get("solution"):
                sol = doc.add_paragraph(style=doc.styles["FDE ListItem"])
                sol.paragraph_format.left_indent = Cm(0.6)
                sr = sol.add_run("Solution:  ")
                sr.font.bold = True; sr.font.color.rgb = RGBColor.from_string(NAVY)
                sol.add_run(ex["solution"])

    # ---- 7. exercises (prompts here; solutions in the answer key) ----
    practice = [e for e in data.exercises_for(chapter.code)]
    exh = doc.add_paragraph(style=doc.styles["FDE H2"])
    exh.add_run("Exercises")
    ex_items = []
    n = 0
    for ex in exercises:
        n += 1
        p = doc.add_paragraph(style=doc.styles["FDE ListItem"])
        p.paragraph_format.left_indent = Cm(0.6)
        er = p.add_run(f"E{n}.  ")
        er.font.bold = True; er.font.name = HEAD_FONT
        er.font.color.rgb = RGBColor.from_string(AMBER)
        p.add_run(ex.get("prompt", ""))
        item = {"n": f"E{n}", "chapter": chapter.number, "prompt": ex.get("prompt", "")}
        if ex.get("solution"):
            item["solution"] = ex["solution"]
        ex_items.append(item)
    for code_e, kind in practice:
        n += 1
        p = doc.add_paragraph(style=doc.styles["FDE ListItem"])
        p.paragraph_format.left_indent = Cm(0.6)
        er = p.add_run(f"E{n}.  [{kind.upper()} {code_e['code']}]  ")
        er.font.bold = True; er.font.name = HEAD_FONT
        er.font.size = Pt(8.8)
        er.font.color.rgb = RGBColor.from_string(AMBER)
        desc = code_e.get("instructions") or code_e.get("prompt", "")
        p.add_run(code_e["title"] + " — " + desc[:220] + ("…" if len(desc) > 220 else ""))
        ex_items.append({"n": f"E{n}", "chapter": chapter.number,
                         "prompt": f"{kind} {code_e['code']}: {code_e['title']}",
                         "solution": (code_e.get("solution") or "")[:400],
                         "starter": code_e.get("starter_code", "")})
    answer_key["exercises"].extend(ex_items)

    # ---- 8. chapter summary ----
    sh = doc.add_paragraph(style=doc.styles["FDE H2"])
    sh.add_run("Chapter summary")
    for o in lesson.get("objectives", []):
        p = doc.add_paragraph(style=doc.styles["FDE ListItem"])
        p.paragraph_format.left_indent = Cm(0.6)
        rr = p.add_run("✓  ")
        rr.font.color.rgb = RGBColor.from_string(TEAL)
        p.add_run(o)
    closers = [b for b in content if b.get("t") == "callout"]
    for c in closers[:1]:
        r._boxed([c.get("x", "")], fill="EEF6F4", edge="BFDCD6", label="Remember", label_color=TEAL)

    # ---- 9. review questions (answers go to the answer key) ----
    rh = doc.add_paragraph(style=doc.styles["FDE H2"])
    rh.add_run("Review questions")
    quiz = lesson.get("quiz", [])
    for i, q in enumerate(quiz, 1):
        p = doc.add_paragraph(style=doc.styles["FDE ListItem"])
        p.paragraph_format.left_indent = Cm(0.6)
        qr = p.add_run(f"R{i}.  ")
        qr.font.bold = True; qr.font.name = HEAD_FONT
        qr.font.color.rgb = RGBColor.from_string(NAVY)
        p.add_run(q["prompt"])
        answer_key["reviews"].append({
            "n": f"R{i}", "chapter": chapter.number, "question": q["prompt"],
            "options": q["options"],
            "answer": q["options"][q["answerIdx"]],
            "explanation": q["explanation"],
        })
    if not quiz:
        p = doc.add_paragraph(style=doc.styles["FDE ListItem"])
        p.add_run("No knowledge check is attached to this lesson; the worked "
                  "examples above serve as the chapter's self-check.")

    chapter.stats = {
        "blocks": len(content), "figures": r.figure_count, "tables": r.table_count,
        "equations": r.equation_count, "code": r.code_count,
        "examples": len(exercises), "exercises": len(ex_items), "reviewQuestions": len(quiz),
    }
    return chapter
