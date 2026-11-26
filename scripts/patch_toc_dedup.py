"""Remove a duplicated first TOC entry paragraph.

After the field-paragraph rebuild, the originally injected first entry may still
exist as its own paragraph. If the paragraph immediately after the TOC field
paragraph has the same visible text as the field paragraph's entry, delete it.
"""
import re
import shutil
import sys
import zipfile

DOCX = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

xml = files["word/document.xml"].decode("utf-8")

m = re.search(r"<w:instrText[^>]*>[^<]*TOC[^<]*</w:instrText>", xml)
p0_start = xml.rfind("<w:p ", 0, m.start())
if p0_start == -1:
    p0_start = xml.rfind("<w:p>", 0, m.start())
p0_end = xml.find("</w:p>", m.start()) + len("</w:p>")
para0 = xml[p0_start:p0_end]
t0 = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para0))

p1_start = xml.find("<w:p", p0_end)
p1_end = xml.find("</w:p>", p1_start) + len("</w:p>")
para1 = xml[p1_start:p1_end]
t1 = "".join(re.findall(r"<w:t[^>]*>([^<]*)</w:t>", para1))

print("field paragraph text:", repr(t0[:60]))
print("next paragraph text:", repr(t1[:60]))

if t0.strip() and t0.strip() == t1.strip():
    xml = xml[:p0_end] + xml[p1_end:]
    files["word/document.xml"] = xml.encode("utf-8")
    with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
        for name in names:
            z.writestr(name, files[name])
    shutil.move(TMP, DOCX)
    print("duplicate first TOC entry removed:", DOCX)
else:
    print("no duplicate found; nothing changed")
