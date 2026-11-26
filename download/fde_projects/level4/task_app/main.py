#!/usr/bin/env python3
"""Project 4.1 - Task Tracker API (FastAPI + SQLite) with a static frontend.

Endpoints:
    GET    /api/health                  liveness check
    GET    /api/tasks                   list tasks
    POST   /api/tasks                   create {title, owner?}
    PATCH  /api/tasks/{id}              update {done} or {title}
    DELETE /api/tasks/{id}              remove a task
Static frontend served from ./static at /.
Run:  uvicorn main:app --reload --port 8000   (from the task_app folder)
"""
import os
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

DB_PATH = os.environ.get("TASK_DB", "tasks.db")
STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

app = FastAPI(title="Task Tracker API", version="1.0.0")


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


@app.on_event("startup")
def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                title      TEXT NOT NULL,
                owner      TEXT NOT NULL DEFAULT 'unassigned',
                done       INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )""")


class TaskIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    owner: str = Field(default="unassigned", max_length=60)


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    done: bool | None = None


def row_to_dict(row):
    return {"id": row["id"], "title": row["title"], "owner": row["owner"],
            "done": bool(row["done"]), "created_at": row["created_at"]}


@app.get("/api/health")
def health():
    with get_db() as conn:
        count = conn.execute("SELECT COUNT(*) FROM tasks").fetchone()[0]
    return {"status": "ok", "tasks": count}


@app.get("/api/tasks")
def list_tasks():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM tasks ORDER BY id DESC").fetchall()
    return [row_to_dict(r) for r in rows]


@app.post("/api/tasks", status_code=201)
def create_task(task: TaskIn):
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO tasks(title, owner) VALUES (?, ?)",
            (task.title.strip(), task.owner.strip()))
        new_id = cur.lastrowid
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (new_id,)).fetchone()
    return row_to_dict(row)


@app.patch("/api/tasks/{task_id}")
def update_task(task_id: int, update: TaskUpdate):
    with get_db() as conn:
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="task not found")
        title = update.title if update.title is not None else row["title"]
        done = int(update.done) if update.done is not None else row["done"]
        conn.execute("UPDATE tasks SET title = ?, done = ? WHERE id = ?",
                     (title, done, task_id))
        row = conn.execute("SELECT * FROM tasks WHERE id = ?", (task_id,)).fetchone()
    return row_to_dict(row)


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int):
    with get_db() as conn:
        cur = conn.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="task not found")


@app.get("/")
def index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))
