/* ============ FDE Academy — data part 5: labs, assessments, career, DATA assembly ============ */
"use strict";

/* ---------------- Labs ---------------- */
const LABS = [
  { id: "maths-fraction", kind: "Maths", title: "Fraction drill — equal parts", minutes: 15,
    linked: "fm-2",
    intro: "Set the fraction that answers each prompt, then compare with the readout. Every change recomputes instantly — the decimal readout is the check.",
    html: () => fraction({ n: 2, d: 6, label: "Prompt: Amara sold 2 of 6 trays — set it, then compare" }),
    checkNote: "Target: {2}/{6} = {1}/{3}. The decimal readout should read 0.33 — if it does, your settings match the prompt." },
  { id: "maths-percent", kind: "Maths", title: "Percentage drill — discounts", minutes: 15,
    linked: "fm-5",
    intro: "The bakery gives 30% off day-old bread priced at £6.40. Set the percent and total, read the computation, then verify by hand.",
    html: () => percent({ pct: 30, of: 6.4, label: "30% of £6.40" }),
    checkNote: "Hand check: 0.30 × 6.40 = 1.92 → final price £4.48. The grid shows 30 shaded squares of 100." },
  { id: "maths-geometry", kind: "Maths", title: "Geometry drill — packaging", minutes: 15,
    linked: "fm-1",
    intro: "A roll box is 12 cm by 8 cm. Set width and height, read area and perimeter, then answer: which box doubles the AREA, which doubles the PERIMETER?",
    html: () => geometry({ shape: "rect" }),
    checkNote: "Area 12×8 = 96 cm². Doubling area needs BOTH sides ×√2 (not +4!). Perimeter doubles only if both sides double." },
  { id: "code-c1", kind: "Coding", title: "Coding lab — predict, then run", minutes: 20, lang: "JavaScript", linked: "pg-1",
    intro: "Amara's till. Predict each line's output in your notes, run, and compare. Then fix the last line so it prints the correct total.",
    starter: `// Predict before you run!
let price = 4.0;
let crates = 6;
let perCrate = 24;
console.log("One crate holds:", perCrate);
console.log("Rolls total:", crates * perCrate);
console.log("Takings:", price * crates * perCrate);
// TASK: make the next line print the price of
// HALF the rolls (predict it first!)
console.log("Half-price batch:", price * crates * perCrate);`,
    hint: "Half the rolls means half the product: multiply by 0.5 — or divide by 2.",
    solution: `console.log("Half-price batch:", price * crates * perCrate / 2);` },
  { id: "code-c2", kind: "Coding", title: "Coding lab — the off-by-one trap", minutes: 20, lang: "JavaScript", linked: "pg-3",
    intro: "This loop SHOULD total six crates of 24 rolls (144) but prints 120. Fix it, then add a test that would have caught it.",
    starter: `let total = 0;
for (let crate = 1; crate < 6; crate++) {
  total = total + 24;
}
console.log("Total:", total);
// After fixing, add:
// console.assert(total === 144, "six crates of 24");`,
    hint: "Count the iterations: crate takes 1..5. Six crates need <= 6.",
    solution: `for (let crate = 1; crate <= 6; crate++) { total = total + 24; }\nconsole.assert(total === 144, "six crates of 24");` },
  { id: "code-c3", kind: "Coding", title: "Coding lab — functions with a guard", minutes: 25, lang: "JavaScript", linked: "pg-4",
    intro: "Write breakEven(fixed, price, cost) with the honest guard (contribution ≤ 0 → Infinity) and three assertions, including the impossible-pricing case.",
    starter: `// Write your function here, then keep these green:
console.assert(breakEven(20, 4.0, 1.5) === 8, "stall case");
console.assert(breakEven(45, 2.8, 1.05) === 26, "cart case rounds up");
console.assert(breakEven(45, 2.8, 3.0) === Infinity, "impossible pricing");
console.log("tests finished");`,
    hint: "Math.ceil for the round-up; return Infinity when price − cost ≤ 0.",
    solution: `function breakEven(fixed, price, cost) {
  const c = price - cost;
  if (c <= 0) return Infinity;
  return Math.ceil(fixed / c);
}` },
  { id: "sql-1", kind: "Database", title: "SQL lab — query the sales table", minutes: 25, lang: "SQL", linked: "p3-2",
    intro: "A real mini-SQL engine runs your queries over the 12-row sales table (schema: day, item, qty, price). It supports SELECT cols or * FROM sales [WHERE col =/>/< value (AND …)] [ORDER BY col [ASC|DESC]] [LIMIT n].",
    starter: `-- Manager question 1: everything sold on Saturday
SELECT * FROM sales WHERE day = 'Sat';
-- Question 2: highest quantities first
SELECT item, qty FROM sales ORDER BY qty DESC;
-- Question 3: your own — find rolls over 10 sold`,
    hint: "WHERE combines with AND: WHERE day = 'Sat' AND qty > 10.",
    solution: `SELECT * FROM sales WHERE item = 'rolls' AND qty > 10;` },
  { id: "api-1", kind: "API", title: "API lab — the orders endpoint", minutes: 20, lang: "HTTP", linked: "p4-1",
    intro: "A simulated GET /orders service responds below. Compose requests with query parameters and status expectations, send them, and read the responses — including the validation error you should be able to trigger.",
    starter: `GET /orders?status=open
# then try: ?status=banana  (expect 422)
# then try: ?limit=2  (expect 200 with 2 items)`,
    hint: "The service validates status against a fixed list: open, done, cancelled. Invalid values get a 422 with a message naming the problem.",
    solution: "Valid: 200 with the filtered list. 'banana': 422 {error: \"status must be one of open, done, cancelled\"}. limit is clamped to 1–10." },
  { id: "ai-1", kind: "AI", title: "AI laboratory — grounded FAQ assistant", minutes: 30, lang: "Retrieval", linked: "ai-2",
    intro: "A working grounded assistant over an eight-section FAQ. Ask questions, watch the retrieval scores, and note the citations. Then trigger the refusal — it is a feature.",
    starter: `Try:
- What are your opening hours?
- Can I get a refund on a collect-by order?
- What was your 2019 revenue?  (expect refusal — outside the sources)
- Do you cater weddings?  (expect refusal)`,
    hint: "Answers quote ONLY the retrieved section with its number. Score 0 → refusal with handover.",
    solution: "That is the designed behaviour: grounded answers cite sections; outside-scope questions refuse. It matches the Level 6 contract." },
];

const SQL_TABLE = [
  { day: "Mon", item: "rolls", qty: 12, price: 4.0 }, { day: "Mon", item: "coffee", qty: 8, price: 2.8 },
  { day: "Tue", item: "rolls", qty: 18, price: 4.0 }, { day: "Tue", item: "cake", qty: 5, price: 3.5 },
  { day: "Wed", item: "rolls", qty: 9, price: 4.0 }, { day: "Wed", item: "coffee", qty: 14, price: 2.8 },
  { day: "Thu", item: "rolls", qty: 21, price: 4.0 }, { day: "Thu", item: "cake", qty: 4, price: 3.5 },
  { day: "Fri", item: "rolls", qty: 24, price: 4.0 }, { day: "Fri", item: "coffee", qty: 11, price: 2.8 },
  { day: "Sat", item: "rolls", qty: 30, price: 4.0 }, { day: "Sat", item: "cake", qty: 12, price: 3.5 },
];
function runSQL(query) {
  const q = query.replace(/--.*$/gm, "").replace(/\s+/g, " ").trim();
  const m = q.match(/^select\s+(.+?)\s+from\s+sales(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(\w+)(?:\s+(asc|desc))?)?(?:\s+limit\s+(\d+))?\s*;?$/i);
  if (!m) return { error: "Parse error. Supported: SELECT cols|* FROM sales [WHERE col =/>/< value [AND …]] [ORDER BY col [ASC|DESC]] [LIMIT n];" };
  let [, cols, where, orderCol, orderDir, limit] = m;
  let rows = SQL_TABLE.map(r => ({ ...r }));
  if (where) {
    for (const cond of where.split(/\s+and\s+/i)) {
      const cm = cond.trim().match(/^(\w+)\s*(=|>|<)\s*'?([^']+)'?$/i);
      if (!cm) return { error: "Cannot parse condition: " + cond.trim() };
      const [, col, op, raw] = cm;
      const val = isNaN(parseFloat(raw)) ? raw : parseFloat(raw);
      rows = rows.filter(r => op === "=" ? r[col] == val : op === ">" ? r[col] > val : r[col] < val);
    }
  }
  if (orderCol) {
    const dir = (orderDir || "asc").toLowerCase() === "desc" ? -1 : 1;
    rows.sort((a, b) => (a[orderCol] > b[orderCol] ? 1 : a[orderCol] < b[orderCol] ? -1 : 0) * dir);
  }
  if (limit) rows = rows.slice(0, parseInt(limit, 10));
  const names = cols.trim() === "*" ? Object.keys(SQL_TABLE[0]) : cols.split(",").map(c => c.trim());
  for (const c of names) if (!(c in SQL_TABLE[0])) return { error: "Unknown column: " + c };
  return { cols: names, rows: rows.map(r => names.map(c => r[c])) };
}

const FAQ_CORPUS = [
  { sec: "§1", q: "opening hours open close times", a: "We are open Monday to Saturday, 7:30 to 18:00, and 9:00 to 16:00 on Sundays." },
  { sec: "§2.1", q: "refund return money back policy", a: "Unopened items can be returned within 14 days with a receipt for a full refund." },
  { sec: "§2.2", q: "collect by hold collection orders", a: "Collect-by orders are held for 7 days from the order date." },
  { sec: "§3", q: "delivery deliver deliveroo shipping", a: "We deliver within 5 miles; orders over £20 deliver free." },
  { sec: "§4", q: "allergen gluten vegan ingredients", a: "Allergens are listed on every shelf label; gluten-free rolls are baked on Wednesdays." },
  { sec: "§5", q: "payment card cash contactless apple", a: "We accept cash, all major cards and contactless payments." },
  { sec: "§6", q: "wholesale bulk order bakery cafes", a: "Wholesale orders for cafés start at 50 units; order by Wednesday for Friday delivery." },
  { sec: "§7", q: "loyalty stamp card coffee", a: "The loyalty card gives one free coffee after six stamps." },
];
function faqRetrieve(question) {
  const norm = question.toLowerCase().replace(/[^a-z0-9 ]/g, " ");
  const words = norm.split(/\s+/).filter(w => w && !["the", "a", "an", "of", "to", "is", "are", "do", "i", "my", "you", "can", "what", "on", "for", "your", "and"].includes(w));
  let best = null;
  for (const e of FAQ_CORPUS) {
    const overlap = words.filter(w => e.q.includes(w)).length;
    if (!best || overlap > best.score) best = { ...e, score: overlap };
  }
  return best;
}

/* ---------------- Assessments ---------------- */
const TOPIC_TESTS = [
  { id: "tt-fm", course: "fm", title: "Topic test — Foundation Mathematics", pass: 70, minutes: 20, questions: [
    { q: "144 − 57 = ?", options: ["97", "87", "77", "91"], answer: 1, why: "144−50=94, −7=87." },
    { q: "87 ÷ 6 = 14 remainder…", options: ["2", "3", "4", "0"], answer: 1, why: "14×6=84; 87−84=3." },
    { q: "35% of 60 = ?", options: ["18", "21", "24", "35"], answer: 1, why: "0.35×60=21." },
    { q: "Fixed £20, price £4.00, variable £1.50 → break-even rolls:", options: ["5", "8", "10", "14"], answer: 1, why: "20÷2.5=8." },
    { q: "£1.80 for 500 g is how much per 100 g?", options: ["36p", "40p", "32p", "44p"], answer: 0, why: "180÷5=36p." } ] },
  { id: "tt-al", course: "algebra", title: "Topic test — Algebra Essentials", pass: 70, minutes: 20, questions: [
    { q: "3(2n + 4) = ?", options: ["6n + 4", "6n + 12", "5n + 7", "2n + 12"], answer: 1, why: "Distribute." },
    { q: "Solve 4n − 12 = 60:", options: ["n = 12", "n = 16", "n = 18", "n = 20"], answer: 2, why: "4n=72." },
    { q: "In y = 2.5x − 20, the gradient is…", options: ["−20", "2.5", "x", "y"], answer: 1, why: "m is the x coefficient." },
    { q: "6n + 12 factorises to…", options: ["6(n+2)", "2(3n+6) only", "6(n+12)", "n(6+12)"], answer: 0, why: "GCF 6." },
    { q: "Where does y = 6x − 90 cross zero?", options: ["x=10", "x=15", "x=12", "x=9"], answer: 1, why: "90÷6=15." } ] },
  { id: "tt-lo", course: "logic", title: "Topic test — Logic & Proof", pass: 70, minutes: 20, questions: [
    { q: "true AND (false OR true) = ?", options: ["false", "true", "undefined", "maybe"], answer: 1, why: "OR true; AND true." },
    { q: "An implication fails only when…", options: ["both false", "hypothesis true, conclusion false", "hypothesis false", "converse true"], answer: 1, why: "Broken promise." },
    { q: "NOT('all paid') =", options: ["'all unpaid'", "'some unpaid'", "'some paid'", "'none paid'"], answer: 1, why: "∀ flips to ∃." },
    { q: "Even n ⇒ even n² uses n = …", options: ["k", "2k", "2k+1", "k²"], answer: 1, why: "Definition of even." },
    { q: "A counterexample to '£6 ⇒ heavy' is…", options: ["£4 heavy parcel", "£6 parcel weighing 1 kg", "£4 light parcel", "no parcels"], answer: 1, why: "Hypothesis true, conclusion false." } ] },
  { id: "tt-gr", course: "graphs", title: "Topic test — Graphs & Networks", pass: 70, minutes: 20, questions: [
    { q: "A node with degree 1 has…", options: ["one edge", "two edges", "no edges", "weight 1"], answer: 0, why: "Count of edges." },
    { q: "Path weights 5+7 vs 12+9 → the shorter is…", options: ["21", "12", "16", "23"], answer: 1, why: "5+7=12." },
    { q: "Closing a degree-1 node's only edge makes it…", options: ["slower", "unreachable", "heavier", "fine"], answer: 1, why: "No connected chain." },
    { q: "Chain capacities 60–20–60 pass at most…", options: ["140", "60", "20", "40"], answer: 2, why: "Bottleneck." },
    { q: "Max flow = 20 (route A) + 30 (route B) = ", options: ["30", "50", "600", "25"], answer: 1, why: "Separate routes add." } ] },
  { id: "tt-pg", course: "prog1", title: "Topic test — Programming Foundations I", pass: 70, minutes: 20, questions: [
    { q: "Which checks equality?", options: ["=", "===", "=>", ":="], answer: 1, why: "=== compares." },
    { q: "for (let i=1; i<=6; i++) runs…", options: ["5×", "6×", "7×", "∞"], answer: 1, why: "Inclusive." },
    { q: "total = total + 24 inside a loop is the…", options: ["counter pattern", "accumulator pattern", "guard", "bug"], answer: 1, why: "Accumulate." },
    { q: "return differs from print because it…", options: ["shows humans text", "gives the caller a value", "stops JS", "logs"], answer: 1, why: "Return feeds programs." },
    { q: "console.assert(x===8, 'm') reports when…", options: ["x===8", "x!==8", "always", "never"], answer: 1, why: "Failure condition." } ] },
];
const MOCK_EXAM = { id: "mock-a", title: "Mock exam A — Foundations (Stages 1–6)", pass: 60, minutes: 25, questions: [
  { q: "An FDE's three skill layers are…", options: ["code, deploy, sleep", "listen & model, build & ship, explain & hand over", "sell, bill, support", "design, test, deploy"], answer: 1, why: "The academy's spine." },
  { q: "250 ÷ 8 = 31 r 2. The 2 means…", options: ["rounding", "2 flyers left", "2 more bundles", "error"], answer: 1, why: "Real remainder." },
  { q: "{3}/{4} compared with {2}/{3}: ", options: ["{3}/{4} bigger", "{2}/{3} bigger", "equal", "uncomparable"], answer: 0, why: "9/12 vs 8/12." },
  { q: "12.4 + 3.85 + 0.05 = ", options: ["15.09", "16.30", "16.3", "16.35"], answer: 1, why: "16.30 (align points)." },
  { q: "£9.60→£10.80 is an increase of…", options: ["11.1%", "12.5%", "10%", "12%"], answer: 1, why: "÷ old (9.60)." },
  { q: "Fixed 45, contribution 1.75 → break-even cups:", options: ["25", "26", "27", "24"], answer: 1, why: "25.71 → round UP." },
  { q: "3(2n+4)+3(n−2) simplifies to…", options: ["9n+6", "9n+4", "6n+2", "9n+10"], answer: 1, why: "6n+12+3n−6." },
  { q: "true AND NOT(false) OR false = ", options: ["false", "true", "undefined", "error"], answer: 1, why: "(true AND true) OR false." },
  { q: "NOT(∃ late delivery) =", options: ["∃ late", "∀ on-time", "∀ late", "∃ on-time"], answer: 1, why: "No late = all on time." },
  { q: "Stall→Market 5, Market→Bakery 7, Stall→Depot 12, Depot→Bakery 9. Best Stall→Bakery:", options: ["21", "12", "16", "26"], answer: 1, why: "5+7=12." },
  { q: "Caps: Stall→Market 60, Market→Bakery 20. That route passes at most…", options: ["80", "60", "20", "40"], answer: 2, why: "Bottleneck." },
  { q: "'Some stall unpaid' verifies with…", options: ["all stalls", "one unpaid stall", "zero stalls", "a survey"], answer: 1, why: "∃ needs one." },
] };

/* ---------------- Career centre ---------------- */
const CAREER = {
  guide: [
    ["What the role is", "A Forward Deployed Engineer sits with customers, turns their situation into models and requirements, builds the solution, and hands it over honestly. The work is 30% code, 30% data, 40% communication — and the academy trains all three deliberately."],
    ["Where the role exists", "Consultancies and agencies, product companies with complex customers, and AI teams shipping grounded assistants. Titles vary: Forward Deployed Engineer, Solutions Engineer, Implementation Engineer, Customer Engineer. Read the responsibilities, not the title."],
    ["A typical day", "Morning: a customer call to pin down what 'the numbers look wrong' means. Midday: model the data flow, write or fix the cleaning script. Afternoon: demonstrate the change, update the handover document. Every day ends with writing — the FDE's real product is shared understanding."],
    ["How hiring works", "Hiring usually runs: application with portfolio → technical conversation grounded in YOUR projects → a small practical exercise → a communication exercise (explain a technical trade-off in plain language). The academy's portfolio and interview tracks map to exactly these stages."],
    ["Honest expectations", "The role varies enormously by region, seniority and industry — this academy deliberately quotes no salary figures, because a number copied from a job ad is not data. Check live listings in your region, and weight ranges by the stack and the travel expectations."],
  ],
  interview: [
    ["Explain break-even to a shop owner who hates maths.", "Model answer: 'It's the number of sales where the stall fee is exactly covered. Each roll pays back £2.50 after ingredients, so divide the fee by £2.50 — that's your target. Every roll after that is profit.' The skill: one number, one image, no jargon.", "Stage 2"],
    ["A customer says the numbers are wrong. Walk me through your first hour.", "Model answer: reproduce what they saw, check the pipeline's recent changes, reconcile one row end-to-end by hand, and state what I verified versus what I suspect. Never fix blind.", "Stage 3/6"],
    ["When is a graph misleading?", "Model answer: missing units, truncated axes, missing rows (the Sunday gap), and correlating without a designed comparison. I would label the question each chart answers before presenting it.", "Stage 6"],
    ["Why do language models hallucinate, and what is your fix?", "Model answer: they predict plausible text, not facts. Fix: retrieval over trusted sources, grounding with citations, and honest refusal with human handover — then an evaluation set to prove behaviour.", "Stage 15"],
    ["What does 'production-ready' require beyond a working demo?", "Model answer: checkable criteria — an evaluation set at scale, monitoring with owners, a clean-machine run, a rollback plan, and a signed handover. Until then I call it a demo.", "Stage 17"],
    ["Describe a time you changed your mind with data.", "Structure: the assumption I held, the number that contradicted it, what I re-checked, and what changed in the plan. Honesty about the process matters more than the outcome.", "Stage 6"],
    ["How do you test code you did not write?", "Model answer: read the tests first, run them, then probe boundaries by hand — zero, one, many, and the edges. Document gaps rather than patching silently.", "Stage 7"],
    ["Explain a database join in plain language.", "Model answer: 'Two tables that each keep part of the truth — orders and customers. A join stitches them by the shared key so each order row carries its customer's name.' Then a one-line SQL example.", "Stage 10"],
    ["A stakeholder wants AI in the product. What do you ask first?", "Model answer: what decision does it change, what sources would ground it, what is the cost of a wrong answer, and who owns the handover? If no source exists, I say so before building.", "Stage 15"],
    ["How do you estimate a delivery date you do not know?", "Model answer: decompose into factors with sources, give a range not a point, state sensitivity, and commit to updating the estimate at a fixed checkpoint.", "Stage 6"],
    ["What makes documentation good?", "Model answer: it answers the reader's next question, states limits plainly, and is versioned with the code it describes. I write handovers as if the reader is me in six months.", "Stage 17"],
    ["Walk me through your portfolio's best project.", "Structure: the customer's problem in one sentence, the approach, the artefacts, the honest limits, and what you would do differently. Every academy project ends with exactly this paragraph.", "Stage 18"],
  ],
  sysdesign: [
    ["Design a feedback dashboard for one shop", "Decide the three questions, the queries behind them, the refresh rate and the empty states. Reference approach: one small database, three labeled charts, numbers reconciled to source."],
    ["Design a grounded FAQ assistant", "Decide the corpus, retrieval, the grounding contract, refusals and the evaluation set. Reference approach: the academy's own AI lab, scaled — plus monitoring and an owner."],
    ["Design a small reporting pipeline", "Decide ingest, cleaning rules with an audit log, storage, and the weekly report. Reference approach: idempotent steps, unit conservation check, one command run."],
  ],
  portfolio: [
    ["Choose the artefacts", "Three to five projects showing range: one spreadsheet/model, one program with tests, one data pipeline, one AI demo with evaluation. Quality beats count."],
    ["Write each case study the same way", "Problem in one sentence → approach → artefacts (screenshots, code, evaluation table) → honest limits → what you would do differently. The academy's project pages generate this structure."],
    ["Show the verification", "Employers trust evidence: tests passing, audit lines, evaluation tables. Include the rubric scores from project submissions — they are real, they are yours."],
    ["Keep it honest", "Never call a demo production-ready. The limits section is what makes the rest credible."],
  ],
  cv: [
    ["Lead with the switch, not the gap", "One line: 'Career switcher trained through a verified, project-based engineering programme (18 stages, 15 graded projects)' — then evidence."],
    ["Skills section = evidence-backed only", "List what your projects prove: SQL over a real dataset, API design with validation, grounded AI with evaluation. No skill without an artefact."],
    ["Numbers you can defend", "'Cleaned a 144-row dataset with a five-rule audit log' beats 'data cleaning'. Every number in your CV should trace to a project page."],
    ["One page, plain words", "The FDE's writing test starts with the CV: short sentences, no jargon, no template filler."],
  ],
  comms: [
    ["Scenario A — the vague brief", "'Make the numbers better.' Practice: ask the three questions (which numbers, better how, by when), then write back a signed one-paragraph requirement. Graded like a project: clarity, assumptions, tone."],
    ["Scenario B — the mid-project change", "Day 4 of 10, scope doubles. Practice: re-plan honestly (what moves, what drops), update the memo, tell the client before the work — not after. The handover memo is the artefact."],
    ["Scenario C — the failed demo", "The assistant refuses a question it should answer. Practice: acknowledge, diagnose aloud (retrieval gap), state the fix and the new evaluation case, and schedule the re-demo. Never blame the tool in front of the client."],
  ],
};

const HOME_FAQ = [
  ["Do I need any computer science background?", "No. The programme starts from everyday arithmetic in plain language. Every technical term is underlined and opens the glossary; mathematics is taught from zero in Stage 2."],
  ["How much time per week?", "The default plan is three 30-minute sessions per week. The dashboard adapts recommendations to what you actually finish — not what you promise."],
  ["Is this a real qualification?", "It is a verified portfolio: every lesson completes through a passed knowledge check, every project through a graded rubric. Employers can see exactly what you built and how it was verified."],
  ["Are the books and downloads free?", "Yes — every textbook and the project handbook are readable online and downloadable from the book library at no cost."],
  ["Where does my progress live?", "In this demo build, your progress is stored locally in your browser (exportable as a file from the dashboard). Nothing is invented: every number on your dashboard comes from your own recorded activity."],
];

/* ---------------- DATA assembly ---------------- */
const DATA = {
  stages: STAGES, phases: PHASES, courses: COURSES, lessons: LESSONS,
  books: BOOKS, projects: PROJECTS, labs: LABS, tests: TOPIC_TESTS, mock: MOCK_EXAM,
  career: CAREER, homeFaq: HOME_FAQ,
  courseById: id => COURSES.find(c => c.id === id),
  lessonsOf: cid => LESSONS.filter(l => l.course === cid),
  lessonById: id => LESSONS.find(l => l.id === id),
  bookById: id => BOOKS.find(b => b.id === id),
  projectById: id => PROJECTS.find(p => p.id === id),
  testById: id => TOPIC_TESTS.find(t => t.id === id),
  labById: id => LABS.find(l => l.id === id),
  glossaryAll() {
    const removed = new Set(store.s.glossaryEdits.removed);
    const edited = store.s.glossaryEdits.edited;
    const added = store.s.glossaryEdits.added.map(a => ({ ...a, custom: true }));
    return DATA_READY_GLOSSARY
      .filter(g => !removed.has(g.key))
      .map(g => edited[g.key] ? { ...g, ...edited[g.key], edited: true } : g)
      .concat(added);
  },
  searchAll(q) {
    const s = q.toLowerCase();
    const hits = [];
    for (const l of LESSONS) if (l.title.toLowerCase().includes(s) || l.module.toLowerCase().includes(s) || l.blocks.some(b => (b.x || "").toLowerCase().includes(s))) hits.push({ kind: "Lesson", title: l.title, sub: DATA.courseById(l.course).title, nav: "lesson/" + l.id });
    for (const b of BOOKS) if (b.title.toLowerCase().includes(s) || b.desc.toLowerCase().includes(s)) hits.push({ kind: "Book", title: b.title, sub: b.subject, nav: "book/" + b.id });
    for (const g of DATA.glossaryAll()) if (g.term.toLowerCase().includes(s) || g.simple.toLowerCase().includes(s)) hits.push({ kind: "Glossary", title: g.term, sub: g.simple, nav: "glossary" });
    for (const p of PROJECTS) if (p.title.toLowerCase().includes(s) || p.brief.toLowerCase().includes(s)) hits.push({ kind: "Project", title: p.title, sub: "Level " + p.level, nav: "project/" + p.id });
    for (const c of COURSES) if (c.title.toLowerCase().includes(s) || c.blurb.toLowerCase().includes(s)) hits.push({ kind: "Course", title: c.title, sub: c.subject, nav: "course/" + c.id });
    return hits;
  },
};
FDE.DATA = DATA;
