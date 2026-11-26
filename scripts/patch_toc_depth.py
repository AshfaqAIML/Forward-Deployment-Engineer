"""Trim the injected TOC to level-1 entries only.

add_toc_placeholders --auto injects entries for every heading level, but this
book's TOC field range is 1-1. Remove paragraphs styled TOC2/TOC3 so the
table of contents lists chapters and major sections only.
"""
import re
import shutil
import sys
import zipfile

DOCX = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/Everyday_Mathematics_for_Future_Engineers.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

xml = files["word/document.xml"].decode("utf-8")

removed = 0
out = []
pos = 0
for m in re.finditer(r"<w:p\b[^>]*>.*?</w:p>", xml, re.S):
    para = m.group(0)
    out.append(xml[pos:m.start()])
    if re.search(r'<w:pStyle w:val="TOC[23]"\s*/>', para):
        removed += 1
    else:
        out.append(para)
    pos = m.end()
out.append(xml[pos:])
xml = "".join(out)

files["word/document.xml"] = xml.encode("utf-8")
with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for name in names:
        z.writestr(name, files[name])
shutil.move(TMP, DOCX)
print("removed TOC level-2/3 entries:", removed)
