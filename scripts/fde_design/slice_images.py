"""Prepare design images for DOCX embedding.

Computes embed dimensions preserving aspect ratio, slices very tall images
into page-height pieces, writes a JSON manifest for the JS generator.
"""
import json
import os
from PIL import Image

BASE = "/home/z/my-project/download/fde_design"
OUT = "/home/z/my-project/download/fde_design/embed"
os.makedirs(OUT, exist_ok=True)

CONTENT_W = 586   # px at 96 dpi: usable width of the A4 content area
MAX_H = 880       # px: keep each embedded image within one page height

# name -> (path, class)  class: desktop wireframe | mobile wireframe | diagram
ITEMS = {
    "sitemap": (BASE + "/diagrams/sitemap.png", "diagram"),
    "roadmap_18_stages": (BASE + "/diagrams/roadmap_18_stages.png", "diagram"),
    "journey_beginner": (BASE + "/diagrams/journey_beginner.png", "diagram"),
    "journey_daily": (BASE + "/diagrams/journey_daily.png", "diagram"),
    "journey_book": (BASE + "/diagrams/journey_book.png", "diagram"),
    "journey_project": (BASE + "/diagrams/journey_project.png", "diagram"),
    "journey_admin": (BASE + "/diagrams/journey_admin.png", "diagram"),
    "architecture": (BASE + "/diagrams/architecture.png", "diagram"),
    "erd": (BASE + "/diagrams/erd.png", "diagram"),
    "wf_home": (BASE + "/wireframes/wf_home.png", "desktop"),
    "wf_roadmap": (BASE + "/wireframes/wf_roadmap.png", "desktop"),
    "wf_courses": (BASE + "/wireframes/wf_courses.png", "desktop"),
    "wf_course_detail": (BASE + "/wireframes/wf_course_detail.png", "desktop"),
    "wf_books": (BASE + "/wireframes/wf_books.png", "desktop"),
    "wf_book_detail": (BASE + "/wireframes/wf_book_detail.png", "desktop"),
    "wf_lab": (BASE + "/wireframes/wf_lab.png", "desktop"),
    "wf_project": (BASE + "/wireframes/wf_project.png", "desktop"),
    "wf_assessment": (BASE + "/wireframes/wf_assessment.png", "desktop"),
    "wf_glossary": (BASE + "/wireframes/wf_glossary.png", "desktop"),
    "wf_dashboard": (BASE + "/wireframes/wf_dashboard.png", "desktop"),
    "wf_career": (BASE + "/wireframes/wf_career.png", "desktop"),
    "wf_admin": (BASE + "/wireframes/wf_admin.png", "desktop"),
    "wf_mobile_home": (BASE + "/wireframes/wf_mobile_home.png", "mobile"),
    "wf_mobile_dashboard": (BASE + "/wireframes/wf_mobile_dashboard.png", "mobile"),
}

manifest = {}
for name, (path, kind) in ITEMS.items():
    im = Image.open(path)
    w, h = im.size
    if kind == "mobile":
        # mobile: fit height, keep centered at its natural aspect
        scale = min(MAX_H / h, 1.0)
        embed_w, embed_h = int(w * scale), int(h * scale)
        slices = [(path, embed_w, embed_h)]
    else:
        scale = CONTENT_W / w
        embed_w, embed_h = CONTENT_W, int(h * scale)
        if embed_h <= MAX_H:
            slices = [(path, embed_w, embed_h)]
        else:
            # slice into page-height pieces at source resolution
            n = -(-embed_h // MAX_H)
            slice_src_h = -(-h // n)
            slices = []
            for i in range(n):
                top = i * slice_src_h
                bottom = min(h, (i + 1) * slice_src_h)
                piece = im.crop((0, top, w, bottom))
                out_path = f"{OUT}/{name}_p{i + 1}.png"
                piece.save(out_path)
                ph = bottom - top
                slices.append((out_path, CONTENT_W, int(ph * scale)))
    manifest[name] = {"kind": kind, "orig": [w, h],
                      "slices": [{"path": p, "w": ww, "h": hh} for p, ww, hh in slices]}
    print(f"{name}: {w}x{h} -> {len(slices)} embed piece(s)")

with open(OUT + "/manifest.json", "w") as f:
    json.dump(manifest, f, indent=1)
print("manifest:", OUT + "/manifest.json")
