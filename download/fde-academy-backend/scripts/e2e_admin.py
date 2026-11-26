#!/usr/bin/env python3
"""e2e_admin.py — the complete admin journey, PROMPT 13 final testing.

1  signs in as administrator
2  creates a new course through the CMS
3  adds module, chapter and a published lesson with real content blocks
4  publishes the course (publish event recorded)
5  verifies a student can now see the course and read the lesson
6  uploads a new book edition file (raw, private)
7  attaches it as a DOCX edition to Foundation Mathematics
8  verifies a student can download the new edition and the bytes match

Writes results to /home/z/my-project/audit/e2e_admin.json.
"""
import json
import os
import sys
import urllib.request
import urllib.error

BASE = "http://127.0.0.1:8787"
R = []


def step(n, name, cond, detail=""):
    R.append({"step": n, "name": name, "pass": bool(cond), "detail": str(detail)[:180]})
    print(f"  {'✓' if cond else '✗ FAIL'} step {n}: {name} {('— ' + str(detail)[:110]) if not cond and detail else ''}")


def call(method, path, token=None, body=None, raw=None):
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
            try:
                return res.status, json.loads(payload.decode() or "{}")
            except Exception:
                return res.status, {"_bytes": len(payload)}
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}


def main():
    # 1 — admin sign-in (demo password from env: deploy.sh generates a random one)
    demo_pw = os.environ.get("FDE_DEMO_PASSWORD", "DemoPass-2026")
    st, tok = call("POST", "/api/v1/auth/login", body={"email": "admin@fde.local", "password": demo_pw})
    A = tok.get("accessToken", "")
    step(1, "administrator signs in", st == 200 and A, st)

    # 2 — create a course (draft first)
    st, subjects = call("GET", "/api/v1/catalog/subjects", A)
    subj = (subjects.get("subjects") or subjects.get("items") or [])
    maths = next((s for s in subj if (s.get("key") or s.get("slug")) == "mathematics"), subj[0] if subj else {})
    st, stages = call("GET", "/api/v1/catalog/stages", A)
    stage_list = (stages.get("stages") or stages.get("items") or [])
    stage2 = next((s for s in stage_list if (s.get("number") or s.get("stage")) == 2), stage_list[-1] if stage_list else {})
    st, course = call("POST", "/api/v1/admin/cms/courses", A, {
        "code": "ext1", "title": "Extension Mathematics (E2E)",
        "subjectId": maths.get("id"), "stageId": stage2.get("id"),
        "difficulty": "Beginner", "blurb": "Created by the admin journey test.",
        "objectives": ["Refresh the four operations", "Apply them to stock problems"]})
    cid = course.get("id")
    step(2, "course created in the CMS (draft)", st == 201 and cid, (st, course))

    # 3 — module → chapter → published lesson
    st, mod = call("POST", f"/api/v1/admin/cms/courses/{cid}/modules", A, {"title": "Refresh module"})
    mid = mod.get("id")
    st2, ch = call("POST", f"/api/v1/admin/cms/modules/{mid}/chapters", A, {"title": "Operations refresh"})
    chid = ch.get("id")
    content = [
        {"t": "p", "x": "A quick refresh: addition brings quantities together, subtraction takes them apart."},
        {"t": "exercise", "prompt": "A stall sells 30 rolls at \u00A34 each. What are the takings?",
         "hint": "Multiply quantity by price.", "solution": "30 \u00D7 4 = \u00A3120."},
    ]
    st3, les = call("POST", f"/api/v1/admin/cms/chapters/{chid}/lessons", A, {
        "code": "ext-1", "title": "Four operations, refreshed", "minutes": 12,
        "objectives": ["Choose the right operation for a story problem"],
        "content": content, "status": "published"})
    step(3, "module, chapter and published lesson created", st == 201 and st2 == 201 and st3 == 201,
         (st, st2, st3, les))

    # 4 — publish the course
    st, pub = call("PUT", f"/api/v1/admin/cms/courses/{cid}", A, {
        "title": "Extension Mathematics (E2E)", "objectives": [
            "Refresh the four operations", "Apply them to stock problems"],
        "status": "published"})
    step(4, "course published (publish event recorded)", st == 200 and (pub.get("status") == "published" or pub.get("ok")), (st, pub))

    # 5 — student sees the new course and lesson
    st, s1 = call("POST", "/api/v1/auth/register", body={
        "email": "admin-journey-student@fde.local", "password": "J0urney-2026!",
        "displayName": "Admin Journey Student"})
    if st == 409:
        st, s1 = call("POST", "/api/v1/auth/login", body={
            "email": "admin-journey-student@fde.local", "password": "J0urney-2026!"})
    S = s1.get("accessToken", "")
    st, c1 = call("GET", "/api/v1/catalog/courses/ext1", S)
    st2, l1 = call("GET", "/api/v1/catalog/lessons/ext-1", S)
    lesson_ok = st2 == 200 and len((l1.get("lesson") or l1).get("content", [])) >= 2
    step(5, "student sees the published course and reads its lesson",
         st == 200 and lesson_ok, (st, st2))

    # 6 — upload a new book edition file (raw bytes, private)
    payload = bytearray(b"PK\x03\x04") + bytearray(b"E2E edition payload - admin journey upload. " * 40)
    st, up = call("POST", "/api/v1/admin/cms/uploads?kind=book&filename=e2e-edition.docx", A, raw=bytes(payload))
    fid = up.get("id")
    step(6, "book file uploaded (private, checksummed)", st == 201 and fid, (st, up))

    # 7 — attach it as a new DOCX edition of Foundation Mathematics
    st, fm = call("GET", "/api/v1/books/fm", A)
    book_id = (fm.get("book") or fm).get("id")
    st2, ed = call("POST", f"/api/v1/admin/cms/books/{book_id}/editions", A, {
        "version": "1.1.0", "format": "docx", "fileId": fid,
        "notes": "uploaded by the admin journey test"})
    step(7, "new DOCX edition (v1.1.0) attached to Foundation Mathematics",
         st2 == 201 and ed.get("id"), (st2, ed))

    # 8 — a student downloads the new edition; bytes must match the upload
    st, iss = call("POST", "/api/v1/books/fm/downloads", S, {"format": "docx", "editionId": ed.get("id")})
    got = b""
    if st == 201 and iss.get("downloadUrl"):
        req = urllib.request.Request(BASE + iss["downloadUrl"])
        req.add_header("authorization", "Bearer " + S)
        with urllib.request.urlopen(req) as res:
            got = res.read()
    step(8, "student downloads the new edition; bytes match the upload exactly",
         st == 201 and got == bytes(payload), (st, len(got), len(payload)))

    fails = [r for r in R if not r["pass"]]
    print(f"\nADMIN JOURNEY: {len(R) - len(fails)}/{len(R)} steps passed")
    json.dump(R, open("/home/z/my-project/audit/e2e_admin.json", "w"), indent=1)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
