/**
 * FDE Academy - Master Project Blueprint (DOCX generator)
 * Cover: recipe R4 (Top Color Block), palette GO-1 (Graphite Orange) per docx skill design-system.
 * Profile A formal typography, English document: Times New Roman, pure black body, left aligned.
 * Sections: 1 cover (no page numbers) / 2 front matter with TOC (Roman) / 3 body (Arabic, start 1).
 */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber, NumberFormat,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, SectionType, TableOfContents, TableLayoutType,
} = require("docx");
const fs = require("fs");

const ASSETS = "/home/z/my-project/scripts/assets";
const OUT = "/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx";

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

// ---------------------------------------------------------------- safety helpers
function safeText(v, placeholder) {
  if (v === undefined || v === null || v === "" || String(v) === "NaN" || String(v) === "undefined") {
    return placeholder || "N/A";
  }
  return String(v);
}

// ---------------------------------------------------------------- cover title layout (from design-system.md)
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

// ---------------------------------------------------------------- cover recipe R4 (Top Color Block)
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

// ---------------------------------------------------------------- body building blocks
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
    spacing: { before: 300, after: 140, line: 360, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 30, color: P.heading, font: EN })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    keepNext: true,
    spacing: { before: 260, after: 120, line: 340, lineRule: "atLeast" },
    children: [new TextRun({ text: safeText(text), bold: true, size: 28, color: P.heading, font: EN })],
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

function callout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NB, bottom: NB, right: NB,
      left: { style: BorderStyle.SINGLE, size: 12, color: P.accent },
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.table.surface },
        margins: { top: 100, bottom: 100, left: 160, right: 160 },
        children: [
          new Paragraph({ spacing: { line: 312, after: 60 }, children: [tr(title, { bold: true, size: 22, color: P.heading })] }),
          new Paragraph({ spacing: { line: 312 }, children: [tr(text, { size: 22 })] }),
        ],
      })],
    })],
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

function codeLine(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 276, after: 0 },
    children: [new TextRun({ text: safeText(text), size: 18, color: "333333", font: { ascii: "Courier New", eastAsia: "Courier New" } })],
  });
}

// ---------------------------------------------------------------- curriculum data (single source of truth)
// Each module: [name, what it covers, lessons, hours]
const STAGES = [
  {
    n: 1, name: "Mathematics for FDEs", hours: 60,
    why: "Forward deployed work is full of business numbers: profit margins, growth rates, conversion percentages, unit costs, and trends over time. A customer will say: our returns went up by 12 percent last quarter, and they will expect the engineer to understand what that means and whether it is good news. This stage builds the everyday mathematics that an FDE uses when reading data, checking claims, and explaining results. Nothing here is abstract school mathematics; every topic is taught through work situations.",
    modules: [
      ["1.1 Numbers and Estimation", "Place value, rounding, order of size, quick mental estimates", 5, 8],
      ["1.2 Fractions, Decimals, and Percentages", "Converting between forms, percentage change, shares, discounts, simple interest", 7, 12],
      ["1.3 Ratios, Units, and Conversions", "Rates, unit checks, converting currency, time, and sizes correctly", 5, 8],
      ["1.4 Algebra Basics", "Expressions, solving equations, inequalities, using formulas at work", 6, 10],
      ["1.5 Functions and Graphs", "Linear functions, reading charts, slope as a rate of change, trends", 5, 8],
      ["1.6 Statistics Essentials", "Averages, spread, misleading numbers, correlation versus causation", 6, 10],
      ["1.7 Probability and Business Problems", "Basic probability, expected value, growth and rate word problems", 3, 4],
    ],
    outcomes: [
      "Calculate percentage change and explain it in a business sentence",
      "Convert units and currencies without making order-of-size mistakes",
      "Read a chart, describe its trend, and question a misleading average",
      "Solve a one-variable equation that comes from a pricing problem",
      "Estimate an answer quickly to check whether a detailed calculation is plausible",
    ],
    practice: "Learners keep a small spreadsheet of practice problems and finish with a customer-style task: check a profit margin report, find the error in it, and write three sentences explaining the correction in plain language.",
    book: "B01 Mathematics for FDEs. Chapters follow the modules above, and Part 4 of the book is the practice workbook with a full answer key.",
  },
  {
    n: 2, name: "Computer Literacy", hours: 40,
    why: "Before writing code, a learner must feel in control of the machine in front of them. An FDE switches between many applications, file formats, and customer laptops every day, so small practical skills save hours of confusion. This stage covers what a computer is, how files and settings work, how to stay safe online, and how to fix the small problems that stop beginners. Every lesson is hands-on and works on any ordinary laptop.",
    modules: [
      ["2.1 What a Computer Is", "Parts of a computer, memory versus storage, what an operating system does", 4, 6],
      ["2.2 Files, Folders, and Settings", "Organising files, file types and extensions, search, simple backups", 5, 8],
      ["2.3 Typing and Everyday Software", "Keyboard skills, documents, spreadsheets, presentations", 5, 8],
      ["2.4 The Internet and Browsers", "How web pages reach you, tabs, URLs, searching well, judging sources", 5, 8],
      ["2.5 Accounts, Passwords, and Safety", "Strong passwords, password managers, two-step login, phishing", 4, 6],
      ["2.6 Installing Software and Fixing Small Problems", "Installers, updates, restarts, reading an error message calmly", 3, 4],
    ],
    outcomes: [
      "Organise a project folder so that nothing is ever lost",
      "Use a spreadsheet for a simple table with a formula",
      "Explain the difference between memory and storage in plain words",
      "Protect accounts with strong passwords and two-step login",
      "Install, update, and remove software without fear",
    ],
    practice: "Learners set up a personal learning folder structure with a backup habit, and keep a short troubleshooting journal: every small problem they meet, what they tried, and what fixed it.",
    book: "B02 Computer Literacy: A Complete Starter.",
  },
  {
    n: 3, name: "Computational Thinking", hours: 40,
    why: "Programming is thinking before typing. Professional engineers spend more time understanding problems than writing code, and this skill can be taught before any programming language. This stage trains learners to break problems into pieces, find patterns, write clear step-by-step solutions, and check their own work. These habits come directly from how FDEs analyse a messy business process before automating it.",
    modules: [
      ["3.1 Problems and Step-by-Step Solutions", "What an algorithm is, writing unambiguous steps, following them exactly", 5, 8],
      ["3.2 Breaking Problems Down and Finding Patterns", "Decomposition, repetition, spotting what stays the same", 5, 8],
      ["3.3 Algorithms, Flowcharts, and Pseudocode", "Drawing flowcharts, writing pseudocode, tracing a process on paper", 6, 10],
      ["3.4 Checking and Fixing: A Testing Mindset", "Predicting results, testing with examples, finding the faulty step", 4, 6],
      ["3.5 Logic, Sets, and Simple Models", "AND, OR, NOT, simple conditions, grouping things, tiny models", 5, 8],
    ],
    outcomes: [
      "Write steps so precise that another person can follow them blindly",
      "Draw a flowchart for a process with a decision in it",
      "Trace an algorithm on paper and predict its output",
      "Find the faulty step in a process that gives a wrong result",
      "Express a business rule as a clear condition",
    ],
    practice: "Learners design a coffee-shop ordering process on paper, test it with a partner acting as the customer, and repair whatever breaks. This is debugging before programming.",
    book: "B03 Computational Thinking.",
  },
  {
    n: 4, name: "Python Programming", hours: 120,
    why: "Python is the main working language of this curriculum and of data and AI work in general. It is free, its rules are close to ordinary English, and its tools cover everything an FDE needs: files, data, web requests, and machine learning libraries. This is the longest foundation stage, and it is deliberately slow: short lessons, many exercises, and three small real programs before the stage ends. By the end, programming stops feeling mysterious and starts feeling like a tool.",
    modules: [
      ["4.1 First Steps: Running Python", "Installing Python, the editor, first commands, how programs run", 5, 8],
      ["4.2 Variables, Numbers, and Strings", "Storing values, text handling, input and output, f-strings", 8, 14],
      ["4.3 Decisions and Loops", "if and elif, comparison, while and for loops, stopping conditions", 9, 16],
      ["4.4 Lists and Dictionaries", "Collections, indexing, adding and removing, nested data", 9, 16],
      ["4.5 Functions", "Defining functions, arguments, return values, splitting programs up", 8, 14],
      ["4.6 Errors, Bugs, and Debugging", "Reading tracebacks, common errors, print debugging, small fixes", 7, 12],
      ["4.7 Files and Data", "Reading and writing text and CSV, simple data processing", 7, 12],
      ["4.8 Modules, Packages, and Environments", "import, pip, virtual environments, installing tools safely", 6, 12],
      ["4.9 Mini-Projects", "Three guided projects: expense calculator, report generator, text game", 8, 16],
    ],
    outcomes: [
      "Write a complete small program from an empty file, without a template",
      "Choose correctly between a list and a dictionary, and explain why",
      "Read a Python error message and fix the usual three or four bug types",
      "Process a CSV file and produce a short summary report from it",
      "Install a package into a virtual environment without touching the system",
    ],
    practice: "Weekly mini-exercises build toward three mini-programs: an expense calculator, a file-based report generator, and a small text game. Each project is reviewed against a short checklist.",
    book: "Two volumes: B04 Python from Zero, Volume I: Foundations and B05 Python from Zero, Volume II: Real Programs.",
  },
  {
    n: 5, name: "Computer Science Foundations", hours: 80,
    why: "An FDE does not need a computer science degree, but needs to understand what happens inside the machine. When a program is slow, when data looks corrupted, or when a customer asks why two systems disagree, the answer usually lives in these foundations. This stage explains bits and memory, how programs are instructions, how algorithms use time, and how data structures shape what is easy to compute. Everything is taught with pictures and Python experiments, never with heavy mathematics.",
    modules: [
      ["5.1 How Computers Compute", "Bits and bytes, binary numbers, memory, the processor in plain words", 6, 10],
      ["5.2 How Data Is Represented", "Text encoding, images and sizes, why files have the size they have", 5, 8],
      ["5.3 Algorithms and Big Thinking", "Searching and sorting, counting steps, why some programs stay fast", 8, 14],
      ["5.4 Data Structures", "Arrays, lists, stacks, queues, hash maps, first look at trees", 9, 16],
      ["5.5 Recursion and Problem Patterns", "Functions that call themselves, divide and conquer, when to avoid it", 6, 10],
      ["5.6 Operating Systems and Programs", "Processes, threads, interpreters versus compilers, why programs crash", 6, 10],
      ["5.7 How the Internet Works, First Pass", "Requests, IP addresses, DNS, packets, a full journey of one page load", 6, 12],
    ],
    outcomes: [
      "Convert small numbers to binary and explain what a byte is",
      "Trace linear search and binary search, and say when each wins",
      "Pick a sensible data structure for a given task and justify it",
      "Explain the difference between a program, a process, and a thread",
      "Describe every step between typing a URL and seeing a page",
    ],
    practice: "Learners implement searching and sorting in Python, time them on real data, and write a one-page explanation of a full web page load as if for a curious customer.",
    book: "B06 Computer Science Foundations.",
  },
  {
    n: 6, name: "Developer Tools", hours: 60,
    why: "Professional work happens in a professional environment: the command line, a proper editor, and version control. These tools look unfriendly at first, which is exactly why the curriculum teaches them early and gently, one command at a time. By the end of this stage the learner works the way working engineers do: editing in an editor, tracking every change in Git, and sharing work on GitHub. Every later stage assumes these tools.",
    modules: [
      ["6.1 The Command Line", "Navigating folders, moving and renaming files, pipes, small scripts", 8, 14],
      ["6.2 Editors and Workspaces", "VS Code setup, integrated terminal, extensions, useful shortcuts", 5, 8],
      ["6.3 Git and GitHub", "init, add, commit, branches, merges, pull requests, resolving conflicts", 9, 16],
      ["6.4 Environments and Package Managers", "Virtual environments, PATH, pip and npm, keeping projects isolated", 6, 10],
      ["6.5 Debugging Tools and Logs", "Breakpoints, stepping through code, reading logs instead of guessing", 4, 6],
      ["6.6 A Real Project Setup", "README, .gitignore, project layout, publishing a clean repository", 4, 6],
    ],
    outcomes: [
      "Move, inspect, and organise files entirely from the command line",
      "Commit work in small steps with messages a teammate could follow",
      "Create branches, open pull requests, and merge without conflicts",
      "Keep every project in its own virtual environment",
      "Publish a repository with a README that a stranger can understand",
    ],
    practice: "Learners publish a real GitHub repository containing their Python mini-projects, with a proper README, a sensible commit history, and at least one merged branch.",
    book: "B07 The Developer Tools Handbook, written as a lookup-friendly reference.",
  },
  {
    n: 7, name: "Web Development", hours: 100,
    why: "FDEs constantly build small customer-facing tools: dashboards, form pages, internal apps. Understanding the web also explains how APIs, browsers, and customer systems connect, which later stages depend on. This stage teaches how the web works, then HTML, CSS, and JavaScript, and finishes with a published website. The goal is not to become a designer but to build clean, working pages and to talk to real APIs from the browser.",
    modules: [
      ["7.1 How the Web Works", "Browsers, servers, HTTP, HTML as documents, developer tools first look", 6, 10],
      ["7.2 HTML", "Structure, headings, lists, tables, forms, semantic tags", 8, 14],
      ["7.3 CSS and Page Design", "Selectors, boxes, colour and type, flexbox layout, responsive design", 10, 18],
      ["7.4 Accessibility and Usability Basics", "Alt text, labels, contrast, keyboard use, pages everyone can use", 5, 8],
      ["7.5 JavaScript Fundamentals", "Variables, functions, arrays, objects, conditions and loops in the browser", 11, 20],
      ["7.6 The DOM and Events", "Selecting elements, reacting to clicks and input, changing the page", 6, 10],
      ["7.7 Talking to APIs from the Browser", "fetch, JSON, promises in plain words, showing real data on a page", 7, 12],
      ["7.8 Building and Publishing a Website", "Project structure, testing, putting a static site online", 5, 8],
    ],
    outcomes: [
      "Build a multi-section page with clean HTML and modern CSS",
      "Make a page that works on a phone and on a large screen",
      "Write JavaScript that reacts to user input and updates the page",
      "Fetch live data from a public API and display it correctly",
      "Publish a website so that anyone with the link can open it",
    ],
    practice: "The stage project is a personal portfolio website: profile, project list, and a live data widget, published online and shared for review.",
    book: "B08 Web Development from Scratch.",
  },
  {
    n: 8, name: "Backend Engineering", hours: 100,
    why: "The API is the daily bread of forward deployed work: customer systems talk to each other through APIs, and most integration problems are API problems. This stage turns the learner from a page builder into a service builder. Using Python and a small web framework, learners create real APIs, handle requests properly, store data, add login, and deploy the result. The famous restaurant-ordering example from our teaching method is used here to introduce what an API is.",
    modules: [
      ["8.1 What Servers Do", "Requests and responses, ports, what running a server means", 5, 8],
      ["8.2 HTTP in Depth", "Methods, status codes, headers, bodies, correct use of each", 6, 10],
      ["8.3 Your First API with a Framework", "Routes, JSON responses, a small Flask service step by step", 10, 18],
      ["8.4 Request Data, Validation, and Errors", "Reading input, checking it, clear error messages, safe failure", 8, 14],
      ["8.5 Users, Sessions, and Login", "Passwords hashed, sessions and tokens, who may do what", 8, 14],
      ["8.6 Connecting a Database to a Server", "Queries from code, safe parameters, avoiding injection", 7, 12],
      ["8.7 Testing and Documenting APIs", "Automated tests, example calls, API reference that people can follow", 7, 12],
      ["8.8 Deploying a Small Service", "Running a service beyond localhost, process managers, first cloud deploy", 6, 12],
    ],
    outcomes: [
      "Build and run a REST API with at least five working routes",
      "Validate input and return honest, useful error responses",
      "Store passwords safely and protect routes with login",
      "Connect the API to a real database and keep queries safe",
      "Deploy the service so a colleague can call it over the internet",
    ],
    practice: "The stage project is an orders API: create, list, and update orders, with tests, documentation, and a public deployment.",
    book: "B09 Backend Engineering.",
  },
  {
    n: 9, name: "Databases", hours: 80,
    why: "Almost every customer engagement begins with their data, and their data lives in databases. An FDE who can write correct SQL and design a sensible schema is useful from day one of a project. This stage teaches relational thinking gently, then real SQL, then design, safety, and the moments when a plain database is not the right choice. Learners practise on a realistic sales dataset throughout.",
    modules: [
      ["9.1 Why Databases", "Limits of spreadsheets, what a database guarantees, tables and keys", 4, 6],
      ["9.2 Tables, Rows, and Relationships", "Primary and foreign keys, one-to-many, joining ideas", 7, 12],
      ["9.3 SQL: Reading Data", "SELECT, WHERE, ORDER BY, JOIN, GROUP BY, real questions about data", 9, 16],
      ["9.4 SQL: Changing Data", "INSERT, UPDATE, DELETE, transactions, doing it without damage", 6, 10],
      ["9.5 Designing a Schema", "Choosing tables, avoiding repeated mess, normalisation in plain words", 7, 12],
      ["9.6 Indexes, Transactions, and Safety", "Why queries get slow, what transactions protect, backups", 6, 10],
      ["9.7 NoSQL and Choosing Storage", "Document and key-value stores, when files or spreadsheets still win", 5, 8],
      ["9.8 Using Databases from Python", "Connecting, parameterised queries, a tiny data access layer", 4, 6],
    ],
    outcomes: [
      "Answer multi-table business questions confidently in SQL",
      "Design a small schema with keys and sensible relationships",
      "Change data inside a transaction and explain what the transaction protected",
      "Explain what an index does and when it helps",
      "Query a database safely from Python code",
    ],
    practice: "Learners import a messy CSV export into a designed schema, then answer ten business questions in SQL and present the results as a short report.",
    book: "B10 Databases for Beginners.",
  },
  {
    n: 10, name: "Software Engineering", hours: 80,
    why: "Working code is not the finish line; code that a team can read, test, and change is. FDEs hand systems over to customers and colleagues, so quality habits matter more here than in almost any other role. This stage teaches naming and structure, automated testing, systematic debugging, refactoring, code review, and continuous integration. Learners apply all of it to their own Stage 8 API, which becomes noticeably more solid by the end.",
    modules: [
      ["10.1 Writing Code People Can Read", "Names, small functions, clear structure, comments that earn their place", 7, 12],
      ["10.2 Testing Your Code", "pytest, unit tests, edge cases, what a good test asserts", 9, 16],
      ["10.3 Finding and Fixing Bugs Systematically", "Reproducing, narrowing, hypothesising, fixing the cause not the symptom", 6, 10],
      ["10.4 Refactoring and Code Review", "Improving code safely, reviewing pull requests kindly and usefully", 7, 12],
      ["10.5 Documentation That Helps", "READMEs, docstrings, run instructions that actually work", 5, 8],
      ["10.6 Working Like a Team", "Branch workflows, issues, small pull requests, project hygiene", 7, 12],
      ["10.7 Automation and CI, First Pass", "GitHub Actions running tests on every push, fixing what breaks", 5, 10],
    ],
    outcomes: [
      "Write tests that catch real bugs, not tests that only pass",
      "Debug by narrowing the problem instead of guessing",
      "Refactor a working program without changing its behaviour",
      "Give a useful, respectful review on another person's code",
      "Run tests automatically on every push with CI",
    ],
    practice: "The Stage 8 orders API is hardened: a real test suite, a cleaner structure, CI on GitHub, and documentation a new teammate could follow alone.",
    book: "B11 Software Engineering Practices.",
  },
  {
    n: 11, name: "Networking", hours: 60,
    why: "Every deployed system lives on a network, and many customer escalations are network problems wearing a disguise. This stage demystifies addresses, DNS, ports, and HTTPS, then teaches practical diagnosis with tools like ping and curl. Learners finish able to say precisely where a connection breaks: name resolution, transport, the application, or a firewall. That clarity turns panic into a checklist.",
    modules: [
      ["11.1 Networks from the Ground Up", "Packets, switches and routers, local networks versus the internet", 7, 12],
      ["11.2 Addresses, DNS, and Ports", "IP addresses, domain names, name resolution, well-known ports", 7, 12],
      ["11.3 HTTP from the Wire", "Reading real requests and responses, status codes in the wild", 6, 10],
      ["11.4 HTTPS, Certificates, and Trust", "What TLS protects, certificates, mixed content warnings", 5, 8],
      ["11.5 Diagnosing Connection Problems", "ping, curl, DNS lookups, a step-by-step diagnostic method", 6, 10],
      ["11.6 Webhooks, Integrations, and Firewalls", "Inbound versus outbound, callbacks, why a firewall blocks things", 5, 8],
    ],
    outcomes: [
      "Explain the full path of a request using correct terms simply",
      "Use ping, curl, and DNS tools to locate where a connection fails",
      "Read raw HTTP traffic and spot the actual problem in it",
      "Explain what HTTPS protects and what it does not",
      "Receive and process a webhook from an external service",
    ],
    practice: "Learners work through a simulated incident: a customer reports the integration is down, and the learner produces a diagnostic playbook showing exactly where the chain breaks.",
    book: "B12 Networking Explained Simply.",
  },
  {
    n: 12, name: "Cloud Computing", hours: 80,
    why: "Deployment now means the cloud, and cloud mistakes cost real money and real security incidents. This stage teaches the shape of cloud computing: virtual machines, object storage, managed databases, permissions, regions, and costs. The emphasis is practical and safety-first: billing alarms on day one, least-privilege permissions, and cleaning up afterwards. By the end, the learner deploys their own API to the cloud properly.",
    modules: [
      ["12.1 Why the Cloud", "Renting computers, IaaS, PaaS, SaaS in plain words", 5, 8],
      ["12.2 Accounts, Regions, and Billing Safety", "Root accounts, alerts, budgets, tagging, cleaning up resources", 5, 8],
      ["12.3 Virtual Machines", "Starting, connecting, securing, and stopping a small server", 7, 12],
      ["12.4 Object Storage", "Buckets, files, permissions, when object storage is the right tool", 5, 8],
      ["12.5 Managed Databases", "Why managed beats self-run, connecting, backups by default", 5, 8],
      ["12.6 Identity and Access Basics", "Users, roles, least privilege, keys and where not to put them", 6, 10],
      ["12.7 Scaling, Serverless, and Cost Thinking", "Traffic spikes, serverless ideas, reading a bill before it surprises you", 7, 12],
      ["12.8 Putting an App in the Cloud", "Deploying the Stage 8 API end to end, with environment config", 7, 14],
    ],
    outcomes: [
      "Run a small virtual machine, secure it, and shut it down cleanly",
      "Store and serve files from object storage with correct permissions",
      "Explain least privilege and apply it to a real setup",
      "Deploy an API to the cloud with configuration outside the code",
      "Set billing alerts and estimate what a small system costs per month",
    ],
    practice: "The Stage 8 API goes live on a low-cost cloud tier, with billing alarms, a managed database, and a written cost estimate.",
    book: "B13 Cloud Computing, Step by Step.",
  },
  {
    n: 13, name: "DevOps", hours: 80,
    why: "Customers judge software by how reliably it updates and how quickly it recovers, not only by its features. DevOps is the discipline of shipping repeatedly and safely: pipelines, containers, environments, monitoring, and recovery. This stage gives the learner a complete delivery loop for their own project: every push is tested, packaged into a container, deployed, watched, and backed up. These habits separate professionals from hobbyists.",
    modules: [
      ["13.1 From Code to Running Product", "The delivery pipeline idea, environments from development to production", 6, 10],
      ["13.2 CI/CD Pipelines", "GitHub Actions workflows, test and build stages, safe deploys", 8, 14],
      ["13.3 Environments, Configuration, and Secrets", "Config outside code, secrets storage, what never goes into Git", 7, 12],
      ["13.4 Containers with Docker", "Images, Dockerfiles, running containers, registries, why containers help", 9, 16],
      ["13.5 Logs, Monitoring, and Alerts", "Structured logs, metrics, dashboards, alerts that are worth waking up for", 8, 14],
      ["13.6 Incidents, Backups, and Recovery", "An incident checklist, backups that restore, post-incident honesty", 7, 14],
    ],
    outcomes: [
      "Build a pipeline that tests and deploys on every push",
      "Containerise an application and explain what the image contains",
      "Keep secrets out of code and out of Git",
      "Instrument a service with logs and one useful alert",
      "Restore a system from backup and prove that it works",
    ],
    practice: "The capstone-style exercise wraps the deployed API in a full loop: CI, container image, deployment, monitoring, and a rehearsed restore from backup.",
    book: "B14 The DevOps Handbook.",
  },
  {
    n: 14, name: "Data Engineering", hours: 80,
    why: "Most forward deployed projects begin with the same sentence: the customer has data, and it is a mess. Moving, cleaning, and organising that data is the FDE's opening move in nearly every engagement. This stage covers formats, cleaning with pandas, building pipelines, analytical SQL, scheduling, and quality checks, and finishes with dashboards that customers actually read. It is the bridge between raw customer reality and every AI feature taught later.",
    modules: [
      ["14.1 Where Data Comes From and Goes", "Sources, exports, pipelines, warehouses in plain words, ETL versus ELT", 6, 10],
      ["14.2 Data Formats and Cleaning", "CSV, JSON, Parquet first look, pandas cleaning, missing and broken values", 8, 14],
      ["14.3 ETL Pipelines", "Extract, transform, load as code, idempotency, rerunning safely", 8, 14],
      ["14.4 SQL for Analysis", "Aggregate questions, windows first look, queries a customer can trust", 7, 12],
      ["14.5 Scheduling and Orchestration", "Cron, orchestration tools first look, dependencies between jobs", 6, 10],
      ["14.6 Data Quality and Privacy", "Checks that catch drift, personal data care, privacy in plain words", 6, 10],
      ["14.7 Dashboards and Reports for Customers", "What to show, what to leave out, building a dashboard people use", 6, 10],
    ],
    outcomes: [
      "Clean a genuinely messy real-world file with pandas",
      "Write an ETL pipeline that can be rerun without duplicating data",
      "Answer analytical business questions in SQL",
      "Schedule a pipeline and add checks that notice bad input",
      "Build a dashboard whose numbers a customer trusts",
    ],
    practice: "An end-to-end exercise: a chaotic CSV export is cleaned, loaded, modelled, and surfaced as a small dashboard, with a written note on every data quality problem found.",
    book: "B15 Data Engineering Basics.",
  },
  {
    n: 15, name: "AI and Machine Learning", hours: 100,
    why: "Customers now ask for AI in every second meeting, and the FDE must answer honestly: what machine learning can do here, what it cannot, and how to tell the difference afterwards. This stage teaches the real fundamentals: learning from data, training simple models, and judging them with discipline. The emphasis is on honesty over hype: most business problems are solved with simple models plus good data, and knowing when not to use ML is presented as a skill, not a failure.",
    modules: [
      ["15.1 What AI Really Is", "Rules versus learning, where AI already works, demystifying the words", 5, 8],
      ["15.2 Learning from Data", "Features, labels, training and testing, the shape of a dataset", 7, 12],
      ["15.3 Your First Models", "Linear regression, decision trees, scikit-learn end to end", 9, 16],
      ["15.4 Judging Models Honestly", "Train and test splits, accuracy and its traps, precision and recall, overfitting", 8, 14],
      ["15.5 When ML Helps and When It Does Not", "Data size, cost of errors, baselines first, the boring model that wins", 6, 10],
      ["15.6 Fairness, Bias, and Responsibility", "Where bias enters, testing for it, human oversight, saying no kindly", 6, 10],
      ["15.7 The ML Project Lifecycle", "From question to deployed model, keeping a model useful over time", 7, 14],
      ["15.8 Practice Sprint: A Small ML Project", "A guided end-to-end project on a real public dataset", 6, 16],
    ],
    outcomes: [
      "Explain in plain words how a model learns from examples",
      "Train and evaluate a regression and a classification model",
      "Choose an honest metric for a given business problem",
      "Detect overfitting and describe two ways to reduce it",
      "Argue for or against ML on a real problem, with reasons",
    ],
    practice: "A guided sprint on a public dataset: clean, split, train, evaluate, and write an honest report including what the model gets wrong.",
    book: "B16 AI and Machine Learning for Beginners.",
  },
  {
    n: 16, name: "Generative AI and Production AI", hours: 120,
    why: "The modern FDE toolkit is built around large language models: assistants over customer documents, drafting features, classification, and agents that use tools. Building these is easy to start and easy to get badly wrong, so this stage pairs capability with discipline: evaluation, safety, cost, and latency are taught alongside prompts and retrieval. The stage project is a retrieval-based assistant over real documents, evaluated and costed like a production system.",
    modules: [
      ["16.1 How Large Language Models Work", "Tokens, prediction, context windows, strengths and honest limits", 7, 12],
      ["16.2 Prompts, Context, and Tokens", "Prompt patterns, giving the model the right material, structured output", 8, 14],
      ["16.3 LLM APIs in Practice", "Calling model APIs, parameters, streaming, errors and retries", 7, 12],
      ["16.4 Embeddings and Vector Search", "Meaning as vectors, similarity search, choosing an embedding model", 7, 12],
      ["16.5 Retrieval-Augmented Generation", "Chunking documents, retrieval, grounding answers, citing sources", 9, 16],
      ["16.6 Agents and Tool Use", "Letting models call functions, loops, guardrails, when agents are overkill", 8, 14],
      ["16.7 Evaluating AI Output Quality", "Test sets, rubrics, human review, regression testing for prompts", 7, 12],
      ["16.8 Safety, Guardrails, Cost, and Latency", "Blocked content, prompt injection, caching, measuring and reducing cost", 7, 12],
      ["16.9 Shipping AI Features", "Fallbacks, monitoring, user feedback loops, a production checklist", 8, 16],
    ],
    outcomes: [
      "Explain what an LLM does and where it fails, without hype",
      "Design prompts with the right context and reliable output structure",
      "Build a RAG assistant over a document set with cited answers",
      "Create a small evaluation set and measure quality changes",
      "Estimate and reduce the cost and latency of an AI feature",
    ],
    practice: "A retrieval assistant over a realistic customer document pack, with an evaluation set of twenty questions, a cost estimate per month, and a monitoring plan.",
    book: "B17 Generative AI in Production.",
  },
  {
    n: 17, name: "Customer-Facing Engineering", hours: 100,
    why: "This stage teaches what makes forward deployed engineering its own discipline rather than software engineering with travel. The craft is human as much as technical: hearing what a customer means rather than what they say, scoping work so projects stay honest, running demos that land, and delivering bad news early. All of it is practised through role-play against a simulated customer, with written artifacts a real engagement would produce.",
    modules: [
      ["17.1 The FDE Role Day to Day", "A week in the life, where FDEs sit between sales, product, and engineering", 6, 10],
      ["17.2 Discovery: Understanding the Problem", "Interview technique, listening for the real goal, writing findings back", 8, 14],
      ["17.3 Scoping, Estimates, and Saying No Kindly", "Splitting work into stages, honest estimates, negotiating scope", 7, 12],
      ["17.4 Communicating Progress and Setbacks", "Updates people read, raising risks early, managing expectations", 7, 12],
      ["17.5 Demos, Training, and Handover", "Demo preparation, teaching users, handover documentation", 7, 12],
      ["17.6 Writing for Customers", "Requirement notes, runbooks, summaries a manager can act on", 6, 10],
      ["17.7 Working with Product and Engineering Teams", "Feeding field lessons home, escalation, being the bridge", 7, 12],
      ["17.8 Measuring Success and Closing Projects", "Agreeing success metrics, closing notes, turning one project into the next", 6, 10],
      ["17.9 Ethics and Professional Judgment", "Data care, honest claims about AI, when to push back and how", 5, 8],
    ],
    outcomes: [
      "Run a discovery interview and write findings the customer confirms",
      "Turn a vague request into a scoped, staged proposal",
      "Give an estimate with its assumptions written down",
      "Deliver a demo and a setback update without losing trust",
      "Define success metrics before building, not after",
    ],
    practice: "A full simulated engagement: discovery call, written scope, mid-project bad news update, demo, and closing report, all role-played and reviewed against rubrics.",
    book: "B18 The Forward Deployed Engineer Handbook, the signature book of the academy.",
  },
  {
    n: 18, name: "Capstone Projects and Career Preparation", hours: 120,
    why: "Knowledge becomes ability only when it survives contact with real constraints. This final stage is built around three capstones of growing difficulty, each reviewed against a published rubric, and each producing a portfolio piece a hiring manager can inspect. Career preparation follows: portfolio assembly, resumes, applications, interview practice, and an honest plan for continuing to learn. The stage ends the program the way a real job starts it: shipping.",
    modules: [
      ["18.1 Planning a Capstone", "Choosing scope that fits the time, writing a one-page plan, risks", 5, 10],
      ["18.2 Capstone 1: Customer Data Dashboard", "Ingest, model, and visualise a realistic dataset for a fictional customer", 6, 24],
      ["18.3 Capstone 2: AI Assistant on Real Documents", "A RAG assistant with evaluation, cost estimate, and safety notes", 7, 28],
      ["18.4 Capstone 3: Deployed Product with Users", "A small end-to-end product, deployed, monitored, and documented", 7, 28],
      ["18.5 Building the Portfolio", "Case study writing, repository presentation, the portfolio site itself", 5, 10],
      ["18.6 Resumes, Applications, and Interviews", "Resume from real projects, applications, technical and behavioural practice", 9, 20],
      ["18.7 Planning Your Continued Growth", "A personal learning plan, communities, keeping skills current", 4, 8],
    ],
    outcomes: [
      "Deliver three reviewed capstones that each solve a stated business need",
      "Write case studies that explain decisions, not only results",
      "Present a portfolio that a stranger can navigate in five minutes",
      "Complete mock technical and behavioural interviews with feedback",
      "Leave with a written plan for the next six months of learning",
    ],
    practice: "Three capstones with rubrics and written retrospectives, followed by mock interviews and a final portfolio review.",
    book: "B19 Capstone Projects Workbook, with B20 and B21 supporting interviews and reference.",
  },
];

const totalHours = STAGES.reduce((s, st) => s + st.hours, 0);
const totalLessons = STAGES.reduce((s, st) => s + st.modules.reduce((a, m) => a + m[2], 0), 0);
const phaseHours = [
  ["A - Foundations", "1-6", STAGES.slice(0, 6).reduce((s, st) => s + st.hours, 0)],
  ["B - Building Software", "7-14", STAGES.slice(6, 14).reduce((s, st) => s + st.hours, 0)],
  ["C - FDE Specialization", "15-18", STAGES.slice(14, 18).reduce((s, st) => s + st.hours, 0)],
];
console.log("Curriculum totals:", JSON.stringify({ stages: STAGES.length, totalHours, totalLessons, phases: phaseHours }));

// ---------------------------------------------------------------- body content
const B = [];

// ===== 1. Executive Summary =====
B.push(h1("1. Executive Summary"));
B.push(body("This document is the master project blueprint for FDE Academy, an educational ecosystem that teaches complete beginners how to become Forward Deployed Engineers (FDEs). It covers two connected products: Product A, an interactive learning website, and Product B, a professionally written book collection delivered in editable DOCX and typeset PDF formats. Both products share one curriculum, one teaching method, one glossary, and one set of quality rules, so a learner can move between the website and the books without ever meeting a contradiction. This blueprint is the single source of truth for that shared design."));
B.push(body(`The curriculum is organised into ${STAGES.length} stages in three phases, exactly following the subject order given in the project brief. It starts with everyday mathematics and computer literacy, moves through computational thinking, Python programming, and computer science foundations, and ends with production AI work, customer-facing engineering, capstone projects, and career preparation. The planned content amounts to about ${totalHours} guided hours across roughly ${totalLessons} lessons. These figures are planning estimates derived from the stage tables in Chapter 5; they are targets for content volume, not promises about how fast any individual learner will travel.`));
B.push(body("Product A will deliver lessons, exercises, auto-checked coding challenges, practical laboratories, projects, assessments, and progress tracking through a responsive website that works on ordinary laptops and phones. Product B will deliver a catalogue of 21 books: one primary book per stage, developer and DevOps handbooks, a capstone workbook, an interview preparation guide, and a glossary and quick-reference guide. Every key topic in every medium follows the same twelve-part teaching structure, from a plain definition through everyday examples, technical examples, guided practice, common mistakes, and practice questions with fully explained answers."));
B.push(body("Three policies run through the whole ecosystem. First, language: everything is written in deliberately simple English, with short sentences and immediate explanations of technical terms, because the target learner has no computer science background. Second, accuracy: every fact is labelled as a stable core concept, a tool-specific detail checked against official documentation, or a practice that differs between companies; nothing is invented, and the curriculum never claims that completing it guarantees employment. Third, delivery: work happens in nine small, verifiable implementation stages, each with explicit acceptance criteria, beginning with this blueprint."));
B.push(body("Stage 0 of the implementation plan, the approval of this blueprint, is the only step that exists today. Once the blueprint is approved, the recommended next requests are Stage 1, which produces the foundation assets, and Stage 2, which produces a pilot book and a sample of website lessons so that the quality bar can be judged on real content before mass production begins."));

// ===== 2. Vision, Goals, and Boundaries =====
B.push(h1("2. Vision, Goals, and Boundaries"));
B.push(h2("2.1 What FDE Academy Is"));
B.push(body("FDE Academy is a single learning system with two faces. The website is where learners practise: they read lessons, answer questions, run code, build projects, and watch their progress accumulate. The books are where learners study deeply and later return for reference: they carry the same content in a calmer, more complete form, suitable for reading away from a screen. The two products are generated from the same curriculum data and the same glossary, which is what keeps them consistent as the catalogue grows."));
B.push(body("The academy takes its name and its shape from the forward deployed engineer role, a real job in the software industry in which engineers work directly with customers to understand their problems and build working solutions on site. That role defines the finish line for the learner, and every stage of the curriculum points at it. A learner who completes the program should not merely recognise technical terms; they should be able to sit in a customer meeting, take a messy business problem away with them, build a working system for it, deploy that system, and explain it to the people who will use it."));
B.push(h2("2.2 Goals"));
B.push(body("The project brief sets the destination; these goals translate it into commitments that the implementation stages can be checked against. Each goal is written so that a reviewer can judge, at the end of any stage, whether the goal is being honoured or quietly abandoned."));
B.push(bullet("G1. Take a true beginner from zero knowledge to building, connecting, and deploying working software."));
B.push(bullet("G2. Make every concept explainable in simple English, without assuming any prior technical background."));
B.push(bullet("G3. Tie every topic, however basic, to the work a forward deployed engineer actually does."));
B.push(bullet("G4. Produce measurable outcomes: mastery rubrics, stage assessments, and a portfolio of real artifacts."));
B.push(bullet("G5. Keep quality, terminology, and difficulty consistent across all 18 stages through shared standards and automated checks."));
B.push(h2("2.3 What FDE Academy Does Not Claim"));
B.push(body("Honesty is part of the product. An educational program that overpromises damages exactly the learners it claims to serve, so the following boundaries are fixed now and must appear in the website and the books, not only in internal documents."));
B.push(bullet("No employment guarantee. Completing the curriculum builds knowledge, ability, and a portfolio; it does not promise a job, and no completion statistic will ever be presented as one."));
B.push(bullet("No accreditation. FDE Academy certificates record completion of its own assessments. They are not industry certifications and will never be described as one."));
B.push(bullet("No substitute for a degree. The curriculum is a professional training path, not an academic qualification."));
B.push(bullet("No pretending tools are permanent. Specific products, menus, and versions change; such content is labelled as tool-specific and dated, as described in Chapter 10."));
B.push(bullet("No invented figures. Salary claims, placement rates, and employer requirements are not stated unless verified against a citable source."));

// ===== 3. The Learner We Serve =====
B.push(h1("3. The Learner We Serve"));
B.push(h2("3.1 Entry Profile and Assumptions"));
B.push(body("The design brief is precise about who arrives on day one, and every content decision must be tested against this person. The learner has finished high school or has equivalent education. They may have no formal computer science education, may not know programming, may have limited mathematics, and may not understand common technical vocabulary. Nothing is assumed to be known simply because a computer science student would call it basic."));
B.push(body("Two quiet assumptions also shape the design. The learner is an adult, likely busy with work or family, so lessons are short and self-contained, and progress must survive interruptions. The learner may be using an ordinary, older laptop or a phone, so the website must run well on modest hardware and the books must read well on a small screen."));
B.push(h2("3.2 Exit Profile: What a Graduate Can Do"));
B.push(body("The program is judged by the difference between the entry profile and the exit profile. Table 1 states that difference area by area; Chapter 12 turns it into measurable rubrics. The exit column deliberately describes things the learner can do, not things they have heard of."));
B.push(tcap("Entry profile versus exit profile, area by area"));
B.push(mkTable(
  ["Area", "The learner arrives able to", "The learner leaves able to"],
  [
    ["Mathematics", "Do basic arithmetic, with rust and little confidence", "Work with percentages, rates, and charts; check business numbers for errors"],
    ["Computers", "Browse the web and use everyday apps cautiously", "Organise, protect, troubleshoot, and control a computer and its files"],
    ["Programming", "Nothing at all", "Write useful Python programs, test them, and debug them systematically"],
    ["Web and APIs", "Not know what an API is", "Build web pages, build and call REST APIs, and connect systems together"],
    ["Data and databases", "Maybe sort a spreadsheet", "Design schemas, write real SQL, clean data, and build ETL pipelines and dashboards"],
    ["Cloud and delivery", "Not have used the cloud", "Deploy applications to the cloud with CI/CD, containers, monitoring, and backups"],
    ["AI", "Know the buzzwords from the news", "Build and honestly evaluate ML models and production LLM features, including RAG assistants"],
    ["Working with customers", "No professional experience assumed", "Run discovery, scope work, demo, train users, and communicate through setbacks"],
  ],
  [16, 34, 50]
));
B.push(h2("3.3 Learning Principles We Commit To"));
B.push(body("The brief gives a teaching philosophy, not just a content list, and these principles convert it into rules that authors and reviewers apply to every lesson and every chapter. They are the reason the curriculum reads differently from a typical programming course."));
B.push(bullet("Reason before definition: every concept opens with why it exists and what problem it solves, never with a bare definition."));
B.push(bullet("Everyday example before technical example: a familiar situation carries the idea first, and the technical version follows once the intuition exists."));
B.push(bullet("Practice after every idea: no lesson ends without something the learner does, writes, or builds."));
B.push(bullet("Spiral repetition: key ideas return in later stages with more depth, so memory is refreshed by use rather than by rereading."));
B.push(bullet("Honest difficulty: content says clearly when something is hard and why it is worth the effort, instead of pretending everything is easy."));
B.push(bullet("Visible progress: every stage shows the learner where they are, what they can already do, and what comes next."));

// ===== 4. The Forward Deployed Engineer Role =====
B.push(h1("4. The Forward Deployed Engineer Role"));
B.push(h2("4.1 What FDEs Do"));
B.push(body("The forward deployed engineer role was popularised by Palantir Technologies, which describes the position as owning high-stakes customer projects from ideation to deployment, with responsibilities that reach from technical teams to executives. The published job description states that these engineers work side by side with customers to rapidly understand their hardest problems and architect and build solutions for them. In plain words: a forward deployed engineer is a software engineer who sits inside the customer's world, finds out what the customer actually needs, and builds and runs the system that meets that need."));
B.push(body("Day to day, the work is a loop. The engineer talks with the customer to find the real problem behind the stated one. They then build: data pipelines, integrations between systems, custom applications, and, increasingly, AI-powered features on top of their company's platform. They deploy what they built, often on the customer's infrastructure or cloud. They train the people who will use it, gather feedback, and carry that feedback home to the product teams. The role is now used by many companies beyond its origin, particularly among AI companies, with variations in emphasis; the curriculum teaches the stable core of the role and marks company-specific practice as such."));
B.push(body("Three features of the role shape everything in this curriculum. It is broad: the engineer touches data, backend, frontend, cloud, and AI, so the curriculum must be breadth-first. It is human: half the job is communication, scoping, and expectation management, so those skills are taught, practised, and assessed rather than mentioned. And it is deployed: code that runs on the engineer's laptop is not the deliverable, so deployment, monitoring, and recovery are treated as core content, not as an optional extra chapter."));
B.push(h2("4.2 What This Means for the Curriculum"));
B.push(body("The 18-stage roadmap in Chapter 5 is a direct translation of the role into a learning path. Stages 1 to 6 build the foundations that make later learning possible. Stages 7 to 14 cover the software craft the role exercises every week: web, backend, databases, quality, networking, cloud, delivery, and data. Stages 15 to 18 add what distinguishes the role: AI in production, the customer-facing craft itself, capstone proof, and career preparation."));
B.push(tcap("Sources consulted for the role definition (accessed 24 November 2026)"));
B.push(mkTable(
  ["Source", "What it was used for"],
  [
    ["Forward Deployed Software Engineer job posting, Palantir Technologies (jobs.lever.co/palantir/dab396d4-2f14-4796-aac0-0d82883dccf0)", "Responsibilities of the role: customer-side work, ownership from ideation to deployment, stakeholders from technical teams to executives, skills and travel expectations"],
  ],
  [55, 45]
));
B.push(body("This blueprint deliberately cites few sources: the role definition above is the only external fact the plan depends on. Technical facts are verified at content-writing time against official documentation, per the policy in Chapter 10, and each piece of content records which sources it checked and when."));

// ===== 5. The Master Curriculum =====
B.push(h1("5. The Master Curriculum: Eighteen Stages"));
B.push(h2("5.1 How the Roadmap Is Organized"));
B.push(body("The project brief lists 21 subject areas and calls the roadmap an 18-stage roadmap. No curriculum document existed in the project workspace before this blueprint, so this blueprint defines the canonical 18 stages and maps all 21 named areas onto them. Three small groups fold together naturally: AI and machine learning form one stage, generative AI and production AI form one stage, and real-world projects together with career preparation form the final stage. The subject order given in the brief is preserved exactly; Table 2 shows every named area and where it lives."));
B.push(tcap("Mapping of the 21 subject areas named in the brief onto the 18 stages"));
B.push(mkTable(
  ["Subject area named in the brief", "Stage", "Notes"],
  [
    ["Mathematics for FDEs", "Stage 1", "First stage, as the brief requires; foundations before anything else"],
    ["Computer literacy", "Stage 2", "Comfort with computers before thinking tools"],
    ["Computational thinking", "Stage 3", "Problem-solving habits before any programming language"],
    ["Python", "Stage 4", "The main working language; two book volumes"],
    ["Computer science foundations", "Stage 5", "How machines and programs really work"],
    ["Developer tools", "Stage 6", "Command line, editors, Git: the professional environment"],
    ["Web development", "Stage 7", "Frontend and how the web works"],
    ["Backend engineering", "Stage 8", "Servers and APIs"],
    ["Databases", "Stage 9", "SQL, schema design, storage choices"],
    ["Software engineering", "Stage 10", "Testing, review, quality habits"],
    ["Networking", "Stage 11", "How systems connect and how to diagnose them"],
    ["Cloud computing", "Stage 12", "Deployment infrastructure and cost awareness"],
    ["DevOps", "Stage 13", "Pipelines, containers, monitoring, recovery"],
    ["Data engineering", "Stage 14", "Pipelines, cleaning, dashboards"],
    ["AI", "Stage 15", "Grouped with machine learning into one stage"],
    ["Machine learning", "Stage 15", "Same stage as AI: fundamentals and honest evaluation"],
    ["Generative AI", "Stage 16", "Grouped with production AI into one stage"],
    ["Production AI", "Stage 16", "Same stage: shipping AI features responsibly"],
    ["Customer-facing engineering", "Stage 17", "The defining craft of the FDE role"],
    ["Real-world projects", "Stage 18", "Grouped with career preparation as the capstone stage"],
    ["Career preparation", "Stage 18", "Same stage: portfolio, applications, interviews"],
  ],
  [34, 14, 52]
));
B.push(...figure("fig1_roadmap.png", "The eighteen-stage roadmap across three phases, in the order given in the project brief."));
B.push(body("Each stage is built from the same eight elements, which keeps the whole catalog predictable for the learner: a purpose paragraph, modules with lesson and hour estimates, measurable outcomes, a practice program, a stage project, an assessment, a companion book, and prerequisites that are simply the previous stages. The next subsection shows the phases at a glance, and Section 5.3 gives the full profile of every stage."));
B.push(h2("5.2 The Three Phases at a Glance"));
B.push(body(`The stages are grouped into three phases so that a learner always knows which kind of work they are doing. Phase A builds the base, Phase B builds software, and Phase C builds the engineer. The hour totals below are computed from the stage tables and sum to ${totalHours} hours.`));
B.push(tcap("The three phases of the curriculum"));
B.push(mkTable(
  ["Phase", "Stages", "Guided hours", "What the learner gains"],
  [
    ["Phase A: Foundations", "1-6", String(phaseHours[0][2]), "Comfort with computers, practical mathematics, problem-solving habits, working Python, core computer science, and professional tools"],
    ["Phase B: Building Software", "7-14", String(phaseHours[1][2]), "The full craft: web, backend, databases, quality, networking, cloud, delivery pipelines, and data engineering"],
    ["Phase C: FDE Specialization", "15-18", String(phaseHours[2][2]), "AI and machine learning, generative and production AI, the customer-facing craft, and three reviewed capstones"],
  ],
  [22, 10, 14, 54]
));
B.push(h2("5.3 Stage Profiles"));
B.push(body("Every stage below follows the same profile: why the stage exists, the modules it contains with their lesson and hour estimates, what the learner can do by the end, and how practice and books are organised. Lesson and hour numbers are planning targets that will be refined during production, not fixed contracts; the totals in Section 5.2 are computed from these tables."));

function stageSection(st) {
  const parts = [];
  parts.push(h3("Stage " + st.n + " - " + st.name + " (" + st.hours + " hours)"));
  parts.push(body(st.why));
  parts.push(tcap("Stage " + st.n + " modules"));
  parts.push(mkTable(
    ["Module", "What it covers", "Load"],
    st.modules.map(m => [m[0], m[1], m[2] + " lessons, " + m[3] + " h"]),
    [26, 56, 18]
  ));
  parts.push(body("By the end of this stage you can:", { keepNext: true, after: 60 }));
  for (const o of st.outcomes) parts.push(bullet(o));
  parts.push(body(st.practice, { before: 80 }));
  parts.push(bodyRuns([["Companion book. ", "b"], [st.book, "n"]], { after: 200 }));
  return parts;
}
for (const st of STAGES) B.push(...stageSection(st));

// ===== 6. The Teaching System =====
B.push(h1("6. The Teaching System"));
B.push(h2("6.1 The Twelve-Part Lesson Structure"));
B.push(body("Every important topic, on the website and in the books, follows one fixed twelve-part structure. The structure exists because beginners are harmed most by invisible gaps: lessons that define a term without saying why it exists, or that show code without ever letting the learner run it. A fixed skeleton makes those gaps impossible for an author to leave silently, and it makes the whole catalog feel like one teacher speaking with one voice. The full specification, with author guidance for each part, is Appendix A."));
B.push(body("The twelve parts, in order: what is it; why do we need it; where is it used; how does it work; an everyday-life example; a technical example; a step-by-step explanation; a practical activity; common mistakes; key points to remember; practice questions; and answers with explanations. Parts one to seven build understanding, part eight turns it into action, parts nine and ten protect the learner from the usual traps, and parts eleven and twelve let the learner test themselves honestly. Every part is present in every key topic; shorter topics may compress the middle parts but never skip the everyday example, the activity, the mistakes, or the answers."));
B.push(h2("6.2 How Difficulty Grows"));
B.push(body("The curriculum climbs deliberately. Each stage opens by connecting to what the learner already has: Stage 5 re-explains files that Stage 2 introduced, now as bytes and memory; Stage 8 re-explains the web request that Stage 7 described from the browser side, now from the server side. Tools are introduced in their simplest form first and deepened later: the learner meets the command line in Stage 6, then uses it daily, then automates it in Stage 13. Nothing is taught at its most advanced form the first time it appears."));
B.push(body("Two growth rules protect the learner. The one-new-thing rule: a lesson introduces exactly one new concept, and everything else in the lesson is revision by use. The honest-depth rule: when a topic is genuinely hard, such as recursion or evaluation of AI output, the lesson says so plainly, explains why the difficulty exists, and gives the learner a smaller first step rather than pretending the step is not there."));
B.push(h2("6.3 Practice Types"));
B.push(body("Practice is graded from seconds to weeks, so that every lesson offers work at the right size for the moment. Each type has a fixed shape that authors must follow, and each is checked in a defined way."));
B.push(bullet("Quick check: one or two questions inside a lesson, answered immediately, to catch misunderstanding while it is cheap."));
B.push(bullet("Lesson exercises: five to ten tasks at the end of a lesson, with worked answers in the same lesson or chapter."));
B.push(bullet("Coding challenge: an auto-checked task with starter code and tests; the learner submits code and sees precisely which test fails."));
B.push(bullet("Laboratory: a guided one-to-three hour task with checkpoints, for skills that need sustained attention, such as cleaning a messy dataset."));
B.push(bullet("Project: a multi-day build with a rubric, from the stage projects defined in Chapter 5 to the capstones of Stage 18."));
B.push(bullet("Stage assessment: a mixed test covering the stage outcomes, used with the mastery gate in Section 6.4."));
B.push(h2("6.4 Assessment and Mastery"));
B.push(body("Progress is measured as mastery, not as pages read. Every skill in the curriculum is scored on a five-level scale, and every stage publishes which skills are core to it. A learner advances to the next stage when the stage assessment is passed and the core skills are demonstrated at level three or better; retakes are unlimited and never penalised, because the gate exists to inform the learner, not to punish them."));
B.push(tcap("The five-level mastery scale used across the curriculum"));
B.push(mkTable(
  ["Level", "Name", "What it means"],
  [
    ["0", "Untouched", "The learner has not met this skill yet"],
    ["1", "Seen it", "The learner has met the skill and can follow it when someone else does it"],
    ["2", "Can follow", "The learner can reproduce the skill with the lesson open"],
    ["3", "Can do with docs", "The learner can perform the skill alone, using reference material for details"],
    ["4", "Can do alone", "The learner can perform the skill unaided and explain it to someone else"],
  ],
  [10, 22, 68]
));
B.push(body("Assessment design follows from the same philosophy. Questions test use rather than recall: a question asks the learner to fix this code or choose the right tool and justify it, not to repeat a definition. Stage assessments are a mix of quick checks, small coding tasks, and one applied question drawn from the stage project. Capstones are graded against published rubrics covering four axes: does it work, is it documented, is it deployed, and can the learner explain it."));
B.push(h2("6.5 Progress Tracking on the Website"));
B.push(body("The website records, for every lesson, whether the learner has not started it, is working on it, or has completed it, and records the mastery level achieved for each skill it teaches. The dashboard shows progress per stage and per phase, the skills closest to advancing, and the next recommended action. Completion of a stage assessment unlocks the next stage in the default path, but the full catalog remains browsable, because curious adults should never be locked out of reading ahead."));
B.push(body("One further feature is scheduled review. The key points of completed lessons re-enter a review queue after a few days, in the pattern usually called spaced repetition: the learner sees a short question again just before they would naturally forget it. Ten minutes of review a day is presented as the cheapest way to keep a large body of knowledge alive."));

// ===== 7. Language and Style Rules =====
B.push(h1("7. Language and Style Rules"));
B.push(h2("7.1 The Ten Rules in Practice"));
B.push(body("The brief defines ten language rules; this section converts them into checks that a reviewer can actually run. The rules are not decoration: the target learner is meeting most of this material for the first time, in a second or third language in many cases, and clarity is the difference between a lesson that teaches and a lesson that merely impresses."));
B.push(bullet("Short sentences: the target average is under 17 words per sentence, and the readability script reports the average for every lesson and chapter."));
B.push(bullet("One idea per sentence: a sentence that needs the word and twice usually wants to be two sentences."));
B.push(bullet("Ordinary words first: if an easier word carries the meaning, the easier word wins."));
B.push(bullet("Explain at first use: every technical term is defined in the same breath it appears, using the pattern Term (explanation), and linked to the glossary on the website."));
B.push(bullet("Everyday comparisons: every hard idea gets a real-life analogy before its technical treatment."));
B.push(bullet("Step by step: processes are numbered steps, never a paragraph that hides the order."));
B.push(bullet("Active voice and direct address: the lesson speaks to the learner as you, and says who does what."));
B.push(bullet("No idioms or slang: phrases like hit the ground running do not translate and are banned."));
B.push(bullet("Numbers with units: every number carries its unit, and money carries its currency."));
B.push(bullet("Gradual professional vocabulary: each stage introduces its professional terms, and by Stage 17 the learner reads normal industry language comfortably because every term was built earlier."));
B.push(h2("7.2 Tone: Simple but Not Childish"));
B.push(body("Simple language is not childish language, and the difference matters to adult learners who deserve respect. The tone is calm, factual, and adult: business and work situations are the default examples, technical accuracy is never sacrificed for simplicity, and no exclamation marks, emoji, or cartoon text appear. When content must be simplified, the lesson says what was left out and where the full story lives, because a learner who is treated as an adult acts like one."));
B.push(h2("7.3 Terminology Registry and Glossary Discipline"));
B.push(body("Consistency of vocabulary is a production problem, and it gets a production solution: a single terminology registry, stored as a glossary file, is the only authority for technical names. For each term it records the canonical name, the simple definition, the stage where the term is first taught, and any rejected synonyms that content must not use (for example, the curriculum says folder, never directory, until the command line makes directory unavoidable). Content is checked against the registry at review time, and Chapter 14 seeds the registry with forty starter terms."));

// ===== 8. Product B: The Book Collection =====
B.push(h1("8. Product B: The Book Collection"));
B.push(h2("8.1 Catalog Overview"));
B.push(body(`Product B is a collection of 21 books organised around the curriculum: one primary book for each of the 18 stages (two volumes for the long Python stage), plus an interview preparation guide and a glossary and quick-reference guide. Every primary book contains a built-in practice workbook with a full answer key, which is why no separate per-stage workbooks are planned. Table 5 lists the catalog; scope notes describe what each book must cover in one sentence.`));
B.push(tcap("The FDE Academy book catalog"));
B.push(mkTable(
  ["ID", "Title", "Type", "Stage", "Scope"],
  [
    ["B01", "Mathematics for FDEs", "Textbook", "1", "Practical maths for business numbers, rates, charts, and estimation"],
    ["B02", "Computer Literacy: A Complete Starter", "Textbook", "2", "Files, accounts, safety, software, and calm troubleshooting"],
    ["B03", "Computational Thinking", "Textbook", "3", "Decomposition, algorithms, flowcharts, pseudocode, and a testing mindset"],
    ["B04", "Python from Zero, Volume I: Foundations", "Textbook", "4", "Python basics through functions and debugging"],
    ["B05", "Python from Zero, Volume II: Real Programs", "Textbook", "4", "Files, packages, and the three mini-projects"],
    ["B06", "Computer Science Foundations", "Textbook", "5", "Bits, data, algorithms, data structures, and the internet in plain words"],
    ["B07", "The Developer Tools Handbook", "Handbook", "6", "Command line, VS Code, Git, and environments as a lookup reference"],
    ["B08", "Web Development from Scratch", "Textbook", "7", "HTML, CSS, JavaScript, and a published website"],
    ["B09", "Backend Engineering", "Textbook", "8", "HTTP, building an API, login, databases, tests, and deployment"],
    ["B10", "Databases for Beginners", "Textbook", "9", "Relational thinking, SQL, schema design, and storage choices"],
    ["B11", "Software Engineering Practices", "Textbook", "10", "Readable code, testing, debugging, review, and CI"],
    ["B12", "Networking Explained Simply", "Textbook", "11", "Addresses, DNS, HTTP, HTTPS, and a diagnostic method"],
    ["B13", "Cloud Computing, Step by Step", "Textbook", "12", "VMs, storage, managed databases, permissions, cost, and deployment"],
    ["B14", "The DevOps Handbook", "Handbook", "13", "Pipelines, configuration, containers, monitoring, and recovery"],
    ["B15", "Data Engineering Basics", "Textbook", "14", "Formats, cleaning, ETL, analytical SQL, quality, and dashboards"],
    ["B16", "AI and Machine Learning for Beginners", "Textbook", "15", "Learning from data, first models, honest evaluation, and responsibility"],
    ["B17", "Generative AI in Production", "Textbook", "16", "LLMs, prompts, RAG, agents, evaluation, safety, and shipping"],
    ["B18", "The Forward Deployed Engineer Handbook", "Handbook", "17", "Discovery, scoping, communication, demos, and professional judgment"],
    ["B19", "Capstone Projects Workbook", "Workbook", "18", "Briefs, rubrics, and retrospectives for the three capstones"],
    ["B20", "FDE Interview Preparation Guide", "Interview guide", "-", "Portfolio, resumes, technical and behavioural interview practice"],
    ["B21", "FDE Glossary and Quick Reference", "Reference", "-", "The full terminology registry and command and syntax quick tables"],
  ],
  [8, 34, 14, 9, 35]
));
B.push(body("Two design choices deserve explanation. First, handbooks for Stages 6 and 13 and the customer-facing stage: those stages are as much about looking things up as about reading through, so their books are organised for reference with dense, well-indexed entries. Second, the built-in workbook: a single book with an integrated answer key is easier to keep consistent with the website than a separate workbook volume, and it halves the production surface."));
B.push(h2("8.2 Format Standards: DOCX and PDF"));
B.push(body("Every book is delivered in two formats from one source. The DOCX file is the editable master: clean Word styles, real heading styles so a reader can navigate, tables as real tables, and figures as embedded images. The PDF is the typeset delivery copy generated from the same content. Both files carry the book version and release date on the cover page, so a reader always knows which edition they hold."));
B.push(body("Books are produced by persisted build scripts, never by hand-assembly, which makes regeneration safe: fixing a figure or a chapter and rebuilding produces the same document with the same conventions every time. File naming follows the pattern FDE_Academy_B01_Mathematics_v1.docx and its PDF twin, kept in the download area alongside the website builds."));
B.push(h2("8.3 The Built-In Workbook in Every Book"));
B.push(body("Each primary book has four parts. Part one teaches, following the lesson structure. Part two works through extended examples, longer than the website versions and with commentary on decisions. Part three is the workbook: exercises for every module, from quick checks to a stage mini-project. Part four is the answer key: every exercise answered, with the reasoning written out, because an answer without its reasoning teaches nothing. The workbook mirrors the website's practice content so that doing the exercises in either medium exercises the same skills."));

// ===== 9. Product A: The Learning Website =====
B.push(h1("9. Product A: The Learning Website"));
B.push(h2("9.1 What the Website Offers"));
B.push(body("The website is the practice and progress half of the academy. Its feature set is fixed by the brief and by the teaching system, and each feature maps to a concrete page or component described in this chapter."));
B.push(bullet("Courses and lessons: the 18 stages browsable as courses, with lessons built on the twelve-part structure and inline quick checks."));
B.push(bullet("Exercises and coding challenges: auto-checked practice with starter code and visible tests."));
B.push(bullet("Laboratories and projects: guided lab pages with checkpoints, and project briefs with rubrics and submission uploads."));
B.push(bullet("Assessments: stage tests with immediate, explanatory feedback and the mastery gate of Section 6.4."));
B.push(bullet("Progress tracking: per-lesson state, per-skill mastery, dashboard, review queue, and completion records."));
B.push(bullet("Book library: the full catalog readable online and downloadable as DOCX and PDF."));
B.push(bullet("Glossary and search: the terminology registry with links from every lesson, plus full-text search."));
B.push(h2("9.2 Site Map"));
B.push(body("The site is shallow on purpose: a beginner should reach any lesson in three clicks from the home page. The main areas are: Home; Curriculum (phase list, stage pages, module pages, lesson pages); Practice (challenges, labs); Projects (briefs and rubrics); Assessments; Books; Glossary; My progress (dashboard, review queue); and About (approach, FAQ, honest-limits statement). Admin authoring pages exist behind login for the content pipeline."));
B.push(h2("9.3 Target Architecture"));
B.push(body("The website is built in two phases, and the blueprint is explicit about what changes between them. Phase 1 delivers the entire learning experience as a self-contained site: pages, lessons, quizzes, and progress stored in the browser, with Python coding challenges running in the browser through Pyodide, an in-browser Python runtime. Phase 1 needs no servers, protects learner privacy by keeping records on the learner's own machine, and makes the whole site fast and cheap to host. Phase 2 adds accounts, cross-device synchronisation, server-side code execution in isolated containers, and the book file service, moving the same content into a conventional application architecture."));
B.push(...figure("fig2_architecture.png", "Target architecture of the learning website, showing the Phase 1 in-browser build and the Phase 2 server services."));
B.push(body("The data model is small on purpose, and it is shared with the curriculum file so that books and website cannot drift apart. Table 6 lists the entities; the curriculum JSON schema in Appendix B defines the exact fields."));
B.push(tcap("Core data model of the learning website"));
B.push(mkTable(
  ["Entity", "What it keeps", "Notes"],
  [
    ["Stage", "The 18 stages: name, phase, hours, outcomes, project, book link", "Mirrors Chapter 5 exactly"],
    ["Module", "Module name, stage, lesson order", "Navigation unit within a stage"],
    ["Lesson", "Title, sections, quiz, activity, mistakes, key points, glossary links", "The twelve-part structure as data"],
    ["Exercise", "Type: quick check, exercise, coding challenge, or lab task", "Coding challenges carry starter code and tests"],
    ["Attempt", "A learner's try at an exercise: code or answers, timestamp, result", "Feeds mastery and the review queue"],
    ["Progress record", "Lesson state: not started, in progress, completed", "One row per learner per lesson"],
    ["Skill mastery", "Skill identifier and level 0 to 4 for a learner", "The scale of Table 4"],
    ["Assessment", "Stage test definition, questions, pass mark", "Gate for stage advancement"],
    ["Project submission", "Brief, rubric scores, artifact links, retrospective", "Capstones and stage projects"],
    ["Book", "Catalog entry, version, file links for DOCX and PDF", "Generated by the same build scripts as the books"],
    ["Glossary term", "Canonical name, definition, first stage, banned synonyms", "The registry of Section 7.3"],
  ],
  [18, 46, 36]
));
B.push(h2("9.4 Lesson Content Schema"));
B.push(body("Lessons are stored as structured content, not as free HTML, so that books and website render from one source and quality checks can run on the fields. Each lesson record carries its identity (stage, module, title), its reading time, prerequisites, stability labels per claim, the twelve structural parts as typed fields, quiz items with answers and explanations, glossary references, and a version with the date of its last technical check. Appendix B gives the full field list. A lesson that fails validation, for example a missing answers field or an unchecked tool claim, is rejected by the build, which is how the quality rules of Chapter 10 are enforced mechanically."));
B.push(h2("9.5 Running Code Challenges Safely"));
B.push(body("In Phase 1, learner code runs in the browser through Pyodide, so nothing ever runs on a server and nothing can touch other learners. The site bundles the challenge starter code and its tests, runs the tests in the in-browser runtime, and reports which assertions passed or failed with their messages. Pyodide has real limits, which the site states honestly: no network access, a slower start, and pure Python only unless a library is bundled. Those limits are acceptable for the challenges planned in Phases A and B stages."));
B.push(body("In Phase 2, challenges move to isolated server containers with strict CPU, memory, and time limits and no network access, following the standard pattern for running untrusted code. The blueprint states the rule that governs both phases: learner code is never trusted, so it only ever runs where it can do no damage, whether that place is the learner's own browser or a locked-down container."));
B.push(h2("9.6 Privacy, Accessibility, and Performance"));
B.push(body("Privacy is minimal by design: Phase 1 keeps all learner records in the learner's own browser storage, and Phase 2 collects only an email address and learning records, with export and deletion available at any time and no third-party advertising or tracking scripts anywhere. Accessibility targets WCAG AA: full keyboard navigation, labelled form controls, sufficient contrast, and screen-reader-tested lesson structure. Performance targets modest hardware: static pages where possible, images sized responsibly, and no framework weight that a learner on a five-year-old laptop or a phone would feel."));

// ===== 10. Content Production Pipeline and Quality Assurance =====
B.push(h1("10. Content Production Pipeline and Quality Assurance"));
B.push(h2("10.1 How a Piece of Content Is Made"));
B.push(body("Content is produced in a fixed pipeline so that quality does not depend on good intentions. The pipeline has eight steps, and each step leaves a trace that a reviewer can check."));
B.push(bullet("Step 1. Outline from the curriculum file: the stage, module, and lesson come from the master curriculum JSON, never from an author's whim."));
B.push(bullet("Step 2. Draft using the twelve-part template: the author fills the fixed structure, starting with why, not with the definition."));
B.push(bullet("Step 3. Readability pass: the style script measures sentence length and flags banned idioms and unexplained terms against the registry."));
B.push(bullet("Step 4. Technical verification: every tool-specific claim is checked against official documentation, with the source and date recorded in the content."));
B.push(bullet("Step 5. Edit pass: a second pair of eyes checks accuracy, tone, and the promise that every exercise has an explained answer."));
B.push(bullet("Step 6. Build: the content is rendered into website pages and, where applicable, into book chapters, from the same source."));
B.push(bullet("Step 7. Automated and visual checks: the document build passes its postcheck script, and rendered pages are inspected visually."));
B.push(bullet("Step 8. Version and publish: the content is versioned with its date, and changes after publication go through the same pipeline."));
B.push(h2("10.2 The Three-Tier Knowledge Label System"));
B.push(body("The brief distinguishes what stays true from what changes, and the curriculum makes that distinction visible to the learner. Every factual claim carries one of three labels, shown as a small tag in lessons and book margins."));
B.push(bullet("Core: stable concepts that do not change, such as what HTTP is, how a JOIN works, or why indexes speed up queries."));
B.push(bullet("Tool: tool-specific detail that changes, such as menu names, product versions, or a provider's pricing; these claims are checked against official documentation at writing time and carry that date."));
B.push(bullet("Practice: conventions that differ between companies and teams, such as branch naming or code review customs; the content presents a common convention and says that others exist."));
B.push(body("The labels do more than protect accuracy. They teach the learner to think the way professionals think about change: hold the fundamentals firmly, expect the tools to move, and assume that another company may do it differently."));
B.push(h2("10.3 Review Checklist"));
B.push(body("Before any lesson or chapter is published, it must pass this checklist. The checklist is short enough to be used every time, and each item is verifiable rather than a matter of taste."));
B.push(bullet("All twelve template parts present, with the everyday example before the technical one."));
B.push(bullet("Every technical term defined at first use and present in the glossary registry."));
B.push(bullet("Sentence-length and idiom checks pass; tone is adult and factual."));
B.push(bullet("Every factual claim carries its tier label; tool claims carry a checked-on date."));
B.push(bullet("Every code example has been run; every answer is correct and explains its reasoning."));
B.push(bullet("Numbers computed with code, not by hand, and matching the source data."));
B.push(bullet("Figures and tables numbered, captioned, and referenced in the text."));
B.push(bullet("No placeholders, no unfinished sections, no markdown artifacts."));
B.push(bullet("Consistent with the master curriculum: names, hours, and outcomes match."));
B.push(bullet("Build and postcheck pass; rendered pages inspected visually."));

// ===== 11. Implementation Plan =====
B.push(h1("11. Implementation Plan: Staged Delivery"));
B.push(h2("11.1 Delivery Stages and Acceptance Criteria"));
B.push(body("The brief requires small, verifiable stages, and the plan below is exactly that: nine delivery stages, each producing inspectable artifacts with acceptance criteria that can be checked mechanically or by review. Nothing is generated beyond a stage until that stage is requested, and each stage's acceptance criteria must be met before the next begins."));
B.push(tcap("Implementation stages with deliverables and acceptance criteria"));
B.push(mkTable(
  ["Stage", "What gets built", "Acceptance criteria"],
  [
    ["0. Blueprint", "This document: architecture, curriculum, products, and plan", "The blueprint is reviewed and approved as the single source of truth"],
    ["1. Foundation assets", "Master curriculum JSON, style guide, glossary registry file, document and book templates, repository skeleton", "Files exist and validate; curriculum totals match Chapter 5; glossary matches Section 7.3 rules"],
    ["2. Pilot vertical slice", "Book B01 complete in DOCX and PDF, plus Stage 1 sample lessons and a quiz on the website", "Book passes build, postcheck, and visual checks; sample lessons render at 375 pixels wide without overflow"],
    ["3. Content engine", "Single-source build: one content format renders to website pages and book chapters", "One sample lesson renders correctly in both products from one source"],
    ["4. Website MVP", "Static self-contained site for Phases A and B content: lessons, quizzes, dashboard, glossary, local progress", "Works offline after first load; progress survives reload; no horizontal overflow at 375 pixels"],
    ["5. Practice system", "Coding challenges with in-browser Python (Pyodide) and lab pages with checkpoints", "Twenty challenges auto-check correctly in the browser; labs show checkpoints"],
    ["6. Book production", "Remaining stage books produced in batches of two, in DOCX and PDF", "Every book passes the Chapter 10 pipeline: readability, verification, build, postcheck, visual check"],
    ["7. Assessments and projects", "Eighteen stage assessments, project rubrics, and three capstone briefs", "Every stage has a passing assessment with explained answers; capstone briefs carry rubrics"],
    ["8. Career and polish", "Interview preparation book, glossary reference book, final consistency sweep", "B20 and B21 pass all gates; cross-references between website and books verified"],
  ],
  [16, 42, 42]
));
B.push(body("The ordering is deliberate. The pilot slice in Stage 2 exists so that the quality bar is agreed on one real book and one real set of lessons before the expensive production stages run; a correction discovered at Stage 2 costs a day, while the same correction discovered after twenty books costs a month. The content engine in Stage 3 comes before the website MVP in Stage 4 for the same reason: single-sourcing must exist before content multiplies."));
B.push(h2("11.2 What to Request Next"));
B.push(body("Per the project brief, no books are generated and no website is implemented beyond this blueprint until the relevant stages are requested. The recommended request order is Stage 1 followed by Stage 2; together they produce the foundation assets and the pilot slice whose quality can be judged concretely. Each later stage is then requested individually, and its acceptance criteria above say what must be true before it is considered done."));

// ===== 12. Success Criteria and Measurement =====
B.push(h1("12. Success Criteria and Measurement"));
B.push(h2("12.1 How We Measure Learning"));
B.push(body("Success is measured as demonstrated ability, never as content consumed. Three instruments do the work. Mastery levels, defined in Table 4, are recorded per skill from exercises, labs, and challenges. Stage assessments gate advancement, so a learner cannot drift forward on momentum. Capstones are graded against rubrics on four axes: the artifact works, it is documented, it is deployed, and the learner can explain its decisions. Each instrument produces a number or artifact the learner can see, which keeps progress honest and motivating."));
B.push(h2("12.2 The Portfolio a Graduate Leaves With"));
B.push(body("The brief asks for a strong project portfolio, and the curriculum produces one deliberately: every stage contributes at least one artifact worth showing. Table 9 lists the portfolio a completing learner holds. These artifacts are real files and repositories, not certificates: they demonstrate ability to any reviewer directly."));
B.push(tcap("Portfolio artifacts produced across the curriculum"));
B.push(mkTable(
  ["#", "Artifact", "From stage", "What it demonstrates"],
  [
    ["P1", "Checked profit margin report with written correction", "1", "Business mathematics and honest checking of numbers"],
    ["P2", "Personal file organisation and troubleshooting journal", "2", "Control of tools and systematic habits"],
    ["P3", "Coffee-shop process design with flowchart", "3", "Algorithmic thinking before code"],
    ["P4", "Python mini-projects (calculator, report generator, game)", "4", "Working programming ability"],
    ["P5", "Search and sort implementations with timing write-up", "5", "Computer science fundamentals applied"],
    ["P6", "Public GitHub repository with clean history and README", "6", "Professional tooling and communication"],
    ["P7", "Published personal portfolio website with live data", "7", "Frontend and API consumption"],
    ["P8", "Orders API with documentation and tests", "8-10", "Backend, quality habits, and engineering discipline"],
    ["P9", "Sales database with SQL analysis report", "9", "Data modelling and SQL"],
    ["P10", "Cloud-deployed service with CI/CD, monitoring, and cost note", "12-13", "Deployment, delivery, and operations"],
    ["P11", "Data pipeline and customer dashboard from messy data", "14", "Data engineering end to end"],
    ["P12", "RAG assistant with evaluation set, cost estimate, and three capstone case studies", "15-18", "AI in production plus the complete FDE craft"],
  ],
  [8, 33, 11, 48]
));
B.push(h2("12.3 Honest Limits of Measurement"));
B.push(body("Measurement has boundaries, and the academy states them. A completed curriculum is not a job offer, and completion records are not industry certifications. Employers weigh many factors the curriculum cannot control, such as location, experience, and interview performance on the day. What the numbers in this chapter do show is narrower and more useful: what a learner can demonstrably do, evidenced by artifacts they can present and defend. The academy's promise is that evidence, and it is the only promise made."));

// ===== 13. Risks, Constraints, and How We Manage Them =====
B.push(h1("13. Risks, Constraints, and How We Manage Them"));
B.push(body("Every long content project carries predictable risks, and pretending otherwise is how projects fail quietly. Table 10 lists the six risks most likely to damage this one, with the specific mechanism that manages each. These are reviewed at every implementation stage boundary."));
B.push(tcap("Principal risks and their management"));
B.push(mkTable(
  ["Risk", "What could go wrong", "How it is managed"],
  [
    ["Tool churn", "Screenshots, menus, and versions drift from reality within months", "Tool-tier labels with checked-on dates; tool detail kept shallow in books; annual review cycle"],
    ["Volume versus quality", "845 planned lessons invite rushed writing and uneven depth", "Fixed template, readability gates, batch production with review per batch, pilot slice sets the bar"],
    ["In-browser sandbox limits", "Some challenges cannot run in Pyodide in Phase 1", "Challenge design respects Phase 1 limits; Phase 2 container runner defined for the rest"],
    ["Content drift between products", "Website and books contradict each other as both evolve", "Single curriculum JSON and glossary registry feed both builds; build rejects divergent content"],
    ["Learner drop-off", "Beginners stall when lessons run long or progress stalls", "Short lessons, small steps, visible progress, review queue, and honest difficulty warnings"],
    ["Accuracy in fast-moving AI topics", "Generative AI practice changes faster than annual reviews", "AI content leans on official documentation with dates; fundamentals carried by Core labels"],
  ],
  [16, 38, 46]
));
B.push(body("One constraint is stated rather than risked: the academy is built and verified inside a controlled workspace, so Phase 1 of the website is delivered as a self-contained site and Phase 2 services assume a hosting environment outside that workspace. This does not change the architecture; it only defines where each phase is built."));

// ===== 14. Starter Glossary =====
B.push(h1("14. Starter Glossary: The First Forty Terms"));
B.push(body("This chapter seeds the terminology registry described in Section 7.3 with forty terms a learner meets first. Each entry is the plain-English definition that content must match; the full registry file, built in Stage 1, will add first-taught stages, banned synonyms, and cross-references. The definitions here are deliberately short: they are the canonical summary, not the lesson."));
B.push(tcap("Starter glossary: forty terms in plain English"));
B.push(mkTable(
  ["Term", "Plain-English meaning"],
  [
    ["Algorithm", "A precise list of steps that solves a problem, written so a computer or person can follow it exactly"],
    ["API", "A set of rules that lets two programs ask each other for things and exchange data"],
    ["Backend", "The part of an application that runs on servers, away from the user's screen"],
    ["Binary", "A way of writing numbers using only 0 and 1, which is how computers store everything"],
    ["Bug", "A mistake in a program that makes it do the wrong thing"],
    ["CI/CD", "Automated checks and delivery that test and release software after every change"],
    ["Client", "A program that asks another program (a server) for something, such as a browser"],
    ["Cloud", "Renting computers, storage, and services run by someone else, over the internet"],
    ["Commit", "A saved snapshot of changes to a project's files, with a note explaining it"],
    ["Container", "A sealed package that holds an application and everything it needs to run"],
    ["Database", "An organised store of data that programs can add to, search, and change safely"],
    ["Deployment", "Putting software somewhere users can actually use it, such as a server or the cloud"],
    ["DNS", "The system that turns a website name like example.com into the address a computer needs"],
    ["Endpoint", "One specific address and action an API offers, such as create an order"],
    ["Embedding", "A list of numbers that represents what a piece of text means, so similar meanings sit close together"],
    ["Environment variable", "A setting given to a program from outside its code, such as a password or an address"],
    ["Framework", "A ready-made structure for building applications, so common parts are already done"],
    ["Frontend", "The part of an application the user sees and touches, usually in a browser"],
    ["Function", "A named piece of code that does one job and can be used again and again"],
    ["Git", "The standard tool that records every version of a project's files"],
    ["HTTP", "The rules browsers and servers use to ask for and send web pages and data"],
    ["HTTPS", "HTTP wrapped in encryption, so the exchange cannot be read by strangers"],
    ["JSON", "A simple text format for structured data that almost every system can read"],
    ["Latency", "The delay between asking for something and receiving it"],
    ["Library", "A collection of ready-made code other people wrote, which your program can use"],
    ["LLM", "Large language model: a system trained on text that can read and generate human language"],
    ["Log", "A running record of what a program did, used to understand and fix problems"],
    ["Loop", "A way to repeat steps without writing them again"],
    ["Migration", "A controlled change to a database's structure, applied the same way everywhere"],
    ["Pipeline", "A chain of automated steps that turns input into output, such as data into reports"],
    ["Production", "The live environment where real users depend on the software working"],
    ["Prompt", "The text and context given to a language model to get the output you want"],
    ["RAG", "Retrieval-augmented generation: giving a model your documents so answers are grounded in them"],
    ["Repository", "A project's files and their full version history, stored so a team can share them"],
    ["Sandbox", "A closed, safe place to run untrusted code where it cannot damage anything else"],
    ["Schema", "The structure of a database: which tables exist and what columns and keys they have"],
    ["Server", "A program (or computer) that waits for requests and answers them"],
    ["SQL", "The standard language for asking databases questions and changing their data"],
    ["Variable", "A named box that stores a value a program uses later"],
    ["Webhook", "A way for one system to call another automatically when something happens"],
  ],
  [20, 80]
));

// ===== Appendix A =====
B.push(h1("Appendix A: The Twelve-Part Lesson Template in Full"));
B.push(body("This appendix is the author-facing specification of the structure defined in Section 6.1. Each part states the question it answers for the learner and the guidance an author must follow. The template applies to every key topic on the website and in the books."));
B.push(tcap("The twelve-part lesson template with author guidance"));
B.push(mkTable(
  ["#", "Part", "The question it answers", "Author guidance"],
  [
    ["1", "What is it?", "What exactly is this thing?", "One plain definition; every term defined at first use; no jargon"],
    ["2", "Why do we need it?", "What problem exists without it?", "The honest reason the concept was invented; the pain before the cure"],
    ["3", "Where is it used?", "Who uses this, and where?", "Real industries and tasks, named concretely"],
    ["4", "How does it work?", "What actually happens?", "The mechanism in small steps, with a picture where it helps"],
    ["5", "Everyday-life example", "What is this like in normal life?", "A familiar analogy that carries the intuition before any technology"],
    ["6", "Technical example", "What does it look like for real?", "Real code, request, or configuration; the learner could copy and run it"],
    ["7", "Step-by-step explanation", "How do I walk through it?", "Numbered steps from start to finish, including the failure cases"],
    ["8", "Practical activity", "What do I do now?", "A small task the learner completes immediately, with a checkable result"],
    ["9", "Common mistakes", "What usually goes wrong?", "Three to five real mistakes with the fix for each"],
    ["10", "Key points to remember", "What must stick?", "Five to eight short points that enter the review queue"],
    ["11", "Practice questions", "Can I test myself?", "Five to ten questions mixing recall and use, harder at the end"],
    ["12", "Answers with explanations", "Why is that the answer?", "Every answer explained; a wrong answer's mistake is named"],
  ],
  [6, 16, 26, 52]
));
B.push(body("As an illustration of the template in action, the API lesson runs like this. Part one defines an API as a set of rules that lets two programs ask each other for things. Part two shows the problem: a shop's website and its stock system are separate programs, and each needs the other's information. Part three names where APIs appear: mobile apps pulling maps, shops taking payments, weather widgets. Part four explains request and response. Part five uses the brief's restaurant example: you (the customer program) read a menu (the API documentation), tell the waiter your order (the request), the kitchen (the server) prepares it, and the waiter brings the food back (the response). Part six shows a real HTTP request for a list of orders and its JSON reply. Part seven walks through sending it with a tool, line by line. Part eight has the learner send their own request and print one field. Part nine lists the usual failures: wrong address, wrong method, unreadable response. Parts ten to twelve finish with key points, questions, and explained answers. Every key topic receives the same treatment."));

// ===== Appendix B =====
B.push(h1("Appendix B: Master Curriculum Data Schema"));
B.push(body("One machine-readable file, the master curriculum JSON, drives both products: the website renders from it and the book builders read from it. This appendix defines its structure and the lesson record schema so that Stage 1 can create it without further design work. The schema is deliberately minimal: fields that no renderer or check uses are not included."));
B.push(body("At the top level, the file holds the program: three phases, each holding stages, each stage holding modules, each module holding lessons. Every stage record carries: id, number, name, phase, estimated hours, purpose text, measurable outcomes, practice description, stage project, assessment link, companion book id, and prerequisite stage numbers. The stage tables in Chapter 5 are exactly this data, rendered."));
B.push(tcap("Lesson record fields"));
B.push(mkTable(
  ["Field", "Type", "Meaning"],
  [
    ["id", "text", "Stable identifier, such as S04-L12, used by both products"],
    ["stage / module", "number / text", "Position in the curriculum tree"],
    ["title", "text", "Lesson title, written for a beginner"],
    ["minutes", "number", "Estimated reading and practice time"],
    ["prerequisites", "list", "Lesson ids the learner should complete first"],
    ["definition / why / where", "text", "Template parts 1 to 3"],
    ["how", "text + media", "Template part 4, with optional diagram references"],
    ["everyday_example / technical_example", "text", "Template parts 5 and 6"],
    ["steps", "list", "Template part 7, ordered steps"],
    ["activity", "text", "Template part 8, with its checkable result"],
    ["common_mistakes", "list of (mistake, fix)", "Template part 9"],
    ["key_points", "list", "Template part 10; feeds the review queue"],
    ["questions / answers", "list / list", "Template parts 11 and 12, answers carry explanations"],
    ["glossary_refs", "list", "Term ids used or introduced"],
    ["claim_labels", "list of (claim, tier, checked_on)", "Core, Tool, or Practice, with dates for Tool claims"],
    ["version / last_checked", "text / date", "Content version and last verification date"],
  ],
  [26, 20, 54]
));
B.push(body("Two build rules complete the schema. First, validation: a build fails if any structural field is missing, if an answer lacks its explanation, or if a Tool claim lacks its checked-on date. Second, cross-referencing: book chapters and website pages both record the lesson ids they render, which is how the consistency sweep in Stage 8 verifies that nothing drifted between products."));

// ===== Appendix C =====
B.push(h1("Appendix C: Book Production and Formatting Standards"));
B.push(body("Every book in the catalog is produced to the same standard, so that a learner holding B01 and B17 sees one coherent design. The standards below are the contract for Stage 2 onward; the pilot book establishes them on real content before the production batches begin."));
B.push(body("Structure: a cover page with title, edition, version, and date; an about-this-book page explaining how to use it; a table of contents; the four parts defined in Section 8.3; and a closing pointer to the website stage for practice and assessment. Chapters mirror modules, and chapter sections mirror the lesson template, so a reader always knows where they are."));
B.push(body("Formatting: one serif body font at a readable size with generous leading; bold reserved for key terms and key warnings; tables with header rows and real cell padding; figures generated by code, captioned as Figure N with a caption that carries the point of the figure; code in a monospace font with no syntax colouring that a PDF printer would lose. Exercise sections use numbered questions with space to work, and every numbered question appears in the answer key. Page breaks appear only between the cover, the table of contents, and the body; everything else flows."));
B.push(body("Quality gates: no book ships without the full Chapter 10 pipeline, including the automated postcheck of the document build and a visual inspection of rendered pages for overflow, duplicated content, or broken numbering. Books carry their version and date on the cover, and a corrected edition regenerates from source rather than being patched by hand."));

// ===== Appendix D =====
B.push(h1("Appendix D: Planned Repository Structure"));
B.push(body("The repository layout below is the working structure that Stage 1 creates. Its purpose is to make the single-source principle physical: one curriculum file, one style directory, one content tree per product, and scripts that turn source into deliverables."));
B.push(codeLine("fde-academy/"));
B.push(codeLine("  blueprint/            this document and future revisions"));
B.push(codeLine("  curriculum/           master.json - the single source of truth"));
B.push(codeLine("  style/                style-guide.md, glossary.yaml, review checklists"));
B.push(codeLine("  books/                one directory per book: B01 ... B21"));
B.push(codeLine("    B01-mathematics/    content source + build script + output docx and pdf"));
B.push(codeLine("  website/              site content and static build output"));
B.push(codeLine("  assessments/          stage tests, project rubrics, capstone briefs"));
B.push(codeLine("  qa/                   readability scripts, postcheck reports, review logs"));
B.push(codeLine("  scripts/              shared generators, validators, and build tools"));
B.push(body("Two conventions govern the tree. Everything generated is regenerated from source by the scripts, so no deliverable is ever edited in place; and every directory that produces files under the download area does so with the naming rules of Section 8.2, so the public catalog stays tidy as it grows."));

// ---------------------------------------------------------------- assembly
const DOC_TITLE = "FDE Academy";
const HEADER_TEXT = "FDE Academy - Master Project Blueprint";

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
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
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
  title: "FDE Academy - Master Project Blueprint",
  description: "Architecture and implementation plan for the FDE Academy learning website and book collection",
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
        paragraph: { spacing: { before: 300, after: 140, line: 360 } },
      },
      heading3: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Times New Roman" }, size: 28, bold: true, color: P.heading },
        paragraph: { spacing: { before: 260, after: 120, line: 340 } },
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
        title: DOC_TITLE,
        subtitle: "Master Project Blueprint: Curriculum, Learning Website, and Book Collection",
        englishLabel: "EDUCATIONAL ECOSYSTEM PLAN",
        metaLines: [
          "Version 1.0 - Draft for review and approval",
          "24 November 2026",
          "Scope: 18-stage curriculum, learning website, 21 books",
          "Prepared by: FDE Academy founding team",
        ],
        footerLeft: "FDE Academy",
        footerRight: "Master Project Blueprint",
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




