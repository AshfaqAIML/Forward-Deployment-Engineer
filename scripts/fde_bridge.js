/* FDE Academy live-platform bridge — connects the local-first SPA to the
 * backend when both are served from one origin (single-process deployment).
 * Every feature degrades silently: offline or signed-out, the app behaves
 * exactly as before. Signed in, the account, graded quizzes, progress and
 * the real print-edition downloads sync to the server.
 */
(function () {
  "use strict";
  var $ = (s, el) => (el || document).querySelector(s);
  var BASE = (location.protocol === "http:" || location.protocol === "https:")
    ? "" : "http://127.0.0.1:8787";   // file:// dev fallback
  var API = BASE + "/api/v1";
  var CLOUD_KEY = "fde.cloud";
  var cloud = null;
  try { cloud = JSON.parse(localStorage.getItem(CLOUD_KEY) || "null"); } catch (e) {}

  function tokens() { return cloud && cloud.accessToken ? cloud : null; }

  function api(method, path, body, isRetry) {
    var headers = { "content-type": "application/json" };
    if (tokens()) headers.authorization = "Bearer " + cloud.accessToken;
    return fetch(API + path, {
      method: method, headers: headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    }).then(function (res) {
      if (res.status === 401 && !isRetry && cloud && cloud.refreshToken) {
        return fetch(API + "/auth/refresh", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ refreshToken: cloud.refreshToken }),
        }).then(function (r) {
          if (!r.ok) { cloud = null; localStorage.removeItem(CLOUD_KEY); throw new Error("session expired"); }
          return r.json();
        }).then(function (tok) {
          cloud.accessToken = tok.accessToken || cloud.accessToken;
          if (tok.refreshToken) cloud.refreshToken = tok.refreshToken;
          localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud));
          return api(method, path, body, true);
        });
      }
      return res;
    });
  }

  function toast(msg) {
    try { window.toast && window.toast(msg); } catch (e) {}
  }

  /* ---- 1. connectivity badge ---- */
  fetch(API + "/health").then(function (r) { return r.ok; }).then(function (ok) {
    if (!ok) return;
    var nav = $("#topnav-inner") || $("#topbar");
    if (!nav) return;
    var chip = document.createElement("span");
    chip.className = "chip teal";
    chip.style.cssText = "font-size:11px;align-self:center;margin-left:10px;white-space:nowrap";
    chip.textContent = tokens() ? "\u25CF live platform \u00B7 cloud sync on" : "\u25CF live platform online";
    chip.title = "Connected to the FDE Academy backend \u2014 accounts, graded quizzes and book downloads sync to the server.";
    nav.appendChild(chip);
  }).catch(function () {});

  /* ---- 2. account sync on the sign-in page ---- */
  function injectAccountFields() {
    var card = $("#pf-name") && $("#pf-name").closest(".card");
    if (!card || $("#pf-email")) return;
    var html = '<label class="flabel" for="pf-email">Email (optional \u00B7 cloud account)</label>' +
      '<input class="f" id="pf-email" type="email" autocomplete="email" placeholder="you@example.com" value="' + (cloud && cloud.email ? cloud.email : "") + '">' +
      '<label class="flabel" for="pf-pass">Password (8+ characters)</label>' +
      '<input class="f" id="pf-pass" type="password" autocomplete="new-password" placeholder="Only needed to create or use a cloud account">' +
      '<p class="meta" id="fde-cloud-msg" style="margin:8px 0 0">' +
      (tokens() ? "Cloud account connected: graded quizzes and progress also save to the server." :
        "Leave these blank for a local-only account, or fill them to sync across devices.") + "</p>";
    var save = $("#pf-save");
    if (save) save.insertAdjacentHTML("beforebegin", html);
    var btn = $("#pf-save");
    if (btn && !btn.dataset.fdeCloud) {
      btn.dataset.fdeCloud = "1";
      btn.addEventListener("click", function () {
        var email = ($("#pf-email") || {}).value || "";
        var pass = ($("#pf-pass") || {}).value || "";
        var name = ($("#pf-name") || {}).value || "";
        var msg = $("#fde-cloud-msg");
        if (!email || !pass || !name) return;              // local-only account
        var display = { displayName: name, email: email.trim(), password: pass };
        api("POST", "/auth/register", display).then(function (res) {
          if (res.status === 409 || res.status === 400) return api("POST", "/auth/login", { email: email.trim(), password: pass });
          return res.json().then(function () { return api("POST", "/auth/login", { email: email.trim(), password: pass }); });
        }).then(function (res) {
          if (!res.ok) throw new Error("auth failed");
          return res.json();
        }).then(function (tok) {
          cloud = { accessToken: tok.accessToken, refreshToken: tok.refreshToken, email: email.trim() };
          localStorage.setItem(CLOUD_KEY, JSON.stringify(cloud));
          if (msg) { msg.textContent = "Cloud account connected: graded quizzes and progress also save to the server."; msg.style.color = "var(--teal-700)"; }
          toast("Cloud account connected \u2014 progress will sync to the server");
        }).catch(function () {
          if (msg) { msg.textContent = "Cloud sign-in failed \u2014 your local account still works."; msg.style.color = "var(--red-700)"; }
        });
      });
    }
  }

  /* ---- 3. real print-edition downloads (DOCX + PDF) ---- */
  function saveBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  function downloadEdition(slug, format, ev) {
    if (!tokens()) return true;                            // fall back to local export
    if (ev) { ev.stopPropagation(); ev.preventDefault(); }
    toast("Fetching the " + format.toUpperCase() + " print edition\u2026");
    api("POST", "/books/" + slug + "/downloads", { format: format }).then(function (res) {
      if (!res.ok) throw new Error("download token refused");
      return res.json();
    }).then(function (iss) {
      return fetch(BASE + iss.downloadUrl, { headers: { authorization: "Bearer " + cloud.accessToken } });
    }).then(function (res) {
      if (!res.ok) throw new Error("file fetch failed");
      return res.blob();
    }).then(function (blob) {
      var title = ((window.DATA && window.DATA.bookById) ? window.DATA.bookById(slug) : null); title = (title && title.title) || slug;
      saveBlob(title.replace(/\s+/g, "_") + "_FDE_Academy." + format, blob);
      toast("Print edition downloaded \u2014 " + format.toUpperCase() + " from the live library");
    }).catch(function (err) {
      toast("Server download failed \u2014 using the local export instead");
      var b = document.querySelector('[data-dl-book="' + slug + '"]');
      if (b && ev) { ev.stopPropagation = function () {}; b.click(); }
    });
    return false;
  }

  document.addEventListener("click", function (ev) {
    var btn = ev.target.closest ? ev.target.closest("[data-dl-book],[data-dl-pdf]") : null;
    if (!btn) return;
    var slug = btn.dataset.dlBook || btn.dataset.dlPdf;
    var format = btn.dataset.dlPdf ? "pdf" : "docx";
    if (format === "docx" && !tokens()) return;            // local fallback
    if (format === "pdf" && !tokens()) { toast("Sign in with a cloud account to download print PDFs"); ev.stopPropagation(); ev.preventDefault(); return; }
    downloadEdition(slug, format, ev);
  }, true);                                                // capture: beat the local handler

  function injectPdfButtons() {
    document.querySelectorAll("[data-dl-book]").forEach(function (b) {
      if (b.parentElement.querySelector("[data-dl-pdf]")) return;
      var pdf = document.createElement("button");
      pdf.className = "btn small";
      pdf.setAttribute("data-dl-pdf", b.dataset.dlBook);
      pdf.innerHTML = "\u2193 PDF";
      pdf.title = "Download the print PDF edition from the live library";
      b.insertAdjacentElement("afterend", pdf);
    });
  }

  /* ---- 4. graded quiz sync (lesson knowledge checks) ---- */
  function syncQuiz(lessonCode) {
    if (!tokens()) return;
    var picked = {};
    document.querySelectorAll("#quiz-body .option.sel").forEach(function (o) {
      picked[+o.dataset.q] = o.textContent.trim();
    });
    if (!Object.keys(picked).length) return;
    var quizCode = "quiz-" + lessonCode;
    var answers = [], attemptId = null, passed = false;
    api("GET", "/assessments/quizzes/" + quizCode).then(function (res) {
      if (!res.ok) throw new Error("quiz not found");
      return res.json();
    }).then(function (qz) {
      var qs = (qz.quiz && qz.quiz.questions) || qz.questions || [];
      qs.forEach(function (q, i) {
        var sel = picked[i];
        if (sel === undefined) return;
        (q.options || []).forEach(function (o) {
          if ((o.text || "").trim() === sel) answers.push({ questionId: q.id, optionId: o.id });
        });
      });
      if (!answers.length) throw new Error("no matching answers");
      return api("POST", "/assessments/quizzes/" + quizCode + "/attempts", {});
    }).then(function (res) {
      if (!res.ok) throw new Error("attempt refused");
      return res.json();
    }).then(function (att) {
      attemptId = att.attemptId;
      return api("POST", "/assessments/attempts/" + attemptId + "/answers", { answers: answers });
    }).then(function (res) {
      if (!res.ok) throw new Error("answers rejected");
      return api("POST", "/assessments/attempts/" + attemptId + "/submit", {});
    }).then(function (res) {
      if (!res.ok) throw new Error("submit failed");
      return res.json();
    }).then(function (sub) {
      passed = !!sub.passed;
      return api("GET", "/catalog/lessons/" + lessonCode);
    }).then(function (res) {
      if (!res.ok) throw new Error("lesson lookup failed");
      return res.json();
    }).then(function (ld) {
      var id = (ld.lesson || ld).id;
      return api("POST", "/me/progress/lessons/" + id + "/complete", {}).then(function () {
        toast(passed ? "Graded attempt recorded on the server \u2014 lesson progress synced \u2713"
                     : "Attempt recorded on the server \u2014 review and retry");
      });
    }).catch(function () { /* silent: local attempt already recorded */ });
  }

  /* ---- 5. cloud progress card on the dashboard ---- */
  function injectCloudCard() {
    if (!tokens()) return;
    var host = $("#app .wrap");
    if (!host || $("#fde-cloud-card")) return;
    api("GET", "/me/progress").then(function (res) {
      if (!res.ok) throw new Error("progress unavailable");
      return res.json();
    }).then(function (p) {
      var card = document.createElement("div");
      card.id = "fde-cloud-card";
      card.className = "card";
      card.style.cssText = "margin-bottom:18px";
      card.innerHTML = '<h4>\u2601 Live platform progress</h4>' +
        '<p style="font-size:13px">' + (p.lessonsDone || 0) + " of " + (p.lessonsTotal || 34) +
        " lessons completed on the server (" + (p.overallPct || 0) + "%). " +
        (p.recommendedLesson ? "Next up: <b>" + p.recommendedLesson.title + "</b>." : "") + "</p>" +
        '<div class="bar" style="margin-top:8px"><i style="width:' + (p.overallPct || 0) + '%"></i></div>';
      host.insertBefore(card, host.firstChild);
    }).catch(function () {});
  }

  /* ---- quiz sync hook: document-level delegation (the app re-renders the
   * quiz after every option click, which would destroy any listener bound
   * to the submit button itself) ---- */
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest ? ev.target.closest("#quiz-submit") : null;
    if (!b || b.disabled) return;
    var m = location.hash.match(/#\/lesson\/([a-z0-9-]+)/i);
    if (m) setTimeout(function () { syncQuiz(m[1]); }, 60);
  }, true);

  /* ---- hooks: after each route render ---- */
  window.addEventListener("hashchange", function () {
    setTimeout(function () {
      injectAccountFields(); injectPdfButtons(); injectCloudCard();
    }, 50);
  });
  setTimeout(function () { injectAccountFields(); injectPdfButtons(); injectCloudCard(); }, 80);
})();
