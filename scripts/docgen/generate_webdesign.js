/**
 * FDE Academy Website — Product & Design Specification generator.
 * Cover R4, GO-1 series palette, TOC depth 1, images from embed manifest.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const MANIFEST = JSON.parse(fs.readFileSync(
  "/home/z/my-project/download/fde_design/embed/manifest.json", "utf-8"));
const OUT = "/home/z/my-project/download/FDE_Academy_Website_Design.docx";
const CH1 = require("/home/z/my-project/scripts/docgen/webdesign_content1.js");
const CH2 = require("/home/z/my-project/scripts/docgen/webdesign_content2.js");
const CHAPTERS = [...CH1, ...CH2];

// ---------------------------------------------------------------- palette (GO-1 series)
const P = {
  bg: "1A2330", accent: "D4875A",
  cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "707070", footerColor: "909090" },
  table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8" },
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

// ---------------------------------------------------------------- cover R4 (series)
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

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 60 },
    children: runs(text),
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

let tableNo = 0;
function tcap(text) {
  tableNo++;
  return new Paragraph({
    keepNext: true,
    spacing: { before: 200, after: 80, line: 312 },
    children: [new TextRun({ text: "Table " + tableNo + ": " + safeText(text), bold: true, size: 21, color: P.heading, font: EN })],
  });
}

let figNo = 0;
function figcap(text) {
  figNo++;
  return new Paragraph({
    spacing: { before: 60, after: 200, line: 312 },
    children: [new TextRun({ text: "Figure " + figNo + ": " + safeText(text), bold: true, size: 21, color: P.heading, font: EN })],
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

function imgBlock(name, caption) {
  const entry = MANIFEST[name];
  if (!entry) throw new Error("Manifest missing image: " + name);
  const out = [];
  entry.slices.forEach((s, i) => {
    out.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: i === 0 ? 120 : 0, after: 0 },
      children: [new ImageRun({
        type: "png",
        data: fs.readFileSync(s.path),
        transformation: { width: s.w, height: s.h },
      })],
    }));
  });
  out.push(figcap(caption + (entry.slices.length > 1
    ? " (shown across " + entry.slices.length + " pages; standalone PNG included in the design package)" : "")));
  return out;
}

// ---------------------------------------------------------------- assembly
const B = [];
for (const ch of CHAPTERS) {
  B.push(h1(ch.title));
  for (const blk of ch.blocks) {
    if (blk.h2) B.push(h2(blk.h2));
    else if (blk.p) B.push(body(blk.p));
    else if (blk.bullets) blk.bullets.forEach(b => B.push(bullet(b)));
    else if (blk.table) { B.push(tcap(blk.table.caption)); B.push(mkTable(blk.table.headers, blk.table.rows, blk.table.widths)); }
    else if (blk.img) B.push(...imgBlock(blk.img.name, blk.img.caption));
  }
}

// ---------------------------------------------------------------- document
const HEADER_TEXT = "FDE Academy Website \u2014 Product & Design Specification";

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
  title: "FDE Academy Website: Product & Design Specification",
  description: "Sitemap, journeys, wireframes, design system, component inventory, architecture, database requirements, roadmap",
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
        title: "The FDE Academy Website",
        subtitle: "Product & Design Specification: Sitemap, Journeys, Wireframes, Design System, Architecture and Roadmap",
        englishLabel: "FDE ACADEMY SERIES",
        metaLines: [
          "FDE Academy - Website Design Phase",
          "From Zero Knowledge to Real-World Engineering",
          "Version 1.0 - Design freeze candidate",
          "24 November 2026",
        ],
        footerLeft: "FDE Academy",
        footerRight: "Product & Design Specification",
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

console.log("chapters:", CHAPTERS.length, "| tables:", tableNo, "| figures:", figNo, "| body blocks:", B.length);
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("Written:", OUT, buf.length, "bytes");
});
