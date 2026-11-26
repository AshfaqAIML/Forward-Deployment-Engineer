/**
 * MA-2 Practical Workbook generator: companion to Book MA-2.
 * Four sections: cover / TOC (roman) / exercises (arabic) / answer key (arabic continues).
 * Levels A-E tagged per exercise; hints and solutions only in the Answer Key section.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const ASSETS = "/home/z/my-project/scripts/assets";
const OUT = "/home/z/my-project/download/Algebra_Logic_Graphs_and_Problem_Solving_Practical_Workbook.docx";
const DATA = "/home/z/my-project/scripts/workbook_ma2_data";

const CH = [];
for (let i = 1; i <= 15; i++) CH.push(require(DATA + "/wb" + String(i).padStart(2, "0") + ".js"));
const BACK = require(DATA + "/wb_back.js");
const WELCOME = BACK.welcome;

// ---------------------------------------------------------------- validation
const SECTION_NAMES = [
  "Warm-Up Questions",
  "Basic Understanding Questions",
  "Concept Application Exercises",
  "Step-by-Step Problem-Solving Exercises",
  "Practical Computer Activity",
  "Real-World Engineering Situation",
  "Challenging Exercises",
  "Small Independent Assignment",
];
const SECTION_LEVELS = ["A", "B", "C", "C", "C", "D", "D", "E"];
const SECTION_COUNTS = [3, 2, 2, 2, 1, 1, 2, 1];

function validate() {
  let ok = true;
  const need = (cond, msg) => { if (!cond) { ok = false; console.error("BAD:", msg); } };
  for (const ch of CH) {
    const t = "wb" + ch.num;
    need(ch.ex.length === 14, t + " exercise count " + ch.ex.length);
    for (let s = 1; s <= 8; s++) {
      const group = ch.ex.filter(e => e.sec === s);
      need(group.length === SECTION_COUNTS[s - 1], t + " section " + s + " count " + group.length);
      for (const e of group) {
        need(e.level === SECTION_LEVELS[s - 1], t + " sec " + s + " wrong level " + e.level);
      }
    }
    for (let i = 0; i < ch.ex.length; i++) {
      const e = ch.ex[i];
      need(e.q && e.q.length > 10, t + " ex " + (i + 1) + " question text");
      need(e.ans && e.ans.hint && e.ans.hint.length >= 1, t + " ex " + (i + 1) + " hints");
      need(e.ans.steps && e.ans.steps.length >= 1, t + " ex " + (i + 1) + " steps");
      need(e.ans.expected && e.ans.expected.length >= 1, t + " ex " + (i + 1) + " expected");
      need(e.ans.mistake && e.ans.mistake.length > 10, t + " ex " + (i + 1) + " mistake");
      need(e.ans.alt && e.ans.alt.length > 10, t + " ex " + (i + 1) + " alt");
      if (e.sec === 8) need(e.checklist && e.checklist.length >= 4, t + " ex " + (i + 1) + " checklist");
    }
  }
  console.log("Workbook chapters:", CH.length, "| exercises:", CH.reduce((a, c) => a + c.ex.length, 0));
  return ok;
}
if (!validate()) throw new Error("Workbook data validation failed");

// ---------------------------------------------------------------- palette (GO-1)
const P = {
  bg: "1A2330", accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "707070", footerColor: "909090" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
  heading: "1A2330", body: "000000", grey: "808080",
};
const EN = { ascii: "Times New Roman", eastAsia: "Times New Roman" };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function safeText(v, placeholder) {
  if (v === undefined || v === null || v === "" || String(v) === "NaN" || String(v) === "undefined") {
    return placeholder || "N/A";
  }
  return String(v);
}

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

function workLine(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 560 },
    spacing: { line: 312, after: 40 },
    children: rich(text, { size: 22 }),
  });
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
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      width: { size: widths[i], type: WidthType.PERCENTAGE },
    })),
  });
  const dataRows = rows.map(r => new TableRow({
    cantSplit: true,
    children: r.map((c, i) => new TableCell({
      children: [cellP(c)],
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
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
      children: rich("Worksheet " + figNo + ": " + safeText(caption), { italics: true, size: 20, color: P.grey }),
    }),
  ];
}

// answer lines: light grey rules for handwritten working
// (adjacent paragraphs with identical borders merge in Word, so alternate the
// border shade slightly on every other line to keep each rule visible)
function answerLines(count, firstKeepNext) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const shade = i % 2 === 0 ? "CCCCCC" : "C9C9C9";
    out.push(new Paragraph({
      spacing: { before: 0, after: i === count - 1 ? 120 : 0, line: 500 },
      keepNext: !!(firstKeepNext && i < 3),
      border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: shade, space: 4 } },
      children: [new TextRun({ text: " ", size: 21, font: EN })],
    }));
  }
  return out;
}

// ---------------------------------------------------------------- exercise rendering
const FIGMAP = {
  "3-5": { file: "fig_wb_balance.png", cap: "your balance: whatever you do to one pan, do to the other" },
  "5-1": { file: "fig_wb_numberline.png", cap: "mark and shade your range here, with the right dot style" },
  "6-8": { file: "fig_wb_dotlattice.png", cap: "the dot lattice: build stages 1, 2, and 3 of your pattern" },
  "7-6": { file: "fig_wb_coordgrid.png", cap: "the blank coordinate grid for your four corners" },
  "9-5": { file: "fig_wb_grid6.png", cap: "the blank 6 by 6 grid: shade the tiles and count" },
  "12-8": { file: "fig_wb_venn.png", cap: "the empty Venn worksheet: fill every region honestly" },
};

function renderChapter(ch) {
  const out = [];
  out.push(h1("Chapter " + ch.num + " \u2014 " + ch.title));
  out.push(body("Companion to textbook Chapter " + ch.num + ". " + ch.focus + " Attempt every exercise in pencil before visiting the Answer Key at the back of this workbook.", { after: 160 }));

  let no = 0;
  for (let s = 1; s <= 8; s++) {
    out.push(h2("Section " + s + ". " + SECTION_NAMES[s - 1] + " (Level " + SECTION_LEVELS[s - 1] + ")"));
    const group = ch.ex.filter(e => e.sec === s);
    for (const e of group) {
      no++;
      out.push(bodyRuns([
        ["Exercise " + no + ". ", "b"],
        ["(Level " + e.level + ") ", "b"],
        [e.q, "n"],
      ], { after: e.parts && e.parts.length ? 60 : 80, keepNext: true }));
      if (e.parts) {
        for (const part of e.parts) {
          out.push(new Paragraph({
            indent: { left: 560 },
            spacing: { after: 40, line: 312 },
            children: rich(part, { size: 22 }),
          }));
        }
      }
      const fig = FIGMAP[ch.num + "-" + no];
      if (fig) out.push(...figure(fig.file, fig.cap));
      if (e.sec === 8 && e.checklist) {
        out.push(bodyRuns([["Deliverable checklist:", "b"]], { before: 60, after: 40, keepNext: true }));
        for (const item of e.checklist) out.push(bullet("\u25a1 " + item));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      } else {
        out.push(...answerLines(e.space, true));
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- answer key rendering
function renderAnswerEntry(no, e) {
  const out = [];
  out.push(bodyRuns([["Exercise " + no + " (Level " + e.level + ").", "b"]], { before: 120, after: 40 }));
  out.push(bodyRuns([["Hints. ", "b"], [e.ans.hint.join(" "), "n"]], { after: 40 }));
  out.push(bodyRuns([["Step-by-step solution.", "b"]], { after: 20, keepNext: true }));
  for (const s of e.ans.steps) out.push(workLine(s));
  out.push(bodyRuns([["Expected answer. ", "b"], [e.ans.expected, "n"]], { before: 40, after: 40 }));
  out.push(bodyRuns([["A common mistake. ", "b"], [e.ans.mistake, "n"]], { after: 40 }));
  out.push(bodyRuns([["Another way. ", "b"], [e.ans.alt, "n"]], { after: 80 }));
  return out;
}

const B = [];

// ===== Welcome =====
B.push(h1("Welcome and How to Use This Workbook"));
for (const p of WELCOME.intro) B.push(body(p));
B.push(h2("How to Study with This Workbook"));
for (const p of WELCOME.howToUse) B.push(bullet(p));
B.push(h2("The Difficulty Levels, A to E"));
B.push(body("Every exercise carries one of five level tags. The ladder is deliberate: A and B build the floor, C is the workout, D brings real engineering weight, and E is where you work alone like a forward deployed engineer.", { after: 80 }));
B.push(tcap("the five difficulty levels in this workbook"));
B.push(mkTable(["Level", "What it means for you"], WELCOME.levels, [30, 70]));
B.push(h2("The Eight Practice Types in Every Chapter"));
B.push(body("Every chapter offers fourteen exercises in eight fixed sections, from wake-up warm-ups to independent assignments. The table shows what each section trains.", { after: 80 }));
B.push(tcap("the eight sections of every workbook chapter"));
B.push(mkTable(["Section", "What it trains"], WELCOME.parts, [40, 60]));
B.push(h2("Your Progress Chart"));
B.push(body("After finishing a chapter, tick the levels you attempted and passed. Four ticks is a pass; five is mastery. Be honest: the chart is for you.", { after: 80 }));
B.push(tcap("tick your progress: four levels passed is a pass, five is mastery"));
B.push(mkTable(["Workbook chapter", "Levels attempted and passed"], WELCOME.tracker, [40, 60]));

// ===== Chapters =====
for (const ch of CH) B.push(...renderChapter(ch));

// ===== Answer key (separate document section, added below) =====
const AK = [];
AK.push(h1("Answer Key"));
AK.push(body("Hidden hints, step-by-step solutions, expected answers, the classic mistake, and an alternative road for every exercise, chapter by chapter. Nothing here appears beside the questions, so attempt first, hint second, solution last. If your answer differs from the one here, find the step where the roads separate; that step is the lesson."));
for (const ch of CH) {
  AK.push(h2("Answers: Chapter " + ch.num + " \u2014 " + ch.title));
  let no = 0;
  for (const e of ch.ex) {
    no++;
    AK.push(...renderAnswerEntry(no, e));
  }
}
AK.push(body("You have reached the end of the workbook. If every chapter's chart shows four ticks or more, the textbook's skills are now your skills; keep the solved pages, because they are your first methods handbook.", { before: 120 }));

// ---------------------------------------------------------------- assembly
const HEADER_TEXT = "Algebra, Logic, Graphs, and Problem Solving \u2014 Practical Workbook";

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

const pgSize = { width: 11906, height: 16838 };
const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };

const doc = new Document({
  creator: "FDE Academy",
  title: "Algebra, Logic, Graphs, and Problem Solving: The Practical Workbook",
  description: "FDE Academy Foundation Mathematics, companion workbook to Book MA-2",
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
    },
  },
  sections: [
    {
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR4({
        title: "Algebra, Logic, Graphs, and Problem Solving",
        subtitle: "The Practical Workbook: Turning the Textbook into Skill",
        englishLabel: "FDE ACADEMY SERIES",
        metaLines: [
          "FDE Academy - The Foundation Mathematics Series",
          "Companion workbook to Book MA-2",
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
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: frontMatter,
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: B,
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: pgSize, margin: pgMargin, pageNumbers: { formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: pageHeader() },
      footers: { default: pageFooter() },
      children: AK,
    },
  ],
});

console.log("Chapters:", CH.length, "| Tables:", tableNo, "| Figures:", figNo, "| Body blocks:", B.length, "| Key blocks:", AK.length);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});
