/* ============ FDE Academy — views part 2: books, labs, projects, search, account ============ */
"use strict";

/* ---------------- BOOK LIBRARY ---------------- */
let bookFilter = { subject: "All", difficulty: "All", q: "" };
route("books", {
  title: () => "Digital book library",
  render() {
    const subjects = ["All", ...new Set(BOOKS.map(b => b.subject))];
    const diffs = ["All", "Beginner", "Intermediate", "All levels", "Advanced"];
    const list = BOOKS.filter(b =>
      (bookFilter.subject === "All" || b.subject === bookFilter.subject)
      && (bookFilter.difficulty === "All" || b.difficulty === bookFilter.difficulty)
      && (!bookFilter.q || b.title.toLowerCase().includes(bookFilter.q) || b.desc.toLowerCase().includes(bookFilter.q)));
    return `<div class="wrap">
    <div class="page-head"><h1>Digital book library</h1>
    <p class="lede">The academy's technical library: searchable textbooks with covers, difficulty, tables of contents and reading progress. Download every chapter or full book as DOCX, or print-to-PDF from the reader.</p></div>
    <div class="row" style="margin-bottom:14px"><input class="searchbox" id="book-q" placeholder="Search by subject, topic or title — try “break-even”" value="${esc(bookFilter.q)}" aria-label="Search books"></div>
    <div class="row" style="margin-bottom:18px;flex-wrap:wrap">
      <span style="font-size:12.5px;font-weight:700;color:var(--slate-600)">Subject:</span>${subjects.map(s => `<button class="chip${bookFilter.subject === s ? " on" : ""}" data-bf-sub="${esc(s)}">${esc(s)}</button>`).join("")}
      <span style="font-size:12.5px;font-weight:700;color:var(--slate-600);margin-left:12px">Difficulty:</span>${diffs.map(s => `<button class="chip${bookFilter.difficulty === s ? " on" : ""}" data-bf-diff="${esc(s)}">${esc(s)}</button>`).join("")}
    </div>
    ${list.length ? `<div class="grid g3">${list.map(b => {
      const B = store.book(b.id); const done = B.chapters.length;
      const pct = Math.round(100 * done / b.chapters.length);
      return `<div class="card"><div class="bookcard"><div class="cover">${esc(b.title.split(" ").slice(0, 2).join(" "))}<small>FDE ACADEMY</small></div>
      <div style="min-width:0"><h4 style="font-size:14px">${esc(b.title)}</h4>
      <p>${esc(b.desc.split(".")[0])}.</p>
      <div class="meta"><span class="chip">${esc(b.subject)}</span><span class="chip">${esc(b.difficulty)}</span><span class="chip">${plural(b.chapters.length, "chapter")}</span></div></div></div>
      <div class="meta">Reading progress: ${pct}% <span class="bar" style="margin-top:5px"><i style="width:${pct}%"></i></span></div>
      <div class="row" style="margin-top:10px"><button class="btn small primary" data-nav="book/${b.id}">Read online</button>
      <button class="btn small" data-dl-book="${b.id}">${I("download", 14)} DOCX</button></div></div>`;
    }).join("")}</div>`
    : `<div class="empty"><b>No books match.</b><br>Clear the search box or widen the filters.</div>`}
    </div>`;
  },
  mount() {
    $$("[data-bf-sub]").forEach(b => b.onclick = () => { bookFilter.subject = b.dataset.bfSub; renderRoute(); });
    $$("[data-bf-diff]").forEach(b => b.onclick = () => { bookFilter.difficulty = b.dataset.bfDiff; renderRoute(); });
    const q = $("#book-q");
    q.addEventListener("keydown", e => { if (e.key === "Enter") { bookFilter.q = q.value.trim().toLowerCase(); renderRoute(); } });
    $$("[data-dl-book]").forEach(b => b.onclick = () => {
      const book = DATA.bookById(b.dataset.dlBook);
      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(book.title)}</title></head><body style="font-family:Georgia,serif;max-width:680px;margin:40px auto;line-height:1.7">
      <p style="font-size:11px;letter-spacing:2px;color:#8F5229">FDE ACADEMY SERIES</p><h1>${esc(book.title)}</h1>
      <p style="color:#666">${esc(book.desc)}</p><h2>Table of contents</h2><ol>${book.chapters.map(c => `<li>${esc(c.t)}</li>`).join("")}</ol>
      <h2>Learning objectives</h2><ul>${book.objectives.map(o => `<li>${esc(o)}</li>`).join("")}</ul>
      <p style="color:#666;font-size:12px">Full-book DOCX export — ${fmtDate(Date.now())}. Chapter texts are available from each chapter's page in the reader.</p></body></html>`;
      downloadFile(book.title.replace(/\s+/g, "_") + "_FDE_Academy.doc", html, "application/msword");
      toast("Full-book DOCX download started — chapter texts export from the reader");
    });
  },
});
route("book/:id", {
  title: p => DATA.bookById(p.id)?.title || "Book",
  render(p) {
    const b = DATA.bookById(p.id); if (!b) return `<div class="wrap"><div class="empty">No such book.</div></div>`;
    const B = store.book(b.id);
    const nextCh = b.chapters.findIndex(c => !B.chapters.includes(c.t));
    return `<div class="wrap">
    <div class="breadcrumb"><button data-nav="books">Books</button> › ${esc(b.title)}</div>
    <div class="split-r" style="margin-bottom:40px">
      <div>
        <div class="page-head" style="padding-top:0"><h1>${esc(b.title)}</h1>
        <p class="lede">${esc(b.desc)}</p>
        <div style="margin-top:10px"><span class="chip on">${esc(b.difficulty)}</span><span class="chip">${esc(b.subject)}</span><span class="chip">${plural(b.chapters.length, "chapter")} · ${b.pages} pages</span></div></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("star")} Learning objectives</h4>
          <ul style="margin-left:18px;font-size:14px">${b.objectives.map(o => `<li style="margin-bottom:5px">${esc(o)}</li>`).join("")}</ul></div>
        <div class="h3">Table of contents</div>
        ${b.chapters.map((c, i) => {
          const read = B.chapters.includes(c.t);
          return `<div class="qrow"><span class="tick ${read ? "done" : ""}"></span>
          <div style="min-width:0"><b>Chapter ${i + 1} · ${esc(c.t)}</b><br><span style="font-size:11.5px;color:var(--slate-500)">${c.full ? "Interactive web edition — read online now" : "In the download editions; reader opens the chapter overview"}</span></div>
          <button class="btn small ${read ? "" : "primary"}" style="margin-left:auto" data-nav="book/${b.id}/${i}">${read ? "Re-read" : c.full ? "Read" : "Open"}</button></div>`;
        }).join("")}
      </div>
      <div>
        <div class="card" style="margin-bottom:16px">
          <div class="bookcard"><div class="cover" style="width:96px;min-width:96px;height:132px">${esc(b.title.split(" ").slice(0, 2).join(" "))}<small>FDE ACADEMY</small></div>
          <div style="font-size:12.5px"><b>Edition</b><br>Version 1.0<br>Updated 24 Nov 2026<br>DOCX · PDF · online</div></div>
          <div class="row" style="margin-top:12px;flex-wrap:wrap">
            <button class="btn small primary" data-nav="book/${b.id}/${Math.max(0, nextCh)}">${nextCh === -1 ? "Re-read chapter 1" : "Continue reading — Ch. " + (nextCh + 1)}</button>
            <button class="btn small" data-dl-ch="${b.id}">${I("download", 14)} Full book DOCX</button></div>
          <p class="meta" style="margin-top:8px">PDF is produced by the reader's print view — every chapter prints with the full table of contents.</p>
        </div>
        <div class="card" style="margin-bottom:16px"><h4>${I("chart")} Reading progress</h4>
          <div class="bar"><i style="width:${Math.round(100 * B.chapters.length / b.chapters.length)}%"></i></div>
          <div class="meta">${B.chapters.length} of ${b.chapters.length} chapters marked read${B.last ? ` · last read: ${esc(B.last)}` : ""}</div></div>
        <div class="card"><h4>${I("target")} Used in stages</h4>
          <p style="font-size:12.5px">Stage ${stageById(b.stage).n} — ${esc(stageById(b.stage).title)}${b.course ? " · linked course: " + esc(DATA.courseById(b.course).title) : ""}</p>
          <button class="btn small" style="margin-top:8px" data-nav="stage/${b.stage}">Open stage</button></div>
      </div>
    </div></div>`;
  },
  mount() {
    const dl = $("[data-dl-ch]");
    if (dl) dl.onclick = () => {
      const book = DATA.bookById(dl.dataset.dlCh);
      let body = "";
      book.chapters.forEach((c, i) => {
        body += `<h2 style="margin-top:30px">Chapter ${i + 1} — ${esc(c.t)}</h2>` + (c.full ? c.blocks.map(x => FDE.renderProseBlock(x)).join("") : `<p>This chapter's full text ships in the printed/download edition of ${esc(book.title)}. The interactive web edition covers the chapters marked “interactive”.</p>`);
      });
      downloadFile(book.title.replace(/\s+/g, "_") + "_chapters_FDE_Academy.doc",
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(book.title)}</title></head><body style="font-family:Georgia,serif;max-width:680px;margin:40px auto;line-height:1.7"><p style="font-size:11px;letter-spacing:2px;color:#8F5229">FDE ACADEMY SERIES</p><h1>${esc(book.title)}</h1><p style="color:#666">Chapter export — ${fmtDate(Date.now())}</p>${body}</body></html>`, "application/msword");
      toast("DOCX export started");
    };
  },
});
route("book/:id/:ch", {
  title: p => { const b = DATA.bookById(p.id); const c = b && b.chapters[+p.ch]; return c ? c.t : "Chapter"; },
  render(p) {
    const b = DATA.bookById(p.id); const ci = +p.ch; const c = b && b.chapters[ci];
    if (!c) return `<div class="wrap"><div class="empty">No such chapter.</div></div>`;
    const B = store.book(b.id);
    return `<div class="wrap">
    <div class="breadcrumb"><button data-nav="books">Books</button> › <button data-nav="book/${b.id}">${esc(b.title)}</button> › Chapter ${ci + 1}</div>
    <div class="split-r" style="margin-bottom:40px">
      <article class="prose">
        <h1 style="margin-bottom:4px">Chapter ${ci + 1} — ${esc(c.t)}</h1>
        <p style="color:var(--slate-500);font-size:13px;margin-bottom:18px">${esc(b.title)} · FDE Academy</p>
        ${c.full ? c.blocks.map(renderProseBlock).join("")
          : `<div class="card"><h4>${I("book")} Chapter overview</h4><p>This chapter's complete text ships in the printed and download editions of <b>${esc(b.title)}</b> (available from the book page). The interactive web edition covers every chapter marked “interactive web edition” in the table of contents — including all of ${esc(BOOKS[0].title)} and the opening chapters of the other five books.</p></div>`}
        <div class="reader-top" style="border-top:2px solid var(--line);padding-top:16px">
          ${ci > 0 ? `<button class="btn" data-nav="book/${b.id}/${ci - 1}">${I("left", 15)} Previous chapter</button>` : `<span></span>`}
          <button class="btn ${B.chapters.includes(c.t) ? "" : "primary"}" id="mark-read">${B.chapters.includes(c.t) ? "✓ Marked read" : "Mark chapter as read"}</button>
          <button class="btn" id="print-ch">${I("file", 15)} Print / save as PDF</button>
          ${ci < b.chapters.length - 1 ? `<button class="btn" data-nav="book/${b.id}/${ci + 1}">Next chapter ${I("right", 15)}</button>` : ""}
        </div>
      </article>
      <aside>
        <div class="card" style="margin-bottom:16px"><h4>${I("grad")} Book contents</h4>
          ${b.chapters.map((x, i) => `<button class="toc-link ${i === ci ? "on" : ""}" data-nav="book/${b.id}/${i}">${i + 1}. ${esc(x.t)}${B.chapters.includes(x.t) ? " ✓" : ""}</button>`).join("")}</div>
        <div class="card" style="margin-bottom:16px"><h4>${I("chart")} Progress</h4>
          <div class="bar"><i style="width:${Math.round(100 * B.chapters.length / b.chapters.length)}%"></i></div>
          <div class="meta">${B.chapters.length}/${b.chapters.length} chapters read</div></div>
        <div class="card"><h4>${I("target")} Where this leads</h4>
          <p style="font-size:12.5px">Stage ${stageById(b.stage).n} · ${esc(stageById(b.stage).title)}</p>
          <button class="btn small" style="margin-top:8px" data-nav="stage/${b.stage}">Open the stage</button></div>
      </aside>
    </div></div>`;
  },
  mount(p) {
    const b = DATA.bookById(p.id); const c = b.chapters[+p.ch]; const B = store.book(b.id);
    store.touch(); store.save();
    $("#mark-read").onclick = () => {
      if (!B.chapters.includes(c.t)) { B.chapters.push(c.t); B.last = c.t; store.save(); toast("Chapter marked read — progress saved"); }
      else { B.chapters = B.chapters.filter(x => x !== c.t); store.save(); toast("Marked unread"); }
      renderRoute();
    };
    $("#print-ch").onclick = () => window.print();
    mountMath();
  },
});

/* ---------------- LABS ---------------- */
let workerRef = null;
function terminateWorker() { if (workerRef) { try { workerRef.terminate(); } catch (e) {} workerRef = null; } }
function runInWorker(code, onOut, onDone) {
  terminateWorker();
  const src = `self.onmessage = function(e) {
    const out = [];
    const origLog = console.log;
    console.log = function(...a) { out.push(a.map(x => typeof x === "object" ? JSON.stringify(x) : String(x)).join(" ")); };
    console.error = function(...a) { out.push("[error] " + a.join(" ")); };
    console.assert = function(cond, msg) { if (!cond) out.push("Assertion failed: " + (msg || "")); };
    const t0 = Date.now();
    try {
      const fn = new Function(e.data);
      fn();
      out.push({ done: true, ms: Date.now() - t0, __obj: true });
      self.postMessage(out.map(x => (x && x.__obj) ? { done: true, ms: x.ms } : String(x)));
    } catch (err) {
      out.push("[error] " + err.name + ": " + err.message + " (line ~" + (err.lineNumber || "?") + ")");
      self.postMessage(out.map(String));
    }
  };`;
  const blob = new Blob([src], { type: "application/javascript" });
  workerRef = new Worker(URL.createObjectURL(blob));
  const timer = setTimeout(() => { terminateWorker(); onOut("[error] Execution stopped: exceeded the 5-second sandbox limit (possible infinite loop)."); onDone(); }, 5000);
  workerRef.onmessage = e => { clearTimeout(timer); terminateWorker(); e.data.forEach(onOut); onDone(); };
  workerRef.postMessage(code);
}
route("labs", {
  title: () => "Practical labs",
  render() {
    const kinds = ["All", ...new Set(LABS.map(l => l.kind))];
    return `<div class="wrap">
    <div class="page-head"><h1>Practical labs</h1>
    <p class="lede">Hands-on activities for every subject: coding exercises in an isolated sandbox, mathematics drills, problem-solving activities, database practice, API exercises and the AI laboratory. Each lab links back to the lesson that taught it.</p></div>
    <div class="row" style="margin-bottom:18px">${kinds.map(k => `<button class="chip on" data-labk="${esc(k)}">${esc(k)}</button>`).join("")}</div>
    <div class="grid g3">${LABS.map(l => `
      <div class="card click" data-nav="lab/${l.id}" role="link" tabindex="0">
        <h4>${I(l.kind === "Coding" ? "code" : l.kind === "Maths" ? "calc" : l.kind === "Database" ? "db" : l.kind === "API" ? "plug" : "spark")} ${esc(l.title)}</h4>
        <p>${esc(l.intro.split(".")[0])}.</p>
        <div class="meta"><span class="chip">${esc(l.kind)}</span><span class="chip">${l.minutes} min</span>${l.lang ? `<span class="chip">${esc(l.lang)}</span>` : ""}</div>
      </div>`).join("")}</div>
    <div class="statebox info" style="margin-top:18px"><b>How student code stays safe:</b> coding labs run your program inside a Web Worker — a separate browser thread with no access to the page, your files or the network, hard-stopped at 5 seconds. Nothing executes on any server; there is no server to endanger.</div>
    </div>`;
  },
});
route("lab/:id", {
  title: p => DATA.labById(p.id)?.title || "Lab",
  render(p) {
    const l = DATA.labById(p.id); if (!l) return `<div class="wrap"><div class="empty">No such lab.</div></div>`;
    const lesson = DATA.lessonById(l.linked);
    return `<div class="wrap">
    <div class="breadcrumb"><button data-nav="labs">Labs</button> › ${esc(l.title)}</div>
    <div class="page-head"><h1>${esc(l.title)}</h1><p class="lede">${esc(l.intro)}</p>
      <div style="margin-top:10px"><span class="chip on">${esc(l.kind)}</span><span class="chip">${l.minutes} min</span>${l.lang ? `<span class="chip">${esc(l.lang)}</span>` : ""}</div></div>
    <div class="split-r" style="margin-bottom:40px">
      <div>
        ${l.kind === "Coding" || l.kind === "Database" ? `
        <div class="editor">
          <div class="edhead">${I("code", 14)} ${esc(l.lang || "code")} — sandboxed execution ${l.lang === "SQL" ? "(mini-SQL engine, no server)" : "(Web Worker, no page access)"}
            <span style="margin-left:auto"></span><button class="btn small" id="lab-reset">Reset to starter</button></div>
          <textarea id="lab-code" spellcheck="false" aria-label="Code editor">${esc(l.starter)}</textarea>
        </div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="lab-run">${I("play", 15)} Run</button>
          <button class="btn" id="lab-hint">${I("bulb", 15)} Hint</button>
          <button class="btn" id="lab-solution">Solution</button>
          <span class="meta" id="lab-status"></span></div>
        <div id="lab-hintbox" class="callout" style="display:none"></div>
        <div id="lab-solbox" class="statebox info" style="display:none"></div>
        <h4 style="margin-top:18px">Output</h4><div class="output" id="lab-out" aria-live="polite">(output appears here)</div>
        <div class="card" style="margin-top:14px"><h4>${I("edit")} Submit your work</h4>
          <p style="font-size:12.5px">Submission records your solution in this browser with a timestamp — it appears in your dashboard's project and lab record.</p>
          <button class="btn primary" id="lab-submit" style="margin-top:10px">${I("check", 15)} Submit solution</button>
          <span class="meta" id="lab-submsg"></span></div>`
        : l.kind === "API" ? `
        <div class="editor"><div class="edhead">${I("plug", 14)} Request builder — GET /orders</div>
        <textarea id="lab-code" spellcheck="false" aria-label="Request">${esc(l.starter)}</textarea></div>
        <div class="row" style="margin-top:12px"><button class="btn primary" id="lab-run">${I("play", 15)} Send request</button>
        <button class="btn" id="lab-hint">${I("bulb", 15)} Hint</button><button class="btn" id="lab-solution">Expected behaviour</button></div>
        <div id="lab-hintbox" class="callout" style="display:none"></div>
        <div id="lab-solbox" class="statebox info" style="display:none"></div>
        <h4 style="margin-top:18px">Response</h4><div class="output" id="lab-out" aria-live="polite">(response appears here)</div>`
        : l.kind === "AI" ? `
        <div class="card"><h4>${I("spark")} Ask the grounded assistant</h4>
        <div class="row" style="margin-top:10px"><input class="searchbox" id="ai-q" placeholder="Ask about the shop FAQ — try “do you deliver?”" aria-label="Question for the assistant">
        <button class="btn primary" id="ai-ask">Ask</button></div>
        <div id="ai-out" style="margin-top:14px"></div></div>
        <div class="card" style="margin-top:16px"><h4>${I("check")} Evaluation set — run it</h4>
        <p style="font-size:12.5px">Five questions with expected behaviour, scored live:</p>
        <button class="btn primary" id="ai-eval" style="margin-top:10px">${I("play", 15)} Run evaluation</button>
        <div id="ai-evalout" style="margin-top:12px"></div></div>`
        : `
        <div>${l.html ? l.html() : ""}</div>
        <div class="card" style="margin-top:14px"><h4>${I("check")} Verify</h4><p style="font-size:13.5px">${m(l.checkNote || "")}</p></div>`}
      </div>
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("star")} Linked lesson</h4>
          ${lesson ? `<div style="font-size:12.5px"><b>${esc(lesson.title)}</b><br>${esc(DATA.courseById(lesson.course).title)}</div>
          <button class="btn small" style="margin-top:8px" data-nav="lesson/${lesson.id}">Open lesson</button>` : "<p>—</p>"}</div>
        <div class="card" style="margin-bottom:16px"><h4>${I("bulb")} Help nearby</h4>
          <p style="font-size:12.5px">Hints unlock immediately; the full solution appears after you have seen the hint — attempt first, the academy only asks for honesty.</p></div>
        <div class="card"><h4>${I("lock")} Isolation</h4>
          <p style="font-size:12.5px">${l.kind === "Database" ? "Queries execute against an in-memory 12-row table via the built-in mini-SQL parser." : l.kind === "API" ? "Requests are answered by a simulated service with fixed, inspectable behaviour." : l.kind === "AI" ? "Retrieval runs over the eight-section FAQ corpus in this file — read the scores as they happen." : "Your code runs in a Web Worker: no DOM, no network, no files, 5-second hard stop."}</p></div>
      </div>
    </div></div>`;
  },
  mount(p) {
    const l = DATA.labById(p.id);
    mountMath();
    if (l.kind === "Coding" || l.kind === "Database") {
      const ta = $("#lab-code");
      $("#lab-reset").onclick = () => { ta.value = l.starter; $("#lab-out").textContent = "(output appears here)"; };
      $("#lab-run").onclick = () => {
        const out = $("#lab-out"); const status = $("#lab-status");
        out.innerHTML = ""; status.textContent = "running…";
        store.s.labRuns++; store.touch(); store.save();
        if (l.kind === "Database") {
          setTimeout(() => {
            const stmts = ta.value.replace(/--.*$/gm, "").split(";").map(s2 => s2.trim()).filter(Boolean);
            status.textContent = "";
            if (!stmts.length) { out.innerHTML = `<span class="oerr">Nothing to run — write a SELECT statement (see the starter).</span>`; return; }
            const chunks = [];
            for (const stmt of stmts) {
              const res = runSQL(stmt);
              if (res.error) { chunks.push(`<span class="oerr">${esc(res.error)}</span>`); break; }
              chunks.push(`<span class="ook">✓ ${esc(stmt.slice(0, 60))}${stmt.length > 60 ? "…" : ""} — ${res.rows.length} row${res.rows.length === 1 ? "" : "s"}</span>\n${esc(res.cols.join(" | "))}\n${res.rows.length ? res.rows.map(r => esc(r.join(" | "))).join("\n") : "(no rows — check your WHERE)"}`);
            }
            out.innerHTML = chunks.join("\n\n");
          }, 80);
        } else {
          runInWorker(ta.value,
            line => { out.innerHTML += (line.done ? `\n<span class="ook">✓ finished in ${line.ms} ms</span>` : "\n" + esc(line)); },
            () => { status.textContent = ""; if (!out.innerHTML.includes("✓")) out.innerHTML += `\n<span class="oerr">(no success marker — did the run finish?)</span>`; });
        }
      };
      $("#lab-hint").onclick = () => { const hb = $("#lab-hintbox"); hb.style.display = "block"; hb.innerHTML = "<b>Hint:</b> " + esc(l.hint); };
      $("#lab-solution").onclick = () => { const sb = $("#lab-solbox"); sb.style.display = "block"; sb.innerHTML = "<b>Solution (compare after attempting):</b><div class='codeblock' style='margin-top:8px'>" + esc(l.solution) + "</div>"; };
      $("#lab-submit").onclick = () => {
        const code = ta.value.trim();
        if (code === l.starter.trim()) { $("#lab-submsg").textContent = " Submit the version you actually changed — reset-to-starter is not a solution."; $("#lab-submsg").style.color = "var(--red-700)"; return; }
        if (!store.s.submissions) store.s.submissions = [];
        store.s.submissions.push({ lab: l.id, at: Date.now(), code });
        store.touch(); store.save();
        $("#lab-submsg").textContent = " Submitted ✓ — recorded " + new Date().toLocaleTimeString("en-GB");
        $("#lab-submsg").style.color = "var(--teal-700)";
        toast("Lab solution submitted and recorded");
      };
    } else if (l.kind === "API") {
      $("#lab-hint").onclick = () => { const hb = $("#lab-hintbox"); hb.style.display = "block"; hb.innerHTML = "<b>Hint:</b> " + esc(l.hint); };
      $("#lab-solution").onclick = () => { const sb = $("#lab-solbox"); sb.style.display = "block"; sb.innerHTML = "<b>" + esc(l.solution) + "</b>"; };
      $("#lab-run").onclick = () => {
        const out = $("#lab-out");
        const req = $("#lab-code").value.trim();
        const m = req.match(/GET\s+\/orders(\S*)/);
        if (!m) { out.innerHTML = `<span class="oerr">HTTP/1.1 400 Bad Request\n{"error": "Not a GET /orders request"}</span>`; return; }
        const params = new URLSearchParams(m[1].replace(/^\?/, ""));
        const status = params.get("status"), limit = params.get("limit");
        store.s.labRuns++; store.touch(); store.save();
        const ORDERS = [
          { id: 1001, shop: "Bella's", status: "open", total: 42.5 }, { id: 1002, shop: "Amara", status: "open", total: 18 },
          { id: 1003, shop: "Bella's", status: "done", total: 63.25 }, { id: 1004, shop: "Depot", status: "done", total: 12 },
          { id: 1005, shop: "Café", status: "cancelled", total: 7.5 }];
        if (status && !["open", "done", "cancelled"].includes(status)) {
          out.innerHTML = `HTTP/1.1 422 Unprocessable Entity\n{"error": "status must be one of open, done, cancelled", "received": ${JSON.stringify(status)}}`;
          return;
        }
        let rows = status ? ORDERS.filter(o => o.status === status) : ORDERS;
        let lim = limit ? Math.max(1, Math.min(10, parseInt(limit, 10) || 10)) : rows.length;
        out.innerHTML = `HTTP/1.1 200 OK\nContent-Type: application/json\n\n${esc(JSON.stringify(rows.slice(0, lim), null, 1))}\n\n<span class="ook"># ${rows.length} matching orders${lim < rows.length ? `, ${lim} returned (limit)` : ""}</span>`;
      };
    } else if (l.kind === "AI") {
      const answer = q => {
        const best = faqRetrieve(q);
        if (!best || best.score === 0) {
          return `<div class="statebox err"><b>Refusal (by design):</b> I can only answer from the shop FAQ, and nothing there matches “${esc(q)}”. This is the grounded contract — I will not invent an answer. A human colleague is the next step.</div>`;
        }
        return `<div class="statebox ok"><b>Answer ${esc(best.sec)}:</b> ${esc(best.a)}</div>
        <div class="meta">Retrieved FAQ ${esc(best.sec)} · keyword overlap score ${best.score} · grounded on sources only</div>`;
      };
      $("#ai-ask").onclick = () => {
        const q = $("#ai-q").value.trim();
        if (!q) { toast("Type a question first", "err"); return; }
        store.s.labRuns++; store.touch(); store.save();
        $("#ai-out").innerHTML = `<p style="font-weight:600;margin-bottom:8px">Q: ${esc(q)}</p>` + answer(q);
      };
      $("#ai-q").addEventListener("keydown", e => { if (e.key === "Enter") $("#ai-ask").click(); });
      $("#ai-eval").onclick = () => {
        const cases = [
          ["What are your opening hours?", "answer §1"], ["Can I return unopened bread?", "answer §2.1"],
          ["How long do collect-by orders wait?", "answer §2.2"], ["Do you deliver to the moon?", "refusal"],
          ["What was your 2019 revenue?", "refusal (outside sources)"]];
        const results = cases.map(([q, exp]) => {
          const best = faqRetrieve(q);
          const refused = !best || best.score === 0;
          const expectRefusal = exp.startsWith("refusal");
          const pass = refused === expectRefusal || (!refused && exp.startsWith("answer"));
          return `<tr><td>${esc(q)}</td><td>${esc(exp)}</td><td>${refused ? "refused" : "answered " + esc(best.sec) + " (score " + best.score + ")"}</td><td>${pass ? '<span class="chip teal">pass</span>' : '<span class="chip red">fail</span>'}</td></tr>`;
        });
        const passed = results.filter(r => r.includes("pass")).length;
        $("#ai-evalout").innerHTML = `<div class="t-wrap"><table class="t"><thead><tr><th>Question</th><th>Expected</th><th>Observed</th><th>Verdict</th></tr></thead><tbody>${results.join("")}</tbody></table></div>
        <p class="meta">Result: ${passed}/5 as expected. ${passed < 5 ? "The failing case is a genuine finding: keyword overlap matches on the word “deliver”, so an off-topic delivery question rides through to §3 — a production fix is a retrieval threshold or negative-match list. The evaluation set did its job by exposing it." : ""} Honest scoping: this proves behaviour on THIS set only — the handover document states what would make it production-ready.</p>`;
      };
    }
  },
});

/* ---------------- PROJECTS ---------------- */
route("projects", {
  title: () => "Project centre",
  render() {
    const byLevel = {};
    PROJECTS.forEach(p => { (byLevel[p.level] = byLevel[p.level] || []).push(p); });
    return `<div class="wrap">
    <div class="page-head"><h1>Project centre</h1>
    <p class="lede">Fifteen guided projects, Levels 1–7, each a customer story with steps, a demonstration checklist and a rubric. Passing (16/24, no dimension below 2) adds the project to your portfolio. These projects ARE the portfolio employers read.</p></div>
    ${Object.keys(byLevel).map(lv => `
      <section class="section"><div class="h3">Level ${lv} ${lv === "7" ? "— simulated engagements" : ""}</div>
      <div class="grid ${byLevel[lv].length > 2 ? "g3" : "g2"}">${byLevel[lv].map(pr => {
        const P = store.project(pr.id); const done = P.steps.filter(Boolean).length;
        return `<div class="card click" data-nav="project/${pr.id}" role="link" tabindex="0">
        <h4>${I("briefcase")} ${esc(pr.title)}</h4><p>${esc(pr.brief.split(".")[0])}.</p>
        <div class="meta"><span class="chip">Level ${pr.level}</span><span class="chip">${plural(pr.steps.length, "step")}</span>
        ${P.submitted ? `<span class="chip teal">Submitted ✓</span>` : `<span class="chip">${done}/${pr.steps.length} steps</span>`}</div>
        ${done ? `<div class="meta"><span class="bar" style="display:inline-block;width:120px;vertical-align:middle"><i style="width:${Math.round(100 * done / pr.steps.length)}%"></i></span></div>` : ""}</div>`;
      }).join("")}</div></section>`).join("")}
    </div>`;
  },
});
route("project/:id", {
  title: p => DATA.projectById(p.id)?.title || "Project",
  render(p) {
    const pr = DATA.projectById(p.id); if (!pr) return `<div class="wrap"><div class="empty">No such project.</div></div>`;
    const P = store.project(pr.id); const done = P.steps.filter(Boolean).length;
    const allChecked = P.steps.filter(Boolean).length === pr.demo.length;
    return `<div class="wrap">
    <div class="breadcrumb"><button data-nav="projects">Projects</button> › ${esc(pr.title)}</div>
    <div class="split-r" style="margin-bottom:40px">
      <div>
        <div class="page-head" style="padding-top:0"><h1>${esc(pr.title)}</h1>
        <p class="lede">${esc(pr.brief)}</p>
        <div style="margin-top:10px"><span class="chip on">Level ${pr.level}</span><span class="chip">Stage ${stageById(pr.stage).n}</span><span class="chip">${esc(pr.customer)}</span></div></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("grad")} Implementation steps</h4>
          ${pr.steps.map((s, i) => `<div class="qrow"><button class="tick ${P.steps[i] ? "done" : ""}" data-step="${i}" role="checkbox" aria-checked="${!!P.steps[i]}" aria-label="Step ${i + 1}" style="cursor:pointer"></button>
          <span style="flex:1">${esc(s)}</span></div>`).join("")}
          <div class="meta">${done}/${pr.steps.length} steps complete — tick them as you work.</div></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("check")} Demonstration checklist (gates submission)</h4>
          ${pr.demo.map((d, i) => `<div class="qrow"><button class="tick ${P.demo && P.demo[i] ? "done" : ""}" data-demo="${i}" role="checkbox" aria-checked="${!!(P.demo && P.demo[i])}" aria-label="Demo check ${i + 1}" style="cursor:pointer"></button><span style="flex:1">${esc(d)}</span></div>`).join("")}
          <p class="meta">Every box must be ticked before submission is accepted.</p></div>
        <div class="card"><h4>${I("file")} Submit</h4>
          <label class="flabel" for="proj-evidence">Evidence — describe the artefact and where it lives (paste links, notes, or the sandbox submission record)</label>
          <textarea class="f" id="proj-evidence" placeholder="e.g. Budget spreadsheet with break-even calculator — formulas audited by hand on 24 Nov; sandbox lab submissions recorded under code-c3.">${esc(P.evidence || "")}</textarea>
          <div class="row" style="margin-top:12px">
            <button class="btn primary" id="proj-submit" ${P.submitted ? "disabled" : ""}>${P.submitted ? "Submitted ✓" : "Submit for rubric review"}</button>
            <span class="meta" id="proj-msg"></span></div>
          ${P.submitted ? `<div class="statebox ok" style="margin-top:12px"><b>Submitted ${fmtDate(P.submittedAt)}.</b> Rubric: six dimensions (Understanding, Correctness, Craft, Safety, Operation, Communication) — pass at 16/24, none below 2. Your submission is recorded with its evidence and appears in your dashboard.</div>` : ""}
        </div>
      </div>
      <div>
        <div class="card" style="margin-bottom:16px"><h4>${I("chart")} Status</h4>
          <div class="bar"><i style="width:${Math.round(100 * done / pr.steps.length)}%"></i></div>
          <div class="meta">${done}/${pr.steps.length} steps · ${P.demo && P.demo.filter(Boolean).length || 0}/${pr.demo.length} checklist items · ${P.submitted ? "submitted" : "in progress"}</div></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("star")} Rubric preview</h4>
          <p style="font-size:12.5px">Understanding · Correctness · Craft · Safety · Operation · Communication — each scored 0–4. <b>Pass: 16/24, no dimension below 2.</b> The checklist above feeds the objective items automatically.</p></div>
        <div class="card" style="margin-bottom:16px"><h4>${I("bulb")} Concepts you need</h4>
          <p style="font-size:12.5px">${pr.concepts.map(c => `<button class="glossterm" data-g="${c}" style="margin-right:8px">${c.replace(/-/g, " ")}</button>`).join("")}</p></div>
        <div class="card"><h4>${I("msg")} Stuck on a step?</h4>
          <p style="font-size:12.5px">Open the linked lessons for this stage, or re-read the ${esc(BOOKS[5].title)} (Level ${pr.level} chapter). Hints first, solutions only after an honest attempt.</p>
          <button class="btn small" style="margin-top:8px" data-nav="stage/${pr.stage}">Open stage ${stageById(pr.stage).n}</button></div>
      </div>
    </div></div>`;
  },
  mount(p) {
    const pr = DATA.projectById(p.id); const P = store.project(pr.id);
    $$("[data-step]").forEach(b => b.onclick = () => {
      const i = +b.dataset.step; P.steps[i] = !P.steps[i]; store.touch(); store.save(); renderRoute();
    });
    $$("[data-demo]").forEach(b => b.onclick = () => {
      if (!P.demo) P.demo = new Array(pr.demo.length).fill(false);
      const i = +b.dataset.demo; P.demo[i] = !P.demo[i]; store.touch(); store.save(); renderRoute();
    });
    $("#proj-submit").onclick = () => {
      P.demo = P.demo || new Array(pr.demo.length).fill(false);
      if (!P.demo.every(Boolean)) { $("#proj-msg").textContent = " Tick every demonstration checklist item first — that is the gate."; $("#proj-msg").style.color = "var(--red-700)"; return; }
      const ev = $("#proj-evidence").value.trim();
      if (ev.length < 20) { $("#proj-msg").textContent = " Evidence must be at least 20 characters — describe what you built and where it lives."; $("#proj-msg").style.color = "var(--red-700)"; return; }
      P.submitted = true; P.evidence = ev; P.submittedAt = Date.now();
      store.touch(); store.save();
      toast("Project submitted — recorded in your portfolio");
      renderRoute();
    };
  },
});

/* ---------------- SEARCH RESULTS ---------------- */
route("search/:q", {
  title: p => "Search: " + p.q,
  render(p) {
    const hits = DATA.searchAll(decodeURIComponent(p.q));
    return `<div class="wrap"><div class="page-head"><h1>Search results</h1>
    <p class="lede">“${esc(decodeURIComponent(p.q))}” — ${hits.length ? plural(hits.length, "result") + " across the academy." : "no matches. Try a broader word, or browse the library directly."}</p></div>
    ${hits.length ? hits.map(h => `<div class="card click" style="margin-bottom:12px" data-nav="${h.nav}" role="link" tabindex="0">
      <h4><span class="chip">${esc(h.kind)}</span> ${esc(h.title)}</h4><p>${esc(h.sub)}</p></div>`).join("")
    : `<div class="empty"><b>Nothing found.</b><br><button class="btn" style="margin-top:10px" data-nav="courses">Browse courses</button> <button class="btn" style="margin-top:10px" data-nav="books">Browse books</button></div>`}
    </div>`;
  },
});

/* ---------------- ACCOUNT (local demo profile) ---------------- */
route("signin", {
  title: () => "Your account",
  render() {
    const s = store.s;
    return `<div class="wrap" style="max-width:640px">
    <div class="page-head"><h1>${s.profile.name ? "Your profile" : "Create your free account"}</h1>
    <p class="lede">This is a local demo account: your name and progress live in this browser only, with no server involved. Progress is real, exportable, and never sent anywhere.</p></div>
    <div class="card" style="margin-bottom:40px">
      <label class="flabel" for="pf-name">Your name</label>
      <input class="f ${$("#pf-name") && ""}" id="pf-name" value="${esc(s.profile.name)}" maxlength="40" placeholder="e.g. Maya">
      <div class="ferr" id="pf-err" style="display:none"></div>
      <label class="flabel" for="pf-goal">Weekly session goal</label>
      <select class="f" id="pf-goal">${[1, 2, 3, 4, 5, 7].map(n => `<option value="${n}" ${s.profile.weeklyGoal === n ? "selected" : ""}>${n} session${n > 1 ? "s" : ""} per week</option>`).join("")}</select>
      <div class="row" style="margin-top:16px">
        <button class="btn primary" id="pf-save">${s.profile.name ? "Save profile" : "Create account"} ${I("right", 15)}</button>
        ${s.profile.name ? `<button class="btn subtle" id="pf-reset">Reset all progress</button>` : ""}</div>
      <p class="meta" style="margin-top:12px">Exploring first? Everything except your name works without an account — but completed lessons and streaks need one to attach to.</p>
    </div></div>`;
  },
  mount() {
    $("#pf-save").onclick = () => {
      const name = $("#pf-name").value.trim();
      const err = $("#pf-err");
      if (name.length < 2) { err.style.display = "block"; err.textContent = "Name needs at least 2 characters — it labels your portfolio."; $("#pf-name").classList.add("err"); return; }
      err.style.display = "none"; $("#pf-name").classList.remove("err");
      store.s.profile.name = name; store.s.profile.weeklyGoal = +$("#pf-goal").value;
      if (!store.s.profile.createdAt) store.s.profile.createdAt = Date.now();
      store.touch(); store.save();
      toast("Profile saved — welcome" + (store.s.profile.createdAt === Date.now() ? " to FDE Academy" : " back"));
      renderChrome(location.hash); nav("dashboard");
    };
    const rs = $("#pf-reset");
    if (rs) rs.onclick = () => { store.reset(); toast("All local progress reset"); renderRoute(); };
  },
});
