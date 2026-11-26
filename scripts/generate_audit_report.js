/* generate_audit_report.js — main content + assembly (uses report_lib.js). */
const L = require("./report_lib.js");
const {
  Document, Packer, Paragraph, TextRun, ImageRun, PageBreak, Header, Footer,
  PageNumber, NumberFormat, AlignmentType, TableOfContents, SectionType,
  LevelFormat, P, BODY, GRAY, FONT, buildCoverR1, h1, h2, h3, body, bodyRuns,
  caption, attrTable, dataTable, tableTitle, numbered, fs, sizeOf,
} = L;

const OUT = "/home/z/my-project/download/FDE_Academy_Quality_Audit_Report.docx";

// ── chart image ──
const chartBuf = fs.readFileSync("/home/z/my-project/scripts/audit_chart.png");
const dims = sizeOf.imageSize ? sizeOf.imageSize(chartBuf) : sizeOf(chartBuf);
const chartW = 560;
const chartH = Math.round(chartW * (dims.height / dims.width));

// ── footers (marker colors drive the post-processing format patch) ──
function romanFooter() {
  return new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "878787", font: FONT })],
  })]});
}
function arabicFooter() {
  return new Footer({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: FONT })],
  })]});
}
function bodyHeader() {
  return new Header({ children: [new Paragraph({
    alignment: AlignmentType.CENTER,
    border: { bottom: { style: "single", size: 2, color: P.table.innerLine } },
    children: [new TextRun({ text: "FDE Academy — Educational Quality Audit", size: 18, color: GRAY, font: FONT })],
  })]});
}

// ══ body content ══
const content = [];

// ── 1. Executive Summary ──
content.push(h1("Executive Summary"));
content.push(body(
  "This report presents the results of an independent, end-to-end educational quality audit of the FDE Academy " +
  "ecosystem, performed on 25 November 2026 against the audit specification in PROMPT 12. The audit covered seven " +
  "areas: language simplicity, mathematical correctness, programming and technical accuracy, curriculum design, the " +
  "printed book collection, the live website, and the experience of a complete beginner. Nothing was accepted on " +
  "trust: every calculation was recomputed with exact rational arithmetic, every code sample was executed, every " +
  "automated test suite was run, every book file was reopened and re-rendered, and the live platform was probed " +
  "endpoint by endpoint with a dedicated 42-point script."));
content.push(body(
  "The audit found 19 findings in total: one critical, one high, two medium, three low, and twelve items that were " +
  "investigated and confirmed to be deliberate, documented design decisions rather than defects. The single critical " +
  "finding was a wrong answer key in the Algebra course: the platform marked \u00A368 as the correct answer to the " +
  "basket-cost question when the correct answer is \u00A364. Because assessment integrity is the highest-risk class " +
  "of defect, the error was corrected at the source before this report was finished, in all nine places where the " +
  "wrong value appeared, and the correction was verified four independent ways: recomputation, the full backend test " +
  "suite (93 of 93 passing), a live end-to-end quiz attempt on a freshly seeded server that scored \u00A364 as correct, " +
  "and a rebuild of the printed Algebra book whose answer key now carries the corrected value."));
content.push(body(
  "After corrections, every audit area passes. All 27 extracted arithmetic claims verify; all five lesson code " +
  "samples run and produce the outputs their lessons promise; the backend suite is 93 of 93; the six printed books " +
  "pass all 44 book checks, including exact table-of-contents page numbers and answer keys that match the approved " +
  "source; the website probe passes all flows it can automate, with three behaviours verified as intentional " +
  "design; and the frontend passes all 12 static checks. The platform can be marked complete for release, subject " +
  "to the routine recommendations in Section 7, the most important of which is to run the book publisher after " +
  "every fresh deployment so the library serves the full print editions."));

// ── 2. Scope, Environment and Methodology ──
content.push(h1("Scope, Environment and Methodology"));
content.push(h2("What was audited"));
content.push(body(
  "The audit covered the entire ecosystem as it exists in the project workspace. The curriculum corpus comprises " +
  "4 subjects, 18 roadmap stages, 8 courses with declared prerequisites, 34 lessons containing 78 teaching " +
  "paragraphs, 10 tables, 9 worked-step blocks, 31 exercises, 5 code listings, 8 interactive-data blocks, and 102 " +
  "knowledge-check questions; 6 books with 37 chapters rendered as 12 DOCX and PDF files; a glossary of 55 terms " +
  "(56 after the audit correction); 15 customer projects; 5 topic tests and 1 mock exam; 6 coding exercises and 3 " +
  "mathematics exercises. The technical estate comprises a Node.js backend with 91 API routes across 13 modules " +
  "and a 93-test suite, nine design and operations documents, a single-page frontend of roughly 336 kilobytes, and " +
  "the book production pipeline that generated the print editions."));
content.push(h2("How each area was audited"));
content.push(body(
  "Audit B (mathematics) recomputed every equation-like claim found by a scanner across lessons, books, tests, " +
  "exercises and projects, using exact rational arithmetic rather than floating point, plus nine targeted semantic " +
  "checks such as the break-even derivation and unit-price comparisons. Audit C (technical) executed all five " +
  "lesson code samples in Node v24 and compared their output with the claims in the surrounding teaching text, ran " +
  "the full backend test suite, verified installation and deployment instructions by following them on a clean " +
  "database, and reconciled the API documentation against the actual routes. Audit F (website) ran a 42-point live " +
  "probe against a freshly migrated and seeded server, covering registration, login, token rotation, password-reset " +
  "enumeration resistance, the student dashboard trio, course navigation, lesson content, the graded quiz attempt " +
  "flow, the completion gate, search, exercises, the glossary, book editions and downloads, the permission matrix " +
  "for student and anonymous users, error shapes, and CORS. Audit E (books) reopened every DOCX and PDF and verified " +
  "table-of-contents accuracy against the real chapter start pages, answer-key fidelity against the approved seed, " +
  "formatting consistency, figure quality, and that every reference URL resolves. Audits A and G (language and " +
  "beginner experience) combined a statistical scan of 34 lessons with manual adjudication of every flagged item. " +
  "Audit D (curriculum) checked module ordering, prerequisite direction, difficulty progression, objective-to-content " +
  "coverage, and the stage-to-project roadmap."));
content.push(h2("Severity scale"));
content.push(body(
  "Critical means the defect teaches something wrong or breaks an assessment: it must be fixed before release. " +
  "High means the defect blocks verification or operation but has a straightforward recovery. Medium means the " +
  "defect degrades the experience or the documentation without teaching anything wrong. Low means polish. Each " +
  "finding below states its location, an explanation of why it matters, the correction that was applied or " +
  "recommended, and the verification result that confirms the correction or the deliberate design."));

// ── 3. Results overview ──
content.push(h1("Audit Results Overview"));
content.push(body(
  "Figure 1 shows the distribution of the 19 findings by severity. The bar labelled \u201Cverified by design\u201D " +
  "counts behaviours that looked like defects on first inspection and were traced to documented, intentional " +
  "decisions; they are recorded in Section 5 because an auditor's job is to explain them, not to silently drop " +
  "them. Table 1 summarises the outcome of each audit area with the exact number of automated checks performed."));
content.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 120, after: 40 },
  children: [new ImageRun({ data: chartBuf, transformation: { width: chartW, height: chartH }, type: "png" })],
}));
content.push(caption("Figure 1: Findings by severity after correction. Critical and high findings are closed."));
content.push(tableTitle("Table 1: Audit areas, method and outcome"));
content.push(dataTable(
  ["Area", "Method", "Automated checks", "Outcome"],
  [
    ["A. Language", "Statistical scan + manual adjudication", "4", "Pass; 3 sentences rewritten"],
    ["B. Mathematics", "Exact rational recomputation", "27", "Pass; 1 critical fixed"],
    ["C. Technical", "Code execution + suite + docs diff", "91 routes, 93 tests, 5 samples", "Pass; docs extended"],
    ["D. Curriculum", "Structural analysis", "13", "Pass; all consistent"],
    ["E. Books", "Reopen + re-render both editions", "44", "Pass; 44 of 44"],
    ["F. Website", "Live 42-point probe + static checks", "42 + 12", "Pass; 3 by design; 1 a11y fix"],
    ["G. Beginner", "Term-coverage scan + adjudication", "2", "Pass; 1 glossary entry added"],
  ],
  [16, 34, 24, 26]
));

// ── 4. Findings ──
content.push(h1("Findings and Corrective Actions"));
content.push(body(
  "Each finding is stated with the six attributes the audit specification requires: the issue, its severity, its " +
  "location, an explanation, the recommended or applied correction, and the verification result observed after the " +
  "correction. Findings marked \u201Cfixed\u201D were corrected at the source during the audit, before this report " +
  "was finalised, so the delivered platform already contains the corrections described here."));

content.push(h2("Critical and high findings"));
content.push(h3("F-01 — Quiz marked the wrong option as correct (fixed)"));
content.push(attrTable([
  ["Issue", "Knowledge-check answer key wrong: \u00A368 marked correct, correct is \u00A364"],
  ["Severity", "Critical"],
  ["Location", "seed/content.json — lesson al-1 quiz 2 (\u201CCost = 40 + 2b for b = 12 is\u2026\u201D); the same value in the exercise solution, in five precomputed simplerExample strings, in the top-level quizzes array, and in the algebra book chapter"],
  ["Explanation", "The delivery van exercise costs C = 40 + 2b; at b = 12 the cost is 40 + 24 = \u00A364. The answer key and the printed solution said \u00A368, so the platform would have scored a correct student answer as wrong and taught a wrong substitution. Because the value also fed the AI tutor's prepared simpler examples and the book answer key, the error would have propagated to every surface that presents this question."],
  ["Correction", "Fixed at the source in all nine occurrences: answerIdx moved to the \u00A364 option, explanation rewritten to \u201C40 + 24 = 64\u201D with a note on why \u00A368 is wrong, exercise solution corrected, all simplerExample strings and the book chapter corrected."],
  ["Verification", "Math audit re-run: no failures among 27 claims. Backend suite 93/93. Live probe created a graded attempt, answered \u00A364 and the submission reported it correct. The Algebra book was rebuilt and its answer key now reads \u201CR2. \u00A364\u201D."],
]));
content.push(h3("F-02 — Backend test suite unrunnable in a recycled environment (resolved)"));
content.push(attrTable([
  ["Issue", "Full suite collapsed to 1 of 89 passing on re-run"],
  ["Severity", "High"],
  ["Location", "fde-academy-backend runtime environment (missing node_modules)"],
  ["Explanation", "The first full-suite run during this audit failed 88 tests with module-not-found errors for the embedded database engine. The cause was the sandbox having been recycled between sessions, which dropped the installed dependencies; the code, seed and tests were unaffected. The finding matters operationally: a reviewer who skips the documented npm install step sees a sea of red that looks like a broken platform."],
  ["Correction", "Followed the documented installation step (npm install), then re-ran the complete suite. No code change was required."],
  ["Verification", "93 of 93 tests pass, including the CMS edition test added with the book pipeline and the new audit-era seed changes."],
]));

content.push(h2("Medium findings"));
content.push(h3("F-03 — API documentation covered 37 of 88 routes (fixed)"));
content.push(attrTable([
  ["Issue", "API.md documented fewer than half of the implemented routes"],
  ["Severity", "Medium"],
  ["Location", "fde-academy-backend/docs/API.md"],
  ["Explanation", "A reconciliation against the registered routes found 37 documented and 88 implemented, leaving the entire admin and CMS surface — including the book-editions endpoint added by the print pipeline — effectively undocumented. Integration work would have relied on reading source code."],
  ["Correction", "Generated Appendix A in API.md: a complete, auto-derived index of all 91 routes grouped by module, plus a dedicated section for the book print-editions endpoint documenting its request body, file-privacy requirement and token-flow download."],
  ["Verification", "Re-diff shows 91 of 91 routes documented; the appendix is generated from the route definitions so it cannot drift silently."],
]));
content.push(h3("F-04 — Fresh deployment serves thin seed book files (documented workflow)"));
content.push(attrTable([
  ["Issue", "A newly seeded library offers only a small generated placeholder book file per title"],
  ["Severity", "Medium"],
  ["Location", "src/db/seed.js book-file generation; book library downloads"],
  ["Explanation", "The seeder writes a compact generated document per book so the library works out of the box, but the professionally produced DOCX and PDF editions exist only after the publisher runs. A fresh deployment therefore serves a 5.5 KB file where the finished book is roughly 600 KB. This is an intended two-step workflow, not corruption, but nothing reminded the operator of step two."],
  ["Correction", "Recorded as an operational requirement: run the book pipeline's publish step after seeding. The pipeline already refuses to publish books that failed their quality gate, so the step is safe to automate."],
  ["Verification", "Live probe confirmed the fresh library lists the seed edition and downloads it (200), and the published database serves the full DOCX and PDF editions with verified byte sizes."],
]));

content.push(h2("Low findings"));
content.push(h3("F-05 — Three sentences were unnecessarily long (rewritten)"));
content.push(attrTable([
  ["Issue", "Sentences of 48, 53 and 68 words in orientation, AI and problem-solving lessons"],
  ["Severity", "Low"],
  ["Location", "Lessons st-1, ai-4 and ps-4 (one sentence each)"],
  ["Explanation", "The average sentence across the corpus is 15.2 words, well inside the beginner target, but three sentences packed a worked calculation, a four-part structure and a scenario-plus-conclusion into single sentences. A beginner must re-read them to unpack the logic."],
  ["Correction", "Rewrote all three into short declarative sentences that keep every fact: the market-week arithmetic now states the weekday mean and market-day mean as separate sentences; the handover document reads as four labelled statements; the FDE description splits situation from action."],
  ["Verification", "Language scan re-run: average 15.2 words, no flagged sentence above the acceptable quote, proof or list structures; the Problem Solving book was rebuilt through its quality gate with the corrected text."],
]));
content.push(h3("F-06 — The logic term \u201Cargument\u201D was never defined (fixed)"));
content.push(attrTable([
  ["Issue", "Curriculum used \u201Cargument\u201D in its technical logic sense without a glossary entry"],
  ["Severity", "Low"],
  ["Location", "Lesson lo-2; glossary"],
  ["Explanation", "In everyday English an argument is a disagreement; in Logic & Proof it is a chain of premises ending in a conclusion. A beginner meeting \u201Cone counterexample converts an argument into a fact\u201D without a definition may read the everyday sense. Every other scanned technical term was either defined in the text or covered by the glossary."],
  ["Correction", "Added a glossary entry \u201CArgument (logic)\u201D with a simple meaning, a detailed explanation of validity, a concrete stallholder example, and related terms. The seeder's schema required the example and related fields, which the first attempt omitted — a useful schema lesson recorded here."],
  ["Verification", "Backend suite 93 of 93 after the schema-complete entry; the term-coverage scan no longer flags it."],
]));
content.push(h3("F-07 — One checkbox button had no accessible name (fixed)"));
content.push(attrTable([
  ["Issue", "Project demo-checklist button announced as unnamed checkbox by screen readers"],
  ["Severity", "Low"],
  ["Location", "FDE_Academy_Frontend.html project template"],
  ["Explanation", "Static accessibility checks passed for all other buttons: the step checkboxes carry aria-labels, images have alt text, inputs are labelled, landmarks and heading hierarchy are present, and all navigation anchors resolve. The demo-checklist button set role and state but no accessible name."],
  ["Correction", "Added aria-label \u201CDemo check N\u201D to the generated button."],
  ["Verification", "Static audit re-run: zero buttons without an accessible name; the frontend otherwise passes all 12 checks including viewport, fluid type, media queries and API-route agreement."],
]));

// ── 5. Verified by design ──
content.push(h1("Behaviours Verified as Deliberate Design"));
content.push(body(
  "Twelve behaviours flagged during the audit were investigated and confirmed to be intentional, documented " +
  "decisions. They are listed here with their rationale and the check that verified them, so that future reviewers " +
  "do not re-litigate them as defects. None of them teaches anything incorrect and none blocks a learner."));
content.push(tableTitle("Table 2: Investigated behaviours confirmed as intended"));
content.push(dataTable(
  ["Behaviour that looked suspicious", "Why it is correct", "Verification"],
  [
    ["Lesson completion returns 403 after a correct practice check", "Completion is gated on a passing graded attempt, not the unrecorded practice check — a deliberate anti-shortcut rule", "Graded attempt flow: submit reported passed, then completion returned 201"],
    ["No CORS header by default", "CORS is opt-in via FDE_CORS_ORIGIN for a same-origin deployment", "Header present when the variable is set; documented in SECURITY.md"],
    ["No in-app rate limiting", "Documented decision: enforce limits at the gateway; the app has zero runtime dependencies", "SECURITY.md states the policy; suite covers the security surfaces it claims"],
    ["Stages 3, 5 and 6 have no customer projects", "The roadmap meta for those stages promises a book and a topic test; projects attach to specific stages by design", "Stage metadata matches the delivered books and the five topic tests"],
    ["Orientation mentions break-even before Stage 2", "Forward promise in a motivation paragraph, not teaching", "Text reads as a preview; full teaching arrives in its own course"],
    ["Terms such as \u201Cexpand\u201D and \u201Cfixed cost\u201D flagged by the scanner", "Defined in context (parenthetical or worked definition) — scanner pattern too narrow", "Manual adjudication found the definitions in the flagged lessons"],
    ["Objective keywords absent from lesson text", "Objectives paraphrase the teaching; keyword matching was too literal", "Adjudicated: every objective maps to taught content"],
    ["Book library in fresh seed lists one edition per book", "Seed ships a working placeholder; full editions arrive via the publisher (F-04)", "Publish flow verified end to end with byte-size comparison"],
    ["AI tutor endpoints reject anonymous calls", "Tutor requires authentication; status endpoint is public", "Live probe: status 200 with modes; tutor call 401 without token"],
    ["Practice knowledge check returns no passed flag", "Practice mode is intentionally unrecorded; only graded attempts score", "Graded submission returns score and passed fields"],
    ["Progress API returns aggregates, not raw lesson ids", "Dashboard contract is course-level percentages and a recommendation", "Verified completion reflected as lessonsDone and per-course percentage"],
    ["Wireframe and diagram directories outside the main deliverables", "Design-era artefacts retained as project history", "Present and intact; not part of the release surface"],
  ],
  [30, 40, 30]
));

// ── 6. Corrected content registry ──
content.push(h1("Corrected Content Registry"));
content.push(body(
  "Every change the audit made to the delivered platform is listed in Table 3, together with the verification that " +
  "watched it land. The two rebuilt books carry the corrected answer key and the rewritten sentence respectively; " +
  "both rebuilt through their full quality gates, so their 44 checks were re-passed after the changes."));
content.push(tableTitle("Table 3: Changes applied during the audit"));
content.push(dataTable(
  ["File or surface", "Change", "Verified by"],
  [
    ["seed/content.json (quiz + book copies)", "\u00A368 corrected to \u00A364 in 9 places; explanation rewritten", "Math audit, 93/93 suite, live graded attempt, rebuilt book"],
    ["seed/content.json (st-1, ai-4, ps-4)", "Three overlong sentences split into short declaratives", "Language scan re-run; Problem Solving book rebuilt"],
    ["seed/content.json (glossary)", "Added \u201CArgument (logic)\u201D entry with example and related terms", "93/93 suite after schema-complete insert"],
    ["docs/API.md", "Appendix A: full 91-route index; editions endpoint documented", "Route diff: 91 of 91 covered"],
    ["FDE_Academy_Frontend.html", "aria-label added to demo-checklist button", "Static audit: zero unnamed buttons"],
    ["Algebra book (DOCX + PDF)", "Rebuilt with corrected answer key", "Book gate re-passed; answer key reads \u00A364"],
    ["Problem Solving book (DOCX + PDF)", "Rebuilt with rewritten sentence", "Book gate re-passed"],
    ["Backend environment", "npm install per README after environment reset", "Full suite 93/93"],
  ],
  [26, 40, 34]
));

// ── 7. Recommendations ──
content.push(h1("Remaining Recommendations"));
content.push(body(
  "Nothing below blocks a release. These are the actions that keep the platform healthy as it evolves, with an " +
  "owner and a moment in the workflow for each."));
content.push(numbered("Run the book publisher after every fresh deployment so the library serves the full print editions from day one (operations, deploy checklist).", "rec-list"));
content.push(numbered("Keep the seed-to-database glossary contract in mind when adding terms: the seeder requires simple, detailed, example, related and category fields (content editors).", "rec-list"));
content.push(numbered("Re-run the three audit scripts (mathematics, books, website probe) whenever lesson content, book sources or routes change; they are deterministic and take minutes (QA, per change).", "rec-list"));
content.push(numbered("Mirror the book-editions endpoint documentation into CMS.md at the next documentation pass (technical writer).", "rec-list"));
content.push(numbered("Consider scoring the five remaining long sentences that are quotes, proofs or arrow lists on a future language pass; they are acceptable but not perfect (content team).", "rec-list"));

// ── 8. Verdict ──
content.push(h1("Verdict"));
content.push(body(
  "The audit verdict is a pass. The one critical defect found was fixed at the source and verified four independent " +
  "ways before this report was finalised; the high-severity environment issue was resolved by following the " +
  "documented installation; both medium findings are corrected or explicitly documented with an operational " +
  "action; and all three low findings are fixed. Every audit area now passes its checks: mathematics 27 of 27 " +
  "claims verified, books 44 of 44, backend 93 of 93 tests, website probe 42 of 42 points accounted for (39 " +
  "automated passes plus three behaviours verified as intentional), frontend 12 of 12, curriculum and language " +
  "clean after adjudication. The platform is fit to be marked complete for release, with the recommendations above " +
  "as ongoing hygiene rather than open defects."));

// ── Appendix ──
content.push(h1("Appendix A: Evidence Summary"));
content.push(tableTitle("Table 4: Where each number in this report comes from"));
content.push(dataTable(
  ["Evidence", "Source", "Result"],
  [
    ["Arithmetic claims recomputed", "audit_math.py over seed corpus + 9 targeted checks", "27 checked; 1 failed and was fixed; re-run clean"],
    ["Quiz integrity end to end", "Live graded attempt on fresh seed", "\u00A364 accepted and scored correct"],
    ["Backend suite", "node --test (13 files)", "93 tests, 93 passing"],
    ["Code samples", "Node v24 execution of 5 lesson listings", "All run; outputs match teaching claims"],
    ["Books", "audit_books.py over 6 DOCX + 6 PDF", "44 of 44 checks; TOC exact; 132 answers match seed"],
    ["Website probe", "audit_site.py against fresh server", "39 automated passes; 3 verified by design"],
    ["Frontend static audit", "Markup and route-agreement checks", "12 of 12 after the aria fix"],
    ["Language scan", "audit_lang_curr.py + adjudication", "Average 15.2 words; abbreviations all introduced"],
    ["Curriculum structure", "audit_lang_curr.py structural checks", "Order, prerequisites, progression all consistent"],
    ["References", "HTTP resolution of 6 unique URLs", "All resolve"],
    ["API documentation", "Route reconciliation", "91 of 91 documented after fix"],
  ],
  [26, 40, 34]
));

// ══ assemble document ══
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: BODY },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: P.primary },
        paragraph: { spacing: { before: 360, after: 160, line: 312 }, outlineLevel: 0 },
      },
      heading2: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 30, bold: true, color: P.primary },
        paragraph: { spacing: { before: 280, after: 120, line: 312 }, outlineLevel: 1 },
      },
      heading3: {
        run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: P.primary },
        paragraph: { spacing: { before: 220, after: 100, line: 312 }, outlineLevel: 2 },
      },
    },
  },
  numbering: {
    config: [{
      reference: "rec-list",
      levels: [{
        level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    }],
  },
  sections: [
    { // 1. cover — no footer, no page numbers
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "FDE Academy Educational Quality Audit",
        subtitle: "Independent audit of the complete learning platform: language, mathematics, code, curriculum, books, website and the beginner experience",
        englishLabel: "QUALITY ASSURANCE REPORT",
        metaLines: [
          "Scope: curriculum corpus, six print books, backend, frontend",
          "Method: recomputation, execution, live probing, rendering",
          "Finding tally: 1 critical, 1 high, 2 medium, 3 low, 12 by design",
          "Date: 25 November 2026",
        ],
        footerLeft: "FDE Academy",
        footerRight: "Audit reference PROMPT-12",
      }),
    },
    { // 2. front matter — TOC, Roman numerals
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: { default: romanFooter() },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER, spacing: { before: 480, after: 360 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: { ascii: "Times New Roman", eastAsia: "SimHei" }, color: P.primary })],
        }),
        new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({
            text: "Note: This Table of Contents is generated via field codes. To ensure page number accuracy after editing, please right-click the TOC and select \u201CUpdate Field.\u201D",
            italics: true, size: 18, color: "888888", font: FONT,
          })],
        }),
        // no trailing PageBreak: the body starts a NEXT_PAGE section (double break = blank page)
      ],
    },
    { // 3. body — Arabic numerals from 1
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
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
