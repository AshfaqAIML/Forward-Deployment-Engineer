#!/usr/bin/env python3
"""Assemble the FDE Academy single-file frontend: head.html + JS parts inline."""
import re
import subprocess

WEB = "/home/z/my-project/scripts/web"
OUT = "/home/z/my-project/download/FDE_Academy_Frontend.html"

head = open(f"{WEB}/head.html").read()
parts = ["core.js", "data1.js", "data2.js", "data3.js", "data4.js", "data5.js",
         "views1.js", "views2.js", "views3.js"]

# syntax-check every part first
for p in parts:
    r = subprocess.run(["node", "--check", f"{WEB}/{p}"], capture_output=True, text=True)
    if r.returncode != 0:
        raise SystemExit(f"SYNTAX FAIL in {p}:\n{r.stderr}")

js = "\n;\n".join(open(f"{WEB}/{p}").read() for p in parts)

# bridge.js is NOT joined into the app bundle: it ships as its own <script>
# block after the app, exactly as in the shipped artifact. Check it too.
r = subprocess.run(["node", "--check", f"{WEB}/bridge.js"], capture_output=True, text=True)
if r.returncode != 0:
    raise SystemExit(f"SYNTAX FAIL in bridge.js:\n{r.stderr}")
bridge = open(f"{WEB}/bridge.js").read()

# inject scripts before </body>: app bundle, then the live-platform bridge
assert "</body>" in head
doc = head.replace("</body>", "<script>\n" + js + "\n</script>\n\n<script>\n" + bridge + "</script>\n</body>")

# The built page is the canonical artifact: write the download copy AND the
# backend's served copy atomically so they can never drift apart.
BACKEND = "/home/z/my-project/download/fde-academy-backend/public/index.html"
open(OUT, "w").write(doc)
open(BACKEND, "w").write(doc)
print("written:", OUT, len(doc) // 1024, "KB")
print("synced: ", BACKEND)

# syntax-check the combined JS as one module as well
open("/tmp/fde_combined.js", "w").write(js)
r = subprocess.run(["node", "--check", "/tmp/fde_combined.js"], capture_output=True, text=True)
if r.returncode != 0:
    print("COMBINED SYNTAX FAIL:\n", r.stderr[:2000])
    raise SystemExit(1)
print("combined JS syntax OK")
