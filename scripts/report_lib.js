/* generate_audit_report.js — FDE Academy Educational Quality Audit report.
 * Recipe R1 cover (WM-1 Warm Teal, education), Profile A formal report,
 * English document (Times New Roman), 3-section page numbering, TOC field.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableLayoutType, SectionType, TableOfContents, LevelFormat,
} = require("docx");
const fs = require("fs");
const sizeOf = require("image-size");

// ── palette WM-1 (Warm Teal — education) ──
const P = {
  bg: "F4F1E9", primary: "15857A", accent: "FF6A3B",
  cover: { titleColor: "15857A", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
  table: { headerBg: "15857A", headerText: "FFFFFF", accentLine: "15857A", innerLine: "D5D0C8", surface: "F0EDE5" },
};
const BODY = "000000";       // Profile A: pure black body
const GRAY = "808080";
const FONT = { ascii: "Times New Roman", eastAsia: "SimSun" };
const HFONT = { ascii: "Times New Roman", eastAsia: "SimHei" };

const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── title layout helpers (design-system, Latin-aware widths) ──
function estimateTextWidth(text, pt) {
  let w = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    const isCJK = (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3000 && code <= 0x303f);
    w += isCJK ? pt * 20 : pt * 11;
  }
  return w;
}
function splitTitleLinesLatin(title, maxWidthTw, pt) {
  const words = title.split(" ");
  const lines = [];
  let cur = "";
  for (const word of words) {
    const cand = cur ? cur + " " + word : word;
    if (estimateTextWidth(cand, pt) <= maxWidthTw || !cur) cur = cand;
    else { lines.push(cur); cur = word; }
  }
  if (cur) lines.push(cur);
  return lines;
}
function calcTitleLayout(title, maxWidthTw, preferredPt = 40, minPt = 24) {
  let pt = preferredPt, lines;
  while (pt >= minPt) {
    lines = splitTitleLinesLatin(title, maxWidthTw, pt);
    if (lines.length <= 3) break;
    pt -= 2;
  }
  return { titlePt: pt, titleLines: lines };
}
function calcCoverSpacing(p) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, hasEnglishLabel = false,
          metaLineCount = 0, fixedHeight = 400, pageHeight = 16838 } = p;
  const SAFETY = 1200;
  const usable = pageHeight - SAFETY;
  const titleH = titleLineCount * (titlePt * 23 + 200);
  const subH = hasSubtitle ? (12 * 23 + 600) : 0;
  const engH = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaH = metaLineCount * (10 * 23 + 100);
  const implicit = 3 * 300;
  const content = titleH + subH + engH + metaH + fixedHeight + implicit;
  const remaining = Math.max(usable - content, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(remaining * 0.45), rawBottom = Math.floor(remaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, bottomSpacing };
}

// ── cover R1 (single 16838 wrapper, paragraph-border decoration only) ──
function buildCoverR1(config) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18,
        color: P.accent, font: { ascii: "Arial", eastAsia: "SimHei" }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true,
        color: P.cover.titleColor, font: { ascii: "Arial", eastAsia: "SimHei" } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 800, line: 320, lineRule: "atLeast" },
      children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor,
        font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: P.cover.metaColor,
        font: { ascii: "Arial", eastAsia: "Microsoft YaHei" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: P.cover.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: P.cover.footerColor, font: { ascii: "Arial" } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        children,
      })],
    })],
  })];
}

// ── body builders (English report: LEFT aligned, no first-line indent) ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, keepNext: true,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.primary, font: HFONT })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, keepNext: true,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 30, color: P.primary, font: HFONT })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3, keepNext: true,
    spacing: { before: 220, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: P.primary, font: HFONT })],
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: opts.after ?? 120 },
    children: [new TextRun({ text, size: 24, color: BODY, font: FONT, ...opts.run })],
  });
}
function bodyRuns(runs, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: opts.after ?? 120 },
    children: runs.map(r => new TextRun({ size: 24, color: BODY, font: FONT, ...r })),
  });
}
function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 80, after: 200, line: 312 },
    children: [new TextRun({ text, italics: true, size: 21, color: "555555", font: FONT })],
  });
}
function cellPara(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT, spacing: { line: 312, after: 20 },
    children: [new TextRun({ text, size: opts.size ?? 21, bold: !!opts.bold,
      color: opts.color ?? BODY, font: FONT })],
  });
}
function attrTable(rows) {
  // 2-column attribute table (label/value) — Horizontal-Only style
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: rows.map(([label, value]) => new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          width: { size: 22, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: P.table.surface },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [cellPara(label, { bold: true })],
        }),
        new TableCell({
          width: { size: 78, type: WidthType.PERCENTAGE },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [cellPara(value)],
        }),
      ],
    })),
  });
}
function dataTable(headers, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headers.map((t, i) => new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: P.table.headerBg },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [cellPara(t, { bold: true, color: P.table.headerText })],
        })),
      }),
      ...rows.map((r, ri) => new TableRow({
        cantSplit: true,
        children: r.map((t, i) => new TableCell({
          width: { size: widths[i], type: WidthType.PERCENTAGE },
          shading: ri % 2 === 1 ? { type: ShadingType.CLEAR, fill: P.table.surface } : undefined,
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [cellPara(String(t))],
        })),
      })),
    ],
  });
}
function tableTitle(text) {
  return new Paragraph({
    keepNext: true, spacing: { before: 160, after: 80, line: 312 },
    children: [new TextRun({ text, bold: true, size: 21, color: "333333", font: FONT })],
  });
}
function numbered(text, ref) {
  return new Paragraph({
    numbering: { reference: ref, level: 0 },
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 24, color: BODY, font: FONT })],
  });
}

module.exports = { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  PageBreak, Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel, WidthType,
  BorderStyle, ShadingType, TableLayoutType, SectionType, TableOfContents, LevelFormat,
  P, BODY, GRAY, FONT, HFONT, NB, noBorders, allNoBorders, buildCoverR1, h1, h2, h3, body,
  bodyRuns, caption, attrTable, dataTable, tableTitle, numbered, cellPara, fs, sizeOf };
