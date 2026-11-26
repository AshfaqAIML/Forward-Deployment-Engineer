/**
 * FDE Project Handbook generator.
 * Reads project code listings directly from download/fde_projects/ so book and
 * code never drift. Cover R4, GO-1 palette, TOC depth 1.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const PROJ_DIR = "/home/z/my-project/download/fde_projects";
const OUT = "/home/z/my-project/download/FDE_Project_Handbook.docx";
const DATA = "/home/z/my-project/scripts/proj_handbook_data";

const LEVELS = [1, 2, 3, 4, 5, 6, 7].map(n => require(DATA + "/level" + n + ".js"));
const BACK = require(DATA + "/back.js");
const WELCOME = BACK.welcome;
const RUBRICS = BACK.rubrics;
const GUIDANCE = BACK.guidance;
const GLOSSARY = BACK.glossary;

// ---------------------------------------------------------------- validation
let totalProjects = 0;
for (const lvl of LEVELS) {
  for (const p of lvl.projects) {
    totalProjects++;
    const need = ["num", "title", "business", "problem", "objective", "expected",
      "requirements", "tools", "concepts", "steps", "code", "database", "api",
      "testing", "security", "deployment", "monitoring", "documentation",
      "checklist", "guidance"];
    const missing = need.filter(k => !p[k]);
    if (missing.length) throw new Error("Project " + p.num + " missing: " + missing);
    if (lvl.num >= 7 && !p.simulation) throw new Error("Project " + p.num + " missing simulation");
    if (lvl.num < 7 && p.simulation) throw new Error("Project " + p.num + " unexpected simulation");
    for (const c of p.code) {
      if (!fs.existsSync(PROJ_DIR + "/" + c.file)) {
        throw new Error("Code file missing on disk: " + c.file);
      }
    }
  }
}
console.log("Handbook levels:", LEVELS.length, "| projects:", totalProjects);

// ---------------------------------------------------------------- palette (GO-1)
const P = {
  bg: "1A2330", accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "707070", footerColor: "909090" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
  heading: "1A2330", body: "000000", grey: "808080",
  codeBg: "F4F1EC",
};
const EN = { ascii: "Times New Roman", eastAsia: "Times New Roman" };
const MONO = { ascii: "Courier New", eastAsia: "Courier New" };
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function safeText(v, placeholder) {
  if (v === undefined || v === null || v === "" || String(v) === "NaN" || String(v) === "undefined") {
    return placeholder || "N/A";
  }
  return String(v);
}

// ---------------------------------------------------------------- cover title layout
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
function runs(text, opts = {}) {
  const parts = safeText(text).split(/(\^\{[^}]+\})/);
  const out = [];
  for (const part of parts) {
    if (!part) continue;
    const m = part.match(/^\^\{([^}]+)\}$/);
    if (m) {
      out.push(new TextRun({ text: m[1], size: opts.size || 24, bold: !!opts.bold,
        italics: !!opts.italics, color: opts.color || P.body, font: EN, superScript: true }));
    } else {
      out.push(new TextRun({ text: part, size: opts.size || 24, bold: !!opts.bold,
        italics: !!opts.italics, color: opts.color || P.body, font: EN }));
    }
  }
  return out;
}

function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, before: opts.before || 0, after: opts.after === undefined ? 140 : opts.after },
    keepNext: !!opts.keepNext,
    children: runs(text, opts),
  });
}

function bodyRuns(parts, opts = {}) {
  const children = [];
  for (const p of parts) {
    if (Array.isArray(p)) children.push(...runs(p[0], { bold: p[1] === "b", italics: p[1] === "i", size: opts.size }));
    else children.push(...runs(p, { size: opts.size }));
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
    children: [new TextRun({ text: safeText(text), size: opts.size || 24,
      bold: !!opts.bold, italics: !!opts.italics, color: opts.color || P.body, font: EN })],
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
    spacing: { before: 300, after: 120, line: 350, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 27, color: P.heading, font: EN })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    keepNext: true,
    spacing: { before: 220, after: 90, line: 330, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 24, color: P.heading, font: EN })],
  });
}

function workLine(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    indent: { left: 560 },
    spacing: { line: 312, after: 40 },
    children: [new TextRun({ text: safeText(text), size: 22, font: EN })],
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
    children: [new TextRun({ text: safeText(text), size: 21, bold: !!opts.bold,
      color: opts.color || P.body, font: EN })],
  });
}

function mkTable(headers, rows, widths) {
  const headerRow = new TableRow({
    tableHeader: true, cantSplit: true,
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

// code listing: one paragraph per line, monospace, shaded block
function codeBlock(file, caption) {
  const raw = fs.readFileSync(PROJ_DIR + "/" + file, "utf-8").replace(/\t/g, "    ");
  const lines = raw.split("\n");
  const out = [];
  out.push(bodyRuns([["Source file: fde_projects/" + file, "b"]], { before: 160, after: 40, keepNext: true }));
  lines.forEach((line, i) => {
    out.push(new Paragraph({
      spacing: { before: 0, after: i === lines.length - 1 ? 40 : 0, line: 312 },
      keepNext: i < 3,
      shading: { type: ShadingType.CLEAR, fill: P.codeBg },
      indent: { left: 240, right: 240 },
      children: [new TextRun({ text: line.length ? line : " ", size: 17, font: MONO, color: "2C3440" })],
    }));
  });
  out.push(new Paragraph({
    spacing: { after: 160, line: 312 },
    children: [new TextRun({ text: "Listing: " + safeText(caption), italics: true, size: 20, color: P.grey, font: EN })],
  }));
  return out;
}

// ---------------------------------------------------------------- project rendering
function renderProject(lvl, p) {
  const out = [];
  out.push(h1("Project " + p.num + " \u2014 " + p.title));

  out.push(h2("Business Background"));
  out.push(body(p.business));
  out.push(h2("The Customer's Problem"));
  out.push(body(p.problem));
  out.push(h2("Project Objective"));
  out.push(body(p.objective));
  out.push(h2("Expected Result"));
  out.push(body(p.expected));

  out.push(h2("Requirements"));
  for (const r of p.requirements) out.push(bullet(r));
  out.push(h2("Tools Required"));
  for (const t of p.tools) out.push(bullet(t));
  out.push(h2("Technical Concepts Needed"));
  out.push(tcap("key concepts for Project " + p.num));
  out.push(mkTable(["Concept", "What it means here"], p.concepts, [24, 76]));

  out.push(h2("Step-by-Step Implementation"));
  p.steps.forEach((s, i) => out.push(bodyRuns([["Step " + (i + 1) + " \u2014 " + s.title + ". ", "b"], [s.text, "n"]], { after: 100 })));

  out.push(h2("Complete Source Code"));
  if (p.code.length === 0) {
    out.push(body("This project needs no code by design \u2014 its deliverables are models, tables, and rules that a future program (Levels 3 to 7) will consume. The discipline it trains is writing specifications precise enough to be coded by someone else."));
  } else {
    for (const c of p.code) out.push(...codeBlock(c.file, c.cap));
  }

  out.push(h2("Database Design"));
  for (const d of p.database) out.push(bullet(d));
  out.push(h2("API Design"));
  for (const a of p.api) out.push(bullet(a));
  out.push(h2("Testing Instructions"));
  for (const t of p.testing) out.push(bullet(t));
  out.push(h2("Security Considerations"));
  for (const s of p.security) out.push(bullet(s));
  out.push(h2("Deployment Instructions"));
  for (const d of p.deployment) out.push(bullet(d));
  out.push(h2("Monitoring and Maintenance"));
  for (const m of p.monitoring) out.push(bullet(m));
  out.push(h2("Documentation"));
  for (const d of p.documentation) out.push(bullet(d));
  out.push(h2("Final Demonstration Checklist"));
  for (const c of p.checklist) out.push(bullet("\u25a1 " + c));

  out.push(h2("Solution Guidance"));
  out.push(body("Attempt the project first. Read these only after an honest attempt \u2014 the struggle is the lesson.", { after: 80 }));
  out.push(bodyRuns([["Hints.", "b"]], { after: 20, keepNext: true }));
  for (const h of p.guidance.hints) out.push(workLine(h));
  out.push(bodyRuns([["Solution path.", "b"]], { before: 60, after: 20, keepNext: true }));
  out.push(workLine(p.guidance.path.join("  \u2192  ")));
  out.push(bodyRuns([["Pitfalls.", "b"]], { before: 60, after: 20, keepNext: true }));
  for (const pit of p.guidance.pitfalls) out.push(workLine(pit));

  if (p.simulation) {
    const s = p.simulation;
    out.push(h2("FDE Simulation: The Customer Engagement"));
    out.push(body("Play this engagement with a partner or alone, in role. Understand the problem before writing code: the briefing is incomplete on purpose, and the questions you ask are worth as much as the code you write.", { after: 100 }));
    out.push(h3("Customer Briefing"));
    out.push(body(s.briefing));
    out.push(h3("What Is Deliberately Unclear"));
    for (const u of s.unclear) out.push(bullet(u));
    out.push(h3("Questions the Engineer Should Ask"));
    for (const q of s.questions) out.push(bullet(q));
    out.push(h3("Business Constraints"));
    for (const c of s.constraints) out.push(bullet(c));
    out.push(h3("Technical Limitations"));
    for (const l of s.limitations) out.push(bullet(l));
    out.push(h3("Changing Requirements (and Professional Responses)"));
    for (const ch of s.changes) out.push(bullet(ch));
    out.push(h3("Testing Scenarios"));
    for (const t of s.test_scenarios) out.push(bullet(t));
    out.push(h3("Deployment Problems (and Fixes)"));
    for (const d of s.deployment_problems) out.push(bullet(d));
    out.push(h3("Customer Feedback"));
    for (const f of s.feedback) out.push(bullet(f));
    out.push(h3("Final Handover"));
    out.push(body(s.handover));
  }
  return out;
}

// ---------------------------------------------------------------- assembly
const B = [];

B.push(h1("Welcome and How to Use This Handbook"));
for (const p of WELCOME.intro) B.push(body(p));
B.push(h2("The Seven Levels at a Glance"));
B.push(tcap("the project ladder: fifteen projects in seven levels"));
B.push(mkTable(["Level", "Theme", "What you build", "Projects"], WELCOME.levels, [10, 30, 46, 14]));
B.push(h2("The Rules of the Programme"));
for (const r of WELCOME.rules) B.push(bullet(r));
B.push(h2("What You Receive with This Handbook"));
B.push(body(WELCOME.artefacts));
B.push(h2("The Production-Readiness Rule"));
B.push(body(RUBRICS.production, { before: 60 }));

for (const lvl of LEVELS) {
  B.push(h1(lvl.name));
  B.push(body(lvl.intro));
  for (const p of lvl.projects) B.push(...renderProject(lvl, p));
}

B.push(h1("Project Evaluation Rubrics"));
B.push(body(RUBRICS.intro));
B.push(tcap("the six scoring dimensions (0\u20134 each, pass at 16 with no dimension below 2)"));
B.push(mkTable(["Dimension", "What is graded", "Example evidence"], RUBRICS.dimensions, [16, 48, 36]));
B.push(h2("How Depth Grows by Level"));
B.push(tcap("the same dimensions, deeper expectations per level"));
B.push(mkTable(["Level", "What deeper grading means here", "Max score"], RUBRICS.levelDepth, [12, 74, 14]));
B.push(h2("The Production-Readiness Rule (again, on purpose)"));
B.push(body(RUBRICS.production));
B.push(body("The companion workbook FDE_Project_Rubrics.xlsx implements these tables with automatic totals: one sheet per project group, evidence column included. Score in it, keep the file, and watch the pass column across the programme.", { before: 60 }));

B.push(h1("Solution Guidance and Common Failure Points"));
B.push(body(GUIDANCE.intro));
for (const b of GUIDANCE.blocks) {
  B.push(h2(b[0]));
  B.push(body(b[1]));
}
B.push(h2("Six Questions to Ask Before Calling Any Project Done"));
for (const q of GUIDANCE.askYourself) B.push(bullet(q));

B.push(h1("Glossary"));
B.push(body("Every technical term used by the projects, in alphabetical order. When a term feels shaky during a project, look it up here before searching the web \u2014 these are the definitions this programme grades against."));
B.push(tcap("the handbook glossary (" + GLOSSARY.length + " terms)"));
B.push(mkTable(["Term", "Meaning"], GLOSSARY, [24, 76]));

B.push(body("End of the handbook. The projects are the learning; the demonstrations are the proof; the honesty is the profession. Ship things you can explain, and say plainly what is not ready.", { before: 120 }));

// ---------------------------------------------------------------- document
const HEADER_TEXT = "FDE Project Handbook \u2014 From First Calculations to Customer Deployments";

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
  title: "FDE Project Handbook: From First Calculations to Customer Deployments",
  description: "FDE Academy project-based learning programme (7 levels, 15 projects)",
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
      properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR4({
        title: "FDE Project Handbook",
        subtitle: "From First Calculations to Customer Deployments: 15 Projects in 7 Levels",
        englishLabel: "FDE ACADEMY SERIES",
        metaLines: [
          "FDE Academy - The Project-Based Learning Programme",
          "Levels 1 to 7 - Includes code, datasets, rubrics and simulations",
          "Version 1.0 - First edition",
          "24 November 2026",
        ],
        footerLeft: "FDE Academy",
        footerRight: "Project-Based Learning",
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
  ],
});

console.log("Tables:", tableNo, "| Body blocks:", B.length);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});
