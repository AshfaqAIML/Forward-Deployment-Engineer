/* FDE Academy — Production Deployment & Readiness Report (.docx)
 * English report, Profile A (formal), R1 cover (DM-1 palette),
 * 3-section numbering (cover / TOC roman / body arabic).
 * All facts from the 2026-11-26 production-readiness session. No secrets.
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

/* ---------- helpers (same conventions as the recovery report) ---------- */
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
function cell(text, { header = false, width = 100 } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: header ? { type: ShadingType.CLEAR, fill: P.table.headerBg } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT, spacing: { line: 280 },
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

/* ---------- cover (R1, English — same recipe as the recovery report) ---------- */
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
      children: [new TextRun({ text: "FDE Academy — Production Readiness Report", size: 18, color: "808080", font: { ascii: "Times New Roman" } })],
    })],
  });
}

/* ---------- content ---------- */
const DL = "/home/z/my-project/download";
const PV = DL + "/preview";
const bodyChildren = [];

/* 1. Executive summary */
bodyChildren.push(h1("1. Executive Summary"));
bodyChildren.push(body("This report covers the production-readiness engagement requested for the recovered FDE Academy platform: inspect the deployment configuration, make dependency management permanent and provable, protect the multi-copy frontend architecture from drift, verify production readiness end to end, and prepare the project for deployment. The platform was already architecturally deployment-ready: it is a single Node.js process that serves both the website and the API, with a documented deployment guide, a deployment script, an environment template, and a fail-fast production configuration. What this session added is proof and hardening: a fresh-install test from an empty node_modules, a byte-reproducible frontend build with an integrity checker, three real defects found and fixed (a silently-ignored unsafe production flag, a hardcoded password in the admin verification script, and an unbuilt bridge script that a rebuild would have deleted), and a full deployment rehearsal with every check executed rather than assumed."));
bodyChildren.push(body("The deployment rehearsal passed completely: the reference deployment script generated a fresh secret, applied all eleven migrations, seeded the full curriculum, and served the site on port 8787; the student journey passed 10 of 10 steps and the admin journey 8 of 8 after the password fix; all six books were published with verified DOCX and PDF downloads; and the frontend integrity checker reports all four checks green. No public deployment was performed, because no hosting provider account or credentials exist in this environment — that is the single remaining blocker, stated plainly in section 8."));

/* 2. Phase 1 */
bodyChildren.push(h1("2. Phase 1 — Deployment Configuration Inspection"));
bodyChildren.push(body("A complete production deployment configuration already existed in the repository, written for the same single-process architecture the platform uses. It was inspected, not replaced:"));
bodyChildren.push(caption("Table 1: Existing deployment artefacts (verified this session)"));
bodyChildren.push(table(
  ["Artefact", "Content"],
  [
    ["docs/DEPLOYMENT.md", "Ten-section production guide: requirements, install, environment variables, migrations, book publishing, monitoring, backups, rollback, a hardened systemd unit, and post-deploy verification; extended this session with a hosted-platform quickstart (section 9b)"],
    ["ops/deploy.sh", "Reference deployment: generates .env once with a fresh 48-byte JWT secret (gitignored), applies migrations, seeds the curriculum, starts the server"],
    ["ops/backup.sh", "Backs up the database directory, private storage, and .env; --restore reverses it"],
    [".env.example", "Every environment variable documented with defaults and production warnings"],
    ["package.json scripts", "migrate, migrate:down, migrate:status, seed, start, dev, test"],
  ],
  [30, 70]
));
bodyChildren.push(body("The application is intended to be hosted as a Node.js application, not a static website: one process serves the single-page application at GET / (from public/index.html, configurable via FDE_STATIC_FILE) and the JSON API under /api/v1 on the same origin. The database is PostgreSQL in production (standard pg driver, required via DATABASE_URL); development and tests use PGlite, real PostgreSQL compiled to WASM, behind the same adapter. No hosting platform is configured: the repository contains no provider-specific files (no Dockerfile, render.yaml, fly.toml, railway.json or Procfile) and this environment holds no provider credentials, so nothing was assumed or invented."));

/* 3. Phase 2 */
bodyChildren.push(h1("3. Phase 2 — Dependency Management"));
bodyChildren.push(body("The dependency declarations were already correct in package.json: no runtime dependencies (the entire server is Node standard library), pg ^8.13.0 as an optional dependency for production PostgreSQL, and @electric-sql/pglite ^0.2.0 as a development dependency for the embedded engine. The lock file (version 3) contains both package trees. The PGlite incident documented in the recovery report was therefore not a declaration gap but an emptied node_modules directory: the packages were declared and simply never installed in the recycled environment."));
bodyChildren.push(body("To prove the permanent state, a fresh installation was executed from scratch: node_modules was deleted, npm ci installed from the lock file alone, and both packages were verified present. The full test suite was then run against that fresh install: 96 tests, 96 pass, 0 fail, in about three minutes. A new checkout of this repository now reproduces a working, tested environment with one command, with no reliance on any previously existing node_modules."));

/* 4. Phase 3 */
bodyChildren.push(h1("4. Phase 3 — Protecting the Frontend Architecture"));
bodyChildren.push(h2("4.1 Drift that was found"));
bodyChildren.push(body("Rebuilding the frontend from its sources exposed the exact failure mode the recovery incident had warned about: the shipped single-file application contained a 12,336-character live-platform bridge script (cloud sync, server-side downloads) that existed in no source file, plus an accessibility attribute fix present only in the built copies. Any rebuild from the sources would have silently deleted the bridge and regressed the fix. The three frontend copies — the download artifact, the backend served copy, and the source modules — were also maintained by hand, with no check that they agreed."));
bodyChildren.push(h2("4.2 Synchronisation now enforced"));
bodyChildren.push(bodyRuns([
  { text: "Canonical source established. ", bold: true },
  { text: "The bridge was extracted verbatim into scripts/web/bridge.js and the accessibility fix into views2.js, so scripts/web now rebuilds the shipped artifact byte-for-byte (verified with a byte-level comparison, not a checksum of convenience)." },
]));
bodyChildren.push(bodyRuns([
  { text: "Atomic build. ", bold: true },
  { text: "scripts/web/build.py syntax-checks every part including the bridge, assembles the app bundle and the bridge block exactly as shipped, and writes both artifact copies — the download page and the backend's public/index.html — in one step, so they cannot diverge during a build." },
]));
bodyChildren.push(bodyRuns([
  { text: "Integrity checker. ", bold: true },
  { text: "scripts/web/sync.py runs four checks: A, sources rebuild the shipped SPA byte-for-byte; B, the backend's served copy is identical; C, the landing page's design tokens match the SPA's values; D, every landing deep link matches a registered SPA route. It exits non-zero on any drift, so it can run in CI or as a pre-commit hook. During this session check C caught a real font-stack difference between the landing page and the SPA, which was fixed immediately — the checker works." },
]));
bodyChildren.push(body("The workflow (edit sources, build, check, commit sources and both artifacts together) is documented in scripts/web/README.md. The landing page remains intentionally standalone — zero JavaScript, the same tokens, links into the SPA — guarded by checks C and D rather than by sharing code it does not need."));

/* 5. Phase 4 */
bodyChildren.push(h1("5. Phase 4 — Production Readiness Checks"));
bodyChildren.push(h2("5.1 A fail-fast gap found and fixed"));
bodyChildren.push(body("The documented promise that demo-user seeding and reset-token exposure are \"hard-off in production (config refuses to boot)\" was only half-true: the flags were silently forced off in production, so a boot with FDE_SEED_DEMO_USERS=1 would succeed with the flag ignored. Silent ignore is unsafe for operators — the setting looks applied but is not. The configuration now records explicitly-set unsafe flags and the production validator refuses to boot with a clear message naming them. Three guard tests were re-run: production without DATABASE_URL refuses; production without FDE_JWT_SECRET refuses; production with an explicit demo-users flag now refuses (previously it booted)."));
bodyChildren.push(h2("5.2 Deployment rehearsal"));
bodyChildren.push(body("The reference deployment script was executed end to end on a clean database directory: it generated .env with a fresh random secret (gitignored, never committed, not reproduced in this report), applied all eleven migrations in order, seeded the real curriculum — 4 subjects, 18 stages, 8 courses, 34 lessons, 40 quizzes with 139 questions, 6 books, 56 glossary terms, 15 projects, 6 coding exercises, 3 mathematics exercise sets — and started the server on 127.0.0.1:8787 with the embedded PostgreSQL driver."));
bodyChildren.push(h2("5.3 Live checks against the running deployment"));
bodyChildren.push(caption("Table 2: Live verification matrix"));
bodyChildren.push(table(
  ["Check", "Method", "Result"],
  [
    ["Health endpoint", "GET /api/v1/health", "200, {ok:true}, version 2.0.0"],
    ["Homepage at root URL", "GET / in a real browser", "Renders (Home — FDE Academy); 348,413 bytes, text/html"],
    ["Routing", "Click Home button, load routes", "All routes render; zero console errors"],
    ["Mobile responsiveness", "375-pixel viewport measurement", "No horizontal overflow on landing or served SPA"],
    ["Authentication", "Demo login via API", "JWT access token issued; request id on every response"],
    ["Book downloads", "Pipeline publish + student journey", "6/6 books published; DOCX and PDF downloads verified (497-657 KB)"],
    ["Private storage isolation", "Direct GET /storage/... path", "404 — files only reachable via signed single-use tokens"],
    ["Error handling", "Unknown API route", "Uniform JSON error envelope, no stack traces"],
    ["Admin journey (E2E script)", "8-step scripted journey", "8/8 after fixing a hardcoded demo password in the script"],
    ["Student journey (E2E script)", "10-step scripted journey", "10/10"],
    ["Backend regression suite", "npm test after the config change", "96 pass, 0 fail"],
    ["Frontend integrity", "scripts/web/sync.py", "4/4 checks green"],
  ],
  [30, 36, 34]
));
bodyChildren.push(body("The admin journey initially failed 8 of 8 steps because the script hardcoded the default demo password while the deployment script generates a random one; the script now reads FDE_DEMO_PASSWORD from the environment (with the old default kept for compatibility) and passes fully. The student journey passed 10/10 after the print editions were published through the documented pipeline — a fresh deployment seeds placeholder editions until the book pipeline publishes the real DOCX and PDF files, exactly as the deployment guide describes."));
bodyChildren.push(...figure(PV + "/18-production-served-root.png", "Figure 1: The deployed site rendering at the served root URL during final verification"));

/* 6. Phase 5 */
bodyChildren.push(h1("6. Phase 5 — Deployment Preparation"));
bodyChildren.push(body("No hosting provider is configured in this environment and no deployment credentials exist, so no public deployment was attempted — none is claimed. The project is prepared for deployment instead: the repository's deployment guide was extended with a hosted-platform quickstart (section 9b) covering any Node 20+ host (Render, Railway, Fly.io or a virtual private server) with one web service and one managed PostgreSQL 13+, including the exact environment-variable table, install and start commands, first-admin creation, and the split-deployment alternative in which the SPA is served from a CDN (FDE_STATIC_FILE empty, FDE_CORS_ORIGIN set) while the backend runs API-only. The single-host path remains fully documented with the systemd unit, reverse-proxy guidance, backups and rollback in the same guide."));

/* 7. Phase 6 report */
bodyChildren.push(h1("7. Phase 6 — Final Verification Report"));
bodyChildren.push(body("The seven items requested for the final report are answered directly in Table 3; sections 2 through 6 are their evidence."));
bodyChildren.push(caption("Table 3: Deployment report summary"));
bodyChildren.push(table(
  ["Item", "Answer"],
  [
    ["1. Public website URL", "None yet — no hosting account or credentials exist in this environment. Local verified URL: http://127.0.0.1:8787/ (rehearsal deployment)"],
    ["2. Hosting architecture", "Single Node.js 20+ process serving the SPA (public/index.html) and the JSON API (/api/v1) on one origin; PostgreSQL 13+ in production (pg driver) or embedded PGlite for a single host; private storage directory for book files, streamed via signed single-use download tokens; TLS and rate limiting at the reverse proxy"],
    ["3. Build and startup commands", "Install: npm ci --omit=dev. Release: node src/db/migrate.js up (and node src/db/seed.js on first deploy). Start: node src/server.js (or ops/deploy.sh for the single-host reference flow). Frontend: python3 scripts/web/build.py + python3 scripts/web/sync.py"],
    ["4. Required environment variables", "NODE_ENV=production; FDE_JWT_SECRET (>= 32 random bytes); DATABASE_URL (required in production); FDE_HOST/FDE_PORT; FDE_STORAGE_DIR (persistent disk); FDE_CORS_ORIGIN and FDE_STATIC_FILE only for a split deployment. Full table in .env.example and docs/DEPLOYMENT.md"],
    ["5. Database and storage requirements", "PostgreSQL 13+ (16 recommended) with the 11 forward-only migrations; persistent disk for FDE_STORAGE_DIR (book editions, ~0.5-0.7 MB each, 6 books, two formats) and for pgdata/ if embedded mode is used; daily backups via ops/backup.sh (database + storage + secret)"],
    ["6. Test results", "Fresh install: 96/96 backend tests. Rehearsal: student journey 10/10, admin journey 8/8, book downloads 6/6, frontend integrity 4/4, mobile clean, zero console errors, fail-fast guards verified"],
    ["7. Remaining blockers", "One only: a hosting provider account (and its credentials) plus the production secrets — FDE_JWT_SECRET and DATABASE_URL. Everything else is verified and documented"],
  ],
  [26, 74]
));

/* 8. Conclusions */
bodyChildren.push(h1("8. Conclusions"));
bodyChildren.push(body("The platform is production-ready in every aspect that can be verified without a hosting account: the architecture is documented and rehearsed, dependencies install cleanly from the lock file, the frontend cannot silently drift again, the production configuration fails fast on unsafe settings, and the complete student and admin journeys pass against a live deployment. The two defects found during readiness checks (the silently-ignored production flag and the hardcoded verification password) were fixed at the source and re-verified, and both fixes are captured in version control together with the build tooling."));
bodyChildren.push(body("The remaining work is operational, not engineering: choose a host, provision PostgreSQL, set the three production variables, run the release commands, and execute the five-minute post-deploy verification from the deployment guide. No redesign was performed and no working feature was removed — the site that passed verification is the same recovered minimalist FDE Academy, byte-for-byte on the frontend."));

/* Appendix A */
bodyChildren.push(h1("Appendix A — Changes Made This Session"));
bodyChildren.push(caption("Table 4: Change log (all committed to version control)"));
bodyChildren.push(table(
  ["File", "Change"],
  [
    ["src/config.js", "productionUnsafeFlags + validation: explicitly-set hard-off flags now refuse to boot in production (was silently ignored)"],
    ["scripts/e2e_admin.py", "demo password read from FDE_DEMO_PASSWORD env (was hardcoded)"],
    ["scripts/web/bridge.js", "new — the live-platform bridge extracted verbatim from the shipped artifact"],
    ["scripts/web/views2.js", "aria-label restored to the demonstration-checklist buttons (was only in built copies)"],
    ["scripts/web/build.py", "emits app + bridge script blocks; writes the download artifact and the backend served copy atomically"],
    ["scripts/web/sync.py", "new — four drift checks (rebuild identity, copy sync, token parity, route links)"],
    ["scripts/web/README.md", "new — canonical frontend workflow"],
    ["download/FDE_Academy_Landing.html", "font token aligned to the SPA stack (caught by check C)"],
    ["docs/DEPLOYMENT.md", "section 9b: hosted-platform quickstart (env table, commands, first admin, split deployment)"],
  ],
  [30, 70]
));

/* Appendix B */
bodyChildren.push(h1("Appendix B — Release Commands"));
bodyChildren.push(body("First deployment on a managed host (PostgreSQL already provisioned):"));
bodyChildren.push(caption("Table 5: Command sequence"));
bodyChildren.push(table(
  ["Step", "Command"],
  [
    ["Install", "npm ci --omit=dev"],
    ["Migrate", "node src/db/migrate.js up"],
    ["Seed (first deploy only)", "node src/db/seed.js"],
    ["Start", "node src/server.js"],
    ["Verify", "curl -s http://HOST/api/v1/health  &&  python3 scripts/e2e_student.py  &&  python3 scripts/e2e_admin.py"],
    ["Frontend rebuild (workspace)", "python3 scripts/web/build.py  &&  python3 scripts/web/sync.py"],
  ],
  [34, 66]
));
bodyChildren.push(body("Secrets are supplied exclusively through the host's environment variables; the generated .env file is gitignored and no secret appears in this report or in the repository."));

/* ---------- document assembly ---------- */
const doc = new Document({
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
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: "FDE Academy Production Readiness Report",
        englishLabel: "PRODUCTION READINESS",
        subtitle: "Deployment inspection, dependency proof, architecture protection, and a fully verified deployment rehearsal",
        metaLines: [
          "Project: FDE Academy learning platform (SPA + Node.js backend)",
          "Prepared by: Z.ai agent mode",
          "Date: 26 November 2026",
          "Status: Ready — one operational blocker: hosting account and production secrets",
        ],
        footerLeft: "FDE Academy",
        footerRight: "26 November 2026",
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
    {
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
  fs.writeFileSync(DL + "/FDE_Academy_Production_Readiness_Report.docx", buf);
  console.log("wrote", DL + "/FDE_Academy_Production_Readiness_Report.docx", buf.length, "bytes");
});
