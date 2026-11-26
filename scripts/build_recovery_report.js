/* FDE Academy — Website Recovery & Audit Report (.docx)
 * English report, Profile A (formal), R1 cover (DM-1 palette),
 * 3-section numbering (cover / TOC roman / body arabic).
 * All facts from the 2026-11-26 audit session — no invented data.
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  TableLayoutType, SectionType, TableOfContents, LevelFormat,
} = require("docx");
const fs = require("fs");

/* ---------- palette (DM-1 Deep Cyan, tech) ---------- */
const P = {
  bg: "162235", accent: "37DCF2",
  titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078",
  table: { headerBg: "1B6B7A", headerText: "FFFFFF", innerLine: "C8DDE2", surface: "EDF3F5" },
};
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

/* ---------- helpers ---------- */
function pngDims(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(12) !== 0x49484452) throw new Error("not a PNG IHDR: " + file);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}
function body(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 120 },
    children: [new TextRun({ text, size: 24, color: "000000", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" }, ...opts })],
  });
}
function bodyRuns(runs) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 120 },
    children: runs.map(r => new TextRun({ size: 24, color: "000000", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" }, ...r })),
  });
}
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 160, line: 380, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 32, color: "0A1628", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120, line: 360, lineRule: "atLeast" },
    children: [new TextRun({ text, bold: true, size: 30, color: "0A1628", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" } })],
  });
}
function caption(text) {
  return new Paragraph({
    keepNext: true, alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 },
    children: [new TextRun({ text, bold: true, size: 21, color: "333333", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" } })],
  });
}
function cell(text, { header = false, width = 100, align = AlignmentType.LEFT } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: header ? { type: ShadingType.CLEAR, fill: P.table.headerBg } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align, spacing: { line: 280 },
      children: [new TextRun({
        text, bold: header, size: 21,
        color: header ? P.table.headerText : "000000",
        font: { ascii: "Times New Roman", hAnsi: "Times New Roman" },
      })],
    })],
  });
}
function table(headers, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.table.headerBg },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.table.headerBg },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.table.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({
        tableHeader: true, cantSplit: true,
        children: headers.map((t, i) => cell(t, { header: true, width: widths[i] })),
      }),
      ...rows.map(r => new TableRow({
        cantSplit: true,
        children: r.map((t, i) => cell(t, { width: widths[i] })),
      })),
    ],
  });
}
function figure(file, capText, displayWidth = 430) {
  const d = pngDims(file);
  const h = Math.round(displayWidth * d.h / d.w);
  return [
    new Paragraph({
      keepNext: true, alignment: AlignmentType.CENTER, spacing: { before: 120, after: 0 },
      children: [new ImageRun({ data: fs.readFileSync(file), transformation: { width: displayWidth, height: h }, type: "png" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 200 },
      children: [new TextRun({ text: capText, bold: true, size: 21, color: "333333", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" } })],
    }),
  ];
}

/* ---------- cover (R1, adapted for English) ---------- */
function estimateWidth(text, pt) {
  let w = 0;
  for (const ch of text) {
    const c = ch.codePointAt(0);
    const cjk = (c >= 0x4E00 && c <= 0x9FFF) || (c >= 0x3000 && c <= 0x303F);
    w += cjk ? pt * 20 : pt * 11;
  }
  return w;
}
function splitTitleLines(title, maxW, pt) {
  const words = title.split(" ");
  const lines = []; let cur = "";
  for (const w of words) {
    const t = cur ? cur + " " + w : w;
    if (estimateWidth(t, pt) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
  }
  if (cur) lines.push(cur);
  if (lines.length > 1 && lines[lines.length - 1].length <= 4) {
    const last = lines.pop(); lines[lines.length - 1] += " " + last;
  }
  return lines;
}
function calcTitleLayout(title, maxW, preferredPt = 40, minPt = 24) {
  let pt = preferredPt, lines;
  while (pt >= minPt) {
    lines = splitTitleLines(title, maxW, pt);
    if (lines.length <= 3) break;
    pt -= 2;
  }
  return { titlePt: pt, titleLines: lines };
}
function calcCoverSpacing(p) {
  const SAFETY = 1200;
  const usable = 16838 - SAFETY;
  const titleH = p.titleLineCount * (p.titlePt * 23 + 200);
  const subH = p.hasSubtitle ? (12 * 23 + 600) : 0;
  const enH = p.hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaH = p.metaLineCount * (10 * 23 + 100);
  const content = titleH + subH + enH + metaH + (p.fixedHeight || 400) + 900;
  const rem = Math.max(usable - content, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(rem * 0.45), rawBottom = Math.floor(rem * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, bottomSpacing };
}
function buildCoverR1(cfg) {
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(cfg.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const sp = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!cfg.subtitle, hasEnglishLabel: !!cfg.englishLabel,
    metaLineCount: (cfg.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: sp.topSpacing } }));
  if (cfg.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({ text: cfg.englishLabel.split("").join("  "), size: 18, color: P.accent, font: { ascii: "Calibri" }, characterSpacing: 40 })],
    }));
  }
  titleLines.forEach((line, i) => {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: line, size: titleSize, bold: true, color: P.titleColor, font: { ascii: "Arial" } })],
    }));
  });
  if (cfg.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 800 },
      children: [new TextRun({ text: cfg.subtitle, size: 24, color: P.subtitleColor, font: { ascii: "Arial" } })],
    }));
  }
  for (const line of (cfg.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Arial" } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: sp.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: cfg.footerLeft || "", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                                                  " }),
      new TextRun({ text: cfg.footerRight || "", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
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

/* ---------- footers / headers ---------- */
function pageNumFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: { ascii: "Times New Roman" } })],
    })],
  });
}
function bodyHeader() {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "C8DDE2", space: 4 } },
      children: [new TextRun({ text: "FDE Academy — Website Recovery Audit", size: 18, color: "808080", font: { ascii: "Times New Roman" } })],
    })],
  });
}

/* ---------- content ---------- */
const DL = "/home/z/my-project/download";
const PV = DL + "/preview";

const bodyChildren = [];

/* 1. Executive summary */
bodyChildren.push(h1("1. Executive Summary"));
bodyChildren.push(body("This report documents the investigation, root-cause analysis, and verified restoration of the FDE Academy website. The user reported that the site had been visible and working for a short period with a simple, clean stylesheet, and that it later disappeared or stopped rendering correctly. The audit that followed found that the website itself was intact on disk and in version control; the perceived disappearance had four identifiable causes, two of which were genuine code defects introduced during earlier feature work."));
bodyChildren.push(body("The two code defects were repaired and verified: the Home navigation button navigated to the URL fragment #/home, which was never registered in the client-side route table and therefore rendered a \"Page not found\" view; and the active-page highlight in the navigation bar was being erased by a chrome rebuild that ran after the highlight was applied. A third finding, the missing run-time dependency PGlite, prevented the backend test suite from running at all until the package was restored. The fourth finding, the lost simple landing page, could not be recovered from any surviving copy and was therefore rebuilt from the surviving wireframe design, now as a permanent separate file with all eleven requested sections."));
bodyChildren.push(body("Restoration was verified rather than assumed: the full backend suite passed 96 of 96 tests after repair, all 16 deep links from the new landing page resolved to real pages in the single-page application, the served root URL returned HTTP 200 with the complete 348,413-byte page, and every navigation route was driven in a real browser with zero console errors. The site is recovered, and the recovery work is captured at git commit 7227ef6 with a pre-repair branch preserved for rollback."));

/* 2. Background */
bodyChildren.push(h1("2. Background and Objectives"));
bodyChildren.push(h2("2.1 What was reported"));
bodyChildren.push(body("The user reported that an earlier HTML landing page for FDE Academy had been \"simple and clean\" and had later disappeared, and that the website was missing or not rendering correctly. A subsequent, more formal brief requested a complete audit before any changes, recovery using the safest available approach, a recreated homepage in a simple minimal style, a complete site structure with no broken links, and a styling audit that would prevent the CSS from \"disappearing again\". This report covers the audit and the recovery; each step below was executed in that order and under the constraint that existing files, functionality, and data must be preserved."));
bodyChildren.push(h2("2.2 Objectives"));
bodyChildren.push(body("The engagement had five objectives, mirroring the five-part brief: first, identify the exact root cause of the website becoming invisible or broken without modifying anything; second, create a recovery point before repair and restore the previous working state; third, ensure the homepage renders at the website root; fourth, verify that every visible navigation link and button leads to a valid page and that documented downloads exist; fifth, standardise the styling so the site cannot lose its CSS again. All five objectives were met, and the evidence for each is presented in sections 4 through 7."));

/* 3. Scope & method */
bodyChildren.push(h1("3. Audit Scope, Sources and Method"));
bodyChildren.push(body("The audit inspected the entire project tree under the workspace download directory, including the 98-file backend repository, the 348-kilobyte single-page application, the developer workspace file, the rebuilt landing page, eight exported book files, and the design artefacts kept under the project scripts directory. Version control was examined across all commits on the main branch, including the four historical versions of the single-page application and every file ever deleted or renamed, using git log, git show, and diff-filtered listings. The run-time state was inspected by driving the application in a headless browser: thirteen routes were loaded, navigation buttons were clicked, the browser console was read after every action, and the served root URL was fetched over HTTP while the Node.js backend process was live. Finally, the backend test suite was executed end to end against the repaired code."));
bodyChildren.push(body("Method constraints were respected throughout: no file was deleted or overwritten before a git recovery branch was created; the framework (a dependency-free single-file vanilla-JavaScript application plus a zero-dependency Node.js backend) was not replaced; and no design changes were made until the investigation phase was complete. One deliberate exception to \"no overwriting\" was required and disclosed: the rebuilt landing page replaced the previous ten-section draft, which itself remained recoverable at the pre-repair git commit."));

/* 4. Inventory */
bodyChildren.push(h1("4. Current-State Inventory"));
bodyChildren.push(body("The project is complete and healthy on disk. Table 1 summarises the principal deliverables as verified during this audit. No file listed by the project documentation was missing; no stylesheet import was broken, because the application carries its styles inline in a single style block rather than importing external CSS files, and there is no build system whose compilation could fail."));
bodyChildren.push(caption("Table 1: Principal deliverables and their verified state"));
bodyChildren.push(table(
  ["Deliverable", "Size / scale", "Verified state"],
  [
    ["Single-page application (FDE_Academy_Frontend.html)", "348,413 bytes; 23 route patterns", "Renders at file URL and served root; zero console errors across 13 routes"],
    ["Backend (fde-academy-backend/)", "98 files; 102 endpoints; 11 migrations", "Serves the site on port 8787; 96/96 tests pass after dependency restore"],
    ["Landing page (FDE_Academy_Landing.html)", "11 sections; 8 book download links", "Rebuilt this session; all 16 application links resolve"],
    ["Developer workspace (FDE_Academy_Workspace.html)", "1,292,327 bytes; 98 embedded files", "Intact from the previous session"],
    ["Exported books (DOCX and PDF)", "8 files across 4 titles", "All linked files exist in the same folder"],
    ["Curriculum content", "18 stages; 8 courses; 34 lessons; 34 quizzes; 6 books; 15 projects; 9 labs; 56 glossary terms", "Counts read directly from the seeded content file"],
  ],
  [34, 30, 36]
));
bodyChildren.push(body("Two corrections to earlier claims in this project were confirmed during the count and are reflected everywhere in this report: the platform contains fifteen guided projects, not thirty, and it has no flashcard feature; earlier conversation summaries that stated otherwise were inaccurate, and the rebuilt landing page now states only the verified figures."));

/* 5. Root causes */
bodyChildren.push(h1("5. Root-Cause Analysis"));
bodyChildren.push(body("The investigation found no build failure, no missing stylesheet, and no deployment regression, because none of those mechanisms exist in this architecture. What it did find is one delivery-layer cause and three concrete defects, each reproduced and confirmed before repair. They are listed in Table 2 in the order they affect the user's experience."));
bodyChildren.push(caption("Table 2: Findings, severity, and resolution"));
bodyChildren.push(table(
  ["#", "Finding and evidence", "Effect", "Status"],
  [
    ["1", "The original simple landing page (landing_page_*.html) was superseded by the single-page application in a later session and never committed to git; no copy exists on disk, in history, or in temporary storage", "The simple page the user liked appeared to vanish permanently", "Rebuilt from the surviving wireframe design; now a separate, committed file"],
    ["2", "The logo, top navigation, mobile menu, footer, and the 404 page's own recovery button all navigate to #/home, but the route table registers the home view only under the empty pattern; fragment #/home matched nothing", "Clicking Home rendered \"Page not found\" on every page of the site, which reads as \"the website is broken\"", "Repaired: route alias registered in three copies of the code"],
    ["3", "renderRoute marks the active navigation button, then renderChrome rebuilds the navigation markup with the state hardcoded to false, erasing the mark", "The current page is never highlighted; the navigation appears dead", "Repaired: active state applied after the chrome rebuild"],
    ["4", "node_modules had been emptied between sessions, and the dynamically imported @electric-sql/pglite was never declared in package.json", "The backend test suite could not run at all until the package was reinstalled", "Restored; declaration recommended in section 8"],
  ],
  [6, 40, 30, 24]
));
bodyChildren.push(h2("5.1 Why the site \"disappeared\""));
bodyChildren.push(body("Cause 1 explains the disappearance the user described. Deliverables in this environment live as files linked from a conversation, not as a hosted site with a stable URL; a file that is superseded stops being linked and is effectively gone from view. The early simple landing page met exactly this fate: it was replaced in a later turn by the full application, and because it was never committed, no copy survived to restore. The application itself never disappeared from disk at any point, as the four committed versions in git history confirm."));
bodyChildren.push(h2("5.2 Why the site \"did not render correctly\""));
bodyChildren.push(body("Cause 2 is the genuine rendering defect and it is severe in presentation while small in code. The application rendered normally when opened at its root fragment, which is why it \"worked for a short period\" on arrival. The moment the user clicked Home, the logo, or any footer home link, the router produced the 404 view, and the 404 view's own \"Go to the homepage\" button led back to the same 404, trapping the session in an error loop. Combined with cause 3, which removed all visual feedback of the current page, the site read as broken even though every other route rendered correctly."));

/* 6. Recovery actions */
bodyChildren.push(h1("6. Recovery Actions Performed"));
bodyChildren.push(body("Recovery followed the requested priority order: preserve first, recover from history where possible, repair in place, and recreate only what cannot be recovered. Each action below names the files touched and is captured in version control."));
bodyChildren.push(bodyRuns([
  { text: "Safety point. ", bold: true },
  { text: "Before any modification, the branch recovery/2026-11-26-audit-point was created at the pre-repair commit 91809d8, preserving the exact audited state for rollback. All subsequent work is captured in commit 7227ef6 on the main branch." },
]));
bodyChildren.push(bodyRuns([
  { text: "Route repair. ", bold: true },
  { text: "One line was added after the home route registration: route(\"home\", ROUTES[0].view), registering the #/home fragment as an alias of the home view. The repair was applied identically in three places so no copy drifts: the built application, the backend's served copy at public/index.html, and the application source module views1.js." },
]));
bodyChildren.push(bodyRuns([
  { text: "Navigation-state repair. ", bold: true },
  { text: "renderChrome now applies the active-page attribute after it rebuilds the navigation markup, using the route path it already receives, with the empty home path mapped to the home button. The same three copies were patched." },
]));
bodyChildren.push(bodyRuns([
  { text: "Dependency restore. ", bold: true },
  { text: "@electric-sql/pglite was reinstalled into the backend's node_modules, restoring the embedded PostgreSQL engine the test suite and local server run on. The install was deliberately not added to package.json dependencies, because the production driver is the standard pg package, loaded only when a real database URL is configured; section 8 recommends declaring it as a development dependency instead." },
]));
bodyChildren.push(bodyRuns([
  { text: "Landing page recreation. ", bold: true },
  { text: "Because no copy of the original simple page survived, it was rebuilt rather than recovered. The surviving design wireframe supplied the original information architecture, and the rebuilt page implements all eleven requested sections with real content only: navigation bar, hero with a \"Start Learning\" call to action, the eighteen-stage roadmap, four learning subjects, the mathematics and programming introduction, the practical projects section, the interactive learning section, the book library with working DOCX and PDF links, a final call to action, and a professional footer. The page shares its design tokens with the main application so the two cannot drift visually. One error in the draft was caught before delivery: the programming course link used a guessed course code, which was corrected to the actual code prog1 after checking the seeded curriculum." },
]));

/* 7. Verification */
bodyChildren.push(h1("7. Verification and Test Results"));
bodyChildren.push(body("Prompt 2 of the brief forbids reporting success until the page has actually rendered and been checked. Every claim in this report was therefore verified after repair, in a real browser where possible. Table 3 lists each check and its result; no check was skipped or inferred."));
bodyChildren.push(caption("Table 3: Post-repair verification matrix"));
bodyChildren.push(table(
  ["Check", "Method", "Result"],
  [
    ["Backend regression suite", "npm test (19 test files, embedded PostgreSQL)", "96 pass, 0 fail, 0 skipped"],
    ["Home navigation button", "Click the button in the rendered application", "Renders Home; fragment #/home; active state \"page\""],
    ["Direct #/home URL", "Load the fragment directly", "Renders Home (previously \"Page not found\")"],
    ["Logo and 404-page buttons", "Click each in the rendered application", "Both render Home"],
    ["Active navigation highlight", "Inspect aria-current after route changes", "Correct button marked on every route"],
    ["All landing page deep links", "Drive 16 route targets in a browser", "16 of 16 render their real page, none 404"],
    ["Book download links", "File existence check for every href", "All 8 referenced files exist beside the page"],
    ["Served root URL", "HTTP GET on the live backend, port 8787", "HTTP 200, 348,413 bytes, correct title"],
    ["Console errors", "Browser console after 13 routes and all clicks", "Zero errors"],
    ["Mobile layout", "375-pixel viewport measurement", "No horizontal overflow on either page"],
  ],
  [30, 38, 32]
));
bodyChildren.push(...figure(PV + "/17-served-root-url.png", "Figure 1: The homepage rendering at the served root URL after repair"));
bodyChildren.push(...figure(PV + "/16-landing-upgraded-full.png", "Figure 2: The rebuilt landing page with all eleven sections", 330));
bodyChildren.push(body("The two figures above were captured from the live artefacts after repair: Figure 1 shows the application at the served root URL with the Home route working, and Figure 2 shows the full rebuilt landing page. The landing page was additionally re-measured at a 375-pixel viewport to confirm the responsive collapse of every grid to a single column without horizontal scrolling."));

/* 8. Conclusions */
bodyChildren.push(h1("8. Conclusions and Recommendations"));
bodyChildren.push(body("The verdict is positive on all five objectives. The exact root causes were identified without modifying the project; a rollback point was created before any repair; the homepage now renders at the root URL both as a file and when served by the backend; every visible link on both pages leads to a valid page or a real file; and the landing page and application now share one explicit design-token set, with the styles inline in each file so there is no external stylesheet that could fail to load. The test suite that could not run at the start of the session passes 96 of 96 at the end of it."));
bodyChildren.push(body("Four recommendations follow directly from the findings, each aimed at the specific failure mode that produced this incident:"));
const recs = [
  "Declare @electric-sql/pglite as a development dependency in package.json. The empty node_modules found in this audit would otherwise recur on any fresh checkout, silently breaking the test suite again.",
  "Add the navigation buttons themselves to the end-to-end journeys. The existing suite and journeys navigate by URL fragment, which is why a broken Home button survived a 96-test run; clicking every visible navigation control once would have caught it.",
  "Keep the landing page as a separate, always-committed file, and never let a new deliverable overwrite an old filename. The original simple page was lost precisely because its successor took over its role in the conversation while the file itself was never versioned.",
  "Treat content counts as data, not copy. The verified counts (15 projects, 9 labs, 56 glossary terms, no flashcards) should be sourced from the seeded curriculum file wherever they are restated, so no future summary repeats the 30-project error this audit corrected.",
];
recs.forEach((r) => {
  bodyChildren.push(new Paragraph({
    numbering: { reference: "recs", level: 0 },
    spacing: { line: 312, after: 100 },
    children: [new TextRun({ text: r, size: 24, color: "000000", font: { ascii: "Times New Roman", hAnsi: "Times New Roman" } })],
  }));
});
bodyChildren.push(body("Nothing in the recovery changed the framework, the data model, the curriculum content, or any user-visible behaviour other than the two repaired defects. The site that the user saw working briefly is the same site that now works, with its simple front door restored beside it."));

/* Appendix A */
bodyChildren.push(h1("Appendix A: Recovery Points in Version Control"));
bodyChildren.push(caption("Table 4: Git landmarks for this recovery"));
bodyChildren.push(table(
  ["Reference", "Meaning"],
  [
    ["91809d8", "Pre-repair state of the entire project, as audited; every finding in section 5 reproduces from this commit"],
    ["recovery/2026-11-26-audit-point", "Branch pinned to 91809d8 as the rollback point, created before any modification"],
    ["7227ef6", "Recovery commit: route alias, navigation-state fix (in three file copies), PGlite restore, eleven-section landing page, verification screenshots"],
  ],
  [34, 66]
));

/* Appendix B */
bodyChildren.push(h1("Appendix B: Shared Design Tokens"));
bodyChildren.push(body("The landing page and the application now define the same token names with the same values, which is the styling standardisation requested in the brief. The tokens live in the root style block of each file; a change made to the application palette can be applied to the landing page by copying the same values."));
bodyChildren.push(caption("Table 5: Design tokens shared by the landing page and the application"));
bodyChildren.push(table(
  ["Token", "Value", "Role"],
  [
    ["--ink-900 / --ink-700", "#1A2330 / #2C3440", "Primary text and headings"],
    ["--slate-600 / --slate-500", "#46566B / #68727E", "Secondary text"],
    ["--amber-500 / --amber-700 / --amber-800", "#C27E4D / #A55F33 / #8F5229", "Primary actions and accents"],
    ["--teal-700 / --teal-50", "#2E7D74 / #F0FDF4", "Secondary accent and its tint"],
    ["--surface / --surface-2 / --line", "#F5F7FA / #EEF2F6 / #D9DEE4", "Backgrounds and hairline borders"],
    ["--r-s / --r-m / --r-l", "6px / 10px / 14px", "Corner radii scale"],
    ["--sh-1 / --sh-2", "subtle / elevated shadows", "Card elevation"],
  ],
  [30, 28, 42]
));

/* ---------- document assembly ---------- */
const doc = new Document({
  numbering: {
    config: [{
      reference: "recs",
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", hAnsi: "Times New Roman" }, size: 24, color: "000000" },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Times New Roman", hAnsi: "Times New Roman" }, size: 32, bold: true, color: "0A1628" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: { ascii: "Times New Roman", hAnsi: "Times New Roman" }, size: 30, bold: true, color: "0A1628" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    },
  },
  sections: [
    { /* cover */
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "FDE Academy Website Recovery Audit",
        englishLabel: "RECOVERY AUDIT",
        subtitle: "Root-cause investigation and verified restoration of the FDE Academy website",
        metaLines: [
          "Project: FDE Academy learning platform (SPA + Node.js backend)",
          "Prepared by: Z.ai agent mode",
          "Date: 26 November 2026",
          "Status: Recovered — 96/96 tests green, all links verified",
        ],
        footerLeft: "FDE Academy",
        footerRight: "26 November 2026",
      }),
    },
    { /* front matter: TOC, roman numerals */
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: { default: pageNumFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", hAnsi: "Times New Roman" }, color: "0A1628" })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \"Update Field\".",
            italics: true, size: 18, color: "888888", font: { ascii: "Times New Roman" },
          })],
        }),
        /* no trailing PageBreak: the body starts a new section (nextPage) already */
      ],
    },
    { /* body: arabic from 1 */
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: { default: bodyHeader() },
      footers: { default: pageNumFooter() },
      children: bodyChildren,
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(DL + "/FDE_Academy_Audit_and_Recovery_Report.docx", buf);
  console.log("wrote", DL + "/FDE_Academy_Audit_and_Recovery_Report.docx", buf.length, "bytes");
});
