#!/usr/bin/env python3
"""Project 5.2 - SQLite backup with rotation.

Copies the database with SQLite's Online Backup API (safe while the app runs),
keeps the newest N backups, and deletes older ones.

Usage:
    python backup_db.py tasks.db --out /var/backups/tasks --keep 7
"""
import argparse
import os
import sqlite3
from datetime import datetime


def backup(db_path, out_dir, keep):
    os.makedirs(out_dir, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    target = os.path.join(out_dir, f"tasks_backup_{stamp}.db")

    source = sqlite3.connect(db_path)
    destination = sqlite3.connect(target)
    with destination:
        source.backup(destination)  # safe while the app is writing
    destination.close()
    source.close()

    backups = sorted(f for f in os.listdir(out_dir)
                     if f.startswith("tasks_backup_") and f.endswith(".db"))
    removed = 0
    for old in backups[:-keep]:
        os.remove(os.path.join(out_dir, old))
        removed += 1
    print(f"backup written: {target}")
    print(f"backups kept: {min(len(backups), keep)}, removed: {removed}")
    return target


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Back up a SQLite database")
    parser.add_argument("db_path")
    parser.add_argument("--out", default="/var/backups/tasks")
    parser.add_argument("--keep", type=int, default=7)
    args = parser.parse_args()
    if not os.path.exists(args.db_path):
        raise SystemExit(f"Error: {args.db_path} does not exist.")
    backup(args.db_path, args.out, args.keep)
