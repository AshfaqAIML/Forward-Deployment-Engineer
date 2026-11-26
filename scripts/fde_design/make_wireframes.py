"""Generate wireframe HTML files for the FDE Academy design package.
Grayscale low-fi per wireframe conventions; amber chips reserved for
numbered annotations, explained in each page's legend block.
"""
import os

OUT = "/home/z/my-project/scripts/fde_design/html"
os.makedirs(OUT, exist_ok=True)

SHELL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>%%TITLE%%</title>
<link rel="stylesheet" href="wireframe.css">
</head>
<body>
<div id="page" class="%%CLS%%">
%%CHROME%%
%%BODY%%
%%FOOTER%%
<div class="legend">
  <div class="ttl">Annotations</div>
  %%LEGEND%%
</div>
</div>
</body>
</html>
"""


def topbar(active, signed_in=True, mobile=False):
    links = ["Home", "Roadmap", "Courses", "Books", "Labs", "Projects", "Assessments",
             "Glossary", "Career"]
    shown = links if not mobile else ["Roadmap", "Courses", "Books"]
    nav = "".join(
        f'<span class="{"active" if l == active else ""}">{l}</span>' for l in shown)
    user = ('<div class="userbox"><span class="searchbox">Search lessons, books, terms\u2026</span>'
            '<div class="avatar"></div><span style="font-size:13.5px;color:#4A5561;">Maya</span></div>'
            if signed_in else
            '<div class="userbox"><span class="btn small ghost">Sign in</span>'
            '<span class="btn small primary">Create free account</span></div>')
    if mobile:
        return (f'<div class="topbar mobile-bar"><span class="burger"><i style="top:5px"></i>'
                f'<i style="top:10px"></i><i style="top:15px"></i></span>'
                f'<span class="logo" style="font-size:14px;padding:6px 10px;">FDE Academy</span>'
                f'<div class="userbox"><div class="avatar"></div></div></div>')
    return (f'<div class="topbar"><span class="logo">FDE Academy'
            f'<small>From Zero Knowledge to Real-World Engineering</small></span>'
            f'<span class="topnav">{nav}</span>{user}</div>')


def footer():
    cols = [("Learn", ["Learning roadmap", "Course library", "Practical labs",
                       "Assessment centre"]),
            ("Library", ["Book library", "Glossary", "Downloads (DOCX / PDF)"]),
            ("Community", ["Project centre", "Career centre", "FAQ & about"]),
            ("Account", ["Dashboard", "My progress", "Sign out"])]
    inner = "".join(f'<div class="col"><b>{t}</b>' +
                    "".join(f"<div>{l}</div>" for l in items) + "</div>"
                    for t, items in cols)
    return f'<div class="footer">{inner}</div>'


def page(fname, title, active, body, legend, signed_in=True, mobile=False):
    chrome = topbar(active, signed_in, mobile)
    foot = "" if mobile else footer()
    cls = "mobile" if mobile else ""
    html = (SHELL.replace("%%TITLE%%", title).replace("%%CLS%%", cls)
            .replace("%%CHROME%%", chrome).replace("%%BODY%%", body)
            .replace("%%FOOTER%%", foot).replace("%%LEGEND%%", legend))
    with open(os.path.join(OUT, fname), "w") as f:
        f.write(html)
    print("wrote", fname)


# ------------------------------------------------------------------ HOME
home_body = f"""
<div class="section" style="background:#3A4552;color:#E9EDF2;padding:64px 40px 58px;">
  <div style="max-width:820px;">
    <span class="chip" style="background:#4A5561;border-color:#6B7683;color:#E9EDF2;">For absolute beginners \u2014 no computer science background needed</span>
    <h1 style="font-size:40px;font-weight:800;margin:18px 0 14px;color:#FFFFFF;">FDE Academy</h1>
    <p style="font-size:18px;color:#D6DBE1;max-width:640px;line-height:1.6;">From Zero Knowledge to Real-World Engineering. An 18-stage guided path from first arithmetic to deployed, customer-facing engineering projects.</p>
    <div class="btnrow" style="margin-top:26px;">
      <span class="btn primary" style="background:#FFFFFF;color:#1F2933;border-color:#FFFFFF;">Start learning free <span class="ann">1</span></span>
      <span class="btn" style="background:transparent;color:#E9EDF2;border-color:#8B95A1;">Explore the 18-stage roadmap</span>
    </div>
    <p style="font-size:12.5px;color:#9AA3AD;margin-top:16px;">No credit card \u00b7 No placement test \u00b7 Mathematics first, taught from zero</p>
  </div>
</div>

<div class="section">
  <div class="h-sec">What is a Forward Deployed Engineer? <span class="ann">2</span></div>
  <div class="sub-sec">An engineer who works directly with customers: understands their business, models their problems, writes the code and data that solve them, and explains everything in plain language. The academy teaches exactly this \u2014 starting from zero.</div>
  <div class="grid cols-3">
    <div class="card"><h4>Listen &amp; model</h4><p>Turn a customer\u2019s story into requirements, numbers and rules \u2014 before any code.</p></div>
    <div class="card"><h4>Build &amp; ship</h4><p>Small programs, clean data, working APIs, deployed services \u2014 real deliverables at every stage.</p></div>
    <div class="card"><h4>Explain &amp; hand over</h4><p>Documentation, demonstrations and honest limitations \u2014 the skills employers actually test.</p></div>
  </div>
</div>

<div class="section">
  <div class="h-sec">Who the platform is for <span class="ann">3</span></div>
  <div class="grid cols-4">
    <div class="card"><div class="ph img"></div><h4>Career switchers</h4><p>Coming from retail, logistics, support or admin \u2014 start from zero, build a portfolio.</p></div>
    <div class="card"><div class="ph img"></div><h4>Students</h4><p>Complement theory with projects a customer would recognise as real work.</p></div>
    <div class="card"><div class="ph img"></div><h4>Support &amp; ops professionals</h4><p>Already understand customers; add the engineering half deliberately.</p></div>
    <div class="card"><div class="ph img"></div><h4>Curious beginners</h4><p>Want to understand how software serves a business, in plain language.</p></div>
  </div>
</div>

<div class="section">
  <div class="h-sec">Your beginner learning roadmap <span class="ann">4</span></div>
  <div class="sub-sec">Eighteen stages, each with prerequisites, lessons, books, projects and checkpoints. Mathematics is the first learning stage \u2014 everything after builds on it.</div>
  <div class="row spread" style="margin-bottom:14px;">
    <span class="chip on">Stage 1 \u00b7 Start Here</span><span class="chip on">Stage 2 \u00b7 Mathematical Foundations</span>
    <span class="chip">Stage 3 \u00b7 Algebra</span><span class="chip">Stage 4 \u00b7 Logic</span>
    <span class="chip">Stage 7 \u00b7 Python I</span><span class="chip">Stage 10 \u00b7 SQL</span>
    <span class="chip">Stage 13 \u00b7 Cloud</span><span class="chip">Stage 16 \u00b7 AI II</span>
    <span class="chip">Stage 18 \u00b7 Career Launch</span>
    <span style="font-size:12.5px;color:#5A6572;">+ 9 more \u2014 see full roadmap</span>
  </div>
</div>

<div class="section">
  <div class="h-sec">Featured courses <span class="ann">5</span></div>
  <div class="grid cols-3">
    <div class="card"><div class="ph img"></div><h4>Foundation Mathematics</h4><p>Beginner \u00b7 5 modules \u00b7 arithmetic to percentages, in business contexts.</p><div class="meta"><span class="chip">Beginner</span><span class="chip">Mathematics</span></div></div>
    <div class="card"><div class="ph img"></div><h4>Programming Foundations I</h4><p>Beginner \u00b7 first Python programs, calculators, tiny automations.</p><div class="meta"><span class="chip">Beginner</span><span class="chip">Programming</span></div></div>
    <div class="card"><div class="ph img"></div><h4>AI Engineering I: Assistants</h4><p>Advanced \u00b7 retrieval, grounded answers, evaluation sets.</p><div class="meta"><span class="chip">Advanced</span><span class="chip">AI</span></div></div>
  </div>
</div>

<div class="section">
  <div class="h-sec">The book collection <span class="ann">6</span></div>
  <div class="sub-sec">Six textbooks written for this programme \u2014 readable online, downloadable as DOCX and PDF, progress tracked per chapter.</div>
  <div class="grid cols-6" style="grid-template-columns:repeat(6,1fr);">
    <div class="card" style="padding:12px;"><div class="ph cover" style="height:96px;"></div><p style="font-size:12px;"><b>Foundation Mathematics</b></p></div>
    <div class="card" style="padding:12px;"><div class="ph cover" style="height:96px;"></div><p style="font-size:12px;"><b>Algebra</b></p></div>
    <div class="card" style="padding:12px;"><div class="ph cover" style="height:96px;"></div><p style="font-size:12px;"><b>Logic &amp; Proof</b></p></div>
    <div class="card" style="padding:12px;"><div class="ph cover" style="height:96px;"></div><p style="font-size:12px;"><b>Graphs &amp; Networks</b></p></div>
    <div class="card" style="padding:12px;"><div class="ph cover" style="height:96px;"></div><p style="font-size:12px;"><b>Problem Solving</b></p></div>
    <div class="card" style="padding:12px;"><div class="ph cover" style="height:96px;"></div><p style="font-size:12px;"><b>Project Handbook</b></p></div>
  </div>
</div>

<div class="section">
  <div class="h-sec">Practical project demonstrations <span class="ann">7</span></div>
  <div class="grid cols-3">
    <div class="card"><div class="ph img"></div><h4>A cleaning script that saves a bakery\u2019s data</h4><p>Project 3.1 \u2014 from dirty spreadsheet to audited, trustworthy dataset.</p><div class="meta"><span class="chip">Level 3</span></div></div>
    <div class="card"><div class="ph img"></div><h4>An assistant that answers only from the FAQ</h4><p>Project 6.1 \u2014 retrieval + grounded AI, with a human handover fallback.</p><div class="meta"><span class="chip">Level 6</span></div></div>
    <div class="card"><div class="ph img"></div><h4>A support assistant for a real retailer</h4><p>Project 7.1 \u2014 simulated customer engagement with changing requirements.</p><div class="meta"><span class="chip">Level 7</span></div></div>
  </div>
</div>

<div class="section">
  <div class="h-sec">Why learners stay <span class="ann">8</span></div>
  <div class="grid cols-4">
    <div class="kpi"><div class="v">Zero \u2192 Pro</div><div class="l">No prerequisites; every term explained simply</div></div>
    <div class="kpi"><div class="v">18 stages</div><div class="l">A clear path; always know what is next</div></div>
    <div class="kpi"><div class="v">15 projects</div><div class="l">Portfolio-grade work with rubrics</div></div>
    <div class="kpi"><div class="v">Honest</div><div class="l">Demos are never called production-ready</div></div>
  </div>
</div>

<div class="section">
  <div class="h-sec">Frequently asked questions <span class="ann">9</span></div>
  <div class="accordion"><div class="q">Do I need any computer science background? <span>\u2303</span></div><div class="a">No. The programme starts from everyday arithmetic and plain language. Every technical term is explained simply, and the glossary is one click away.</div></div>
  <div class="accordion"><div class="q">How much time per week? <span>\u2303</span></div><div class="a">The default plan is three 30-minute sessions per week; the dashboard adapts recommendations to your actual pace.</div></div>
  <div class="accordion"><div class="q">What will I be able to build? <span>\u2303</span></div><div class="a">By Stage 17 you will have deployed small applications, built an AI assistant grounded in a real FAQ, and completed simulated customer engagements with handover documentation.</div></div>
  <div class="accordion"><div class="q">Are the books and downloads free? <span>\u2303</span></div><div class="a">Every textbook and handbook is readable online and downloadable as DOCX or PDF at no cost.</div></div>
</div>
"""

page("wf_home.html", "Home",
     "Home", home_body,
     "<b>1</b> Primary call to action &mdash; one promise, one button. &nbsp;"
     "<b>2</b> Plain-language FDE introduction; no jargon without a link to the glossary. &nbsp;"
     "<b>3</b> Audience cards answer \u201cis this for me?\u201d in the visitor\u2019s own words. &nbsp;"
     "<b>4</b> Roadmap preview shows stage chips; mathematics appears as the first learning stage. &nbsp;"
     "<b>5</b> Featured courses with subject and difficulty chips. &nbsp;"
     "<b>6</b> Book shelf mirrors the six real academy textbooks. &nbsp;"
     "<b>7</b> Real project demonstrations, linked to Project Centre pages. &nbsp;"
     "<b>8</b> Benefits as concrete numbers, not slogans. &nbsp;"
     "<b>9</b> FAQ accordion answers beginner anxieties first.")

# ------------------------------------------------------------------ ROADMAP
stages = [
    (1, "Start Here & Study Skills", "Orientation \u00b7 no prerequisites", "done"),
    (2, "Mathematical Foundations", "Book: Foundation Mathematics \u00b7 Project P1.1", "done"),
    (3, "Algebra Essentials", "Book: Algebra \u00b7 Topic test", "done"),
    (4, "Logic & Proof", "Book: Logic & Proof \u00b7 Project P1.2", "done"),
    (5, "Graphs & Networks", "Book: Graphs & Networks \u00b7 Topic test", "current"),
    (6, "Problem Solving", "Book: Problem Solving \u00b7 Mock exam A", "upcoming"),
    (7, "Programming Foundations I: Python", "Labs \u00b7 Project P2.1", "upcoming"),
    (8, "Programming Foundations II: Files & Automation", "Labs \u00b7 Project P2.2", "upcoming"),
    (9, "Data & Databases I: Cleaning", "Dataset \u00b7 Project P3.1", "upcoming"),
    (10, "Data & Databases II: SQL", "Labs \u00b7 Project P3.2", "upcoming"),
    (11, "Application Development I: APIs", "Labs \u00b7 Project P4.1", "upcoming"),
    (12, "Application Development II: Frontends", "Labs \u00b7 Project P4.2", "upcoming"),
    (13, "Cloud & Deployment", "Labs \u00b7 Project P5.1", "upcoming"),
    (14, "Operations & Monitoring", "Labs \u00b7 Project P5.2", "upcoming"),
    (15, "AI Engineering I: Assistants", "AI lab \u00b7 Project P6.1", "upcoming"),
    (16, "AI Engineering II: Search & Evaluation", "AI lab \u00b7 Project P6.2", "upcoming"),
    (17, "Complete FDE Deployments", "Projects P7.1\u2013P7.3 \u00b7 simulations", "upcoming"),
    (18, "Career Launch", "Career Centre \u00b7 portfolio & interviews", "upcoming"),
]
state_chip = {"done": "Completed", "current": "Current", "upcoming": "Upcoming"}
rows = ""
for n, name, meta, st in stages:
    cls = {"done": "done", "current": "current", "upcoming": "locked"}[st]
    rows += (f'<div class="stage {cls}"><div class="num">{n}</div>'
             f'<div class="st-body"><div class="st-name">{name}</div>'
             f'<div class="st-meta">{meta}</div></div>'
             f'<span class="state-chip">{state_chip[st]}</span>'
             f'{"<span class=ann>3</span>" if n == 5 else ""}</div>')

roadmap_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="row spread">
    <div>
      <div class="h-sec">Your learning roadmap <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:8px;">Maya \u00b7 Stage 5 of 18 \u00b7 27% of the programme complete. Mathematics came first; programming follows the foundations.</div>
    </div>
    <div class="kpi" style="min-width:170px;"><div class="v">5 / 18</div><div class="l">stages completed or in progress</div></div>
  </div>
</div>
<div class="section">
  <div class="split-r">
    <div>
      <div class="h-sec" style="font-size:16px;">All 18 stages <span class="ann">2</span></div>
      {rows}
    </div>
    <div>
      <div class="side" style="margin-bottom:18px;">
        <h4>Stage 5 \u00b7 Graphs &amp; Networks <span class="ann">4</span></h4>
        <p style="font-size:13px;color:#4A5561;line-height:1.6;">Prerequisites: Stage 3 Algebra, Stage 4 Logic. Recommended next: lessons 5.1\u20135.4 (shortest paths).</p>
        <div class="meta">Progress <span class="bar" style="margin-top:6px;"><i style="width:40%"></i></span></div>
      </div>
      <div class="side" style="margin-bottom:18px;">
        <h4>Related books <span class="ann">5</span></h4>
        <div class="row" style="margin-bottom:10px;"><div class="ph" style="width:44px;height:58px;"></div><div style="font-size:12.5px;"><b>Graphs &amp; Networks</b><br>8 chapters \u00b7 2 read</div></div>
        <div class="row"><div class="ph" style="width:44px;height:58px;"></div><div style="font-size:12.5px;"><b>Problem Solving</b><br>preview \u00b7 next stage</div></div>
      </div>
      <div class="side">
        <h4>Linked projects <span class="ann">6</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">P1.1 Market-Stall Budget (done) \u00b7 P1.2 Delivery-Route Logic Pack (unlocks with Stage 4 \u2713)</p>
        <span class="btn small primary" style="margin-top:10px;">Open recommended lesson</span>
      </div>
    </div>
  </div>
</div>
"""

page("wf_roadmap.html", "Roadmap", "Roadmap", roadmap_body,
     "<b>1</b> Progress header answers \u201cwhere am I?\u201d in one glance. &nbsp;"
     "<b>2</b> The full 18-stage rail: completed stages filled, current stage ringed, upcoming stages dimmed. &nbsp;"
     "<b>3</b> Each stage row states state, prerequisites, books and projects at all times. &nbsp;"
     "<b>4</b> Stage detail panel: prerequisites, recommended lessons, progress. &nbsp;"
     "<b>5</b> Related books link straight into the library. &nbsp;"
     "<b>6</b> Linked projects bridge to the Project Centre; the primary button is the recommended next action.")

# ------------------------------------------------------------------ COURSES
course_cards = ""
for t, d, subj, diff, prog in [
    ("Foundation Mathematics", "Numbers, ratios and percentages in business contexts.", "Mathematics", "Beginner", 100),
    ("Algebra Essentials", "From expressions to quadratics, with word problems.", "Mathematics", "Beginner", 100),
    ("Logic & Proof", "Statements, truth tables, proof techniques.", "Mathematics", "Intermediate", 78),
    ("Graphs & Networks", "Shortest paths, flows, networks in operations.", "Mathematics", "Intermediate", 40),
    ("Programming Foundations I", "First Python programs and calculators.", "Programming", "Beginner", 0),
    ("AI Engineering I: Assistants", "Retrieval, grounding and evaluation.", "AI", "Advanced", 0),
]:
    course_cards += (f'<div class="card"><div class="ph img"></div><h4>{t}</h4><p>{d}</p>'
                     f'<div class="meta"><span class="chip">{subj}</span><span class="chip">{diff}</span></div>'
                     f'<div class="meta">Completed {prog}% <span class="bar" style="margin-top:5px;"><i style="width:{prog}%"></i></span></div></div>')

courses_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="h-sec">Course library <span class="ann">1</span></div>
  <div class="sub-sec">Every course, organised by subject and difficulty. Each course page shows objectives, prerequisites, modules, chapters, lessons, exercises, quizzes and projects.</div>
</div>
<div class="section">
  <div class="split">
    <div class="side">
      <h4>Filters <span class="ann">2</span></h4>
      <div class="filter"><div class="lbl">Subject</div>
        <span class="chip on">All</span><span class="chip">Mathematics</span><span class="chip">Programming</span><span class="chip">Data</span><span class="chip">Cloud</span><span class="chip">AI</span></div>
      <div class="filter"><div class="lbl">Difficulty</div>
        <span class="chip on">All levels</span><span class="chip">Beginner</span><span class="chip">Intermediate</span><span class="chip">Advanced</span></div>
      <div class="filter"><div class="lbl">Roadmap stage</div>
        <span class="chip">Stage 2\u20136</span><span class="chip">Stage 7\u20138</span><span class="chip">Stage 9\u201314</span><span class="chip">Stage 15\u201318</span></div>
    </div>
    <div>
      <div class="tabs"><span class="tab on">All courses</span><span class="tab">In progress</span><span class="tab">Completed</span></div>
      <div class="grid cols-3">{course_cards}</div>
    </div>
  </div>
</div>
"""

page("wf_courses.html", "Courses", "Courses", courses_body,
     "<b>1</b> Library header states the organisation principle. &nbsp;"
     "<b>2</b> Filters by subject, difficulty and roadmap stage \u2014 plain words, no codes. &nbsp;"
     "<b>3</b> Status tabs reuse everyday language. Cards show completion bars and subject/difficulty chips.")

# ------------------------------------------------------------------ COURSE DETAIL
chapters = ""
for ch, ls in [("1. Numbers and operations", ["1.1 The four operations in business", "1.2 Percentages and discounts", "1.3 Unit price and best buy"]),
               ("2. Ratios and proportions", ["2.1 Recipes and scaling", "2.2 Exchange and currency", "2.2 Quiz (3 questions)"])]:
    rows_ = "".join(f'<div class="qrow"><span class="tick {"done" if "1.1" in l else ""}"></span>{l}<span style="margin-left:auto;font-size:11.5px;color:#68727E;">{"done \u00b7 quiz passed" if "1.1" in l else "12 min \u00b7 4 exercises"}</span></div>' for l in ls)
    chapters += f'<div class="card" style="margin-bottom:14px;"><h4>{ch}</h4>{rows_}</div>'

course_detail_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="row spread">
    <div style="max-width:900px;">
      <div class="h-sec">Foundation Mathematics <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:10px;">The first mathematics course: arithmetic, ratios and percentages taught through market-stall, delivery and budget stories. No prior knowledge assumed.</div>
      <span class="chip on">Beginner</span><span class="chip">Mathematics</span><span class="chip">Stage 2</span><span class="chip">5 modules \u00b7 11 chapters \u00b7 24 lessons</span>
    </div>
    <div class="side" style="min-width:280px;">
      <h4>Course progress <span class="ann">2</span></h4>
      <div class="bar"><i style="width:100%"></i></div>
      <div class="meta">24 of 24 lessons \u00b7 quizzes 92% average \u00b7 completed</div>
    </div>
  </div>
</div>
<div class="section">
  <div class="split-r">
    <div>
      <div class="card" style="margin-bottom:16px;">
        <h4>Learning objectives <span class="ann">3</span></h4>
        <p>\u2022 Compute confidently with whole numbers, fractions and percentages<br>
           \u2022 Model cost, revenue and break-even for a small business<br>
           \u2022 Read and build simple tables and charts<br>
           \u2022 Prepare for the algebra course with verified checkpoints</p>
      </div>
      <div class="card" style="margin-bottom:16px;">
        <h4>Prerequisites <span class="ann">4</span></h4>
        <p>Stage 1 (Start Here) only \u2014 this course assumes zero mathematics confidence and rebuilds it from the ground up.</p>
      </div>
      <div class="h-sec" style="font-size:16px;">Modules and chapters <span class="ann">5</span></div>
      {chapters}
    </div>
    <div>
      <div class="side" style="margin-bottom:16px;">
        <h4>Related book <span class="ann">6</span></h4>
        <div class="row"><div class="ph" style="width:52px;height:70px;"></div><div style="font-size:12.5px;"><b>Foundation Mathematics</b><br>DOCX \u00b7 PDF \u00b7 online</div></div>
        <span class="btn small" style="margin-top:10px;">Open book page</span>
      </div>
      <div class="side" style="margin-bottom:16px;">
        <h4>Course project <span class="ann">7</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">P1.1 The Market-Stall Budget \u2014 build Amara\u2019s break-even spreadsheet.</p>
        <span class="btn small primary" style="margin-top:10px;">Open in Project Centre</span>
      </div>
      <div class="side">
        <h4>Practical exercises <span class="ann">8</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Interactive drills in the Maths Lab update as lessons complete.</p>
      </div>
    </div>
  </div>
</div>
"""

page("wf_course_detail.html", "Course detail", "Courses", course_detail_body,
     "<b>1</b> Title block carries audience, chips and scale of the course. &nbsp;"
     "<b>2</b> Progress rail always visible. &nbsp;"
     "<b>3</b> Objectives in learner language. &nbsp;"
     "<b>4</b> Prerequisites stated honestly (here: none). &nbsp;"
     "<b>5</b> Module \u2192 chapter \u2192 lesson tree with completion ticks and per-lesson metadata. &nbsp;"
     "<b>6\u20138</b> Right rail connects the course to its book, project and labs.")

# ------------------------------------------------------------------ BOOKS
book_cards = ""
for t, s, d, ch, prog in [("Foundation Mathematics", "Mathematics", "Beginner", 8, 100),
                          ("Algebra: From Expressions to Quadratics", "Mathematics", "Beginner", 9, 100),
                          ("Logic & Proof", "Mathematics", "Intermediate", 8, 64),
                          ("Graphs & Networks", "Mathematics", "Intermediate", 8, 25),
                          ("Problem Solving", "Mathematics", "Intermediate", 9, 0),
                          ("FDE Project Handbook", "Projects", "All levels", 11, 30)]:
    book_cards += (f'<div class="card"><div class="row"><div class="ph" style="width:64px;height:88px;"></div>'
                   f'<div><h4 style="font-size:13.5px;">{t}</h4><p>{s} \u00b7 {d}</p><p>{ch} chapters</p></div></div>'
                   f'<div class="meta">Reading progress {prog}% <span class="bar" style="margin-top:5px;"><i style="width:{prog}%"></i></span></div>'
                   f'<div class="meta"><span class="btn small">Read online</span> <span class="btn small">DOCX</span> <span class="btn small">PDF</span></div></div>')

books_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="h-sec">Digital book library <span class="ann">1</span></div>
  <div class="sub-sec">The academy\u2019s technical library: searchable textbooks with covers, difficulty, tables of contents and reading progress. Download every book as DOCX or PDF.</div>
  <div class="row" style="margin-top:6px;"><span class="searchbox" style="flex:1;max-width:520px;">Search by subject, topic or title \u2014 try \u201cquadratic\u201d</span><span class="btn primary">Search</span></div>
</div>
<div class="section">
  <div class="split">
    <div class="side">
      <h4>Refine <span class="ann">2</span></h4>
      <div class="filter"><div class="lbl">Subject</div><span class="chip on">All</span><span class="chip">Mathematics</span><span class="chip">Projects</span></div>
      <div class="filter"><div class="lbl">Topic</div><span class="chip">Arithmetic</span><span class="chip">Logic</span><span class="chip">Graphs</span><span class="chip">Deployment</span></div>
      <div class="filter"><div class="lbl">Difficulty</div><span class="chip on">All</span><span class="chip">Beginner</span><span class="chip">Intermediate</span><span class="chip">Advanced</span></div>
    </div>
    <div><div class="grid cols-3">{book_cards}</div></div>
  </div>
</div>
"""

page("wf_books.html", "Books", "Books", books_body,
     "<b>1</b> Search first: one box that accepts subject, topic or title words. &nbsp;"
     "<b>2</b> Refinement filters mirror the course library. Cards carry cover, difficulty, chapter count, progress and the three access modes (online / DOCX / PDF).")

# ------------------------------------------------------------------ BOOK DETAIL
toc_rows = "".join(f'<div class="qrow"><span class="tick {"done" if i < 3 else ""}"></span>Chapter {i+1} \u00b7 {t}</div>'
                   for i, t in enumerate(["The four operations", "Fractions and decimals", "Percentages in business",
                                          "Ratios and proportions", "Unit price and best buy", "Simple interest",
                                          "Reading tables", "Building charts"]))
book_detail_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="split-r">
    <div>
      <div class="h-sec">Foundation Mathematics <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:10px;">The complete beginner\u2019s mathematics textbook: eight chapters from the four operations to reading tables, every concept introduced through a small-business story.</div>
      <span class="chip on">Beginner</span><span class="chip">Mathematics</span><span class="chip">8 chapters \u00b7 61 pages</span>
    </div>
    <div class="side">
      <div class="row"><div class="ph" style="width:96px;height:130px;"></div>
        <div style="font-size:12.5px;"><b>Edition</b><br>Version 1.0<br>Updated 24 Nov 2026<br>DOCX \u00b7 PDF \u00b7 online</div></div>
      <div class="btnrow" style="margin-top:12px;"><span class="btn small primary">Continue reading \u2014 Ch. 4</span><span class="btn small">Download PDF</span></div>
    </div>
  </div>
</div>
<div class="section">
  <div class="split-r">
    <div>
      <div class="card" style="margin-bottom:16px;"><h4>Learning objectives <span class="ann">2</span></h4>
        <p>\u2022 Operate confidently with numbers, fractions and percentages<br>\u2022 Apply ratio reasoning to prices, recipes and exchange<br>\u2022 Read and construct tables and simple charts</p></div>
      <div class="h-sec" style="font-size:16px;">Table of contents <span class="ann">3</span></div>
      {toc_rows}
    </div>
    <div>
      <div class="side" style="margin-bottom:16px;"><h4>Your reading progress <span class="ann">4</span></h4>
        <div class="bar"><i style="width:38%"></i></div><div class="meta">3 of 8 chapters marked read \u00b7 last read Tuesday</div></div>
      <div class="side"><h4>Used in stages <span class="ann">5</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Stage 2 Mathematical Foundations (primary) \u00b7 Stage 3 Algebra (prerequisite chapters 1\u20133)</p></div>
    </div>
  </div>
</div>
"""

page("wf_book_detail.html", "Book detail", "Books", book_detail_body,
     "<b>1</b> Book header: description, difficulty, chapter count, edition, access modes. &nbsp;"
     "<b>2</b> Objectives before commitment. &nbsp;"
     "<b>3</b> Full TOC with per-chapter read ticks; the continue button resumes mid-book. &nbsp;"
     "<b>4</b> Reading progress persists across devices. &nbsp;"
     "<b>5</b> The book is cross-linked to the roadmap stages that use it.")

# ------------------------------------------------------------------ LAB
lab_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="row spread">
    <div><div class="h-sec">Practical lab \u00b7 Maths Lab \u2014 Break-even drill <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:0;">Linked to lesson 2.4 (Foundation Mathematics). Compute break-even quantities; the lab checks each answer instantly and explains mistakes.</div></div>
    <span class="chip on">Beginner</span>
  </div>
</div>
<div class="section">
  <div class="split-r">
    <div>
      <div class="card" style="margin-bottom:14px;"><h4>Task <span class="ann">2</span></h4>
        <p style="font-size:13.5px;line-height:1.6;">Amara\u2019s stall fee is 20.00, price per item 4.00, ingredient cost 1.50. Compute the break-even quantity in whole items.</p></div>
      <div class="card"><h4>Your answer <span class="ann">3</span></h4>
        <div class="row" style="margin-top:10px;"><span class="searchbox" style="width:160px;">11</span><span class="btn primary small">Check answer</span>
          <span style="font-size:12.5px;color:#4A5561;">Instant feedback: not yet \u2014 remember to round UP to whole items.</span></div></div>
      <div class="card" style="margin-top:14px;"><h4>Working space <span class="ann">4</span></h4>
        <div class="ph" style="height:110px;"></div></div>
    </div>
    <div>
      <div class="side" style="margin-bottom:14px;"><h4>Checks <span class="ann">5</span></h4>
        <div class="qrow"><span class="tick done"></span>Attempt 1 \u2014 formula recalled</div>
        <div class="qrow"><span class="tick"></span>Attempt 2 \u2014 rounding rule</div>
        <div class="qrow"><span class="tick"></span>Attempt 3 \u2014 interpretation</div></div>
      <div class="side"><h4>Help nearby <span class="ann">6</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Glossary: <b>break-even</b>, <b>contribution margin</b> \u00b7 Book chapter 5 \u00b7 Hint (unlocks after two attempts)</p></div>
    </div>
  </div>
</div>
"""

page("wf_lab.html", "Lab", "Labs", lab_body,
     "<b>1</b> Labs open pre-linked to the lesson that needs them. &nbsp;"
     "<b>2</b> Task stated in one sentence with a concrete story. &nbsp;"
     "<b>3</b> Answer box with instant, explanatory feedback (never just \u201cwrong\u201d). &nbsp;"
     "<b>4</b> Free working space (canvas or code) depending on lab type. &nbsp;"
     "<b>5</b> Check list makes progress visible attempt by attempt. &nbsp;"
     "<b>6</b> Help: glossary terms, book chapter, and a hint gated behind honest attempts.")

# ------------------------------------------------------------------ PROJECT
project_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="row spread">
    <div style="max-width:920px;"><div class="h-sec">Project 3.1 \u2014 Clean the Market Dataset <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:8px;">Guided project \u00b7 Level 3 (Stage 9) \u00b7 Business: Bella\u2019s bakery group sends a dirty 144-row sales export that must become a trustworthy dataset.</div>
      <span class="chip on">Level 3</span><span class="chip">Data</span><span class="chip">Python \u00b7 standard library</span><span class="chip">Estimated 6 hours</span></div>
    <div class="side" style="min-width:250px;"><h4>Status <span class="ann">2</span></h4>
      <div class="bar"><i style="width:60%"></i></div><div class="meta">Steps 6 of 10 complete \u00b7 submitted for review</div></div>
  </div>
</div>
<div class="section">
  <div class="split-r">
    <div>
      <div class="tabs"><span class="tab on">Brief &amp; steps</span><span class="tab">Resources</span><span class="tab">Rubric</span><span class="tab">Submission</span></div>
      <div class="card" style="margin-bottom:14px;"><h4>Business background &amp; the customer\u2019s problem <span class="ann">3</span></h4>
        <p style="font-size:13px;line-height:1.6;">Reports over dirty data disagree, and nobody can say why. Agreed rules, an audit log and a conservation check are required before anyone trusts the numbers.</p></div>
      <div class="card" style="margin-bottom:14px;"><h4>Implementation steps <span class="ann">4</span></h4>
        <div class="qrow"><span class="tick done"></span>1. Agree the five cleaning rules in writing</div>
        <div class="qrow"><span class="tick done"></span>2. Inspect the raw file and predict each rule\u2019s drop count</div>
        <div class="qrow"><span class="tick done"></span>3. Implement the date and units gates</div>
        <div class="qrow"><span class="tick done"></span>4. Normalize categories and deduplicate</div>
        <div class="qrow"><span class="tick"></span>5. Prove unit conservation independently</div>
        <div class="qrow"><span class="tick"></span>6\u201310. Audit line, idempotence, documentation\u2026</div></div>
      <div class="card"><h4>Demonstration checklist <span class="ann">5</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Six checkbox items from the handbook \u2014 submission requires every box ticked with evidence.</p></div>
    </div>
    <div>
      <div class="side" style="margin-bottom:14px;"><h4>Starter resources <span class="ann">6</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">sales_data_raw.csv \u00b7 starter clean_sales.py \u00b7 rules page template \u00b7 Solution Guidance (hints first)</p></div>
      <div class="side" style="margin-bottom:14px;"><h4>Rubric preview <span class="ann">7</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Understanding \u00b7 Correctness \u00b7 Craft \u00b7 Safety \u00b7 Operation \u00b7 Communication \u2014 pass at 16/24, no dimension below 2.</p></div>
      <div class="side"><h4>Concepts you need <span class="ann">8</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">CSV \u00b7 normalization \u00b7 audit log \u00b7 idempotence \u2014 each links to its glossary entry.</p></div>
    </div>
  </div>
</div>
"""

page("wf_project.html", "Project", "Projects", project_body,
     "<b>1</b> Project header: level, stage link, business story, honest time estimate. &nbsp;"
     "<b>2</b> Status rail tracks steps and submission state. &nbsp;"
     "<b>3</b> Brief tabs mirror the handbook structure. &nbsp;"
     "<b>4</b> Steps tick as the learner works; the checklist gates submission. &nbsp;"
     "<b>6\u20138</b> Starter files, rubric preview and concept list with glossary links.")

# ------------------------------------------------------------------ ASSESSMENT
assessment_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="h-sec">Assessment centre <span class="ann">1</span></div>
  <div class="sub-sec">Quizzes after every lesson, topic tests per course, subject tests per stage, one mock exam per phase \u2014 and a progress report that reads like a transcript.</div>
  <div class="tabs"><span class="tab on">Upcoming</span><span class="tab">Results</span><span class="tab">Mock exams</span><span class="tab">Progress report</span></div>
</div>
<div class="section">
  <div class="split-r">
    <div>
      <div class="card" style="margin-bottom:16px;">
        <h4>Topic test \u2014 Graphs &amp; Networks (Stage 5) <span class="ann">2</span></h4>
        <p style="font-size:12.5px;color:#5A6572;margin-bottom:12px;">12 questions \u00b7 30 minutes \u00b7 pass at 70% \u00b7 two attempts</p>
        <div class="qrow" style="background:#F7F8FA;">Question 4 of 12 \u00b7 Single choice <span style="margin-left:auto;font-size:12px;">18:42 remaining</span></div>
        <p style="font-size:14px;line-height:1.6;margin:14px 0 12px;">A shop is reachable by exactly one road. What happens to it if that road closes, and which network property tells you this without searching for alternatives?</p>
        <div class="option sel"><span class="radio on"></span>It becomes unreachable \u2014 the property is the shop\u2019s degree being 1</div>
        <div class="option"><span class="radio"></span>It stays reachable through a longer path</div>
        <div class="option"><span class="radio"></span>Only delivery times increase; reachability is unchanged</div>
        <div class="option"><span class="radio"></span>It depends on the road\u2019s weight, not the degree</div>
        <div class="btnrow" style="margin-top:12px;"><span class="btn primary small">Submit answer</span><span class="btn small">Flag for review</span></div>
      </div>
    </div>
    <div>
      <div class="side" style="margin-bottom:14px;"><h4>Recent results <span class="ann">3</span></h4>
        <table class="wf"><tr><th>Assessment</th><th>Score</th></tr>
        <tr><td>Logic &amp; Proof \u00b7 subject test</td><td>86% \u2713</td></tr>
        <tr><td>Algebra \u00b7 topic test 2</td><td>74% \u2713</td></tr>
        <tr><td>Graphs quiz 5.2</td><td>58% \u00b7 retry booked</td></tr></table></div>
      <div class="side"><h4>Progress report <span class="ann">4</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Per-stage completion, quiz averages, time-on-task and the next recommended checkpoint \u2014 exportable as PDF.</p></div>
    </div>
  </div>
</div>
"""

page("wf_assessment.html", "Assessments", "Assessments", assessment_body,
     "<b>1</b> Assessment centre groups quizzes, topic and subject tests, mock exams and reports. &nbsp;"
     "<b>2</b> A live test: one question at a time, plain wording, timer visible, honest attempt rules. &nbsp;"
     "<b>3</b> Results with follow-up actions (a failed quiz books a retry, not a punishment). &nbsp;"
     "<b>4</b> Progress report aggregates everything for the learner\u2019s own records.")

# ------------------------------------------------------------------ GLOSSARY
glossary_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="h-sec">Glossary <span class="ann">1</span></div>
  <div class="sub-sec">A searchable technical dictionary written for beginners: every term has a simple meaning, a detailed meaning, an example, related terms and a subject category.</div>
  <div class="row" style="margin-top:6px;"><span class="searchbox" style="flex:1;max-width:520px;">Search terms \u2014 try \u201cbreak-even\u201d or \u201cAPI\u201d</span><span class="btn primary">Search</span></div>
  <div style="margin-top:14px;"><span class="chip on">All</span><span class="chip">Mathematics</span><span class="chip">Logic</span><span class="chip">Programming</span><span class="chip">Data</span><span class="chip">Web &amp; APIs</span><span class="chip">Cloud</span><span class="chip">AI</span></div>
</div>
<div class="section">
  <div class="split-r">
    <div class="card">
      <h4>break-even <span class="chip">Mathematics</span> <span class="chip">Business</span></h4>
      <p style="margin-top:10px;"><b style="color:#1F2933;">Simple meaning:</b> the sales level where money in exactly equals money out \u2014 no profit, no loss.</p>
      <p style="margin-top:10px;"><b style="color:#1F2933;">Detailed meaning:</b> the quantity at which total revenue equals total cost; computed as fixed cost \u00f7 (price \u2212 variable cost per item). Selling more than this quantity produces profit; selling less produces loss. It assumes prices and costs stay constant over the period.</p>
      <p style="margin-top:10px;"><b style="color:#1F2933;">Example:</b> Amara\u2019s stall fee is 20.00, each roll sells at 4.00 and costs 1.50 to make; each roll contributes 2.50, so she must sell 20 \u00f7 2.5 = 8 rolls before earning anything.</p>
      <p style="margin-top:10px;"><b style="color:#1F2933;">Related terms:</b> fixed cost \u00b7 variable cost \u00b7 contribution margin \u00b7 profit</p>
      <p style="margin-top:10px;font-size:12px;color:#68727E;">Appears in: Stage 2 \u00b7 Project P1.1 \u00b7 Foundation Mathematics ch. 5</p>
    </div>
    <div>
      <div class="side" style="margin-bottom:14px;"><h4>Recently viewed <span class="ann">2</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">fixed cost \u00b7 contribution margin \u00b7 idempotence</p></div>
      <div class="side"><h4>Everywhere, one click <span class="ann">3</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Lessons, labs and projects underline terms; a tap opens this dictionary without losing your place.</p></div>
    </div>
  </div>
</div>
"""

page("wf_glossary.html", "Glossary", "Glossary", glossary_body,
     "<b>1</b> Search plus category chips; categories match course subjects. &nbsp;"
     "<b>2</b> Recently viewed terms persist. &nbsp;"
     "<b>3</b> Terms are underlined across the whole site and open in place \u2014 the beginner never has to leave a lesson to decode a word.")

# ------------------------------------------------------------------ DASHBOARD
dash_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="row spread">
    <div><div class="h-sec">Good morning, Maya <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:0;">Stage 5 \u00b7 Graphs &amp; Networks \u00b7 12-day study streak \u00b7 next: lesson 5.3 Shortest paths</div></div>
    <span class="btn primary">Continue where you left off</span>
  </div>
</div>
<div class="section">
  <div class="grid cols-4" style="margin-bottom:22px;">
    <div class="kpi"><div class="ring" style="margin-bottom:8px;">27%</div><div class="l">overall programme progress</div></div>
    <div class="kpi"><div class="v">12 days</div><div class="l">current streak (longest 19)</div></div>
    <div class="kpi"><div class="v">86%</div><div class="l">average quiz score, last 10</div></div>
    <div class="kpi"><div class="v">3 / 15</div><div class="l">projects completed</div></div>
  </div>
  <div class="split-r">
    <div>
      <div class="card" style="margin-bottom:16px;"><h4>Recommended next activity <span class="ann">2</span></h4>
        <div class="row" style="margin-top:8px;"><div class="ph" style="width:64px;height:48px;"></div>
          <div style="font-size:13px;"><b>Lesson 5.3 \u2014 Shortest paths (25 min)</b><br>Lesson \u2192 exercise \u2192 3-question quiz. Linked book: Graphs &amp; Networks ch. 4.</div></div>
        <div class="btnrow" style="margin-top:12px;"><span class="btn primary small">Start now</span><span class="btn small">Choose something else</span></div></div>
      <div class="card"><h4>Quiz results, recent <span class="ann">3</span></h4>
        <table class="wf"><tr><th>Quiz</th><th>Score</th><th>Follow-up</th></tr>
        <tr><td>Graphs 5.2</td><td>58%</td><td>Retry booked with review</td></tr>
        <tr><td>Logic subject test</td><td>86%</td><td>Badge earned</td></tr></table></div>
    </div>
    <div>
      <div class="side" style="margin-bottom:14px;"><h4>Book reading progress <span class="ann">4</span></h4>
        <div class="row" style="margin-bottom:10px;"><div class="ph" style="width:40px;height:54px;"></div><div style="font-size:12px;flex:1;"><b>Graphs &amp; Networks</b><br><span class="bar" style="margin-top:6px;"><i style="width:40%"></i></span></div></div>
        <div class="row"><div class="ph" style="width:40px;height:54px;"></div><div style="font-size:12px;flex:1;"><b>Problem Solving</b><br><span class="bar" style="margin-top:6px;"><i style="width:8%"></i></span></div></div></div>
      <div class="side"><h4>Projects in progress <span class="ann">5</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">P1.2 Delivery-Route Logic Pack \u2014 step 4 of 5 \u00b7 rubric preview available</p></div>
    </div>
  </div>
</div>
"""

page("wf_dashboard.html", "Dashboard", "Dashboard", dash_body,
     "<b>1</b> The greeting answers the two beginner questions: where am I, what next. &nbsp;"
     "<b>2</b> One recommended action, with an explicit escape hatch. &nbsp;"
     "<b>3</b> Quiz results always carry a follow-up. &nbsp;"
     "<b>4</b> Book progress from the library. &nbsp;"
     "<b>5</b> Project state bridges to the Project Centre.")

# ------------------------------------------------------------------ CAREER
career_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="h-sec">Career centre <span class="ann">1</span></div>
  <div class="sub-sec">Everything that turns the programme into a job: the FDE career guide, interview preparation tracks, portfolio and CV guidance, and customer-communication practice.</div>
  <div class="tabs"><span class="tab on">Career guide</span><span class="tab">Interview prep</span><span class="tab">System design</span><span class="tab">Coding exercises</span><span class="tab">Portfolio &amp; CV</span><span class="tab">Customer practice</span></div>
</div>
<div class="section">
  <div class="grid cols-3">
    <div class="card"><div class="ph img"></div><h4>The FDE career guide <span class="ann">2</span></h4>
      <p>What the role is, where it exists, typical day, salary bands by region, and how agencies and consultancies hire for it.</p></div>
    <div class="card"><div class="ph img"></div><h4>Technical interview preparation <span class="ann">3</span></h4>
      <p>Question bank mapped to the 18 stages; a mock interviewer asks, you answer in plain language, model answers explain.</p></div>
    <div class="card"><div class="ph img"></div><h4>System design preparation <span class="ann">4</span></h4>
      <p>Small-scale design exercises: a feedback dashboard, a support assistant, a reporting pipeline \u2014 with reference architectures.</p></div>
    <div class="card"><div class="ph img"></div><h4>Coding interview exercises <span class="ann">5</span></h4>
      <p>60 exercises from string handling to API pagination, each with a lab, tests and a worked solution after an honest attempt.</p></div>
    <div class="card"><div class="ph img"></div><h4>Portfolio guidance <span class="ann">6</span></h4>
      <p>Turn completed projects into case studies: problem \u2192 approach \u2192 artefacts \u2192 honest limitations. Review checklist included.</p></div>
    <div class="card"><div class="ph img"></div><h4>Customer communication practice <span class="ann">7</span></h4>
      <p>Role-play simulations from Level 7: handle vague briefs, change requests and handovers; rubric-scored like a project.</p></div>
  </div>
</div>
"""

page("wf_career.html", "Career", "Career", career_body,
     "<b>1</b> Career tracks as tabs, consistent with other sections. &nbsp;"
     "<b>2</b> The guide starts with what the job actually is. &nbsp;"
     "<b>3\u20135</b> Interview tracks map to the academy\u2019s own stages \u2014 nothing is asked that the programme has not taught. &nbsp;"
     "<b>6</b> Portfolio coaching reuses completed project artefacts. &nbsp;"
     "<b>7</b> Communication practice is scored like everything else \u2014 with a rubric.")

# ------------------------------------------------------------------ ADMIN
admin_body = f"""
<div class="section" style="border-bottom:2px solid #3A4552;">
  <div class="row spread">
    <div><div class="h-sec">Admin dashboard <span class="ann">1</span></div>
      <div class="sub-sec" style="margin-bottom:0;">Signed in as Priya (admin) \u00b7 every change versioned; publishing requires the QA checklist.</div></div>
    <span class="btn primary">+ New lesson</span>
  </div>
</div>
<div class="section">
  <div class="grid cols-4" style="margin-bottom:22px;">
    <div class="kpi"><div class="v">1,284</div><div class="l">active learners this month</div></div>
    <div class="kpi"><div class="v">78%</div><div class="l">median lesson-quiz pass rate</div></div>
    <div class="kpi"><div class="v">3</div><div class="l">quizzes below 60% \u2014 flagged for review</div></div>
    <div class="kpi"><div class="v">52 min</div><div class="l">median weekly time-on-task</div></div>
  </div>
  <div class="split">
    <div class="side">
      <h4>Manage <span class="ann">2</span></h4>
      <div class="qrow">Courses, modules &amp; lessons</div>
      <div class="qrow">Books &amp; chapters <span class="ann">3</span></div>
      <div class="qrow">Quizzes &amp; questions</div>
      <div class="qrow">Projects &amp; rubrics</div>
      <div class="qrow">Downloads catalogue (DOCX/PDF)</div>
      <div class="qrow">Users &amp; roles</div>
      <div class="qrow">Learning analytics</div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px;"><h4>Content health <span class="ann">4</span></h4>
        <table class="wf"><tr><th>Item</th><th>Signal</th><th>Action</th></tr>
        <tr><td>Quiz 5.2 \u00b7 Graphs</td><td>52% pass rate</td><td>Open in editor</td></tr>
        <tr><td>Lesson 3.7 \u00b7 Logic</td><td>High re-read rate</td><td>Review wording</td></tr>
        <tr><td>Book \u00b7 Problem Solving</td><td>2 chapters unread by any cohort</td><td>Check stage mapping</td></tr></table></div>
      <div class="card"><h4>Publishing flow <span class="ann">5</span></h4>
        <p style="font-size:12.5px;color:#4A5561;">Draft \u2192 student preview (desktop + mobile) \u2192 accessibility &amp; QA checklist \u2192 version note \u2192 publish \u2192 analytics watch. Nothing skips the preview.</p></div>
    </div>
  </div>
</div>
"""

page("wf_admin.html", "Admin", None, admin_body,
     "<b>1</b> Admin is a separate role-gated surface with its own chrome. &nbsp;"
     "<b>2</b> Management areas as plain-language menu rows. &nbsp;"
     "<b>3</b> Every content type from the sitemap is manageable, including downloads. &nbsp;"
     "<b>4</b> Content health turns analytics into a work queue. &nbsp;"
     "<b>5</b> The publishing flow makes the QA checklist non-optional.")

# ------------------------------------------------------------------ MOBILE HOME
mhome_body = f"""
<div class="section" style="background:#3A4552;color:#E9EDF2;padding:34px 18px;">
  <span class="chip" style="background:#4A5561;border-color:#6B7683;color:#E9EDF2;">For absolute beginners</span>
  <h1 style="font-size:27px;font-weight:800;margin:14px 0 10px;color:#FFFFFF;">FDE Academy</h1>
  <p style="font-size:14.5px;color:#D6DBE1;line-height:1.6;">From Zero Knowledge to Real-World Engineering.</p>
  <div class="btnrow" style="margin-top:18px;"><span class="btn primary" style="background:#fff;color:#1F2933;border-color:#fff;">Start free <span class="ann">1</span></span></div>
</div>
<div class="section" style="padding:26px 18px;">
  <div class="h-sec" style="font-size:17px;">Your roadmap <span class="ann">2</span></div>
  <div class="stage done"><div class="num">1</div><div class="st-body"><div class="st-name">Start Here</div></div><span class="state-chip">Done</span></div>
  <div class="stage current"><div class="num">2</div><div class="st-body"><div class="st-name">Mathematical Foundations</div><div class="st-meta">Lesson 2.4 next</div></div><span class="state-chip">Current</span></div>
  <div class="stage locked"><div class="num">3</div><div class="st-body"><div class="st-name">Algebra Essentials</div></div><span class="state-chip">Upcoming</span></div>
  <span class="btn small" style="margin-top:12px;">See all 18 stages</span>
</div>
<div class="section" style="padding:26px 18px;">
  <div class="h-sec" style="font-size:17px;">Continue learning <span class="ann">3</span></div>
  <div class="card"><h4>Lesson 2.4 \u2014 Break-even</h4><p>10 min \u00b7 3 exercises \u00b7 quiz</p><span class="btn primary small" style="margin-top:10px;">Start now</span></div>
</div>
<div class="legend" style="padding:20px 18px;">
  <div class="ttl">Annotations</div>
  <b>1</b> Thumb-reach primary action. &nbsp;<b>2</b> Roadmap collapses to the current neighbourhood with \u201csee all\u201d. &nbsp;<b>3</b> One recommended activity, full-width cards, 44px touch targets.
</div>
"""

page("wf_mobile_home.html", "Mobile home", None, mhome_body, "", signed_in=False, mobile=True)

# ------------------------------------------------------------------ MOBILE DASHBOARD
mdash_body = f"""
<div class="section" style="padding:24px 18px;border-bottom:2px solid #3A4552;">
  <div class="h-sec" style="font-size:18px;">Hi Maya <span class="ann">1</span></div>
  <div class="kpi" style="margin-top:12px;"><div class="ring" style="width:92px;height:92px;border-width:10px;">27%</div><div class="l">overall progress \u00b7 Stage 5 of 18</div></div>
  <div class="btn primary" style="display:block;text-align:center;margin-top:14px;">Continue \u2014 Lesson 5.3 <span class="ann">2</span></div>
</div>
<div class="section" style="padding:24px 18px;">
  <div class="grid cols-2" style="grid-template-columns:1fr 1fr;gap:12px;">
    <div class="kpi"><div class="v">12</div><div class="l">day streak</div></div>
    <div class="kpi"><div class="v">86%</div><div class="l">quiz average</div></div>
  </div>
  <div class="card" style="margin-top:14px;"><h4>Today\u2019s plan <span class="ann">3</span></h4>
    <div class="qrow"><span class="tick"></span>Lesson 5.3 \u00b7 25 min</div>
    <div class="qrow"><span class="tick"></span>Quiz 5.3 \u00b7 3 questions</div></div>
  <div class="card" style="margin-top:14px;"><h4>Books</h4>
    <div class="row"><div class="ph" style="width:36px;height:50px;"></div><div style="font-size:12px;flex:1;"><b>Graphs &amp; Networks</b><br><span class="bar" style="margin-top:5px;"><i style="width:40%"></i></span></div></div></div>
</div>
<div class="legend" style="padding:20px 18px;">
  <div class="ttl">Annotations</div>
  <b>1</b> Progress ring summarises the programme. &nbsp;<b>2</b> The continue button is the whole point of the screen. &nbsp;<b>3</b> Today\u2019s plan fits one glance; streak and scores stay visible.
</div>
"""

page("wf_mobile_dashboard.html", "Mobile dashboard", None, mdash_body, "", mobile=True)

print("all wireframes written")
