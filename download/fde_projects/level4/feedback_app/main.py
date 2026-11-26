#!/usr/bin/env python3
"""Project 4.2 - Feedback Dashboard API (FastAPI) with a static dashboard page.

Reads feedback_tickets.csv at startup and serves summary statistics.
Endpoints:
    GET /api/health                      liveness check
    GET /api/stats                       totals, average rating, channel and
                                         category breakdown, escalation rate
    GET /api/tickets?limit=&min_rating=  filtered recent tickets
Run:  uvicorn main:app --reload --port 8010   (from the feedback_app folder,
with the datasets folder beside it or FEEDBACK_CSV set to the CSV path)
"""
import csv
import os
import statistics
from collections import defaultdict

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_CSV = os.path.join(HERE, "..", "..", "datasets", "feedback_tickets.csv")
CSV_PATH = os.environ.get("FEEDBACK_CSV", DEFAULT_CSV)
STATIC_DIR = os.path.join(HERE, "static")

app = FastAPI(title="Feedback Dashboard API", version="1.0.0")
TICKETS = []


@app.on_event("startup")
def load_data():
    """Load the whole CSV into memory once (fine for tens of thousands of rows)."""
    global TICKETS
    with open(CSV_PATH, "r", encoding="utf-8", newline="") as f:
        TICKETS = [
            {"ticket_id": int(r["ticket_id"]), "date": r["date"],
             "channel": r["channel"], "category": r["category"],
             "rating": int(r["rating"]), "comment": r["comment"],
             "escalated": r["escalated"] == "yes"}
            for r in csv.DictReader(f)
        ]


def wavg(values):
    return round(statistics.mean(values), 2) if values else None


@app.get("/api/health")
def health():
    return {"status": "ok", "tickets": len(TICKETS)}


@app.get("/api/stats")
def stats():
    if not TICKETS:
        raise HTTPException(status_code=503, detail="no data loaded")
    by_channel = defaultdict(list)
    by_category = defaultdict(list)
    for t in TICKETS:
        by_channel[t["channel"]].append(t["rating"])
        by_category[t["category"]].append(t["rating"])
    escalated = sum(1 for t in TICKETS if t["escalated"])
    return {
        "total_tickets": len(TICKETS),
        "average_rating": wavg([t["rating"] for t in TICKETS]),
        "escalation_rate_pct": round(100.0 * escalated / len(TICKETS), 1),
        "by_channel": {k: {"count": len(v), "avg_rating": wavg(v)}
                       for k, v in sorted(by_channel.items())},
        "by_category": {k: {"count": len(v), "avg_rating": wavg(v)}
                        for k, v in sorted(by_category.items())},
        "low_rating_tickets": sum(1 for t in TICKETS if t["rating"] <= 2),
    }


@app.get("/api/tickets")
def tickets(limit: int = Query(default=20, ge=1, le=200),
            min_rating: int = Query(default=1, ge=1, le=5)):
    selected = [t for t in TICKETS if t["rating"] >= min_rating]
    selected.sort(key=lambda t: (t["date"], t["ticket_id"]), reverse=True)
    return {"count": len(selected), "tickets": selected[:limit]}


@app.get("/")
def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
