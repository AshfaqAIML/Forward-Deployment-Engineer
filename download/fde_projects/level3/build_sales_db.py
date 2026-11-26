#!/usr/bin/env python3
"""Project 3.2 - Build the Sales Reporting Database.

Reads sales_data_clean.csv and builds sales.db (SQLite):
  table sales(id, date, region, product, units, unit_price,
              discount_pct, channel, revenue)
  indexes on date and region for fast reporting queries.
Revenue is stored per row: units * unit_price * (1 - discount_pct / 100).
"""
import argparse
import csv
import sqlite3


def main():
    parser = argparse.ArgumentParser(description="Build sales.db from clean CSV")
    parser.add_argument("clean_csv")
    parser.add_argument("db_path")
    args = parser.parse_args()

    conn = sqlite3.connect(args.db_path)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS sales")
    cur.execute("""
        CREATE TABLE sales (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            date        TEXT NOT NULL,
            region      TEXT NOT NULL,
            product     TEXT NOT NULL,
            units       INTEGER NOT NULL,
            unit_price  REAL NOT NULL,
            discount_pct REAL NOT NULL,
            channel     TEXT NOT NULL,
            revenue     REAL NOT NULL
        )""")
    cur.execute("CREATE INDEX idx_sales_date ON sales(date)")
    cur.execute("CREATE INDEX idx_sales_region ON sales(region)")

    rows = []
    with open(args.clean_csv, "r", encoding="utf-8", newline="") as f:
        for r in csv.DictReader(f):
            revenue = (int(r["units"]) * float(r["unit_price"])
                       * (1 - float(r["discount_pct"]) / 100))
            rows.append((r["date"], r["region"], r["product"], int(r["units"]),
                         float(r["unit_price"]), float(r["discount_pct"]),
                         r["channel"], round(revenue, 2)))
    cur.executemany(
        "INSERT INTO sales(date, region, product, units, unit_price, "
        "discount_pct, channel, revenue) VALUES (?,?,?,?,?,?,?,?)", rows)
    conn.commit()

    cur.execute("SELECT COUNT(*), ROUND(SUM(revenue), 2) FROM sales")
    count, total = cur.fetchone()
    print(f"sales.db built: {count} rows, total revenue {total:.2f}")
    conn.close()


if __name__ == "__main__":
    main()
