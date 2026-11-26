/**
 * FDE Academy - Complete Curriculum and Book Collection Blueprint (DOCX generator)
 * Cover: recipe R4 (Top Color Block), palette GO-1, same conventions as the master blueprint.
 * Sections: 1 cover / 2 front matter with TOC (Roman) / 3 body (Arabic, start 1).
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const ASSETS = "/home/z/my-project/scripts/assets";
const OUT = "/home/z/my-project/download/FDE_Academy_Curriculum_Catalogue.docx";

const MATH_BOOKS = require("/home/z/my-project/scripts/curriculum_data/math_books.js");
const BOOKS_1_9 = require("/home/z/my-project/scripts/curriculum_data/books_1_9.js");
const BOOKS_10_19 = require("/home/z/my-project/scripts/curriculum_data/books_10_19.js");
const BOOKS_20_28 = require("/home/z/my-project/scripts/curriculum_data/books_20_28.js");
const DEPS = require("/home/z/my-project/scripts/curriculum_data/deps_sequence.js");
const ALL_BOOKS = [...MATH_BOOKS, ...BOOKS_1_9, ...BOOKS_10_19, ...BOOKS_20_28];

// ---------------------------------------------------------------- palette (GO-1)
const P = {
  bg: "1A2330",
  accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "707070", footerColor: "909090" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
  heading: "1A2330",
  body: "000000",
  grey: "808080",
};
const EN = { ascii: "Times New Roman", eastAsia: "Times New Roman" };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };
const CELLM = { top: 60, bottom: 60, left: 120, right: 120 };

function safeText(v, placeholder) {
  if (v === undefined || v === null || v === "" || String(v) === "NaN" || String(v) === "undefined") {
    return placeholder || "N/A";
  }
  return String(v);
}

// ---------------------------------------------------------------- cover title layout (design-system)
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."\uFF0C\u3002\u3001\uFF1B\uFF1A\uFF01\uFF1F", ..."-_\u2014\u2013\u00B7/", ..." \t"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += last;
  }
  return lines;
}

function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = splitTitleLines(title, charsPerLine(minPt));
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function emptyPara() { return new Paragraph({ children: [] }); }

// ---------------------------------------------------------------- cover recipe R4
function buildCoverR4(config) {
  const PAL = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 26);
  const titleSize = titlePt * 2;

  const titleBlockHeight = titleLines.length * (titlePt * 23 + 200);
  const englishLabelH = config.englishLabel ? (9 * 23 + 500) : 0;
  const subtitleH = config.subtitle ? (12 * 23 + 200) : 0;
  const upperContentH = englishLabelH + titleBlockHeight + subtitleH;
  const UPPER_MIN = 7500;
  const UPPER_H = Math.max(UPPER_MIN, upperContentH + 1500 + 800);
  const DIVIDER_H = 60;
  const contentEstimate = englishLabelH + titleBlockHeight + subtitleH;
  const spacerIntrinsic = 280;
  const topSpacing = Math.max(UPPER_H - contentEstimate - spacerIntrinsic - 800, 400);

  const upperBlock = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: UPPER_H, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: PAL.bg }, borders: noBorders,
        verticalAlign: "top",
        margins: { left: padL, right: padR },
        children: [
          new Paragraph({ spacing: { before: topSpacing } }),
          config.englishLabel ? new Paragraph({
            spacing: { after: 500 },
            children: [new TextRun({ text: config.englishLabel.split("").join(" "),
              size: 18, color: PAL.accent, font: { ascii: "Calibri" }, characterSpacing: 60 })],
          }) : null,
          ...titleLines.map((line, i) => new Paragraph({
            spacing: { after: i < titleLines.length - 1 ? 100 : 200, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
            children: [new TextRun({ text: line, size: titleSize, bold: true,
              color: PAL.cover.titleColor, font: { eastAsia: "SimHei", ascii: "Arial" } })],
          })),
          config.subtitle ? new Paragraph({
            spacing: { after: 100 },
            children: [new TextRun({ text: config.subtitle, size: 24, color: PAL.cover.subtitleColor,
              font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
          }) : null,
        ].filter(Boolean),
      })],
    })],
  });

  const divider = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: DIVIDER_H, rule: "exact" },
      children: [new TableCell({ borders: noBorders,
        shading: { type: ShadingType.CLEAR, fill: PAL.accent }, children: [emptyPara()] })],
    })],
  });

  const lowerContent = [
    new Paragraph({ spacing: { before: 800 } }),
    ...(config.metaLines || []).map(line => new Paragraph({
      indent: { left: padL }, spacing: { after: 100 },
      children: [new TextRun({ text: safeText(line), size: 28, color: PAL.cover.metaColor,
        font: { eastAsia: "Microsoft YaHei", ascii: "Arial" } })],
    })),
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      indent: { left: padL },
      children: [
        new TextRun({ text: config.footerLeft || "", size: 22, color: PAL.cover.footerColor, font: { ascii: "Arial" } }),
        new TextRun({ text: "          ", font: { ascii: "Arial" } }),
        new TextRun({ text: config.footerRight || "", size: 22, color: PAL.cover.footerColor, font: { ascii: "Arial" } }),
      ],
    }),
  ];

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: "FFFFFF" }, borders: noBorders,
        verticalAlign: "top",
        children: [upperBlock, divider, ...lowerContent],
      })],
    })],
  })];
}

// ---------------------------------------------------------------- body helpers
function tr(text, opts = {}) {
  return new TextRun({
    text: safeText(text), size: opts.size || 24, bold: !!opts.bold,
    italics: !!opts.italics, color: opts.color || P.body, font: EN,
  });
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, before: opts.before || 0, after: opts.after === undefined ? 140 : opts.after },
    keepNext: !!opts.keepNext,
    children: [tr(text, opts)],
  });
}

function bodyRuns(parts, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, before: opts.before || 0, after: opts.after === undefined ? 140 : opts.after },
    keepNext: !!opts.keepNext,
    children: parts.map(p => tr(p[0], { bold: p[1] === "b" })),
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: opts.level || 0 },
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 60 },
    children: [tr(text, opts)],
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: 420, after: 200, line: 380, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 32, color: P.heading, font: EN })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    keepNext: true,
    spacing: { before: 320, after: 140, line: 360, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 30, color: P.heading, font: EN })],
  });
}

let tableNo = 0;
function tcap(text) {
  tableNo++;
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 80, line: 312 },
    children: [new TextRun({ text: "Table " + tableNo + ": " + safeText(text), bold: true, size: 21, color: P.heading, font: EN })],
  });
}

function cellP(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { line: 312 },
    children: [new TextRun({
      text: safeText(text), size: 21, bold: !!opts.bold,
      color: opts.color || P.body, font: EN,
    })],
  });
}

function mkTable(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map((htext, i) => new TableCell({
      children: [cellP(htext, { bold: true, color: P.table.headerText })],
      shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
      margins: CELLM,
      width: { size: widths[i], type: WidthType.PERCENTAGE },
    })),
  });
  const dataRows = rows.map(r => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => new TableCell({
      children: [cellP(c)],
      margins: CELLM,
      width: { size: widths[i], type: WidthType.PERCENTAGE },
    })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  });
}

function pngSize(path) {
  const b = fs.readFileSync(path);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

let figNo = 0;
function figure(file, caption, displayWidth) {
  const path = ASSETS + "/" + file;
  const { w, h } = pngSize(path);
  const dw = displayWidth || 560;
  const dh = Math.round(dw * h / w);
  figNo++;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER, keepNext: true,
      spacing: { before: 160, after: 80 },
      children: [new ImageRun({ data: fs.readFileSync(path), transformation: { width: dw, height: dh }, type: "png" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200, line: 312 },
      children: [new TextRun({ text: "Figure " + figNo + ": " + safeText(caption), italics: true, size: 20, color: P.grey, font: EN })],
    }),
  ];
}

// ---------------------------------------------------------------- computed totals
const totalHours = ALL_BOOKS.reduce((s, b) => s + b.hours, 0);
const optionalHours = ALL_BOOKS.filter(b => b.id === "MA-X").reduce((s, b) => s + b.hours, 0);
const coreHours = totalHours - optionalHours;
const totalChapters = ALL_BOOKS.reduce((s, b) => s + b.parts.reduce((a, p) => a + p.ch.length, 0), 0);
console.log("Catalogue:", ALL_BOOKS.length, "books,", totalChapters, "chapters,", totalHours, "hours total,", coreHours, "core");

const stageDisplay = { "MA-3": "15 (gate)", "MA-X": "16 (optional)", "23": "16-17" };
const stageOf = (b) => stageDisplay[b.id] || b.stage;

const B = [];

// ===== 1. Executive Summary =====
B.push(h1("1. Executive Summary"));
B.push(body(`This document is the complete curriculum and book collection blueprint for FDE Academy, produced under the master project instructions. It defines the full ordered learning programme: a mathematics series of three progressive books plus one optional advanced extension, and a main collection of 28 books that carries the learner from computer basics to forward deployed engineering career preparation. For every book it specifies purpose, target learner, prerequisites, outcomes, a complete table of contents, parts and chapters, a detailed chapter syllabus, exercises, diagrams, programming work, mini-projects, an assessment plan, study time, and references.`));
B.push(body(`The catalogue contains ${ALL_BOOKS.length} books with ${totalChapters} chapters and about ${totalHours} guided hours, of which ${coreHours} hours form the core programme and ${optionalHours} hours are the clearly separated optional calculus extension. The 18-stage roadmap and its stage gates from the master project blueprint remain unchanged; this blueprint supplies the books that realise each stage and, where the brief requires it, refines the mathematics stage so that no learner is forced to finish advanced mathematics before starting to program.`));
B.push(body(`Part D of the brief becomes two concrete artifacts. A dependency map states, for every book, what must be learned first, what can be learned simultaneously, and what it unlocks, together with the reason each book matters to a forward deployed engineer. A study sequence arranges all books into fifteen periods of roughly 120 to 135 hours each, with three recommended routes for full-time and part-time learners and an explicit fast-start variant.`));
B.push(body(`Per the project rules, no book is written yet. This blueprint is the review artifact: once its structure, catalogue, dependencies, and sequence are approved, production proceeds book by book through the implementation stages already defined in the master blueprint, beginning with a pilot volume of the mathematics series.`));

// ===== 2. Relationship to the Master Blueprint =====
B.push(h1("2. Relationship to the Master Project Blueprint"));
B.push(body("The master project blueprint (version 1.0) remains the single source of truth for the teaching system, the language and style rules, the quality pipeline, the website, and the implementation stages. This document extends it in one area only: the shape of the book collection. Five specific decisions connect the two documents, and each is binding on later production."));
B.push(bullet("The 18 stages, their outcomes, projects, assessments, and gates are unchanged. Books attach to stages; stages remain the learner-facing progress structure on the website."));
B.push(bullet("The earlier indicative catalogue of 21 books (B01 to B21) is superseded by the catalogue of this document. Appendix A cross-references every old identifier to its new placement so that no earlier commitment is silently lost."));
B.push(bullet("The mathematics stage is restructured as demanded by the brief: MA-1 and MA-2 are the essential Stage 1 content, MA-3 is the gate for the AI track and is deliberately studied alongside Stages 6 to 14, and MA-X is an optional specialisation for the deep learning track."));
B.push(bullet("Chapter titles across all books are descriptive and carry no numeric prefixes; sequence is carried by order in the tables of contents and by explicit part names, so numbering never breaks when chapters are added or reordered."));
B.push(body(`The hour arithmetic is also reconciled: the stage tables of the master blueprint estimate about 1,500 guided hours along the stage path, while the fuller book collection defined here sums to about ${coreHours} core hours, the difference being additional practice, case studies, and project sessions that the books carry beyond the stage minimum. Both numbers are planning targets, and the website will always show the stage path as the learner-facing default.`));

// ===== 3. The Learner and the Parallel-Track Principle =====
B.push(h1("3. The Learner and the Parallel-Track Principle"));
B.push(body("The learner is unchanged from the master blueprint: high-school education or less, no formal computer science, no programming, limited mathematics, and no assumed technical vocabulary. Books are written so that this person can finish every chapter, with short sentences, everyday examples before technical ones, and answers for every exercise. What changes in this blueprint is the shape of the path: instead of one strict line, the programme runs as parallel tracks with explicit connections."));
B.push(body("Three dependency relations are used throughout Part D. A prerequisite relation means a book should be finished before another begins, because later chapters build directly on it. A parallel relation means two books can be studied in the same period because neither depends on the other, which is how the mathematics and programming tracks interleave. An enrichment relation means a book deepens another but is not required by it, which is how the optional calculus extension relates to deep learning."));
B.push(body("The headline rule, taken directly from the brief, is that learners are never forced to study advanced mathematics before starting basic programming. Concretely: Book 3, the first programming book, requires only MA-1's arithmetic essentials and Book 2's thinking habits; MA-2 runs alongside it; MA-3 is required before the AI books (Book 16 onward) and is scheduled in Period 6 for that reason; MA-X is optional and recommended only with Book 18. Every gate in the study sequence encodes this rule."));

// ===== 4. The Complete Book Catalogue =====
B.push(h1("4. The Complete Book Catalogue"));
B.push(body(`The catalogue below is the ordered book collection: the mathematics series first, then the 28 main-collection books in learning order exactly as listed in the brief. Stage numbers refer to the 18-stage roadmap; the chapters column is computed from the tables of contents in Chapters 5 and 6. The full catalogue is also exported as a machine-readable file for the content pipeline.`));
B.push(tcap("The FDE Academy book catalogue, in learning order"));
B.push(mkTable(
  ["ID", "Title", "Track", "Stage", "Hours", "Chapters"],
  ALL_BOOKS.map(b => [b.id, b.title, b.track, stageOf(b), String(b.hours), String(b.parts.reduce((a, p) => a + p.ch.length, 0))]),
  [10, 31, 17, 15, 12, 15]
));
B.push(body(`Totals: ${ALL_BOOKS.length} books, ${totalChapters} chapters, about ${totalHours} guided hours including the optional extension, ${coreHours} hours in the core programme. Books marked Mathematics belong to the mathematics series of Chapter 5; all others are profiled in Chapter 6.`));

// ===== 5. Part A - The Mathematics Book Series =====
B.push(h1("5. Part A: The Mathematics Book Series"));
B.push(body("The mathematics series rebuilds the learner's mathematical foundation in three progressive steps and one optional extension: everyday arithmetic and problem solving, then algebra, logic, graphs, and discrete thinking, then the probability, statistics, and linear algebra that data and AI work require. The series is deliberately independent of the programming track after MA-1's essentials, as Part D requires. Recommended references for every book in this document are optional companions; FDE Academy content is written to be complete on its own, and tool-specific references are labelled as such and dated when they concern products that change."));

function bookProfile(bk) {
  const parts = [];
  parts.push(h2(bk.id + " - " + bk.title + " (" + bk.hours + " hours)"));
  parts.push(bodyRuns([["Book purpose. ", "b"], [bk.purpose, "n"]]));
  parts.push(bodyRuns([["Target learner. ", "b"], [bk.target, "n"]]));
  parts.push(bodyRuns([["Prerequisite knowledge.", "b"]], { after: 60, keepNext: true }));
  for (const p of bk.prereqs) parts.push(bullet(p));
  parts.push(bodyRuns([["Learning outcomes.", "b"]], { after: 60, keepNext: true, before: 80 }));
  for (const o of bk.outcomes) parts.push(bullet(o));
  parts.push(tcap(bk.id + " parts and chapters"));
  parts.push(mkTable(["Part", "Chapters"], bk.parts.map(p => [p.name, p.ch.map(c => c.t).join("; ")]), [26, 74]));
  const rows = [];
  for (const p of bk.parts) for (const c of p.ch) rows.push([c.t, c.s]);
  parts.push(tcap(bk.id + " detailed chapter syllabus"));
  parts.push(mkTable(["Chapter", "What it teaches"], rows, [26, 74]));
  parts.push(bodyRuns([["Practical exercises. ", "b"], [bk.exercises, "n"]], { before: 80 }));
  parts.push(bodyRuns([["Required diagrams. ", "b"], [bk.diagrams, "n"]]));
  parts.push(bodyRuns([["Programming exercises. ", "b"], [bk.programming, "n"]]));
  parts.push(bodyRuns([["Mini-projects. ", "b"], [bk.projects, "n"]]));
  parts.push(bodyRuns([["Assessment plan.", "b"]], { after: 60, keepNext: true }));
  for (const a of bk.assessment) parts.push(bullet(a));
  parts.push(bodyRuns([["Estimated study time. ", "b"], [bk.time, "n"]], { before: 80 }));
  parts.push(bodyRuns([["Recommended references.", "b"]], { after: 60, keepNext: true }));
  for (const r of bk.refs) parts.push(bullet(r));
  return parts;
}
for (const bk of MATH_BOOKS) B.push(...bookProfile(bk));

// ===== 6. Part B - The Main Book Collection =====
B.push(h1("6. Part B: The Main Book Collection"));
B.push(body("The 28 books of the main collection follow the exact order given in the brief, from computer basics through the technical core and the AI track to the customer-facing craft, capstone projects, and career preparation. Each profile below carries the same fourteen fields as the mathematics series, and the books are written to the same style rules, the same twelve-part lesson structure for their key topics, and the same workbook-and-answer-key format defined in the master blueprint. The dependency map in Chapter 7 shows how the four tracks interlock."));
for (const bk of BOOKS_1_9) B.push(...bookProfile(bk));
for (const bk of BOOKS_10_19) B.push(...bookProfile(bk));
for (const bk of BOOKS_20_28) B.push(...bookProfile(bk));

// ===== 7. Learning Dependencies =====
B.push(h1("7. Learning Dependencies (Part D)"));
B.push(body("The table below states, for every book in the catalogue, what must be learned first, what can be studied at the same time, and what it opens next, followed by the reason the book matters to a forward deployed engineer. The dependency figure draws the same structure as four tracks with their gates; dashed arrows mark the cross-track gates that the study sequence respects, of which the most important is the statistics-and-linear-algebra gate into the AI track."));
B.push(...figure("cur_fig1_dependencies.png", "The dependency map: four tracks, in-track order, and the cross-track gates."));
B.push(tcap("Dependencies for every book: first, parallel, next, and FDE relevance"));
B.push(mkTable(
  ["Book", "Must learn first", "Can learn simultaneously", "What comes next", "Why it is useful to an FDE"],
  DEPS.dependencies.map(d => [d.id + " - " + (ALL_BOOKS.find(b => b.id === d.id) || {}).title, d.first, d.parallel, d.next, d.why]),
  [16, 21, 21, 18, 24]
));
B.push(body("Two reading rules keep the table honest. First, where a parallel cell lists a book as optional or helpful, the dependency is an enrichment, not a gate; the study sequence never schedules two gate-related books before their gate is open. Second, the FDE relevance column is the tie-breaker when time is short: if a learner must postpone something, they postpone the book whose relevance column points furthest from their current goal."));

// ===== 8. Study Sequences =====
B.push(h1("8. Detailed Study Sequences"));
B.push(body("The sequence below arranges the whole catalogue into fifteen periods, each of roughly 120 to 135 guided hours: about four weeks at full time or eight weeks at half pace. Every period ends at a named gate, which is the point at which the learner's skills can be checked against the stage assessments and project rubrics defined in the master blueprint. The matrix figure shows the same sequence graphically."));
B.push(tcap("Recommended routes through the sequence"));
B.push(mkTable(
  ["Route", "Pace", "Duration", "Notes"],
  DEPS.routes.map(r => [r.name, r.pace, r.duration, r.note]),
  [14, 28, 16, 42]
));
B.push(...figure("cur_fig2_sequence.png", "The study-sequence matrix: each cell shows a book's guided hours in its period; MA-X is optional."));
B.push(tcap("The fifteen-period study sequence with gate milestones"));
B.push(mkTable(
  ["Period", "Books studied", "Hours", "Gate milestone"],
  DEPS.periods.map(p => ["P" + p.n, p.books.join("; "), String(p.hours), p.milestone]),
  [11, 28, 10, 51]
));
B.push(body(`The period totals sum to about ${DEPS.periods.reduce((s, p) => s + p.hours, 0)} hours, which matches the core programme hours within rounding because each period also carries review and catch-up time that the hour estimates already include. Learners who fall behind repeat the failing gate with its review queue, not the whole period; the sequence is a rhythm, not a stopwatch.`));

// ===== 9. Assessment and Progress =====
B.push(h1("9. Assessment and Progress Framework"));
B.push(body("Every book defines its own assessment plan in Chapters 5 and 6, and those plans feed the programme-level framework unchanged from the master blueprint: the five-level mastery scale, the stage assessments, and the gate rule that advancement requires a passed stage test and core skills demonstrated at level three. Book-level tests are the raw material of that system, not a competing one."));
B.push(bullet("End-of-chapter exercises with explained answers build level 2 and 3 mastery per skill, recorded on the website as the learner works."));
B.push(bullet("Book-final tests at an 80 percent pass mark provide the objective evidence for the stage gate that the book's stage maps to."));
B.push(bullet("Mini-projects and capstones are rubric-marked and become portfolio artifacts, following the portfolio matrix of the master blueprint."));
B.push(bullet("Gates in the study sequence (A1 through C6 and the final gate) are the moments where accumulated evidence is reviewed and the next period is unlocked."));
B.push(body("Certificates remain completion records of FDE Academy assessments, never industry certifications, and no employment claim is attached to any gate. The honest-limits statement of the master blueprint applies word for word."));

// ===== 10. Production Notes and the Review Gate =====
B.push(h1("10. Production Notes and the Review Gate"));
B.push(body(`Production follows the master blueprint's implementation stages with this catalogue: the pilot book for Stage 2 becomes MA-1, Everyday Mathematics for Future Engineers, which exercises every part of the document pipeline on the simplest audience. After the pilot is approved, books are produced in batches of two to three in catalogue order, each batch passing the full pipeline of readability, technical verification against official documentation, build, postcheck, and visual inspection before publication.`));
B.push(body(`Volume targets follow the master blueprint's book standards: primary textbooks of roughly 25,000 to 45,000 words with their built-in workbook and answer key, handbook-style books organised for lookup, and the capstone book driven by its briefs and rubrics. All ${totalChapters} chapters defined here are in scope; nothing else may be added without a revision of this blueprint, which is what keeps the website, the books, and the curriculum file consistent.`));
B.push(body("Per the brief, the books themselves are not written yet. The next step is review of this blueprint; on approval, Stage 1 of the implementation plan refreshes the master curriculum data file and glossary registry to match this catalogue, and Stage 2 delivers the pilot book for review as the quality bar for the rest of the series."));

// ===== Appendix A =====
B.push(h1("Appendix A: Cross-Reference from the Master Blueprint Catalogue"));
B.push(body("The master project blueprint defined an indicative catalogue of 21 books (B01 to B21). This catalogue supersedes it; the table below records where each earlier book now lives, so that no commitment from the earlier document is lost and older references remain traceable."));
B.push(tcap("Old catalogue to new catalogue cross-reference"));
B.push(mkTable(
  ["Old ID", "Old title", "Placement in this catalogue"],
  [
    ["B01", "Mathematics for FDEs", "Split into MA-1, MA-2, and MA-3 (this restructuring was demanded by the new brief)"],
    ["B02", "Computer Literacy: A Complete Starter", "Book 1, Computer Basics for Future Engineers"],
    ["B03", "Computational Thinking", "Book 2, Computational Thinking and Problem Solving"],
    ["B04", "Python from Zero, Volume I", "Book 3, Programming Fundamentals with Python"],
    ["B05", "Python from Zero, Volume II", "Book 4, Python Programming Through Practical Examples"],
    ["B06", "Computer Science Foundations", "Book 5, Data Structures and Algorithms for Beginners (OS depth moved to Book 12)"],
    ["B07", "The Developer Tools Handbook", "Book 6, Git, GitHub, Linux, and Command-Line Tools"],
    ["B08", "Web Development from Scratch", "Book 7, HTML, CSS, and JavaScript from Zero (Book 8 adds the modern frontend layer)"],
    ["B09", "Backend Engineering", "Book 9, Backend Engineering and REST APIs"],
    ["B10", "Databases for Beginners", "Book 10, Database Fundamentals and PostgreSQL"],
    ["B11", "Software Engineering Practices", "Book 11, Software Engineering and Software Testing"],
    ["B12", "Networking Explained Simply", "Book 12, Computer Networks and Operating Systems"],
    ["B13", "Cloud Computing, Step by Step", "Book 13, Cloud Computing Fundamentals"],
    ["B14", "The DevOps Handbook", "Book 14, Docker, DevOps, and Deployment"],
    ["B15", "Data Engineering Basics", "Book 15, Data Engineering Fundamentals"],
    ["B16", "AI and Machine Learning for Beginners", "Split into Book 16, AI Fundamentals, and Book 17, Machine Learning from Zero"],
    ["B17", "Generative AI in Production", "Split into Books 19 to 22; Book 18 (deep learning) is added by the new brief"],
    ["B18", "The Forward Deployed Engineer Handbook", "Split into Books 24, 25, and 26 (business, communication, system design)"],
    ["B19", "Capstone Projects Workbook", "Book 27, Real-World FDE Engineering Projects"],
    ["B20", "FDE Interview Preparation Guide", "Book 28, FDE Interview and Career Preparation"],
    ["B21", "FDE Glossary and Quick Reference", "Remains a website and reference artifact rather than a numbered book; the glossary registry of Stage 1 covers it"],
  ],
  [10, 34, 56]
));

// ---------------------------------------------------------------- assembly
const HEADER_TEXT = "FDE Academy - Curriculum and Book Collection";

const pageFooter = () => new Footer({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: P.grey, font: EN })],
  })],
});

const pageHeader = () => new Header({
  children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: HEADER_TEXT, size: 18, color: "888888", font: EN })],
  })],
});

const frontMatter = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 360, line: 400, lineRule: "atLeast" },
    children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: P.heading, font: EN })],
  }),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field.\"",
      italics: true, size: 18, color: "888888", font: EN,
    })],
  }),
];

const doc = new Document({
  creator: "FDE Academy",
  title: "FDE Academy - Complete Curriculum and Book Collection Blueprint",
  description: "Book catalogue, per-book specifications, dependency map, and study sequences",
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 24, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 32, bold: true, color: P.heading },
        paragraph: { spacing: { before: 420, after: 200, line: 380 } },
      },
      heading2: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 30, bold: true, color: P.heading },
        paragraph: { spacing: { before: 320, after: 140, line: 360 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: buildCoverR4({
        title: "FDE Academy",
        subtitle: "Complete Curriculum and Book Collection: 31 Core Books Plus an Optional Extension",
        englishLabel: "CURRICULUM BLUEPRINT",
        metaLines: [
          "Version 1.0 - Draft for review and approval",
          "24 November 2026",
          "Scope: mathematics series, 28-book collection, dependency map, study sequences",
          "Prepared by: FDE Academy founding team",
        ],
        footerLeft: "FDE Academy",
        footerRight: "Curriculum and Book Collection",
        palette: P,
      }),
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: frontMatter,
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: B,
    },
  ],
});

console.log("Tables:", tableNo, "Figures:", figNo, "Body blocks:", B.length);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});

