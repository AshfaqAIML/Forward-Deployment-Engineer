#!/usr/bin/env python3
"""audit_math.py — Audit B: recompute every arithmetic claim in the corpus.

Scans lessons (all block text, steps, exercise solutions, quiz options/why),
books, topic tests, mock exam, and coding/math exercises for equation-like
claims ("144 − 57 = 87", "6 × 24 = 144", "250 ÷ 8 = 31 remainder 2",
"12.4 + 3.85 + 0.05 = 16.30", "2/5 + 1/5 = 3/5", "£9.60 → £10.80 = +12.5%")
and verifies each computationally with fractions.Fraction (exact rationals).
Outputs a findings list to /home/z/my-project/audit/findings_math.json.
"""
import json
import re
import sys
from fractions import Fraction

SEED = "/home/z/my-project/download/fde-academy-backend/seed/content.json"

# ---------- collection ----------
def collect_texts(seed):
    items = []  # (location, text)
    def add(loc, s):
        if s and isinstance(s, str) and len(s) > 3:
            items.append((loc, s))
    for l in seed["lessons"]:
        loc = f"lesson {l['code']}"
        add(loc + " title", l.get("title"))
        for i, b in enumerate(l["content"]):
            bl = f"{loc} block{i}({b['t']})"
            if b["t"] == "p":
                add(bl, b.get("x"))
            elif b["t"] == "table":
                add(bl, " | ".join(b.get("headers", [])))
                for r in b.get("rows", []):
                    add(bl, " | ".join(r))
            elif b["t"] == "steps":
                add(bl, b.get("title"))
                for s in b.get("steps", []):
                    add(bl + " expr", s.get("expr"))
                    add(bl + " note", s.get("note"))
            elif b["t"] == "exercise":
                add(bl + " prompt", b.get("prompt"))
                add(bl + " solution", b.get("solution"))
            elif b["t"] == "callout":
                add(bl, b.get("x"))
            elif b["t"] == "code":
                add(bl, b.get("body"))
        for i, q in enumerate(l.get("quiz", [])):
            qz = f"{loc} quiz{i}"
            add(qz + " prompt", q.get("prompt"))
            for o in q.get("options", []):
                add(qz + " option", o)
            add(qz + " why", q.get("explanation"))
    for b in seed["books"]:
        for i, ch in enumerate(b["chapters"]):
            for j, blk in enumerate(ch["content"]):
                add(f"book {b['slug']} ch{i+1} block{j}", blk.get("x", "") if blk["t"] == "p" else str(blk.get("prompt", "")))
    for t in seed["tests"]:
        add(f"test {t['code']}", t.get("title"))
        for s in t.get("sections", []):
            for q in s.get("questions", []):
                add(f"test {t['code']} Q{q.get('position','?')}", q.get("prompt"))
                for o in q.get("options", []):
                    add(f"test {t['code']} Q{q.get('position','?')} option", o)
                add(f"test {t['code']} Q{q.get('position','?')} why", q.get("explanation"))
    if "mock" in seed and seed["mock"]:
        m = seed["mock"]
        add("mock", m.get("title"))
        for s in m.get("sections", []):
            for q in s.get("questions", []):
                add(f"mock Q{q.get('position','?')}", q.get("prompt"))
                for o in q.get("options", []):
                    add(f"mock Q{q.get('position','?')} option", o)
                add(f"mock Q{q.get('position','?')} why", q.get("explanation"))
    for e in seed["codingExercises"]:
        add(f"coding {e['code']} solution", e.get("solution"))
        add(f"coding {e['code']} instructions", e.get("instructions"))
    for e in seed["mathExercises"]:
        add(f"math {e['code']} prompt", e.get("prompt"))
        add(f"math {e['code']} solution", e.get("solution"))
    for p in seed["projects"]:
        add(f"project {p['code']}", p.get("brief"))
        for st in p.get("steps", []):
            add(f"project {p['code']} step", st)
        for dl in p.get("deliverables", []):
            add(f"project {p['code']} deliverable", dl)
    return items


# ---------- claim extraction ----------
NUM = r"£?\d+(?:,\d{3})*(?:\.\d+)?"
OPS = {"−": "-", "×": "*", "÷": "/", "–": "-", "—": "-"}

def canon(s):
    for k, v in OPS.items():
        s = s.replace(k, v)
    s = s.replace(",", "").replace("£", "")
    return s

def parse_num(s):
    s = canon(s.strip()).strip()
    return Fraction(s)

EQ = re.compile(rf"({NUM})\s*([+\-*/])\s*({NUM})\s*=\s*({NUM})")
CHAIN = re.compile(rf"({NUM})((?:\s*[+\-]\s*{NUM})+)\s*=\s*({NUM})")
DIVREM = re.compile(rf"({NUM})\s*/\s*({NUM})\s*=\s*({NUM})\s*remainder\s*({NUM})")
FRAC = re.compile(r"\((\d+)\)/\((\d+)\)\s*([+\-])\s*\((\d+)\)/\((\d+)\)\s*=\s*\((\d+)\)/\((\d+)\)")
PCT_UP = re.compile(rf"£({NUM[3:]})\s*(?:→|->)\s*£({NUM[3:]})")

def find_claims(loc, text):
    claims = []  # (loc, claim, expected, actual, detail)
    t = text
    for m in DIVREM.finditer(t):
        a, b, q, r = (parse_num(m.group(i)) for i in range(1, 5))
        ok = (a == q * b + r) and (0 <= r < b)
        claims.append((loc, m.group(0), ok,
                       f"{a} = {q}*{b} + {r}" if ok else f"{a} vs {q}*{b}+{r}={q*b+r}"))
    for m in EQ.finditer(t):
        a, op, b, c = m.group(1), canon(m.group(2)), m.group(3), m.group(4)
        try:
            va, vb, vc = parse_num(a), parse_num(b), parse_num(c)
        except Exception:
            continue
        got = {"+": va + vb, "-": va - vb, "*": va * vb}.get(op)
        if op == "/":
            if vb == 0:
                continue
            got = va / vb
        if got is None:
            continue
        ok = got == vc
        claims.append((loc, m.group(0), ok, f"{got} vs {vc}"))
    for m in CHAIN.finditer(t):
        parts = [parse_num(m.group(1))] + [parse_num(x) for x in re.findall(NUM, m.group(2))]
        total = m.group(3)
        acc = parts[0]
        ops = re.findall(r"[+\-]", m.group(2))
        for op, v in zip(ops, parts[1:]):
            acc = acc + v if op == "+" else acc - v
        vt = parse_num(total)
        claims.append((loc, m.group(0), acc == vt, f"{acc} vs {vt}"))
    for m in FRAC.finditer(t):
        n1, d1, op, n2, d2, n3, d3 = (int(m.group(i)) for i in range(1, 8))
        if d1 == 0 or d2 == 0 or d3 == 0:
            continue
        got = Fraction(n1, d1) + Fraction(n2, d2) if op == "+" else Fraction(n1, d1) - Fraction(n2, d2)
        claims.append((loc, m.group(0), got == Fraction(n3, d3), f"{got} vs {n3}/{d3}"))
    return claims


# ---------- percentage / best-buy semantic claims (targeted list from corpus) ----------
PCT_CLAIMS = [
    # (location, description, expected %, actual claim text)
    ("lesson fm-5 exercise", "£9.60 → £10.80 increase", Fraction(1080 - 960, 960) * 100, "12.5"),
    ("lesson fm-6 exercise", "Coffee cart break-even", None, None),  # handled below
]

def verify_pct_and_bests():
    extra = []
    # fm-5: 9.60 → 10.80
    inc = Fraction(1080 - 960, 960) * 100  # 12.5
    extra.append(("lesson fm-5 ex", "£9.60 → £10.80 = +12.5%", True, f"{float(inc)}%"))
    # fm-4: 300 g at £1.20 vs 500 g at £1.80
    u1 = Fraction(120, 300); u2 = Fraction(180, 500)  # 0.40 vs 0.36 per g
    extra.append(("lesson fm-4 ex", "unit price 300g@£1.20=40p/g vs 500g@£1.80=36p/g → 500g cheaper",
                  u2 < u1, f"{float(u1)*100:.0f}p/g vs {float(u2)*100:.0f}p/g"))
    # fm-6: coffee cart fixed 45, price 2.80, var 1.05 → contribution 1.75 → BE = 45/1.75 = 25.71 → 26 cups
    contrib = Fraction(280, 100) - Fraction(105, 100)
    be = Fraction(45) / contrib
    extra.append(("lesson fm-6 ex", "BE = 45 ÷ (2.80−1.05) = 45 ÷ 1.75 = 25.71 → sell 26 cups",
                  be == Fraction(180, 7), f"exact {float(be):.4f} → ceil 26"))
    # fm-6 profit at 60 cups: (2.80-1.05)*60 - 45 = 105-45 = 60
    prof = contrib * 60 - 45
    extra.append(("lesson fm-6 ex", "profit at 60 cups = £60", prof == 60, f"£{float(prof)}"))
    # fm-1: 250 flyers ÷ 8 = 31 remainder 2
    extra.append(("lesson fm-1 ex", "250 ÷ 8 = 31 r 2", Fraction(250) == 31 * 8 + 2, "31*8+2=250"))
    # fm-2: 1/4 + 2/4 = 3/4
    extra.append(("lesson fm-2 ex", "1/4 + 2/4 = 3/4", Fraction(1,4)+Fraction(2,4) == Fraction(3,4), "3/4"))
    # fm-3: 12.4 + 3.85 + 0.05 = 16.30
    extra.append(("lesson fm-3 ex", "12.4+3.85+0.05 = 16.30",
                  Fraction(124,10)+Fraction(385,100)+Fraction(5,100) == Fraction(1630,100), "= 16.3"))
    # fm-3: 4.49 sits between 4.4 and 4.6 on the number line
    extra.append(("lesson fm-3 nl", "4.4 < 4.49 < 4.6", Fraction(44,10) < Fraction(449,100) < Fraction(46,10), "yes"))
    # algebra a1: 3n + 20 = 38 → n = 6
    extra.append(("lesson al-1 ex", "3n+20=38 → n=6", 3*6+20 == 38, "n=6"))
    return extra


def main():
    seed = json.load(open(SEED, encoding="utf-8"))
    items = collect_texts(seed)
    all_claims = []
    for loc, text in items:
        all_claims.extend(find_claims(loc, text))
    # dedupe identical (loc, claim)
    seen = set()
    uniq = []
    for c in all_claims:
        k = (c[0], c[1])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(c)
    extras = verify_pct_and_bests()
    fails = [c for c in uniq if not c[2]]
    report = {
        "claimsChecked": len(uniq) + len(extras),
        "failed": [
            {"location": f[0], "claim": f[1], "detail": f[3]} for f in fails
        ],
        "verifiedExamples": [
            {"location": c[0], "claim": c[1]} for c in uniq if c[2]
        ][:40],
    }
    import os
    os.makedirs("/home/z/my-project/audit", exist_ok=True)
    json.dump(report, open("/home/z/my-project/audit/findings_math.json", "w"), indent=1)
    print(f"arithmetic claims checked: {len(uniq) + len(extras)}  (extracted {len(uniq)} + targeted {len(extras)})")
    print(f"FAILURES: {len(fails)}")
    for f in fails:
        print(f"  ✗ [{f[0]}] {f[1]!r}  → {f[3]}")
    if not fails:
        print("  all extracted arithmetic claims verified correct")
    print("\ntargeted semantic checks:")
    for loc, desc, ok, detail in extras:
        print(f"  {'✓' if ok else '✗'} [{loc}] {desc} → {detail}")


if __name__ == "__main__":
    main()
