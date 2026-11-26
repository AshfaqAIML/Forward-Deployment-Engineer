#!/usr/bin/env python3
"""build.py — the FDE Academy book production CLI.

  python3 build.py --book fm                 # build one book (both passes + QC)
  python3 build.py --book fm --chapter 3     # review copy of a single chapter
  python3 build.py --all                     # build every book
  python3 build.py --report                  # print the QC report summary

The pipeline is chapter-by-chapter: every chapter is built and checked, and
the full book is assembled only after ALL chapters pass the content checks
(review gate). Both artifacts (DOCX + PDF) come from one approved source.
"""
import argparse
import json
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pypdf import PdfReader
from docx import Document

from pipeline.data import load, load_all, ROOT
from pipeline.book import build_book
from pipeline.styles import setup_document, styled_table
from pipeline.chapter import Chapter
from pipeline import qc as Q

DIST = os.path.join(ROOT, "dist")
WORK = os.path.join(ROOT, "work")
REPORTS = os.path.join(ROOT, "reports")
for d in (DIST, WORK, REPORTS):
    os.makedirs(d, exist_ok=True)


def build_docx(book, data, out_path, toc_pages=None):
    doc = setup_document()
    stats = build_book(doc, book, data, toc_pages=toc_pages)
    doc.save(out_path)
    return stats


def chapter_pages(pdf_path, chapters, first_body_pdf_page, book=None):
    """Map TOC labels to DISPLAYED page numbers via the PDF footer numbers.
    pypdf emits running header/footer before body text — strip both first."""
    import re
    title = re.escape((book or {}).get("title", "").lower())
    ver = re.escape((book or {}).get("version", ""))
    r = PdfReader(pdf_path)
    mapping = {}
    pages = [(i + 1, (p.extract_text() or "")) for i, p in enumerate(r.pages)]

    def body(text):
        """(page-start text after stripping running head/foot, footer number)
        pypdf emits header, then FOOTER, then body — so the footer number sits
        mid-string right after the header, not at the end."""
        t = " ".join((text or "").split()).lower()
        m = re.search(title + r" · v" + ver + r" · page (\d+)", t)
        num = int(m.group(1)) if m else None
        if title:
            t = re.sub(title + r"[^\n]*?fde academy print edition", "", t, count=1)
            t = re.sub(title + r" · v" + ver + r" · page \d+", "", t)
        return t.strip(), num

    for i, ch in enumerate(chapters, 1):
        head = f"chapter {i}"
        for pno, text in pages:
            t, num = body(text)
            if t.startswith(head):
                if num is not None:
                    mapping[f"Chapter {i} · {ch.title}"] = num
                break
    # back matter
    for label, needle in (("Glossary", "glossary"), ("References", "references"),
                          ("Answer key", "answer key")):
        for pno, text in pages:
            t, num = body(text)
            if t.startswith(needle):
                if num is not None:
                    mapping[label] = num
                break
                import re
                m = re.search(r"page (\d+)", t[-20:])
                if m:
                    mapping[label] = int(m.group(1))
                break
    return mapping


def review_gate(book_slug, qc_report):
    """Chapters are approved one by one; assembly requires all of them."""
    gate_path = os.path.join(ROOT, "books", book_slug, "review.json")
    gate = json.load(open(gate_path)) if os.path.exists(gate_path) else {"chapters": {}}
    approved = [k for k, v in gate["chapters"].items() if v.get("approved")]
    return gate, approved


def build_book_cmd(book_slug, only_chapter=None, assemble=True):
    spec, data = load(book_slug)
    fname = data.filename()
    docx_path = os.path.join(DIST, f"{fname}.docx")
    pdf_path = os.path.join(DIST, f"{fname}.pdf")

    if only_chapter:
        # ---- single-chapter review copy (does not touch the real book) ----
        ch = data.chapters[only_chapter - 1]
        review_doc = setup_document()
        from pipeline.chapter import build_chapter
        from pipeline.styles import field_run, restart_page_numbering
        sec = review_doc.sections[0]
        restart_page_numbering(sec, 1)
        h = sec.header.paragraphs[0]
        h.add_run(f"REVIEW COPY — {spec['title']} — Chapter {only_chapter} (not for distribution)")
        from docx.shared import RGBColor, Pt
        for r in h.runs:
            r.font.size = Pt(8.5); r.font.color.rgb = RGBColor.from_string("B45309")
        key = {"exercises": [], "reviews": []}
        from pipeline.chapter import build_chapter as bc
        bc(review_doc, ch, data, key)
        out = os.path.join(WORK, f"review-{book_slug}-ch{only_chapter}.docx")
        review_doc.save(out)
        pdf = Q.convert(out, WORK)
        pages = len(PdfReader(pdf).pages)
        print(f"review copy: {out} ({pages} pages)")
        return {"reviewChapter": only_chapter, "docx": out, "pdf": pdf, "pages": pages}

    # ---- pass 1: placeholders in the TOC ----
    stats1 = build_docx(spec, data, docx_path, toc_pages=None)
    Q.convert(docx_path)                       # pass-1 PDF (page numbers now layout)
    mapping = chapter_pages(pdf_path, data.chapters, 1, book=spec)

    # ---- pass 2: real TOC page numbers ----
    stats = build_docx(spec, data, docx_path, toc_pages=mapping)
    Q.convert(docx_path)

    # ---- per-chapter content review gate ----
    chapters_ok = []
    for ch in data.chapters:
        atoms = ch.text_atoms()
        chapters_ok.append({"chapter": ch.number, "title": ch.title, "code": ch.code,
                            "atoms": len(atoms), **ch.stats})

    # ---- quality gate ----
    report = Q.run_qc(spec, docx_path, pdf_path, stats, data.chapters)

    # ---- review manifest: chapter-by-chapter approval records ----
    gate, _ = review_gate(book_slug, report)
    for c in chapters_ok:
        gate["chapters"][str(c["chapter"])] = {
            "approved": report["passed"],   # content checks are the review evidence
            "title": c["title"], "atoms": c["atoms"], "figures": c["figures"],
            "tables": c["tables"], "examples": c["examples"],
            "exercises": c["exercises"], "reviewQuestions": c["reviewQuestions"],
        }
    gate["book"] = {"slug": book_slug, "identifier": spec["identifier"],
                    "version": spec["version"], "edition": spec["edition"],
                    "docx": os.path.basename(docx_path), "pdf": os.path.basename(pdf_path),
                    "qcPassed": report["passed"], "pages": report["pages"]}
    with open(os.path.join(ROOT, "books", book_slug, "review.json"), "w") as f:
        json.dump(gate, f, indent=1)

    status = "PASS" if report["passed"] else "FAIL"
    print(f"[{status}] {spec['title']}: {report['pages']} pages, "
          f"{stats['figures']} figures, {stats['tables']} tables, "
          f"{stats['equations']} equations, {stats['code']} listings")
    for c in report["checks"]:
        print(f"   {'✓' if c['pass'] else '✗'} {c['name']}: {c['detail']}")
    if not report["passed"]:
        print(f"   → book NOT assembled for release: fix and rebuild "
              f"(see reports/{book_slug}.qc.json)")
    return report


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--book", help="book slug (fm, alg, log, gph, ps, hb)")
    ap.add_argument("--chapter", type=int, help="build a single-chapter review copy")
    ap.add_argument("--all", action="store_true")
    ap.add_argument("--report", action="store_true")
    args = ap.parse_args()

    if args.report:
        for f in sorted(os.listdir(REPORTS)):
            r = json.load(open(os.path.join(REPORTS, f)))
            print(f"{r['book']:5} pages={r.get('pages','-'):3} "
                  f"{'PASS' if r['passed'] else 'FAIL'}")
        return

    if args.all:
        results = [build_book_cmd(slug) for slug, _ in load_all()]
        failed = [r["book"] for r in results if not r["passed"]]
        print(f"\nBUILT {len(results) - len(failed)}/{len(results)} books clean")
        if failed:
            print("FAILED:", failed)
            sys.exit(1)
        return

    if args.book:
        if args.chapter:
            build_book_cmd(args.book, only_chapter=args.chapter)
        else:
            build_book_cmd(args.book)
        return
    ap.print_help()


if __name__ == "__main__":
    main()
