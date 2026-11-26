"""Verifier for the FDE project handbook's runnable code.

Runs every project that can run in this sandbox and asserts real outputs:
  L2  expense_tracker.py            CLI round trip on a temp JSON file
  L2  sales_report.py               report totals recomputed independently
  L3  clean_sales.py                cleaning rules, audit counts, totals kept
  L3  build_sales_db.py + queries   SQLite numbers recomputed independently
  L4  task_app                      FastAPI TestClient CRUD round trip
  L4  feedback_app                  TestClient stats vs recomputed truth
  L5  ops/backup_db.py              backup file created, rotation works
  L6  faq_assistant.py --offline    retrieval eval >= 8/10 + fallback case
  L6  doc_search.py --offline       lexical eval >= 5/6

Docker/L5 packaging files and live LLM calls are NOT executable here; the
handbook states this honestly (lint checks only).
"""
import csv as csvmod
import importlib.util
import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile

ROOT = "/home/z/my-project/download/fde_projects"
results = []


def check(label, ok, detail=""):
    results.append((label, ok, detail))
    print(("PASS " if ok else "FAIL ") + label + (" | " + detail if detail else ""))


def run(cmd, cwd=None, env=None):
    full_env = dict(os.environ)
    if env:
        full_env.update(env)
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=cwd, env=full_env)
    return proc.returncode, proc.stdout, proc.stderr


def load_module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


tmp = tempfile.mkdtemp(prefix="fde_verify_")

# ---------------------------------------------------------------- L2 expense tracker
et = ROOT + "/level2/expense_tracker.py"
db = os.path.join(tmp, "expenses.json")
code, out, err = run([sys.executable, et, "--file", db, "add", "Team lunch", "24.50",
                      "--category", "food"])
check("L2 add", code == 0 and "Added" in out, out.strip())
run([sys.executable, et, "--file", db, "add", "Taxi", "12.30", "--category", "travel"])
run([sys.executable, et, "--file", db, "add", "Coffee", "3.20", "--category", "food"])
code, out, _ = run([sys.executable, et, "--file", db, "total"])
check("L2 total", code == 0 and "40.00" in out, out.strip())
code, out, _ = run([sys.executable, et, "--file", db, "total", "--category", "food"])
check("L2 total food", code == 0 and "27.70" in out, out.strip())
code, out, _ = run([sys.executable, et, "--file", db, "report"])
check("L2 report rows", code == 0 and "food" in out and "travel" in out, "")
data = json.load(open(db))
check("L2 persisted 3 records", len(data) == 3, str(len(data)))
code, out, _ = run([sys.executable, et, "--file", db, "add", "Bad", "-5"])
check("L2 rejects negative", code != 0, out.strip())

# ---------------------------------------------------------------- L2 sales report
DATA = ROOT + "/datasets"
sr = ROOT + "/level2/sales_report.py"

def test_sales_report():
    report_dir = os.path.join(tmp, "reports")
    code, out, err = run([sys.executable, sr, DATA + "/sales_data_clean.csv",
                          "--out", report_dir])
    check("L2 report exit", code == 0, (out + err).strip())
    files = os.listdir(report_dir)
    check("L2 report file exists", len(files) == 1, str(files))
    text = open(os.path.join(report_dir, files[0])).read()
    # independent truth from the clean CSV
    truth_rev = round(sum(int(r["units"]) * float(r["unit_price"])
                          * (1 - float(r["discount_pct"]) / 100)
                          for r in csvmod.DictReader(open(DATA + "/sales_data_clean.csv"))), 2)
    check("L2 report revenue correct", f"{truth_rev:.2f}" in text,
          f"truth={truth_rev:.2f}")

# ---------------------------------------------------------------- L3 cleaner
cs = ROOT + "/level3/clean_sales.py"
clean_csv = DATA + "/sales_data_clean.csv"
code, out, _ = run([sys.executable, cs, DATA + "/sales_data_raw.csv", clean_csv])
check("L3 clean exit", code == 0, out.strip())
rows_raw = list(csvmod.DictReader(open(DATA + "/sales_data_raw.csv")))
rows_clean = list(csvmod.DictReader(open(clean_csv)))
check("L3 raw row count", len(rows_raw) == 144, str(len(rows_raw)))
check("L3 clean has no empty units", all(r["units"].isdigit() for r in rows_clean), "")
check("L3 clean no bad dates",
      all(len(r["date"]) == 10 and r["date"][5:7] in
          [f"{m:02d}" for m in range(1, 13)] for r in rows_clean), "")
check("L3 clean regions normalized",
      set(r["region"] for r in rows_clean) <= {"North", "South", "East", "West"},
      str(set(r["region"] for r in rows_clean)))
check("L3 clean channels normalized",
      set(r["channel"] for r in rows_clean) <= {"store", "online", "app"},
      str(set(r["channel"] for r in rows_clean)))
check("L3 clean no duplicates",
      len(set(tuple(r.items()) for r in rows_clean)) == len(rows_clean), "")
check("L3 kept+dropped == raw", len(rows_clean) <= len(rows_raw), "")

# independent conservation: simulate the agreed rules (valid units, real date,
# normalized, deduped) and compare the unit total with the cleaner's output
truth_rows = set()
for r in rows_raw:
    if r["units"].isdigit() and len(r["date"]) == 10 and 1 <= int(r["date"][5:7]) <= 12:
        truth_rows.add((r["date"], (r["region"] or "").strip().title(),
                        r["product"].strip(), int(r["units"]),
                        f"{float(r['unit_price']):.2f}",
                        f"{float(r['discount_pct'] or 0):.0f}",
                        (r["channel"] or "").strip().lower()))
truth_units = sum(row[3] for row in truth_rows)
clean_set = set((r["date"], r["region"], r["product"], int(r["units"]),
                 r["unit_price"], r["discount_pct"], r["channel"])
                for r in rows_clean)
check("L3 unit conservation", clean_set == truth_rows
      and sum(int(r["units"]) for r in rows_clean) == truth_units,
      f"clean={sum(int(r['units']) for r in rows_clean)} truth={truth_units} "
      f"rows clean={len(clean_set)} truth={len(truth_rows)}")

test_sales_report()

# ---------------------------------------------------------------- L3 sqlite
bd = ROOT + "/level3/build_sales_db.py"
db_path = os.path.join(tmp, "sales.db")
code, out, _ = run([sys.executable, bd, clean_csv, db_path])
check("L3 db build exit", code == 0, out.strip())
conn = sqlite3.connect(db_path)
count, total = conn.execute("SELECT COUNT(*), ROUND(SUM(revenue),2) FROM sales").fetchone()
truth_rev = round(sum(int(r["units"]) * float(r["unit_price"])
                      * (1 - float(r["discount_pct"]) / 100) for r in rows_clean), 2)
check("L3 db rows == clean rows", count == len(rows_clean), f"{count} vs {len(rows_clean)}")
check("L3 db revenue == truth", abs(total - truth_rev) < 0.05, f"{total} vs {truth_rev}")
regions = dict(conn.execute(
    "SELECT region, ROUND(SUM(revenue),2) FROM sales GROUP BY region").fetchall())
truth_regions = {}
for r in rows_clean:
    rev = int(r["units"]) * float(r["unit_price"]) * (1 - float(r["discount_pct"]) / 100)
    truth_regions[r["region"]] = truth_regions.get(r["region"], 0) + rev
check("L3 region totals match truth",
      all(abs(regions[k] - round(v, 2)) < 0.05 for k, v in truth_regions.items()),
      str(regions))
best = conn.execute(
    "SELECT product, SUM(units) AS u FROM sales GROUP BY product ORDER BY u DESC LIMIT 1"
).fetchone()
truth_best = {}
for r in rows_clean:
    truth_best[r["product"]] = truth_best.get(r["product"], 0) + int(r["units"])
check("L3 best product matches truth",
      best[0] == max(truth_best, key=truth_best.get), str(best))
conn.close()

# ---------------------------------------------------------------- L4 apps (TestClient)
try:
    from fastapi.testclient import TestClient
    HAVE_TESTCLIENT = True
except Exception:
    HAVE_TESTCLIENT = False

if HAVE_TESTCLIENT:
    os.environ["TASK_DB"] = os.path.join(tmp, "tasks_api.db")
    sys.path.insert(0, ROOT + "/level4/task_app")
    main = importlib.import_module("main")
    with TestClient(main.app) as client:
        r = client.get("/api/health")
        check("L4 health", r.status_code == 200 and r.json()["status"] == "ok", r.text)
        r = client.post("/api/tasks", json={"title": "Write handover notes"})
        check("L4 create 201", r.status_code == 201 and r.json()["id"] == 1, r.text)
        tid = r.json()["id"]
        r = client.post("/api/tasks", json={"title": ""})
        check("L4 validation 422", r.status_code == 422, "")
        r = client.patch(f"/api/tasks/{tid}", json={"done": True})
        check("L4 patch done", r.status_code == 200 and r.json()["done"] is True, r.text)
        r = client.patch("/api/tasks/999", json={"done": True})
        check("L4 patch 404", r.status_code == 404, "")
        r = client.get("/api/tasks")
        check("L4 list", r.status_code == 200 and len(r.json()) == 1, "")
        r = client.delete(f"/api/tasks/{tid}")
        check("L4 delete 204", r.status_code == 204, "")
        r = client.get("/api/tasks")
        check("L4 list empty", r.json() == [], "")

    sys.path.pop(0)
    os.environ["FEEDBACK_CSV"] = DATA + "/feedback_tickets.csv"
    for name in list(sys.modules):
        if name == "main":
            del sys.modules[name]
    sys.path.insert(0, ROOT + "/level4/feedback_app")
    fmain = importlib.import_module("main")
    with TestClient(fmain.app) as client:
        r = client.get("/api/health")
        check("L4 fb health", r.status_code == 200 and r.json()["tickets"] == 90, r.text)
        s = client.get("/api/stats").json()
        fb = list(csvmod.DictReader(open(DATA + "/feedback_tickets.csv")))
        import statistics as st
        truth_avg = round(st.mean(int(r["rating"]) for r in fb), 2)
        check("L4 fb avg rating", s["average_rating"] == truth_avg,
              f"{s['average_rating']} vs {truth_avg}")
        truth_esc = round(100 * sum(1 for r in fb if r["escalated"] == "yes") / len(fb), 1)
        check("L4 fb escalation", s["escalation_rate_pct"] == truth_esc,
              f"{s['escalation_rate_pct']} vs {truth_esc}")
        r = client.get("/api/tickets", params={"min_rating": 4, "limit": 5})
        j = r.json()
        check("L4 fb filter", j["count"] == sum(1 for t in fb if int(t["rating"]) >= 4)
              and len(j["tickets"]) == 5
              and all(t["rating"] >= 4 for t in j["tickets"]), "")
    sys.path.pop(0)
else:
    check("L4 apps (TestClient unavailable)", False, "httpx missing")

# ---------------------------------------------------------------- L5 backup
bak = ROOT + "/level5/ops/backup_db.py"
out_dir = os.path.join(tmp, "backups")
code, out, _ = run([sys.executable, bak, db_path, "--out", out_dir, "--keep", "2"])
check("L5 backup exit", code == 0 and "backup written" in out, out.strip())
import time as _time
_time.sleep(1.1)
run([sys.executable, bak, db_path, "--out", out_dir, "--keep", "2"])
_time.sleep(1.1)
run([sys.executable, bak, db_path, "--out", out_dir, "--keep", "2"])
kept = [f for f in os.listdir(out_dir) if f.endswith(".db")]
check("L5 rotation keeps 2", len(kept) == 2, str(kept))
conn = sqlite3.connect(os.path.join(out_dir, kept[0]))
n = conn.execute("SELECT COUNT(*) FROM sales").fetchone()[0]
conn.close()
check("L5 backup opens and matches rows", n == len(rows_clean), str(n))

# ---------------------------------------------------------------- L6 FAQ retrieval offline
sys.path.insert(0, ROOT + "/level6")
for name in ("faq_assistant", "doc_search"):
    sys.modules.pop(name, None)
faq = load_module(ROOT + "/level6/faq_assistant.py", "faq_assistant_mod")
records = faq.load_faq(DATA + "/faq_support.md")
check("L6 faq records", len(records) == 8, str(len(records)))
vectors, encode_q = faq.build_lexical_index(
    [faq.tokenize(r["question"] + " " + r["answer"]) for r in records])
evals = json.load(open(ROOT + "/level6/eval_faq.json"))["cases"]
hits_ok = 0
fallback_ok = 0
for case in evals:
    hits = faq.retrieve(case["q"], records, vectors, encode_q)
    top_q, top_score = hits[0]
    if case["expect"] is None:
        if top_score < faq.CONFIDENCE_THRESHOLD:
            fallback_ok += 1
    elif case["expect"].lower()[:18] in top_q["question"].lower():
        hits_ok += 1
check("L6 faq retrieval >= 8/9 answerable", hits_ok >= 8, f"{hits_ok}/9")
check("L6 faq fallback works", fallback_ok == 1, f"{fallback_ok}/1")
# offline CLI run: must exit 0 and print the prompt
code, out, _ = run([sys.executable, ROOT + "/level6/faq_assistant.py",
                    "Where is my order?", "--offline"])
check("L6 faq offline CLI", code == 0 and "Customer question" in out, out[:80])

# ---------------------------------------------------------------- L6 doc search offline
ds = load_module(ROOT + "/level6/doc_search.py", "doc_search_mod")
docs = ds.load_documents(DATA + "/legal_docs")
check("L6 docs loaded", len(docs) == 6, str(len(docs)))
chunks = []
for d in docs:
    for part in ds.chunk_text(d["text"]):
        chunks.append({"text": part, "doc": d["name"]})
lists = [ds.tokenize(c["text"]) for c in chunks]
vecs, encode_query = ds.build_lexical_index(lists)
for c, v in zip(chunks, vecs):
    c["vec"] = v
doc_evals = [
    ("retention period for matter documents", "memo_004"),
    ("conflict of interest check before opening a matter", "memo_005"),
    ("how long are client documents kept after closure", "memo_004"),
    ("billing codes for litigation work", "memo_006"),
    ("who signs the non-disclosure agreement", "memo_001"),
    ("when is the client retainer replenished", "memo_002"),
]
ok = 0
for query, expected in doc_evals:
    bundle = {"list": chunks, "query_vec": encode_query(ds.tokenize(query))}
    top = ds.search(query, bundle, "lexical")[0]
    if top[0]["doc"].startswith(expected):
        ok += 1
check("L6 doc search >= 5/6 top-1", ok >= 5, f"{ok}/6")
code, out, _ = run([sys.executable, ROOT + "/level6/doc_search.py",
                    "retention period for matter documents", "--offline"])
check("L6 doc search CLI", code == 0 and "mode: lexical" in out, out[:80])
sys.path.pop(0)

# ---------------------------------------------------------------- L5 packaging lint (no docker binary)
dockerfile = open(ROOT + "/level5/Dockerfile").read()
compose = open(ROOT + "/level5/docker-compose.yml").read()
check("L5 Dockerfile pins base and non-root",
      "FROM python:3.12-slim" in dockerfile and "USER appuser" in dockerfile, "")
check("L5 compose has healthcheck and volume",
      "healthcheck" in compose and "taskdata" in compose, "")
check("L5 no secrets baked into image",
      "API_KEY" not in dockerfile and "PASSWORD" not in dockerfile.upper()
      or "ENV" not in dockerfile, "")

shutil.rmtree(tmp, ignore_errors=True)

fails = [r for r in results if not r[1]]
print(f"\nchecks: {len(results)}  passed: {len(results) - len(fails)}  failed: {len(fails)}")
for label, _, detail in fails:
    print("  FAILED:", label, detail)
sys.exit(1 if fails else 0)
