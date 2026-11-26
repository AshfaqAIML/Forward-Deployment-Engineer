"""Correct TOC entry page numbers for titles that wrap across PDF lines.

patch_toc_pages.py matches a heading by its standalone line, which fails when a
long H1 wraps in the rendered PDF. This script normalizes whitespace per PDF
page and matches the full entry title inside the page text, taking the FIRST
body page that contains it. Only entries longer than MINLEN characters are
touched, so short unambiguous titles (Glossary, Answer Key) stay with
patch_toc_pages.py, which handles them by standalone line.
"""
import html
import re
import shutil
import subprocess
import sys
import zipfile

DOCX = sys.argv[1]
PDF = sys.argv[2]
FRONT = int(sys.argv[3]) if len(sys.argv) > 3 else 2
MINLEN = 40

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}
xml = files["word/document.xml"].decode("utf-8")

# TOC1 entry paragraphs in document order
entries = []
for m in re.finditer(r"<w:p\b[^>]*>.*?</w:p>", xml, re.S):
    para = m.group(0)
    if '<w:pStyle w:val="TOC1"' not in para:
        continue
    texts = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para)
    if len(texts) >= 2:
        title = "".join(texts[:-1])
        entries.append((m.start(), m.end(), title.strip(), texts[-1]))
print("TOC1 entries:", len(entries))

info = subprocess.run(["pdfinfo", PDF], capture_output=True, text=True).stdout
npages = int(re.search(r"Pages:\s+(\d+)", info).group(1))
print("PDF pages:", npages)

page_text = {}
for p in range(FRONT + 1, npages + 1):
    t = subprocess.run(["pdftotext", "-f", str(p), "-l", str(p), PDF, "-"],
                       capture_output=True, text=True).stdout
    page_text[p] = re.sub(r"\s+", " ", t)

replacements = []  # (start, end, new_para)
for start, end, title, page_run in entries:
    if len(title) < MINLEN:
        continue
    if not re.fullmatch(r"\d+", page_run):
        continue
    norm = re.sub(r"\s+", " ", html.unescape(title)).strip()
    found = None
    for p in range(FRONT + 1, npages + 1):
        if norm in page_text[p]:
            found = p
            break
    if found is None:
        print("  STILL NOT FOUND:", norm[:60])
        continue
    body_page = str(found - FRONT)
    if body_page == page_run:
        continue
    para = xml[start:end]
    runs = list(re.finditer(r"<w:t[^>]*>([^<]*)</w:t>", para))
    last = runs[-1]
    new_para = para[:last.start(1)] + body_page + para[last.end(1):]
    replacements.append((start, end, new_para))
    print(f"  {norm[:52]:<54} -> page {body_page}")

# apply from the end of the document backwards so offsets stay valid
for start, end, new_para in sorted(replacements, key=lambda r: -r[0]):
    xml = xml[:start] + new_para + xml[end:]

files["word/document.xml"] = xml.encode("utf-8")
with zipfile.ZipFile(DOCX + ".tmp", "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])
shutil.move(DOCX + ".tmp", DOCX)
print("wrapped-title page numbers updated:", len(replacements))
