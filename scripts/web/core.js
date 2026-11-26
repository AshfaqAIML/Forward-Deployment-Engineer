/* ============ FDE Academy — core engine: store, router, icons, math & interactive components ============ */
"use strict";
const FDE = {};

/* ---------------- utilities ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (sel, el) => (el || document).querySelector(sel);
const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
const fmtDate = ts => new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const todayStr = () => new Date().toISOString().slice(0, 10);
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");

/* ---------------- icons ---------------- */
const ICON_PATHS = {
  home: 'M3 11.5 12 4l9 7.5M5.5 10v9h13v-9', menu: 'M4 7h16M4 12h16M4 17h16',
  search: 'M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13Zm9.5 3-4.9-4.9',
  check: 'M4.5 12.5l5 5 10-11', book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5ZM4 18a2.5 2.5 0 0 1 2.5-2.5H20',
  code: 'M8.5 7 4 12l4.5 5M15.5 7 20 12l-4.5 5', flask: 'M9.5 3h5M10.5 3v6l-5.5 9a1.8 1.8 0 0 0 1.6 2.7h10.8a1.8 1.8 0 0 0 1.6-2.7L13.5 9V3M7.5 14.5h9',
  chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8', target: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-4.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Zm0-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z',
  briefcase: 'M4 8.5h16a1 1 0 0 1 1 1V19a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19V9.5a1 1 0 0 1 1-1Zm5-1V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3 12.5h18',
  user: 'M12 11.5a3.75 3.75 0 1 1 0-7.5 3.75 3.75 0 0 1 0 7.5ZM4.5 20a7.5 7.5 0 0 1 15 0',
  right: 'M5 12h14M13 6l6 6-6 6', left: 'M19 12H5M11 6l-6 6 6 6',
  bookmark: 'M6.5 4h11v17l-5.5-4-5.5 4V4Z', noted: 'M6.5 4h11v17l-5.5-4-5.5 4V4Zm3 5h5M9.5 12h5',
  x: 'M6 6l12 12M18 6 6 18', alert: 'M12 3 2.5 20h19L12 3Zm0 6.5V14m0 3v.5',
  play: 'M7 5.5v13l11-6.5-11-6.5Z', download: 'M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M4.5 19.5h15',
  lock: 'M6.5 10.5h11V20h-11v-9.5Zm2.5 0V8a3.5 3.5 0 0 1 7 0v2.5', star: 'm12 4 2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7L12 4Z',
  bulb: 'M12 3a6.5 6.5 0 0 1 4 11.6c-.8.7-1.5 1.6-1.5 2.6V18h-5v-.8c0-1-.7-1.9-1.5-2.6A6.5 6.5 0 0 1 12 3Zm-2.5 18h5',
  shield: 'M12 3 5 6v5.5c0 4.6 3 7.6 7 9.5 4-1.9 7-4.9 7-9.5V6l-7-3Z', calc: 'M6 3.5h12v17H6v-17Zm2.5 3.5h7M8.5 11h2.5M8.5 14.5h2.5M13 11h2.5M13 14.5h2.5',
  db: 'M12 7.5c4.4 0 8-1.1 8-2.5s-3.6-2.5-8-2.5S4 3.6 4 5s3.6 2.5 8 2.5Zm8-2.5v14c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5V5m16 7c0 1.4-3.6 2.5-8 2.5S4 13.4 4 12',
  plug: 'M9 3.5V8m6-4.5V8M6.5 8h11v3a5.5 5.5 0 0 1-5.5 5.5A5.5 5.5 0 0 1 6.5 11V8ZM12 16.5V21',
  spark: 'M12 3.5 13.8 9l5.7 1.8L13.8 12.6 12 18l-1.8-5.4L4.5 10.8 10.2 9 12 3.5ZM19 16l.9 2.6L22.5 19.5l-2.6.9L19 23l-.9-2.6-2.6-.9 2.6-.9L19 16Z',
  file: 'M6.5 3h7L18.5 8v13h-12V3Zm7 0v5h5', edit: 'M4.5 19.5 6 15 16.5 4.5a1.8 1.8 0 0 1 3 3L9 18l-4.5 1.5Zm2-4 2 2',
  trash: 'M5 7h14M9.5 7V4.5h5V7M7 7l1 13h8l1-13M10.5 10v7m3-7v7',
  plus: 'M12 5v14M5 12h14', clock: 'M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Zm0-13.5V12l3.5 2',
  trophy: 'M7 4h10v5a5 5 0 0 1-10 0V4Zm10 1.5h3.5V8a3 3 0 0 1-3 3M7 5.5H3.5V8a3 3 0 0 0 3 3M12 14v4m-4 3h8m-8 0 1-3h6l1 3',
  msg: 'M4 5.5h16v11H12l-5 4v-4H4v-11Z', grad: 'M3 9.5 12 5l9 4.5-9 4.5L3 9.5Zm3 2.5v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.7M20 3.5V8h-4.5', settings: 'M12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-2.1-1.2L14.5 3h-5L9 5.7a7.6 7.6 0 0 0-2.1 1.2l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 2.1 1.2L9.5 21h5l.4-2.7a7.6 7.6 0 0 0 2.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
};
function I(name, size = 18) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICON_PATHS[name] || ICON_PATHS.star}"/></svg>`;
}
const LOGO_GLYPH = `<svg class="glyph" width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true"><rect x="2" y="2" width="26" height="26" rx="7" stroke="#1A2330" stroke-width="2.4"/><path d="M8 21 14 15l4 4 5-9" stroke="#C27E4D" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/* ---------------- toast ---------------- */
let toastTimer = null;
function toast(msg, type) {
  const root = $("#toast-root");
  root.innerHTML = `<div class="toast${type === "err" ? " err" : ""}" role="status">${esc(msg)}</div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { root.innerHTML = ""; }, 3800);
}

/* ---------------- store (client-side persistence layer) ---------------- */
const STORE_KEY = "fdeAcademy.v1";
const store = {
  s: null,
  blank() {
    return {
      profile: { name: "", createdAt: null, weeklyGoal: 3 },
      lessons: {}, books: {}, projects: {},
      attempts: [], days: [], glossaryEdits: { added: [], edited: {}, removed: [] },
      labRuns: 0, sample: false,
    };
  },
  load() {
    try { this.s = JSON.parse(localStorage.getItem(STORE_KEY)) || this.blank(); }
    catch (e) { this.s = this.blank(); }
    if (!this.s.profile) this.s = this.blank();
  },
  save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(this.s)); } catch (e) { /* private mode */ } },
  touch() { const d = todayStr(); if (!this.s.days.includes(d)) { this.s.days.push(d); this.save(); } },
  lesson(id) { return this.s.lessons[id] || (this.s.lessons[id] = { done: false, quizBest: 0, notes: "", bookmark: false, visits: 0 }); },
  book(id) { return this.s.books[id] || (this.s.books[id] = { chapters: [], last: null }); },
  project(id) { return this.s.projects[id] || (this.s.projects[id] = { steps: [], submitted: false, evidence: "", score: null, submittedAt: null }); },
  reset() { this.s = this.blank(); this.save(); },
  /* ---- derived, all computed from real recorded activity ---- */
  activeDays() { return [...new Set(this.s.days)].sort(); },
  streak() {
    const days = this.activeDays().map(d => new Date(d + "T12:00:00").getTime());
    if (!days.length) return { current: 0, longest: 0 };
    let longest = 1, run = 1;
    for (let i = 1; i < days.length; i++) {
      run = (days[i] - days[i - 1] === 86400000) ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    const last = days[days.length - 1]; const now = Date.now();
    const current = (now - last <= 86400000 * 1.5) ? run : 0;
    return { current: Math.max(current, days.length === 1 && (now - last <= 86400000 * 1.5) ? 1 : current), longest };
  },
  lessonDoneCount() { return Object.values(this.s.lessons).filter(l => l.done).length; },
  totalLessons() { return DATA.lessons.length; },
  overallPct() { return Math.round(100 * this.lessonDoneCount() / Math.max(1, this.totalLessons())); },
  currentStageId() {
    for (const st of DATA.stages) {
      const ls = DATA.lessons.filter(l => l.stage === st.id);
      if (ls.length && ls.some(l => !this.lesson(l.id).done)) return st.id;
    }
    return DATA.stages[DATA.stages.length - 1].id;
  },
  stageProgress(stageId) {
    const ls = DATA.lessons.filter(l => l.stage === stageId);
    if (!ls.length) return { done: 0, total: 0, pct: null };
    const done = ls.filter(l => this.lesson(l.id).done).length;
    return { done, total: ls.length, pct: Math.round(100 * done / ls.length) };
  },
  stageDone(stageId) { const p = this.stageProgress(stageId); return p.total > 0 && p.done === p.total; },
  stageState(stageId) {
    const order = DATA.stages.findIndex(s => s.id === stageId);
    if (this.stageDone(stageId)) return "done";
    const prevDone = DATA.stages.slice(0, order).every(s => this.stageDone(s.id) || !DATA.lessons.some(l => l.stage === s.id));
    return prevDone ? "current" : "upcoming";
  },
  recommended() {
    const sid = this.currentStageId();
    const ls = DATA.lessons.filter(l => l.stage === sid);
    const next = ls.find(l => !this.lesson(l.id).done) || ls[0];
    return next ? { lesson: next, stage: DATA.stages.find(s => s.id === sid) } : null;
  },
  quizAvg(n = 10) {
    const a = this.s.attempts.filter(x => x.kind === "quiz").slice(-n);
    if (!a.length) return null;
    return Math.round(100 * a.reduce((t, x) => t + x.score / x.total, 0) / a.length);
  },
  projectsDone() { return DATA.projects.filter(p => this.project(p.id).submitted).length; },
};
FDE.store = store;

/* ---------------- router ---------------- */
const ROUTES = [];
function route(pattern, view) { ROUTES.push({ pattern, view }); }
function matchRoute(hash) {
  const path = (hash || "#/").replace(/^#\/?/, "").replace(/\?.*$/, "");
  const parts = path.split("/").filter(Boolean);
  for (const r of ROUTES) {
    const segs = r.pattern.split("/").filter(Boolean);
    if (segs.length !== parts.length) continue;
    const params = {}; let ok = true;
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].startsWith(":")) params[segs[i].slice(1)] = decodeURIComponent(parts[i]);
      else if (segs[i] !== parts[i]) { ok = false; break; }
    }
    if (ok) return { view: r.view, params, path };
  }
  return null;
}
let CURRENT = { path: null, view: null, params: null };
function renderRoute() {
  const m = matchRoute(location.hash);
  const app = $("#app");
  $$("#mobilemenu button").forEach(b => b.setAttribute("aria-current", b.dataset.r === (m ? m.path : "home") ? "page" : "false"));
  $$("#topnav-inner button").forEach(b => b.setAttribute("aria-current", b.dataset.r === (m ? m.path : "home") ? "page" : "false"));
  if (!m) {
    document.title = "Page not found — FDE Academy";
    app.innerHTML = `<div class="wrap" style="padding:60px 0"><div class="empty"><b>That page does not exist.</b><br><br>The link may be old or mistyped. Everything in the academy is reachable from the navigation above or the footer below.<br><br><button class="btn primary" data-nav="home">Go to the homepage</button></div></div>`;
    renderChrome("404"); return;
  }
  try {
    document.title = m.view.title(m.params) + " — FDE Academy";
    const html = m.view.render(m.params);
    if (html && html.then) {
      app.innerHTML = `<div class="wrap" style="padding:40px 0"><div class="skeleton" style="height:220px"></div></div>`;
      html.then(h => { app.innerHTML = h; m.view.mount && m.view.mount(m.params); });
    } else {
      app.innerHTML = html;
      if (CURRENT.view && CURRENT.view.unmount) CURRENT.view.unmount();
      m.view.mount && m.view.mount(m.params);
    }
    CURRENT = m;
    if (!location.hash.includes("no-scroll")) app.focus({ preventScroll: true });
  } catch (err) {
    app.innerHTML = `<div class="wrap" style="padding:50px 0"><div class="statebox err"><b>Something went wrong while rendering this page.</b><br>${esc(err.message)}</div><button class="btn" data-nav="dashboard">Back to dashboard</button></div>`;
  }
  renderChrome(m.path);
}
function nav(path) {
  location.hash = "#/" + path;
  $("#mobilemenu").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "auto" });
}
FDE.nav = nav;

/* ---------------- chrome (topbar / mobile menu / footer) ---------------- */
const NAV_ITEMS = [
  ["home", "Home", "home"], ["roadmap", "Roadmap", "target"], ["courses", "Courses", "grad"],
  ["books", "Books", "book"], ["labs", "Labs", "flask"], ["projects", "Projects", "briefcase"],
  ["career", "Career", "trophy"],
];
const MENU_ITEMS = [
  ["dashboard", "Dashboard", "chart"], ["assessments", "Assessments", "check"], ["maths", "Maths studio", "calc"],
  ["glossary", "Glossary", "book"], ["admin", "Admin", "shield"],
];
function renderChrome(path) {
  const s = store.s;
  const initial = (s.profile.name || "?").slice(0, 1).toUpperCase();
  $("#topbar").innerHTML = `
    <button class="logo" data-nav="home" aria-label="FDE Academy home">${LOGO_GLYPH}
      <span class="wm">FDE Academy<small>From Zero Knowledge to Real-World Engineering</small></span></button>
    <nav class="topnav" id="topnav-inner" aria-label="Primary">
      ${NAV_ITEMS.map(([r, label]) => `<button data-nav="${r}" data-r="${r}" aria-current="false">${label}</button>`).join("")}
    </nav>
    <div class="top-actions">
      <span class="searchbox" style="max-width:210px;display:inline-flex;align-items:center;gap:8px;color:var(--slate-500)">
        ${I("search", 15)} <input id="global-search" placeholder="Search lessons, books, terms…" aria-label="Search the academy" style="border:none;outline:none;width:100%;font-size:13px;background:none;color:var(--ink-700)"></span>
      <button class="avatar" id="avatar-btn" aria-haspopup="menu" aria-expanded="false" aria-label="Your account and more sections">${initial}</button>
      <button class="burger" id="burger" aria-label="Open menu" aria-expanded="false">${I("menu", 20)}</button>
    </div>`;
  const menu = $("#mobilemenu");
  menu.innerHTML = `<div style="padding:6px 4px 10px"><input class="searchbox" id="mobile-search" placeholder="Search lessons, books, terms…" aria-label="Search the academy" style="max-width:none"></div>`
    + [...NAV_ITEMS, ...MENU_ITEMS].map(([r, label]) =>
    `<button data-nav="${r}" data-r="${r}" aria-current="false">${label}</button>`).join("");
  const ms = $("#mobile-search");
  ms.addEventListener("keydown", e => { if (e.key === "Enter" && ms.value.trim()) { location.hash = "#/search/" + encodeURIComponent(ms.value.trim()); menu.classList.remove("open"); ms.value = ""; } });
  const dd = document.createElement("div");
  dd.id = "user-dd"; dd.setAttribute("role", "menu");
  dd.style.cssText = "position:absolute;right:16px;top:58px;background:#fff;border:2px solid var(--ink-900);border-radius:14px;padding:8px;min-width:230px;box-shadow:var(--sh-2);z-index:90;display:none";
  dd.innerHTML = `
    <div style="padding:8px 10px;font-size:12.5px;color:var(--slate-500)">${s.profile.name ? "Signed in locally as" : "Local demo account"}<br><b style="color:var(--ink-900);font-size:14px">${esc(s.profile.name || "Guest")}</b></div>
    ${MENU_ITEMS.map(([r, label, ic]) => `<button role="menuitem" data-nav="${r}" style="display:flex;gap:10px;align-items:center;width:100%;background:none;border:none;padding:10px;font-size:14px;cursor:pointer;border-radius:8px;text-align:left" onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background='none'">${I(ic, 17)} ${label}</button>`).join("")}
    <div style="border-top:1px solid var(--line);margin-top:6px;padding-top:6px">
      <button role="menuitem" id="dd-signin" style="width:100%;background:none;border:none;padding:10px;font-size:14px;cursor:pointer;text-align:left;color:var(--amber-800);font-weight:600">${s.profile.name ? "Edit your profile" : "Create your free account"}</button>
    </div>`;
  document.body.appendChild(dd);
  $("#avatar-btn").addEventListener("click", e => {
    e.stopPropagation();
    const open = dd.style.display === "block";
    dd.style.display = open ? "none" : "block";
    $("#avatar-btn").setAttribute("aria-expanded", String(!open));
  });
  document.addEventListener("click", ev => { if (!dd.contains(ev.target)) dd.style.display = "none"; });
  $("#burger").addEventListener("click", () => {
    const m2 = $("#mobilemenu"); const open = m2.classList.toggle("open");
    $("#burger").setAttribute("aria-expanded", String(open));
  });
  const gs = $("#global-search");
  gs.addEventListener("keydown", e => { if (e.key === "Enter" && gs.value.trim()) { location.hash = "#/search/" + encodeURIComponent(gs.value.trim()); gs.value = ""; } });
  /* active nav state must be applied AFTER the chrome rebuild, not in renderRoute before it */
  const cur = path || "home";
  $$("#topnav-inner button").forEach(b => b.setAttribute("aria-current", b.dataset.r === cur ? "page" : "false"));
  $$("#mobilemenu button").forEach(b => b.setAttribute("aria-current", b.dataset.r === cur ? "page" : "false"));
}
/* delegated navigation + glossary popovers + accordions */
document.addEventListener("click", e => {
  const nv = e.target.closest("[data-nav]");
  if (nv) { e.preventDefault(); nav(nv.dataset.nav); return; }
  const gt = e.target.closest(".glossterm");
  if (gt) { openGlossaryPopover(gt.dataset.g); return; }
  const acc = e.target.closest(".acc .q");
  if (acc) {
    const a = acc.nextElementSibling, open = !a.hidden;
    a.hidden = open; acc.setAttribute("aria-expanded", String(!open));
    acc.querySelector("span").textContent = open ? "＋" : "−";
  }
});
function openGlossaryPopover(key) {
  const t = DATA.glossaryAll().find(x => x.key === key);
  if (!t) return;
  let pop = $("#gloss-pop");
  if (pop) pop.remove();
  pop = document.createElement("div");
  pop.id = "gloss-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-label", "Glossary: " + t.term);
  pop.style.cssText = "position:fixed;inset:0;background:rgba(26,35,48,.45);z-index:150;display:flex;align-items:center;justify-content:center;padding:20px";
  pop.innerHTML = `<div style="background:#fff;border-radius:14px;max-width:560px;width:100%;max-height:80vh;overflow:auto;padding:24px;border:2px solid var(--ink-900)">
    <div class="row spread"><h3 style="font-size:19px;color:var(--ink-900)">${esc(t.term)}</h3>
    <button id="gp-x" aria-label="Close" style="background:none;border:none;cursor:pointer">${I("x", 20)}</button></div>
    <div style="margin:6px 0 12px">${t.cat.map(c => `<span class="chip">${esc(c)}</span>`).join("")}</div>
    <p style="margin-bottom:10px"><b>Simple meaning:</b> ${esc(t.simple)}</p>
    <p style="margin-bottom:10px"><b>Detailed meaning:</b> ${esc(t.detailed)}</p>
    <p style="margin-bottom:10px"><b>Example:</b> ${esc(t.example)}</p>
    <p><b>Related terms:</b> ${t.related.map(r => `<button class="glossterm" data-g="${r}" style="margin-right:8px">${esc(r.replace(/-/g, " "))}</button>`).join("") || "—"}</p>
    ${t.appears ? `<p class="meta">Appears in: ${esc(t.appears)}</p>` : ""}</div>`;
  document.body.appendChild(pop);
  $("#gp-x", pop).onclick = () => pop.remove();
  pop.onclick = e => { if (e.target === pop) pop.remove(); };
}
FDE.term = (key, label) => `<button class="glossterm" data-g="${key}" title="Open glossary">${esc(label || key.replace(/-/g, " "))}</button>`;

/* ---------------- file helpers (real client-side generation) ---------------- */
function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
}
function chapterToDocHtml(book, ch) {
  const bodyHtml = ch.blocks.map(b => renderProseBlock(b)).join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(book.title)} — ${esc(ch.title)}</title></head>
<body style="font-family:Georgia,serif;max-width:680px;margin:40px auto;line-height:1.7">
<p style="font-size:11px;letter-spacing:2px;color:#8F5229">FDE ACADEMY SERIES</p>
<h1>${esc(book.title)}</h1><h2>${esc(ch.title)}</h2>
<p style="color:#666;font-size:12px">Web edition export — ${esc(fmtDate(Date.now()))}. From Zero Knowledge to Real-World Engineering.</p>
<hr>${bodyHtml}
<p style="color:#666;font-size:12px;margin-top:40px">© FDE Academy. Every concept is taught from zero; every chapter ends with what you can now do.</p>
</body></html>`;
}

/* ---------------- mini math renderer ---------------- */
function m(s) {
  let out = esc(s);
  out = out.replace(/sqrt\(([^()]+)\)/g, (_m2, a) => `<span class="msqrt"><span class="sign"></span><span class="body">${a}</span></span>`);
  out = out.replace(/\{([^{}]+)\}\/\{([^{}]+)\}/g, (_m2, a, b) => `<span class="mfrac"><span class="top">${a}</span><span class="bot">${b}</span></span>`);
  out = out.replace(/\^\{([^}]+)\}/g, (_m2, e) => `<span class="msup">${e}</span>`);
  out = out.replace(/\^(\d)/g, (_m2, e) => `<span class="msup">${e}</span>`);
  return out;
}
const mathExpr = expr => `<span class="mathexpr" role="img" aria-label="${esc(expr)}">${m(expr)}</span>`;

/* ---------------- interactive math components (SVG where spatial) ---------------- */
let MUID = 0;
const MOUNTS = [];
function mountMath() { MOUNTS.splice(0).forEach(fn => { try { fn(); } catch (e) { console.error(e); } }); }

/* 1. step-by-step calculation with reveal */
function stepcalc(title, steps) {
  const id = "sc" + (++MUID);
  MOUNTS.push(() => {
    const w = document.getElementById(id); if (!w) return;
    const box = w.parentElement;
    const all = $$(".step", box); const vis = () => all.filter(s => s.style.display !== "none").length;
    const upd = () => { $("#" + id + "-count", box).textContent = `${vis()} of ${all.length} steps`;
      const nb = $("#" + id + "-next", box); nb.disabled = vis() >= all.length;
      nb.textContent = vis() >= all.length ? "All steps revealed" : "Reveal next step"; };
    $("#" + id + "-next", box).onclick = () => { const nx = all[vis()]; if (nx) nx.style.display = "flex"; upd(); };
    $("#" + id + "-all", box).onclick = () => { all.forEach(s => s.style.display = "flex"); upd(); };
    upd();
  });
  return `<div class="mathwrap"><div class="ttl">${I("calc", 15)} Step-by-step — ${esc(title)}</div>
  <div id="${id}">${steps.map((st, i) => `
    <div class="step" data-sidx="${i}" ${i === 0 ? "" : 'style="display:none"'}>
      <span class="n" aria-hidden="true"></span>
      <div><div style="font-size:16px;color:var(--ink-900)">${m(st.expr)}</div>
      ${st.note ? `<div style="font-size:12.5px;color:var(--slate-500);margin-top:3px">${esc(st.note)}</div>` : ""}</div>
    </div>`).join("")}
  </div>
  <div class="row" style="margin-top:10px"><button class="btn small primary" id="${id}-next">Reveal next step</button>
  <button class="btn small subtle" id="${id}-all">Show all</button>
  <span class="meta" id="${id}-count"></span></div></div>`;
}

/* 2. interactive number line */
function numberline(opts) {
  const id = "nl" + (++MUID);
  const { min, max, step = 1, value, label, unit = "", snap = null } = opts;
  return `<div class="mathwrap"><div class="ttl">${I("target", 15)} Number line — ${esc(label)}</div>
  <svg id="${id}" viewBox="0 0 560 84" role="slider" tabindex="0" aria-label="${esc(label)}: value ${value}${unit}, from ${min} to ${max}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}" style="width:100%;touch-action:none;cursor:pointer">
    <line x1="30" y1="46" x2="530" y2="46" stroke="#B9C2CC" stroke-width="2"/>
    <g id="${id}-ticks"></g>
    <g id="${id}-marker"><line x1="0" y1="30" x2="0" y2="62" stroke="#A55F33" stroke-width="3"/><circle cx="0" cy="46" r="7" fill="#C27E4D" stroke="#1A2330" stroke-width="2"/></g>
    <text id="${id}-vlabel" x="0" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="#1A2330">${value}${unit}</text>
  </svg>
  <div class="row" style="margin-top:8px">
    <button class="btn small subtle" id="${id}-dec" aria-label="Decrease value">−</button>
    <input type="range" class="mathslider" id="${id}-rng" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${esc(label)}">
    <button class="btn small subtle" id="${id}-inc" aria-label="Increase value">+</button>
    <span class="mathval" id="${id}-read">value ${value}${unit}</span></div>
  ${snap ? `<div class="meta" id="${id}-note"></div>` : ""}</div>`;
  MOUNTS.push(() => wireNumberline(id, opts));
  return html;
}
function wireNumberline(id, opts, onChange) {
  const svg = $("#" + id); if (!svg) return;
  const { min, max, step = 1, unit = "", snap = null } = opts;
  let v = opts.value;
  const X = val => 30 + 500 * (val - min) / (max - min);
  function draw() {
    const ticks = $("#" + id + "-ticks");
    const nTicks = Math.min(21, Math.round((max - min) / step) + 1);
    let th = "";
    for (let i = 0; i < nTicks; i++) {
      const val = min + (max - min) * i / (nTicks - 1);
      const x = X(val);
      th += `<line x1="${x}" y1="41" x2="${x}" y2="51" stroke="#B9C2CC" stroke-width="1.6"/>
      <text x="${x}" y="66" text-anchor="middle" font-size="10.5" fill="#68727E">${Math.round(val * 100) / 100}</text>`;
    }
    ticks.innerHTML = th;
    const x = X(v);
    $("#" + id + "-marker").innerHTML = `<line x1="${x}" y1="30" x2="${x}" y2="62" stroke="#A55F33" stroke-width="3"/><circle cx="${x}" cy="46" r="7" fill="#C27E4D" stroke="#1A2330" stroke-width="2"/>`;
    const vl = $("#" + id + "-vlabel"); vl.setAttribute("x", Math.max(30, Math.min(530, x))); vl.textContent = (Math.round(v * 100) / 100) + unit;
    svg.setAttribute("aria-valuenow", v);
    $("#" + id + "-read").textContent = "value " + (Math.round(v * 100) / 100) + unit;
    if (snap) { const note = $("#" + id + "-note"); if (note) note.textContent = snap(v); }
    onChange && onChange(v);
  }
  const set = nv => { v = Math.max(min, Math.min(max, nv)); $("#" + id + "-rng").value = v; draw(); };
  svg.addEventListener("keydown", e => { if (e.key === "ArrowRight") { set(v + step); e.preventDefault(); } if (e.key === "ArrowLeft") { set(v - step); e.preventDefault(); } });
  svg.addEventListener("pointerdown", e => {
    const r = svg.getBoundingClientRect();
    const move = ev => set(min + (max - min) * (ev.clientX - r.left - 30 * r.width / 560) / (500 * r.width / 560));
    move(e);
    const up = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", up); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", up);
  });
  $("#" + id + "-rng").addEventListener("input", e => set(parseFloat(e.target.value)));
  $("#" + id + "-dec").onclick = () => set(v - step);
  $("#" + id + "-inc").onclick = () => set(v + step);
  draw();
}

/* 3. function plot with hover readout */
function plot(opts) {
  const id = "pl" + (++MUID);
  const { fn, xmin = -5, xmax = 5, yMin, yMax, labelX = "x", labelY = "y", marks = [], caption = "" } = opts;
  const html = `<div class="mathwrap"><div class="ttl">${I("chart", 15)} Graph — ${esc(caption || (labelY + " against " + labelX))}</div>
  <svg id="${id}" viewBox="0 0 560 300" style="width:100%;background:#FBFCFE;border-radius:8px" role="img" aria-label="Graph of ${esc(caption)}">
    <g id="${id}-axes"></g><path id="${id}-curve" fill="none" stroke="#A55F33" stroke-width="2.6"/>
    <g id="${id}-marks"></g><text id="${id}-read" x="400" y="22" font-size="12.5" font-family="monospace" fill="#1A2330"></text>
    <text x="524" y="290" font-size="12" fill="#68727E">${esc(labelX)}</text>
    <text x="8" y="18" font-size="12" fill="#68727E">${esc(labelY)}</text>
  </svg><div class="meta">Move your pointer across the graph to read exact values.</div></div>`;
  MOUNTS.push(() => wirePlot(id, opts));
  return html;
}
function wirePlot(id, opts) {
  const svg = $("#" + id); if (!svg) return;
  const { fn, xmin = -5, xmax = 5, yMin, yMax, marks = [], unitY = "" } = opts;
  const W = 560, H = 300, PAD = 30;
  const ys = []; const N = 240;
  for (let i = 0; i <= N; i++) { const x = xmin + (xmax - xmin) * i / N; ys.push(fn(x)); }
  let lo = yMin !== undefined ? yMin : Math.min(...ys), hi = yMax !== undefined ? yMax : Math.max(...ys);
  if (hi - lo < 1e-9) { hi = lo + 1; }
  const lo2 = Math.min(lo, Math.min(...marks.map(m2 => m2.y), ...ys.filter(Number.isFinite)));
  const hi2 = Math.max(hi, Math.max(...marks.map(m2 => m2.y), ...ys.filter(Number.isFinite)));
  const X = x => PAD + (W - 2 * PAD) * (x - xmin) / (xmax - xmin);
  const Y = y => H - PAD - (H - 2 * PAD) * (y - lo2) / (hi2 - lo2);
  let axes = `<line x1="${X(xmin)}" y1="${Y(0)}" x2="${X(xmax)}" y2="${Y(0)}" stroke="#B9C2CC" stroke-width="1.6"/>
  <line x1="${X(0)}" y1="${Y(hi2)}" x2="${X(0)}" y2="${Y(lo2)}" stroke="#B9C2CC" stroke-width="1.6"/>`;
  const step = (xmax - xmin) / 10;
  for (let x = Math.ceil(xmin / step) * step; x <= xmax; x += step) {
    if (Math.abs(x) < 1e-9) continue;
    axes += `<line x1="${X(x)}" y1="${Y(0) - 4}" x2="${X(x)}" y2="${Y(0) + 4}" stroke="#B9C2CC"/>
    <text x="${X(x)}" y="${Y(0) + 16}" text-anchor="middle" font-size="10" fill="#68727E">${Math.round(x * 10) / 10}</text>`;
  }
  $("#" + id + "-axes").innerHTML = axes;
  let d = ""; let started = false;
  for (let i = 0; i <= N; i++) {
    const x = xmin + (xmax - xmin) * i / N; const y = fn(x);
    if (!Number.isFinite(y) || y < lo2 - (hi2 - lo2) || y > hi2 + (hi2 - lo2)) { started = false; continue; }
    d += (started ? "L" : "M") + X(x).toFixed(1) + " " + Y(y).toFixed(1); started = true;
  }
  $("#" + id + "-curve").setAttribute("d", d);
  $("#" + id + "-marks").innerHTML = marks.map(mk =>
    `<circle cx="${X(mk.x)}" cy="${Y(mk.y)}" r="5" fill="${mk.color || "#2E7D74"}" stroke="#1A2330" stroke-width="1.6"/>
     <text x="${X(mk.x)}" y="${Y(mk.y) - 10}" text-anchor="middle" font-size="11" font-weight="700" fill="#1A2330">${esc(mk.label || "")}</text>`).join("");
  svg.addEventListener("pointermove", e => {
    const r = svg.getBoundingClientRect();
    const x = xmin + (xmax - xmin) * ((e.clientX - r.left) / r.width * W - PAD) / (W - 2 * PAD);
    const y = fn(x);
    $("#" + id + "-read").textContent = Number.isFinite(y) ? `x=${x.toFixed(2)} → y=${y.toFixed(2)}${unitY}` : "";
  });
  svg.addEventListener("pointerleave", () => { $("#" + id + "-read").textContent = ""; });
}

/* 4. interactive equation with sliders */
function ieq(opts) {
  const id = "ie" + (++MUID);
  const wire = () => wireIeq(id, opts);
  const { caption, sliders, display, note } = opts;
  const html = `<div class="mathwrap"><div class="ttl">${I("spark", 15)} Interactive — ${esc(caption)}</div>
  <div id="${id}-disp" style="font-family:Georgia,serif;font-size:20px;color:var(--ink-900);margin:6px 0 14px"></div>
  ${sliders.map(s => `<label style="display:block;font-size:12.5px;font-weight:600;margin-top:8px">${esc(s.label)}:
    <span class="mathval" id="${id}-v-${s.key}"></span></label>
    <input type="range" class="mathslider" id="${id}-s-${s.key}" min="${s.min}" max="${s.max}" step="${s.step}" value="${s.val}" aria-label="${esc(s.label)}">`).join("")}
  <div class="meta" id="${id}-note" style="margin-top:10px"></div></div>`;
  MOUNTS.push(wire);
  return html;
}
function wireIeq(id, opts) {
  const root = $("#" + id + "-disp"); if (!root) return;
  const vals = {}; opts.sliders.forEach(s => vals[s.key] = s.val);
  function upd() {
    opts.sliders.forEach(s => { $("#" + id + "-v-" + s.key).textContent = (Math.round(vals[s.key] * 100) / 100); });
    root.innerHTML = m(opts.display(vals));
    $("#" + id + "-note").textContent = opts.note ? opts.note(vals) : "";
  }
  opts.sliders.forEach(s => $("#" + id + "-s-" + s.key).addEventListener("input", e => { vals[s.key] = parseFloat(e.target.value); upd(); }));
  upd();
}

/* 5. fraction illustration (bar + circle) */
function fraction(opts) {
  const id = "fr" + (++MUID);
  const wire = () => wireFraction(id);
  const { n = 1, d = 4, maxD = 12, label = "Fraction" } = opts;
  const html = `<div class="mathwrap"><div class="ttl">${I("calc", 15)} Fraction — ${esc(label)}</div>
  <div class="row" style="gap:22px;flex-wrap:wrap">
    <svg id="${id}-bar" viewBox="0 0 300 56" style="width:300px" role="img" aria-label="Fraction bar"></svg>
    <svg id="${id}-pie" viewBox="0 0 120 120" style="width:110px" role="img" aria-label="Fraction circle"></svg>
    <div style="text-align:center;font-family:Georgia,serif;font-size:24px;color:var(--ink-900)" id="${id}-expr"></div></div>
  <div class="row" style="margin-top:10px;flex-wrap:wrap">
    <label style="font-size:12.5px;font-weight:600">Parts shaded:
      <input type="range" class="mathslider" id="${id}-n" min="0" max="${maxD}" value="${n}" style="width:130px" aria-label="Numerator"></label>
    <label style="font-size:12.5px;font-weight:600">Equal parts:
      <input type="range" class="mathslider" id="${id}-d" min="1" max="${maxD}" value="${d}" style="width:130px" aria-label="Denominator"></label>
    <span class="mathval" id="${id}-dec"></span></div></div>`;
  MOUNTS.push(wire);
  return html;
}
function wireFraction(id) {
  const bar = $("#" + id + "-bar"); if (!bar) return;
  function upd() {
    const n = parseInt($("#" + id + "-n").value, 10), d = parseInt($("#" + id + "-d").value, 10);
    const nn = Math.min(n, d);
    const w = 300 / d;
    let bh = "";
    for (let i = 0; i < d; i++) bh += `<rect x="${i * w + 1}" y="8" width="${w - 2}" height="40" rx="3" fill="${i < nn ? "#C27E4D" : "#EEF2F6"}" stroke="#1A2330" stroke-width="1.4"/>`;
    bar.innerHTML = bh;
    const R = 46, C = 60;
    let ph = `<circle cx="${C}" cy="${C}" r="${R}" fill="#EEF2F6" stroke="#1A2330" stroke-width="1.4"/>`;
    for (let i = 0; i < nn; i++) {
      const a0 = -Math.PI / 2 + 2 * Math.PI * i / d, a1 = -Math.PI / 2 + 2 * Math.PI * (i + 1) / d;
      const x0 = C + R * Math.cos(a0), y0 = C + R * Math.sin(a0), x1 = C + R * Math.cos(a1), y1 = C + R * Math.sin(a1);
      ph += `<path d="M${C} ${C} L${x0.toFixed(1)} ${y0.toFixed(1)} A${R} ${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z" fill="#C27E4D" stroke="#1A2330" stroke-width="1"/>`;
    }
    $("#" + id + "-pie").innerHTML = ph;
    $("#" + id + "-expr").innerHTML = `<span class="mfrac"><span class="top">${nn}</span><span class="bot">${d}</span></span>`;
    $("#" + id + "-dec").textContent = "= " + (d ? Math.round(100 * nn / d) / 100 : "—");
    $("#" + id + "-n").max = d;
  }
  $("#" + id + "-n").addEventListener("input", upd);
  $("#" + id + "-d").addEventListener("input", upd);
  upd();
}

/* 6. percentage visualisation */
function percent(opts) {
  const id = "pc" + (++MUID);
  const wire = () => wirePercent(id);
  const { pct = 35, of = 60, maxTotal = 200, label = "Percentage" } = opts;
  const html = `<div class="mathwrap"><div class="ttl">${I("calc", 15)} Percentage — ${esc(label)}</div>
  <svg id="${id}-grid" viewBox="0 0 320 84" style="width:320px" role="img" aria-label="Hundred-square grid"></svg>
  <div class="row" style="margin-top:8px;flex-wrap:wrap">
    <label style="font-size:12.5px;font-weight:600">Percent:
      <input type="range" class="mathslider" id="${id}-p" min="0" max="100" value="${pct}" style="width:150px" aria-label="Percent"></label>
    <label style="font-size:12.5px;font-weight:600">Of (total):
      <input type="range" class="mathslider" id="${id}-t" min="1" max="${maxTotal}" value="${of}" style="width:150px" aria-label="Total"></label></div>
  <div style="margin-top:10px;font-size:16px;color:var(--ink-900)" id="${id}-calc"></div></div>`;
  MOUNTS.push(wire);
  return html;
}
function wirePercent(id) {
  const grid = $("#" + id + "-grid"); if (!grid) return;
  function upd() {
    const p = parseInt($("#" + id + "-p").value, 10), t = parseInt($("#" + id + "-t").value, 10);
    const shaded = Math.round(p);
    let g = "";
    for (let i = 0; i < 100; i++) {
      const x = (i % 20) * 16, y = Math.floor(i / 20) * 16;
      g += `<rect x="${x + 1}" y="${y + 1}" width="14" height="14" rx="2" fill="${i < shaded ? "#C27E4D" : "#EEF2F6"}" stroke="#B9C2CC" stroke-width="0.6"/>`;
    }
    grid.innerHTML = g;
    const result = Math.round(100 * p * t) / 100;
    $("#" + id + "-calc").innerHTML = m(`${p}^{%} of ${t} = {${p}}/{100} × ${t} = <b>${result}</b>`);
  }
  $("#" + id + "-p").addEventListener("input", upd);
  $("#" + id + "-t").addEventListener("input", upd);
  upd();
}

/* 7. geometry diagram with live measures */
function geometry(opts) {
  const id = "gm" + (++MUID);
  const wire = () => wireGeometry(id, opts.shape);
  const shapes = { rect: "Rectangle", tri: "Right triangle", circle: "Circle" };
  const html = `<div class="mathwrap"><div class="ttl">${I("calc", 15)} Geometry — ${shapes[opts.shape]}</div>
  <div class="row" style="gap:24px;flex-wrap:wrap;align-items:center">
  <svg id="${id}-svg" viewBox="0 0 220 170" style="width:220px" role="img" aria-label="${shapes[opts.shape]} diagram"></svg>
  <div style="min-width:220px;flex:1">
    ${opts.shape === "circle" ? `<label class="flabel">Radius r <span class="mathval" id="${id}-r-v"></span></label>
      <input type="range" class="mathslider" id="${id}-r" min="1" max="40" value="10">` :
      `${opts.shape === "rect" ? `<label class="flabel">Width w <span class="mathval" id="${id}-w-v"></span></label><input type="range" class="mathslider" id="${id}-w" min="2" max="40" value="12">
        <label class="flabel">Height h <span class="mathval" id="${id}-h-v"></span></label><input type="range" class="mathslider" id="${id}-h" min="2" max="30" value="8">` :
        `<label class="flabel">Base b <span class="mathval" id="${id}-w-v"></span></label><input type="range" class="mathslider" id="${id}-w" min="2" max="40" value="12">
        <label class="flabel">Height h <span class="mathval" id="${id}-h-v"></span></label><input type="range" class="mathslider" id="${id}-h" min="2" max="30" value="8">`}`}
    <div style="margin-top:12px;font-size:15px;color:var(--ink-900)" id="${id}-calc"></div>
    <div class="meta" id="${id}-formula"></div></div></div></div>`;
  MOUNTS.push(wire);
  return html;
}
function wireGeometry(id, shape) {
  const svg = $("#" + id + "-svg"); if (!svg) return;
  function upd() {
    let calcH = "", formula = "", dims = {};
    if (shape === "circle") {
      const r = parseFloat($("#" + id + "-r").value); dims = { r };
      $("#" + id + "-r-v").textContent = r;
      svg.innerHTML = `<circle cx="100" cy="85" r="${r * 2}" fill="#FFF7ED" stroke="#1A2330" stroke-width="2"/>
      <line x1="100" y1="85" x2="${100 + r * 2}" y2="85" stroke="#A55F33" stroke-width="2"/><text x="${100 + r}" y="80" text-anchor="middle" font-size="12" fill="#8F5229">r</text>`;
      calcH = m(`Area = πr^{2} = π × ${r}^{2} ≈ <b>${(Math.PI * r * r).toFixed(2)}</b><br>Circumference = 2πr ≈ <b>${(2 * Math.PI * r).toFixed(2)}</b>`);
      formula = "Area uses r squared — the radius multiplied by itself; circumference uses the radius directly.";
    } else {
      const w = parseFloat($("#" + id + "-w").value), h = parseFloat($("#" + id + "-h").value); dims = { w, h };
      $("#" + id + "-w-v").textContent = w; $("#" + id + "-h-v").textContent = h;
      if (shape === "rect") {
        svg.innerHTML = `<rect x="30" y="30" width="${w * 3.6}" height="${h * 3.6}" fill="#FFF7ED" stroke="#1A2330" stroke-width="2"/>
        <text x="${30 + w * 1.8}" y="24" text-anchor="middle" font-size="12" fill="#8F5229">w = ${w}</text>
        <text x="20" y="${30 + h * 1.8}" font-size="12" fill="#8F5229">h = ${h}</text>`;
        calcH = m(`Area = w × h = ${w} × ${h} = <b>${w * h}</b><br>Perimeter = 2(w + h) = <b>${2 * (w + h)}</b>`);
        formula = "Area covers the surface; perimeter walks all the way around the edge.";
      } else {
        svg.innerHTML = `<path d="M30 140 L${30 + w * 3.6} 140 L30 ${140 - h * 3.6} Z" fill="#FFF7ED" stroke="#1A2330" stroke-width="2"/>
        <text x="${30 + w * 1.8}" y="156" text-anchor="middle" font-size="12" fill="#8F5229">b = ${w}</text>
        <text x="16" y="${140 - h * 1.8}" font-size="12" fill="#8F5229">h = ${h}</text>
        <path d="M30 128 L42 128 L42 140" fill="none" stroke="#A55F33" stroke-width="1.6"/>`;
        calcH = m(`Area = {1}/{2} × b × h = {1}/{2} × ${w} × ${h} = <b>${(w * h / 2).toFixed(1)}</b>`);
        formula = "The small square marks the right angle; area is half the rectangle that would enclose it.";
      }
    }
    $("#" + id + "-calc").innerHTML = calcH;
    $("#" + id + "-formula").textContent = formula;
    return dims;
  }
  (shape === "circle" ? ["r"] : ["w", "h"]).forEach(k => $("#" + id + "-" + k).addEventListener("input", upd));
  upd();
}

/* generic interactive equation helper for quick exercises */
function quickSlider(id, label, min, max, step, val) {
  return `<label style="display:block;font-size:12.5px;font-weight:600;margin-top:8px">${esc(label)}: <span class="mathval" id="${id}-v"></span></label>
  <input type="range" class="mathslider" id="${id}" min="${min}" max="${max}" step="${step}" value="${val}">`;
}
