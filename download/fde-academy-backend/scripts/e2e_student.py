#!/usr/bin/env python3
"""e2e_student.py — the complete student journey, PROMPT 13 final testing steps 1-10.

1  opens the website            GET /
2  creates an account           POST /auth/register
3  starts Mathematics for FDEs  curriculum tree → fm course (first subject after orientation)
4  reads a lesson               GET /catalog/lessons/fm-1
5  completes an exercise        coding exercise submission (saved + listed)
6  takes a quiz                 graded attempt on quiz-fm-1 (pass)
7  downloads the DOCX book      token flow, real file bytes
8  downloads the matching PDF   token flow, %PDF magic bytes
9  tracks learning progress     /me/progress reflects the completion
10 continues to the next stage  /me/recommendation → next lesson loads

Answers come from the approved seed (ground truth), as in the QA audit.
Writes results to /home/z/my-project/audit/e2e_student.json.
"""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8787"
SEED = "/home/z/my-project/download/fde-academy-backend/seed/content.json"
R = []


def step(n, name, cond, detail=""):
    R.append({"step": n, "name": name, "pass": bool(cond), "detail": str(detail)[:180]})
    print(f"  {'✓' if cond else '✗ FAIL'} step {n}: {name} {('— ' + str(detail)[:110]) if not cond and detail else ''}")


def call(method, path, token=None, body=None, raw=None, out=None):
    req = urllib.request.Request(BASE + path, method=method)
    if token:
        req.add_header("authorization", "Bearer " + token)
    data = None
    if raw is not None:
        data = raw
    elif body is not None:
        req.add_header("content-type", "application/json")
        data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(req, data) as res:
            payload = res.read()
            if out == "bytes":
                return res.status, payload
            try:
                return res.status, json.loads(payload.decode() or "{}")
            except Exception:
                return res.status, {"_text": payload.decode(errors="replace")[:200]}
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


def main():
    seed = json.load(open(SEED, encoding="utf-8"))
    fm1 = next(l for l in seed["lessons"] if l["code"] == "fm-1")

    # 1 — open the website
    st, html = call("GET", "/", out="bytes")
    step(1, "website opens (single process serves SPA + API)",
         st == 200 and b"live-platform bridge" in html and len(html) > 100000,
         (st, len(html)))

    # 2 — create an account
    st, reg = call("POST", "/api/v1/auth/register", body={
        "email": "student-journey@fde.local", "password": "J0urney-2026!",
        "displayName": "Student Journey"})
    if st == 409:
        st, reg = call("POST", "/api/v1/auth/login", body={
            "email": "student-journey@fde.local", "password": "J0urney-2026!"})
        T = reg.get("accessToken", "")
    else:
        T = reg.get("accessToken", "")
    step(2, "account created and access token issued", st in (200, 201) and T, (st, list(reg)[:4]))

    # 3 — start Mathematics for FDEs (first content subject)
    st, tree = call("GET", "/api/v1/curriculum/tree", token=T)
    subjects = tree.get("subjects", tree.get("tree", []))
    sjson = json.dumps(subjects)
    maths_first = '"mathematics"' in sjson and sjson.find('"mathematics"') < sjson.find('"programming"')
    st, fm = call("GET", "/api/v1/catalog/courses/fm", token=T)
    step(3, "curriculum served; Mathematics is the first subject; fm course opens",
         maths_first and st == 200 and (fm.get("course") or fm).get("code") == "fm",
         (st, sjson[:80]))

    # 4 — read a lesson
    st, lesson = call("GET", "/api/v1/catalog/lessons/fm-1", token=T)
    L = lesson.get("lesson") or lesson
    step(4, "lesson fm-1 opens with objectives and content blocks",
         st == 200 and len(L.get("objectives", [])) >= 2 and len(L.get("content", [])) >= 3,
         (st, len(L.get("content", []))))
    lesson_id = L.get("id")

    # 5 — complete an exercise (coding lab submission)
    st, ex = call("GET", "/api/v1/exercises/coding/code-c1", token=T)
    st2, sub = call("POST", "/api/v1/exercises/coding/code-c1/submissions", token=T,
                    body={"code": "// student journey submission\nconsole.log(6 * 24); // accumulator pattern"})
    st3, mine = call("GET", "/api/v1/exercises/coding/code-c1/submissions/mine", token=T)
    step(5, "coding exercise submitted and listed in my submissions",
         st == 200 and st2 == 201 and st3 == 200, (st, st2, st3))

    # 6 — take the quiz (graded attempt, answers from approved seed)
    st, qz = call("GET", "/api/v1/assessments/quizzes/quiz-fm-1", token=T)
    qs = qz.get("questions") or []
    answers = []
    for q in qs:
        src = next((sq for sq in fm1["quiz"] if sq["position"] == q.get("position")), None)
        correct = src["options"][src["answerIdx"]]
        for o in q.get("options", []):
            if (o.get("text") or "").strip() == correct.strip():
                answers.append({"questionId": q["id"], "optionId": o["id"]})
    st, att = call("POST", "/api/v1/assessments/quizzes/quiz-fm-1/attempts", token=T, body={})
    aid = att.get("attemptId")
    st2, _ = call("POST", f"/api/v1/assessments/attempts/{aid}/answers", token=T, body={"answers": answers})
    st3, res = call("POST", f"/api/v1/assessments/attempts/{aid}/submit", token=T, body={})
    step(6, "quiz submitted, scored and passed (graded attempt)",
         st3 == 200 and res.get("passed") is True and res.get("score") == 100,
         (st, st2, st3, {k: res.get(k) for k in ("score", "passed", "correctCount")}))

    # 7 — download the DOCX book
    st, iss = call("POST", "/api/v1/books/fm/downloads", token=T, body={"format": "docx"})
    docx = b""
    if st == 201 and iss.get("downloadUrl"):
        st2, docx = call("GET", iss["downloadUrl"], token=T, out="bytes")
    step(7, "DOCX print edition downloads through the token flow",
         st == 201 and docx[:2] == b"PK" and len(docx) > 400000,
         (st, len(docx), docx[:2]))

    # 8 — download the matching PDF
    st, iss = call("POST", "/api/v1/books/fm/downloads", token=T, body={"format": "pdf"})
    pdf = b""
    if st == 201 and iss.get("downloadUrl"):
        st2, pdf = call("GET", iss["downloadUrl"], token=T, out="bytes")
    step(8, "matching PDF downloads (%PDF magic bytes)",
         st == 201 and pdf[:4] == b"%PDF" and len(pdf) > 400000,
         (st, len(pdf), pdf[:4]))

    # 9 — track learning progress
    st, prog = call("GET", "/api/v1/me/progress", token=T)
    fm_pct = next((c.get("pct") for c in prog.get("courses", []) if c.get("code") == "fm"), None)
    if prog.get("lessonsDone", 0) == 0:  # completion gate: mark after the passing attempt
        call("POST", f"/api/v1/me/progress/lessons/{lesson_id}/complete", token=T, body={})
        st, prog = call("GET", "/api/v1/me/progress", token=T)
        fm_pct = next((c.get("pct") for c in prog.get("courses", []) if c.get("code") == "fm"), None)
    step(9, "progress dashboard reflects the completed lesson (fm 17%)",
         st == 200 and prog.get("lessonsDone", 0) >= 1 and fm_pct == 17,
         (st, prog.get("lessonsDone"), fm_pct))

    # 10 — continue to the next stage
    st, rec = call("GET", "/api/v1/me/recommendation", token=T)
    nxt = (rec.get("lesson") or rec.get("recommendedLesson") or {})
    st2, nxt_detail = call("GET", f"/api/v1/catalog/lessons/{nxt.get('code', 'fm-2')}", token=T)
    stage_of_next = (nxt_detail.get("lesson") or nxt_detail).get("stageNumber") or (nxt.get("stageNumber"))
    step(10, "next recommended lesson loads (learning continues past the completed one)",
         st == 200 and st2 == 200 and nxt.get("code") not in (None, "fm-1"),
         (st, st2, nxt.get("code"), stage_of_next))

    fails = [r for r in R if not r["pass"]]
    print(f"\nSTUDENT JOURNEY: {len(R) - len(fails)}/{len(R)} steps passed")
    import os
    os.makedirs("/home/z/my-project/audit", exist_ok=True)
    json.dump(R, open("/home/z/my-project/audit/e2e_student.json", "w"), indent=1)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
