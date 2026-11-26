"""Rebuild the TOC field's opening paragraph in valid, canonical shape.

Shape: pPr + begin fldChar run + instrText run + separate fldChar run
       + the first entry as plain runs (text + dot-leader tab + page number),
       exactly matching how the other injected entries are built.
"""
import re
import sys
import shutil
import zipfile

DOCX = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx"
ENTRY_TEXT = sys.argv[2] if len(sys.argv) > 2 else "1. Executive Summary"
ENTRY_PAGE = sys.argv[3] if len(sys.argv) > 3 else "1"
TMP = DOCX + ".tmp"

with zipfile.ZipFile(DOCX, "r") as z:
    names = z.namelist()
    files = {n: z.read(n) for n in names}

xml = files["word/document.xml"].decode("utf-8")

m = re.search(r"<w:instrText[^>]*>([^<]*TOC[^<]*)</w:instrText>", xml)
instr_inner = m.group(1)
p0_start = xml.rfind("<w:p ", 0, m.start())
if p0_start == -1:
    p0_start = xml.rfind("<w:p>", 0, m.start())
p0_end = xml.find("</w:p>", m.start()) + len("</w:p>")
para0 = xml[p0_start:p0_end]

ppr = re.search(r"<w:pPr>.*?</w:pPr>", para0, re.S).group(0)
begin_run = '<w:r><w:fldChar w:fldCharType="begin" w:dirty="true"/></w:r>'
instr_run = ('<w:r><w:instrText xml:space="preserve">'
             + instr_inner.replace("&", "&amp;") + "</w:instrText></w:r>")
sep_run = '<w:r><w:fldChar w:fldCharType="separate"/></w:r>'

entry_runs = ('<w:r><w:t>' + ENTRY_TEXT.replace("&", "&amp;") + '</w:t></w:r>'
              '<w:r><w:tab/></w:r>'
              '<w:r><w:t>' + ENTRY_PAGE + '</w:t></w:r>')

new_para0 = "<w:p>" + ppr + begin_run + instr_run + sep_run + entry_runs + "</w:p>"
xml = xml[:p0_start] + new_para0 + xml[p0_end:]
files["word/document.xml"] = xml.encode("utf-8")

with zipfile.ZipFile(TMP, "w", zipfile.ZIP_DEFLATED) as z:
    for name in names:
        z.writestr(name, files[name])
shutil.move(TMP, DOCX)
print("rebuilt TOC field paragraph:", DOCX)
