#!/usr/bin/env python3
"""Project 2.2 - Daily Sales Report Automator.

Reads a clean sales CSV (the output of Project 3.1's cleaner also works,
because it keeps the same columns), computes a small summary, and writes a
dated text report next to the data.

Usage:
    python sales_report.py sales_data_clean.csv
    python sales_report.py sales_data_clean.csv --out reports/
"""
import argparse
import csv
import os
from datetime import date


def read_sales(path):
    """Read the CSV and return the rows as dictionaries."""
    with open(path, "r", encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def revenue(row):
    """Revenue for one row: units x price, minus the percentage discount."""
    units = int(row["units"])
    price = float(row["unit_price"])
    discount = float(row["discount_pct"] or 0)
    return units * price * (1 - discount / 100)


def summarize(rows):
    """Compute the summary numbers the report shows."""
    total_revenue = round(sum(revenue(r) for r in rows), 2)
    total_units = sum(int(r["units"]) for r in rows)
    by_region = {}
    by_product_units = {}
    for r in rows:
        by_region[r["region"]] = round(by_region.get(r["region"], 0) + revenue(r), 2)
        by_product_units[r["product"]] = (
            by_product_units.get(r["product"], 0) + int(r["units"]))
    best_product = max(by_product_units, key=by_product_units.get)
    return {
        "rows": len(rows),
        "total_revenue": total_revenue,
        "total_units": total_units,
        "by_region": by_region,
        "best_product": best_product,
        "best_product_units": by_product_units[best_product],
    }


def write_report(path, summary, source):
    lines = [
        "SALES REPORT",
        f"Generated : {date.today().isoformat()}",
        f"Source    : {source}",
        f"Rows      : {summary['rows']}",
        f"Units sold: {summary['total_units']}",
        f"Revenue   : {summary['total_revenue']:.2f}",
        "",
        "Revenue by region",
    ]
    for region in sorted(summary["by_region"]):
        lines.append(f"  {region:<8} {summary['by_region'][region]:12.2f}")
    lines.append("")
    lines.append(
        f"Best seller by units: {summary['best_product']} "
        f"({summary['best_product_units']} units)")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")


def main():
    parser = argparse.ArgumentParser(description="Summarize a sales CSV")
    parser.add_argument("csv_path")
    parser.add_argument("--out", default=".", help="report output folder")
    args = parser.parse_args()

    if not os.path.exists(args.csv_path):
        raise SystemExit(f"Error: {args.csv_path} does not exist.")
    rows = read_sales(args.csv_path)
    if not rows:
        raise SystemExit("Error: the CSV has no data rows.")

    summary = summarize(rows)
    out_path = os.path.join(args.out, f"sales_report_{date.today().isoformat()}.txt")
    os.makedirs(os.path.dirname(out_path) or ".", exist_ok=True)
    write_report(out_path, summary, args.csv_path)
    print(f"Report written to {out_path}")
    print(f"Revenue {summary['total_revenue']:.2f} from "
          f"{summary['total_units']} units in {summary['rows']} rows")


if __name__ == "__main__":
    main()
