# FDE Academy Book Production Pipeline

A repeatable system that turns the **approved curriculum** (the platform's
content package — the same reviewed material the website serves) into
professional print editions: one **DOCX** and one **PDF** per book, with
identical content, produced chapter by chapter under a quality gate.

## Layout

```
pipeline/            the reusable machinery
  styles.py          A4 design system: typography, palette, named Word styles,
                     professional tables (navy header, zebra rows, cantSplit)
  figures.py         Matplotlib diagrams from approved data: fractions,
                     number lines, percentage bars, break-even charts,
                     function plots, chapter concept maps, A4 covers
  code.py            dependency-free syntax highlighting (JS/SQL)
  blocks.py          content-block schema → Word (paragraphs, tables, boxed
                     callouts/objectives, equation frames, code listings,
                     figures with captions)
  chapter.py         the chapter frame: title, introduction, learning
                     objectives, teaching, worked examples, diagrams,
                     exercises, summary, review questions
  book.py            assembly: cover, imprint page, two-pass TOC, how-to-use,
                     chapters, glossary, references, answer key, colophon;
                     headers/footers with restarted page numbering
  qc.py              the 11-check quality gate (below)
  data.py            loads the approved corpus and resolves book.json sources
books/<slug>/book.json   version-controlled source per book: identifier,
                     title, subject, edition, version, publication date,
                     chapter→lesson composition, glossary categories, references
build.py             CLI (below)
qc.py → build.py     (QC runs inside build; reports/ holds the JSON evidence)
publish.py           website integration: upload + attach editions to the
                     live book library, verify downloads
dist/                the finished books (FDE_<Subject>_<Title>_v<1>.docx/.pdf)
reports/             QC reports + per-book review manifests
```

## Usage

```bash
python3 build.py --book fm              # build one book end-to-end
python3 build.py --book fm --chapter 3  # single-chapter REVIEW COPY (watermarked header)
python3 build.py --all                  # build every book
python3 build.py --report               # QC summary
python3 publish.py --base http://127.0.0.1:8908   # push finished books to the library
```

Requires: `python-docx`, `matplotlib`, `pypdf`, LibreOffice (`soffice`) for
conversion, and the backend seed (`../fde-academy-backend/seed/content.json`,
overridable with `FDE_CONTENT`).

## The quality gate (runs after every build)

1. DOCX opens; structure surveyed (headings, tables, images)
2. PDF conversion via LibreOffice succeeds
3. Page count sane for the chapter count
4. Every chapter opens on a fresh page (page breaks respected)
5. Diagrams present: cover + ≥ 1 figure per chapter
6. Equations rendered (count matches the build manifest)
7. Tables rendered (with cantSplit rows so they never split)
8. Running headers on body pages
9. Page numbers present and strictly increasing
10. **No content loss**: every chapter's sentinel atoms (titles, opening
    sentences, captions, objectives, review questions) are found in the
    extracted PDF text — glyph-insensitive comparison
11. No near-blank pages

A book is assembled **only when every check passes**; otherwise the build
reports FAIL and the book is not released. `publish.py` re-checks the QC
report and refuses to publish anything unapproved.

## Chapter-by-chapter workflow

1. Build single-chapter review copies (`--chapter N`) for content review.
2. Record approvals in `books/<slug>/review.json` (the build writes the
   evidence per chapter: atom counts, figures, tables, exercises, review
   questions).
3. Assemble (`--book <slug>`) — the gate requires all chapters approved.

## Design notes

- **Two-pass table of contents**: pass 1 builds with stable placeholders,
  LibreOffice lays it out, the pipeline reads back each chapter's real footer
  page number from the PDF, pass 2 rebuilds with a correct, dotted-leader TOC.
- **Equations**: math blocks are typeset in an italic serif frame; the
  break-even chapter derives its model equation from the approved explorer
  data (`money in = p × rolls … break-even: rolls = fc ÷ (p − c)`).
- **Filenames**: `FDE_<Subject>_<Title>_v<MAJOR>.docx/.pdf`, sanitized
  (no colons/ampersands), e.g. `FDE_Mathematics_Logic_and_Proof_v1.pdf`.
- **Website integration**: editions attach to the existing library books
  (`POST /admin/cms/books/:id/editions`), files stay private, downloads go
  through the platform's token flow. The library page then shows both
  formats; `publish.py` verifies an authenticated download of each.

## Produced in this build

| Book | Identifier | Chapters | Pages | QC |
| --- | --- | --- | --- | --- |
| Foundation Mathematics | FDE-BK-001 | 6 | 22 | PASS |
| Algebra: From Expressions to Quadratics | FDE-BK-002 | 4 | 18 | PASS |
| Logic & Proof | FDE-BK-003 | 4 | 19 | PASS |
| Graphs & Networks | FDE-BK-004 | 4 | 18 | PASS |
| Problem Solving | FDE-BK-005 | 4 | 18 | PASS |
| FDE Project Handbook | FDE-BK-006 | 5 | 26 | PASS |

All twelve files exist, open successfully, and passed every check; all six
were published to the book library and their downloads verified.
