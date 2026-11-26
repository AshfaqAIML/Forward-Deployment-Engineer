"""Merge the first injected TOC entry into the TOC field's opening paragraph.

After removing the stray text run, the field paragraph rendered as an empty
dotted line above the first entry. This patch moves the first entry's runs
(hyperlink + tab + PAGEREF) into the field paragraph right after the `separate`
fldChar, then deletes the now-empty first entry paragraph.
"""
import re
import shutil
import zipfile

DOCX = "/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

xml = files["word/document.xml"].decode("utf-8")

m = re.search(r"<w:instrText[^>]*>[^<]*TOC[^<]*</w:instrText>", xml)
if not m:
    raise SystemExit("TOC field not found")
p0_start = xml.rfind("<w:p ", 0, m.start())
if p0_start == -1:
    p0_start = xml.rfind("<w:p>", 0, m.start())
p0_end = xml.find("</w:p>", m.start()) + len("</w:p>")
para0 = xml[p0_start:p0_end]

# next paragraph after the field paragraph
p1_start = xml.find("<w:p ", p0_end)
if p1_start == -1:
    p1_start = xml.find("<w:p>", p0_end)
p1_end = xml.find("</w:p>", p1_start) + len("</w:p>")
para1 = xml[p1_start:p1_end]

t1 = re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para1)
print("first entry paragraph texts:", t1[:4])
if not t1 or "Executive Summary" not in t1[0]:
    raise SystemExit("unexpected first entry paragraph, aborting")

# inner content of para1 without its paragraph properties
inner = re.sub(r"^<w:p[^>]*>", "", para1)
inner = re.sub(r"<w:pPr>.*?</w:pPr>", "", inner, count=1, flags=re.S)
inner = inner[: -len("</w:p>")]

# insert after the separate fldChar run in para0
sep_run_end = para0.find("/>", para0.find('w:fldCharType="separate"'))
sep_run_end = para0.find(">", sep_run_end) + 1
para0_new = para0[:sep_run_end] + inner + para0[sep_run_end:]

xml = xml[:p0_start] + para0_new + xml[p0_end:p1_start] + xml[p1_end:]
files["word/document.xml"] = xml.encode("utf-8")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for name in names:
        z.writestr(name, files[name])
shutil.move(TMP, DOCX)
print("merged first TOC entry into field paragraph:", DOCX)
