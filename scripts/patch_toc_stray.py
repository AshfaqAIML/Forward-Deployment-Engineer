"""Remove the stray text run left inside the TOC field's opening paragraph.

The add_toc_placeholders script injects full entries as their own paragraphs, but the
field paragraph itself retained a bare text run of the first heading, which rendered as
a duplicate first TOC line. This patch deletes text runs that follow the `separate`
fldChar inside that opening paragraph, leaving the field structure intact.
"""
import re
import sys
import shutil
import zipfile

DOCX = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

xml = files["word/document.xml"].decode("utf-8")

# locate the TOC field's instrText and its enclosing paragraph
m = re.search(r"<w:instrText[^>]*>[^<]*TOC[^<]*</w:instrText>", xml)
if not m:
    raise SystemExit("TOC field not found")
p_start = xml.rfind("<w:p ", 0, m.start())
if p_start == -1:
    p_start = xml.rfind("<w:p>", 0, m.start())
p_end = xml.find("</w:p>", m.start()) + len("</w:p>")
para = xml[p_start:p_end]

sep = para.find('w:fldCharType="separate"')
if sep == -1:
    raise SystemExit("separate fldChar not found in field paragraph")

head, tail = para[:sep], para[sep:]
tail2, n = re.subn(r"<w:r>(?:(?!</w:r>).)*?<w:t[^>]*>[^<]*</w:t>(?:(?!</w:r>).)*?</w:r>", "", tail, flags=re.S)
print("stray text runs removed from field paragraph:", n)

xml = xml[:p_start] + head + tail2 + xml[p_end:]
files["word/document.xml"] = xml.encode("utf-8")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for name in names:
        z.writestr(name, files[name])
shutil.move(TMP, DOCX)
print("patched OK:", DOCX)
