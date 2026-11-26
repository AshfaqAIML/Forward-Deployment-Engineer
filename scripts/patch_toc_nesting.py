"""Fix run nesting: the merged TOC entry sits inside the separate-fldChar run.

Transformation inside the TOC field paragraph:
  <w:r><w:fldChar w:fldCharType="separate"/>BLOB</w:r>
  -> <w:r><w:fldChar w:fldCharType="separate"/></w:r>BLOB
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
p0_start = xml.rfind("<w:p ", 0, m.start())
if p0_start == -1:
    p0_start = xml.rfind("<w:p>", 0, m.start())
p0_end = xml.find("</w:p>", m.start()) + len("</w:p>")
para0 = xml[p0_start:p0_end]

pat = re.compile(
    r'(<w:r>(?:(?!</w:r>).)*?w:fldCharType="separate"/>)((?:(?!</w:r>).)*?)(</w:r>)',
    re.S,
)
mm = pat.search(para0)
if not mm:
    raise SystemExit("separate run not found in expected shape")
blob = mm.group(2)
if "<w:hyperlink" not in blob:
    raise SystemExit("no hyperlink blob inside separate run; nothing to fix")
para0_new = para0[:mm.start()] + mm.group(1) + mm.group(3) + blob + para0[mm.end():]
print("blob length moved out of run:", len(blob))

xml = xml[:p0_start] + para0_new + xml[p0_end:]
files["word/document.xml"] = xml.encode("utf-8")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for name in names:
        z.writestr(name, files[name])
shutil.move(TMP, DOCX)
print("fixed run nesting:", DOCX)
