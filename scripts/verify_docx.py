"""Reopen the generated blueprint and verify its structure and cleanliness."""
import re
import sys

from docx import Document

DOC = sys.argv[1] if len(sys.argv) > 1 else "/home/z/my-project/download/FDE_Academy_Master_Blueprint.docx"
doc = Document(DOC)

h1 = [p.text for p in doc.paragraphs if p.style.name == "Heading 1"]
h2 = [p.text for p in doc.paragraphs if p.style.name == "Heading 2"]
h3 = [p.text for p in doc.paragraphs if p.style.name == "Heading 3"]
print("H1 count:", len(h1))
for t in h1:
    print("  H1:", t)
print("H2 count:", len(h2), "| H3 count:", len(h3))
print("Tables:", len(doc.tables))
imgs = sum(1 for s in doc.element.body.iter() if s.tag.endswith("}blip"))
print("Inline images:", imgs)

# placeholder / artifact scan across paragraphs and table cells
bad = re.compile(r"(XXX|TODO|待补充|【|____|\*\*|\|---)", re.I)
bad_strict = re.compile(r"(undefined|NaN)")  # case-sensitive: avoid matching maintenance/tenancy
hits = []
for p in doc.paragraphs:
    if bad.search(p.text or "") or bad_strict.search(p.text or ""):
        hits.append(("para", p.text[:90]))
for t in doc.tables:
    for r in t.rows:
        for c in r.cells:
            if bad.search(c.text or "") or bad_strict.search(c.text or ""):
                hits.append(("cell", c.text[:90]))
print("Placeholder/artifact hits:", len(hits))
for kind, txt in hits[:12]:
    print("  ", kind, "->", txt)

# quick word count of body text
words = sum(len(p.text.split()) for p in doc.paragraphs)
tw = sum(len(c.text.split()) for t in doc.tables for r in t.rows for c in r.cells)
print("Word count (paragraphs + tables):", words + tw)
