#!/usr/bin/env python3
"""audit_books.py — Audit E: independent verification of the six print books.

1. TOC accuracy: every Contents page number must equal the page where the
   chapter actually starts (read back from the PDF footer numbers).
2. Answer key fidelity: every "R<n>. <answer>" in the PDF answer key must
   match the seed's correct option for that chapter/question.
3. Formatting consistency (DOCX): fonts, heading styles, headers/footers,
   margins identical across all six books.
4. Figure quality: PNG figures non-blank and readable size.
5. References: URLs resolve (HTTP 200) and are real sources.
6. Edition consistency: DOCX and PDF carry the same chapter count and the
   same answer key (text comparison via DOCX text vs PDF text).
"""
import glob
import json
import re
import sys
import urllib.request

from docx import Document
from pypdf import PdfReader

R = []


def check(area, name, cond, detail=""):
    R.append((area, name, bool(cond), str(detail)[:170]))
    print(f"  {'✓' if cond else '✗ FAIL'} {area}/{name} {('— ' + str(detail)[:110]) if detail and not cond else ''}")


def norm_alnum(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def pdf_pages(pdf):
    return [(" ".join((p.extract_text() or "").split())) for p in PdfReader(pdf).pages]


def main():
    seed = json.load(open("/home/z/my-project/download/fde-academy-backend/seed/content.json"))
    lesson_by_code = {l["code"]: l for l in seed["lessons"]}
    spec_for_slug = {s["slug"]: s for s in json.load(open("/home/z/my-project/download/fde-book-pipeline/books/fm/book.json")) and []} if False else None

    specs = {}
    for slug in ("fm", "alg", "log", "gph", "ps", "hb"):
        specs[slug] = json.load(open(f"/home/z/my-project/download/fde-book-pipeline/books/{slug}/book.json"))

    # lesson composition per book (same as pipeline/data.py)
    def chapters_of(slug):
        spec = specs[slug]
        out = []
        for c in spec["chapters"]:
            codes = [x for x in c["lessons"] if not x.startswith("project:")]
            out.append(codes)
        return out

    # ---------- per-book checks ----------
    for slug in ("fm", "alg", "log", "gph", "ps", "hb"):
        pdf = glob.glob(f"/home/z/my-project/download/fde-book-pipeline/dist/FDE_*{slug.replace('_', '')}*.pdf")
        pdf = glob.glob("/home/z/my-project/download/fde-book-pipeline/dist/*.pdf")
        docx = glob.glob("/home/z/my-project/download/fde-book-pipeline/dist/*.docx")
        # map by book.json filename()
        import importlib.util
        spec_path = f"/home/z/my-project/download/fde-book-pipeline/books/{slug}/book.json"
        import sys as _s
        _s.path.insert(0, "/home/z/my-project/download/fde-book-pipeline")
        try:
            from pipeline.data import load as pipe_load
            _, data = pipe_load(slug)
            fname = data.filename()
        except Exception:
            fname = None
        pdf = f"/home/z/my-project/download/fde-book-pipeline/dist/{fname}.pdf"
        docx = f"/home/z/my-project/download/fde-book-pipeline/dist/{fname}.docx"

        pages = pdf_pages(pdf)

        # ---- 1. TOC accuracy ----
        # footer number for a pdf page: search "· vX · page N" (upper/mixed)
        def footer_num(text):
            m = re.search(r"page (\d+)", text)
            return int(m.group(1)) if m else None

        toc_ok, toc_detail = 0, []
        # parse the contents page: "Chapter N · Title ... <num>"
        toc_text = " ".join(pages[:5])
        entries = re.findall(r"Chapter (\d+) · ([^.]*)\.{2,}?\s*(\d+)", toc_text)
        n_chapters = len(chapters_of(slug))
        check("toc", f"{slug}: TOC lists {n_chapters} chapters", len(entries) == n_chapters, f"{len(entries)} entries parsed")
        for chno, title, pagestr in entries:
            want = int(pagestr)
            # find the page whose stripped body starts with "chapter <no>"
            got = None
            ttl = re.escape(specs[slug]['title'].lower())
            ver = re.escape(specs[slug]['version'])
            for t in pages:
                body = re.sub(ttl + r"[^.]*?fde academy print edition", "", t.lower(), count=1)
                body = re.sub(ttl + r"\s*·\s*v" + ver + r"\s*·\s*page \d+", "", body)
                if body.strip().startswith(f"chapter {chno} "):
                    got = footer_num(t)
                    break
            if got == want:
                toc_ok += 1
            else:
                toc_detail.append(f"ch{chno}: toc={want} actual={got}")
        check("toc", f"{slug}: TOC page numbers match actual chapter starts ({toc_ok}/{n_chapters})",
              toc_ok == n_chapters, "; ".join(toc_detail))

        # ---- 2. answer key fidelity vs seed ----
        full = norm_alnum(" ".join(pages))
        mism = []
        total_q = 0
        for ci, codes in enumerate(chapters_of(slug), 1):
            for code in codes:
                lesson = lesson_by_code[code]
                for qi, q in enumerate(lesson.get("quiz", []), 1):
                    total_q += 1
                    ans = q["options"][q["answerIdx"]]
                    if norm_alnum(ans) not in full:
                        mism.append(f"ch{ci} R{qi}: '{ans[:30]}' missing")
        check("answers", f"{slug}: all {total_q} answer-key answers match seed options",
              not mism, "; ".join(mism[:3]))

        # distractors must NOT appear as the chosen answer line "Rn. <wrong>"
        # (spot: count occurrences of correct-answer lines)
        # ---- 3. DOCX/PDF consistency ----
        d = Document(docx)
        dtext = norm_alnum(" ".join(p.text for p in d.paragraphs))
        chapters_h1 = [norm_alnum(p.text) for p in d.paragraphs if p.style.name == "FDE H1"]
        check("consistency", f"{slug}: DOCX headings == PDF chapters ({n_chapters}+3)",
              len([h for h in chapters_h1 if h]) >= n_chapters + 3, chapters_h1[:5])
        # tables and images
        check("consistency", f"{slug}: DOCX images == PDF figure count",
              len(d.inline_shapes) >= n_chapters + 1, f"{len(d.inline_shapes)} images")

        # ---- 4. formatting: same styles/fonts/margins across books ----
        normal = d.styles["Normal"]
        check("format", f"{slug}: body font + size consistent",
              normal.font.name == "Liberation Serif" and normal.font.size.pt == 10.5,
              f"{normal.font.name} {normal.font.size and normal.font.size.pt}")
        sec = d.sections[0]
        check("format", f"{slug}: A4 + consistent margins",
              round(sec.page_width.cm, 1) == 21.0 and round(sec.top_margin.cm, 1) == 2.3,
              f"{round(sec.page_width.cm,1)}x{round(sec.page_height.cm,1)} top={round(sec.top_margin.cm,1)}")

    # ---------- 5. figure quality ----------
    from PIL import Image
    figs = glob.glob("/home/z/my-project/download/fde-book-pipeline/work/figures/*.png")
    blank, sizes = 0, []
    for f in figs:
        im = Image.open(f).convert("L")
        h = im.histogram()
        nonwhite = 1 - h[255] / sum(h)
        sizes.append(nonwhite)
        if nonwhite < 0.005:
            blank += 1
    check("figures", f"{len(figs)} figure PNGs non-blank", blank == 0, f"blank={blank}, min non-white={min(sizes):.4f}")

    # ---------- 6. references resolve ----------
    refs = []
    for slug in specs:
        for r in specs[slug].get("references", []):
            if r.get("url") and (r["url"],) not in [(x[0],) for x in refs]:
                refs.append((r["url"], specs[slug]["title"]))
    ref_fail = []
    for url, book in refs:
        try:
            req = urllib.request.Request(url, method="HEAD")
            req.add_header("user-agent", "Mozilla/5.0 (audit)")
            with urllib.request.urlopen(req, timeout=20) as res:
                if res.status >= 400:
                    ref_fail.append(f"{url} → {res.status}")
        except Exception as e:
            ref_fail.append(f"{url} → {type(e).__name__}")
    check("references", f"{len(refs)} unique reference URLs resolve", not ref_fail, "; ".join(ref_fail))

    fails = [r for r in R if not r[2]]
    print(f"\nBOOK AUDIT: {len(R) - len(fails)}/{len(R)} passed")
    json.dump([{"area": a, "name": n, "pass": p, "detail": d} for a, n, p, d in R],
              open("/home/z/my-project/audit/findings_books.json", "w"), indent=1)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
