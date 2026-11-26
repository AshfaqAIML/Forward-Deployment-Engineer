/* ============ FDE Academy — views part 3: assessments, glossary, maths studio, dashboard, career, admin + boot ============ */
"use strict";

/* ---------------- ASSESSMENT CENTRE ---------------- */
let examState = null;
const ASSESSMENTS_VIEW = {
  title: () => "Assessment centre",
  render(p) {
    const tab = (p && p.tab) || "take";
    const tabs = [["take", "Available"], ["results", "Results"], ["mock", "Mock exam"], ["report", "Progress report"]];
    let body = "";
    if (tab === "take") {
      body = COURSES.filter(c => TOPIC_TESTS.some(t => t.course === c.id)).map(c => {
        const t = TOPIC_TESTS.find(x => x.course === c.id);
        const attempts = store.s.attempts.filter(a => a.quizId === t.id);
        const best = attempts.length ? Math.max(...attempts.map(a => a.score)) : null;
        return `<div class="card" style="margin-bottom:14px"><div class="row spread">
          <div><h4>${I("check")} ${esc(t.title)}</h4>
          <p style="font-size:12.5px">${t.questions.length} questions · ${t.minutes} min · pass at ${t.pass}% · unlimited honest attempts</p>
          <div class="meta"><span class="chip">${esc(DATA.courseById(c.id).subject)}</span><span class="chip">Stage ${stageById(c.stage).n}</span>
          ${best !== null ? `<span class="chip ${best >= t.pass ? "teal" : "red"}">best ${best}%</span>` : `<span class="chip">not attempted</span>`}</div></div>
          <button class="btn primary" data-take="${t.id}">Take test</button></div></div>`;
      }).join("") + `<div class="statebox info">Lesson knowledge checks run inside each lesson (pass at 70% to complete the lesson). Topic tests, the mock exam and this report live here.</div>`;
    } else if (tab === "results") {
      const a = store.s.attempts;
      body = a.length ? `<div class="t-wrap"><table class="t"><thead><tr><th>Assessment</th><th>Kind</th><th>Score</th><th>When</th></tr></thead><tbody>
      ${a.slice().reverse().slice(0, 20).map(x => {
        const label = x.quizId.startsWith("tt-") ? (TOPIC_TESTS.find(t => t.id === x.quizId) || {}).title || x.quizId
          : x.quizId === "mock-a" ? "Mock exam A" : DATA.lessonById(x.quizId)?.title || x.quizId;
        return `<tr><td>${esc(label)}</td><td>${esc(x.kind)}</td><td>${x.score}%</td><td>${new Date(x.at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</td></tr>`;
      }).join("")}</tbody></table></div>
      <p class="meta">Every attempt is recorded — a failed quiz books a review, never a punishment. Your best score is what counts.</p>`
      : `<div class="empty"><b>No attempts recorded yet.</b><br>Take a lesson knowledge check or a topic test — results appear here automatically.</div>`;
    } else if (tab === "mock") {
      const best = store.s.attempts.filter(a => a.quizId === "mock-a");
      body = best.length ? `<div class="statebox ok">Mock exam A: best score <b>${Math.max(...best.map(x => x.score))}%</b> across ${plural(best.length, "attempt")}.</div>` : "";
      body += `<div class="card"><div class="row spread"><div><h4>${I("clock")} ${esc(MOCK_EXAM.title)}</h4>
        <p style="font-size:12.5px">${MOCK_EXAM.questions.length} multi-part questions · ${MOCK_EXAM.minutes} minutes · pass at ${MOCK_EXAM.pass}% · timer enforces honest conditions</p></div>
        <button class="btn primary" id="mock-start">Start timed exam</button></div></div><div id="mock-zone" style="margin-top:16px"></div>`;
    } else {
      const byCourse = COURSES.map(c => {
        const ls = DATA.lessonsOf(c.id);
        const done = ls.filter(l => store.lesson(l.id).done).length;
        const t = TOPIC_TESTS.find(x => x.course === c.id);
        const best = t ? store.s.attempts.filter(a => a.quizId === t.id) : [];
        return { c, ls, done, t, best: best.length ? Math.max(...best.map(a => a.score)) : null };
      });
      body = `<div class="t-wrap"><table class="t"><thead><tr><th>Course</th><th>Stage</th><th>Lessons</th><th>Topic test</th><th>Status</th></tr></thead><tbody>
      ${byCourse.map(r => `<tr><td>${esc(r.c.title)}</td><td>${stageById(r.c.stage).n}</td>
      <td>${r.done}/${r.ls.length}</td><td>${r.best !== null ? r.best + "%" : "—"}</td>
      <td>${r.ls.length && r.done === r.ls.length ? '<span class="chip teal">complete</span>' : r.done > 0 ? '<span class="chip amber">in progress</span>' : '<span class="chip">not started</span>'}</td></tr>`).join("")}
      </tbody></table></div>
      <div class="row" style="margin-top:14px"><button class="btn primary" id="report-print">${I("download", 15)} Export report (print to PDF)</button></div>
      <p class="meta">Every figure above is computed from your recorded attempts and lesson completions in this browser — nothing here is estimated.</p>`;
    }
    return `<div class="wrap">
    <div class="page-head"><h1>Assessment centre</h1>
    <p class="lede">Quizzes after every lesson, topic tests per course, one timed mock exam per phase — and a progress report computed from your real attempts.</p></div>
    <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button class="tab" role="tab" aria-selected="${tab === id}" data-nav="assessments/${id}">${label}</button>`).join("")}</div>
    ${body}</div>`;
  },
  mount(p) {
    const tab = (p && p.tab) || "take";
    $$("[data-take]").forEach(b => b.onclick = () => {
      const t = DATA.testById(b.dataset.take);
      if (!t) return;
      let selections = new Array(t.questions.length).fill(-1);
      $("#app").innerHTML = `<div class="wrap" style="max-width:760px">
      <div class="breadcrumb"><button data-nav="assessments">Assessments</button> › ${esc(t.title)}</div>
      <div class="page-head"><h1>${esc(t.title)}</h1><p class="lede">Answer every question; explanations appear after submission. Attempts are recorded honestly.</p></div>
      <div id="tt-body"></div></div>`;
      function draw() {
        $("#tt-body").innerHTML = t.questions.map((q, i) => `
        <div class="card" style="margin-bottom:14px"><p style="font-weight:600;margin-bottom:10px">${i + 1}. ${esc(q.q)}</p>
        ${q.options.map((o, oi) => `<button class="option ${selections[i] === oi ? "sel" : ""}" data-q="${i}" data-o="${oi}"><span class="radio"></span><span>${esc(o)}</span></button>`).join("")}</div>`).join("")
        + `<div class="row"><button class="btn primary" id="tt-submit">Submit test</button><span class="meta" id="tt-msg"></span></div>`;
        $$("#tt-body .option").forEach(btn => btn.onclick = () => { selections[+btn.dataset.q] = +btn.dataset.o; draw(); });
        $("#tt-submit").onclick = () => {
          if (selections.some(s => s === -1)) { $("#tt-msg").textContent = "Answer every question before submitting."; $("#tt-msg").style.color = "var(--red-700)"; return; }
          const correct = selections.filter((s, i) => s === t.questions[i].answer).length;
          const score = Math.round(100 * correct / t.questions.length);
          const passed = score >= t.pass;
          store.s.attempts.push({ quizId: t.id, kind: "test", score, total: 100, at: Date.now() });
          store.touch(); store.save();
          $("#tt-body").innerHTML = `<div class="card"><h4>Result: ${correct}/${t.questions.length} (${score}%) ${passed ? "— pass ✓" : "— below the " + t.pass + "% pass mark"}</h4>
          ${t.questions.map((q, i) => `<div class="qrow"><span class="tick ${selections[i] === q.answer ? "done" : ""}"></span>
          <div><b>${esc(q.q)}</b><br><span style="font-size:12.5px;color:${selections[i] === q.answer ? "var(--teal-700)" : "var(--red-700)"}">${esc(q.why)}</span></div></div>`).join("")}
          <div class="row" style="margin-top:10px"><button class="btn primary" data-nav="assessments">Back to assessment centre</button>
          <button class="btn" id="tt-retry">Retry with a clean attempt</button></div></div>`;
          $("#tt-retry").onclick = () => renderRoute();
          toast(passed ? "Test passed — recorded ✓" : "Attempt recorded — review and retry");
        };
      }
      draw();
    });
    if (tab === "mock") {
      $("#mock-start").onclick = () => {
        const t = MOCK_EXAM;
        examState = { selections: new Array(t.questions.length).fill(-1), left: t.minutes * 60 };
        const zone = $("#mock-zone");
        function draw() {
          const mm = String(Math.floor(examState.left / 60)).padStart(2, "0"), ss = String(examState.left % 60).padStart(2, "0");
          zone.innerHTML = `<div class="statebox info row spread"><span><b>Timed conditions — the clock is real.</b></span><b id="mock-clock" style="font-size:18px">${mm}:${ss}</b></div>
          ${t.questions.map((q, i) => `<div class="card" style="margin-bottom:12px"><p style="font-weight:600;margin-bottom:8px">${i + 1}. ${esc(q.q)}</p>
          ${q.options.map((o, oi) => `<button class="option ${examState.selections[i] === oi ? "sel" : ""}" data-q="${i}" data-o="${oi}"><span class="radio"></span><span>${esc(o)}</span></button>`).join("")}</div>`).join("")}
          <div class="row"><button class="btn primary" id="mock-submit">Submit exam</button><span class="meta">Auto-submits when time runs out.</span></div>`;
          $$("#mock-zone .option").forEach(btn => btn.onclick = () => { examState.selections[+btn.dataset.q] = +btn.dataset.o; draw(); });
          $("#mock-submit").onclick = finish;
        }
        function finish() {
          clearInterval(examState.timer);
          const t = MOCK_EXAM;
          const correct = examState.selections.filter((s, i) => s === t.questions[i].answer).length;
          const score = Math.round(100 * correct / t.questions.length);
          store.s.attempts.push({ quizId: "mock-a", kind: "mock", score, total: 100, at: Date.now() });
          store.touch(); store.save();
          zone.innerHTML = `<div class="card"><h4>Mock exam result: ${correct}/${t.questions.length} (${score}%) ${score >= t.pass ? "— pass ✓" : ""}</h4>
          ${t.questions.map((q, i) => `<div class="qrow"><span class="tick ${examState.selections[i] === q.answer ? "done" : ""}"></span><div><b>${esc(q.q)}</b><br><span style="font-size:12px;color:var(--slate-500)">${esc(q.why)}</span></div></div>`).join("")}
          <button class="btn primary" data-nav="assessments">Back</button></div>`;
          toast("Mock exam attempt recorded");
        }
        draw();
        examState.timer = setInterval(() => {
          examState.left--;
          const mm = String(Math.floor(examState.left / 60)).padStart(2, "0"), ss = String(examState.left % 60).padStart(2, "0");
          const c = $("#mock-clock"); if (c) c.textContent = mm + ":" + ss;
          if (examState.left <= 0) finish();
        }, 1000);
      };
    }
    if (tab === "report") { const b = $("#report-print"); if (b) b.onclick = () => window.print(); }
  },
  unmount() { if (examState && examState.timer) { clearInterval(examState.timer); examState = null; } },
};
route("assessments", ASSESSMENTS_VIEW);
route("assessments/:tab", ASSESSMENTS_VIEW);

/* ---------------- GLOSSARY ---------------- */
route("glossary", {
  title: () => "Glossary",
  render() {
    const terms = DATA.glossaryAll();
    const cats = ["All", ...new Set(terms.flatMap(t => t.cat))];
    let list = terms;
    return `<div class="wrap">
    <div class="page-head"><h1>Glossary</h1>
    <p class="lede">A searchable technical dictionary written for beginners: every term carries a simple meaning, a detailed meaning, an example, related terms and a subject category. Anywhere in the academy, an underlined term opens this dictionary in place.</p></div>
    <div class="row" style="margin-bottom:12px"><input class="searchbox" id="gl-q" placeholder="Search terms — try “break-even” or “API”" aria-label="Search glossary"></div>
    <div class="row" style="margin-bottom:18px;flex-wrap:wrap" id="gl-cats">${cats.map(c => `<button class="chip" data-gcat="${esc(c)}">${esc(c)}</button>`).join("")}</div>
    <div class="split-r"><div id="gl-list"></div>
    <div><div class="card" style="margin-bottom:16px"><h4>${I("shield")} Administrators</h4>
      <p style="font-size:12.5px">Term management (add, edit, remove) lives in the <button class="btn small" style="margin:4px 0" data-nav="admin">admin console</button>. Changes apply everywhere immediately, including search and the underlined terms.</p></div>
    <div class="card"><h4>${I("book")} Recently viewed</h4><p style="font-size:12.5px" id="gl-recent">Terms you open via the underlined links will be listed here during this visit.</p></div></div></div></div>`;
    function drawList() {
      const el = $("#gl-list");
      if (!list.length) { el.innerHTML = `<div class="empty"><b>No terms match.</b><br>Try a shorter search or another category.</div>`; return; }
      el.innerHTML = list.map(t => `<div class="card" style="margin-bottom:14px">
        <h4>${esc(t.term)} ${t.custom ? `<span class="chip amber">added by admin</span>` : t.edited ? `<span class="chip amber">edited by admin</span>` : ""}</h4>
        <div>${t.cat.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>
        <p style="margin-top:8px"><b style="color:var(--ink-700)">Simple:</b> ${esc(t.simple)}</p>
        <p><b style="color:var(--ink-700)">Detailed:</b> ${esc(t.detailed)}</p>
        <p><b style="color:var(--ink-700)">Example:</b> ${esc(t.example)}</p>
        <p><b style="color:var(--ink-700)">Related:</b> ${t.related.map(r => `<button class="glossterm" data-g="${esc(r)}" style="margin-right:8px">${esc(r.replace(/-/g, " "))}</button>`).join("") || "—"}</p></div>`).join("");
    }
    drawList();
    FDE._glDraw = drawList; FDE._glList = () => list;
    FDE._glSet = v => { list = v; };
  },
  mount() {
    const q = $("#gl-q");
    let activeCat = "All";
    q.addEventListener("input", () => refilter());
    $$("#gl-cats .chip").forEach(b => b.onclick = () => {
      activeCat = b.dataset.gcat;
      $$("#gl-cats .chip").forEach(x => x.classList.toggle("on", x === b));
      refilter();
    });
    $("#gl-cats .chip").classList.add("on");
    function refilter() {
      const s = q.value.trim().toLowerCase();
      const all = DATA.glossaryAll().filter(t =>
        (activeCat === "All" || t.cat.includes(activeCat))
        && (!s || t.term.toLowerCase().includes(s) || t.simple.toLowerCase().includes(s) || t.detailed.toLowerCase().includes(s)));
      FDE._glSet(all); FDE._glDraw();
    }
  },
});

/* ---------------- MATHS STUDIO ---------------- */
route("maths", {
  title: () => "Maths studio",
  render() {
    return `<div class="wrap">
    <div class="page-head"><h1>Maths studio</h1>
    <p class="lede">The academy's mathematics is never plain text: every concept ships with a live component you can drag, set and watch recompute. All seven kinds are assembled here — they also appear inside their lessons and labs.</p></div>
    <div class="grid g2" style="margin-bottom:20px">
      <div class="card"><h4>${I("calc")} 1 · Expressions</h4><p>Fractions, powers and roots typeset properly — from ${mathExpr("{20}/{2.5} = 8")} to ${mathExpr("Area = πr^{2}")}.</p></div>
      <div class="card"><h4>${I("calc")} 2 · Step-by-step</h4><p>Worked calculations revealed one step at a time, each step carrying its reason.</p></div>
      <div class="card"><h4>${I("target")} 3 · Number lines</h4><p>Drag the marker to see where decimals and rounded values really sit.</p></div>
      <div class="card"><h4>${I("chart")} 4 · Graphs</h4><p>Live plots with hover readouts — profit lines, parabolas, comparisons.</p></div>
      <div class="card"><h4>${I("spark")} 5 · Interactive equations</h4><p>Sliders for price, cost and fixed fees — watch break-even move.</p></div>
      <div class="card"><h4>${I("calc")} 6 · Fractions &amp; 7 · Percentages &amp; Geometry</h4><p>Shaded bars and hundred-squares you control; rectangles and triangles with live measures.</p></div>
    </div>
    <h3 class="h3">All seven, live:</h3>
    ${mathExpr("Break-even = {fixed cost}/{price − variable cost} = {20}/{2.50} = 8 rolls")}
    ${stepcalc("A 20% discount on £18.50", [
      { expr: "20% of 18.50 = 0.20 × 18.50 = 3.70", note: "The discount amount." },
      { expr: "18.50 − 3.70 = 14.80", note: "Final price." },
      { expr: "Check: 14.80 ÷ 18.50 = 0.8 → 80%", note: "Paying 80% confirms 20% off." } ])}
    ${numberline({ min: 4.4, max: 4.6, step: 0.01, value: 4.49, label: "Where does £4.49 sit?", unit: " GBP", snap: v => v >= 4.495 ? "Rounds to £4.50 (nearest hundredth)" : "Stays £4.49" })}
    ${plot({ caption: "Profit line y = 2.5x − 20 — crossing zero is break-even", fn: x => 2.5 * x - 20, xmin: 0, xmax: 20, yMin: -25, yMax: 35, marks: [{ x: 8, y: 0, label: "break-even" }] })}
    ${ieq({ caption: "Break-even explorer", sliders: [
      { key: "fc", label: "Fixed cost £", min: 0, max: 60, step: 1, val: 20 },
      { key: "p", label: "Price £", min: 1, max: 8, step: 0.25, val: 4 },
      { key: "c", label: "Variable £", min: 0.25, max: 4, step: 0.25, val: 1.5 }],
      display: v => v.p <= v.c ? "Price must exceed variable cost — else break-even is unreachable." : `Break-even = {${v.fc}}/{${(v.p - v.c).toFixed(2)}} ≈ ${Math.ceil(v.fc / (v.p - v.c))} rolls`,
      note: v => v.p <= v.c ? "Selling below cost cannot be rescued by volume." : "Rounded up to whole rolls." })}
    ${fraction({ n: 3, d: 4, label: "Three quarters of the tray" })}
    ${percent({ pct: 35, of: 60, label: "35% of 60 rolls" })}
    ${geometry({ shape: "rect" })}
    </div>`;
  },
  mount() { mountMath(); },
});

/* ---------------- DASHBOARD ---------------- */
route("dashboard", {
  title: () => "Student dashboard",
  render() {
    const s = store.s;
    if (!s.profile.name) {
      return `<div class="wrap"><div class="page-head"><h1>Your dashboard</h1></div>
      <div class="empty" style="margin-bottom:20px"><b>Welcome to FDE Academy.</b><br>Your dashboard tracks verified progress, streaks and quiz results — all computed from your real activity in this browser.<br><br>
      <button class="btn primary" data-nav="signin">Create your free local account</button>
      <button class="btn" data-nav="roadmap">Or explore the roadmap first</button></div></div>`;
    }
    const pct = store.overallPct();
    const st = store.streak();
    const avg = store.quizAvg();
    const stage = stageById(store.currentStageId());
    const rec = store.recommended();
    const weekDays = s.days.filter(d => Date.now() - new Date(d + "T12:00:00").getTime() <= 7 * 86400000);
    const goalPct = Math.min(100, Math.round(100 * weekDays.length / Math.max(1, s.profile.weeklyGoal)));
    const dash = Math.round(2 * Math.PI * 50); const filled = Math.round(dash * pct / 100);
    const bookmarks = Object.keys(s.lessons).filter(id => s.lessons[id].bookmark);
    const submissions = (s.submissions || []).length;
    const bookRows = BOOKS.map(b => ({ b, B: store.book(b.id) })).filter(r => r.B.chapters.length);
    return `<div class="wrap">
    <div class="page-head row spread"><div><h1>Good ${new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, ${esc(s.profile.name)}</h1>
    <p class="lede" style="margin-bottom:0">Stage ${stage.n} · ${esc(stage.title)}${st.current ? ` · ${plural(st.current, "day")} streak` : " · streak waiting for today's session"}</p></div>
    ${rec ? `<button class="btn primary" data-nav="lesson/${rec.lesson.id}">Continue where you left off ${I("right", 15)}</button>` : ""}</div>
    <div class="grid g4" style="margin:18px 0">
      <div class="kpi"><svg width="112" height="112" viewBox="0 0 120 120" role="img" aria-label="Overall progress ${pct} percent">
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-2)" stroke-width="12"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--amber-700)" stroke-width="12" stroke-linecap="round"
          stroke-dasharray="${filled} ${dash}" transform="rotate(-90 60 60)"/>
        <text x="60" y="68" text-anchor="middle" font-size="26" font-weight="800" fill="var(--ink-900)">${pct}%</text></svg>
        <div class="l">overall programme progress</div></div>
      <div class="kpi"><div class="v">${st.current}</div><div class="l">current streak (longest ${st.longest})</div></div>
      <div class="kpi"><div class="v">${avg === null ? "—" : avg + "%"}</div><div class="l">average quiz score, last 10 attempts</div></div>
      <div class="kpi"><div class="v">${store.projectsDone()}/${PROJECTS.length}</div><div class="l">projects submitted</div></div>
    </div>
    <div class="split-r" style="margin-bottom:30px">
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("star")} Recommended next activity</h4>
        ${rec ? `<div class="row" style="margin-top:8px"><div class="cover" style="width:52px;min-width:52px;height:66px;font-size:10px">Stage ${stage.n}</div>
          <div style="font-size:13px"><b>${esc(rec.lesson.title)}</b><br>${rec.lesson.minutes} min · knowledge check to complete<br>Linked book: ${(() => { const b = BOOKS.find(x => x.stage === rec.lesson.stage); return b ? esc(b.title) : "—"; })()}</div></div>
          <div class="row" style="margin-top:12px"><button class="btn primary small" data-nav="lesson/${rec.lesson.id}">Start now</button>
          <button class="btn small" data-nav="courses">Choose something else</button></div>`
        : `<p>All recorded lessons complete — take the mock exam or start the next stage's project.</p>`}</div>
        <div class="card"><h4>${I("check")} Recent quiz results</h4>
          ${(() => { const a = store.s.attempts.slice(-6).reverse();
            return a.length ? `<div class="t-wrap"><table class="t"><thead><tr><th>Assessment</th><th>Score</th><th>When</th></tr></thead><tbody>
            ${a.map(x => { const label = x.quizId === "mock-a" ? "Mock exam A" : x.quizId.startsWith("tt-") ? (TOPIC_TESTS.find(t2 => t2.id === x.quizId) || {}).title || x.quizId : (DATA.lessonById(x.quizId) || {}).title || x.quizId;
              return `<tr><td>${esc(label)}</td><td>${x.score}%</td><td>${new Date(x.at).toLocaleDateString("en-GB")}</td></tr>`; }).join("")}</tbody></table></div>
            <p class="meta">Every result carries its follow-up: a failed check means review + retry — booked, not punished.</p>`
            : `<div class="empty" style="padding:18px"><b>No attempts yet.</b><br>Your first lesson's knowledge check will appear here.</div>`; })()}
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("target")} This week's goal</h4>
          <div class="bar"><i style="width:${goalPct}%"></i></div>
          <div class="meta">${weekDays.length} active day${weekDays.length === 1 ? "" : "s"} of your ${s.profile.weeklyGoal}-session goal <button class="btn small subtle" style="margin-left:8px" data-nav="signin">change</button></div></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("book")} Book reading progress</h4>
          ${bookRows.length ? bookRows.map(r => `<div class="row" style="margin-bottom:10px"><div class="cover" style="width:36px;min-width:36px;height:48px;font-size:8.5px">${esc(r.b.title.split(" ")[0])}</div>
          <div style="font-size:12px;flex:1"><b>${esc(r.b.title)}</b><br><span class="bar" style="margin-top:5px"><i style="width:${Math.round(100 * r.B.chapters.length / r.b.chapters.length)}%"></i></span><br>${r.B.chapters.length}/${r.b.chapters.length} chapters</div>
          <button class="btn small subtle" data-nav="book/${r.b.id}">Open</button></div>`).join("")
          : `<div class="empty" style="padding:16px"><b>Nothing read yet.</b><br>Open a book and mark chapters as you finish them.</div>`}</div>
        <div class="card" style="margin-bottom:16px"><h4>${I("bookmark")} Bookmarks &amp; notes</h4>
          ${bookmarks.length ? bookmarks.map(id => { const l = DATA.lessonById(id); return l ? `<div class="qrow">${esc(l.title)}<button class="btn small" style="margin-left:auto" data-nav="lesson/${id}">Open</button></div>` : ""; }).join("") : `<p style="font-size:12.5px">No bookmarks yet — the bookmark button lives at the top of every lesson.</p>`}
          <p class="meta">Notes saved: ${Object.values(s.lessons).filter(x => x.notes).length} · lab submissions recorded: ${submissions} · sandbox runs: ${s.labRuns}</p></div>
        <div class="card"><h4>${I("download")} Your data</h4>
          <p style="font-size:12.5px">Progress lives in this browser and belongs to you.</p>
          <div class="row" style="margin-top:8px"><button class="btn small" id="dl-progress">${I("download", 14)} Export progress JSON</button>
          <button class="btn small subtle" id="load-sample">Load sample journey (clearly labelled)</button></div></div>
      </div>
    </div></div>`;
  },
  mount() {
    const dl = $("#dl-progress");
    if (dl) dl.onclick = () => { downloadFile("fde-academy-progress.json", JSON.stringify(store.s, null, 1), "application/json"); toast("Progress export started"); };
    const ls = $("#load-sample");
    if (ls) ls.onclick = () => {
      if (store.s.sample) { toast("Sample journey already loaded (and labelled)"); return; }
      store.s.sample = true;
      const lessons = ["st-1", "st-2", "st-3", "fm-1", "fm-2", "fm-3", "fm-4", "fm-5", "fm-6"];
      lessons.forEach((id, i) => { const L = store.lesson(id); L.done = true; L.quizBest = 75 + (i * 3) % 20; store.s.attempts.push({ quizId: id, kind: "quiz", score: L.quizBest, total: 100, at: Date.now() - (lessons.length - i) * 86400000 }); });
      for (let i = 0; i < 6; i++) store.s.days.push(new Date(Date.now() - i * 86400000).toISOString().slice(0, 10));
      store.lesson("fm-3").notes = "Sample note: alignment of decimal points prevents the classic money bug.";
      const B = store.book("fm"); B.chapters = ["The four operations", "Fractions and decimals", "Percentages in business"]; B.last = "Percentages in business";
      store.save(); toast("Sample journey loaded — every sample item is labelled and can be reset under your account");
      renderRoute();
    };
    const rec = store.recommended();
  },
});

/* ---------------- CAREER CENTRE ---------------- */
const CAREER_VIEW = {
  title: () => "Career centre",
  render(p) {
    const tab = (p && p.tab) || "guide";
    const tabs = [["guide", "Career guide"], ["interview", "Interview prep"], ["sysdesign", "System design"], ["coding", "Coding exercises"], ["portfolio", "Portfolio & CV"], ["comms", "Customer practice"]];
    const C = DATA.career;
    let body = "";
    if (tab === "guide") body = C.guide.map(([h, x]) => `<div class="card" style="margin-bottom:14px"><h4>${esc(h)}</h4><p style="font-size:14px">${esc(x)}</p></div>`).join("");
    else if (tab === "interview") body = `<p class="sub">Twelve questions mapped to the academy's own stages — nothing is asked here that the programme has not taught. Model answers show the shape of a good response; record your own before reading them.</p>`
      + C.interview.map(([q, a, st2]) => `<div class="acc"><button class="q" aria-expanded="false">${esc(q)} <span class="chip" style="margin-left:8px">Stage ${esc(st2)}</span><span aria-hidden="true">＋</span></button><div class="a" hidden>${esc(a)}</div></div>`).join("");
    else if (tab === "sysdesign") body = C.sysdesign.map(([t, d]) => `<div class="card" style="margin-bottom:14px"><h4>${esc(t)}</h4><p style="font-size:14px">${esc(d)}</p></div>`).join("") + `<div class="statebox info">Design answers are graded against the same rubric as projects — state assumptions, draw the pieces, name the limits.</div>`;
    else if (tab === "coding") body = `<p class="sub">Each exercise opens the matching lab — solve there, submit, and the submission records in your dashboard.</p>
      <div class="grid g2">${[LABS[3], LABS[4], LABS[5], LABS[6]].map(l => `<div class="card click" data-nav="lab/${l.id}"><h4>${I("code")} ${esc(l.title)}</h4><p>${esc(l.intro.split(".")[0])}.</p><div class="meta"><span class="chip">${esc(l.lang)}</span></div></div>`).join("")}</div>`;
    else if (tab === "portfolio") body = C.portfolio.map(([h, x]) => `<div class="card" style="margin-bottom:14px"><h4>${esc(h)}</h4><p style="font-size:14px">${esc(x)}</p></div>`).join("")
      + `<div class="statebox ok"><b>Your raw material:</b> ${store.projectsDone()} submitted project${store.projectsDone() === 1 ? "" : "s"} and ${store.lessonDoneCount()} verified lessons are already in this browser's record. Export the progress JSON from your dashboard as the evidence pack.</div>`;
    else body = C.comms.map(([h, x]) => `<div class="card" style="margin-bottom:14px"><h4>${esc(h)}</h4><p style="font-size:14px">${esc(x)}</p></div>`).join("");
    return `<div class="wrap">
    <div class="page-head"><h1>Career centre</h1>
    <p class="lede">Everything that turns the programme into a job: the career guide, interview preparation mapped to your stages, design and coding practice, portfolio and CV guidance, and customer-communication practice.</p></div>
    <div class="tabs" role="tablist">${tabs.map(([id, label]) => `<button class="tab" role="tab" aria-selected="${tab === id}" data-nav="career/${id}">${label}</button>`).join("")}</div>
    ${body}</div>`;
  },
  mount() {},
};
route("career", CAREER_VIEW);
route("career/:tab", CAREER_VIEW);

/* ---------------- ADMIN ---------------- */
route("admin", {
  title: () => "Admin console",
  render() {
    const s = store.s;
    const attempts = s.attempts;
    const quizStats = {};
    attempts.forEach(a => { (quizStats[a.quizId] = quizStats[a.quizId] || []).push(a.score); });
    const weak = Object.entries(quizStats).filter(([id, arr]) => {
      const avg = Math.round(arr.reduce((t, x) => t + x, 0) / arr.length); return avg < 70;
    }).map(([id, arr]) => {
      const avg = Math.round(arr.reduce((t, x) => t + x, 0) / arr.length);
      const label = id === "mock-a" ? "Mock exam A" : id.startsWith("tt-") ? (TOPIC_TESTS.find(t => t.id === id) || {}).title : (DATA.lessonById(id) || {}).title || id;
      return { id, label, avg, n: arr.length };
    });
    const lessonCompletions = store.lessonDoneCount();
    const terms = DATA.glossaryAll();
    const glEdits = s.glossaryEdits;
    return `<div class="wrap">
    <div class="page-head"><h1>Admin console</h1>
    <p class="lede">Local administration for this device: learning analytics computed from real recorded activity, content health, the glossary editor with live effect, and the publishing checklist. In the production build these surfaces sit behind the admin role at the gateway.</p></div>
    <div class="grid g4" style="margin-bottom:20px">
      <div class="kpi"><div class="v">1</div><div class="l">active learner on this device</div></div>
      <div class="kpi"><div class="v">${lessonCompletions}/${store.totalLessons()}</div><div class="l">lesson completions (verified)</div></div>
      <div class="kpi"><div class="v">${weak.length}</div><div class="l">assessments averaging below 70% — flagged</div></div>
      <div class="kpi"><div class="v">${s.labRuns}</div><div class="l">sandbox lab runs this device</div></div>
    </div>
    <div class="split">
      <div class="card"><h4>${I("settings")} Manage</h4>
        <div class="qrow">Courses, modules &amp; lessons — ${COURSES.length} courses · ${LESSONS.length} lessons</div>
        <div class="qrow">Books &amp; chapters — ${BOOKS.length} books · ${BOOKS.reduce((t, b) => t + b.chapters.length, 0)} chapters</div>
        <div class="qrow">Quizzes &amp; questions — lesson checks + ${TOPIC_TESTS.length} topic tests + mock exam</div>
        <div class="qrow">Projects &amp; rubrics — ${PROJECTS.length} projects</div>
        <div class="qrow">Users &amp; roles — local profile: <b>${esc(s.profile.name || "Guest")}</b></div>
        <div class="qrow">Downloads catalogue — DOCX/DOC exports live on every book page</div>
        <p class="meta">Editing of curriculum content is the production build's editor; on this device the <b>glossary is fully editable</b> and its changes apply site-wide immediately.</p>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("alert")} Content health (real signals)</h4>
          ${weak.length ? `<div class="t-wrap"><table class="t"><thead><tr><th>Assessment</th><th>Avg</th><th>Attempts</th><th>Action</th></tr></thead><tbody>
          ${weak.map(w => `<tr><td>${esc(w.label)}</td><td>${w.avg}%</td><td>${w.n}</td><td><button class="btn small" data-nav="lesson/${w.id}">Review wording</button></td></tr>`).join("")}
          </tbody></table></div>` : `<div class="empty" style="padding:16px"><b>No weak signals yet.</b><br>Content health flags any assessment averaging below 70% once attempts exist.</div>`}
        </div>
        <div class="card" style="margin-bottom:16px"><h4>${I("edit")} Glossary management</h4>
          <div class="row" style="margin-bottom:10px"><button class="btn small primary" id="gl-add">+ Add term</button>
          <button class="btn small subtle" id="gl-manage">${terms.filter(t => t.custom || t.edited).length} admin edits</button></div>
          <div id="gl-form" style="display:none">
            <label class="flabel">Term *</label><input class="f" id="ng-term" maxlength="60">
            <label class="flabel">Simple meaning *</label><input class="f" id="ng-simple" maxlength="160">
            <label class="flabel">Detailed meaning *</label><textarea class="f" id="ng-detail" maxlength="600"></textarea>
            <label class="flabel">Example *</label><input class="f" id="ng-example" maxlength="240">
            <label class="flabel">Category</label><input class="f" id="ng-cat" maxlength="40" value="General">
            <div class="row" style="margin-top:10px"><button class="btn primary small" id="ng-save">Save term</button><span class="ferr" id="ng-err"></span></div>
          </div>
          <div id="gl-managelist" style="display:none">
            <div class="t-wrap" style="max-height:220px;overflow:auto"><table class="t"><thead><tr><th>Term</th><th>Status</th><th></th></tr></thead><tbody>
            ${terms.filter(t => t.custom || t.edited).map(t => `<tr><td>${esc(t.term)}</td><td>${t.custom ? "added" : "edited"}</td><td><button class="btn small danger" data-gl-del="${esc(t.key)}">Remove</button></td></tr>`).join("") || `<tr><td colspan="3">No admin edits yet.</td></tr>`}
            </tbody></table></div>
          </div>
        </div>
        <div class="card"><h4>${I("check")} Publishing flow (non-negotiable)</h4>
          <p style="font-size:12.5px">Draft → student preview (desktop + mobile) → accessibility &amp; QA checklist → version note → publish → watch analytics. Nothing skips the preview; nothing publishes without its version note.</p></div>
      </div>
    </div></div>`;
  },
  mount() {
    $("#gl-add").onclick = () => { const f = $("#gl-form"); f.style.display = f.style.display === "none" ? "block" : "none"; $("#gl-managelist").style.display = "none"; };
    $("#gl-manage").onclick = () => { const f = $("#gl-managelist"); f.style.display = f.style.display === "none" ? "block" : "none"; $("#gl-form").style.display = "none"; };
    $$("[data-gl-del]").forEach(b => b.onclick = () => {
      store.s.glossaryEdits.removed.push(b.dataset.glDel); store.save();
      toast("Term removed — the glossary, search and inline links updated everywhere");
      renderRoute();
    });
    $("#ng-save").onclick = () => {
      const err = $("#ng-err");
      const term = $("#ng-term").value.trim(), simple = $("#ng-simple").value.trim(),
            detailed = $("#ng-detail").value.trim(), example = $("#ng-example").value.trim(),
            cat = $("#ng-cat").value.trim() || "General";
      const fail = m2 => { err.textContent = m2; err.style.display = "block"; };
      if (term.length < 2) return fail("Term needs at least 2 characters.");
      if (DATA.glossaryAll().some(t => t.term.toLowerCase() === term.toLowerCase())) return fail("That term already exists — edit the existing entry instead (production build).");
      if (simple.length < 10) return fail("The simple meaning needs at least 10 characters — it is the first thing beginners read.");
      if (detailed.length < 30) return fail("The detailed meaning needs at least 30 characters.");
      if (example.length < 10) return fail("Every term needs a concrete example.");
      err.style.display = "none";
      const key = "custom-" + term.toLowerCase().replace(/\s+/g, "-");
      store.s.glossaryEdits.added.push({ key, term, simple, detailed, example, related: [], cat: [cat], appears: "" });
      store.save();
      toast("Term added — live across the academy");
      renderRoute();
    };
  },
});

/* ---------------- BOOT ---------------- */
(function boot() {
  store.load();
  const foot = $("#footer");
  foot.innerHTML = `<div class="wrap">
    <div><b>Learn</b><button data-nav="roadmap">Learning roadmap</button><button data-nav="courses">Course library</button><button data-nav="maths">Maths studio</button><button data-nav="labs">Practical labs</button></div>
    <div><b>Library</b><button data-nav="books">Book library</button><button data-nav="glossary">Glossary</button><button data-nav="assessments">Assessment centre</button></div>
    <div><b>Community</b><button data-nav="projects">Project centre</button><button data-nav="career">Career centre</button><button data-nav="signin">Your account</button></div>
    <div><b>About</b><button data-nav="home">Home &amp; FAQ</button><button data-nav="admin">Admin console</button>
    <div class="fine">FDE Academy — From Zero Knowledge to Real-World Engineering.<br>This demo build stores all progress locally in your browser; student code runs in an isolated Web Worker; nothing is sent to any server.</div></div>
  </div>`;
  const labRoute = ROUTES.find(r => r.pattern === "lab/:id");
  if (labRoute) labRoute.unmount = terminateWorker;
  const bookRoute = ROUTES.find(r => r.pattern === "book/:id/:ch");
  if (bookRoute) bookRoute.unmount = terminateWorker;
  window.addEventListener("hashchange", renderRoute);
  if (!location.hash) location.hash = "#/";
  renderRoute();
})();
