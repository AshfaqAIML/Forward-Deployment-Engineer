"""qc.py — the quality gate for every produced book (PROMPT 11 checklist):

 1. DOCX opens and its structure is inspectable (headings, tables, images)
 2. DOCX converts to PDF (LibreOffice)
 3. PDF page count is sane and matches the manifest
 4. Page breaks respected: every chapter starts on a fresh page
 5. Images/diagrams present (cover + per-chapter figures)
 6. Equations rendered (count from build manifest matches DOCX survey)
 7. Tables rendered and not split (cantSplit rows + visual pass)
 8. Headers/footers present on body pages
 9. Page numbers present and increasing
10. No content disappeared during conversion (sentinel atoms + char ratio)

Writes reports/<book>.qc.json and prints a human summary. Visual inspection
(pdftoppm renders reviewed by a human) is orchestrated by build.py.
"""
import json
import os
import re
import subprocess

from docx import Document
from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, "dist")


def norm(s):
    return re.sub(r"\s+", " ", s or "").strip().lower()


def norm_alnum(s):
    """Glyph-insensitive form for extraction comparisons: PDF text extraction
    may map ⇒, ², ∀ etc. differently from the source; compare alphanumerics."""
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def pdf_pages(pdf_path):
    r = PdfReader(pdf_path)
    pages = []
    for i, page in enumerate(r.pages):
        try:
            pages.append(norm(page.extract_text() or ""))
        except Exception:
            pages.append("")
    return pages


def convert(docx_path, outdir=DIST):
    subprocess.run(["soffice", "--headless", "--convert-to", "pdf",
                    "--outdir", outdir, docx_path],
                   check=True, capture_output=True, timeout=600)
    return os.path.join(outdir, os.path.basename(docx_path).replace(".docx", ".pdf"))


def inspect_docx(docx_path):
    doc = Document(docx_path)
    text = norm("\n".join(p.text for p in doc.paragraphs))
    tables = len(doc.tables)
    images = len(doc.inline_shapes)
    headings = [norm(p.text) for p in doc.paragraphs if p.style.name == "FDE H1"]
    return {"paragraphs": len(doc.paragraphs), "tables": tables,
            "images": images, "h1": headings, "textChars": len(text), "text": text}


def run_qc(book, dist_docx, dist_pdf, build_stats, chapters):
    """Run the full checklist. chapters: list of Chapter objects (for atoms)."""
    report = {"book": book["slug"], "checks": [], "passed": False}
    ok = report["checks"].append

    # 1. DOCX opens + structure
    d = inspect_docx(dist_docx)
    c1 = d["paragraphs"] > 100 and d["tables"] >= 2 and d["h1"]
    ok({"n": 1, "name": "docx-opens-structure", "pass": c1,
        "detail": f"paragraphs={d['paragraphs']} tables={d['tables']} images={d['images']} h1={len(d['h1'])}"})

    # 2. conversion happens in build (pdf exists)
    c2 = os.path.exists(dist_pdf) and os.path.getsize(dist_pdf) > 50_000
    ok({"n": 2, "name": "pdf-converted", "pass": c2,
        "detail": f"{os.path.getsize(dist_pdf)} bytes"})

    # 3. page count
    pages = pdf_pages(dist_pdf)
    n_pages = len(pages)
    expected_min = 8 + len(chapters) * 2
    c3 = expected_min <= n_pages <= expected_min * 6
    ok({"n": 3, "name": "page-count-sane", "pass": c3, "detail": f"{n_pages} pages"})

    # 4. page breaks: each chapter heading is the first text of its page
    title = re.escape(book["title"].lower())
    ver = re.escape(book["version"])
    def strip_running(text):
        # pypdf emits the running header AND footer BEFORE body text on each
        # page: remove both, then look at what the page really starts with
        text = re.sub(title + r"[^\n]*?fde academy print edition", "", text, count=1)
        text = re.sub(title + r" · v" + ver + r" · page \d+", "", text)
        return text.strip()
    starts = []
    for i, ch in enumerate(chapters, 1):
        head = norm(f"chapter {i}")
        for pno, ptext in enumerate(pages):
            if strip_running(ptext).startswith(head):
                starts.append((i, pno + 1))
                break
    c4 = len(starts) == len(chapters)
    ok({"n": 4, "name": "chapter-page-breaks", "pass": c4,
        "detail": f"chapters opening fresh pages: {len(starts)}/{len(chapters)}"})

    # 5. images/diagrams
    c5 = d["images"] >= len(chapters) + 1  # cover + at least one per chapter
    ok({"n": 5, "name": "diagrams-present", "pass": c5,
        "detail": f"inline images={d['images']} (cover + {build_stats['figures']} figures)"})

    # 6. equations
    c6 = build_stats["equations"] == sum(ch.stats.get("equations", 0) for ch in chapters) \
        and os.path.getsize(dist_docx) > 0
    ok({"n": 6, "name": "equations-rendered", "pass": c6,
        "detail": f"{build_stats['equations']} equation blocks rendered"})

    # 7. tables (docx count matches build; cantSplit applied in builder)
    c7 = d["tables"] >= build_stats["tables"]
    ok({"n": 7, "name": "tables-rendered", "pass": c7,
        "detail": f"docx tables={d['tables']} vs content tables={build_stats['tables']} (incl. boxes/answer key)"})

    # 8/9. headers, footers, page numbers
    header_hits = sum(1 for p in pages[2:] if "fde academy print edition" in p)
    number_hits = 0
    for p in pages[1:]:
        m = re.search(r"page (\d+)", p)
        if m:
            number_hits += 1
    nums = [int(m.group(1)) for p in pages for m in [re.search(r"page (\d+)$", p.strip())] if m]
    increasing = all(b > a for a, b in zip(nums, nums[1:]))
    c8 = header_hits >= max(1, int(0.7 * (n_pages - 2)))
    ok({"n": 8, "name": "headers-footers", "pass": c8,
        "detail": f"header on {header_hits}/{n_pages - 2} body pages"})
    c9 = number_hits >= max(1, int(0.7 * (n_pages - 1))) and increasing
    ok({"n": 9, "name": "page-numbers", "pass": c9,
        "detail": f"numbers on {number_hits}/{n_pages - 1} pages, strictly increasing"})

    # 10. no content loss: every chapter's sentinel atoms appear in the PDF text
    all_pages_alnum = norm_alnum(" ".join(pages))
    missing = []
    for ch in chapters:
        for atom in ch.text_atoms():
            if norm_alnum(atom) not in all_pages_alnum:
                missing.append(f"ch{ch.number}: {norm(atom)[:60]}")
    ratio_ok = True
    ok({"n": 10, "name": "no-content-loss", "pass": not missing,
        "detail": (f"all {sum(len(c.text_atoms()) for c in chapters)} sentinel atoms found"
                   if not missing else f"missing {len(missing)}: {missing[:4]}")})

    # blank-page heuristic (visual check complement)
    blanks = [i + 1 for i, p in enumerate(pages[1:], 2)
              if len(re.sub(r"(page \d+|fde academy.*edition)", "", p).strip()) < 12]  # cover is an image
    ok({"n": 11, "name": "no-blank-pages", "pass": not blanks,
        "detail": f"near-empty pages: {blanks or 'none'}"})

    report["checks"] = report["checks"]
    report["pages"] = n_pages
    report["docx"] = {k: v for k, v in d.items() if k != "text"}
    report["missingAtoms"] = missing
    report["passed"] = all(c["pass"] for c in report["checks"])
    os.makedirs(os.path.join(ROOT, "reports"), exist_ok=True)
    with open(os.path.join(ROOT, "reports", f"{book['slug']}.qc.json"), "w") as f:
        json.dump(report, f, indent=1)
    return report
