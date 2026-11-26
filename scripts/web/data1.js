/* ============ FDE Academy — data part 1: stages, courses, Start Here + Foundation Mathematics ============ */
"use strict";
const T = (k, l) => FDE.term(k, l);

const STAGES = [
  { id: "s1", n: 1, phase: "A", title: "Start Here & Study Skills", meta: "Orientation · no prerequisites" },
  { id: "s2", n: 2, phase: "A", title: "Mathematical Foundations", meta: "Book: Foundation Mathematics · Project P1.1" },
  { id: "s3", n: 3, phase: "A", title: "Algebra Essentials", meta: "Book: Algebra · Topic test" },
  { id: "s4", n: 4, phase: "A", title: "Logic & Proof", meta: "Book: Logic & Proof · Project P1.2" },
  { id: "s5", n: 5, phase: "A", title: "Graphs & Networks", meta: "Book: Graphs & Networks · Topic test" },
  { id: "s6", n: 6, phase: "A", title: "Problem Solving", meta: "Book: Problem Solving · Mock exam A" },
  { id: "s7", n: 7, phase: "B", title: "Programming Foundations I: Python", meta: "Labs: coding basics · Project P2.1" },
  { id: "s8", n: 8, phase: "B", title: "Programming Foundations II: Files & Automation", meta: "Labs: file handling · Project P2.2" },
  { id: "s9", n: 9, phase: "C", title: "Data & Databases I: Cleaning", meta: "Dataset: market sales · Project P3.1" },
  { id: "s10", n: 10, phase: "C", title: "Data & Databases II: SQL", meta: "Labs: SQL practice · Project P3.2" },
  { id: "s11", n: 11, phase: "D", title: "Application Development I: APIs", meta: "Labs: API exercises · Project P4.1" },
  { id: "s12", n: 12, phase: "D", title: "Application Development II: Frontends", meta: "Labs: UI basics · Project P4.2" },
  { id: "s13", n: 13, phase: "E", title: "Cloud & Deployment", meta: "Labs: containers · Project P5.1" },
  { id: "s14", n: 14, phase: "E", title: "Operations & Monitoring", meta: "Labs: ops drills · Project P5.2" },
  { id: "s15", n: 15, phase: "F", title: "AI Engineering I: Assistants", meta: "Labs: AI laboratory · Project P6.1" },
  { id: "s16", n: 16, phase: "F", title: "AI Engineering II: Search & Evaluation", meta: "Labs: AI laboratory · Project P6.2" },
  { id: "s17", n: 17, phase: "G", title: "Complete FDE Deployments", meta: "Projects P7.1–P7.3 · simulated engagements" },
  { id: "s18", n: 18, phase: "G", title: "Career Launch", meta: "Career Centre · portfolio & interviews" },
];
const PHASES = {
  A: "Foundations — mathematics first", B: "Programming", C: "Data & Databases",
  D: "Application Development", E: "Cloud & Operations", F: "AI Engineering", G: "Deployment & Career",
};
const stageById = id => STAGES.find(s => s.id === id);

const COURSES = [
  { id: "start", stage: "s1", title: "Start Here: Study Skills & Orientation", subject: "Orientation", difficulty: "Beginner",
    blurb: "How the academy works, how to study maths and code honestly, and how progress is verified.",
    prereq: "None — this is the front door.",
    objectives: ["Understand what a Forward Deployed Engineer does and does not do", "Set up a working study routine you can keep", "Navigate the academy: roadmap, courses, books, labs, projects"] },
  { id: "fm", stage: "s2", title: "Foundation Mathematics", subject: "Mathematics", difficulty: "Beginner",
    blurb: "Arithmetic, ratios and percentages taught through market-stall, delivery and budget stories. No prior confidence assumed.",
    prereq: T('stage', 'Stage 1') + " (Start Here) only.",
    objectives: ["Compute confidently with whole numbers, fractions and percentages", "Model cost, revenue and break-even for a small business", "Read and build simple tables and charts"] },
  { id: "algebra", stage: "s3", title: "Algebra Essentials", subject: "Mathematics", difficulty: "Beginner",
    blurb: "From expressions to quadratics: letters that stand for numbers, and equations that answer business questions.",
    prereq: "Stage 2 — Foundation Mathematics.",
    objectives: ["Build and simplify expressions from word problems", "Solve linear equations and check solutions", "Read and interpret straight-line and quadratic graphs"] },
  { id: "logic", stage: "s4", title: "Logic & Proof", subject: "Mathematics", difficulty: "Intermediate",
    blurb: "Statements, truth tables and proof techniques — the reasoning layer behind every reliable system.",
    prereq: "Stage 3 — Algebra Essentials.",
    objectives: ["Write precise statements with and, or, not and if-then", "Test claims with truth tables and counterexamples", "Apply direct proof and proof by cases to small claims"] },
  { id: "graphs", stage: "s5", title: "Graphs & Networks", subject: "Mathematics", difficulty: "Intermediate",
    blurb: "Shortest paths, connectivity and flows — modelling roads, deliveries and networks mathematically.",
    prereq: "Stage 3 and Stage 4.",
    objectives: ["Model real situations as graphs (nodes and edges)", "Find shortest paths and explain what they assume", "Judge reachability and redundancy in small networks"] },
  { id: "ps", stage: "s6", title: "Problem Solving", subject: "Mathematics", difficulty: "Intermediate",
    blurb: "A repeatable method: understand, plan, solve, check — applied to messy, realistic questions.",
    prereq: "Stages 2–5.",
    objectives: ["Apply the four-step method to unfamiliar problems", "Estimate quantities sensibly and state assumptions", "Check answers for plausibility before trusting them"] },
  { id: "prog1", stage: "s7", title: "Programming Foundations I", subject: "Programming", difficulty: "Beginner",
    blurb: "First programs with variables, decisions and loops — written, run and tested in the browser sandbox.",
    prereq: "Stage 6 recommended; Stage 2 required.",
    objectives: ["Write and run small JavaScript programs in the sandboxed lab", "Use variables, decisions and loops correctly", "Predict program output before running it — then verify"] },
  { id: "ai1", stage: "s15", title: "AI Engineering I: Assistants", subject: "AI", difficulty: "Advanced",
    blurb: "How retrieval-grounded assistants really work: sources, grounding, refusals and honest evaluation.",
    prereq: "Stages 7–14 (or strong programming background).",
    objectives: ["Explain retrieval, grounding and refusals in plain language", "Build a tiny FAQ assistant with a grounded answer rule", "Evaluate answers with a small test set"] },
];

const LESSONS = [];
function lesson(l) { LESSONS.push(l); }

/* ---------------- Course: Start Here (Stage 1) ---------------- */
lesson({
  id: "st-1", course: "start", stage: "s1", module: "Getting ready", chapter: "Orientation", minutes: 10,
  title: "What is a Forward Deployed Engineer?",
  objectives: ["Say in one sentence what an FDE does", "Name the three skills the academy trains", "Explain why mathematics comes first here"],
  blocks: [
    { t: "p", x: `A ${T("forward-deployed-engineer", "Forward Deployed Engineer")} works directly with customers. When a bakery cannot trust its sales numbers, or a retailer wants an assistant that answers only from its own FAQ, an FDE sits with the people who understand the problem, works out what mathematics and software can honestly deliver, builds it, and explains it in plain language. The job is equal parts listener, modeller, builder and translator.` },
    { t: "p", x: `Many engineers rarely meet customers. An FDE is deployed to the edge — the customer's actual problem — which is why the role is named that way. It is a real, growing job family in consulting firms, product companies and AI teams, and it rewards exactly the skills this academy trains: careful mathematics, honest programming, and clear communication.` },
    { t: "table", caption: "The three skill layers and where the academy teaches them", headers: ["Skill", "What it means", "Taught in"], rows: [
      ["Listen & model", "Turn a customer's story into numbers, rules and requirements", "Stages 1–6 (mathematics and logic)"],
      ["Build & ship", "Write programs, clean data, connect APIs, deploy services", "Stages 7–14"],
      ["Explain & hand over", "Document, demonstrate, and state limitations honestly", "Every project, then Stage 18"] ] },
    { t: "callout", style: "info", x: "Why mathematics first? Because every later skill — programming, data, AI — quietly depends on it. A learner who can compute a break-even point and reason about a graph can learn any engineering tool. So Stage 2 is Foundation Mathematics, and it assumes nothing." },
    { t: "p", x: `One habit matters more than talent here: ${T("verification", "verification")}. Every claim in this academy is checked — answers recomputed, outputs tested, demonstrations ticked against a checklist. You will practise that habit from your very first quiz.` },
  ],
  quiz: [
    { q: "In one sentence, what does a Forward Deployed Engineer do?", options: ["Works only in a head office writing internal tools", "Works directly with customers to model their problem, build the solution and explain it", "Sells software to customers over the phone", "Manages the company's social media"], answer: 1,
      why: "The defining feature is working at the customer's edge: listening, modelling, building and explaining." },
    { q: "Which skill layer does the academy teach FIRST (Stages 1–6)?", options: ["Cloud deployment", "Listen & model — mathematics and logic", "AI engineering", "Interview technique"], answer: 1,
      why: "Stages 1–6 are the foundations: mathematics first, then logic and problem solving." },
    { q: "What does 'verification' mean in this academy?", options: ["Watching the lesson video twice", "Checking answers and outputs against rules or recomputation before trusting them", "Asking a friend to confirm", "Skipping quizzes to save time"], answer: 1,
      why: "Verification is the habit of checking work — recomputing, testing, ticking checklists — before trusting it." },
  ],
});
lesson({
  id: "st-2", course: "start", stage: "s1", module: "Getting ready", chapter: "Orientation", minutes: 12,
  title: "How to study here (and actually finish)",
  objectives: ["Set up a weekly study routine that survives a busy life", "Use the dashboard, notes and bookmarks to support memory", "Explain the academy's honesty rules for quizzes and projects"],
  blocks: [
    { t: "p", x: `The default plan is three sessions of about 30 minutes per week. That sounds small — deliberately. A routine you can keep beats an ambitious plan you abandon in week two. Set your goal on the dashboard; the recommendation engine adapts to what you actually finish, not to what you promise.` },
    { t: "p", x: `Use the tools the way working engineers do. Bookmark lessons you need to revisit. Keep notes in the lesson's notes panel — writing one sentence in your own words ("break-even is where money in equals money out") beats re-reading three times. The ${T("glossary", "glossary")} is one tap away whenever a word is underlined; you never have to leave a lesson to decode a term.` },
    { t: "ul", items: [
      "Sessions: aim for short and regular — 25–30 minutes, three times a week.",
      "Order: follow the roadmap; stages unlock in sequence and mathematics comes first.",
      "Quizzes: attempt honestly before looking at explanations — the retry is booked, never withheld.",
      "Projects: build them for real. The portfolio you will show employers is made of this work." ] },
    { t: "callout", style: "warn", x: "Honesty rules: quiz attempts are recorded as they happen; hints unlock only after a real attempt; project submissions require every demonstration box ticked. This protects the value of your own portfolio — employers can trust what it says." },
  ],
  quiz: [
    { q: "What is the default weekly study plan?", options: ["One 4-hour Sunday session", "Three sessions of about 30 minutes", "20 minutes every single day, no exceptions", "Whatever is left of the weekend"], answer: 1,
      why: "Short and regular beats rare and long — the default is three 30-minute sessions." },
    { q: "What is the best use of the notes panel?", options: ["Copy the lesson text word for word", "Write the idea in your own words", "Leave it empty and re-read instead", "Store links only"], answer: 1,
      why: "Explaining in your own words forces understanding — that is what makes notes work." },
    { q: "When do hints unlock in a lab?", options: ["Immediately", "After one honest attempt at the task", "Never", "After paying"], answer: 1,
      why: "Hints follow attempts — the academy protects the productive struggle that builds skill." },
  ],
});
lesson({
  id: "st-3", course: "start", stage: "s1", module: "Getting ready", chapter: "Orientation", minutes: 10,
  title: "A tour of the platform",
  objectives: ["Find anything in the academy within two clicks", "Know what each section is for", "Complete your first progress action"],
  blocks: [
    { t: "p", x: `Everything is reachable from the top navigation and the footer, and the ${T("dashboard", "dashboard")} always tells you where you are and what is next. Here is the map:` },
    { t: "table", headers: ["Section", "What it is for"], rows: [
      ["Roadmap", "The 18-stage journey; your current stage, prerequisites, books and projects per stage"],
      ["Courses", "The teaching: lessons with objectives, examples, exercises and knowledge checks"],
      ["Books", "The academy's textbooks, readable online and downloadable"],
      ["Labs", "Hands-on practice: coding, maths drills, SQL, APIs and an AI laboratory"],
      ["Projects", "Guided builds with rubrics — your future portfolio"],
      ["Assessments", "Lesson quizzes, topic tests, one mock exam, and your progress report"],
      ["Glossary", "Every technical term in plain language"] ] },
    { t: "p", x: `Your progress only counts when it is verified: a lesson completes when its knowledge check is passed, a book chapter when you mark it read, a project when its checklist passes. That is what makes the numbers on your dashboard honest.` },
    { t: "p", x: `Try it now: open the ${T("dashboard", "dashboard")} and set your weekly goal. Your first recommendation is already waiting.` },
  ],
  quiz: [
    { q: "Where does the platform always tell you what to do next?", options: ["The footer", "The dashboard", "The glossary", "Your email"], answer: 1,
      why: "The dashboard shows current stage and the single recommended next activity." },
    { q: "When does a lesson count as complete?", options: ["When you open it", "When you pass its knowledge check", "After 10 minutes", "When you bookmark it"], answer: 1,
      why: "Completion is verified by the knowledge check — progress means proof." },
    { q: "How many clicks should anything in the academy be from anywhere?", options: ["Ten", "About two", "Exactly five", "One, always"], answer: 1,
      why: "The navigation and footer mirror the whole sitemap — about two clicks to anything." },
  ],
});

/* ---------------- Course: Foundation Mathematics (Stage 2) ---------------- */
lesson({
  id: "fm-1", course: "fm", stage: "s2", module: "Numbers and operations", chapter: "1. Numbers and operations", minutes: 25,
  title: "The four operations, in real shops",
  objectives: ["Choose the right operation for a business question", "Compute with confidence and check the result", "Spot which operation a story problem is really asking for"],
  blocks: [
    { t: "p", x: `Every business question about quantities uses one of the four operations. The skill is not computing — a calculator does that — it is knowing ${T("operation", "which operation")} the story is asking for. Addition brings quantities together ("144 rolls were baked, 57 sold — 201 handled so far"). Subtraction finds what remains or what changed. Multiplication repeats equal groups ("6 crates of 24 rolls"). Division shares or groups ("144 rolls into bags of 6").` },
    { t: "table", caption: "Story cues and the operations they signal", headers: ["The story says", "Operation", "Example"], rows: [
      ["altogether, in total, combined", "Addition", "57 + 144 + 12 = 213 rolls handled"],
      ["left, remaining, difference", "Subtraction", "144 − 57 = 87 rolls left"],
      ["each crate holds…, rows of…", "Multiplication", "6 crates × 24 = 144 rolls"],
      ["shared equally, per box, each gets", "Division", "144 ÷ 6 = 24 rolls per box"] ] },
    { t: "p", x: `Amara runs a market stall. On Friday she baked 144 rolls and sold 57 by noon. In the afternoon she sold rolls in bags of 6. A customer asks: "how many bags can I still buy, and how many rolls would be left over?" That is two operations in one story: first subtract to find what remains, then divide — and the ${T("remainder", "remainder")} is the leftover rolls, not a rounding error to ignore.` },
    { t: "steps", title: "Amara's afternoon bags", steps: [
      { expr: "144 − 57 = 87", note: "Subtract: rolls remaining after the morning." },
      { expr: "87 ÷ 6 = 14 remainder 3", note: "Divide: 14 full bags of 6, because 14 × 6 = 84." },
      { expr: "14 bags, 3 rolls left over", note: "The remainder answers the second half of the question." } ] },
    { t: "exercise", prompt: "A courier carries 250 flyers and delivers them in bundles of 8 to each shop. How many complete bundles can be delivered, and how many flyers stay in the bag?",
      hint: "First operation: none needed — 250 is already the total. Second: 250 ÷ 8, keep the remainder honest.",
      solution: "250 ÷ 8 = 31 remainder 2 → 31 complete bundles (248 flyers), 2 flyers left in the bag." },
  ],
  quiz: [
    { q: "A story says 'shared equally among the stalls'. Which operation?", options: ["Addition", "Multiplication", "Division", "Subtraction"], answer: 2,
      why: "'Shared equally' signals division — splitting into equal groups." },
    { q: "144 − 57 = ?", options: ["97", "87", "77", "91"], answer: 1,
      why: "144 − 57: 144 − 50 = 94, then 94 − 7 = 87." },
    { q: "87 ÷ 6 gives 14 remainder r. What is r, and what does it mean here?", options: ["r = 2 — rounding error to discard", "r = 3 — three rolls left unbought", "r = 3 — add it to the bags", "r = 0 — it divides exactly"], answer: 1,
      why: "14 × 6 = 84, so 3 remain. In this story those are real rolls, not noise." },
  ],
});
lesson({
  id: "fm-2", course: "fm", stage: "s2", module: "Numbers and operations", chapter: "1. Numbers and operations", minutes: 25,
  title: "Fractions you can see",
  objectives: ["Read a fraction as parts of a whole, not two separate numbers", "Compare fractions using pictures and equivalents", "Add fractions with the same denominator"],
  blocks: [
    { t: "p", x: `A ${T("fraction", "fraction")} names a part of a whole. In {3}/{4}, the bottom number (the denominator) says the whole was cut into 4 equal parts; the top number (the numerator) says we took 3 of them. The bar itself is the important part — it means "out of", not "divide whenever you feel like it".` },
    { t: "frac", n: 3, d: 4, label: "Three quarters of the tray" },
    { t: "p", x: `Comparing fractions is easier when the parts are the same size. {2}/{4} and {1}/{2} shade the same amount — they are ${T("equivalent-fractions", "equivalent")}. To compare {2}/{3} with {3}/{4}, cut both wholes into 12: {8}/{12} against {9}/{12}, so {3}/{4} is bigger. Same denominator, compare tops; same top, compare bottoms (smaller bottom = bigger parts).` },
    { t: "p", x: `Adding fractions only works when the parts are the same size already: {2}/{5} + {1}/{5} = {3}/{5}. Amara sells {2}/{5} of her rolls before noon and another {1}/{5} by two o'clock — three fifths gone, two fifths left. When denominators differ, first rename both into a common one, then add tops.` },
    { t: "exercise", prompt: "Amara bakes one big tray. By 10am she has sold {1}/{4} of it, by noon another {2}/{4}. What fraction is left, and is that more or less than half?",
      hint: "Same denominator — add tops, then compare with {2}/{4}.",
      solution: "{1}/{4} + {2}/{4} = {3}/{4} sold, so {1}/{4} remains. A quarter is less than a half." },
  ],
  quiz: [
    { q: "In {3}/{5}, what does the 5 tell you?", options: ["We took 5 parts", "The whole was cut into 5 equal parts", "The answer is 5", "Five people are sharing"], answer: 1,
      why: "The denominator counts the equal parts of the whole." },
    { q: "Which is bigger: {2}/{3} or {3}/{4}?", options: ["{2}/{3}", "{3}/{4}", "They are equal", "Cannot compare"], answer: 1,
      why: "Cut into twelfths: {8}/{12} vs {9}/{12} — three quarters wins." },
    { q: "{2}/{7} + {3}/{7} = ?", options: ["{5}/{14}", "{5}/{7}", "{6}/{7}", "{1}/{2}"], answer: 1,
      why: "Same denominator: add the tops, keep the bottom — five sevenths." },
  ],
});
lesson({
  id: "fm-3", course: "fm", stage: "s2", module: "Numbers and operations", chapter: "1. Numbers and operations", minutes: 25,
  title: "Decimals and money",
  objectives: ["Read decimals as fractions with power-of-ten denominators", "Add and subtract money amounts without alignment mistakes", "Round money honestly — up, down, and to the nearest"],
  blocks: [
    { t: "p", x: `A decimal is a fraction wearing a different uniform: 0.25 is {25}/{100}, 0.5 is {5}/{10} is {1}/{2}. Money makes this concrete — £12.40 is twelve pounds and forty hundredths of a hundred pennies. The place values march by tens: tenths, hundredths, thousandths.` },
    { t: "p", x: `The one rule that prevents most money mistakes: align the decimal points before adding or subtracting. 12.4 + 3.85 is a trap unless you write 12.40 + 3.85 = 16.25. Amara's till does this for her, but an FDE writing a script must do it for the till.` },
    { t: "p", x: `Rounding is a decision with consequences. Round £4.49 down to £4 for the business report and the month's totals drift by pennies that add up. The honest rule: say which way you rounded and why. "Nearest penny" is the default; "round up to whole items" appears whenever you cannot sell two-thirds of a roll.` },
    { t: "p", x: `Try the number line: place 4.49 between its neighbours and watch the nearest-hundredth snaps.` },
    { t: "nl", min: 4.4, max: 4.6, step: 0.01, value: 4.49, label: "Where does 4.49 sit?", unit: " GBP", snap: v => v >= 4.495 ? "Rounds to 4.50 (nearest hundredth)" : "Rounds to 4.49 — right where it is" },
    { t: "exercise", prompt: "The till shows 12.4 + 3.85 + 0.05 for one customer's basket. What is the total, and which alignment mistake would a careless script make?",
      hint: "Write every amount with two decimal places first.",
      solution: "12.40 + 3.85 + 0.05 = 16.30. The classic mistake is adding digits column-by-column without aligning points (12.4 + 3.85 misread as 12.40 + 38.5)." },
  ],
  quiz: [
    { q: "0.5 is the same as which fraction?", options: ["{1}/{5}", "{1}/{2}", "{5}/{100}", "{2}/{5}"], answer: 1,
      why: "0.5 = five tenths = one half." },
    { q: "Before adding money amounts by hand, you should always…", options: ["Round to pounds", "Align the decimal points", "Multiply everything by 100 and never divide back", "Estimate"], answer: 1,
      why: "Aligning decimal points keeps place values in the right columns." },
    { q: "4.49 rounded to the nearest ten pence (0.1) is…", options: ["4.4", "4.5", "4.49", "4.0"], answer: 1,
      why: "4.49 is one hundredth below 4.5 — nearest tenth wins." },
  ],
});
lesson({
  id: "fm-4", course: "fm", stage: "s2", module: "Ratios, percentages and money", chapter: "2. Ratios and proportions", minutes: 25,
  title: "Ratios and best buys",
  objectives: ["Use ratio language and scale recipes or orders", "Compute unit prices and compare them fairly", "Recognise when a 'special offer' is not special"],
  blocks: [
    { t: "p", x: `A ${T("ratio", "ratio")} compares quantities in a fixed relationship. Amara's dough recipe uses flour and water in ratio 5 : 3 — five parts flour to three parts water. Double the flour and you must double the water; the relationship, not the raw numbers, is the rule. Scaling a recipe, an order or a delivery route is always this move: multiply every part by the same factor.` },
    { t: "steps", title: "Scaling the recipe to 2 kg of flour", steps: [
      { expr: "5 : 3 means flour = 5 parts, water = 3 parts", note: "Read the ratio as parts, not absolute weights." },
      { expr: "2 kg flour → 1 part = 2 ÷ 5 = 0.4 kg", note: "Find what one part is worth." },
      { expr: "water = 3 × 0.4 = 1.2 kg", note: "Scale every part by the same factor." } ] },
    { t: "p", x: `The same arithmetic answers every "which is cheaper?" question. Shelf prices compare unfairly when pack sizes differ — a 300 g pack at £1.20 and a 500 g pack at £1.80 are only comparable through their ${T("unit-price", "unit price")}: price per 100 g. First pack: 120 ÷ 3 = 40p per 100 g. Second: 180 ÷ 5 = 36p per 100 g. The bigger pack wins, by 4p per 100 g — but only if you will actually use 500 g.` },
    { t: "exercise", prompt: "Tea comes as 250 g for £3.10 or 400 g for £4.60. Which has the lower unit price, and by how much per 100 g?",
      hint: "Price ÷ size gives price per gram; multiply by 100 for the standard comparison.",
      solution: "310 ÷ 2.5 = 124p/100 g vs 460 ÷ 4 = 115p/100 g. The 400 g pack is 9p per 100 g cheaper." },
    { t: "callout", style: "info", x: "The FDE habit: when a customer says 'the offer is cheaper', recompute the unit price yourself. Special offers are sized to look cheaper; arithmetic is not fooled." },
  ],
  quiz: [
    { q: "A ratio is 5 : 3. You now have 10 parts of the first quantity. How many of the second keeps the ratio?", options: ["3", "6", "8", "5"], answer: 1,
      why: "The factor is ×2, so the second quantity scales to 6." },
    { q: "Which is the fair way to compare a 300 g pack and a 500 g pack?", options: ["Whichever costs less overall", "Compare price per 100 g", "Compare price per pack", "Whichever is on offer"], answer: 1,
      why: "Unit price makes different sizes comparable." },
    { q: "£1.20 for 300 g is what per 100 g?", options: ["36p", "40p", "44p", "24p"], answer: 1,
      why: "120p ÷ 3 = 40p per 100 g." },
  ],
});
lesson({
  id: "fm-5", course: "fm", stage: "s2", module: "Ratios, percentages and money", chapter: "2. Ratios and proportions", minutes: 30,
  title: "Percentages that mean something",
  objectives: ["Compute percentage of an amount, and percentage change, correctly", "Read a percentage as a rate per hundred in context", "Apply discounts and VAT-style markups with clear working"],
  blocks: [
    { t: "p", x: `A percentage is a fraction with a promised denominator: "per hundred". 35% means {35}/{100} of whatever the whole is. The whole is the trap — "sales up 50%" can be honest and still tiny if the starting month was one bad week. Always ask: fifty percent of what?` },
    { t: "pct", pct: 35, of: 60, label: "35% of Amara's 60 morning rolls" },
    { t: "p", x: `Two everyday computations cover most business life. Percentage of an amount: 35% of 60 = 0.35 × 60 = 21 rolls sold in the morning rush. Percentage change: (new − old) ÷ old × 100 — if takings go from £240 to £300, that is 60 ÷ 240 = 25% up. Notice the change is always divided by the ${T("base", "old value")}, not the new one.` },
    { t: "steps", title: "A 20% discount on £18.50", steps: [
      { expr: "20% of 18.50 = 0.20 × 18.50 = 3.70", note: "Find the discount amount." },
      { expr: "18.50 − 3.70 = 14.80", note: "Subtract to get the final price." },
      { expr: "Check: 14.80 ÷ 18.50 = 0.8 → 80%", note: "Paying 80% of the original confirms the 20% off." } ] },
    { t: "exercise", prompt: "A supplier raises flour from £9.60 to £10.80 per 5 kg. What is the percentage increase, and what does a careless calculation get wrong here?",
      hint: "Change ÷ old × 100. The careless version divides by the NEW price.",
      solution: "1.20 ÷ 9.60 = 0.125 → 12.5% increase. Dividing by 10.80 would give ≈11.1% — the wrong base." },
  ],
  quiz: [
    { q: "35% of 60 is…", options: ["18", "21", "24", "35"], answer: 1,
      why: "0.35 × 60 = 21." },
    { q: "Takings rise from £240 to £300. The percentage change is…", options: ["20%", "25%", "60%", "12.5%"], answer: 1,
      why: "60 ÷ 240 = 0.25 → 25%, divided by the OLD value." },
    { q: "Why does a 20% discount followed by a 20% markup not return the original price?", options: ["Because percentages are random", "The second percentage uses a different (lower) base", "Rounding", "It does return it"], answer: 1,
      why: "100 → 80 → 96: the markup is 20% of 80, not 20% of 100." },
  ],
});
lesson({
  id: "fm-6", course: "fm", stage: "s2", module: "Ratios, percentages and money", chapter: "2. Ratios and proportions", minutes: 30,
  title: "Break-even: the first business model",
  objectives: ["Build the break-even equation from a customer's costs", "Compute break-even quantity and interpret the remainder honestly", "Explain what break-even does and does not assume"],
  blocks: [
    { t: "p", x: `The ${T("break-even", "break-even point")} is where money in exactly equals money out — no profit, no loss. Every business question starts here because it is the smallest model that still tells the truth. Amara pays a £20 stall fee whether she sells one roll or three hundred (${T("fixed-cost", "fixed cost")}); each roll sells at £4.00 and costs £1.50 in flour and butter (variable cost), so each roll contributes £2.50.` },
    { t: "ieq", caption: "Break-even explorer — drag the sliders", sliders: [
      { key: "fc", label: "Fixed cost £", min: 0, max: 60, step: 1, val: 20 },
      { key: "p", label: "Price £ per roll", min: 1, max: 8, step: 0.25, val: 4 },
      { key: "c", label: "Variable cost £ per roll", min: 0.25, max: 4, step: 0.25, val: 1.5 } ],
      display: v => v.p <= v.c ? `Contribution = ${v.p} − ${v.c} = ${(v.p - v.c).toFixed(2)} — every roll LOSES money. Break-even is unreachable.` :
        `Contribution = ${v.p} − ${v.c} = £${(v.p - v.c).toFixed(2)} → Break-even = {${v.fc}}/{${(v.p - v.c).toFixed(2)}} ≈ ${Math.ceil(v.fc / (v.p - v.c))} rolls`,
      note: v => v.p <= v.c ? "The stall fee can never be covered — this is why pricing below cost cannot be rescued by volume." :
        `She must round UP to ${Math.ceil(v.fc / (v.p - v.c))} whole rolls — ${Math.floor(v.fc / (v.p - v.c))} rolls would leave her a little short.` },
    { t: "steps", title: "The standard case", steps: [
      { expr: "Contribution = price − variable cost = 4.00 − 1.50 = £2.50", note: "What each sale actually adds toward the stall fee." },
      { expr: "Break-even = {fixed cost}/{contribution} = {20}/{2.50} = 8", note: "Eight rolls covers everything exactly." },
      { expr: "Roll 9 onward earns £2.50 profit each", note: "This is why businesses care about contribution, not just price." } ] },
    { t: "p", x: `What the model assumes matters as much as the number it returns: prices and costs stay the same over the period, every roll sells, and there is exactly one product. An FDE states these assumptions in the handover document — a model that hides its assumptions is a model that will be trusted exactly once too many.` },
    { t: "exercise", prompt: "A coffee cart pays £45 per day for its pitch. Each cup sells at £2.80 and costs £1.05 to make. Compute the break-even number of cups and the profit on the 60th cup.",
      hint: "Contribution first, then divide, then round up if needed.",
      solution: "Contribution = 2.80 − 1.05 = £1.75. Break-even = 45 ÷ 1.75 ≈ 25.7 → 26 cups (25 cups = £43.75, still £1.25 short). Cup 60: profit = (60 − 26) × 1.75 = £59.50." },
  ],
  quiz: [
    { q: "Each roll sells at £4.00 and costs £1.50 to make. The £2.50 difference is called…", options: ["Profit margin on the day", "Contribution per roll", "Fixed cost", "Revenue"], answer: 1,
      why: "Contribution is price minus variable cost — it contributes toward covering fixed costs." },
    { q: "Fixed cost £20, contribution £2.50. Break-even is…", options: ["5 rolls", "8 rolls", "10 rolls", "22 rolls"], answer: 1,
      why: "20 ÷ 2.5 = 8 exactly." },
    { q: "Why round break-even UP to a whole number?", options: ["Rounding is polite", "Selling fewer than the exact value leaves the fee partly unpaid", "Rolls come in tens", "The calculator says so"], answer: 1,
      why: "A fractional roll cannot be sold — the first whole number at or above break-even is the honest answer." },
  ],
});
