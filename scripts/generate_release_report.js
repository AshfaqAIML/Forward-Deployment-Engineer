/* generate_release_report.js — FDE Academy Release Testing Report (PROMPT 13).
 * Reuses report_lib.js (docx skill R1 cover / WM-1 palette / 3-section numbering).
 */
const L = require("./report_lib.js");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Header, Footer, PageNumber,
  NumberFormat, AlignmentType, TableOfContents, SectionType, P, BODY, GRAY,
  FONT, buildCoverR1, h1, h2, h3, body, caption, attrTable, dataTable,
  tableTitle, numbered, fs, sizeOf,
} = L;

const OUT = "/home/z/my-project/download/FDE_Academy_Release_Testing_Report.docx";
const chartBuf = fs.readFileSync("/home/z/my-project/scripts/release_chart.png");
const dims = sizeOf.imageSize ? sizeOf.imageSize(chartBuf) : sizeOf(chartBuf);
const chartW = 560;
const chartH = Math.round(chartW * (dims.height / dims.width));

function romanFooter() {
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "878787", font: FONT })] })] });
}
function arabicFooter() {
  return new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })] })] });
}
function bodyHeader() {
  return new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    border: { bottom: { style: "single", size: 2, color: P.table.innerLine } },
    children: [new TextRun({ text: "FDE Academy — Release Testing Report", size: 18, color: GRAY, font: FONT })] })] });
}

const content = [];

/* ── 1. Executive summary ── */
content.push(h1("Executive Summary"));
content.push(body(
  "This report documents the integration, deployment and final testing of the FDE Academy platform " +
  "as one working product. The components built and audited across the project — the curriculum and " +
  "its PostgreSQL-backed API, the six-book print library, the single-page website, authentication, " +
  "quizzes, the exercise system, the project centre, dashboards, the administrative content " +
  "management system and the AI tutor service — now run as a single production process: the Node.js " +
  "server serves the website and the API from one origin, with the database and private file storage " +
  "behind them. A live-platform bridge added to the website connects the previously local-first " +
  "experience to the server: accounts, graded lesson quizzes, cloud progress and the real print-edition " +
  "downloads now sync, while every feature keeps working offline."));
content.push(body(
  "Final testing exercised both complete user journeys against the running production deployment. " +
  "The student journey — open the site, register, start Mathematics for FDEs, read a lesson, complete " +
  "an exercise, pass the quiz, download the DOCX book, download the matching PDF, observe progress, " +
  "continue to the next stage — passed ten of ten steps. The administrator journey — create a course, " +
  "add and publish its lesson, verify a student sees it, upload a new book edition and confirm a " +
  "byte-exact student download — passed eight of eight steps. The regression suite stands at 96 of 96 " +
  "tests, including three new tests written for the integration: the bundled website is served, the " +
  "health probe stays machine-readable, and DOCX and PDF download requests return genuinely different " +
  "files."));
content.push(body(
  "Integration testing found one real product defect — the download endpoint ignored the requested " +
  "format and always returned the newest edition, so a DOCX request could deliver the PDF — and it was " +
  "fixed at the source with a dedicated regression test. Two smaller issues were test-side mistakes, " +
  "corrected without product changes. All six books are published in the production library as real " +
  "DOCX and PDF editions of roughly 450 to 660 kilobytes each; no placeholder data remains in any " +
  "delivered surface."));

/* ── 2. Integration scope ── */
content.push(h1("Integration Scope and Method"));
content.push(body(
  "The integration requirement listed fifteen components. Table 1 records how each is connected and " +
  "what verifies it. Everything runs from one process: the server binds a port, serves the bundled " +
  "single-page application at the root path, and exposes the versioned API beside it. Same-origin " +
  "serving removes the need for cross-origin headers in the standard deployment; the option remains " +
  "for CDN-hosted frontends. The database is PostgreSQL — embedded and file-backed in the reference " +
  "deployment, external through DATABASE_URL in hosted production. Private book files live outside " +
  "the web root and are streamed only through signed, single-use, expiring download tokens."));
content.push(tableTitle("Table 1: Component integration and verification"));
content.push(dataTable(
  ["Component", "How it is integrated", "Verified by"],
  [
    ["Website frontend", "bundled and served by the backend at / (public/index.html); live-platform bridge script syncs accounts, quizzes, progress, downloads", "unit test (GET /), student journey step 1"],
    ["Backend API", "91 routes across 13 modules on one Node process", "96/96 test suite, both journeys"],
    ["PostgreSQL database", "migrations + seed; embedded (file-backed) in the reference deployment, external via DATABASE_URL", "migrate/seed logs, journeys"],
    ["Authentication", "register/login, rotating refresh tokens, reset flow, argin2id-class hashing; bridge syncs accounts", "auth tests; journey step 2"],
    ["Course system", "catalog + curriculum tree; Mathematics first subject", "journey step 3"],
    ["Learning roadmap", "18 stages derived from subjects/stages/courses", "curriculum tree test; step 10"],
    ["Book library", "books + chapters from the database; editions attached by the publisher", "books QC 44/44; steps 7-8"],
    ["DOCX downloads", "token flow with format selection", "journey step 7 (PK magic bytes)"],
    ["PDF downloads", "token flow with format selection", "journey step 8 (%PDF magic bytes)"],
    ["Quizzes", "graded attempts gate lesson completion; bridge posts answers", "quiz tests; journey step 6"],
    ["Exercise system", "coding labs with submissions and history", "journey step 5"],
    ["Project centre", "15 projects with submissions and evaluation workflow", "admin API tests; analytics"],
    ["Student dashboard", "progress, mastery, recommendation endpoints; cloud card in the SPA", "journey steps 9-10"],
    ["Admin CMS", "course/module/chapter/lesson authoring, revisions, publish events", "admin journey steps 2-7"],
    ["AI learning assistant", "grounded tutor service (explain, hints, math steps, practice) behind auth", "AI tutor tests; status probe"],
  ],
  [20, 46, 34]
));
content.push(body(
  "Environment: Node.js 24 on Linux, server bound to 127.0.0.1:8787, fresh database migrated and " +
  "seeded by ops/deploy.sh with a generated JWT secret, books published by the pipeline's publisher " +
  "against the running server. The two journey scripts are deterministic, use only public interfaces, " +
  "and are shipped with the source so any deployment can re-run them in minutes."));

/* ── 3. Results overview ── */
content.push(h1("Verification Results"));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 },
  children: [new ImageRun({ data: chartBuf, transformation: { width: chartW, height: chartH }, type: "png" })],
}));
content.push(caption("Figure 1: Every automated suite in the release bar is green."));
content.push(tableTitle("Table 2: Release gate"));
content.push(dataTable(
  ["Gate", "Result", "Evidence"],
  [
    ["Backend regression suite", "96 / 96", "node --test, 14 test files"],
    ["Student journey (10 steps)", "10 / 10", "scripts/e2e_student.py against the live deployment"],
    ["Admin journey (8 steps)", "8 / 8", "scripts/e2e_admin.py against the live deployment"],
    ["Print books published", "6 / 6", "publisher log; DOCX+PDF editions 450-660 KB each"],
    ["Book quality gate (re-run)", "44 / 44", "audit_books.py: TOC, answer keys, figures, references"],
    ["Frontend static checks", "12 / 12", "viewport, anchors, labels, route agreement"],
    ["Secrets scan", "clean", "no committed secrets; .env gitignored and excluded from packages"],
  ],
  [34, 18, 48]
));

/* ── 4. Student journey ── */
content.push(h1("Student Journey Results"));
content.push(body(
  "The journey follows the ten steps specified for final testing, executed against the live " +
  "deployment exactly as a browser would: the website is fetched from the server root, the account " +
  "is created through the public registration endpoint, and every learning action goes through the " +
  "same API the website's bridge calls. Quiz answers come from the approved curriculum source, the " +
  "ground truth the platform itself scores against."));
content.push(tableTitle("Table 3: Student journey — ten specified steps"));
content.push(dataTable(
  ["#", "Step", "Result", "Evidence"],
  [
    ["1", "Opens the website", "PASS", "GET / returns the full SPA (335 KB) including the live-platform bridge"],
    ["2", "Creates an account", "PASS", "registration 201, access + rotating refresh tokens issued"],
    ["3", "Starts Mathematics for FDEs", "PASS", "curriculum tree: Mathematics is the first subject; fm course opens"],
    ["4", "Reads a lesson", "PASS", "fm-1 serves objectives and 9 content blocks incl. worked steps"],
    ["5", "Completes an exercise", "PASS", "coding lab submission stored and listed in my submissions"],
    ["6", "Takes a quiz", "PASS", "graded attempt scored 100%, passed at the 70% gate"],
    ["7", "Downloads the DOCX book", "PASS", "token flow; 453,762 bytes, PK zip magic bytes"],
    ["8", "Downloads the matching PDF", "PASS", "token flow; 610,728 bytes, %PDF header"],
    ["9", "Tracks learning progress", "PASS", "dashboard: 1 lesson done, Foundation Mathematics 17%"],
    ["10", "Continues to the next stage", "PASS", "recommendation returns the next lesson; it loads"],
  ],
  [6, 26, 12, 56]
));

/* ── 5. Admin journey ── */
content.push(h1("Admin Journey Results"));
content.push(body(
  "The administrator journey covers content creation and library operations: authoring a course " +
  "through the CMS, publishing it, confirming students can learn from it immediately, and shipping a " +
  "new book edition through the private upload flow. The final check compares downloaded bytes with " +
  "the uploaded file byte for byte, proving the whole storage path — upload, checksum, private " +
  "storage, tokenised streaming — preserves content exactly."));
content.push(tableTitle("Table 4: Admin journey"));
content.push(dataTable(
  ["#", "Step", "Result", "Evidence"],
  [
    ["1", "Signs in as administrator", "PASS", "admin login issues role-scoped token"],
    ["2", "Creates a course", "PASS", "draft course created with objectives and stage placement"],
    ["3", "Authors module, chapter, lesson", "PASS", "published lesson with validated content blocks"],
    ["4", "Publishes the course", "PASS", "status published; publish event recorded"],
    ["5", "Student visibility", "PASS", "a student account sees the course and reads the lesson"],
    ["6", "Uploads a book edition file", "PASS", "private file stored, SHA-256 checksummed"],
    ["7", "Attaches the edition", "PASS", "v1.1.0 DOCX edition attached to Foundation Mathematics"],
    ["8", "Student downloads it", "PASS", "downloaded bytes identical to the upload"],
  ],
  [6, 30, 12, 52]
));

/* ── 6. Defects found and fixed ── */
content.push(h1("Defects Found and Fixed During Integration"));
content.push(h2("D-01 — Download format selection ignored (fixed, product defect)"));
content.push(attrTable([
  ["Issue", "The book download endpoint always returned the newest edition regardless of the requested format"],
  ["Severity", "High — the website's separate DOCX and PDF buttons could both deliver the same file"],
  ["Location", "src/routes/downloads.js"],
  ["Explanation", "The endpoint accepted only an optional editionId; the format field the bridge sends was not honoured, so a DOCX request received the newest edition, which after publishing is usually the PDF."],
  ["Correction", "Format-aware selection: explicit editionId, then newest edition of the requested format, then newest overall. Documented in the API appendix."],
  ["Verification", "New regression test uploads two fake editions (zip and PDF magic bytes) through the CMS and asserts each format request returns its own file; student journey steps 7 and 8 assert real magic bytes."],
]));
content.push(h2("D-02/D-03 — Test-side mistakes (no product change)"));
content.push(attrTable([
  ["Issue", "Two journey/test failures caused by the tests, not the product"],
  ["Severity", "None (test correctness)"],
  ["Location", "test/static.test.js; scripts/e2e_student.py"],
  ["Explanation", "The exercise step used a lesson code instead of an exercise code (404); the edition test read the upload response's id field under the wrong name, so no file was attached and the test then failed against the product correctly."],
  ["Correction", "Exercise code corrected to the coding-lab code; upload field read as id (the request field remains fileId, as documented)."],
  ["Verification", "Suite 96/96 and both journeys pass after the test fixes; no server code changed for these two."],
]));
content.push(body(
  "No other product defects surfaced during integration: the remaining failures investigated during " +
  "the session were a stale server process and a shell process-identifier mismatch, both environment " +
  "noise rather than code."));

/* ── 7. Deliverables ── */
content.push(h1("Deliverables Checklist"));
content.push(tableTitle("Table 5: PROMPT 13 deliverables and where they live"));
content.push(dataTable(
  ["Deliverable", "Location"],
  [
    ["Working production website", "single process: bash ops/deploy.sh serves SPA + API on :8787"],
    ["Complete source code", "fde-academy-backend.zip and fde-book-pipeline.zip (secrets excluded)"],
    ["Database schema", "src/db/migrations/*.sql + docs/SCHEMA.md (+ ER diagram)"],
    ["Deployment guide", "docs/DEPLOYMENT.md (config, migrations, storage, backup, rollback, systemd)"],
    ["Administrator guide", "docs/ADMIN_GUIDE.md (roles, CMS workflow, editions, health)"],
    ["Book collection", "six books, 37 chapters — dist/ DOCX + PDF and the live library"],
    ["Downloadable DOCX and PDF", "library token flow (both formats) and dist/ files"],
    ["Testing report", "this document (DOCX + PDF)"],
    ["Known limitations", "docs/LIMITATIONS.md"],
    ["Future improvement roadmap", "docs/LIMITATIONS.md roadmap section (R1-R10)"],
  ],
  [34, 66]
));

/* ── 8. Limitations and verdict ── */
content.push(h1("Known Limitations and Verdict"));
content.push(body(
  "The honest boundaries of this release are documented in full in docs/LIMITATIONS.md. In summary: " +
  "the deployment is single-process by design; the bridge syncs the core journeys while topic tests, " +
  "the mock exam, notes and the labs remain browser-local; email delivery for password reset is not " +
  "wired (tokens are issued but need an operator channel or an SMTP integration); monitoring is " +
  "log-based with a health probe; and the quiz pool per lesson is fixed. None of these are placeholders " +
  "— they are scoped, documented work items on the improvement roadmap, sized from days to weeks."));
content.push(body(
  "Verdict: the platform is complete for release. Every specified student and admin journey step " +
  "passes against the running production deployment, the regression suite is fully green, the six " +
  "books ship as real DOCX and PDF editions through a secure token flow, and no placeholder data or " +
  "committed secrets remain anywhere in the delivered system. The release gate defined by the two " +
  "end-to-end journeys is met, and both scripts ship with the source so the gate can be re-run on any " +
  "future deployment in under ten minutes."));

/* ══ document ══ */
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: FONT, size: 24, color: BODY }, paragraph: { spacing: { line: 312 } } },
      heading1: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: P.primary },
        paragraph: { spacing: { before: 360, after: 160, line: 312 }, outlineLevel: 0 } },
      heading2: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 30, bold: true, color: P.primary },
        paragraph: { spacing: { before: 280, after: 120, line: 312 }, outlineLevel: 1 } },
      heading3: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: P.primary },
        paragraph: { spacing: { before: 220, after: 100, line: 312 }, outlineLevel: 2 } },
    },
  },
  sections: [
    {
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
      children: buildCoverR1({
        title: "FDE Academy Release Testing Report",
        subtitle: "Integration, deployment and final end-to-end testing of the complete educational platform",
        englishLabel: "RELEASE VERIFICATION",
        metaLines: [
          "Student journey: 10 of 10 steps passed",
          "Admin journey: 8 of 8 steps passed",
          "Regression suite: 96 of 96 tests green",
          "Books: six titles, DOCX and PDF editions published",
          "Date: 25 November 2026",
        ],
        footerLeft: "FDE Academy",
        footerRight: "PROMPT 13 final testing",
      }),
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
      },
      footers: { default: romanFooter() },
      children: [
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })] }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ spacing: { before: 200 },
          children: [new TextRun({ text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \u201CUpdate Field.\u201D", italics: true, size: 18, color: "888888", font: FONT })] }),
        // no trailing PageBreak — the body starts its own NEXT_PAGE section
      ],
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
      },
      headers: { default: bodyHeader() },
      footers: { default: arabicFooter() },
      children: content,
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("written:", OUT, buf.length, "bytes");
});
