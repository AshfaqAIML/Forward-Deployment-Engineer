/* ============ FDE Academy — data part 4: books, glossary, projects ============ */
"use strict";

/* ---------------- Books ---------------- */
const BOOKS = [
  {
    id: "fm", title: "Foundation Mathematics", subject: "Mathematics", difficulty: "Beginner",
    pages: 61, stage: "s2", course: "fm", color: "#1A2330",
    desc: "The complete beginner's mathematics textbook: from the four operations to break-even, every concept introduced through Amara's market stall and checked honestly.",
    objectives: ["Operate confidently with numbers, fractions, decimals and percentages", "Model cost, revenue and break-even", "Read tables and charts critically"],
    chapters: [
      { t: "The four operations", full: true, blocks: [
        { t: "p", x: "Every business question about quantities uses one of the four operations: addition brings quantities together, subtraction finds what remains, multiplication repeats equal groups, division shares them out. The skill is recognising which one a story asks for — the story cues (in total, left over, each crate, shared equally) map directly onto +, −, × and ÷." },
        { t: "p", x: "Amara's stall makes the abstractions concrete. 144 rolls baked, 57 sold by noon, bags of 6 in the afternoon: subtract to find what remains, divide to find full bags, and treat the remainder as real rolls rather than a rounding error. Remainders are where honesty lives in division." },
        { t: "steps", title: "The afternoon bags, revisited", steps: [
          { expr: "144 − 57 = 87", note: "What remains." },
          { expr: "87 ÷ 6 = 14 r 3", note: "14 full bags, 3 rolls left." } ] },
        { t: "exercise", prompt: "250 flyers in bundles of 8: how many complete bundles, how many left over?", hint: "250 ÷ 8, remainder honest.", solution: "31 bundles (248), 2 flyers remain." } ] },
      { t: "Fractions and decimals", full: true, blocks: [
        { t: "p", x: "A fraction names part of a whole: in {3}/{4} the denominator says the whole was cut into four equal parts and the numerator counts them. Comparisons need equal parts — rename into a common denominator and the tops decide. Decimals are the same fractions with power-of-ten denominators: 0.25 is {25}/{100}." },
        { t: "p", x: "Money is the daily-life decimal. One alignment rule prevents most errors: line up the decimal points before adding or subtracting. 12.40 + 3.85 = 16.25, not 15.09 or whatever a misaligned column produces. Rounding is a decision: say which way and why — nearest penny, or up to whole items when fractions cannot be sold." },
        { t: "frac", n: 3, d: 4, label: "Three quarters" },
        { t: "exercise", prompt: "Add 12.4 + 3.85 + 0.05 with honest alignment.", hint: "Two decimals everywhere.", solution: "16.30." } ] },
      { t: "Percentages in business", full: true, blocks: [
        { t: "p", x: "A percentage is a fraction with a promised denominator: 35% = {35}/{100} of whatever the whole is. Percentage of an amount: 0.35 × 60 = 21. Percentage change: (new − old) ÷ old × 100 — always divided by the OLD value. A 20% discount then a 20% markup does not return to start, because the second 20% uses a smaller base." },
        { t: "pct", pct: 35, of: 60, label: "35% of 60 rolls" },
        { t: "exercise", prompt: "£9.60 → £10.80: percentage increase?", hint: "Change ÷ old.", solution: "1.20 ÷ 9.60 = 12.5%." } ] },
      { t: "Ratios, unit price and best buy", full: true, blocks: [
        { t: "p", x: "A ratio is a fixed relationship: 5 : 3 flour to water means every scaling multiplies both parts. Unit price makes different pack sizes comparable: price ÷ size, per 100 g. The offer that looks cheapest often is not — arithmetic is not fooled by pack sizing, and neither are you now." },
        { t: "exercise", prompt: "300 g at £1.20 vs 500 g at £1.80 — which is cheaper per 100 g?", hint: "Divide by 3 and by 5.", solution: "40p vs 36p per 100 g — the bigger pack wins." } ] },
      { t: "Break-even: the first business model", full: true, blocks: [
        { t: "p", x: "Break-even is where money in equals money out: fixed cost ÷ contribution per unit, where contribution = price − variable cost. £20 stall fee, £4 price, £1.50 cost → £2.50 contribution → 8 rolls. Round up to whole items; state what the model assumes (stable prices, everything sells, one product). A model that hides its assumptions gets trusted once too often." },
        { t: "ieq", caption: "Break-even explorer", sliders: [ { key: "fc", label: "Fixed cost £", min: 0, max: 60, step: 1, val: 20 }, { key: "p", label: "Price £", min: 1, max: 8, step: 0.25, val: 4 }, { key: "c", label: "Variable £", min: 0.25, max: 4, step: 0.25, val: 1.5 } ],
          display: v => v.p <= v.c ? "Price must exceed variable cost for break-even to exist." : `Break-even ≈ ${Math.ceil(v.fc / (v.p - v.c))} units`,
          note: v => v.p <= v.c ? "Selling below variable cost cannot be rescued by volume." : "Rounded up to whole units." },
        { t: "exercise", prompt: "Coffee cart: fixed £45, price £2.80, variable £1.05 — break-even cups?", hint: "Contribution £1.75.", solution: "45 ÷ 1.75 ≈ 25.7 → 26 cups." } ] },
      { t: "Reading tables", full: true, blocks: [
        { t: "p", x: "Tables are questions waiting to be asked. Read critically: what are the units, what is missing (a Sunday row?), what could be a confounder (market days vs rain)? Build the comparison that answers the actual question — weekday mean against market-day mean — instead of reciting raw numbers." } ] },
      { t: "Building charts", full: true, blocks: [
        { t: "p", x: "A chart is an answer, not a decoration. Trend over time → line; comparison across categories → bar; part-of-whole → fraction bar or pie. If you cannot say which question a chart answers, it does not go in the report. This chapter's rule applies to every dashboard in the academy." } ] },
      { t: "Checkpoint: the market week", full: true, blocks: [
        { t: "p", x: "The closing chapter combines everything: scale a recipe by ratio, price a discount honestly, compute the break-even for a new product line, and present the week in one table and one chart — each answering a stated question. Complete it, then take the Stage 2 topic test in the Assessment Centre." } ] },
    ],
  },
  {
    id: "alg", title: "Algebra: From Expressions to Quadratics", subject: "Mathematics", difficulty: "Beginner",
    pages: 72, stage: "s3", course: "algebra", color: "#46566B",
    desc: "Letters that stand for numbers: expressions, equations, straight lines and quadratics — each motivated by a business question.",
    objectives: ["Build expressions from word rules", "Solve linear equations with balance reasoning", "Read and interpret line and quadratic graphs"],
    chapters: [
      { t: "Letters that stand for numbers", full: true, blocks: [
        { t: "p", x: "Algebra begins when a rule is too general for one number: takings = p × n. Letters are slots; substitution fills them; collecting like terms tidies. 3n + 2n = 5n, but 3n + 2 stays put — rolls and pounds do not merge." },
        { t: "exercise", prompt: "Van cost: £40 + £2 per basket. Expression and value at 12 baskets?", hint: "C = 40 + 2b.", solution: "£68." } ] },
      { t: "Expanding and factorising", full: true, blocks: [
        { t: "p", x: "The distributive law a(b + c) = ab + ac works both directions: expanding exposes terms for computing, factorising exposes structure for reasoning. 6n + 12 = 6(n + 2) says 'per-basket structure' in one glance." } ] },
      { t: "Solving linear equations", full: true, blocks: [
        { t: "p", x: "An equation is a balanced scale: the same legal move on both sides. 4n − 12 = 60 → 4n = 72 → n = 18, checked by substitution. The check is the verification habit made algebraic." } ] },
      { t: "Straight-line graphs", full: true, blocks: [
        { t: "p", x: "y = mx + c: m is the per-unit rate, c the start value. The profit line y = 2.5n − 20 crosses zero exactly at break-even — algebra and graphs are two views of one fact. Steeper gradient = faster growth per sale." },
        { t: "plot", caption: "Profit line y = 2.5x − 20", fn: null, xmin: 0, xmax: 20, marks: [ { x: 8, y: 0, label: "break-even" } ], yMin: -25, yMax: 35, _fn: "2.5*x-20" } ] },
      { t: "Simultaneous thinking", full: true, blocks: [
        { t: "p", x: "Two rules at once: where two lines cross, both are satisfied. Chapters 5–7 develop this for pricing decisions and capacity questions." } ] },
      { t: "Quadratics: patterns of x²", full: true, blocks: [
        { t: "p", x: "Quadratic patterns arise whenever area, projectile motion or squared scaling appears. Chapters 8–10 introduce x², its parabola, and the factorisations that solve it." } ] },
      { t: "The discriminant and honest roots", full: true, blocks: [
        { t: "p", x: "Some quadratics cross the axis twice, once, or never — and the discriminant tells you which before you solve. Real business models use this to decide when a target is reachable at all." } ] },
      { t: "Checkpoint: pricing a new line", full: true, blocks: [
        { t: "p", x: "The closing assessment: model a second product's price and quantity with an equation, a line and a quadratic constraint, then defend every assumption." } ] },
    ],
  },
  {
    id: "log", title: "Logic & Proof", subject: "Mathematics", difficulty: "Intermediate",
    pages: 68, stage: "s4", course: "logic", color: "#2C3440",
    desc: "Statements, truth tables, implications and proof techniques — the reasoning layer behind reliable rules and code.",
    objectives: ["Write precise compound statements", "Test claims with truth tables and counterexamples", "Structure direct proofs and proofs by cases"],
    chapters: [
      { t: "Statements and connectives", full: true, blocks: [
        { t: "p", x: "A statement is definitely true or false. AND demands both, OR is satisfied by one, NOT flips. Truth tables compute combinations without guessing — four rows for two statements, and every business rule ('refund if receipt AND 30 days, OR VIP') decomposes into exactly such a table." },
        { t: "table", headers: ["A", "B", "A AND B", "A OR B"], rows: [ ["T","T","T","T"], ["T","F","F","T"], ["F","T","F","T"], ["F","F","F","F"] ] },
        { t: "exercise", prompt: "VIP customer, no receipt, day 45: refunded under the rule above?", hint: "Evaluate both sides of the OR.", solution: "Yes — right side of OR is true. The rule makes VIPs unconditional." } ] },
      { t: "If-then and the converse trap", full: true, blocks: [
        { t: "p", x: "An implication promises: hypothesis true ⇒ conclusion true. It fails only when hypothesis holds and conclusion does not. The converse swaps the parts and is a DIFFERENT claim — quoting it un-noticed ships bugs. One counterexample kills a false claim instantly." } ] },
      { t: "Direct proof", full: true, blocks: [
        { t: "p", x: "A direct proof walks from agreed facts to the conclusion with no leaps. Even n ⇒ even n²: write n = 2k, then n² = 2(2k²), twice a whole number, hence even. Every symbol earned its place." } ] },
      { t: "Proof by cases and counterexamples", full: true, blocks: [
        { t: "p", x: "Cases must be exhaustive to prove; counterexamples need only be single to disprove. Both are daily tools: exhaustive case analysis in rule design, single counterexamples in code review." } ] },
      { t: "Quantifiers: all and some", full: true, blocks: [
        { t: "p", x: "For-all claims demand every case; there-exists claims demand one. Negation flips them — one failing test breaks 'all tests pass'. This is why single counterexamples are decisive in verification culture." } ] },
      { t: "Checkpoint: audit a refund rule", full: true, blocks: [
        { t: "p", x: "The closing assessment: take a written refund policy, translate it to logic, build its truth table, find the unintended cases, and propose the repaired rule with proof." } ] },
    ],
  },
  {
    id: "gph", title: "Graphs & Networks", subject: "Mathematics", difficulty: "Intermediate",
    pages: 65, stage: "s5", course: "graphs", color: "#24344A",
    desc: "Nodes, edges, shortest paths and flows: modelling roads, deliveries and infrastructure as networks you can reason about.",
    objectives: ["Model situations as graphs", "Find shortest paths and explain assumptions", "Judge reachability, fragility and bottlenecks"],
    chapters: [
      { t: "Nodes, edges and degrees", full: true, blocks: [
        { t: "p", x: "A graph models connected situations minimally: nodes for things, edges for direct relationships, weights for minutes or costs. A node's degree counts its edges — a degree-1 shop sits on one road, and closing that road makes it unreachable by definition, no algorithm required." },
        { t: "table", headers: ["Edge", "Minutes"], rows: [ ["Stall–Market","5"], ["Stall–Depot","12"], ["Market–Bakery","7"], ["Depot–Bakery","9"], ["Depot–Café","4"] ] } ] },
      { t: "Shortest paths", full: true, blocks: [
        { t: "p", x: "Shortest paths settle the cheapest frontier first and improve a node's best-known distance only when a strictly cheaper route appears. Stall→Bakery: 5+7 = 12 beats 12+9 = 21. 'Shortest' means the weight you chose — minutes, not kilometres — as of the day the weights were true." } ] },
      { t: "Connectivity and fragility", full: true, blocks: [
        { t: "p", x: "Reachability is traced by marking connected nodes; anything unmarked is genuinely unreachable. Degree-1 nodes hang by a thread; nodes all paths cross are single points of failure. Redundancy — a second road — turns failures into detours." } ] },
      { t: "Flows and bottlenecks", full: true, blocks: [
        { t: "p", x: "Flow networks add capacities to edges; a chain moves no more than its narrowest edge. Max flow adds the separate routes' capacities: 20 via Market + 30 via Depot = 50. Widen the bottleneck first — widening anything else is a wasted investment." } ] },
      { t: "Checkpoint: the delivery plan", full: true, blocks: [
        { t: "p", x: "Closing assessment: plan the week's deliveries — shortest routes, a redundancy fix, and the throughput analysis — as a written handover with stated assumptions." } ] },
    ],
  },
  {
    id: "ps", title: "Problem Solving", subject: "Mathematics", difficulty: "Intermediate",
    pages: 58, stage: "s6", course: "ps", color: "#2E4A44",
    desc: "A repeatable method for messy questions: understand, plan, solve, check — with estimation and honest tables.",
    objectives: ["Apply the four-step method under uncertainty", "Estimate with defensible factors", "Read and build answer-driven tables and charts"],
    chapters: [
      { t: "Understand, plan, solve, check", full: true, blocks: [
        { t: "p", x: "Never skip to step three. Understand restates the problem; plan picks the tool; solve executes carefully; check asks whether the answer answers the QUESTION and whether it is plausible. Plausibility is free — install the habit." } ] },
      { t: "Underspecified problems", full: true, blocks: [
        { t: "p", x: "Real questions arrive with holes. Fix them with assumptions that carry their origin ('based on last month'), solve, and report sensitivity — how the answer moves if a key assumption changes. Defensible beats confident." } ] },
      { t: "Fermi estimates", full: true, blocks: [
        { t: "p", x: "Rough answers from justified factors: open days × rounds × loaves per round, adjusted, then sanity-checked against an independent quantity. Sized answers in minutes, every factor inspectable." } ] },
      { t: "Tables that answer questions", full: true, blocks: [
        { t: "p", x: "Read tables for units, missing rows and confounders; build comparisons that answer the actual question. Correlation is visible; cause is not — say so." } ] },
      { t: "Checkpoint: mock exam A", full: true, blocks: [
        { t: "p", x: "The stage closes with Mock Exam A in the Assessment Centre: four multi-part problems under time, each graded against the four-step method." } ] },
    ],
  },
  {
    id: "hb", title: "FDE Project Handbook", subject: "Projects", difficulty: "All levels",
    pages: 96, stage: "s7", course: "prog1", color: "#5A3E2E",
    desc: "All fifteen guided projects, Levels 1–7: briefs, requirements, implementation steps, testing instructions, rubrics and demonstration checklists.",
    objectives: ["Turn a customer story into a working artefact", "Verify work against a rubric before claiming it", "Document honestly for handover"],
    chapters: [
      { t: "How projects work", full: true, blocks: [
        { t: "p", x: "Every project is a customer story with an artefact: read the brief, close knowledge gaps through linked lessons and labs, build along the steps, verify against the demonstration checklist, and submit for rubric scoring. Pass at 16/24 with no dimension below 2 — Understanding, Correctness, Craft, Safety, Operation, Communication. Passing adds the project to your portfolio and unlocks the next level." } ] },
      { t: "Level 1 — first artefacts", full: true, blocks: [
        { t: "p", x: "P1.1 The Market-Stall Budget (spreadsheet): Amara's costs, prices and break-even, with formulas recomputed by hand. P1.2 The Delivery-Route Logic Pack: five route decisions argued with logic-table rigour. Both Level 1 projects demand honest arithmetic and a one-page assumptions table." } ] },
      { t: "Levels 2–4 — real programs and data", full: true, blocks: [
        { t: "p", x: "Expense tracker and sales-report automator (Level 2), dataset cleaning and a reporting database (Level 3), a task-tracker API and a feedback dashboard (Level 4). Each project ships with starter code, a dirty dataset or an API spec, and testing instructions whose expected outputs are stated — no 'it should look right'." } ] },
      { t: "Levels 5–7 — operate, assist, deploy", full: true, blocks: [
        { t: "p", x: "Package and ship, then operate with monitoring (Level 5). The FAQ assistant and document search with evaluation sets (Level 6). Level 7's simulated engagements change requirements mid-build and grade the handover as heavily as the code — because that is the job." } ] },
      { t: "Rubrics and the honesty rule", full: true, blocks: [
        { t: "p", x: "A rubric rewards what employers check: understanding, correctness, craft, safety, operation and communication. Demos are never called production-ready; handovers state limits. This chapter is the culture of the academy in eleven pages." } ] },
    ],
  },
];

/* ---------------- Glossary (searchable dictionary; admin can add/edit) ---------------- */
const GLOSSARY_BASE = [
  ["forward-deployed-engineer", "Forward Deployed Engineer", "An engineer who works at the customer's edge", "An engineer embedded with customers: listens to the business problem, models it, builds the software/data solution, and explains it in plain language. Contrasts with engineers who rarely meet customers.", "When a bakery cannot trust its sales numbers, an FDE sits with the owner, models the data flow, builds the cleaning script, and hands over documentation.", ["verification", "break-even"], "Careers"],
  ["verification", "Verification", "Checking before trusting", "The habit of confirming a result by recomputation, testing, or a checklist before relying on it. In this academy, progress counts only when verified.", "Recomputing a break-even total by hand before sending the pricing email.", ["counterexample", "assertion"], "Study skills"],
  ["operation", "Operation", "One of the four arithmetic actions", "Addition, subtraction, multiplication or division. Word problems signal which one: in total (add), left (subtract), each crate (multiply), shared equally (divide).", "'Shared equally among the stalls' signals division.", ["remainder"], "Mathematics"],
  ["remainder", "Remainder", "What is left after division", "The amount left over when a division does not come out exact. In business contexts it is often a real quantity (leftover rolls), not noise to discard.", "87 ÷ 6 = 14 remainder 3 → 14 bags and 3 rolls left.", ["operation"], "Mathematics"],
  ["fraction", "Fraction", "Part of a whole", "A way of naming parts of an equal partition: {a}/{b} means b equal parts, a of them taken. The bar means 'out of'.", "Selling {3}/{5} of a tray means 3 of every 5 rolls.", ["equivalent-fractions"], "Mathematics"],
  ["equivalent-fractions", "Equivalent fractions", "Same amount, different names", "Fractions that shade the same total ({2}/{4} and {1}/{2}). Rename by multiplying top and bottom by the same number.", "{2}/{4} = {1}/{2} = {50}/{100}.", ["fraction"], "Mathematics"],
  ["unit-price", "Unit price", "Price per standard amount", "Price divided by quantity, expressed per 100 g (or per item) so different pack sizes can be compared fairly.", "£1.20 for 300 g → 40p per 100 g.", ["ratio"], "Mathematics"],
  ["ratio", "Ratio", "Fixed relationship between quantities", "A comparison like 5 : 3 meaning five parts to three parts; scaling multiplies every part by the same factor.", "Flour : water = 5 : 3 — doubling flour requires doubling water.", ["unit-price"], "Mathematics"],
  ["base", "Base (percentage)", "The value a percentage is taken of", "In percentage change, the OLD value is the base: change ÷ old × 100. Using the wrong base is the classic percentage bug.", "£240 → £300 is 25% up because 60 ÷ 240 = 0.25.", ["percent"], "Mathematics"],
  ["percent", "Percent", "Per hundred", "A fraction with denominator 100: 35% = {35}/{100} of the whole. Always ask 'percent of what?'", "35% of 60 rolls = 21 rolls.", ["base"], "Mathematics"],
  ["break-even", "Break-even", "Where money in equals money out", "The sales level at which total revenue equals total cost: fixed cost ÷ contribution per unit. Selling beyond it earns contribution as profit.", "£20 fee, £2.50 per roll → break-even at 8 rolls.", ["fixed-cost", "contribution-margin"], "Mathematics"],
  ["fixed-cost", "Fixed cost", "Costs that do not vary with sales", "Costs paid regardless of quantity sold (stall fee, rent). They set the height of the break-even hurdle.", "Amara's £20 Saturday stall fee.", ["break-even"], "Mathematics"],
  ["variable-cost", "Variable cost", "Cost per unit sold", "The cost that scales with each item (ingredients, packaging).", "£1.50 of flour and butter per roll.", ["break-even"], "Mathematics"],
  ["contribution-margin", "Contribution", "Price minus variable cost", "What each sale adds toward covering fixed costs. Business viability starts with contribution, not price.", "£4.00 − £1.50 = £2.50 per roll.", ["break-even"], "Mathematics"],
  ["expression", "Expression", "A calculation with slots", "A combination of numbers, letters and operations with no equality claim: 40 + 2b. Evaluate by substitution.", "Takings = 4n is an expression for n rolls at £4.", ["equation", "substitution"], "Mathematics"],
  ["substitution", "Substitution", "Filling the slots", "Replacing letters with values and computing in order.", "p = 4, n = 30 → 4 × 30 = 120.", ["expression"], "Mathematics"],
  ["collecting-like-terms", "Collecting like terms", "Merging the same species", "Adding terms with identical letter parts: 3n + 2n = 5n; constants merge with constants; n and constants never merge.", "2(3x + 5) + 3(x − 2) → 9x + 4 after collecting.", ["expression"], "Mathematics"],
  ["distributive-law", "Distributive law", "Multiplication spreads over addition", "a(b + c) = ab + ac. The engine behind expanding brackets — and, factorised, behind structure-spotting.", "4(p − 2) = 4p − 8.", ["factorising"], "Mathematics"],
  ["factorising", "Factorising", "Pulling out shared structure", "Rewriting a sum as a product: 6n + 12 = 6(n + 2). Reveals per-unit structure that expanded form hides.", "Seeing 'six of (n plus two)' in 6n + 12.", ["distributive-law"], "Mathematics"],
  ["equation", "Equation", "A balanced scale", "A claim that two expressions are equal; solved by applying the same legal move to both sides, then verified by substitution.", "4n − 12 = 60 → n = 18, checked: 72 − 12 = 60 ✓", ["expression"], "Mathematics"],
  ["gradient", "Gradient", "Rate of change of a line", "In y = mx + c, how much y changes per one step of x: the per-unit rate in business stories.", "Profit y = 2.5n − 20: gradient 2.5 = £2.50 per extra roll.", ["break-even"], "Mathematics"],
  ["statement", "Statement", "Definitely true or false", "A sentence with a definite truth value; questions and commands are not statements. The atoms of rules and code conditions.", "'The order shipped on Monday' is a statement.", ["conjunction"], "Logic"],
  ["conjunction", "AND (conjunction)", "Both parts required", "A AND B is true only when both are true. Gates shipments, refunds and permissions.", "Refund requires receipt AND 30 days.", ["disjunction", "statement"], "Logic"],
  ["disjunction", "OR (disjunction)", "At least one part", "A OR B is true when at least one holds (inclusive or).", "Discount for coupon OR membership.", ["conjunction"], "Logic"],
  ["negation", "NOT (negation)", "Flipping truth", "NOT A reverses A's truth value; over quantifiers it flips for-all into there-exists.", "NOT 'all delivered on time' = 'at least one late'.", ["universal-quantifier"], "Logic"],
  ["implication", "If-then (implication)", "A one-way promise", "IF hypothesis THEN conclusion; false only when hypothesis holds and conclusion does not.", "If weight > 2 kg then postage £6.", ["converse", "counterexample"], "Logic"],
  ["converse", "Converse", "The claim with parts swapped", "'If Q then P' — a different claim from 'If P then Q'; rarely follows automatically.", "From 'heavy ⇒ £6' the converse '£6 ⇒ heavy' may be false.", ["implication"], "Logic"],
  ["counterexample", "Counterexample", "One case that kills a claim", "A single example satisfying the hypothesis but breaking the conclusion. Decisive in reviews and tests.", "A £6 parcel weighing 1 kg disproves '£6 ⇒ heavy'.", ["implication"], "Logic"],
  ["direct-proof", "Direct proof", "Facts to conclusion, no leaps", "A derivation from agreed facts to the conclusion. Every symbol earns its place.", "Even n ⇒ even n² via n = 2k.", ["proof-by-cases"], "Logic"],
  ["proof-by-cases", "Proof by cases", "Exhaustive splitting", "Proving a claim by covering every possible situation. Valid only when the cases are exhaustive.", "n even / n odd covers all whole numbers.", ["direct-proof"], "Logic"],
  ["universal-quantifier", "For all (∀)", "Every case", "A claim about every member: 'all deliveries on time'. Negated by a single counterexample.", "∀ items i: damaged(i) ⇒ ¬shipped(i).", ["existential-quantifier"], "Logic"],
  ["existential-quantifier", "There exists (∃)", "At least one", "A claim that some member exists: 'some roll is gluten-free' needs just one.", "∃ order o: o.total > 50.", ["universal-quantifier"], "Logic"],
  ["graph", "Graph (network)", "Things and their connections", "Nodes represent entities, edges represent direct relationships, weights quantify them. The minimal honest model of connected situations.", "Shops as nodes, roads as weighted edges.", ["node", "edge"], "Mathematics"],
  ["node", "Node", "One thing in the graph", "A vertex: a shop, a person, a server. Choose nodes deliberately — the modelling decision is the thinking.", "Each stall is a node in the market graph.", ["edge", "degree"], "Mathematics"],
  ["edge", "Edge", "A direct relationship", "A connection between two nodes, optionally weighted with minutes, cost or capacity.", "Stall–Market at 5 minutes.", ["node"], "Mathematics"],
  ["degree", "Degree", "Count of connections", "The number of edges at a node. Degree 1 hangs by a thread — its only link failing cuts it off.", "The Café has degree 1 (only Depot–Café).", ["single-point-of-failure"], "Mathematics"],
  ["shortest-path", "Shortest path", "Cheapest chain of edges", "The route minimising total weight, found by settling the cheapest frontier first and improving only on strictly better routes.", "Stall→Market→Bakery = 12 minutes beats 21.", ["graph"], "Mathematics"],
  ["connectivity", "Connectivity", "Who can reach whom", "Whether every node can reach every other via open edges; traced by marking reachable nodes.", "Closing Depot–Café cuts the Café off.", ["degree"], "Mathematics"],
  ["single-point-of-failure", "Single point of failure", "The node everything crosses", "A node or edge whose failure disconnects parts of the network. Fixes add redundancy — a second route.", "The Depot for Stall-side↔Café traffic.", ["connectivity"], "Mathematics"],
  ["flow-network", "Flow network", "Edges with capacities", "A graph whose edges carry maximum rates (boxes/hour, requests/sec). Chain throughput equals its narrowest edge.", "60 → 20 → 60 caps at 20.", ["bottleneck"], "Mathematics"],
  ["bottleneck", "Bottleneck", "The narrowest point", "The minimum-capacity edge on a route (or stage in a pipeline); the only place widening helps.", "Market→Bakery at 20 boxes/hour.", ["max-flow"], "Mathematics"],
  ["max-flow", "Maximum flow", "Total sustainable throughput", "The sum of flows on separate routes, bounded by bottlenecks.", "20 via Market + 30 via Depot = 50.", ["flow-network"], "Mathematics"],
  ["fermi-estimate", "Fermi estimate", "Sized answer from justified factors", "A rough estimate built by multiplying a few defensible factors, then sanity-checked against an independent quantity.", "6 days × 3 rounds × 120 loaves ≈ 2,160/week.", ["assumption"], "Problem solving"],
  ["assumption", "Assumption", "A stated premise", "A premise adopted to proceed, carrying its origin. Defensible assumptions cite sources and report sensitivity.", "Demand ≈ 140 based on last month's best Saturday.", ["fermi-estimate"], "Problem solving"],
  ["variable", "Variable (code)", "A named box for one value", "let price = 4.0; stores a value under a name for later use. The program remembers so you do not have to.", "let rolls = 30;", ["function"], "Programming"],
  ["if-statement", "If statement", "Program branching", "if (condition) {…} else {…} picks a path; the condition is a statement from logic. Boundary values are where bugs live.", "if (rolls > 100) … is false at exactly 100.", ["statement"], "Programming"],
  ["for-loop", "For loop", "Repetition with a contract", "for (start; keep-going; step) repeats a body; the classic bug is off-by-one (< vs <=).", "for (let i = 1; i <= 6; i++) runs six times.", ["if-statement"], "Programming"],
  ["function", "Function (code)", "A named computation", "Parameters in, return out. Functions make business rules reusable and testable.", "function breakEven(fixed, price, cost) { … }", ["assertion"], "Programming"],
  ["assertion", "Assertion", "A mechanical check", "console.assert(actual === expected, msg) reports a failure when reality disagrees with expectation. Tests enforce the verification habit.", "console.assert(profit(8) === 0, 'break-even').", ["verification"], "Programming"],
  ["hallucination", "Hallucination", "Fluent invention", "Confident model output not grounded in real sources. Fixed by plumbing (retrieval + grounding), not wording.", "An invented '45-day returns' policy.", ["grounding", "retrieval"], "AI"],
  ["retrieval", "Retrieval", "Searching trusted sources", "Finding corpus passages related to the question to feed the answering step. Quality depends on matching (keywords vs embeddings).", "FAQ §2.1 retrieved for a refund question.", ["grounding"], "AI"],
  ["grounding", "Grounding", "Answers only from sources", "The contract: answer ONLY from retrieved passages, cite them, refuse when nothing relevant is found. The academy enforces this on itself.", "'Our policy states 14 days… [FAQ §2.1]'.", ["handover"], "AI"],
  ["keyword-overlap", "Keyword overlap", "The simplest retrieval score", "Scoring passages by shared words after normalisation. Inspectable and honest, but blind to paraphrase.", "'money back' vs 'refund' — zero overlap, missed.", ["retrieval"], "AI"],
  ["evaluation-set", "Evaluation set", "Pre-written tests for behaviour", "A fixed list of questions with expected behaviours (answer+section, or refusal), scored for groundedness, helpfulness and honesty.", "10 questions, 8 grounded — scoped to the set.", ["verification"], "AI"],
  ["handover", "Handover", "The honest exit", "The documented path from automated to human, plus the limits document: what it does, does not, how it fails, and what production-readiness would require.", "Refusal message offers a person, not a shrug.", ["grounding"], "AI"],
];
const glossaryFromBase = ([key, term, simple, detailed, example, related, cat]) =>
  ({ key, term, simple, detailed, example, related, cat: [cat], appears: "" });
const DATA_READY_GLOSSARY = GLOSSARY_BASE.map(glossaryFromBase);

/* ---------------- Projects (all 15, Levels 1–7) ---------------- */
const PROJECTS = [
  { id: "p1-1", level: 1, stage: "s2", title: "The Market-Stall Budget", customer: "Amara — market trader",
    brief: "Build Amara's weekend budget as a spreadsheet: fixed fee, per-roll costs, prices, and a break-even calculator with formulas you have recomputed by hand.",
    steps: ["List all fixed costs for one Saturday (stall fee, transport, packaging)", "List variable costs per roll and agree the prices", "Build the budget table with formulas (no hard-coded totals)", "Add the break-even calculator: fixed ÷ contribution, rounded up", "Recompute every formula by hand once and mark it audited", "Write the one-page assumptions table (demand, waste, weather)"],
    demo: ["Formulas recalculate when price changes", "Break-even shows whole rolls, rounded up", "Assumptions table names its sources", "Hand-recalculation note present"],
    concepts: ["break-even", "fixed-cost", "contribution-margin"] },
  { id: "p1-2", level: 1, stage: "s4", title: "Delivery-Route Logic Pack", customer: "Bella's bakery group",
    brief: "Convert five delivery rule arguments into precise logic: statements, truth tables, and the unintended cases you found.",
    steps: ["Rewrite each delivery rule as if-then statements", "Build truth tables for the two compound rules", "Find one unintended case per rule (the converse traps)", "Propose the repaired rule for each", "Write the one-page findings memo with your counterexamples"],
    demo: ["Every rule is in precise if-then form", "Truth tables are complete (all rows)", "Each memo case is a real counterexample", "Repaired rules are stated unambiguously"],
    concepts: ["implication", "converse", "counterexample"] },
  { id: "p2-1", level: 2, stage: "s7", title: "The Expense Tracker", customer: "Amara — market trader",
    brief: "A small program that records expenses and prints a daily summary: totals per category, the largest expense, and a warning when the stall fee is exceeded.",
    steps: ["Design the data: what is one expense? (amount, category, note)", "Write addExpense and totalFor(category)", "Write the daily summary printer", "Add the fee-exceeded warning branch", "Write 5 console.assert tests, run them", "Hand-recalc one day's totals and note it"],
    demo: ["Program runs in the sandbox without errors", "Summary matches a hand-computed day", "All 5 assertions pass", "Warning branch traced at the boundary value"],
    concepts: ["variable", "if-statement", "assertion"] },
  { id: "p2-2", level: 2, stage: "s8", title: "The Sales Report Automator", customer: "Bella's bakery group",
    brief: "Turn a folder of daily sales files into one weekly report: totals, best day, and a written summary a manager can read in one minute.",
    steps: ["Agree the file format and the three report numbers", "Write the loop that reads every file", "Accumulate totals with the accumulator pattern", "Find the best day with a running maximum", "Generate the written summary from the numbers", "Test on a folder you build by hand first"],
    demo: ["Report numbers match the hand-built folder", "Best-day logic verified on a tie case", "Summary is readable by a non-engineer", "File-missing case handled with a clear message"],
    concepts: ["for-loop", "function", "assertion"] },
  { id: "p3-1", level: 3, stage: "s9", title: "Clean the Market Dataset", customer: "Bella's bakery group",
    brief: "The 144-row sales export is dirty. Agree five cleaning rules in writing, implement them, and prove unit conservation so the numbers can be trusted.",
    steps: ["Inspect the raw file and predict each rule's drop count", "Write the five cleaning rules as a dated agreement page", "Implement the date and units gates", "Normalize categories and deduplicate", "Prove unit conservation independently", "Produce the audit line and the before/after table"],
    demo: ["Audit log states every drop with its rule", "Conservation check passes and is shown", "Idempotence: running twice changes nothing", "Before/after table reconciles row counts"],
    concepts: ["assumption", "verification"] },
  { id: "p3-2", level: 3, stage: "s10", title: "The Sales Reporting Database", customer: "Bella's bakery group",
    brief: "Design a small relational database for the cleaned sales, load it, and answer five manager questions in SQL with the results screenshot-audited.",
    steps: ["Draw the tables and their keys on one page", "Create the schema in the SQL lab", "Load the cleaned dataset", "Write the five manager questions as queries", "Verify each result against the source file", "Write the two-paragraph data dictionary"],
    demo: ["Schema diagram matches created tables", "Each query result reconciles with the dataset", "Queries run in the lab without errors", "Data dictionary explains every column"],
    concepts: ["verification", "assumption"] },
  { id: "p4-1", level: 4, stage: "s11", title: "The Task Tracker API", customer: "A two-shop delivery firm",
    brief: "Build and demonstrate a small REST API for delivery tasks: create, list with filters, update status — with validation errors a client can actually read.",
    steps: ["Agree the task fields and statuses", "Implement create + validation (400s with messages)", "Implement list with status/due filters", "Implement status update with transition rules", "Write the request/response examples page", "Test every endpoint and record the results"],
    demo: ["Validation errors name the field and the problem", "Filters demonstrated with two queries", "Invalid status transition rejected with 4xx", "Examples page matches observed behaviour"],
    concepts: ["verification", "assumption"] },
  { id: "p4-2", level: 4, stage: "s12", title: "The Feedback Dashboard", customer: "Amara — market trader",
    brief: "A one-page dashboard over the sales database: today's takings, week trend, and the three SKUs to watch — each chart answering one stated question.",
    steps: ["Agree the three questions the dashboard must answer", "Write the queries behind each chart", "Build the page with the three visuals", "Label units and sources on every visual", "Add the empty-state for 'no sales yet'", "Verify numbers against the database directly"],
    demo: ["Each chart states its question", "Numbers reconcile with the database", "Empty state shown when data is absent", "No chart exists without a stated question"],
    concepts: ["verification", "assumption"] },
  { id: "p5-1", level: 5, stage: "s13", title: "Package & Ship", customer: "Bella's bakery group",
    brief: "Take the Level 4 dashboard from 'works on my machine' to 'runs from a command on a clean machine': one command build, one command run, a written README.",
    steps: ["List every dependency with versions", "Write the build script and the run script", "Prove it on a clean environment (fresh clone)", "Write the README: run, configure, troubleshoot", "Record the configuration values and where they live", "Add the rollback note"],
    demo: ["Clean-machine run succeeds from the README alone", "No unlisted dependencies discovered", "README troubleshooting covers two real failures", "Rollback note names the previous version"],
    concepts: ["verification", "assumption"] },
  { id: "p5-2", level: 5, stage: "s14", title: "Operate It", customer: "Bella's bakery group",
    brief: "Keep the shipped dashboard healthy for one simulated week: monitoring checks, a Friday-morning incident, and the post-mortem written to the template.",
    steps: ["Define the two health checks and their thresholds", "Set up the check script and its log", "Run the simulated incident drill", "Write the timeline as it happened", "Complete the post-mortem template (cause, fix, prevention)", "Update the README from what you learned"],
    demo: ["Both checks demonstrated failing and passing", "Timeline timestamps are consistent", "Post-mortem names the real cause", "Prevention item added to the backlog"],
    concepts: ["verification", "assumption"] },
  { id: "p6-1", level: 6, stage: "s15", title: "The FAQ Assistant", customer: "A retail shop",
    brief: "Build a grounded assistant over a real FAQ: retrieval with citations, honest refusals, and a ten-question evaluation set scored in writing.",
    steps: ["Normalise the FAQ into sections with stable numbers", "Write the retrieval scorer and test it on five questions", "Implement the grounded answer with citations", "Implement the refusal with human handover", "Build the ten-question evaluation set", "Score the run and write the results table"],
    demo: ["Every answer cites its section", "Refusal demonstrated on an outside question", "Evaluation table present with scores", "Limits section written in the handover doc"],
    concepts: ["retrieval", "grounding", "evaluation-set"] },
  { id: "p6-2", level: 6, stage: "s16", title: "Document Search", customer: "Bella's bakery group",
    brief: "Search across the cleaned dataset's documentation: a query interface with highlighted results, plus the paraphrase cases your search honestly fails.",
    steps: ["Agree the corpus and the five golden queries", "Implement scoring with snippet highlighting", "Test the paraphrase cases and record failures honestly", "Add the no-results state with suggestions", "Write the evaluation table including the failures", "Propose the upgrade path (embeddings) with expected gains"],
    demo: ["Golden queries return the right documents", "Paraphrase failures documented, not hidden", "No-results state demonstrated", "Upgrade path names the measurable target"],
    concepts: ["keyword-overlap", "evaluation-set"] },
  { id: "p7-1", level: 7, stage: "s17", title: "Simulated Engagement: Retail Support", customer: "Simulated retailer (Level 7 brief)",
    brief: "A complete simulated engagement: requirements meeting, mid-project change request, the built assistant, and the handover meeting — graded on communication as much as code.",
    steps: ["Run the requirements meeting from the brief script", "Write the requirements memo the client signs", "Absorb the change request and re-plan honestly", "Build the assistant against the signed memo", "Rehearse the demonstration against the checklist", "Run the handover meeting and file the document"],
    demo: ["Signed memo exists and matches what was built", "Change request handled with revised plan in writing", "Demonstration passes every checklist item", "Handover document states limits plainly"],
    concepts: ["handover", "verification"] },
  { id: "p7-2", level: 7, stage: "s17", title: "Simulated Engagement: Handover Under Change", customer: "Simulated client (Level 7 brief)",
    brief: "Take an existing Level 6 assistant you did not build, understand it from its documents alone, and hand it over to a new owner under a policy change.",
    steps: ["Reconstruct the system's behaviour from documents only", "List every gap you found in the documentation", "Implement the policy change with tests", "Update all documents to match reality", "Run the handover meeting to the new owner", "Write the transfer acceptance note"],
    demo: ["Behaviour reconstruction matches observed runs", "Every documentation gap listed with a fix", "Policy change tested before claimed", "New owner signs the acceptance note"],
    concepts: ["handover", "verification"] },
  { id: "p7-3", level: 7, stage: "s17", title: "Simulated Engagement: The Pipeline", customer: "Simulated group brief (Level 7)",
    brief: "The capstone: data in, modelled answer out, deployed and operated for a simulated month — with the full honesty stack (assumptions, monitoring, post-mortem, handover).",
    steps: ["Agree the pipeline scope and its two health checks", "Build ingest → clean → answer as separate steps", "Deploy behind the run script from Level 5 practice", "Operate the simulated month (drills included)", "Write the mid-month post-mortem", "Deliver the final handover and portfolio case study"],
    demo: ["Pipeline runs from one command on a clean machine", "Both health checks demonstrated", "Post-mortem and assumptions tables present", "Portfolio case study states honest limits"],
    concepts: ["verification", "handover", "assumption"] },
];
