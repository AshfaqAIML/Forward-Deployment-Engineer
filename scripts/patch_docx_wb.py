"""Post-process the workbook DOCX for WPS/Office page-number compatibility.

The workbook has four sections: cover (no footer), front matter (ROMAN), body
exercises (arabic, restarts at 1), and the answer key (arabic, continues).
Patch: section 1 footer -> ROMAN, all later section footers -> arabic.
Also removes empty <w:pgNumType/> elements.
"""
import re
import shutil
import sys
import zipfile

DOCX = sys.argv[1]
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

doc = files["word/document.xml"].decode("utf-8")
rels = files["word/_rels/document.xml.rels"].decode("utf-8")

rel_map = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="(footer\d+\.xml)"', rels))

sect_blocks = re.findall(r"<w:sectPr[ >].*?</w:sectPr>", doc, flags=re.S)
print("sections found:", len(sect_blocks))

section_footers = []
for blk in sect_blocks:
    m = re.search(r'<w:footerReference w:type="default" r:id="([^"]+)"', blk)
    section_footers.append(rel_map.get(m.group(1)) if m else None)
print("section footer files:", section_footers)

def patch_footer(fname, fmt):
    key = "word/" + fname
    xml = files[key].decode("utf-8")
    xml2, n = re.subn(
        r"(<w:instrText[^>]*>)\s*PAGE\s*(</w:instrText>)",
        r"\g<1> PAGE \\* " + fmt + r" \\* MERGEFORMAT \g<2>",
        xml,
    )
    files[key] = xml2.encode("utf-8")
    print(f"patched {fname} with {fmt}: {n} field(s)")

if len(section_footers) < 3:
    print("WARNING: expected at least 3 sections, got", len(section_footers))
    sys.exit(1)

if section_footers[1]:
    patch_footer(section_footers[1], "ROMAN")
for fname in section_footers[2:]:
    if fname:
        patch_footer(fname, "arabic")

doc2, removed = re.subn(r"<w:pgNumType/>", "", doc)
files["word/document.xml"] = doc2.encode("utf-8")
print("empty pgNumType removed:", removed)

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])
shutil.move(TMP, DOCX)
print("patched OK:", DOCX)
