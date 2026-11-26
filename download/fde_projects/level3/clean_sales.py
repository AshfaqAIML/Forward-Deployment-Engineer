#!/usr/bin/env python3
"""Project 3.1 - Clean the Market Dataset.

Reads sales_data_raw.csv (deliberately dirty) and writes sales_data_clean.csv.
Cleaning rules (agreed with the customer):
  1. Dates must match YYYY-MM-DD with a real month (1-12) and day (1-31).
  2. units must be a positive whole number; empty or invalid rows are dropped.
  3. region names are normalized to Title Case (NORTH, north -> North).
  4. channel names are normalized to lowercase (Store, Online, app -> store/online/app).
  5. exact duplicate rows are dropped.
Every dropped row is counted by reason and printed, so the customer can audit us.
"""
import argparse
import csv
import re
from datetime import date

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
VALID_REGIONS = {"north", "south", "east", "west"}
VALID_CHANNELS = {"store", "online", "app"}


def is_bad_date(value):
    """True when the date is missing, malformed, or not a real calendar day."""
    if not DATE_RE.match(value or ""):
        return True
    y, m, d = (int(p) for p in value.split("-"))
    try:
        date(y, m, d)
    except ValueError:
        return True
    return False


def clean_region(value):
    name = (value or "").strip().title()
    return name if name.lower() in VALID_REGIONS else None


def clean_channel(value):
    name = (value or "").strip().lower()
    return name if name in VALID_CHANNELS else None


def main():
    parser = argparse.ArgumentParser(description="Clean the raw sales CSV")
    parser.add_argument("raw_csv")
    parser.add_argument("out_csv")
    args = parser.parse_args()

    dropped = {"bad_date": 0, "bad_units": 0, "bad_region": 0,
               "bad_channel": 0, "duplicate": 0}
    seen = set()
    kept = []
    with open(args.raw_csv, "r", encoding="utf-8", newline="") as f:
        for row in csv.DictReader(f):
            if is_bad_date(row["date"]):
                dropped["bad_date"] += 1
                continue
            try:
                units = int(row["units"])
                if units <= 0:
                    raise ValueError
            except (ValueError, TypeError):
                dropped["bad_units"] += 1
                continue
            region = clean_region(row["region"])
            if region is None:
                dropped["bad_region"] += 1
                continue
            channel = clean_channel(row["channel"])
            if channel is None:
                dropped["bad_channel"] += 1
                continue
            clean = {
                "date": row["date"],
                "region": region,
                "product": row["product"].strip(),
                "units": units,
                "unit_price": f"{float(row['unit_price']):.2f}",
                "discount_pct": f"{float(row['discount_pct'] or 0):.0f}",
                "channel": channel,
            }
            key = tuple(clean.values())
            if key in seen:
                dropped["duplicate"] += 1
                continue
            seen.add(key)
            kept.append(clean)

    with open(args.out_csv, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "date", "region", "product", "units",
            "unit_price", "discount_pct", "channel"])
        writer.writeheader()
        writer.writerows(kept)

    print(f"Kept {len(kept)} rows; dropped " +
          ", ".join(f"{k}={v}" for k, v in dropped.items()))


if __name__ == "__main__":
    main()
