/* ============ FDE Academy — data part 3: Problem Solving, Programming I, AI Engineering I ============ */
"use strict";

/* ---------------- Course: Problem Solving (Stage 6) ---------------- */
lesson({
  id: "ps-1", course: "ps", stage: "s6", module: "Problem-solving method", chapter: "9. The method", minutes: 30,
  title: "Understand, plan, solve, check",
  objectives: ["Apply the four-step method to an unfamiliar problem", "Restate a problem in your own words before solving", "Check an answer against the original question"],
  blocks: [
    { t: "p", x: `The method is four steps and one rule: never skip to step three. ${T("understand-plan-solve-check", "Understand")}: restate the problem in your own words, list what is given and what is asked. Plan: which tool fits — arithmetic, an equation, a graph, a table? Solve: execute the plan, carefully. Check: does the answer answer the QUESTION, is it plausible, can you verify it another way?` },
    { t: "p", x: `Worked example: "A market charges 30p per basket per hour, maximum 4 hours. Amara parks for 2.5 hours on Monday and 3 hours on Tuesday. What did she pay?" Understand: rate per hour, capped at 4; two days. Plan: compute each day separately, add. Solve: 2.5 × 30 = 75p; 3 × 30 = 90p; total £1.65. Check: both under the cap ✓; total more than either day ✓; recomputed once ✓.` },
    { t: "p", x: `The check step is where marks are saved in exams and where disasters are avoided in business. Half of all wrong answers fail only plausibility: a negative quantity, a 400% tip, a delivery route longer than the earth's circumference. Plausibility is free; install the habit.` },
    { t: "exercise", prompt: "Use all four steps: A bakery's flour order costs £12 per 5 kg bag plus £8 delivery. It orders 15 kg. What does it pay?",
      hint: "Understand (bags needed?), plan (bags × price + delivery), solve, check.",
      solution: "15 kg = 3 bags. 3 × 12 = 36 + 8 = £44. Check: 3 bags at 12 each is 36, delivery once ✓." },
  ],
  quiz: [
    { q: "Which step do beginners skip most, and why is that costly?", options: ["Understand — leads to solving the wrong question", "Solve — leads to slow work", "Check — wrong answers pass through", "Plan — leads to mess"], answer: 2,
      why: "Without a check, wrong answers ship. (Understand is also vital — but the skipped-with-cost answer per the lesson is Check.)" },
    { q: "'Restate the problem in your own words' belongs to…", options: ["Understand", "Plan", "Solve", "Check"], answer: 0,
      why: "Understanding starts with a faithful restatement." },
    { q: "A good plausibility check for a delivery time is…", options: ["Is it negative?", "Is it within a sane range for the distance?", "Is it a whole number?", "Did the calculator show it?"], answer: 1,
      why: "Plausibility means sane ranges in context." },
  ],
});
lesson({
  id: "ps-2", course: "ps", stage: "s6", module: "Problem-solving method", chapter: "9. The method", minutes: 25,
  title: "When the problem is underspecified",
  objectives: ["List the missing information a realistic problem hides", "State assumptions explicitly and defensibly", "Solve under assumptions and mark the dependence"],
  blocks: [
    { t: "p", x: `Real problems arrive with holes. "How many rolls should Amara bake for Saturday?" has no single answer until you fix demand, waste tolerance and shelf life. The professional move is not to freeze — it is to make ${T("assumption", "assumptions")} explicit, solve under them, and show how the answer moves if they change.` },
    { t: "steps", title: "A defensible first answer", steps: [
      { expr: "Assume Saturday demand ≈ 140 rolls (based on last month's best Saturday)", note: "Named source, not a guess." },
      { expr: "Assume 8% waste (unsold, given away)", note: "Historical, measurable." },
      { expr: "Bake ≈ 140 ÷ 0.92 ≈ 153 rolls", note: "Round to a practical 150." },
      { expr: "If demand hits 160, shortfall = 160 − 153 = 7", note: "Sensitivity stated, not hidden." } ] },
    { t: "p", x: `Notice what made the answer defensible: every number carries its origin. "Based on last month" and "historical, measurable" are checkable claims; "I feel like 150" is not. In project work this becomes the assumptions table in every handover document.` },
    { t: "exercise", prompt: "A client asks: 'How long will the delivery take?' You know the route is 45 km and the van averages 40–60 km/h in traffic. Give a defensible range with stated assumptions.",
      hint: "Compute both ends of the speed range; state the source of the range.",
      solution: "45 ÷ 60 = 0.75 h (best case) to 45 ÷ 40 = 1.125 h (worst). Answer: 45–68 minutes, assuming steady speeds in the observed 40–60 km/h band; traffic incidents excluded." },
  ],
  quiz: [
    { q: "An assumption is defensible when…", options: ["It feels right", "It carries a stated, checkable origin", "It is round", "It is safe"], answer: 1,
      why: "Sources make assumptions checkable — and therefore professional." },
    { q: "After solving under assumptions, a good engineer also reports…", options: ["Nothing further", "How the answer moves if key assumptions change", "A longer method", "A disclaimer only"], answer: 1,
      why: "Sensitivity shows the answer's honesty range." },
    { q: "Baking 'enough plus waste' uses the formula…", options: ["demand × waste", "demand ÷ (1 − waste fraction)", "demand + 10", "demand²"], answer: 1,
      why: "Dividing by the surviving fraction recovers the pre-waste quantity." },
  ],
});
lesson({
  id: "ps-3", course: "ps", stage: "s6", module: "Modelling and estimation", chapter: "10. Estimation", minutes: 30,
  title: "Fermi estimates: sized right, quickly",
  objectives: ["Build a quick estimate from breakable factors", "State each factor's basis", "Judge whether the estimate answers the question at hand"],
  blocks: [
    { t: "p", x: `A ${T("fermi-estimate", "Fermi estimate")} answers "roughly how much?" by multiplying a few factors you can each defend. "How many loaves does our neighbourhood bakery sell weekly?" Break it: shops open 6 days; each day ~3 baking rounds; each round ~120 loaves; weekend demand ×1.3 on two days. 6 × 3 × 120 = 2,160, adjusted for weekend lift ≈ 2,400 loaves/week. The point is not precision — it is a sized answer in minutes, with every factor inspectable.` },
    { t: "p", x: `Estimates power real decisions: capacity planning ("can our single van cover 40 deliveries a day?"), staffing, stock. The discipline is the same three moves as this academy's projects: decompose, justify each factor, sanity-check the total against something known (e.g. the bakery's flour orders imply ~2,200 loaves — close enough).` },
    { t: "exercise", prompt: "Estimate: how many deliveries can one van make in a 6-hour shift, given 12 minutes average per stop including driving and 30 minutes total for loading?",
      hint: "Available delivery time first, then divide by time per stop.",
      solution: "6 h − 0.5 h = 5.5 h = 330 min; 330 ÷ 12 ≈ 27 stops. Sanity: ~1 stop every 13 minutes across a whole shift is aggressive; a planning figure of 20–25 is safer." },
  ],
  quiz: [
    { q: "A Fermi estimate is…", options: ["An exact calculation", "A defensible rough estimate from justified factors", "A guess", "A simulation"], answer: 1,
      why: "Rough in precision, rigorous in reasoning." },
    { q: "The final sanity-check step compares the estimate with…", options: ["Nothing", "An independently known related quantity", "A random number", "The wish"], answer: 1,
      why: "Cross-checking against real data catches broken factors." },
    { q: "330 ÷ 12 ≈ ?", options: ["20", "27", "30", "33"], answer: 1,
      why: "27.5 — but planning should round down conservatively." },
  ],
});
lesson({
  id: "ps-4", course: "ps", stage: "s6", module: "Modelling and estimation", chapter: "10. Estimation", minutes: 30,
  title: "Tables and charts that answer questions",
  objectives: ["Choose the right chart for the question", "Read a table critically (units, totals, missing rows)", "Build a small comparison table from raw notes"],
  blocks: [
    { t: "p", x: `A chart is an answer, not a decoration. Trend over time → line. Comparison across categories → bar. Part-of-whole with few parts → fraction bar or pie, honestly sized. If you cannot say what question a chart answers, it does not belong in the report.` },
    { t: "table", caption: "Amara's week — rolls sold (read it critically)", headers: ["Day", "Sold", "Weather"], rows: [
      ["Mon", "96", "rain"], ["Tue", "140", "dry"], ["Wed", "128", "dry"], ["Thu", "135", "dry"], ["Fri", "158", "market day"], ["Sat", "176", "market day"] ] },
    { t: "p", x: `Critical reading finds the trap before the boss does: units (rolls per day), a missing Sunday, and a confounder (market days inflate sales regardless of weather). "Rainy days sold less" is visible; "rain CAUSES low sales" is not supported — market days never had rain in this sample. Correlation versus cause is the reading skill.` },
    { t: "p", x: `Building the summary is arithmetic you already own: weekday mean excluding market days = (96 + 140 + 128 + 135) ÷ 4 = 124.75; market-day mean = (158 + 176) ÷ 2 = 167. The comparison table, not the raw list, is what answers "do market days matter?"` },
    { t: "exercise", prompt: "From the table above, compute the mean of dry non-market days only (Tue–Thu), and compare it with the rainy Monday.",
      hint: "Three days, then compare with 96.",
      solution: "(140 + 128 + 135) ÷ 3 = 134.3 vs 96 → Monday sold about 38 fewer rolls, but Monday is also a non-market day AND rainy; the table cannot separate the two causes." },
  ],
  quiz: [
    { q: "Best chart for 'how did sales move across the week?'", options: ["Pie", "Line", "Table only", "Scatter"], answer: 1,
      why: "Trend over ordered time → line." },
    { q: "The table's Sunday gap is an example of…", options: ["A confounder", "Missing data you must notice", "A unit error", "A chart choice"], answer: 1,
      why: "Missing rows change means and claims." },
    { q: "'Market days sold more' is supported; 'market days cause higher sales' is not, because…", options: ["Charts cannot show cause", "Rain never happened on market days in this sample — cause is not separable here", "Sales are random", "Means lie"], answer: 1,
      why: "Correlation without a designed comparison does not establish cause." },
  ],
});

/* ---------------- Course: Programming Foundations I (Stage 7) ---------------- */
lesson({
  id: "pg-1", course: "prog1", stage: "s7", module: "First programs", chapter: "11. First programs", minutes: 30,
  title: "Values, variables and your first program",
  objectives: ["Store values in variables and read them back", "Compute with numbers and text in the sandbox", "Predict output before running — then verify"],
  blocks: [
    { t: "p", x: `A ${T("variable", "variable")} is a named box holding one value. In JavaScript: let price = 4.00; let rolls = 30; let takings = price * rolls;. The names do the remembering; the equals sign stores; the program computes left to right through the statements. Unlike the maths lesson, x does not get solved here — it gets used.` },
    { t: "code", lang: "javascript", body: `// Amara's morning takings
let price = 4.0;      // pounds per roll
let rolls = 30;       // rolls sold
let takings = price * rolls;
console.log("Takings: GBP " + takings);
// Predict before you run: what prints?` },
    { t: "p", x: `The sandbox on this page runs your code in an isolated worker — it cannot touch the page, your files or the network; it can only print to the output panel. That isolation is not decoration: it is the same principle the academy teaches about trust. Untrusted code runs in a cage; everything else stays safe.` },
    { t: "p", x: `The habit this stage installs is prediction-first: say what the program will print before pressing run. If reality disagrees with your prediction, the difference is the lesson — not a failure. Every lab below follows this loop: predict, run, compare.` },
    { t: "exercise", prompt: "In the lab, write a program that computes the cost of 6 crates of 24 rolls at £4 per roll. Predict the output first.",
      hint: "Three variables and one multiplication, then console.log.",
      solution: "let crates = 6, per = 24, price = 4; console.log(crates * per * price); → 576" },
  ],
  quiz: [
    { q: "let takings = price * rolls; does what?", options: ["Solves for price", "Stores the computed product in takings", "Prints takings", "Declares price"], answer: 1,
      why: "Assignment computes the right side and stores it." },
    { q: "Why does the sandbox isolate student code?", options: ["To make it slower", "So untrusted code cannot touch the page or files — only its own output", "To save memory", "It does not"], answer: 1,
      why: "Isolation is the trust boundary; the worker can only print." },
    { q: "Prediction-first means…", options: ["Never running code", "Stating expected output before running, then comparing", "Copy-paste the solution", "Running twice"], answer: 1,
      why: "The gap between prediction and reality is the learning." },
  ],
});
lesson({
  id: "pg-2", course: "prog1", stage: "s7", module: "First programs", chapter: "11. First programs", minutes: 30,
  title: "Decisions: if, else and comparison",
  objectives: ["Write branching logic with if/else", "Choose the right comparison (>, ===, >=)", "Trace a branch by hand for boundary values"],
  blocks: [
    { t: "p", x: `Programs make choices with ${T("if-statement", "if statements")}: if (condition) { ... } else { ... }. The condition is a statement from the logic course — true or false, nothing between. Comparisons produce those statements: rolls > 100, takings === 60, customer !== member. Use === for equality (one = stores, three compares — mixing them is the classic beginner bug).` },
    { t: "code", lang: "javascript", body: `let rolls = 87;
if (rolls > 100) {
  console.log("Busy day — order more flour");
} else if (rolls > 50) {
  console.log("Normal day");
} else {
  console.log("Quiet day");
}
// Predict: which line prints for 87? For exactly 100?` },
    { t: "p", x: `Boundary values are where bugs live. rolls > 100 is false at exactly 100 — is that the rule the customer wanted? "Above 100" and "100 or more" differ by one basket and one angry client. Trace branches by hand at the edges: 100, 101, 99. The trace costs thirty seconds; the bug costs a day.` },
    { t: "exercise", prompt: "Write a branch that prints 'sell out' when fewer than 10 rolls remain (rolls < 10), 'fine' otherwise. Trace it for rolls = 10.",
      hint: "Strictly less than. At 10 the condition is false.",
      solution: "if (rolls < 10) { console.log('sell out'); } else { console.log('fine'); } — at rolls = 10 it prints 'fine'." },
  ],
  quiz: [
    { q: "Which operator checks equality in JavaScript?", options: ["=", "===", "=>", "equals"], answer: 1,
      why: "=== compares; = assigns." },
    { q: "For rolls = 100, 'rolls > 100' is…", options: ["true", "false", "error", "undefined"], answer: 1,
      why: "100 is not greater than 100 — boundary!" },
    { q: "The parts of if/else-if/else run…", options: ["All of them", "Only the first true branch", "The last branch", "In parallel"], answer: 1,
      why: "Branching picks one path." },
  ],
});
lesson({
  id: "pg-3", course: "prog1", stage: "s7", module: "First programs", chapter: "11. First programs", minutes: 30,
  title: "Loops that do the boring work",
  objectives: ["Write a for loop with correct start, condition and step", "Accumulate a total inside a loop", "Explain why off-by-one errors happen and test for them"],
  blocks: [
    { t: "p", x: `A ${T("for-loop", "for loop")} repeats work: for (let i = 1; i <= 6; i++) { ... } runs the body six times with i = 1..6. The three parts are a contract: start here, keep going while this holds, step like this. Off-by-one bugs come from writing < when you meant <= — six crates need i <= 6, not i < 6.` },
    { t: "code", lang: "javascript", body: `let total = 0;
for (let crate = 1; crate <= 6; crate++) {
  total = total + 24;   // each crate holds 24 rolls
}
console.log(total);  // predict: what and why?` },
    { t: "p", x: `The accumulator pattern (start a total at 0, add inside the loop) is the most-used loop shape in business code: totals, averages, counts. Its sibling the counter (start at 0, add 1 when a condition holds) answers "how many orders were over £50?" — a quantifier from the logic course, now executable.` },
    { t: "exercise", prompt: "Modify the loop to total £ takings: each crate sells for £96. Predict, then run in the lab.",
      hint: "total = total + 96 inside the same six-iteration loop.",
      solution: "6 × 96 = 576 — the loop must print 576. If it prints 480 you wrote i < 6." },
  ],
  quiz: [
    { q: "for (let i = 1; i <= 6; i++) runs the body…", options: ["5 times", "6 times", "7 times", "Forever"], answer: 1,
      why: "i takes 1,2,3,4,5,6 — inclusive because of <=." },
    { q: "The accumulator pattern starts the total at…", options: ["1", "0", "−1", "The first item"], answer: 1,
      why: "Zero is the identity for addition." },
    { q: "i < 6 instead of i <= 6 causes…", options: ["A crash", "An off-by-one error (one iteration fewer)", "Infinite loop", "Nothing"], answer: 1,
      why: "The classic boundary bug — test at the edges." },
  ],
});
lesson({
  id: "pg-4", course: "prog1", stage: "s7", module: "Loops and functions", chapter: "12. Functions", minutes: 30,
  title: "Functions: naming a computation",
  objectives: ["Define a function with parameters and return", "Call it for several inputs and compare with predictions", "Explain what 'return' does that 'print' does not"],
  blocks: [
    { t: "p", x: `A ${T("function", "function")} wraps a computation behind a name: function breakEven(fixed, price, cost) { return Math.ceil(fixed / (price - cost)); }. The parameters are the slots; return hands the answer to whoever called. Printing shows a human something; returning gives the program something to use. They are different jobs.` },
    { t: "code", lang: "javascript", body: `function breakEven(fixed, price, cost) {
  const contribution = price - cost;
  if (contribution <= 0) return Infinity; // unreachable
  return Math.ceil(fixed / contribution);
}
console.log(breakEven(20, 4.0, 1.5));   // predict
console.log(breakEven(45, 2.8, 3.0));   // and this one?` },
    { t: "p", x: `Notice the guard: when contribution ≤ 0 the formula divides by zero or negative — the function returns Infinity honestly instead of a nonsense number. Functions are where business rules become reusable and testable: the same break-even logic from Stage 2, now callable on any vendor's numbers.` },
    { t: "exercise", prompt: "Write profit(n) for Amara (price 4, cost 1.5, fixed 20) and print profit at 8, 9 and 30 rolls. Predict the sign change.",
      hint: "return 2.5 * n - 20; call it three times.",
      solution: "profit(8) = 0 (break-even), profit(9) = 2.5, profit(30) = 55. The sign flips exactly at break-even." },
  ],
  quiz: [
    { q: "'return' differs from printing because it…", options: ["Shows the value to humans", "Hands the value back to the caller for further use", "Ends the program", "Saves to disk"], answer: 1,
      why: "Return feeds the program; print feeds the user." },
    { q: "breakEven returns Infinity when contribution ≤ 0 because…", options: ["It is an error", "No quantity of sales can cover the fixed cost — honest signal, not crash", "Division likes Infinity", "It should return 0"], answer: 1,
      why: "The guard encodes the business truth." },
    { q: "Parameters are…", options: ["The values printed", "The named slots a function receives", "The loop counter", "The file name"], answer: 1,
      why: "Parameters are the function's inputs." },
  ],
});
lesson({
  id: "pg-5", course: "prog1", stage: "s7", module: "Loops and functions", chapter: "12. Functions", minutes: 30,
  title: "Testing: prove it works, then say so",
  objectives: ["Write assertions that compare expected with actual", "Make a test fail on purpose and read the message", "Explain what a passing test does and does not prove"],
  blocks: [
    { t: "p", x: `A ${T("assertion", "test")} is a mechanical check: console.assert(actual === expected, "message"). Run it after writing the function, every time you touch the function. Tests turn the academy's verification habit into something the machine enforces — the same culture the projects grade with rubrics.` },
    { t: "code", lang: "javascript", body: `function profit(n) { return 2.5 * n - 20; }
console.assert(profit(8) === 0, "break-even at 8");
console.assert(profit(9) === 2.5, "one past break-even");
console.assert(profit(0) === -20, "no sales = fixed cost loss");
console.log("tests finished");` },
    { t: "p", x: `Break a test on purpose once: change profit to 2.6 * n - 20 and watch the assert fire. Reading the failure message calmly — what was expected, what came — is a core engineering reflex. Then explain the limits honestly: three passing tests prove those three cases, not every case; that is why stage-level tests are broader and why logic proofs (Stage 4) matter.` },
    { t: "exercise", prompt: "Add a test for a negative-sales case of your own choosing, predict its result, and verify.",
      hint: "profit(-4) = -30 — the formula extrapolates honestly even if the business does not.",
      solution: "console.assert(profit(-4) === -30, 'extrapolation check') — passes, revealing that the model is linear everywhere, a fact worth stating in a handover." },
  ],
  quiz: [
    { q: "console.assert(cond, msg) does what when cond is false?", options: ["Nothing", "Reports the message — the test failed", "Stops the program", "Fixes the code"], answer: 1,
      why: "Asserts report failures; they do not halt." },
    { q: "Passing tests prove…", options: ["The function works for every input", "The tested cases behave as expected", "The code is fast", "The design is good"], answer: 1,
      why: "Tests sample behaviour; honesty about limits is part of the craft." },
    { q: "After changing a function you should…", options: ["Hope", "Re-run its tests", "Rename it", "Delete the tests"], answer: 1,
      why: "Re-run — that is what makes refactoring safe." },
  ],
});

/* ---------------- Course: AI Engineering I (Stage 15) ---------------- */
lesson({
  id: "ai-1", course: "ai1", stage: "s15", module: "Grounded assistants", chapter: "15. Grounding", minutes: 35,
  title: "Why assistants hallucinate — and the grounding rule",
  objectives: ["Explain in plain language why language models invent facts", "State the grounding rule this academy enforces on itself", "Trace one grounded and one ungrounded answer"],
  blocks: [
    { t: "p", x: `A language model predicts plausible text; it does not look up facts. Asked about your company's refund window, it will produce a fluent, confident, possibly invented answer — a ${T("hallucination", "hallucination")}. The failure is not stupidity; it is architecture. The fix is not better wording but better plumbing: give the model the sources and require the answer to come from them.` },
    { t: "p", x: `${T("retrieval", "Retrieval")} searches a trusted corpus (your FAQ, your policy docs) for passages related to the question; ${T("grounding", "grounding")} constrains the answer to those passages with citations. The academy's own rule — taught in Level 6 and enforced in the AI lab on this site — is: answer ONLY from retrieved sources with a citation; if retrieval finds nothing relevant, refuse and hand over to a human.` },
    { t: "table", caption: "Two answers to 'What is your return window?'", headers: ["", "Ungrounded assistant", "Grounded assistant"], rows: [
      ["Answer", "'We offer a 45-day return window, no questions asked.' (invented)", "'Our policy states a 14-day return window for unopened items.' [FAQ §2.1]"],
      ["Failure mode", "Confident fiction — the worst kind", "Honest refusal when sources are missing"] ] },
    { t: "callout", style: "warn", x: "Demos are never called production-ready in this academy. An assistant that answers only from sources is a demo until it has an evaluation set — and even then, it ships with a human handover path." },
    { t: "exercise", prompt: "A shop's FAQ says: 'Collect-by orders are held for 7 days.' A customer asks: 'Can I collect next Thursday if I ordered Monday?' Should the assistant answer 'yes'? What should it do instead?",
      hint: "Is the day-arithmetic IN the sources? The policy states holding period, not date arithmetic policy.",
      solution: "The sources answer 'held for 7 days' but not the Thursday question directly. A grounded assistant restates the policy ('orders are held 7 days [FAQ]') and offers the calculation transparently or hands over — it does not silently invent a yes." },
  ],
  quiz: [
    { q: "Hallucination means…", options: ["The model is offline", "Fluent output that is not grounded in real sources", "A slow answer", "A refusal"], answer: 1,
      why: "Invention, not refusal, is the failure." },
    { q: "The grounding rule requires answers to…", options: ["Be short", "Come only from retrieved sources, with citations — or refuse", "Use emojis", "Avoid numbers"], answer: 1,
      why: "Sources + citation + honest refusal is the rule." },
    { q: "Retrieval is…", options: ["The model's memory", "A search over a trusted corpus feeding the answer", "The user's history", "A spell-checker"], answer: 1,
      why: "Retrieval finds the passages; grounding uses only them." },
  ],
});
lesson({
  id: "ai-2", course: "ai1", stage: "s15", module: "Grounded assistants", chapter: "15. Grounding", minutes: 35,
  title: "Build a tiny FAQ assistant (in the AI lab)",
  objectives: ["Explain keyword-overlap retrieval and its limits", "Use the academy's AI lab against a real mini-FAQ", "Recognise when to hand over to a human"],
  blocks: [
    { t: "p", x: `You can build the core loop of a grounded assistant without any AI service: ${T("keyword-overlap", "score questions by overlapping keywords")}, retrieve the best passage, and compose an answer that quotes it with a citation. The AI Lab's assistant on this site does exactly that over a small shop FAQ — retrieval you can read, grounding you can verify, refusals you can trigger.` },
    { t: "p", x: `Its honest limits: keyword overlap misses paraphrase ("money back" vs "refund"), and it knows nothing beyond its corpus. Those limits are the lesson — real systems add embeddings and re-ranking for the first problem and a human handover for the second. What never changes is the contract: sources in, citations out, refuse when unsure.` },
    { t: "steps", title: "The loop, in four steps", steps: [
      { expr: "1. Take the question; lower-case and strip punctuation", note: "Normalisation is half of retrieval quality." },
      { expr: "2. Score each FAQ entry by overlapping keywords", note: "Simple, inspectable, honestly weak on paraphrase." },
      { expr: "3. If best score is 0 → refuse with handover", note: "The refusal IS a feature." },
      { expr: "4. Else answer by quoting the passage with its section", note: "Citation makes the answer checkable." } ] },
    { t: "exercise", prompt: "In the AI lab, ask the assistant something its FAQ cannot answer (try 'do you deliver to the moon?'). Record the exact refusal wording and why it is the correct behaviour.",
      hint: "Best overlap score 0 → the contract says refuse.",
      solution: "The lab replies that it can only answer from the FAQ and offers handover — refusing outside its sources is the designed, honest behaviour." },
  ],
  quiz: [
    { q: "Keyword-overlap retrieval fails mostly on…", options: ["Short FAQs", "Paraphrases with different words", "Numbers", "Citations"], answer: 1,
      why: "Same meaning, different vocabulary — overlap misses it." },
    { q: "A zero retrieval score should produce…", options: ["The closest answer anyway", "A refusal with human handover", "An apology and a guess", "A random FAQ"], answer: 1,
      why: "That is the grounding contract." },
    { q: "Citations exist so that…", options: ["Answers look academic", "Every claim is checkable against its source", "The model is happier", "Logs are bigger"], answer: 1,
      why: "Checkability is the point of grounding." },
  ],
});
lesson({
  id: "ai-3", course: "ai1", stage: "s15", module: "Evaluation", chapter: "16. Evaluation", minutes: 35,
  title: "Evaluation sets: scoring an assistant honestly",
  objectives: ["Build a small evaluation set with expected behaviours", "Score answers on groundedness and helpfulness", "Report results without overselling"],
  blocks: [
    { t: "p", x: `An ${T("evaluation-set", "evaluation set")} is a fixed list of test questions with the expected behaviour written in advance: some answerable (with the section that should be cited), some unanswerable (refusal expected). You then run every question through the assistant and score three things: did it answer from sources (groundedness), did it answer the actual question (helpfulness), did it refuse correctly when it should (honesty).` },
    { t: "table", caption: "Part of the lab's evaluation set (run it yourself)", headers: ["Question", "Expected", "Scores to record"], rows: [
      ["What are your opening hours?", "Answer citing FAQ §1", "grounded ✓ / helpful ✓"],
      ["Do you cater weddings?", "Answer citing FAQ §4 or refuse if absent", "depends on corpus"],
      ["Do you deliver to the moon?", "Refuse + handover", "honesty ✓"],
      ["What was your 2019 revenue?", "Refuse — outside sources", "honesty ✓"] ] },
    { t: "p", x: `The report rule mirrors the whole academy: state the set size, the pass rates, and what a pass does NOT prove. "8/10 grounded on this set" is a fact; "the assistant is reliable" is not. Evaluation sets grow as the product grows, and every incident that escapes becomes a new test case — the same loop as the admin journey in the design specification.` },
    { t: "exercise", prompt: "Add one evaluation case of your own to the three above: a question answerable only by COMBINING two FAQ sections. Why is it harder?",
      hint: "Combination questions test whether retrieval finds BOTH passages.",
      solution: "Example: 'Can I get a refund on a collect-by order?' needs the refund section AND the collect-by section. Retrieval may return only one — the answer must either cite both or refuse to combine beyond its sources." },
  ],
  quiz: [
    { q: "An evaluation set is written…", options: ["After seeing the answers", "In advance, with expected behaviour per question", "By the model", "Never"], answer: 1,
      why: "Pre-written expectations prevent grading your own homework." },
    { q: "'8/10 grounded on this set' honestly means…", options: ["The assistant is reliable", "On these 10 questions, 8 answered from sources", "It will never fail", "It passed QA forever"], answer: 1,
      why: "Scope the claim to the set." },
    { q: "Combination questions are harder because…", options: ["They are longer", "Retrieval must find multiple relevant passages", "They need maths", "Refusals are illegal"], answer: 1,
      why: "Multi-source questions stress retrieval completeness." },
  ],
});
lesson({
  id: "ai-4", course: "ai1", stage: "s15", module: "Evaluation", chapter: "16. Evaluation", minutes: 30,
  title: "Handover: the human path is a feature",
  objectives: ["Design the handover path for an assistant demo", "Write the honest-limits section for a handover document", "Explain why 'production-ready' is earned, not declared"],
  blocks: [
    { t: "p", x: `Every assistant ships with two paths: the automated one and the ${T("handover", "human handover")}. The handover triggers on refusal, on low retrieval scores, on complaints, and on anything touching money or safety. Far from being an admission of failure, it is the product working as designed — the same philosophy as the academy's projects: demos are demonstrations, with limits written down.` },
    { t: "p", x: `The handover document has four honest sections: what it does (grounded FAQ answers, with citations), what it does not (anything outside the corpus; paraphrase beyond keyword overlap), how it fails (refuses — visibly, with a path to a person), and what would make it production-ready (larger evaluation set, embedding-based retrieval, monitoring, owner sign-off). Writing section four is the engineering maturity test.` },
    { t: "exercise", prompt: "Draft the 'what would make it production-ready' bullet list for the lab's FAQ assistant. Three bullets minimum, each checkable.",
      hint: "Think data (evaluation set size), retrieval quality, and operations (monitoring, owner).",
      solution: "Example: (1) evaluation set ≥ 50 questions with ≥ 90% grounded rate, re-run weekly; (2) replace keyword overlap with embedding retrieval, validated on paraphrase cases; (3) live monitoring of refusal rate with an owner paged when it spikes. Each bullet is checkable — that is what makes them engineering, not vibes." },
  ],
  quiz: [
    { q: "The handover path triggers on…", options: ["Nothing — it is decoration", "Refusals, low scores, complaints, money/safety topics", "Weekends only", "Successes"], answer: 1,
      why: "Handover is the designed safety valve." },
    { q: "'Production-ready' is earned by…", options: ["Saying it confidently", "Checkable criteria: evaluation scale, retrieval quality, monitoring, sign-off", "A logo", "More parameters"], answer: 1,
      why: "Earned = checkable criteria met." },
    { q: "The honest-limits section belongs…", options: ["Nowhere", "In the handover document, stated plainly", "In marketing", "In the code comments only"], answer: 1,
      why: "Limits written down are limits that can be trusted around." },
  ],
});
