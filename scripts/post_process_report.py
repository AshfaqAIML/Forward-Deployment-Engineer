#!/usr/bin/env python3
"""post_process_report.py — toc.md-mandated post-processing for the audit report:
1. footer PAGE fields get explicit format switches (Roman / arabic) by locating
   each footer's marker color (878787 = Roman front matter, 808080 = Arabic body)
2. remove empty <w:pgNumType/> (cover section, WPS compatibility)
"""
import re
import shutil
import zipfile

SRC = "/home/z/my-project/download/FDE_Academy_Quality_Audit_Report.docx"
TMP = "/tmp/report_patch.docx"

shutil.copy(SRC, TMP)
zin = zipfile.ZipFile(TMP)
items = {n: zin.read(n) for n in zin.namelist()}
zin.close()

changed = 0
for name in list(items):
    if re.match(r"word/footer\d+\.xml", name):
        xml = items[name].decode("utf-8")
        if "878787" in xml:
            xml2 = re.sub(r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
                          r"\1 PAGE \\* ROMAN \\* MERGEFORMAT \2", xml)
            fmt = "ROMAN"
        else:
            xml2 = re.sub(r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
                          r"\1 PAGE \\* arabic \\* MERGEFORMAT \2", xml)
            fmt = "arabic"
        if xml2 != xml:
            items[name] = xml2.encode("utf-8")
            changed += 1
            print(f"patched {name} → {fmt}")

doc = items["word/document.xml"].decode("utf-8")
n = doc.count("<w:pgNumType/>")
doc = doc.replace("<w:pgNumType/>", "")
if n:
    print(f"removed {n} empty pgNumType")

# dedupe TOC: the field paragraph (begin+instrText+separate) must not also
# carry the first hyperlink entry — the injected entries follow separately
m = re.search(r'(<w:p><w:pPr><w:pStyle w:val="TOC1"/>.*?<w:fldChar w:fldCharType="separate"/></w:r>)(<w:hyperlink.*?</w:hyperlink>)(</w:p>)', doc, re.S)
if m:
    doc = doc[:m.start()] + m.group(1) + m.group(3) + doc[m.end():]
    print("removed duplicate first TOC entry from field paragraph")
items["word/document.xml"] = doc.encode("utf-8")

with zipfile.ZipFile(SRC, "w", zipfile.ZIP_DEFLATED) as zout:
    for name, data in items.items():
        zout.writestr(name, data)
print(f"done: {changed} footers patched → {SRC}")
