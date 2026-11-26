"""Post-process the blueprint DOCX for WPS/Office page-number compatibility.

1. Map each section's footerReference to its footer part via document.xml.rels.
   - Section 2 (front matter) footer: PAGE -> PAGE \\* ROMAN \\* MERGEFORMAT
   - Section 3 (body) footer:         PAGE -> PAGE \\* arabic \\* MERGEFORMAT
2. Remove empty <w:pgNumType/> elements from document.xml.
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

doc = files["word/document.xml"].decode("utf-8")
rels = files["word/_rels/document.xml.rels"].decode("utf-8")

# rId -> footer file map
rel_map = dict(re.findall(r'<Relationship[^>]*Id="([^"]+)"[^>]*Target="(footer\d+\.xml)"', rels))
rel_map.update({rid: t for rid, t in re.findall(r'<Relationship[^>]*Target="(footer\d+\.xml)"[^>]*Id="([^"]+)"', rels) and []})

# sectPr blocks in document order
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

if len(section_footers) >= 3:
    if section_footers[1]:
        patch_footer(section_footers[1], "ROMAN")
    if section_footers[2]:
        patch_footer(section_footers[2], "arabic")
else:
    print("WARNING: expected 3 sections, got", len(section_footers))
    sys.exit(1)

# remove empty pgNumType (docx-js emits them in sections without pageNumbers)
doc2, removed = re.subn(r"<w:pgNumType/>", "", doc)
files["word/document.xml"] = doc2.encode("utf-8")
print("empty pgNumType removed:", removed)

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for n in names:
        z.writestr(n, files[n])
shutil.move(TMP, DOCX)
print("patched OK:", DOCX)
