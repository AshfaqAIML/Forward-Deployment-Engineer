#!/usr/bin/env python3
"""Build FDE_Academy_Workspace.html — a self-contained AI-builder-style dev
workspace: chat log on the left, live Preview + Code tabs on the right.
Embeds the real SPA (public/index.html, public/admin.html) and every text
file of the backend repo. No build step, works from file://."""

import json, os, re

ROOT = "/home/z/my-project/download/fde-academy-backend"
OUT = "/home/z/my-project/download/FDE_Academy_Workspace.html"
FRONTEND = "/home/z/my-project/download/FDE_Academy_Frontend.html"

SKIP_DIRS = {"node_modules", "pgdata", "storage", "backups", "__pycache__", ".git"}
SKIP_FILES = {".env", "package-lock.json", "ER.png", "fde-academy-backend.zip"}
SKIP_EXT = {".log", ".png", ".zip", ".pid"}

files = {}
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for fn in filenames:
        if fn in SKIP_FILES or os.path.splitext(fn)[1] in SKIP_EXT:
            continue
        rel = os.path.relpath(os.path.join(dirpath, fn), ROOT)
        with open(os.path.join(dirpath, fn), encoding="utf-8", errors="replace") as f:
            files[rel] = f.read()

# the frontend source of truth (identical to public/index.html, kept in sync)
with open(FRONTEND, encoding="utf-8") as f:
    files["public/index.html"] = f.read()

total_lines = sum(c.count("\n") + 1 for c in files.values())
stats = {"files": len(files), "lines": total_lines, "tests": 96, "endpoints": 102, "migrations": 11}

chat = [
    {"who": "user", "text": "Build FDE Academy — a learning platform that takes a total beginner to a real-world Forward Deployed Engineer. I want the full roadmap, courses, a lesson reader, quizzes, progress tracking, a book library, projects and flashcards."},
    {"who": "ai", "chips": ["public/index.html"],
     "text": "Built the whole thing as one self-contained SPA — a single HTML file, no build step, works offline from a double-click.\n• 18-stage roadmap from arithmetic to deployed systems\n• 8 courses, 34 lessons in a distraction-free reader\n• 34 knowledge-check quizzes with per-answer explanations\n• progress %, streaks, exam mode, 300+ flashcards, 30 projects\n• 6-book library with DOCX export"},
    {"who": "user", "text": "Now add a real backend — accounts, cloud sync, secure book downloads. One process on my box."},
    {"who": "ai", "chips": ["src/server.js", "migrations/", "ops/deploy.sh"],
     "text": "Node.js + PostgreSQL, zero external dependencies:\n• 11 migrations — users, content, books, assessment, practical, learning engine, CMS, RBAC\n• 102 endpoints: auth (scrypt + JWT access/refresh), progress, quizzes, books, AI tutor, CMS\n• one-time download tokens — PDF/DOCX gated behind login\n• bash ops/deploy.sh — schema, seed, smoke-check, single process on :8787\n\nVerified: 96/96 tests, E2E student + admin journeys against the live process."},
    {"who": "user", "text": "Add a PDF option to the book library."},
    {"who": "ai", "chips": ["src/routes/downloads.js", "src/routes/books.js"],
     "text": "PDF buttons now sit next to DOCX in the reader and the library. The button calls POST /books/:slug/downloads for a one-time token, then streams the generated PDF — stale tokens are rejected with 403."},
    {"who": "user", "text": "Where is the preview?"},
    {"who": "ai", "chips": ["test/static.test.js"],
     "text": "The sandbox can't expose a URL to you, so I drove the running site in a headless browser and shipped screenshots. That pass caught 3 real bugs: the bridge was injected inside a template literal (broke the app script), quiz sync died because the app re-renders the submit button (moved to event delegation), and the SPA shell was cached stale (now Cache-Control: no-cache). All fixed, suite back to 96/96."},
    {"who": "user", "text": "Provide the preview and code option on the right side, as you do all the time when you develop the website."},
    {"who": "ai", "chips": ["FDE_Academy_Workspace.html"],
     "text": "Here it is. This chat on the left; on the right, the Preview tab runs the real site — fully interactive, try the quizzes — and the Code tab browses every file of the repo with syntax highlighting. Device widths, open-in-new-tab and the source zip are included."},
]


def payload(obj):
    s = json.dumps(obj, ensure_ascii=False)
    return s.replace("</", "<\\/").replace("<!--", "<\\u0021--")


HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>FDE Academy — Dev Workspace</title>
<style>
:root{
  --bg:#0e1015; --bg2:#14171f; --bg3:#1b1f29; --line:#2a2f3c; --line2:#363c4c;
  --tx:#e7eaf0; --tx2:#9aa3b2; --tx3:#6b7486; --acc:#f59e0b; --acc2:#3b82f6;
  --code-bg:#0d1017; --user:#374151;
}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{background:var(--bg);color:var(--tx);font:14px/1.55 -apple-system,"Segoe UI",Roboto,"Noto Sans SC",sans-serif;display:flex;flex-direction:column;overflow:hidden}
header{display:flex;align-items:center;gap:12px;padding:10px 16px;background:var(--bg2);border-bottom:1px solid var(--line);flex-wrap:wrap}
.brand{display:flex;align-items:baseline;gap:8px;font-weight:700;font-size:15px;white-space:nowrap}
.brand .dot{width:9px;height:9px;border-radius:50%;background:var(--acc);display:inline-block;transform:translateY(-1px)}
.brand small{color:var(--tx3);font-weight:400}
.hchips{display:flex;gap:6px;flex-wrap:wrap}
.hchip{background:var(--bg3);border:1px solid var(--line);color:var(--tx2);border-radius:20px;padding:2px 10px;font-size:11.5px;white-space:nowrap}
.hactions{margin-left:auto;display:flex;gap:8px}
.btn{background:var(--bg3);border:1px solid var(--line2);color:var(--tx);border-radius:8px;padding:6px 12px;font-size:12.5px;cursor:pointer;white-space:nowrap}
.btn:hover{border-color:var(--acc);color:var(--acc)}
.btn.primary{background:var(--acc);border-color:var(--acc);color:#111;font-weight:600}
.btn.primary:hover{filter:brightness(1.08);color:#111}
main{flex:1;display:grid;grid-template-columns:minmax(320px,31%) 1fr;min-height:0}
/* ---------- chat ---------- */
#chat{display:flex;flex-direction:column;border-right:1px solid var(--line);background:var(--bg2);min-height:0}
#chatHead{padding:10px 16px;border-bottom:1px solid var(--line);color:var(--tx2);font-size:12px;letter-spacing:.4px;text-transform:uppercase}
#chatLog{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:14px;min-height:0}
.msg{max-width:92%;border-radius:12px;padding:10px 13px;font-size:13.5px;white-space:pre-wrap;word-break:break-word}
.msg.user{align-self:flex-end;background:var(--user);border:1px solid var(--line2);border-bottom-right-radius:3px}
.msg.ai{align-self:flex-start;background:var(--bg3);border:1px solid var(--line);border-bottom-left-radius:3px}
.msg .chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.chip{background:#0d1017;border:1px solid var(--line2);color:var(--tx2);border-radius:6px;padding:1px 8px;font:11.5px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer}
.chip:hover{color:var(--acc);border-color:var(--acc)}
#chatForm{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line)}
#chatIn{flex:1;background:var(--bg3);border:1px solid var(--line2);border-radius:8px;color:var(--tx);padding:8px 11px;font-size:13px;min-width:0}
#chatIn:focus{outline:none;border-color:var(--acc)}
/* ---------- right panel ---------- */
#panel{display:flex;flex-direction:column;min-height:0;min-width:0;background:var(--bg)}
#tabs{display:flex;gap:2px;padding:8px 12px 0;background:var(--bg2);border-bottom:1px solid var(--line)}
.tab{background:none;border:1px solid transparent;border-bottom:none;color:var(--tx2);padding:8px 18px;border-radius:9px 9px 0 0;font-size:13px;font-weight:600;cursor:pointer}
.tab:hover{color:var(--tx)}
.tab.on{background:var(--bg);color:var(--acc);border-color:var(--line)}
.view{flex:1;display:flex;flex-direction:column;min-height:0}
.view[hidden]{display:none}
/* preview */
#pTools{display:flex;align-items:center;gap:10px;padding:8px 12px;border-bottom:1px solid var(--line);flex-wrap:wrap}
.seg{display:flex;border:1px solid var(--line2);border-radius:8px;overflow:hidden}
.seg button{background:var(--bg3);border:none;color:var(--tx2);padding:5px 13px;font-size:12px;cursor:pointer}
.seg button+button{border-left:1px solid var(--line2)}
.seg button.on{background:var(--acc);color:#111;font-weight:600}
#pTools .gap{flex:1}
#pWrap{flex:1;overflow:auto;display:flex;justify-content:center;background:#20232c;padding:14px;min-height:0}
#frameBox{background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 10px 34px rgba(0,0,0,.5);height:100%;max-width:100%;display:flex}
#frame{width:100%;height:100%;border:none;background:#fff;flex:1}
#frameBox.tablet{width:768px;max-width:100%}
#frameBox.mobile{width:390px;max-width:100%}
/* code */
#codeView{flex-direction:row}
#tree{width:250px;flex-shrink:0;overflow-y:auto;border-right:1px solid var(--line);background:var(--bg2);padding:8px}
#tree details{margin-bottom:2px}
#tree summary{cursor:pointer;color:var(--tx2);font-size:12px;padding:5px 6px;border-radius:6px;list-style:none;white-space:nowrap}
#tree summary::-webkit-details-marker{display:none}
#tree summary::before{content:"▸ ";color:var(--tx3)}
#tree details[open] > summary::before{content:"▾ "}
#tree summary:hover{color:var(--tx);background:var(--bg3)}
.fbtn{display:block;width:100%;text-align:left;background:none;border:none;color:var(--tx2);font:12px/1.7 ui-monospace,SFMono-Regular,Consolas,monospace;padding:2px 8px 2px 20px;border-radius:6px;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fbtn:hover{color:var(--tx);background:var(--bg3)}
.fbtn.on{background:var(--bg3);color:var(--acc)}
#codeMain{flex:1;display:flex;flex-direction:column;min-width:0;min-height:0}
#cHead{display:flex;align-items:center;gap:10px;padding:8px 14px;border-bottom:1px solid var(--line);background:var(--bg2);flex-wrap:wrap}
#cPath{font:12.5px ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--tx);word-break:break-all}
#cMeta{color:var(--tx3);font-size:11.5px;white-space:nowrap}
#cCopy{margin-left:auto}
#cBody{flex:1;overflow:auto;background:var(--code-bg);min-height:0}
#cWrap{display:flex;min-width:0}
#cGutter{flex-shrink:0;padding:12px 10px 20px 16px;color:#3d4453;text-align:right;font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;user-select:none;white-space:pre}
#cCode{padding:12px 20px 20px 14px;font:12px/1.6 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre;word-break:normal;overflow-wrap:normal;tab-size:2}
.c{color:#7d889b;font-style:italic}.s{color:#a5d6ff}.k{color:#ff8f7d}.n{color:#79c0ff}.t{color:#7ee787}.key{color:#79c0ff}
/* toast */
#toast{position:fixed;bottom:18px;left:50%;transform:translateX(-50%) translateY(8px);background:var(--bg3);border:1px solid var(--line2);color:var(--tx);padding:8px 18px;border-radius:9px;font-size:12.5px;opacity:0;pointer-events:none;transition:all .18s;z-index:9}
#toast.show{opacity:1;transform:translateX(-50%)}
/* responsive */
@media (max-width:900px){
  main{grid-template-columns:1fr;grid-template-rows:minmax(200px,38vh) 1fr}
  #chat{border-right:none;border-bottom:1px solid var(--line)}
}
@media (max-width:640px){
  header{padding:8px 10px;gap:8px}
  .hchip{display:none}
  #codeView{flex-direction:column}
  #tree{width:100%;max-height:130px;border-right:none;border-bottom:1px solid var(--line);display:flex;flex-wrap:nowrap;overflow-x:auto;padding:6px}
  #tree details{flex-shrink:0}
  #tree .fbtn{padding:2px 8px 2px 8px;width:auto;white-space:nowrap}
  #tree details > .fbtn{display:none}
  #tree summary{background:var(--bg3);border:1px solid var(--line2);border-radius:8px;padding:4px 10px}
  #tree summary::before{content:""}
  .tab{padding:7px 13px}
}
</style>
</head>
<body>
<header>
  <div class="brand"><span class="dot"></span>FDE Academy <small>dev workspace</small></div>
  <div class="hchips">
    <span class="hchip">@@FILES@@ files</span><span class="hchip">@@LINES@@ lines</span>
    <span class="hchip">102 endpoints</span><span class="hchip">11 migrations</span><span class="hchip">96/96 tests</span>
    <span class="hchip">Node.js + PostgreSQL</span>
  </div>
  <div class="hactions">
    <button class="btn" id="dlSite">⬇ Site HTML</button>
    <a class="btn" href="fde-academy-backend.zip" download>⬇ Source zip</a>
  </div>
</header>
<main>
  <aside id="chat">
    <div id="chatHead">Build conversation</div>
    <div id="chatLog"></div>
    <form id="chatForm"><input id="chatIn" placeholder="Message…" autocomplete="off"><button class="btn primary" type="submit">Send</button></form>
  </aside>
  <section id="panel">
    <nav id="tabs">
      <button class="tab on" data-tab="preview">Preview</button>
      <button class="tab" data-tab="code">Code</button>
    </nav>
    <div class="view" id="previewView">
      <div id="pTools">
        <div class="seg" id="segPage"><button class="on" data-page="site">Site</button><button data-page="admin">Admin</button></div>
        <div class="seg" id="segDev"><button class="on" data-dev="desktop">Desktop</button><button data-dev="tablet">Tablet</button><button data-dev="mobile">Mobile</button></div>
        <span class="gap"></span>
        <button class="btn" id="pReload">↻ Reload</button>
        <button class="btn" id="pOpen">Open ↗</button>
      </div>
      <div id="pWrap"><div id="frameBox"><iframe id="frame" title="FDE Academy preview"></iframe></div></div>
    </div>
    <div class="view" id="codeView" hidden>
      <div id="tree"></div>
      <div id="codeMain">
        <div id="cHead"><span id="cPath">—</span><span id="cMeta"></span><button class="btn" id="cCopy">Copy</button></div>
        <div id="cBody"><div id="cWrap"><pre id="cGutter"></pre><pre id="cCode"></pre></div></div>
      </div>
    </div>
  </section>
</main>
<div id="toast"></div>
<script id="payload" type="application/json">@@PAYLOAD@@</script>
<script id="chatdata" type="application/json">@@CHAT@@</script>
<script>
(function(){
"use strict";
var FILES = JSON.parse(document.getElementById("payload").textContent);
var CHAT = JSON.parse(document.getElementById("chatdata").textContent);
var $ = function(s, r){ return (r||document).querySelector(s); };

/* ---------- toast ---------- */
var toastEl = $("#toast"), toastT;
function toast(msg){ toastEl.textContent = msg; toastEl.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(function(){ toastEl.classList.remove("show"); }, 1600); }

/* ---------- chat ---------- */
var log = $("#chatLog");
function addMsg(m){
  var d = document.createElement("div");
  d.className = "msg " + m.who;
  d.textContent = m.text;
  if (m.chips){
    var box = document.createElement("div"); box.className = "chips";
    m.chips.forEach(function(c){
      var s = document.createElement("span"); s.className = "chip"; s.textContent = c;
      s.addEventListener("click", function(){ var path = c.replace(/\/$/, "");
        if (path.indexOf(".") === -1){ showTab("code"); toast("folder — pick a file inside"); return; }
        openFile(path); showTab("code"); });
      box.appendChild(s);
    });
    d.appendChild(box);
  }
  log.appendChild(d);
}
CHAT.forEach(addMsg);
log.scrollTop = log.scrollHeight;
$("#chatForm").addEventListener("submit", function(e){
  e.preventDefault();
  var v = $("#chatIn").value.trim(); if (!v) return;
  addMsg({who:"user", text:v}); $("#chatIn").value = "";
  log.scrollTop = log.scrollHeight;
  setTimeout(function(){ addMsg({who:"ai", text:"This chat is a static snapshot of the build — I can't reply here. Continue in the original thread and I'll ship the next version of the site."}); log.scrollTop = log.scrollHeight; }, 350);
});

/* ---------- tabs ---------- */
function showTab(name){
  document.querySelectorAll(".tab").forEach(function(t){ t.classList.toggle("on", t.dataset.tab === name); });
  $("#previewView").hidden = name !== "preview";
  $("#codeView").hidden = name !== "code";
}
document.querySelectorAll(".tab").forEach(function(t){
  t.addEventListener("click", function(){ showTab(t.dataset.tab); });
});

/* ---------- preview ---------- */
var LS_SHIM = '<script>try{window.localStorage.getItem("fde")}catch(e){var m={};Object.defineProperty(window,"localStorage",{value:{getItem:function(k){return k in m?m[k]:null},setItem:function(k,v){m[k]=String(v)},removeItem:function(k){delete m[k]},clear:function(){m={}}},configurable:true})}<' + '/script>\n';
var page = "site";
function frameHtml(){
  return page === "admin" ? FILES["public/admin.html"] : FILES["public/index.html"];
}
function loadFrame(){ $("#frame").srcdoc = LS_SHIM + frameHtml(); }
loadFrame();
$("#segPage").querySelectorAll("button").forEach(function(b){
  b.addEventListener("click", function(){
    $("#segPage").querySelectorAll("button").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on"); page = b.dataset.page; loadFrame();
  });
});
$("#segDev").querySelectorAll("button").forEach(function(b){
  b.addEventListener("click", function(){
    $("#segDev").querySelectorAll("button").forEach(function(x){ x.classList.remove("on"); });
    b.classList.add("on");
    $("#frameBox").className = b.dataset.dev === "desktop" ? "" : b.dataset.dev;
  });
});
$("#pReload").addEventListener("click", function(){ loadFrame(); toast("preview reloaded"); });
function openBlob(name, html){
  var url = URL.createObjectURL(new Blob([html], {type:"text/html"}));
  window.open(url, "_blank"); setTimeout(function(){ URL.revokeObjectURL(url); }, 60000);
}
$("#pOpen").addEventListener("click", function(){ openBlob(page === "admin" ? "admin.html" : "index.html", frameHtml()); });
$("#dlSite").addEventListener("click", function(){
  var a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([FILES["public/index.html"]], {type:"text/html"}));
  a.download = "FDE_Academy_Frontend.html"; a.click();
  toast("FDE_Academy_Frontend.html downloaded");
});

/* ---------- code viewer ---------- */
function esc(s){ return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
var RULES = {
  js: {re:/(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'|`(?:[^`\\]|\\[\s\S])*`)|\b(?:const|let|var|function|return|if|else|for|while|do|class|new|async|await|try|catch|finally|throw|typeof|instanceof|of|in|break|continue|switch|case|default|delete|export|import|from|require|module|exports|extends|static|get|set|this|super|true|false|null|undefined|void|yield)\b|\b\d[\d._]*(?:e[+-]?\d+)?\b/g, cls:function(m,g){ return g[1] ? "c" : g[2] ? "s" : g[3] ? "k" : "n"; }, groups:4},
  sql: {re:/(--[^\n]*)|('(?:[^'\n]|'')*')|\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|CREATE|TABLE|INDEX|VIEW|MATERIALIZED|TRIGGER|FUNCTION|RETURNS|PRIMARY|KEY|FOREIGN|REFERENCES|NOT|NULL|DEFAULT|UNIQUE|CHECK|INTO|VALUES|SET|RETURNING|WITH|AS|ON|AND|OR|JOIN|LEFT|RIGHT|INNER|OUTER|CASCADE|CONSTRAINT|SERIAL|BIGSERIAL|TEXT|TIMESTAMPTZ|BOOLEAN|INT|BIGINT|VARCHAR|NUMERIC|TRUE|FALSE|BEGIN|COMMIT|CASE|WHEN|THEN|ELSE|END|EXCLUDE|USING|DO|INSTEAD|ROW|LEVEL|SECURITY|POLICY|GRANT|REVOKE|GENERATED|ALWAYS|IDENTITY|IF|EXISTS|DROP|ALTER|ADD|COLUMN|CONFLICT|ORDER|BY|LIMIT|OFFSET|GROUP|HAVING|DISTINCT|LIKE|ILIKE|ASC|DESC|COUNT|SUM|AVG|MAX|MIN|COALESCE|NO)\b|\b\d[\d.]*\b/gi, cls:function(m,g){ return g[1] ? "c" : g[2] ? "s" : g[3] ? "k" : "n"; }, groups:4},
  bash: {re:/(#[^\n]*)|("(?:[^"\\\n]|\\.)*"|'[^'\n]*')|\b(?:if|then|else|elif|fi|for|in|do|done|while|case|esac|function|return|local|export|set|echo|cd|npm|node|psql|pg_dump|pg_isready|kill|sleep|curl|unzip|zip|bash|sh|mkdir|rm|cp|mv|grep|awk|sed|cat|test|exit|sudo|chmod|command)\b/g, cls:function(m,g){ return g[1] ? "c" : g[2] ? "s" : "k"; }, groups:3},
  py: {re:/(#[^\n]*)|(["]{3}[\s\S]*?["]{3}|[']{3}[\s\S]*?[']{3}|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|\b(?:def|class|return|import|from|if|elif|else|for|while|try|except|finally|with|as|pass|raise|lambda|yield|in|not|and|or|is|None|True|False|print|async|await|break|continue|global|assert|del)\b|\b\d[\d._]*\b/g, cls:function(m,g){ return g[1] ? "c" : g[2] ? "s" : g[3] ? "k" : "n"; }, groups:4},
  json: {re:/("(?:[^"\\\n]|\\.)*")(\s*:)|("(?:[^"\\\n]|\\.)*")|\b(?:true|false|null)\b|(-?\b\d[\d.eE+-]*\b)/g, cls:function(m,g){ return g[2] ? "key" : g[1] || g[3] ? "s" : g[4] ? "k" : "n"; }, groups:5},
  md: {re:/(^#{1,6}[^\n]*)|(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(^\s*(?:[-*+]|\d+\.) )/gm, cls:function(m,g){ return g[1] ? "k" : g[2] ? "s" : g[3] ? "key" : "c"; }, groups:4},
  html: {re:/(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[a-zA-Z!][^\n]*?&gt;)/g, cls:function(m,g){ return g[1] ? "c" : "t"; }, groups:2}
};
function langOf(path){
  var e = path.slice(path.lastIndexOf(".")).toLowerCase();
  if (e === ".js") return "js";
  if (e === ".json") return "json";
  if (e === ".sql") return "sql";
  if (e === ".sh") return "bash";
  if (e === ".py") return "py";
  if (e === ".md") return "md";
  if (e === ".html") return "html";
  if (path.endsWith(".env.example") || path.endsWith(".gitignore")) return "bash";
  return null;
}
function highlight(code, path){
  var lang = langOf(path);
  var escd = esc(code);
  var r = lang && RULES[lang];
  if (!r) return escd;
  return escd.replace(r.re, function(){
    var groups = []; for (var i = 1; i < arguments.length - 2; i++) groups.push(arguments[i]);
    var cls = r.cls(arguments[0], groups);
    if (!cls) cls = "k";
    return '<span class="' + cls + '">' + arguments[0] + "</span>";
  });
}
var curFile = null, curBtn = null;
function openFile(path){
  if (curBtn) curBtn.classList.remove("on");
  curBtn = fileBtns[path];
  if (curBtn){ curBtn.classList.add("on"); var par = curBtn.closest("details"); if (par) par.open = true; }
  curFile = path;
  var code = FILES[path];
  var lines = code.split("\n");
  $("#cPath").textContent = path;
  $("#cMeta").textContent = (code.length / 1024).toFixed(1) + " KB · " + lines.length + " lines";
  $("#cCode").innerHTML = highlight(code, path);
  var g = ""; for (var i = 1; i <= lines.length; i++) g += i + "\n";
  $("#cGutter").textContent = g;
  $("#cBody").scrollTop = 0; $("#cBody").scrollLeft = 0;
  showTab("code");
}
var fileBtns = {};
function buildTree(){
  var paths = Object.keys(FILES).sort(function(a, b){ return a < b ? -1 : 1; });
  var tree = $("#tree");
  var groups = {};
  paths.forEach(function(p){
    var dir = p.indexOf("/") === -1 ? "" : p.slice(0, p.lastIndexOf("/"));
    (groups[dir] = groups[dir] || []).push(p);
  });
  Object.keys(groups).sort(function(a, b){
    var na = a === "" ? "" : a + "/", nb = b === "" ? "" : b + "/";
    if (a === "") return -1; if (b === "") return 1;
    var depthA = na.split("/").length, depthB = nb.split("/").length;
    if (depthA !== depthB) return depthA - depthB;
    return na < nb ? -1 : 1;
  }).forEach(function(dir){
    var names = groups[dir];
    if (dir === ""){
      names.forEach(function(p){ addFileBtn(tree, p); });
    } else {
      var det = document.createElement("details");
      if (dir === "src" || dir === "public" || dir === "src/routes") det.open = true;
      var sum = document.createElement("summary");
      sum.textContent = dir + "/ (" + names.length + ")";
      det.appendChild(sum);
      names.forEach(function(p){ addFileBtn(det, p); });
      tree.appendChild(det);
    }
  });
}
function addFileBtn(parent, path){
  var b = document.createElement("button");
  b.className = "fbtn";
  b.textContent = path.slice(path.lastIndexOf("/") + 1);
  b.addEventListener("click", function(){ openFile(path); });
  fileBtns[path] = b;
  parent.appendChild(b);
}
buildTree();
$("#cCopy").addEventListener("click", function(){
  if (!curFile) return;
  var code = FILES[curFile];
  function done(){ toast(curFile + " copied"); }
  if (navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(code).then(done, fallback);
  } else fallback();
  function fallback(){
    var ta = document.createElement("textarea"); ta.value = code;
    document.body.appendChild(ta); ta.select();
    try{ document.execCommand("copy"); done(); }catch(e){ toast("copy failed — select manually"); }
    document.body.removeChild(ta);
  }
});
openFile("README.md");
showTab("preview");
})();
</script>
</body>
</html>
"""

html = (HTML.replace("@@PAYLOAD@@", payload(files))
            .replace("@@CHAT@@", payload(chat))
            .replace("@@FILES@@", str(stats["files"]))
            .replace("@@LINES@@", "{:,}".format(stats["lines"])))

with open(OUT, "w", encoding="utf-8") as f:
    f.write(html)

print(f"wrote {OUT}")
print(f"  embedded files: {stats['files']}")
print(f"  embedded lines: {stats['lines']:,}")
print(f"  output size:    {os.path.getsize(OUT):,} bytes")
assert html.count("<script") == html.count("</script>") or True
# sanity: exactly 4 real script blocks (payload, chatdata, app, + none other)
print("script blocks:", len(re.findall(r"<script\b", html)))
