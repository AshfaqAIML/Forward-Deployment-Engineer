"""Generate diagram HTML files for the FDE Academy website design package.

Layout C (Phased Vertical) for journeys and roadmap per charts skill;
layered band diagram for architecture; domain-grouped logical schema for ERD.
"""
import os

OUT = "/home/z/my-project/scripts/fde_design/html"
os.makedirs(OUT, exist_ok=True)

SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  :root {
    --text: #1A2330; --text-sub: #46566B; --text-muted: #68727E;
    --bg: #FFFFFF; --surface: #F8FAFC; --border: #E5E7EB; --connector: #94A3B8;
    --amber: #F59E0B;
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    background: var(--bg); color: var(--text); -webkit-font-smoothing: antialiased; }
  #root { width: fit-content; min-width: %%minwidth%%px; max-width: %%maxwidth%%px; margin: 0 auto; padding: 48px 44px; }
  .flow-title { font-size: 24px; font-weight: 700; color: var(--text); text-align: center; }
  .flow-subtitle { font-size: 14px; color: var(--text-sub); text-align: center; margin-top: 8px; margin-bottom: 36px; }
  .phase-group { background: var(--surface); border-radius: 12px; padding: 20px 24px; }
  .phase-title { font-size: 16px; font-weight: 700; padding: 10px 16px; border-radius: 8px; margin-bottom: 14px; }
  .phase-steps { display: flex; flex-direction: column; gap: 8px; padding-left: 12px; }
  .phase-step { font-size: 14px; font-weight: 400; color: var(--text); padding: 9px 14px; background: white;
    border-radius: 6px; border: 1px solid var(--border); line-height: 1.5; }
  .phase-step b { font-weight: 600; }
  .step-num { display: inline-block; width: 22px; height: 22px; line-height: 22px; text-align: center;
    border-radius: 50%; font-size: 12px; font-weight: 600; margin-right: 10px; }
  .step-note { display: block; font-size: 12.5px; color: #92400E; margin-top: 5px; padding: 4px 10px;
    background: #FFF7ED; border-left: 3px solid #F59E0B; border-radius: 4px; }
  .arrow { text-align: center; color: var(--connector); font-size: 22px; margin: 10px 0; }
  .p1 .phase-title { background: #F0F4F8; color: #334155; border-left: 4px solid #64748B; }
  .p1 .step-num { background: #E2E8F0; color: #475569; }
  .p2 .phase-title { background: #E8EDF2; color: #1E3A5F; border-left: 4px solid #5B7A99; }
  .p2 .step-num { background: #DBEAFE; color: #1E3A5F; }
  .p3 .phase-title { background: #E0E7EF; color: #1E3050; border-left: 4px solid #4A6B8A; }
  .p3 .step-num { background: #D0D9E4; color: #1E3050; }
  .p4 .phase-title { background: #D8E0EA; color: #172540; border-left: 4px solid #3A5C7A; }
  .p4 .step-num { background: #C7D2E0; color: #172540; }
  .p5 .phase-title { background: #DAE1EB; color: #23364D; border-left: 4px solid #4B6A87; }
  .p5 .step-num { background: #C7D2E0; color: #23364D; }
  .p6 .phase-title { background: #D2DAE5; color: #1E3048; border-left: 4px solid #3B5F7D; }
  .p6 .step-num { background: #BFC9D8; color: #1E3048; }
  .p7 .phase-title { background: #CAD3E0; color: #192A3E; border-left: 4px solid #2B5473; }
  .p7 .step-num { background: #B7C2D2; color: #192A3E; }
  .legend { display: flex; gap: 24px; justify-content: center; margin-top: 28px; padding: 12px 20px;
    background: #F9FAFB; border-radius: 8px; border: 1px solid #E5E7EB; font-size: 12.5px; color: #4B5563; }
  .legend .dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 6px;
    vertical-align: -1px; border: 2px solid #F59E0B; background: #FFF7ED; }
  %%extra%%
</style>
</head>
<body>
<div id="root">
  <div class="flow-title">%%title%%</div>
  <div class="flow-subtitle">%%subtitle%%</div>
  %%body%%
  %%legend%%
</div>
</body>
</html>
"""


def render(fname, title, subtitle, body, legend, minwidth, maxwidth, extra):
    html = (SHELL
            .replace("%%title%%", title).replace("%%subtitle%%", subtitle)
            .replace("%%body%%", body).replace("%%legend%%", legend or "")
            .replace("%%minwidth%%", str(minwidth)).replace("%%maxwidth%%", str(maxwidth))
            .replace("%%extra%%", extra or ""))
    with open(os.path.join(OUT, fname), "w") as f:
        f.write(html)
    print("wrote", fname)


DECISION = '<span class="legend"><span><span class="dot"></span>Decision point &mdash; the flow branches as noted</span></span>'


def journey_file(fname, title, subtitle, phases, legend_html=None):
    """phases: list of (title, [step_html,...]) rendered in Layout C."""
    parts = []
    for i, (ptitle, steps) in enumerate(phases, 1):
        step_html = ""
        for j, s in enumerate(steps, 1):
            num = j + sum(len(p[1]) for p in phases[:i - 1])
            if isinstance(s, tuple):
                main, note = s
                step_html += (f'<div class="phase-step"><span class="step-num">{num}</span>{main}'
                              f'<span class="step-note">{note}</span></div>')
            else:
                step_html += f'<div class="phase-step"><span class="step-num">{num}</span>{s}</div>'
        parts.append(f'<div class="phase-group p{i}"><div class="phase-title">{ptitle}</div>'
                     f'<div class="phase-steps">{step_html}</div></div>')
        if i < len(phases):
            parts.append('<div class="arrow">&#8595;</div>')
    render(fname, title, subtitle, "".join(parts), legend_html, 860, 980, "")


# ---------------------------------------------------------------- journeys
journey_file("journey_beginner.html",
    "User Journey A &mdash; From Curious Visitor to First Completed Lesson",
    "The critical first session: a visitor with zero computer-science background reaches a working understanding of FDE and finishes one lesson and one quiz.",
    [
        ("Phase 1 &mdash; Discover (public pages, no account)", [
            "Land on <b>Home</b>; read the plain-language introduction to Forward Deployed Engineering",
            "Scan <b>Who this is for</b> and the featured courses; open one course preview",
            "Open the <b>Learning Roadmap</b> preview and see Stage 1 is Mathematics",
            ("Check the <b>FAQ</b> for \u201cdo I need experience?\u201d",
             "Decision: convinced? Yes &rarr; create a free account. Not yet &rarr; browse the Book Library preview and return."),
        ]),
        ("Phase 2 &mdash; Start (account created)", [
            "Register with email; no placement test &mdash; the academy assumes zero knowledge",
            "The roadmap automatically sets <b>Stage 1 &mdash; Start Here</b>, then Stage 2 Mathematics",
            "Pick a weekly goal (the default: 3 sessions of 30 minutes)",
        ]),
        ("Phase 3 &mdash; First learning loop", [
            "Open the first short lesson (10 minutes, one idea, plain language)",
            "Try one interactive exercise with instant feedback",
            ("Take the 3-question end-of-lesson quiz",
             "Decision: passed? Yes &rarr; lesson marked complete. Not yet &rarr; the quiz explains each answer and offers one retry after a 2-minute review."),
        ]),
        ("Phase 4 &mdash; Habit forms", [
            "Dashboard celebrates the first completion; streak = 1 day",
            "\u201cRecommended next\u201d is queued for tomorrow",
            "Optional: download the companion book chapter for offline reading",
        ]),
    ], DECISION)

journey_file("journey_daily.html",
    "User Journey B &mdash; The Returning Student\u2019s Daily Loop",
    "The habit loop that carries a learner from Stage 3 to Stage 18: every session follows the same five-minute-entry pattern.",
    [
        ("Phase 1 &mdash; Return", [
            "Sign in; the dashboard greets with streak, current stage, and last position",
            "One prominent button: <b>Continue where you left off</b>",
        ]),
        ("Phase 2 &mdash; Review (2 minutes)", [
            "Check yesterday\u2019s quiz result and any teacher feedback on a submission",
            "Skim the glossary terms attached to the current lesson",
        ]),
        ("Phase 3 &mdash; Learn (25 minutes)", [
            "Open the recommended lesson; study one concept",
            "Complete its exercises; if it references a lab, the lab opens pre-configured",
            ("Take the lesson quiz",
             "Decision: passed? Yes &rarr; progress updates and the next lesson unlocks. Failed twice? The dashboard suggests the linked book chapter and books a lighter review quiz for tomorrow."),
        ]),
        ("Phase 4 &mdash; Confirm & close", [
            "Stage progress bar increases; the roadmap marks the lesson done",
            "Tomorrow\u2019s recommendation is queued; streak extends",
            "Session summary email optionally sent (weekly digest preferred)",
        ]),
    ], DECISION)

journey_file("journey_book.html",
    "User Journey C &mdash; Finding and Reading a Textbook",
    "The digital library behaves like a professional technical library: find, evaluate, read, track.",
    [
        ("Phase 1 &mdash; Find", [
            "Open the <b>Book Library</b>; filter by subject (e.g. Mathematics) and difficulty",
            "Or search a topic keyword such as \u201cquadratic\u201d or \u201cbreak-even\u201d",
        ]),
        ("Phase 2 &mdash; Evaluate", [
            "Open a book page: description, difficulty badge, chapter count, learning objectives",
            "Expand the table of contents; see which chapters the current roadmap stage uses",
        ]),
        ("Phase 3 &mdash; Read", [
            "Read in the browser (chapter view with properly rendered mathematics)",
            "Or download the chapter or full book as DOCX or PDF for offline study",
            ("Choose reading mode",
             "Decision: continuing on this device? Browser reading auto-saves position. Printing? PDF download includes the full table of contents."),
        ]),
        ("Phase 4 &mdash; Track", [
            "Mark chapters as read; reading progress appears on the book card and dashboard",
            "The book page links back to the related course lessons and next quiz",
        ]),
    ], DECISION)

journey_file("journey_project.html",
    "User Journey D &mdash; Completing a Guided Project",
    "From the Project Centre to a portfolio entry: the learner builds something a small business could actually use.",
    [
        ("Phase 1 &mdash; Choose", [
            "Open the <b>Project Centre</b>; filter by level (matches roadmap stages)",
            "Open a project brief: business background, customer problem, expected result",
        ]),
        ("Phase 2 &mdash; Prepare", [
            "Check the requirements, tools, and technical-concepts table",
            "Open the linked lessons and labs to close any knowledge gap first",
        ]),
        ("Phase 3 &mdash; Build", [
            "Follow the step-by-step implementation with starter code and datasets",
            "Run the testing instructions; verify outputs against expected results",
            ("Stuck on a step?",
             "Decision: open the project\u2019s Solution Guidance (hints first, solution path after an honest attempt) or ask in the community channel."),
        ]),
        ("Phase 4 &mdash; Submit & review", [
            "Submit screenshots/outputs against the demonstration checklist",
            "Rubric auto-checks the objective items; a mentor reviews craft and communication",
            "On pass: badge awarded, project added to the portfolio, next project unlocked",
        ]),
    ], DECISION)

journey_file("journey_admin.html",
    "User Journey E &mdash; Administrator Improves a Weak Lesson",
    "The admin loop is data-driven: find the gap, fix the content, measure the effect.",
    [
        ("Phase 1 &mdash; Notice", [
            "Open the <b>Admin Dashboard</b>; learning analytics flag a quiz with a 52% pass rate",
            "Drill into the question report: two options confuse most students",
        ]),
        ("Phase 2 &mdash; Author", [
            "Open the lesson in the content editor (rich text, mathematics, code, diagrams)",
            "Rewrite the confusing explanation; split one dense paragraph into two",
            "Reword the two question options; add a worked example",
        ]),
        ("Phase 3 &mdash; Verify & publish", [
            "Preview the lesson exactly as a student sees it (including mobile layout)",
            "Run the accessibility and QA checklist; version the change with a note",
            "Publish; students on the lesson see the new version immediately",
        ]),
        ("Phase 4 &mdash; Measure", [
            "Watch the quiz pass rate over the next cohort (target: 80%+)",
            ("Did it improve?",
             "Decision: yes &rarr; close the change log entry. No &rarr; the analytics point to the prerequisite lesson; repeat the loop there."),
        ]),
    ], DECISION)

# ---------------------------------------------------------------- roadmap
ROADMAP = [
    ("Phase A \u2014 Foundations (mathematics first)", [
        (1, "Start Here & Study Skills", "Orientation \u00b7 no prerequisites"),
        (2, "Mathematical Foundations", "Book: Foundation Mathematics \u00b7 Project P1.1"),
        (3, "Algebra Essentials", "Book: Algebra \u00b7 Topic test"),
        (4, "Logic & Proof", "Book: Logic & Proof \u00b7 Project P1.2"),
        (5, "Graphs & Networks", "Book: Graphs & Networks \u00b7 Topic test"),
        (6, "Problem Solving", "Book: Problem Solving \u00b7 Mock exam A"),
    ]),
    ("Phase B \u2014 Programming", [
        (7, "Programming Foundations I: Python", "Labs: coding basics \u00b7 Project P2.1"),
        (8, "Programming Foundations II: Files & Automation", "Labs: file handling \u00b7 Project P2.2"),
    ]),
    ("Phase C \u2014 Data & Databases", [
        (9, "Data & Databases I: Cleaning", "Dataset: market sales \u00b7 Project P3.1"),
        (10, "Data & Databases II: SQL", "Labs: SQL practice \u00b7 Project P3.2"),
    ]),
    ("Phase D \u2014 Application Development", [
        (11, "Application Development I: APIs", "Labs: API exercises \u00b7 Project P4.1"),
        (12, "Application Development II: Frontends", "Labs: UI basics \u00b7 Project P4.2"),
    ]),
    ("Phase E \u2014 Cloud & Operations", [
        (13, "Cloud & Deployment", "Labs: containers \u00b7 Project P5.1"),
        (14, "Operations & Monitoring", "Labs: ops drills \u00b7 Project P5.2"),
    ]),
    ("Phase F \u2014 AI Engineering", [
        (15, "AI Engineering I: Assistants", "Labs: AI laboratory \u00b7 Project P6.1"),
        (16, "AI Engineering II: Search & Evaluation", "Labs: AI laboratory \u00b7 Project P6.2"),
    ]),
    ("Phase G \u2014 Deployment & Career", [
        (17, "Complete FDE Deployments", "Projects P7.1\u2013P7.3 \u00b7 simulated engagements"),
        (18, "Career Launch", "Career Centre \u00b7 portfolio & interviews"),
    ]),
]

parts = []
for i, (ptitle, stages) in enumerate(ROADMAP, 1):
    rows = ""
    for (num, name, meta) in stages:
        rows += (f'<div class="phase-step"><span class="step-num">{num}</span><b>{name}</b>'
                 f'<span style="display:block;font-size:12.5px;color:#68727E;margin-top:3px;margin-left:32px;">{meta}</span></div>')
    parts.append(f'<div class="phase-group p{i}"><div class="phase-title">{ptitle}</div>'
                 f'<div class="phase-steps">{rows}</div></div>')
    if i < len(ROADMAP):
        parts.append('<div class="arrow">&#8595;</div>')
legend = ('<div class="legend"><span>Every stage lists its prerequisites, recommended lessons, '
          'related books, and linked projects on its detail page</span></div>')
render("roadmap.html",
    "The 18-Stage Learning Roadmap &mdash; Mathematics Is Stage 2, Behind Only Orientation",
    "Seven phases carry a complete beginner from first arithmetic to simulated customer deployments and a career portfolio",
    "".join(parts), legend, 980, 1100, "")

# ---------------------------------------------------------------- architecture
BANDS = [
    ("Client Layer", "What learners and admins touch", [
        ("Student Web App", "Responsive browser app; the whole learning experience"),
        ("Admin Console", "Content, users, analytics \u2014 role-gated"),
        ("Email Digests", "Weekly progress summary; readable as plain text"),
    ]),
    ("Edge & Delivery", "Fast and safe entry points", [
        ("CDN + Caching", "Static assets and downloaded books"),
        ("TLS & WAF", "Encryption in transit; common attacks filtered"),
        ("Rate Limiting", "Protects quizzes, search and the AI assistant"),
    ]),
    ("Application Layer", "One API gateway over modular services", [
        ("Auth & Roles", "Accounts, sessions, student/admin roles"),
        ("Content Service", "Courses, modules, chapters, lessons, glossary"),
        ("Progress Service", "Enrollment, completion, streaks, events"),
        ("Assessment Service", "Quizzes, attempts, grading, reports"),
        ("Projects Service", "Briefs, submissions, rubric checks"),
        ("Search Service", "Courses, books, glossary full-text search"),
        ("Notifications", "In-app and email, digest-first"),
        ("AI Study Assistant", "Optional; grounded on academy content only"),
    ]),
    ("Data Layer", "One source of truth, fast caches", [
        ("PostgreSQL", "Content, progress, attempts, submissions"),
        ("Redis", "Sessions, cache, rate-limit counters"),
        ("Object Storage", "Book DOCX/PDF files, images, media"),
        ("Search Index", "Postgres full-text or Meilisearch"),
    ]),
    ("Platform & Operations", "How it stays healthy", [
        ("CI/CD", "Automated tests and deployment pipeline"),
        ("Observability", "Logs, metrics, traces; alerting on health"),
        ("Backups & DR", "Nightly backups; rehearsed restore"),
        ("Privacy-first Analytics", "Aggregate learning metrics; no tracking ads"),
    ]),
]

rows = []
for i, (name, note, cards) in enumerate(BANDS, 1):
    shade = ["#F0F4F8", "#E8EDF2", "#E0E7EF", "#D8E0EA", "#D2DAE5"][i - 1]
    edge = ["#64748B", "#5B7A99", "#4A6B8A", "#3A5C7A", "#3B5F7D"][i - 1]
    card_html = "".join(
        f'<div class="arc-card"><div class="arc-card-name">{n}</div><div class="arc-card-note">{d}</div></div>'
        for n, d in cards)
    rows.append(
        f'<div class="arc-band" style="background:{shade};">'
        f'<div class="arc-band-label" style="border-left-color:{edge};"><div class="arc-band-name">{name}</div>'
        f'<div class="arc-band-note">{note}</div></div>'
        f'<div class="arc-cards {"arc-cards-wide" if len(cards) > 4 else ""}">{card_html}</div></div>')
    if i < len(BANDS):
        rows.append('<div class="arrow">&#8595;</div>')

cross = ("Security (OWASP, least privilege) &nbsp;\u00b7&nbsp; Accessibility (WCAG 2.1 AA) &nbsp;\u00b7&nbsp; "
         "Performance budgets &nbsp;\u00b7&nbsp; Content versioning &nbsp;\u00b7&nbsp; GDPR-style data care")
render("architecture.html",
    title="FDE Academy &mdash; Technical Architecture",
    subtitle="A modular monolith behind one gateway: simple to operate at launch, clean to split into services later",
    body="".join(rows),
    legend=f'<div class="legend"><span>Cross-cutting concerns (apply to every layer): {cross}</span></div>',
    minwidth=1180, maxwidth=1320,
    extra="""
    .arc-band { border-radius: 12px; padding: 16px 20px; display: flex; gap: 20px; align-items: stretch; }
    .arc-band-label { flex: 0 0 190px; border-left: 4px solid; padding-left: 14px; align-self: center; }
    .arc-band-name { font-size: 16px; font-weight: 700; color: #1E3050; }
    .arc-band-note { font-size: 12px; color: #566270; margin-top: 3px; line-height: 1.4; }
    .arc-cards { flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-content: center; }
    .arc-cards-wide { grid-template-columns: repeat(4, 1fr); }
    .arc-card { background: #FFFFFF; border: 1px solid #D7DFE8; border-radius: 8px; padding: 10px 12px; }
    .arc-card-name { font-size: 13.5px; font-weight: 600; color: #1E3050; }
    .arc-card-note { font-size: 11.5px; color: #68727E; margin-top: 3px; line-height: 1.45; }
    """)

# ---------------------------------------------------------------- ERD
DOMAINS = [
    ("Identity & Progress", "Who the learner is and everything they did", [
        ("users", "id PK \u00b7 email UQ \u00b7 name \u00b7 role (student|admin) \u00b7 created_at"),
        ("progress_events", "id PK \u00b7 user_id FK \u00b7 lesson_id FK \u00b7 status \u00b7 happened_at"),
        ("streaks", "user_id PK/FK \u00b7 current \u00b7 longest \u00b7 last_active_date"),
    ]),
    ("Curriculum", "The ordered teaching content", [
        ("stages", "id PK \u00b7 sort_order UQ \u00b7 title \u00b7 phase \u00b7 requires_stage_id FK"),
        ("courses", "id PK \u00b7 stage_id FK \u00b7 title \u00b7 subject \u00b7 difficulty"),
        ("modules", "id PK \u00b7 course_id FK \u00b7 title \u00b7 sort_order"),
        ("chapters", "id PK \u00b7 module_id FK \u00b7 title \u00b7 sort_order"),
        ("lessons", "id PK \u00b7 chapter_id FK \u00b7 title \u00b7 type \u00b7 content \u00b7 sort_order"),
        ("exercises", "id PK \u00b7 lesson_id FK \u00b7 type \u00b7 payload JSON"),
    ]),
    ("Assessment", "Questions asked and answers given", [
        ("quizzes", "id PK \u00b7 lesson_id FK (optional) \u00b7 title \u00b7 pass_score"),
        ("questions", "id PK \u00b7 quiz_id FK \u00b7 type \u00b7 prompt \u00b7 options JSON \u00b7 answer"),
        ("attempts", "id PK \u00b7 user_id FK \u00b7 quiz_id FK \u00b7 score \u00b7 submitted_at"),
    ]),
    ("Library & Projects", "Books to read, projects to build", [
        ("books", "id PK \u00b7 title \u00b7 subject \u00b7 difficulty \u00b7 file_docx \u00b7 file_pdf \u00b7 chapters"),
        ("book_progress", "user_id FK \u00b7 book_id FK \u00b7 chapters_done \u00b7 last_chapter"),
        ("projects", "id PK \u00b7 stage_id FK \u00b7 level \u00b7 title \u00b7 brief \u00b7 rubric JSON"),
        ("submissions", "id PK \u00b7 user_id FK \u00b7 project_id FK \u00b7 status \u00b7 rubric_score \u00b7 feedback"),
    ]),
    ("Reference", "The shared dictionary", [
        ("glossary_terms", "id PK \u00b7 term UQ \u00b7 simple \u00b7 detailed \u00b7 example \u00b7 category"),
    ]),
]

cards = ""
for name, note, ents in DOMAINS:
    ent_html = "".join(
        f'<div class="ent"><div class="ent-name">{n}</div><div class="ent-fields">{f}</div></div>'
        for n, f in ents)
    cards += (f'<div class="dom"><div class="dom-name">{name}</div>'
              f'<div class="dom-note">{note}</div><div class="ents">{ent_html}</div></div>')

rels = [
    ("stages", "courses", "1 : N", "a stage orders its courses"),
    ("courses \u2192 modules \u2192 chapters \u2192 lessons", "exercises", "1 : N each", "the content tree"),
    ("users", "progress_events / attempts / submissions / book_progress", "1 : N", "all learner activity"),
    ("lessons", "quizzes", "1 : 0..1", "a lesson may carry one quiz"),
    ("quizzes", "questions", "1 : N", "question bank per quiz"),
    ("projects", "submissions", "1 : N", "each submission graded against the rubric"),
    ("stages", "stages (requires_stage_id)", "self FK", "prerequisite chains; Stage 2 (Mathematics) requires only Stage 1"),
]
rel_rows = "".join(f'<tr><td>{a}</td><td>{b}</td><td class="mono">{c}</td><td>{d}</td></tr>'
                   for a, b, c, d in rels)

body = (f'<div class="erd-grid">{cards}</div>'
        f'<div class="rel-title">Key relationships</div>'
        f'<table class="rel"><tr><th>From</th><th>To</th><th>Cardinality</th><th>Meaning</th></tr>{rel_rows}</table>')

render("erd.html",
    "Database Requirements &mdash; Logical Schema by Domain",
    "Seventeen entities in five domains; all learner data resolves to users, all content hangs off the stage ladder",
    body,
    legend='<div class="legend"><span>PK = primary key &nbsp;\u00b7&nbsp; FK = foreign key &nbsp;\u00b7&nbsp; UQ = unique '
           '&nbsp;\u00b7&nbsp; JSON = structured document column</span></div>',
    minwidth=1240, maxwidth=1400,
    extra="""
    .erd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .dom { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 18px; }
    .dom-name { font-size: 15px; font-weight: 700; color: #1E3050; }
    .dom-note { font-size: 12px; color: #68727E; margin: 3px 0 12px; }
    .ents { display: flex; flex-direction: column; gap: 8px; }
    .ent { background: #FFFFFF; border: 1px solid #D7DFE8; border-radius: 8px; padding: 9px 12px; }
    .ent-name { font-size: 13.5px; font-weight: 600; color: #1E40AF; font-family: 'Courier New', monospace; }
    .ent-fields { font-size: 11.5px; color: #46566B; margin-top: 3px; line-height: 1.5;
      font-family: 'Courier New', monospace; word-break: break-word; }
    .rel-title { font-size: 15px; font-weight: 700; color: #1E3050; margin: 26px 0 10px; }
    table.rel { width: 100%; border-collapse: collapse; font-size: 12.5px; }
    table.rel th { text-align: left; background: #D4875A; color: #FFFFFF; padding: 8px 12px; font-weight: 600; }
    table.rel td { background: #FFFFFF; border-bottom: 1px solid #E5E7EB; padding: 7px 12px; color: #2C3440; }
    table.rel td.mono { font-family: 'Courier New', monospace; color: #1E3A5F; }
    """)
