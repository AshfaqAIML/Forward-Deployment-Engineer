/* ============ FDE Academy — data part 2: Algebra, Logic & Proof, Graphs & Networks ============ */
"use strict";

/* ---------------- Course: Algebra Essentials (Stage 3) ---------------- */
lesson({
  id: "al-1", course: "algebra", stage: "s3", module: "Expressions and patterns", chapter: "3. Expressions", minutes: 25,
  title: "Letters that stand for numbers",
  objectives: ["Translate a word rule into an expression", "Substitute values and evaluate correctly", "Simplify by collecting like terms"],
  blocks: [
    { t: "p", x: `Algebra begins when a business rule is too general for one number. Amara's takings depend on how many rolls she sells: if each roll sells at £p and she sells n rolls, takings = p × n. The letters are not mysterious — each one is a number whose value we have not fixed yet. That is all an ${T("expression", "expression")} is: a calculation with slots.` },
    { t: "p", x: `${T("substitution", "Substitution")} fills the slots in order: p = 4, n = 30 gives 4 × 30 = £120. ${T("collecting-like-terms", "Collecting like terms")} tidies: 3n + 2n = 5n because three of something plus two of it is five of it — but 3n + 2 cannot merge; rolls and pounds are different animals.` },
    { t: "exercise", prompt: "A delivery van charges £40 for the trip plus £2 per basket. Write the expression for the cost of b baskets, then evaluate for 12 baskets.",
      hint: "Fixed part plus per-item part — the break-even lesson in reverse.",
      solution: "C = 40 + 2b; for b = 12: 40 + 24 = £68." },
  ],
  quiz: [
    { q: "In 5x + 3, what is the 3 called and can it merge with the 5x?", options: ["A like term — yes", "A constant — no", "A coefficient — yes", "A variable — no"], answer: 1,
      why: "3 is a constant; 5x is five unknowns. Different species do not merge." },
    { q: "Cost = 40 + 2b for b = 12 is…", options: ["£42", "£54", "£64", "£68"], answer: 3,
      why: "40 + 24 = 68." },
    { q: "Takings = p × n. Which substitution is correct for p = 4, n = 30?", options: ["4 + 30", "4 × 30", "30 − 4", "4^30"], answer: 1,
      why: "Adjacent letters mean multiplication." },
  ],
});
lesson({
  id: "al-2", course: "algebra", stage: "s3", module: "Expressions and patterns", chapter: "3. Expressions", minutes: 25,
  title: "Expanding and factorising",
  objectives: ["Expand brackets with the distributive rule", "Factorise simple expressions back into brackets", "Choose the right direction for the question asked"],
  blocks: [
    { t: "p", x: `The ${T("distributive-law", "distributive law")} says multiplication spreads over addition: a(b + c) = ab + ac. Going inward (expanding) turns a compact rule into a computable one: 3(2n + 4) = 6n + 12. Going outward (${T("factorising", "factorising")}) reveals structure: 6n + 12 = 6(n + 2), which says "three orders of (two rolls plus four)".` },
    { t: "p", x: `Why care about direction? Because questions ask different things. "What does one extra basket cost?" is easy from 6(n + 2) — six times the basket contents. "What is the cost for n = 5?" is easy from 6n + 12 — substitute and compute. Expanding exposes terms; factorising exposes structure. Engineers move both ways constantly.` },
    { t: "steps", title: "Both directions on 4(p − 2) + 8", steps: [
      { expr: "Expand: 4(p − 2) = 4p − 8", note: "Multiply both terms, watch the minus sign." },
      { expr: "Collect: 4p − 8 + 8 = 4p", note: "The constants cancel completely." },
      { expr: "Factorise the result: 4p = 4(p)", note: "Sometimes simplification goes all the way." } ] },
    { t: "exercise", prompt: "Expand and simplify 2(3x + 5) + 3(x − 2).",
      hint: "Expand each bracket separately, then collect like terms.",
      solution: "6x + 10 + 3x − 6 = 9x + 4." },
  ],
  quiz: [
    { q: "3(2n + 4) expands to…", options: ["6n + 4", "6n + 12", "5n + 7", "2n + 12"], answer: 1,
      why: "Multiply both terms: 6n + 12." },
    { q: "6n + 12 factorises to…", options: ["6(n + 2)", "3(2n + 4) only", "n(6 + 12)", "6(n + 12)"], answer: 0,
      why: "Both terms share 6; 12 ÷ 6 = 2." },
    { q: "Which direction helps you see 'what each extra unit adds'?", options: ["Expanding", "Factorising", "Neither", "Rounding"], answer: 1,
      why: "Factored form shows the per-unit structure." },
  ],
});
lesson({
  id: "al-3", course: "algebra", stage: "s3", module: "Equations and graphs", chapter: "4. Equations", minutes: 30,
  title: "Solving linear equations",
  objectives: ["Solve one- and two-step equations with balance reasoning", "Check a solution by substitution", "Turn a business question into an equation and back"],
  blocks: [
    { t: "p", x: `An ${T("equation", "equation")} is a balanced scale: whatever is on one side equals the other, so any move must happen to both. Solve 3n + 12 = 60: subtract 12 from both sides (3n = 48), divide both sides by 3 (n = 16). Every step is a legal move on the scale, never a magic trick.` },
    { t: "steps", title: "How many rolls must Amara sell to net £60 after the £12 baking cost?", steps: [
      { expr: "Model: 4n − 12 = 60", note: "Takings minus cost equals the target." },
      { expr: "4n = 72", note: "Add 12 to both sides." },
      { expr: "n = 18", note: "Divide both sides by 4." },
      { expr: "Check: 4 × 18 − 12 = 60 ✓", note: "Substitution back is the verification habit." } ] },
    { t: "exercise", prompt: "A vendor's daily profit is 2.5n − 20 (contribution £2.50, stall £20). Solve 2.5n − 20 = 30 for n and check.",
      hint: "Add, then divide — and verify by substituting back.",
      solution: "2.5n = 50 → n = 20. Check: 2.5 × 20 − 20 = 50 − 20 = 30 ✓" },
  ],
  quiz: [
    { q: "First move to solve 3n + 12 = 60?", options: ["Divide both sides by 3", "Subtract 12 from both sides", "Subtract 60", "Multiply by 3"], answer: 1,
      why: "Undo addition first to isolate the term with n." },
    { q: "Solution of 2.5n − 20 = 30 is…", options: ["n = 10", "n = 20", "n = 12", "n = 50"], answer: 1,
      why: "2.5n = 50, so n = 20." },
    { q: "Why substitute the answer back?", options: ["To lengthen the working", "To verify the solution balances the original equation", "Because calculators require it", "To round it"], answer: 1,
      why: "The check is the verification habit — it catches slips." },
  ],
});
lesson({
  id: "al-4", course: "algebra", stage: "s3", module: "Equations and graphs", chapter: "4. Equations", minutes: 30,
  title: "Straight-line graphs and what they mean",
  objectives: ["Match y = mx + c to a story's rate and start value", "Read intersections and steepness from a graph", "Draw the profit line and find where it crosses zero"],
  blocks: [
    { t: "p", x: `Every straight line is y = mx + c: m is the ${T("gradient", "gradient")} — how much y grows per one step of x — and c is where the line starts when x = 0. In business stories, m is the per-item rate and c is the fixed part. Profit line for Amara: y = 2.5n − 20; gradient 2.5 (each roll adds £2.50), start −20 (the stall fee before a single sale).` },
    { t: "plot", caption: "Profit line y = 2.5x − 20 — where does it cross zero?", fn: x => 2.5 * x - 20, xmin: 0, xmax: 20,
      marks: [{ x: 8, y: 0, label: "break-even", color: "#2E7D74" }], yMin: -25, yMax: 35 },
    { t: "p", x: `The line crossing zero IS the break-even point — algebra and graphs are two views of one fact. Steeper gradient means faster profit growth per sale; a higher start (bigger fixed cost) pushes the crossing further right, which is why heavy fixed costs make small vendors fragile.` },
    { t: "exercise", prompt: "A van courier's profit is y = 6d − 90 per day with d deliveries. Where does the line cross zero, and what does a steeper gradient (6 vs Amara's 2.5) buy him?",
      hint: "Set y = 0 and solve; compare gradients as rates.",
      solution: "0 = 6d − 90 → d = 15 deliveries to break even. Gradient 6 means £6 profit per extra delivery — faster growth once past the crossing." },
  ],
  quiz: [
    { q: "In y = 2.5n − 20, the −20 represents…", options: ["The per-roll contribution", "The fixed cost before any sales", "The profit", "The price"], answer: 1,
      why: "It is the line's value at n = 0 — the fixed cost." },
    { q: "A steeper gradient means…", options: ["Slower growth", "More profit per additional unit", "Lower fixed costs", "Loss"], answer: 1,
      why: "Gradient is the rate: profit added per extra unit." },
    { q: "Where does y = 6d − 90 cross zero?", options: ["d = 10", "d = 15", "d = 90", "d = 9.6"], answer: 1,
      why: "90 ÷ 6 = 15." },
  ],
});

/* ---------------- Course: Logic & Proof (Stage 4) ---------------- */
lesson({
  id: "lo-1", course: "logic", stage: "s4", module: "Statements and truth", chapter: "5. Statements", minutes: 25,
  title: "Statements, and, or, not",
  objectives: ["Recognise what makes a sentence a statement", "Build compound statements with and, or, not", "Compute truth values without guessing"],
  blocks: [
    { t: "p", x: `A ${T("statement", "statement")} is a sentence that is definitely true or definitely false — never both, never neither. "The delivery arrived on Tuesday" is a statement. "Is the delivery here?" is a question; "deliver it soon" is a command; both are outside logic. Precision here is precision later: code conditions, database filters and AI refusals are all statements in costume.` },
    { t: "p", x: `${T("conjunction", "AND")} demands both parts true; ${T("disjunction", "OR")} is satisfied by at least one (inclusive or); ${T("negation", "NOT")} flips. "Paid AND delivered" gates a shipment — one missing part blocks it. "Coupon OR member" grants the discount to either. "NOT damaged" passes only intact items.` },
    { t: "table", caption: "Truth table for A and B combined", headers: ["A", "B", "A AND B", "A OR B", "NOT A"], rows: [
      ["true", "true", "true", "true", "false"],
      ["true", "false", "false", "true", "false"],
      ["false", "true", "false", "true", "true"],
      ["false", "false", "false", "false", "true"] ] },
    { t: "exercise", prompt: "A refund rule: refund is given when (receipt shown AND within 30 days) OR VIP customer. Is a VIP customer without a receipt, outside 30 days, refunded? Why?",
      hint: "Evaluate the two sides of the OR separately, then combine.",
      solution: "Left side: false (both conditions fail). Right side: true (VIP). false OR true = true → refunded. The rule as written makes VIPs unconditionally refundable — logic exposes that." },
  ],
  quiz: [
    { q: "Which is a statement?", options: ["Close the door!", "Is it raining?", "The order shipped on Monday", "Maybe it shipped"], answer: 2,
      why: "It has a definite truth value; questions, commands and vagueness are not statements." },
    { q: "'Coupon OR member' grants the discount to…", options: ["Only customers with both", "Customers with at least one", "Nobody", "Everyone"], answer: 1,
      why: "Inclusive OR: one true part suffices." },
    { q: "NOT(false) is…", options: ["false", "true", "undefined", "maybe"], answer: 1,
      why: "Negation flips the truth value." },
  ],
});
lesson({
  id: "lo-2", course: "logic", stage: "s4", module: "Statements and truth", chapter: "5. Statements", minutes: 25,
  title: "If-then and the converse trap",
  objectives: ["Read if-then statements and spot when they are true", "Distinguish a claim from its converse", "Use counterexamples to test claims"],
  blocks: [
    { t: "p", x: `An ${T("implication", "if-then statement")} promises only one thing: IF the hypothesis holds THEN the conclusion does. "If the parcel weighs over 2 kg THEN it costs £6." The promise breaks only in one case: hypothesis true, conclusion false. A heavy parcel priced at £4 breaks it; a light parcel at £6 does not — the rule said nothing about light parcels.` },
    { t: "p", x: `The ${T("converse", "converse")} swaps the two parts, and it is a different claim. "If it costs £6 THEN it weighs over 2 kg" does not follow from the original rule — maybe £6 also covers bulky-but-light parcels. Swapping is how correct rules become incorrect ones; engineers who quote the converse without noticing ship bugs.` },
    { t: "p", x: `A ${T("counterexample", "counterexample")} kills a false claim with a single example: one £6 parcel under 2 kg disproves the converse instantly. Finding one is a superpower — it converts an argument into a fact.` },
    { t: "exercise", prompt: "Rule: 'If a stall pays the weekly fee THEN it may trade on Saturday.' A trader trades on Saturday without paying. Does this break the rule? What would break it?",
      hint: "The rule promises trading only for payers; it says nothing about non-payers. Break it with: payer forbidden to trade.",
      solution: "No — the rule restricts nothing about non-payers. Only a payer who is forbidden to trade (hypothesis true, conclusion false) breaks it." },
  ],
  quiz: [
    { q: "An if-then claim is false exactly when…", options: ["Both parts are false", "Hypothesis true and conclusion false", "Hypothesis false", "The conclusion is surprising"], answer: 1,
      why: "That is the single broken-promise case." },
    { q: "The converse of 'If P then Q' is…", options: ["If Q then P", "If not P then not Q", "P and Q", "P or Q"], answer: 0,
      why: "The converse swaps hypothesis and conclusion." },
    { q: "A counterexample to 'All heavy parcels cost £6' is…", options: ["A £6 light parcel", "A heavy parcel costing £4", "A £4 light parcel", "No parcels exist"], answer: 1,
      why: "It satisfies 'heavy' but breaks the pricing conclusion." },
  ],
});
lesson({
  id: "lo-3", course: "logic", stage: "s4", module: "Proof techniques", chapter: "6. Reasoning", minutes: 30,
  title: "Direct proof and proof by cases",
  objectives: ["Structure a direct proof: assumptions to conclusion", "Split a claim into exhaustive cases", "Judge when a proof is complete"],
  blocks: [
    { t: "p", x: `A ${T("direct-proof", "direct proof")} walks from agreed facts to the conclusion with no leaps. Claim: "if a number of rolls n is even, then n² is even." Proof: even means n = 2k for some whole k; then n² = (2k)² = 4k² = 2(2k²), which is twice a whole number, hence even. Every symbol earned its place — that is the whole art.` },
    { t: "p", x: `${T("proof-by-cases", "Proof by cases")} handles claims that behave differently depending on the situation. Claim: "consecutive whole numbers always multiply to an even product." Cases: if the first is even, done; if the first is odd, the second is even, done. The cases cover everything — that exhaustiveness is what makes the proof complete. A proof with a gap ("what if the first is half-even?") proves nothing.` },
    { t: "callout", style: "info", x: "Why engineers prove things: a tested program shows the inputs you tried; a proof shows all inputs. Verification culture at the academy is the same idea at smaller scale — check, don't hope." },
    { t: "exercise", prompt: "Prove by cases: the sum of two consecutive whole numbers, n + (n+1), is always odd. Write the two cases explicitly.",
      hint: "Case on whether n is even or odd, and use n = 2k or n = 2k + 1.",
      solution: "Case n = 2k (even): sum = 2k + 2k + 1 = 4k + 1 = 2(2k) + 1 → odd. Case n = 2k + 1 (odd): sum = 2k + 1 + 2k + 2 = 4k + 3 = 2(2k + 1) + 1 → odd. Both cases give odd; cases are exhaustive; claim proved." },
  ],
  quiz: [
    { q: "A direct proof must…", options: ["Use algebra always", "Derive the conclusion from agreed facts without leaps", "Try many examples", "Be written in symbols only"], answer: 1,
      why: "Examples support; the proof is the derivation." },
    { q: "Proof by cases is valid only when…", options: ["There are two cases", "The cases cover every possibility", "Each case is short", "A diagram is drawn"], answer: 1,
      why: "Exhaustiveness is the licence." },
    { q: "'n even ⇒ n² even' — the proof rewrites n as…", options: ["n = k", "n = 2k", "n = 2k + 1", "n = k²"], answer: 1,
      why: "2k is the definition of even in usable form." },
  ],
});
lesson({
  id: "lo-4", course: "logic", stage: "s4", module: "Proof techniques", chapter: "6. Reasoning", minutes: 30,
  title: "Sets, all and some",
  objectives: ["Read 'for all' and 'there exists' claims correctly", "Negate them without flipping meaning", "Connect quantifiers to loops and tests"],
  blocks: [
    { t: "p", x: `Two quantifiers run the world's claims. "For all" (${T("universal-quantifier", "∀")}) demands every case: "every delivery this week arrived on time." "There exists" (${T("existential-quantifier", "∃")}) demands just one: "some stallholder doubles prices on Saturdays." Getting these backwards is the classic specification bug.` },
    { t: "p", x: `Negation flips them: NOT(for all x, P(x)) = there exists an x where NOT P(x). "Not every delivery was on time" = "at least one delivery was late." You do not need every delivery to be late — one suffices. This one line of logic is why one failing test case breaks an "all tests pass" claim.` },
    { t: "table", caption: "Quantifiers in claims and in code", headers: ["Claim", "Logic", "As a loop"], rows: [
      ["All orders above £50 ship free", "∀ orders o: o > 50 ⇒ free(o)", "if any order > 50 is NOT free → bug found"],
      ["Some roll is gluten-free", "∃ roll r: gf(r)", "keep scanning; stop at first gf roll"],
      ["No damaged item is shipped", "∀ items i: damaged(i) ⇒ ¬shipped(i)", "scan all; any damaged-and-shipped is a failure"] ] },
    { t: "exercise", prompt: "Negate precisely: 'Every stallholder paid the weekly fee.' Then say how many examples would verify your negation.",
      hint: "∀ flips to ∃ under negation.",
      solution: "'There exists a stallholder who did not pay the fee.' One such stallholder verifies it — quantifier negation is what makes single counterexamples decisive." },
  ],
  quiz: [
    { q: "NOT('for all x, P(x)') equals…", options: ["'for all x, NOT P(x)'", "'there exists x with NOT P(x)'", "'there exists x with P(x)'", "'nothing holds'"], answer: 1,
      why: "Breaking a universal needs just one counterexample." },
    { q: "'Some roll is gluten-free' requires finding…", options: ["All rolls gluten-free", "At least one", "Exactly one, no more", "None"], answer: 1,
      why: "∃ = at least one exists." },
    { q: "One failing test breaks 'all tests pass' because…", options: ["Tests are strict", "Negation of ∀ is ∃", "Tests are random", "It does not"], answer: 1,
      why: "A single failure is a witness to the negated universal." },
  ],
});

/* ---------------- Course: Graphs & Networks (Stage 5) ---------------- */
lesson({
  id: "gr-1", course: "graphs", stage: "s5", module: "Graphs and paths", chapter: "7. Graphs", minutes: 30,
  title: "Modelling with nodes and edges",
  objectives: ["Decide what the nodes and edges should be", "Read degree as a direct count of connections", "Explain when a graph model is appropriate — and when not"],
  blocks: [
    { t: "p", x: `A ${T("graph", "graph")} is the honest minimal model of a connected situation: ${T("node", "nodes")} for the things, ${T("edge", "edges")} for the direct relationships. Delivery routes: nodes are shops, edges are direct roads with their distances. Who-supplies-whom: nodes are businesses, edges are supply contracts. The modelling decision — what exactly becomes a node — is where most of the thinking happens.` },
    { t: "p", x: `A node's ${T("degree", "degree")} counts its edges. A shop with degree 1 sits on exactly one road: close that road and the shop is unreachable — no algorithm needed, just the definition. Degrees answer reachability questions the way arithmetic answers money questions: instantly and provably.` },
    { t: "table", caption: "Amara's delivery neighbourhood as a graph", headers: ["Edge", "Weight (minutes)"], rows: [
      ["Stall ↔ Market", "5"], ["Stall ↔ Depot", "12"], ["Market ↔ Bakery", "7"], ["Depot ↔ Bakery", "9"], ["Depot ↔ Café", "4"] ] },
    { t: "p", x: `Weights turn a map into a decision tool: edge weights are minutes, costs or capacities depending on the question. Same graph, different weights, different "shortest path" — the model does not choose for you; it records what you told it.` },
    { t: "exercise", prompt: "The Café has exactly one road (to the Depot, 4 minutes). What is its degree, and what happens to deliveries if that road closes? Which vertex would you check next?",
      hint: "Degree counts edges. Reachability follows directly.",
      solution: "Degree 1. Closing the road makes the Café unreachable from anywhere else — no search needed. Check the Depot next: it still has degree 3 and stays connected." },
  ],
  quiz: [
    { q: "A node with degree 1 has…", options: ["One neighbour", "Two neighbours", "No neighbours", "Weight 1 edges"], answer: 0,
      why: "Degree counts incident edges; one edge means one neighbour." },
    { q: "Closing the only road to a degree-1 node makes it…", options: ["Harder to reach", "Unreachable", "Faster to reach", "Unchanged"], answer: 1,
      why: "Its only connection is gone — reachability fails by definition." },
    { q: "What do edge weights usually represent?", options: ["Node names", "Minutes, costs or capacities", "The number of nodes", "Nothing"], answer: 1,
      why: "Weights quantify the relationship the edge models." },
  ],
});
lesson({
  id: "gr-2", course: "graphs", stage: "s5", module: "Graphs and paths", chapter: "7. Graphs", minutes: 30,
  title: "Shortest paths, step by step",
  objectives: ["Trace Dijkstra's idea on a small graph by hand", "State what shortest paths assume", "Convert a path into a delivery plan with total time"],
  blocks: [
    { t: "p", x: `Finding the ${T("shortest-path", "shortest path")} is greedy in the best sense: always expand the cheapest settled frontier. On our neighbourhood graph, from Stall to Bakery, brute force tries Stall→Market→Bakery (5 + 7 = 12) against Stall→Depot→Bakery (12 + 9 = 21) — the market route wins at 12 minutes. The method: keep a best-known distance to every node; improve it whenever a cheaper route appears; stop when your target is settled.` },
    { t: "steps", title: "Settling distances from the Stall", steps: [
      { expr: "Market: 5 (via direct road)", note: "Cheapest frontier first." },
      { expr: "Depot: 12 (direct) vs 5 + 7 + 9 = 21? keep 12", note: "Improve only when genuinely cheaper." },
      { expr: "Bakery: min(5 + 7, 12 + 9) = 12", note: "Via Market wins." } ] },
    { t: "p", x: `What the answer assumes: weights are trustworthy and stable (no Friday roadworks), and "shortest" means the weight you chose — minutes here, not kilometres or fuel. An FDE states this in the handover: shortest for whom, by which measure, as of when.` },
    { t: "exercise", prompt: "A new road opens: Stall ↔ Café direct at 6 minutes. Recompute the best Stall→Café route and compare with the old one (Stall→Depot→Café = 16).",
      hint: "Compare the new direct edge against the previous best.",
      solution: "New best = 6 minutes (direct), beating 16. This is exactly the 'improve when cheaper' step of the method." },
  ],
  quiz: [
    { q: "Stall→Market (5) then Market→Bakery (7): total time is…", options: ["10", "12", "21", "7"], answer: 1,
      why: "Weights add along the path: 5 + 7 = 12." },
    { q: "When does the method replace a node's best-known distance?", options: ["Always", "Only when a strictly cheaper route appears", "Never", "At the end"], answer: 1,
      why: "Improvement requires strictly better." },
    { q: "'Shortest path' is measured in…", options: ["Kilometres always", "Whatever the weights represent", "Number of roads only", "Time always"], answer: 1,
      why: "You get the minimisation of the weight you chose." },
  ],
});
lesson({
  id: "gr-3", course: "graphs", stage: "s5", module: "Flows and networks", chapter: "8. Connectivity", minutes: 30,
  title: "Connected, or not? Reachability without hope",
  objectives: ["Decide reachability by tracing connections", "Explain single points of failure using degrees", "Describe what makes a network fragile or robust"],
  blocks: [
    { t: "p", x: `${T("connectivity", "Connectivity")} asks: can every node reach every other? Trace it by hand on small graphs — follow edges, mark visited nodes, stop when nothing new is reachable. Any node left unmarked is genuinely unreachable, and no optimism changes that. This is the same flood-fill that powers image tools and, later in the academy, dependency checks.` },
    { t: "p", x: `Fragility has a shape: nodes of degree 1 hang off the network by a thread; nodes that all paths cross are ${T("single-point-of-failure", "single points of failure")}. Robustness means redundancy — a second road to the Café converts its closure from a disaster into a detour. Real infrastructure questions (payment fallbacks, deployment failovers) are this lesson with bigger numbers.` },
    { t: "p", x: `Try it: add or close roads in the explorer below and watch reachability flip. The readout traces connectivity directly from the current edge set.` },
    { t: "ieq", caption: "Network explorer — toggle roads, read reachability", sliders: [
      { key: "cafe", label: "Café–Depot road open? (1 yes / 0 no)", min: 0, max: 1, step: 1, val: 1 },
      { key: "market", label: "Market–Stall road open?", min: 0, max: 1, step: 1, val: 1 },
      { key: "depot", label: "Depot–Stall road open?", min: 0, max: 1, step: 1, val: 1 } ],
      display: v => {
        const links = [["stall", "market", v.market === 1], ["stall", "depot", v.depot === 1], ["depot", "cafe", v.cafe === 1]];
        const reach = n => {
          const seen = new Set([n]); let grew = true;
          while (grew) {
            grew = false;
            for (const [a, b, on] of links) {
              if (!on) continue;
              if (seen.has(a) && !seen.has(b)) { seen.add(b); grew = true; }
              if (seen.has(b) && !seen.has(a)) { seen.add(a); grew = true; }
            }
          }
          return seen;
        };
        const fromStall = reach("stall");
        return `From the Stall you can reach: ${["stall", "market", "depot", "cafe"].filter(n => fromStall.has(n)).join(", ")} — ${fromStall.size === 4 ? "the network is fully connected" : "some venues are cut off"}.`;
      },
      note: v => (v.cafe + v.market + v.depot === 3) ? "All roads open: two independent routes exist into the Depot side." :
        "A closed road can isolate a degree-1 venue instantly — this is what redundancy protects against." },
    { t: "exercise", prompt: "The Depot is the only link between the Stall side and the Café. Name the single point of failure and the cheapest fix.",
      hint: "Look for the node every cross-side path must pass through.",
      solution: "The Depot. Cheapest fix: one extra edge bypassing it (e.g. Market–Café), creating a second route." },
  ],
  quiz: [
    { q: "A node is unreachable from the Stall if…", options: ["Its degree is high", "No chain of open edges connects it", "It is far away", "Its edge is heavy"], answer: 1,
      why: "Reachability is purely about connected chains of edges." },
    { q: "Redundancy in a network means…", options: ["More nodes", "A second route exists between key points", "Heavier edges", "Fewer edges"], answer: 1,
      why: "A second route turns failures into detours." },
    { q: "Which node type is most fragile?", options: ["Degree 3", "Degree 1", "Degree 2", "All equal"], answer: 1,
      why: "One edge — one thread." },
  ],
});
lesson({
  id: "gr-4", course: "graphs", stage: "s5", module: "Flows and networks", chapter: "8. Connectivity", minutes: 30,
  title: "Flows and bottlenecks",
  objectives: ["Read a flow network's capacity constraint per edge", "Find the bottleneck of a delivery plan", "Explain max-flow in plain language"],
  blocks: [
    { t: "p", x: `A ${T("flow-network", "flow network")} adds capacity to edges: how many boxes per hour can each road carry? The ${T("bottleneck", "bottleneck")} is the narrowest point on any route — one 20-box road between two 60-box roads caps the whole chain at 20. Business pipelines behave identically: the oven, the packing line, the checkout — throughput of the chain is the throughput of its slowest edge.` },
    { t: "table", caption: "Morning delivery capacities (boxes/hour)", headers: ["Road", "Capacity", "Note"], rows: [
      ["Stall → Market", "60", "wide"], ["Market → Bakery", "20", "bottleneck"], ["Stall → Depot", "40", "medium"], ["Depot → Bakery", "30", "medium"] ] },
    { t: "p", x: `The ${T("max-flow", "maximum flow")} from Stall to Bakery: 20 via Market, plus 30 via Depot = 50 boxes per hour total. The Market road could carry 60 but is fed only what the 20-cap road allows — widening the wrong road is the classic wasted investment. Find the bottleneck first; widen there.` },
    { t: "exercise", prompt: "The Market→Bakery road is widened to 35. Compute the new maximum flow and identify the next bottleneck.",
      hint: "Re-add the two route capacities; look for the new narrowest edge.",
      solution: "Now 35 via Market + 30 via Depot = 65. Next bottleneck: Stall→Depot at 40 (and Depot→Bakery at 30). Widening Stall→Market or Market→Bakery further does nothing." },
  ],
  quiz: [
    { q: "A chain has capacities 60, 20, 60. The chain throughput is…", options: ["140", "60", "20", "40"], answer: 2,
      why: "The bottleneck edge caps the chain." },
    { q: "Max flow to Bakery with caps 20 (Market) and 30 (Depot) is…", options: ["20", "30", "50", "60"], answer: 2,
      why: "Flows on separate routes add: 20 + 30 = 50." },
    { q: "Where should you widen first?", options: ["The widest edge", "The bottleneck", "Any edge", "All edges equally"], answer: 1,
      why: "Only bottleneck improvements move the maximum." },
  ],
});
