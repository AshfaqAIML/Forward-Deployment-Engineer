#!/usr/bin/env python3
"""Project 2.1 - Expense Tracker CLI.

A small command-line expense tracker that saves data to a JSON file.
Usage:
    python expense_tracker.py add "Team lunch" 24.50 --category food
    python expense_tracker.py list
    python expense_tracker.py total
    python expense_tracker.py total --category food
    python expense_tracker.py report
"""
import argparse
import json
import os
import sys
from datetime import date

DEFAULT_FILE = "expenses.json"


def load_expenses(path):
    """Load the expense list from the JSON file (empty list if missing)."""
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_expenses(path, expenses):
    """Write the expense list back to the JSON file."""
    with open(path, "w", encoding="utf-8") as f:
        json.dump(expenses, f, indent=2)


def cmd_add(args):
    expenses = load_expenses(args.file)
    amount = round(args.amount, 2)
    if amount <= 0:
        sys.exit("Error: the amount must be greater than zero.")
    expenses.append({
        "date": date.today().isoformat(),
        "description": args.description,
        "amount": amount,
        "category": args.category,
    })
    save_expenses(args.file, expenses)
    print(f"Added: {args.description} ({amount:.2f}, {args.category})")


def cmd_list(args):
    expenses = load_expenses(args.file)
    if not expenses:
        print("No expenses recorded yet.")
        return
    for i, e in enumerate(expenses, 1):
        print(f"{i:3}. {e['date']}  {e['description']:<28} "
              f"{e['category']:<10} {e['amount']:8.2f}")


def cmd_total(args):
    expenses = load_expenses(args.file)
    selected = [e for e in expenses
                if args.category is None or e["category"] == args.category]
    total = round(sum(e["amount"] for e in selected), 2)
    label = args.category if args.category else "all categories"
    print(f"Total for {label}: {total:.2f} across {len(selected)} expense(s)")


def cmd_report(args):
    expenses = load_expenses(args.file)
    if not expenses:
        print("No expenses recorded yet.")
        return
    by_category = {}
    for e in expenses:
        by_category[e["category"]] = round(
            by_category.get(e["category"], 0) + e["amount"], 2)
    print("Report by category")
    print("-" * 30)
    for cat in sorted(by_category):
        print(f"{cat:<12} {by_category[cat]:10.2f}")
    print("-" * 30)
    print(f"{'TOTAL':<12} {round(sum(by_category.values()), 2):10.2f}")


def main():
    parser = argparse.ArgumentParser(description="Tiny expense tracker")
    parser.add_argument("--file", default=DEFAULT_FILE,
                        help="path of the JSON data file")
    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add", help="record a new expense")
    p_add.add_argument("description")
    p_add.add_argument("amount", type=float)
    p_add.add_argument("--category", default="general")

    sub.add_parser("list", help="show every expense")
    p_total = sub.add_parser("total", help="show the total")
    p_total.add_argument("--category", default=None)
    sub.add_parser("report", help="break the total down by category")

    args = parser.parse_args()
    {"add": cmd_add, "list": cmd_list,
     "total": cmd_total, "report": cmd_report}[args.command](args)


if __name__ == "__main__":
    main()
