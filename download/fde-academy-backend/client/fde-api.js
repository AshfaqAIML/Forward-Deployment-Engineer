// client/fde-api.js — dependency-free browser/Node fetch client for the FDE
// Academy backend. Handles token attach and refresh rotation; exposes the
// endpoints the frontend needs (see docs/FRONTEND_INTEGRATION.md for the map).
//
//   const api = new FdeApi("https://api.example.io");
//   await api.register({ email, password, displayName });
//   const lesson = await api.lesson("fm-1");
//   const result = await api.takeQuiz("quiz-fm-1", { "<questionId>": "<optionId>" });

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message || code || "api error");
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const TOKEN_KEY = "fde.api.tokens";

export class FdeApi {
  constructor(baseUrl, { tokenStore = defaultTokenStore() } = {}) {
    this.base = baseUrl.replace(/\/$/, "");
    this.tokens = tokenStore.load();
  }

  /* ---------------- session ---------------- */
  async register({ email, password, displayName }) {
    const t = await this.request("POST", "/api/v1/auth/register", { email, password, displayName });
    this.storeTokens(t);
    return t;
  }
  async login({ email, password }) {
    const t = await this.request("POST", "/api/v1/auth/login", { email, password });
    this.storeTokens(t);
    return t;
  }
  async logout() {
    try { await this.request("POST", "/api/v1/auth/logout", { refreshToken: this.tokens?.refreshToken }); }
    finally { this.tokens = null; try { localStorage.removeItem(TOKEN_KEY); } catch {} }
  }
  me() { return this.request("GET", "/api/v1/auth/me"); }

  storeTokens(t) {
    this.tokens = { accessToken: t.accessToken, refreshToken: t.refreshToken };
    try { localStorage.setItem(TOKEN_KEY, JSON.stringify(this.tokens)); } catch {}
  }

  /* ---------------- catalog ---------------- */
  subjects() { return this.request("GET", "/api/v1/catalog/subjects"); }
  stages() { return this.request("GET", "/api/v1/catalog/stages"); }
  stage(idOrNumber) { return this.request("GET", `/api/v1/catalog/stages/${idOrNumber}`); }
  courses(filters = {}) {
    const q = new URLSearchParams(Object.entries(filters).filter(([, v]) => v !== undefined)).toString();
    return this.request("GET", "/api/v1/catalog/courses" + (q ? "?" + q : ""));
  }
  course(idOrCode) { return this.request("GET", `/api/v1/catalog/courses/${idOrCode}`); }
  lesson(idOrCode) { return this.request("GET", `/api/v1/catalog/lessons/${idOrCode}`); }

  /* ---------------- assessments ---------------- */
  quiz(idOrCode) { return this.request("GET", `/api/v1/assessments/quizzes/${idOrCode}`); }
  async takeQuiz(quizIdOrCode, answersByQuestion = {}) {
    const quiz = await this.quiz(quizIdOrCode);
    const attempt = await this.request("POST", `/api/v1/assessments/quizzes/${quiz.quiz.id}/attempts`, {});
    const answers = quiz.questions
      .filter(q => answersByQuestion[q.id])
      .map(q => ({ questionId: q.id, optionId: answersByQuestion[q.id] }));
    if (answers.length) {
      await this.request("POST", `/api/v1/assessments/attempts/${attempt.attemptId}/answers`, { answers });
    }
    return this.request("POST", `/api/v1/assessments/attempts/${attempt.attemptId}/submit`, {});
  }
  myAttempts(quizIdOrCode) {
    return this.request("GET", `/api/v1/assessments/quizzes/${quizIdOrCode}/attempts/mine`);
  }

  /* ---------------- progress / notes / bookmarks ---------------- */
  progress() { return this.request("GET", "/api/v1/me/progress"); }
  completeLesson(lessonId) { return this.request("POST", `/api/v1/me/progress/lessons/${lessonId}/complete`, {}); }
  note(lessonId) { return this.request("GET", `/api/v1/me/notes/${lessonId}`); }
  saveNote(lessonId, body) { return this.request("PUT", `/api/v1/me/notes/${lessonId}`, { body }); }
  bookmark(lessonId, on) {
    return this.request(on ? "POST" : "DELETE", `/api/v1/me/bookmarks/${lessonId}`);
  }
  history(limit = 25) { return this.request("GET", `/api/v1/me/history?limit=${limit}`); }
  profile() { return this.request("GET", "/api/v1/me/profile"); }
  saveProfile(p) { return this.request("PUT", "/api/v1/me/profile", p); }

  /* ---------------- books & downloads ---------------- */
  books() { return this.request("GET", "/api/v1/books"); }
  book(idOrSlug) { return this.request("GET", `/api/v1/books/${idOrSlug}`); }
  bookChapter(idOrSlug, position) { return this.request("GET", `/api/v1/books/${idOrSlug}/chapters/${position}`); }
  markChapterRead(idOrSlug, position, read = true) {
    return this.request("POST", `/api/v1/books/${idOrSlug}/chapters/${position}/read`, { read });
  }
  async downloadBook(idOrSlug) {
    const issued = await this.request("POST", `/api/v1/books/${idOrSlug}/downloads`, {});
    // fetch the single-use URL and return the raw bytes plus issue metadata
    const res = await fetch(this.base + issued.downloadUrl, {
      headers: { authorization: "Bearer " + this.tokens.accessToken },
    });
    if (!res.ok) throw new ApiError(res.status, "download_failed", await res.text());
    return { bytes: await res.arrayBuffer(), issued };
  }

  /* ---------------- exercises / projects ---------------- */
  exercises(kind) { return this.request("GET", "/api/v1/exercises" + (kind ? "?kind=" + kind : "")); }
  exercise(idOrCode) { return this.request("GET", `/api/v1/exercises/coding/${idOrCode}`); }
  exerciseHints(idOrCode) { return this.request("GET", `/api/v1/exercises/coding/${idOrCode}/hints`); }
  exerciseSolution(idOrCode) { return this.request("GET", `/api/v1/exercises/coding/${idOrCode}/solution`); }
  submitExercise(idOrCode, code) {
    return this.request("POST", `/api/v1/exercises/coding/${idOrCode}/submissions`, { code });
  }
  projects() { return this.request("GET", "/api/v1/projects"); }
  project(idOrCode) { return this.request("GET", `/api/v1/projects/${idOrCode}`); }
  submitProject(idOrCode, evidence, checklist) {
    return this.request("POST", `/api/v1/projects/${idOrCode}/submissions`, { evidence, checklist });
  }
  myProjectSubmissions() { return this.request("GET", "/api/v1/projects/submissions/mine"); }

  /* ---------------- search & glossary ---------------- */
  search(q) { return this.request("GET", "/api/v1/search?q=" + encodeURIComponent(q)); }
  glossary(search, category) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (category) qs.set("category", category);
    return this.request("GET", "/api/v1/glossary" + (qs.toString() ? "?" + qs : ""));
  }

  /* ---------------- core ---------------- */
  async request(method, path, body) {
    const doFetch = (token) => fetch(this.base + path, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(token ? { authorization: "Bearer " + token } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let res = await doFetch(this.tokens?.accessToken);
    // one transparent refresh rotation on 401
    if (res.status === 401 && this.tokens?.refreshToken && path !== "/api/v1/auth/refresh") {
      const refreshed = await fetch(this.base + "/api/v1/auth/refresh", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
      });
      if (refreshed.ok) {
        this.storeTokens(await refreshed.json());
        res = await doFetch(this.tokens.accessToken);
      }
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    if (!res.ok) {
      const e = json && json.error ? json.error : {};
      throw new ApiError(res.status, e.code, e.message, e.details);
    }
    return json;
  }
}

function defaultTokenStore() {
  const canStore = typeof localStorage !== "undefined";
  return {
    load() { if (!canStore) return null; try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { return null; } },
  };
}
