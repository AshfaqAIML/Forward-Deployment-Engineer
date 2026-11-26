#!/usr/bin/env python3
"""Post-process the recovery report docx per docx skill toc.md:
- patch footer PAGE fields with explicit \\* ROMAN / \\* arabic switches (WPS compat)
- remove empty <w:pgNumType/> emitted for the cover section
Roman applies to footers referenced by the front-matter section, arabic to the body."""
import re, shutil, sys, zipfile

SRC = "/home/z/my-project/download/FDE_Academy_Audit_and_Recovery_Report.docx"
TMP = "/tmp/report_patch"

shutil.rmtree(TMP, ignore_errors=True)
with zipfile.ZipFile(SRC) as z:
    z.extractall(TMP)

# 1. document.xml: remove empty pgNumType, map each footer to its section order
doc_path = TMP + "/word/document.xml"
doc = open(doc_path, encoding="utf-8").read()
before = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
open(doc_path, "w", encoding="utf-8").write(doc)
print(f"removed {before} empty pgNumType")

# section order: cover (no footer ref), front matter (roman), body (arabic)
# find footerReference ids in document order
refs = re.findall(r'<w:footerReference[^>]*r:id="(rId\d+)"', doc)
rels = open(TMP + "/word/_rels/document.xml.rels", encoding="utf-8").read()
id2file = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="(footer\d+\.xml)"', rels))
ordered = [id2file[r] for r in refs if r in id2file]
print("footer refs in order:", ordered)

# unique footer files in order of first appearance: first=front matter, second=body
seen, plan = set(), []
for f in ordered:
    if f not in seen:
        seen.add(f)
        plan.append(f)
if len(plan) != 2:
    print(f"WARNING: expected 2 distinct footers, got {len(plan)}; patching all with arabic except first")
fmts = ["ROMAN", "arabic"] if len(plan) == 2 else ["arabic"] * max(1, len(plan))

for f, fmt in zip(plan, fmts):
    p = TMP + "/word/" + f
    xml = open(p, encoding="utf-8").read()
    xml, n = re.subn(
        r'(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)',
        rf'\1 PAGE \\* {fmt} \\* MERGEFORMAT \2',
        xml)
    open(p, "w", encoding="utf-8").write(xml)
    print(f"{f}: patched {n} PAGE field(s) -> {fmt}")

# rezip
import os
out = zipfile.ZipFile(SRC, "w", zipfile.ZIP_DEFLATED)
for root, _, files in os.walk(TMP):
    for fn in files:
        full = os.path.join(root, fn)
        out.write(full, os.path.relpath(full, TMP))
out.close()
print("rezipped", SRC)
