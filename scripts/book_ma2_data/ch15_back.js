// Book MA-2 - Front matter (welcome), part introductions, final assessment, references.
module.exports = {
  welcome: {
    intro: [
      "Welcome to the second book of the FDE Academy mathematics series. The first book, Everyday Mathematics for Future Engineers, made you solid friends with numbers, fractions, percentages, ratios, powers, and measurement. This book takes the next step, and it is a big one: it teaches you to work with the unknown. Not with one number at a time, but with rules that hold for every number, patterns that reach into the future, pictures that carry whole stories, and the small honest logic that decides everything a computer does. Its subject name sounds grand, Algebra, Logic, Graphs, and Problem Solving, but its promise is simple: by the last page, a problem that once looked like a wall will look like a door with four moves painted on it.",
      "An FDE, a forward deployed engineer, is an engineer who works directly with customers: listening to their problems, modelling their business in numbers, and building the small systems that make the numbers behave. Everything in this book is chosen because FDEs use it weekly. Equations recover the hidden quantity behind a surprising bill. Lines compare pricing plans and find the exact usage where the cheaper provider switches. Truth tables settle disputes about discounts and access rules. Venn diagrams prevent the double-counted customer list. Counting sizes the test matrix and the password policy. None of this needs talent; all of it needs patience, one page at a time, exactly as the first book did.",
      "This book assumes you have read Book MA-1 or already own its skills: confident arithmetic, fractions, decimals, percentages, ratios, negative numbers, powers, and units. If any of those feel rusty, revisit the matching chapter there first; this book stands on that floor and never repeats it at length. Everything else is built from zero, every symbol explained on first use, every example worked line by line, and every answer fully explained at the back of the book.",
    ],
    howToUse: [
      "Read each chapter in order, with paper and a pencil beside you. This is a doing book, not a watching book.",
      "Work every solved example yourself before reading its printed working. Cover the answer lines, attempt, uncover, compare.",
      "Learn the vocabulary honestly. The words table in each chapter is not decoration; later chapters assume you own those words.",
      "Do the practical activity at the end of each chapter before moving on. Skipping it saves ten minutes today and costs ten hours of fragility later.",
      "Attempt every practice question before opening the hints, and open the hints before opening the Answer Key. The struggle is the lesson; the key is the confirmation.",
      "Use the chapter quiz as a self-test: answer the multiple-choice and short-answer questions without notes, then score yourself honestly with the Answer Key.",
      "When a chapter feels easy, do not skip it; do it faster. Ease is evidence, and evidence deserves a quick confirmation, not neglect.",
      "Keep a running notebook of every equation you solve and every rule you discover. By the final chapter it becomes your personal methods handbook.",
    ],
    anatomy: [
      ["A Story from Everyday Life", "A real situation where the chapter's ideas secretly do the work, so every tool lands on familiar ground."],
      ["Learning Objectives", "Four or five plain promises of what you will be able to do by the chapter's end."],
      ["What This Topic Means", "The basic explanation, from the simplest meaning to the practical use, with every symbol unpacked."],
      ["Why It Matters", "The honest case for the tool: what it saves, prevents, or makes possible in real work."],
      ["New Words You Will Need", "The chapter's technical terms with full forms, plain meanings, and where each one is used."],
      ["The Idea, Step by Step", "The numbered lessons that build the skill one honest move at a time."],
      ["Solved Examples", "Everyday problems worked line by line, from the question to the checked answer."],
      ["A Technical Example", "The same idea doing professional work: bills, plans, systems, and business decisions."],
      ["Where You Will Meet This in Real Life", "The applications, from receipts and timetables to databases and cloud platforms."],
      ["Common Mistakes and How to Avoid Them", "The errors every beginner makes, each with its practical correction."],
      ["Revision Summary", "The chapter's essential truths in six lines, for the day before the quiz."],
      ["How This Helps You Become an FDE", "The connection between the chapter's skill and real forward deployed engineering work."],
      ["Practical Activity", "A hands-on task that turns the chapter from reading into doing."],
      ["Chapter Quiz", "Multiple-choice and short-answer questions, one practical exercise, and one real-world scenario."],
      ["Practice Questions", "Sixteen questions in four bands, from very easy to challenging, with hints on the hard ones."],
    ],
  },
  parts: [
    {
      num: 1,
      name: "Part I \u2014 Algebra from Scratch",
      intro: "The first five chapters give you the language of the unknown. You will learn that algebra is not a new subject but a new power over an old one: naming the hidden number, writing the rule it lives in, and working it out. Chapter 1 replaces fear with the mystery-box picture. Chapter 2 teaches expressions, the recipes made of variables, coefficients, and constants. Chapter 3 puts the equals sign on a balance scale and makes solving a physical act of fairness. Chapter 4 sends the equations to work on real bills, fares, and budgets. Chapter 5 extends the promise from exact equality to honest ranges, where the real world mostly lives. When Part I is done, a sentence like 2.50 + 1.20k = 9.70 will feel less like mathematics and more like a question you know how to answer.",
    },
    {
      num: 2,
      name: "Part II \u2014 Patterns and Graphs",
      intro: "The middle five chapters give the unknown a shape. Sequences step into the future and write rules that reach any term at once. The coordinate plane turns two numbers into a place. Straight lines turn fixed fees and per-unit rates into pictures whose crossings decide purchases. Curves bring the multiplying kind of growth and the most expensive lesson in forecasting: doubling hides, then explodes. Functions close the part by packaging rules into machines, input to output, the exact shape of every spreadsheet formula and computer program you will ever meet. After Part II, a chart in a business report will read like a sentence: here is where it starts, here is how fast it climbs, and here is where it overtakes.",
    },
    {
      num: 3,
      name: "Part III \u2014 Logic and Discrete Thinking",
      intro: "The last five chapters leave continuous numbers for a while and count what can be counted. Truth tables decide rules built from AND, OR, and NOT, the three words every computer lives by. Sets and Venn diagrams organize lists and kill the double count. Counting multiplies choices into outcome spaces, from outfits to password policies. Networks draw systems as dots and lines, then audit them for fragility and find the cheapest path. The capstone chapter mixes everything, because real problems never arrive sorted by chapter. Part III is where mathematics becomes engineering: less about one number, more about the structure of decisions, lists, systems, and choices.",
    },
  ],
  final: {
    intro: "This final assessment mixes every chapter of the book into sixteen questions: eight multiple-choice, four short-answer, two practical exercises, and two real-world scenarios. No chapter labels are given, because choosing the tool is now part of the exercise, exactly as it is in real work. Sit down with paper, do all sixteen in one honest sitting of about two hours, and only then open the answers. Score yourself one point per question; sixteen is mastery, twelve is ready to proceed, and anything less points at the chapters to revisit, not at your ability.",
    mcq: [
      { q: "Solve 2x + 3 = 11.", options: ["x = 3", "x = 4", "x = 5", "x = 7"], a: "B", why: "Subtract 3 from both sides: 2x = 8, so x = 4. Check: 2 \u00d7 4 + 3 = 11 \u2713. Options A and C forget one of the two undo moves." },
      { q: "Which of these is an expression rather than an equation?", options: ["2x + 5 = 17", "3n = 21", "4p \u2212 1", "x + 2 = 9"], a: "C", why: "4p \u2212 1 is a phrase with no equals sign: it describes an amount but claims nothing. The other three are claims that can be solved." },
      { q: "In the rule y = 3x + 2, what is the rate and what is the start?", options: ["Rate 2, start 3", "Rate 3, start 2", "Rate 5, start 0", "Rate 3, start 3"], a: "B", why: "The number beside x is the climb per step: 3. The lonely number is the value at x = 0: 2. Swapping them misreads the whole line." },
      { q: "Compute 2^{5}.", options: ["10", "16", "25", "32"], a: "D", why: "Five doublings of 2: 2, 4, 8, 16, 32. Option B stops two doublings early, the classic off-by-count in exponential growth." },
      { q: "Solve x \u00f7 2 + 1 = 5.", options: ["x = 4", "x = 8", "x = 12", "x = 6"], a: "B", why: "Subtract 1 first: x \u00f7 2 = 4. Then multiply by 2: x = 8. Check: 8 \u00f7 2 + 1 = 5 \u2713. Undo in reverse build order." },
      { q: "Evaluate true AND false.", options: ["true", "false", "sometimes true", "neither true nor false"], a: "B", why: "AND demands both sides true; one false side sinks the claim. This row of the truth table is the strictest rule in the book." },
      { q: "What is the union of {1, 2} and {2, 3}?", options: ["{2}", "{1, 2, 3}", "{1, 3}", "{1, 2, 2, 3}"], a: "B", why: "The union collects everything in either set and removes the duplicate 2. Option D keeps the duplicate, which is a list, not a set." },
      { q: "You own 3 shirts and 2 trousers. How many outfits?", options: ["5", "6", "9", "12"], a: "B", why: "Two independent stages multiply: 3 \u00d7 2 = 6. Option A adds stages, the most common counting error in the world." },
    ],
    short: [
      { q: "Solve 3x \u2212 4 = 14, showing every move and the check.", a: "Add 4 to both sides: 3x = 18. Divide both sides by 3: x = 6. Check: 3 \u00d7 6 \u2212 4 = 18 \u2212 4 = 14 \u2713. Two paired moves, one honest check." },
      { q: "Write the correct negation of: all four doors are locked. Explain why the careless negation is wrong.", a: "Correct negation: at least one door is not locked. The careless negation, no doors are locked, over-flips: one unlocked door already makes the original claim false, so the flip must demand only that much. All-claims flip to at-least-one claims." },
      { q: "Find where the line y = 4 + 2x crosses the flat line y = 12, and interpret the crossing.", a: "Set 4 + 2x = 12, so 2x = 8 and x = 4, the crossing point (4, 12). Interpretation: below 4 units the metered rule charges less; above 4, the flat 12 wins. The crossing is the switch-over decision." },
      { q: "Two lists have 25 and 18 entries with 7 entries on both. A colleague claims the merged list has 43 entries. Correct the count and explain the error in one sentence.", a: "The honest merge is 25 + 18 \u2212 7 = 36 entries. The error is double counting: the 7 shared entries were counted in both lists, so the intersection must be subtracted once, exactly as the Venn diagram's lens shows." },
    ],
    practical: [
      { q: "Practical exercise 1: choose two real competing plans from your life (any fixed fee plus per-unit rate). Write both rules, draw both lines with a table of three points each, compute the crossing exactly, and write the recommendation sentence for your own typical usage.", a: "Full credit needs: both rules in fixed-plus-rate form with declared letters, three honest table points per line plotted, the crossing found by setting the rules equal and balancing (not eyeballed), and a recommendation sentence with the user's own number substituted. Example shape: 10 + 0.5x versus 25, crossing at 30 units, my usage 12 means the metered plan at 16 dollars wins." },
      { q: "Practical exercise 2: draw the two-circle Venn diagram for two real lists from your life (playlists, shelves, contacts). Fill all regions, verify the diagram against itself, and compute the union twice: once by walking the picture, once by inclusion-exclusion.", a: "Full credit needs: honestly counted lists, an overlap found member by member, four filled regions (only A, only B, both, neither where applicable), self-verification (crescent + lens rebuilds each circle), and two matching union counts. The lens sentence (who or what lives in the overlap) completes the deliverable." },
    ],
    scenario: [
      { q: "Real-world scenario 1: a cloud invoice shows a fixed 45 dollars plus 0.50 dollars per gigabyte, totaling 95 dollars. The customer believes they used 80 gigabytes. Recover the actual usage, check it, and draft the two-sentence reply.", a: "45 + 0.5g = 95, so 0.5g = 50 and g = 100 gigabytes. Check: 45 + 0.5 \u00d7 100 = 45 + 50 = 95 \u2713. Reply: the invoice corresponds to 100 gigabytes at 0.50 dollars each plus the fixed 45, which reproduces the 95-dollar total exactly; if your meter shows 80 gigabytes, let us compare the two measurements, since one of them is counting something extra." },
      { q: "Real-world scenario 2: a customer's data volume was 50, 100, and 200 gigabytes over three quarters, and they budget storage linearly for the next two quarters. Diagnose the pattern, give the honest forecast, and state when their 350-gigabyte budget first fails.", a: "The ratios are constant: 100 \u00f7 50 = 2, 200 \u00f7 100 = 2, so the volume doubles quarterly. Honest forecast: 400 and 800 gigabytes. The 350-gigabyte budget fails immediately next quarter, at 400, and the two-quarter shortfall is 450 gigabytes. The diagnosis sentence: three data points hid the doubling, because 50, 100, 200 looks like a steady climb until the ratio test reveals the multiplier." },
    ],
    project: {
      title: "The Closing Project: A Mini Consultation",
      intro: "The final deliverable of this book is a one-page consultation for a small business of your choice (real or invented, such as a bakery, a repair shop, or a market stall). Your consultation must contain four sections. One, a plan comparison: two pricing rules the business could operate under, drawn as lines, with the crossing computed and a recommendation. Two, a capacity answer: a budget or space limit expressed as an inequality, solved and interpreted in whole units. Three, a growth note: the business's key quantity (sales, customers, storage) with its pattern identified as adding or multiplying, and a two-step forecast marked with its honest validity border. Four, a logic rule: one business rule written as a compound condition with AND, OR, or NOT, plus its truth table. Present each section with its check, and end with one paragraph in the owner's language explaining what to do next. This mirrors, in miniature, exactly what a forward deployed engineer is paid to produce: honest models, checked numbers, and advice a non-mathematician can act on.",
    },
  },
  references: [
    "Khan Academy, Algebra basics course (khanacademy.org): free video lessons and practice that follow almost exactly the path of Part I of this book; the balance-scale explanations are excellent companions to Chapter 3.",
    "OpenStax, Elementary Algebra (openstax.org): a free, openly licensed textbook that goes deeper into every Part I and Part II topic, with many more worked examples for extra practice.",
    "Desmos Graphing Calculator (desmos.com): a free browser tool that draws the lines and curves of Part II instantly; type y = 2x + 1 and watch the rate and start appear as a picture.",
    "GeoGebra (geogebra.org): free graphing and geometry tools, ideal for re-plotting the coordinate-plane activities of Chapter 7 and the lines of Chapter 8 with your own numbers.",
    "Brilliant.org, Logic section: a gentle interactive introduction to the statements, truth tables, and counting of Part III, useful for extra drills beyond this book's exercises.",
    "The first book of this series, Everyday Mathematics for Future Engineers (Book MA-1), remains the permanent companion for arithmetic, fractions, percentages, ratios, powers, and units; return to it whenever a foundation creaks.",
  ],
};
