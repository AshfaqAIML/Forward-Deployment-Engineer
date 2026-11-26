#!/usr/bin/env python3
"""sync.py — frontend artifact integrity checker for FDE Academy.

Guards against the drift that caused the recovery incident:
  A. the canonical sources (scripts/web/*) must rebuild the shipped SPA byte-for-byte
  B. the backend's served copy (public/index.html) must equal the shipped SPA
  C. the landing page must not use design-token values that differ from the SPA
  D. every #/route link on the landing page must exist in the SPA route table

Usage:
  python3 scripts/web/sync.py            # check only (exit 1 on any drift)
  python3 scripts/web/sync.py --fix      # rebuild via build.py, then re-check
"""
import re
import subprocess
import sys
import os

WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)))
OUT = "/home/z/my-project/download/FDE_Academy_Frontend.html"
BACKEND = "/home/z/my-project/download/fde-academy-backend/public/index.html"
LANDING = "/home/z/my-project/download/FDE_Academy_Landing.html"

PARTS = ["core.js", "data1.js", "data2.js", "data3.js", "data4.js", "data5.js",
         "views1.js", "views2.js", "views3.js"]


def assemble():
    """Same assembly as build.py (single code path is build.py itself; this
    mirrors it exactly and is verified byte-identical by check A)."""
    head = open(os.path.join(WEB, "head.html"), encoding="utf-8").read()
    js = "\n;\n".join(open(os.path.join(WEB, p), encoding="utf-8").read() for p in PARTS)
    bridge = open(os.path.join(WEB, "bridge.js"), encoding="utf-8").read()
    return head.replace("</body>",
                        "<script>\n" + js + "\n</script>\n\n<script>\n" + bridge + "</script>\n</body>")


def tokens_of(html):
    m = re.search(r":root\s*\{([^}]*)\}", html)
    if not m:
        return {}
    out = {}
    for decl in m.group(1).split(";"):
        if ":" in decl:
            k, v = decl.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def spa_routes(html):
    """Static route patterns + the documented 'home' alias."""
    pats = set(re.findall(r'route\("([^"]*)"', html))
    pats.add("home")  # alias registered as ROUTES[0].view
    return pats


def route_matches(target, patterns):
    if target in patterns:
        return True
    segs = [s for s in target.split("/") if s]
    for p in patterns:
        psegs = [s for s in p.split("/") if s]
        if len(psegs) != len(segs):
            continue
        if all(ps.startswith(":") or ps == s for ps, s in zip(psegs, segs)):
            return True
    return False


def main():
    if "--fix" in sys.argv:
        r = subprocess.run([sys.executable, os.path.join(WEB, "build.py")])
        if r.returncode != 0:
            print("BUILD FAILED")
            return 1

    failures = []

    # A. canonical rebuild reproduces the shipped SPA
    built = assemble()
    disk = open(OUT, encoding="utf-8").read()
    if built == disk:
        print("PASS  A  sources rebuild the shipped SPA byte-for-byte")
    else:
        failures.append("A: scripts/web sources no longer reproduce download/FDE_Academy_Frontend.html — run scripts/web/build.py and commit BOTH artifacts")
        print("FAIL  A  rebuild differs from the shipped SPA")

    # B. backend served copy identical
    try:
        served = open(BACKEND, encoding="utf-8").read()
        if served == disk:
            print("PASS  B  backend public/index.html is identical to the shipped SPA")
        else:
            failures.append("B: backend copy differs — run scripts/web/build.py (it syncs both) or copy the artifact manually")
            print("FAIL  B  backend served copy has drifted")
    except FileNotFoundError:
        failures.append("B: backend public/index.html not found")
        print("FAIL  B  backend copy missing")

    # C. design-token parity (shared names must share values)
    spa_tokens = tokens_of(disk)
    landing_tokens = tokens_of(open(LANDING, encoding="utf-8").read())
    shared = sorted(set(spa_tokens) & set(landing_tokens))
    bad = [t for t in shared if spa_tokens[t] != landing_tokens[t]]
    if shared and not bad:
        print(f"PASS  C  {len(shared)} shared design tokens have identical values (landing <-> SPA)")
    elif bad:
        failures.append("C: design-token values differ between landing and SPA: " +
                        ", ".join(f"{t} (landing {landing_tokens[t]} vs SPA {spa_tokens[t]})" for t in bad))
        print("FAIL  C  token drift: " + ", ".join(bad))
    else:
        failures.append("C: no shared design tokens found — landing/SPA token sets do not overlap")
        print("FAIL  C  no shared tokens (check :root blocks)")

    # D. landing app links resolve in the SPA route table
    landing = open(LANDING, encoding="utf-8").read()
    targets = sorted(set(re.findall(r'FDE_Academy_Frontend\.html#/([a-z0-9/-]+)', landing)))
    patterns = spa_routes(disk)
    dead = [t for t in targets if not route_matches(t, patterns)]
    if targets and not dead:
        print(f"PASS  D  all {len(targets)} landing deep links match SPA routes")
    elif dead:
        failures.append("D: landing links to unknown SPA routes: " + ", ".join(dead))
        print("FAIL  D  broken links: " + ", ".join(dead))
    else:
        failures.append("D: no landing app links found to check")
        print("FAIL  D  no app links found on the landing page")

    print()
    if failures:
        print(f"{len(failures)} integrity failure(s):")
        for f in failures:
            print("  -", f)
        return 1
    print("Frontend integrity: all checks green.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
