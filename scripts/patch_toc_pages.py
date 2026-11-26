"""Correct TOC entry page numbers using the actually rendered PDF.

The injected placeholder numbers can be stale after TOC-depth trimming.
This script: (1) extracts each body page's text from the PDF, (2) finds the
page whose standalone line equals each TOC-1 entry title, (3) rewrites the
page-number run inside that entry paragraph, using body-relative numbering
(body page = PDF page - FRONT, where FRONT is the front-matter page count).
"""
import re
import shutil
import subprocess
import sys
import zipfile

DOCX = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/Everyday_Mathematics_for_Future_Engineers.docx"
PDF = sys.argv[2] if len(sys.argv) > 2 else DOCX.replace(".docx", ".pdf")
FRONT = int(sys.argv[3]) if len(sys.argv) > 3 else 2  # cover + TOC pages

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}
xml = files["word/document.xml"].decode("utf-8")

# --- collect TOC1 entry paragraphs (in document order)
entries = []
for m in re.finditer(r"<w:p\b[^>]*>.*?</w:p>", xml, re.S):
    para = m.group(0)
    if not re.search(r'<w:pStyle w:val="TOC1"\s*/>', para):
        continue
    ts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para)
    if len(ts) >= 2:
        entries.append((m.start(), m.end(), ts[0].strip(), ts[-1].strip()))
print("TOC1 entries found:", len(entries))

# --- page text lines from the PDF
npages = int(subprocess.run(["pdfinfo", PDF], capture_output=True, text=True)
             .stdout.split("Pages:")[1].split()[0])
line_first = {}
for p in range(FRONT + 1, npages + 1):
    t = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), PDF, "-"],
                       capture_output=True, text=True).stdout
    for line in t.splitlines():
        s = line.strip()
        if s and s not in line_first:
            line_first[s] = p

# --- rewrite page numbers (work backwards so offsets stay valid)
changed = 0
for (start, end, title, oldpage) in reversed(entries):
    body = (line_first.get(title, FRONT + 1)) - FRONT
    if title not in line_first:
        print("  NOT FOUND in body:", title)
        continue
    seg = xml[start:end]
    newts = re.sub(r"(<w:t[^>]*>)([^<]*)(</w:t>)(?!.*<w:t)",
                   lambda mm: mm.group(1) + str(body) + mm.group(3), seg, flags=re.S)
    if newts != seg:
        xml = xml[:start] + newts + xml[end:]
        changed += 1
    print("  %-45s %s -> %s" % (title[:45], oldpage, body))

files["word/document.xml"] = xml.encode("utf-8")
TMP = DOCX + ".tmp"
with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for name in names:
        z.writestr(name, files[name])
shutil.move(TMP, DOCX)
print("page numbers updated:", changed)
