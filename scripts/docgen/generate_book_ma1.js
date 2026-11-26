/**
 * Book MA-1 generator: Everyday Mathematics for Future Engineers
 * From Absolute Zero to Practical Problem Solving
 * Cover recipe R4, palette GO-1, three sections (cover / TOC roman / body arabic).
 * Superscript markup in data strings: ^{...} renders as a raised exponent.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const ASSETS = "/home/z/my-project/scripts/assets";
const OUT = "/home/z/my-project/download/Everyday_Mathematics_for_Future_Engineers.docx";

const CH = [];
CH.push(...require("/home/z/my-project/scripts/book_ma1_data/ch01_02.js"));
CH.push(...require("/home/z/my-project/scripts/book_ma1_data/ch03_04.js"));
CH.push(...require("/home/z/my-project/scripts/book_ma1_data/ch05_06.js"));
CH.push(...require("/home/z/my-project/scripts/book_ma1_data/ch07_08.js"));
CH.push(...require("/home/z/my-project/scripts/book_ma1_data/ch09_10.js"));
const BM = require("/home/z/my-project/scripts/book_ma1_data/ch11_backmatter.js");
CH.push(BM.ch11);
const WELCOME = BM.welcome;
const FINAL = BM.finalReview;
const REFERENCES = BM.references;

// ---------------------------------------------------------------- validation
const BANDS = ["VE", "E", "M", "C"];
function validate() {
  let ok = true;
  const nQ = (list) => BANDS.map(b => list.filter(q => q.band === b).length).join("/");
  for (const ch of [...CH, { title: "Final Review", questions: FINAL.questions }]) {
    const dist = nQ(ch.questions);
    if (dist !== "4/4/4/4") { ok = false; console.error("BAD distribution", ch.title, dist); }
    if (ch.questions.length !== 16) { ok = false; console.error("BAD count", ch.title, ch.questions.length); }
  }
  if (FINAL.questions.length !== 16) { ok = false; console.error("Final review count", FINAL.questions.length); }
  console.log("Chapters:", CH.length, "| questions per chapter:", nQ(CH[0].questions));
  return ok;
}
if (!validate()) throw new Error("Data validation failed");

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

// ---------------------------------------------------------------- rich text: ^{...} superscripts
function rich(text, opts = {}) {
  const runs = [];
  const parts = String(text).split(/(\^\{[^}]+\})/);
  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^\^\{([^}]+)\}$/);
    if (m) {
      runs.push(new TextRun({
        text: m[1], size: opts.size || 24, bold: !!opts.bold, italics: !!opts.italics,
        color: opts.color || P.body, font: EN, superScript: true,
      }));
    } else {
      runs.push(new TextRun({
        text: part, size: opts.size || 24, bold: !!opts.bold, italics: !!opts.italics,
        color: opts.color || P.body, font: EN,
      }));
    }
  }
  return runs;
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
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, before: opts.before || 0, after: opts.after === undefined ? 140 : opts.after },
    keepNext: !!opts.keepNext,
    children: rich(text, opts),
  });
}

function bodyRuns(parts, opts = {}) {
  const children = [];
  for (const p of parts) {
    if (Array.isArray(p)) children.push(...rich(p[0], { bold: p[1] === "b", italics: p[1] === "i", size: opts.size }));
    else children.push(...rich(p, { size: opts.size }));
  }
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, before: opts.before || 0, after: opts.after === undefined ? 140 : opts.after },
    keepNext: !!opts.keepNext,
    children,
  });
}

function bullet(text, opts = {}) {
  return new Paragraph({
    bullet: { level: opts.level || 0 },
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 60 },
    children: rich(text, opts),
  });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    keepNext: true,
    spacing: { before: 480, after: 240, line: 380, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 34, color: P.heading, font: EN })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    keepNext: true,
    spacing: { before: 340, after: 140, line: 360, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 28, color: P.heading, font: EN })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    keepNext: true,
    spacing: { before: 240, after: 100, line: 340, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 25, color: P.heading, font: EN })],
  });
}

// A worked-calculation line, left indented like textbook working.
function workLine(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 560 },
    spacing: { line: 312, after: 40 },
    children: rich(text, { size: 22 }),
  });
}

// The FDE connection callout: single-cell table, surface fill, accent left edge.
function callout(title, text) {
  return [
    new Paragraph({ spacing: { before: 60, after: 0 }, children: [] }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: NB, bottom: NB, right: NB,
        left: { style: BorderStyle.SINGLE, size: 24, color: P.accent },
        insideHorizontal: NB, insideVertical: NB,
      },
      rows: [new TableRow({
        cantSplit: true,
        children: [new TableCell({
          shading: { type: ShadingType.CLEAR, fill: P.table.surface },
          margins: { top: 140, bottom: 140, left: 220, right: 180 },
          children: [
            new Paragraph({
              spacing: { after: 80, line: 312 },
              children: rich(title, { bold: true, size: 22, color: P.heading }),
            }),
            new Paragraph({
              spacing: { line: 312 },
              children: rich(text, { size: 22 }),
            }),
          ],
        })],
      })],
    }),
    new Paragraph({ spacing: { before: 0, after: 140 }, children: [] }),
  ];
}

let tableNo = 0;
function tcap(text) {
  tableNo++;
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 80, line: 312 },
    children: rich("Table " + tableNo + ": " + safeText(text), { bold: true, size: 21, color: P.heading }),
  });
}

function cellP(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { line: 312 },
    children: rich(text, { size: 21, bold: !!opts.bold, color: opts.color || P.body }),
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
  const dw = displayWidth || 470;
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
      children: rich("Figure " + figNo + ": " + safeText(caption), { italics: true, size: 20, color: P.grey }),
    }),
  ];
}

// ---------------------------------------------------------------- chapter rendering
const BAND_TITLES = { VE: "Very Easy Questions", E: "Easy Questions", M: "Medium Questions", C: "Challenging Questions" };

function renderChapter(ch) {
  const out = [];
  out.push(h1(ch.title));

  out.push(h2("A Story from Everyday Life"));
  out.push(body(ch.story));

  out.push(h2("What This Topic Means"));
  out.push(body(ch.meaning));

  out.push(h2("Why It Matters"));
  out.push(body(ch.why));

  if (ch.callouts && ch.callouts[0]) out.push(...callout(ch.callouts[0].title, ch.callouts[0].text));

  out.push(h2("New Words You Will Need"));
  out.push(body("Each of these words is used in this chapter. Read the meanings once now, and return here whenever a word feels slippery. All of them also appear in the Glossary at the back of the book.", { after: 80 }));
  out.push(tcap("Key words for " + ch.title.toLowerCase()));
  out.push(mkTable(["Word", "Meaning"], ch.words, [22, 78]));

  out.push(h2("The Idea, Step by Step"));
  ch.steps.forEach((s, i) => out.push(bodyRuns([["Step " + (i + 1) + " \u2014 ", "b"], [s, "n"]], { after: 100 })));

  for (const f of (ch.figures || [])) out.push(...figure(f.file, f.cap));

  out.push(h2("Solved Examples"));
  ch.examples.forEach((ex, i) => {
    out.push(bodyRuns([["Example " + (i + 1) + ": " + ex.title, "b"]], { before: 120, after: 60 }));
    out.push(bodyRuns([["Problem. ", "b"], [ex.q, "n"]], { after: 60 }));
    for (const w of ex.work) out.push(workLine(w));
    out.push(bodyRuns([["Answer. ", "b"], [ex.a, "n"]], { before: 60 }));
  });

  out.push(h2("Where You Will Meet This in Real Life"));
  for (const a of ch.applications) out.push(bullet(a));

  if (ch.callouts && ch.callouts[1]) out.push(...callout(ch.callouts[1].title, ch.callouts[1].text));

  out.push(h2("Common Mistakes and How to Avoid Them"));
  out.push(tcap("Common mistakes in " + ch.title.toLowerCase()));
  out.push(mkTable(["The mistake", "What to do instead"], ch.mistakes, [42, 58]));

  out.push(h2("Revision Summary"));
  for (const s of ch.summary) out.push(bullet(s));

  out.push(h2("Practice Questions"));
  out.push(body("Try every question yourself before reading a hint, and before looking at the Answer Key at the back of the book. The questions start very easy and grow harder within each chapter. Answers are explained in full in the Answer Key.", { after: 100 }));
  let qNo = 0;
  for (const band of BANDS) {
    out.push(h3(BAND_TITLES[band]));
    for (const q of ch.questions.filter(qq => qq.band === band)) {
      qNo++;
      out.push(bodyRuns([["Question " + qNo + ". ", "b"], [q.q, "n"]], { after: q.h && q.h.length ? 20 : 100 }));
      for (let hi = 0; hi < (q.h || []).length; hi++) {
        out.push(new Paragraph({
          indent: { left: 560 },
          spacing: { after: hi === q.h.length - 1 ? 100 : 20, line: 312 },
          children: rich(q.h[hi], { italics: true, size: 22, color: P.grey }),
        }));
      }
    }
  }

  out.push(h2("Practical Activity"));
  out.push(body(ch.activity, { after: 200 }));
  return out;
}

const B = [];

// ===== Welcome and How to Use This Book =====
B.push(h1("Welcome and How to Use This Book"));
for (const p of WELCOME.intro) B.push(body(p));
B.push(h2("How to Study with This Book"));
for (const p of WELCOME.howToUse) B.push(bullet(p));
B.push(h2("The Shape of Every Chapter"));
B.push(body("Every chapter of this book follows the same twelve-part shape, so you always know where you are and what is coming next. The table below shows the parts in order.", { after: 80 }));
B.push(tcap("the twelve parts of every chapter"));
B.push(mkTable(["Part of every chapter", "What it gives you"], WELCOME.anatomy, [34, 66]));

// ===== The eleven chapters =====
for (const ch of CH) B.push(...renderChapter(ch));

// ===== Final Review: Mixed Practice =====
B.push(h1("Final Review: Mixed Practice"));
B.push(body(FINAL.intro));
B.push(h2("The Sixteen Mixed Questions"));
let fqNo = 0;
for (const band of BANDS) {
  B.push(h3(BAND_TITLES[band]));
  for (const q of FINAL.questions.filter(qq => qq.band === band)) {
    fqNo++;
    B.push(bodyRuns([["Question " + fqNo + ". ", "b"], [q.q, "n"]], { after: q.h && q.h.length ? 20 : 100 }));
    for (let hi = 0; hi < (q.h || []).length; hi++) {
      B.push(new Paragraph({
        indent: { left: 560 },
        spacing: { after: hi === q.h.length - 1 ? 100 : 20, line: 312 },
        children: rich(q.h[hi], { italics: true, size: 22, color: P.grey }),
      }));
    }
  }
}
B.push(h2(FINAL.project.title));
B.push(body(FINAL.project.intro));

// ===== Glossary =====
B.push(h1("Glossary"));
B.push(body("Every key word from every chapter, in alphabetical order, with its plain meaning. When a word slips your mind during practice, come here first."));
const seen = new Set();
const terms = [];
for (const ch of CH) {
  for (const [t, d] of ch.words) {
    if (!seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); terms.push([t, d]); }
  }
}
terms.sort((a, b) => a[0].localeCompare(b[0]));
B.push(tcap("the glossary of all key words in this book"));
B.push(mkTable(["Word", "Meaning"], terms, [24, 76]));
B.push(body("This glossary holds " + terms.length + " words. If you can explain each one to a friend in your own words, you own this book.", { before: 100 }));

// ===== Answer Key =====
B.push(h1("Answer Key"));
B.push(body("Fully explained answers for every practice question in the book, chapter by chapter, followed by the final review. The numbers matter, but the reasons matter more: read the working even for questions you answered correctly, because a second way of seeing deepens the first. If your answer differs from the one here, find the step where the roads separate; that step is the lesson."));
for (const ch of CH) {
  B.push(h2("Answers: " + ch.title));
  ch.questions.forEach((q, i) => {
    B.push(bodyRuns([["Question " + (i + 1) + ". ", "b"], [q.a, "n"]], { after: 100 }));
  });
}
B.push(h2("Answers: Final Review: Mixed Practice"));
FINAL.questions.forEach((q, i) => {
  B.push(bodyRuns([["Question " + (i + 1) + ". ", "b"], [q.a, "n"]], { after: 100 }));
});

// ===== References =====
B.push(h1("References and Further Study"));
B.push(body("This book is self-contained: every idea is explained inside it, and every exercise is answered. The resources below are optional companions for extra practice, chosen because they are free and beginner-friendly."));
for (const r of REFERENCES) B.push(bullet(r));
B.push(body("The next book in this series, Algebra, Logic, Graphs, and Problem Solving, picks up exactly where this one ends.", { before: 80 }));

// ---------------------------------------------------------------- assembly
const HEADER_TEXT = "Everyday Mathematics for Future Engineers";

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
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-1" }),
  new Paragraph({
    spacing: { before: 200 },
    children: [new TextRun({
      text: "Note: This Table of Contents is generated via field codes. To refresh page numbers after editing, right-click the TOC and select \"Update Field.\"",
      italics: true, size: 18, color: "888888", font: EN,
    })],
  }),
];

const doc = new Document({
  creator: "FDE Academy",
  title: "Everyday Mathematics for Future Engineers: From Absolute Zero to Practical Problem Solving",
  description: "FDE Academy Foundation Mathematics, Book MA-1",
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 24, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 34, bold: true, color: P.heading },
        paragraph: { spacing: { before: 480, after: 240, line: 380 } },
      },
      heading2: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 28, bold: true, color: P.heading },
        paragraph: { spacing: { before: 340, after: 140, line: 360 } },
      },
      heading3: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 25, bold: true, color: P.heading },
        paragraph: { spacing: { before: 240, after: 100, line: 340 } },
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
        title: "Everyday Mathematics for Future Engineers",
        subtitle: "From Absolute Zero to Practical Problem Solving",
        englishLabel: "FDE ACADEMY SERIES",
        metaLines: [
          "FDE Academy - The Foundation Mathematics Series",
          "Book MA-1 of the FDE Academy curriculum",
          "Version 1.0 - First edition",
          "24 November 2026",
        ],
        footerLeft: "FDE Academy",
        footerRight: "Foundation Mathematics",
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

console.log("Chapters:", CH.length, "| Glossary terms:", terms.length, "| Tables:", tableNo, "| Figures:", figNo, "| Body blocks:", B.length);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});

