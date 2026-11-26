/* ============ FDE Academy — views part 1: home, roadmap, courses, lesson reader ============ */
"use strict";

function chip(on, label) { return `<button class="chip${on ? " on" : ""}" data-chip="${esc(label)}">${esc(label)}</button>`; }
function renderProseBlock(b) {
  switch (b.t) {
    case "p": return `<p>${b.x}</p>`;
    case "ul": return `<ul>${b.items.map(i => `<li>${i}</li>`).join("")}</ul>`;
    case "table": return `<div class="t-wrap"><table class="t">${b.caption ? `<caption style="caption-side:top;text-align:left;padding:6px 10px;font-size:12.5px;font-weight:700;color:var(--ink-900)">${esc(b.caption)}</caption>` : ""}<thead><tr>${b.headers.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${m(String(c))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
    case "code": return `<div class="codeblock" role="figure" aria-label="Code example"><span class="cm">// ${esc(b.lang || "code")}</span>\n${esc(b.body)}</div>`;
    case "callout": return `<div class="callout ${b.style === "warn" ? "warn" : ""}">${b.x}</div>`;
    case "math": return `<div>${mathExpr(b.x)}</div>`;
    case "steps": return stepcalc(b.title, b.steps);
    case "nl": return numberline(b);
    case "plot": return plot(typeof b.fn === "string" ? { ...b, fn: eval("(" + b.fn + ")") } : b);
    case "ieq": return ieq(b);
    case "frac": return fraction(b);
    case "pct": return percent(b);
    case "geom": return geometry(b);
    case "exercise": return `<div class="exercise"><div class="tag">Practical exercise</div><p style="font-size:14.5px">${b.prompt}</p>
      <details style="margin-top:10px"><summary style="cursor:pointer;font-weight:600;color:var(--amber-800);font-size:13.5px">Hint</summary><p style="margin-top:8px;font-size:13.5px">${esc(b.hint || "Think about the definitions first.")}</p></details>
      <details style="margin-top:8px"><summary style="cursor:pointer;font-weight:600;color:var(--teal-700);font-size:13.5px">Solution (after an honest attempt)</summary><p style="margin-top:8px;font-size:13.5px">${m(b.solution || "")}</p></details></div>`;
    default: return `<p>${esc(JSON.stringify(b))}</p>`;
  }
}
FDE.renderProseBlock = renderProseBlock;

/* ---------------- HOME ---------------- */
route("", {
  title: () => "Home",
  render() {
    const s = store.s, rec = store.recommended();
    const stageN = stageById(store.currentStageId()).n;
    return `
    <section class="hero">
      <div class="wrap">
        <span class="chip">For absolute beginners — no computer science background needed</span>
        <h1 style="margin:14px 0 10px">FDE Academy</h1>
        <p>From Zero Knowledge to Real-World Engineering. An 18-stage guided path from first arithmetic to deployed, customer-facing engineering projects.</p>
        <div class="row" style="margin-top:22px;flex-wrap:wrap">
          <button class="btn primary" data-nav="${s.profile.name ? "dashboard" : "signin"}">${s.profile.name ? "Continue learning — dashboard" : "Start learning free"} ${I("right", 16)}</button>
          <button class="btn" style="background:transparent;color:#E9EDF2;border-color:#8B95A1" data-nav="roadmap">Explore the 18-stage roadmap</button>
        </div>
        <p style="font-size:12.5px;color:#9AA3AD;margin-top:14px">No credit card · No placement test · Mathematics first, taught from zero · Progress stored locally in your browser</p>
      </div>
    </section>
    <div class="wrap">
      <section class="section">
        <div class="h2">What is a Forward Deployed Engineer?</div>
        <p class="sub">An engineer who works directly with customers: understands their business, models their problems, writes the code and data that solve them, and explains everything in plain language. The academy teaches exactly this — starting from zero.</p>
        <div class="grid g3">
          <div class="card"><h4>${I("msg")} Listen &amp; model</h4><p>Turn a customer's story into requirements, numbers and rules — before any code.</p></div>
          <div class="card"><h4>${I("code")} Build &amp; ship</h4><p>Small programs, clean data, working APIs, deployed services — real deliverables at every stage.</p></div>
          <div class="card"><h4>${I("file")} Explain &amp; hand over</h4><p>Documentation, demonstrations and honest limitations — the skills employers actually test.</p></div>
        </div>
      </section>
      <section class="section">
        <div class="h2">Who the platform is for</div>
        <div class="grid g4">
          <div class="card"><h4>${I("user")} Career switchers</h4><p>From retail, logistics, support or admin — start from zero, build a portfolio.</p></div>
          <div class="card"><h4>${I("grad")} Students</h4><p>Complement theory with projects a customer would recognise as real work.</p></div>
          <div class="card"><h4>${I("briefcase")} Support &amp; ops</h4><p>Already understand customers; add the engineering half deliberately.</p></div>
          <div class="card"><h4>${I("spark")} Curious beginners</h4><p>Understand how software serves a business, in plain language.</p></div>
        </div>
      </section>
      <section class="section">
        <div class="row spread"><div class="h2">Your beginner roadmap</div><button class="btn small" data-nav="roadmap">All 18 stages</button></div>
        <p class="sub">Eighteen stages, each with prerequisites, lessons, books, projects and checkpoints. Mathematics is the first learning stage — everything after builds on it.</p>
        <div class="row" style="flex-wrap:wrap">
          ${STAGES.slice(0, 9).map(st => `<button class="chip${st.n <= stageN ? " on" : ""}" data-nav="stage/${st.id}">Stage ${st.n} · ${st.title.split(":")[0].split("—")[0]}</button>`).join("")}
          <button class="chip" data-nav="roadmap">+ 9 more</button>
        </div>
      </section>
      <section class="section">
        <div class="h2">Featured courses</div>
        <div class="grid g3">
          ${[COURSES[1], COURSES[6], COURSES[7]].map(c => `
          <div class="card click" data-nav="course/${c.id}" role="link" tabindex="0">
            <h4>${esc(c.title)}</h4><p>${esc(c.blurb)}</p>
            <div class="meta"><span class="chip">${esc(c.difficulty)}</span><span class="chip">${esc(c.subject)}</span>
            <span class="chip">${plural(DATA.lessonsOf(c.id).length, "lesson")}</span></div>
          </div>`).join("")}
        </div>
      </section>
      <section class="section">
        <div class="row spread"><div class="h2">The book collection</div><button class="btn small" data-nav="books">Open the library</button></div>
        <p class="sub">Six textbooks written for this programme — readable online, downloadable, progress tracked per chapter.</p>
        <div class="grid g6">
          ${BOOKS.map(b => `<div class="card click" style="padding:12px" data-nav="book/${b.id}"><div class="cover" style="height:92px;width:auto;font-size:11px">${esc(b.title.split(" ").slice(0, 3).join(" "))}<small>FDE Academy</small></div><p style="font-size:12px;margin-top:8px"><b>${esc(b.title)}</b></p></div>`).join("")}
        </div>
      </section>
      <section class="section">
        <div class="row spread"><div class="h2">Practical project demonstrations</div><button class="btn small" data-nav="projects">Project centre</button></div>
        <div class="grid g3">
          ${[PROJECTS[4], PROJECTS[10], PROJECTS[12]].map(p => `<div class="card click" data-nav="project/${p.id}" role="link" tabindex="0"><h4>${esc(p.title)}</h4><p>${esc(p.brief.split(".")[0])}.</p><div class="meta"><span class="chip">Level ${p.level}</span></div></div>`).join("")}
        </div>
      </section>
      <section class="section">
        <div class="h2">Why learners stay</div>
        <div class="grid g4">
          <div class="kpi"><div class="v">${store.totalLessons()}</div><div class="l">real lessons with verified knowledge checks</div></div>
          <div class="kpi"><div class="v">18</div><div class="l">stages — always know what is next</div></div>
          <div class="kpi"><div class="v">${PROJECTS.length}</div><div class="l">portfolio projects with rubrics</div></div>
          <div class="kpi"><div class="v">Honest</div><div class="l">demos are never called production-ready</div></div>
        </div>
      </section>
      <section class="section" style="padding-bottom:40px">
        <div class="h2">Frequently asked questions</div>
        ${HOME_FAQ.map(([q, a]) => `<div class="acc"><button class="q" aria-expanded="false">${esc(q)}<span aria-hidden="true">＋</span></button><div class="a" hidden>${esc(a)}</div></div>`).join("")}
      </section>
    </div>`;
  },
  mount() { mountMath(); },
});
/* "home" alias — logo, nav and footer buttons navigate to #/home */
route("home", ROUTES[0].view);

/* ---------------- ROADMAP + STAGE DETAIL ---------------- */
route("roadmap", {
  title: () => "Learning roadmap",
  render() {
    const cur = store.currentStageId();
    return `<div class="wrap">
    <div class="page-head"><h1>Your learning roadmap</h1>
    <p class="lede">Eighteen stages across seven phases — mathematics first, programming after the foundations, deployments and career launch last. Completed stages are marked from your real progress; the current stage is where your next unfinished lesson lives.</p></div>
    <div class="split-r" style="margin:16px 0 40px">
      <div class="card" style="padding:6px 20px">
        ${STAGES.map(st => {
          const state = store.stageState(st.id), prog = store.stageProgress(st.id);
          const cls = state === "done" ? "done" : st.id === cur ? "current" : "locked";
          const chipTxt = state === "done" ? `<span class="chip teal">Completed</span>` : st.id === cur ? `<span class="chip amber">Current</span>` : `<span class="chip">Upcoming</span>`;
          return `<div class="stage ${cls}"><div class="num">${st.n}</div>
          <div class="st-body"><div class="st-name"><button style="background:none;border:none;padding:0;font:inherit;cursor:pointer;color:inherit" data-nav="stage/${st.id}">${esc(st.title)}</button></div>
          <div class="st-meta">${esc(st.meta)}${prog.total ? ` · ${prog.done}/${prog.total} lessons (${prog.pct}%)` : ""}</div></div>
          ${chipTxt}</div>`;
        }).join("")}
      </div>
      <div>
        ${(() => {
          const st = stageById(cur), prog = store.stageProgress(cur);
          const rec = store.recommended();
          const books = BOOKS.filter(b => b.stage === st.id);
          const projects = PROJECTS.filter(p => p.stage === st.id);
          return `<div class="card" style="margin-bottom:16px">
            <h4>${I("target")} Stage ${st.n} in progress — ${esc(st.title)}</h4>
            <p>Prerequisites: ${st.n === 1 ? "none — this is the front door" : "Stages " + STAGES.filter(x => x.n < st.n).slice(-2).map(x => x.n).join(" and ") + " (checked from your real completions)"}.</p>
            ${prog.total ? `<div class="meta">Stage progress: ${prog.done}/${prog.total} lessons<div class="bar" style="margin-top:6px"><i style="width:${prog.pct}%"></i></div></div>` : `<div class="meta">This stage is assessed through its books, labs and projects — no separate lessons.</div>`}
            ${rec && rec.stage.id === st.id ? `<div class="statebox info" style="margin-top:10px"><b>Recommended next:</b> ${esc(rec.lesson.title)}<div style="margin-top:8px"><button class="btn small primary" data-nav="lesson/${rec.lesson.id}">Open lesson</button></div></div>` : ""}
          </div>
          <div class="card" style="margin-bottom:16px"><h4>${I("book")} Related books</h4>
            ${books.length ? books.map(b => `<div class="row" style="margin-bottom:8px"><div class="cover" style="width:42px;min-width:42px;height:56px;font-size:9px">${esc(b.title.split(" ")[0])}</div><div style="font-size:12.5px"><b>${esc(b.title)}</b><br>${plural(b.chapters.length, "chapter")} · ${b.pages} pages<br><button class="btn small" style="margin-top:4px" data-nav="book/${b.id}">Open book</button></div></div>`).join("") : `<p>No dedicated textbook — this stage's material lives in its lessons, labs and projects.</p>`}
          </div>
          <div class="card"><h4>${I("briefcase")} Linked projects</h4>
            ${projects.length ? projects.map(p => `<div class="qrow"><b>Level ${p.level}</b> · ${esc(p.title)}<button class="btn small" style="margin-left:auto" data-nav="project/${p.id}">Open</button></div>`).join("") : `<p>No standalone project at this stage.</p>`}
          </div>`;
        })()}
      </div>
    </div></div>`;
  },
  mount() {},
});
route("stage/:id", {
  title: p => stageById(p.id) ? "Stage " + stageById(p.id).n : "Stage",
  render(p) {
    const st = stageById(p.id); if (!st) return `<div class="wrap"><div class="empty">No such stage.</div></div>`;
    const ls = DATA_lessonsOf_courseLessons(st.id);
    return `<div class="wrap"><div class="breadcrumb"><button data-nav="roadmap">Roadmap</button> › Stage ${st.n}</div>
    <div class="page-head"><h1>Stage ${st.n} — ${esc(st.title)}</h1><p class="lede">${esc(st.meta)}. Phase ${st.phase}: ${esc(PHASES[st.phase])}.</p></div>
    <div class="split-r" style="margin-bottom:40px"><div>
      ${ls.length ? ls.map(l => { const L = store.lesson(l.id);
        return `<div class="qrow"><span class="tick ${L.done ? "done" : ""}"></span><div><b>${esc(l.title)}</b><br><span style="font-size:12px;color:var(--slate-500)">${esc(l.module)} · ${l.minutes} min · knowledge check ${plural(l.quiz.length, "question")}</span></div>
        <button class="btn small ${L.done ? "" : "primary"}" style="margin-left:auto" data-nav="lesson/${l.id}">${L.done ? "Review" : "Open"}</button></div>`; }).join("")
      : `<div class="empty"><b>No separate lessons at this stage.</b><br>Its material is assessed through labs, projects and the stage tests. See the related books and projects.</div>`}
    </div><div>
      <div class="card" style="margin-bottom:16px"><h4>${I("book")} Books</h4>${BOOKS.filter(b => b.stage === st.id).map(b => `<div class="qrow">${esc(b.title)}<button class="btn small" style="margin-left:auto" data-nav="book/${b.id}">Open</button></div>`).join("") || "<p>—</p>"}</div>
      <div class="card" style="margin-bottom:16px"><h4>${I("briefcase")} Projects</h4>${PROJECTS.filter(x => x.stage === st.id).map(x => `<div class="qrow">Level ${x.level} · ${esc(x.title)}<button class="btn small" style="margin-left:auto" data-nav="project/${x.id}">Open</button></div>`).join("") || "<p>—</p>"}</div>
      <div class="card"><h4>${I("check")} Assessments</h4>${TOPIC_TESTS.filter(t => DATA.courseById(t.course) && DATA.courseById(t.course).stage === st.id).map(t => `<div class="qrow">${esc(t.title)}<button class="btn small" style="margin-left:auto" data-nav="assessments">Open</button></div>`).join("") || "<p>See the Assessment Centre for this phase's mock exam.</p>"}</div>
    </div></div></div>`;
  },
  mount() { mountMath(); },
});
/* helper used above (declared late on purpose to keep stage rendering self-contained) */
function DATA_lessonsOf_courseLessons(stageId) { return LESSONS.filter(l => l.stage === stageId); }
const _ = 0;

/* ---------------- COURSE LIBRARY ---------------- */
let courseFilter = { subject: "All", difficulty: "All" };
route("courses", {
  title: () => "Course library",
  render() {
    const subjects = ["All", ...new Set(COURSES.map(c => c.subject))];
    const diffs = ["All", ...new Set(COURSES.map(c => c.difficulty))];
    const list = COURSES.filter(c => (courseFilter.subject === "All" || c.subject === courseFilter.subject)
      && (courseFilter.difficulty === "All" || c.difficulty === courseFilter.difficulty));
    return `<div class="wrap">
    <div class="page-head"><h1>Course library</h1>
    <p class="lede">Every course, organised by subject and difficulty. Each course page shows objectives, prerequisites, and its full module → chapter → lesson structure with completion status from your real progress.</p></div>
    <div class="split" style="margin-bottom:40px">
      <div class="card">
        <h4>${I("settings")} Filters</h4>
        <div class="flabel">Subject</div><div>${subjects.map(s => `<button class="chip${courseFilter.subject === s ? " on" : ""}" data-cf-subject="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="flabel">Difficulty</div><div>${diffs.map(s => `<button class="chip${courseFilter.difficulty === s ? " on" : ""}" data-cf-diff="${esc(s)}">${esc(s)}</button>`).join("")}</div>
        <div class="meta">Filters apply instantly; the count below reflects them.</div>
      </div>
      <div>
        <p class="sub" id="course-count">${plural(list.length, "course")} shown</p>
        ${list.length ? list.map(c => {
          const ls = DATA.lessonsOf(c.id); const done = ls.filter(l => store.lesson(l.id).done).length;
          const pct = ls.length ? Math.round(100 * done / ls.length) : 0;
          return `<div class="card click" style="margin-bottom:14px" data-nav="course/${c.id}" role="link" tabindex="0">
          <div class="row spread"><h4>${esc(c.title)}</h4><span class="chip ${c.difficulty === "Beginner" ? "" : c.difficulty === "Advanced" ? "red" : "amber"}">${esc(c.difficulty)}</span></div>
          <p>${esc(c.blurb)}</p>
          <div class="meta"><span class="chip">${esc(c.subject)}</span><span class="chip">Stage ${stageById(c.stage).n}</span><span class="chip">${plural(ls.length, "lesson")}</span></div>
          <div class="meta">Completed ${pct}% ${ls.length ? `<span class="bar" style="width:140px;display:inline-block;vertical-align:middle;margin-left:8px"><i style="width:${pct}%"></i></span>` : ""}</div>
        </div>`; }).join("")
        : `<div class="empty"><b>No courses match those filters.</b><br>Try a different subject or difficulty combination.</div>`}
      </div>
    </div></div>`;
  },
  mount() {
    $$("[data-cf-subject]").forEach(b => b.onclick = () => { courseFilter.subject = b.dataset.cfSubject; renderRoute(); });
    $$("[data-cf-diff]").forEach(b => b.onclick = () => { courseFilter.difficulty = b.dataset.cfDiff; renderRoute(); });
  },
});
route("course/:id", {
  title: p => DATA.courseById(p.id)?.title || "Course",
  render(p) {
    const c = DATA.courseById(p.id); if (!c) return `<div class="wrap"><div class="empty">No such course.</div></div>`;
    const ls = DATA.lessonsOf(c.id); const done = ls.filter(l => store.lesson(l.id).done).length;
    const pct = ls.length ? Math.round(100 * done / ls.length) : 0;
    const book = BOOKS.find(b => b.course === c.id);
    const projects = PROJECTS.filter(x => x.stage === c.stage);
    const test = TOPIC_TESTS.find(t => t.course === c.id);
    const modules = [...new Set(ls.map(l => l.module))];
    return `<div class="wrap">
    <div class="breadcrumb"><button data-nav="courses">Courses</button> › ${esc(c.title)}</div>
    <div class="page-head"><h1>${esc(c.title)}</h1><p class="lede">${esc(c.blurb)}</p>
      <div style="margin-top:10px"><span class="chip on">${esc(c.difficulty)}</span><span class="chip">${esc(c.subject)}</span><span class="chip">Stage ${stageById(c.stage).n}</span><span class="chip">${plural(ls.length, "lesson")}</span></div></div>
    <div class="split-r" style="margin-bottom:40px">
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("star")} Learning objectives</h4>
          <ul style="margin-left:18px;font-size:14px">${c.objectives.map(o => `<li style="margin-bottom:5px">${esc(o)}</li>`).join("")}</ul></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("lock")} Prerequisites</h4><p style="font-size:14px">${c.prereq}</p></div>
        <div class="h3">Modules and chapters</div>
        ${modules.map(mn => {
          const mls = ls.filter(l => l.module === mn);
          return `<div class="card" style="margin-bottom:14px"><h4>${esc(mn)}</h4>
          ${mls.map(l => { const L = store.lesson(l.id);
            return `<div class="qrow"><span class="tick ${L.done ? "done" : ""}"></span>
            <div style="min-width:0"><b>${esc(l.title)}</b><br><span style="font-size:11.5px;color:var(--slate-500)">${esc(l.chapter)} · ${l.minutes} min · ${L.done ? "completed" : L.quizBest ? "attempted — best " + L.quizBest + "%" : "not started"}</span></div>
            <button class="btn small ${L.done ? "" : "primary"}" style="margin-left:auto" data-nav="lesson/${l.id}">${L.done ? "Review" : "Open"}</button></div>`; }).join("")}
          </div>`; }).join("")}
      </div>
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("chart")} Your progress in this course</h4>
          <div class="bar"><i style="width:${pct}%"></i></div>
          <div class="meta">${done} of ${ls.length} lessons · verified by knowledge checks</div>
          ${test ? `<div class="meta" style="margin-top:10px"><button class="btn small primary" data-nav="assessments">Take the topic test</button></div>` : ""}</div>
        ${book ? `<div class="card" style="margin-bottom:16px"><h4>${I("book")} Companion book</h4>
          <div class="bookcard"><div class="cover">${esc(book.title.split(" ").slice(0, 2).join(" "))}<small>FDE</small></div>
          <div style="font-size:12.5px"><b>${esc(book.title)}</b><br>${plural(book.chapters.length, "chapter")} · ${book.pages} pages<br>DOCX · PDF · online</div></div>
          <button class="btn small" style="margin-top:10px" data-nav="book/${book.id}">Open book page</button></div>` : ""}
        ${projects.length ? `<div class="card" style="margin-bottom:16px"><h4>${I("briefcase")} Course project</h4>
          ${projects.map(x => `<div class="qrow">Level ${x.level} · ${esc(x.title)}<button class="btn small primary" style="margin-left:auto" data-nav="project/${x.id}">Open</button></div>`).join("")}</div>` : ""}
        <div class="card"><h4>${I("flask")} Practical exercises</h4>
          <p style="font-size:12.5px">The ${c.subject === "Programming" ? "coding" : c.subject === "AI" ? "AI" : "maths"} labs update alongside these lessons.</p>
          <button class="btn small" style="margin-top:8px" data-nav="labs">Open labs</button></div>
      </div>
    </div></div>`;
  },
  mount() { mountMath(); },
});

/* ---------------- LESSON READER ---------------- */
route("lesson/:id", {
  title: p => DATA.lessonById(p.id)?.title || "Lesson",
  render(p) {
    const l = DATA.lessonById(p.id); if (!l) return `<div class="wrap"><div class="empty">No such lesson.</div></div>`;
    const c = DATA.courseById(l.course); const L = store.lesson(l.id);
    store.touch(); store.save();
    const siblings = DATA.lessonsOf(l.course); const idx = siblings.findIndex(x => x.id === l.id);
    const prev = siblings[idx - 1], next = siblings[idx + 1];
    const chapterMates = siblings.filter(x => x.chapter === l.chapter);
    return `<div class="wrap">
    <div class="breadcrumb"><button data-nav="courses">Courses</button> › <button data-nav="course/${c.id}">${esc(c.title)}</button> › ${esc(l.chapter)}</div>
    <div class="reader-top">
      <span class="chip amber">Stage ${stageById(l.stage).n}</span><span class="chip">${l.minutes} min</span>
      ${L.done ? `<span class="chip teal">Completed</span>` : ""}
      <span style="margin-left:auto"></span>
      <button class="btn small ${L.bookmark ? "primary" : ""}" id="bm-btn" aria-pressed="${L.bookmark}">${I("bookmark", 15)} ${L.bookmark ? "Bookmarked" : "Bookmark"}</button>
    </div>
    <div class="split-r" style="margin-bottom:40px">
      <article class="prose" id="lesson-body">
        <h1 style="margin-bottom:4px">${esc(l.title)}</h1>
        <p style="color:var(--slate-500);font-size:13px;margin-bottom:18px">${esc(c.title)} · ${esc(l.module)} · ${esc(l.chapter)}</p>
        <div class="card tint" style="margin-bottom:18px"><h4>${I("star")} Learning objectives</h4>
          <ul style="margin-left:18px;font-size:14px">${l.objectives.map(o => `<li style="margin-bottom:4px">${esc(o)}</li>`).join("")}</ul></div>
        ${l.blocks.map(renderProseBlock).join("")}
        <div class="kcheck" id="kcheck">
          <div class="tag">Knowledge check — pass to complete the lesson</div>
          <div id="quiz-body"></div>
        </div>
        <div class="reader-top" style="border-top:2px solid var(--line);padding-top:16px">
          ${prev ? `<button class="btn" data-nav="lesson/${prev.id}">${I("left", 15)} Previous: ${esc(prev.title.length > 28 ? prev.title.slice(0, 28) + "…" : prev.title)}</button>` : `<span></span>`}
          ${next ? `<button class="btn" data-nav="lesson/${next.id}">Next: ${esc(next.title.length > 28 ? next.title.slice(0, 28) + "…" : next.title)} ${I("right", 15)}</button>`
            : testLinkFor(c.id)}
        </div>
      </article>
      <aside>
        <div class="card" style="margin-bottom:16px"><h4>${I("grad")} Chapter navigation</h4>
          ${chapterMates.map(x => `<button class="toc-link ${x.id === l.id ? "on" : ""}" data-nav="lesson/${x.id}">${esc(x.title)}${store.lesson(x.id).done ? " ✓" : ""}</button>`).join("")}
        </div>
        <div class="card" style="margin-bottom:16px"><h4>${I("chart")} Progress</h4>
          ${(() => { const ls = DATA.lessonsOf(c.id); const dn = ls.filter(x => store.lesson(x.id).done).length;
            const pc = Math.round(100 * dn / ls.length);
            return `<div class="bar"><i style="width:${pc}%" class="teal"></i></div><div class="meta">${dn}/${ls.length} lessons in ${esc(c.title)}</div>`; })()}
        </div>
        <div class="card notepad" style="margin-bottom:16px"><h4>${I("edit")} Your notes</h4>
          <textarea class="f" id="lesson-notes" placeholder="Write the ideas in your own words — one sentence per idea works best." aria-label="Notes for this lesson">${esc(L.notes)}</textarea>
          <button class="btn small primary" id="notes-save" style="margin-top:10px">Save notes</button>
          <div class="meta" id="notes-saved" style="display:none">Saved ✓</div>
          ${L.notes ? `<div class="notes-list" style="margin-top:10px"><div class="note">${esc(L.notes)}</div></div>` : ""}</div>
        <div class="card"><h4>${I("book")} Companion book</h4>
          ${(() => { const b = BOOKS.find(x => x.course === c.id); return b ? `<div style="font-size:12.5px"><b>${esc(b.title)}</b><br>${plural(b.chapters.length, "chapter")} · downloadable</div><button class="btn small" style="margin-top:8px" data-nav="book/${b.id}">Open book</button>` : "<p>—</p>"; })()}
        </div>
      </aside>
    </div></div>`;
    function testLinkFor(cid) {
      const t = TOPIC_TESTS.find(x => x.course === cid);
      return t ? `<button class="btn primary" data-nav="assessments">Course finished — take the topic test ${I("right", 15)}</button>` : "";
    }
  },
  mount(p) {
    const l = DATA.lessonById(p.id); const c = DATA.courseById(l.course); const L = store.lesson(l.id);
    L.visits++; store.save();
    const quizHost = $("#quiz-body");
    let selections = new Array(l.quiz.length).fill(-1);
    let checked = false;
    function renderQuiz() {
      quizHost.innerHTML = l.quiz.map((q, i) => `
        <div style="margin-bottom:16px"><p style="font-weight:600;font-size:14.5px;margin-bottom:8px">${i + 1}. ${esc(q.q)}</p>
        ${q.options.map((o, oi) => `<button class="option ${selections[i] === oi ? "sel" : ""} ${checked ? (oi === q.answer ? "correct" : selections[i] === oi ? "wrong" : "") : ""}"
           data-q="${i}" data-o="${oi}" ${checked ? "disabled" : ""}><span class="radio"></span><span>${esc(o)}</span></button>`).join("")}
        ${checked ? `<p style="font-size:12.5px;color:${selections[i] === q.answer ? "var(--teal-700)" : "var(--red-700)"};margin-top:4px">${esc(q.why)}</p>` : ""}</div>`).join("")
        + `<div class="row"><button class="btn primary" id="quiz-submit" ${checked ? "disabled" : ""}>${checked ? "Attempt recorded" : "Submit answers"}</button>
        <span class="meta" id="quiz-msg">${checked ? "" : "Answer every question — attempts are recorded honestly."}</span></div>`;
      $$(".option", quizHost).forEach(b => b.onclick = () => { if (checked) return; selections[+b.dataset.q] = +b.dataset.o; renderQuiz(); });
      $("#quiz-submit", quizHost).onclick = () => {
        if (selections.some(s => s === -1)) { $("#quiz-msg", quizHost).textContent = "Choose an answer for every question before submitting."; $("#quiz-msg", quizHost).style.color = "var(--red-700)"; return; }
        checked = true;
        const correct = selections.filter((s, i) => s === l.quiz[i].answer).length;
        const score = Math.round(100 * correct / l.quiz.length);
        const passed = score >= 70;
        L.quizBest = Math.max(L.quizBest, score);
        if (passed) L.done = true;
        store.s.attempts.push({ quizId: l.id, kind: "quiz", score, total: 100, at: Date.now() });
        store.touch(); store.save();
        renderQuiz();
        const msg = $("#quiz-msg", quizHost);
        msg.style.color = passed ? "var(--teal-700)" : "var(--red-700)";
        msg.innerHTML = `<b>${correct}/${l.quiz.length} correct (${score}%).</b> ${passed ? "Lesson completed ✓ — it now counts on your dashboard." : "Not yet at 70% — review the explanations above, then reload the page to retry with a clean attempt (your best score is kept)."}`;
        toast(passed ? "Lesson completed — progress verified ✓" : "Attempt recorded — review and retry");
      };
    }
    renderQuiz();
    $("#bm-btn").onclick = () => { L.bookmark = !L.bookmark; store.save(); renderRoute(); };
    $("#notes-save").onclick = () => {
      const v = $("#lesson-notes").value;
      if (v.length > 2000) { toast("Notes limited to 2000 characters", "err"); return; }
      L.notes = v; store.save(); toast("Notes saved to this lesson");
      const box = $("#notes-saved"); box.style.display = "block"; setTimeout(() => box.style.display = "none", 1500);
    };
    mountMath();
  },
});
function testLinkFor(cid) {
  const t = TOPIC_TESTS.find(x => x.course === cid);
  return t ? `<button class="btn primary" data-nav="assessments">Course finished — take the topic test ${I("right", 15)}</button>` : "";
}
