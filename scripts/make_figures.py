"""Generate the two diagrams embedded in the FDE Academy Master Project Blueprint.

Figure 1: the 18-stage roadmap across three phases.
Figure 2: the target architecture of the learning website.

English-only labels; DejaVu Sans is sufficient. Muted, low-saturation palette.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm

fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')

import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = "/home/z/my-project/scripts/assets"
import os
os.makedirs(OUT, exist_ok=True)

GRAPHITE = "#2C3440"
GREY = "#8A94A0"

# ---------------------------------------------------------------- Figure 1
stages = [
    "Mathematics\nfor FDEs", "Computer\nLiteracy", "Computational\nThinking",
    "Python\nProgramming", "Computer Science\nFoundations", "Developer\nTools",
    "Web\nDevelopment", "Backend\nEngineering", "Databases",
    "Software\nEngineering", "Networking", "Cloud\nComputing",
    "DevOps", "Data\nEngineering", "AI & Machine\nLearning",
    "Generative &\nProduction AI", "Customer-Facing\nEngineering",
    "Capstones &\nCareer Prep",
]
phaseA = ("PHASE A - FOUNDATIONS (Stages 1-6)", stages[0:6], "#46566B")
phaseB = ("PHASE B - BUILDING SOFTWARE (Stages 7-14)", stages[6:14], "#C27E4D")
phaseC = ("PHASE C - FDE SPECIALIZATION (Stages 15-18)", stages[14:18], "#6E8B74")

fig, ax = plt.subplots(figsize=(13.5, 7.6), constrained_layout=True)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis("off")

rows = [phaseA, phaseB, phaseC]
box_w, box_h = 14.2, 13.5
row_y = [72, 44, 16]

for ri, (label, items, color) in enumerate(rows):
    y = row_y[ri]
    ax.text(0.5, y + box_h + 5.2, label, fontsize=12.5, fontweight="bold",
            color=color, va="center")
    n = len(items)
    start = 0.5
    for i, name in enumerate(items):
        x = start + i * (box_w + 1.8)
        num = ri * [6, 8, 4][ri] if False else sum([6, 8, 4][:ri]) + i + 1
        box = FancyBboxPatch((x, y), box_w, box_h,
                             boxstyle="round,pad=0.35,rounding_size=1.6",
                             linewidth=1.4, edgecolor=color, facecolor=color,
                             alpha=0.92)
        ax.add_patch(box)
        ax.text(x + box_w / 2, y + box_h - 3.1, "STAGE %d" % num, fontsize=8.6,
                color="#F5E9DF", ha="center", va="center", fontweight="bold")
        ax.text(x + box_w / 2, y + box_h / 2 - 2.0, name, fontsize=9.6,
                color="white", ha="center", va="center", linespacing=1.25)
        if i < n - 1:
            ax.add_patch(FancyArrowPatch((x + box_w + 0.35, y + box_h / 2),
                                         (x + box_w + 1.45, y + box_h / 2),
                                         arrowstyle="-|>", mutation_scale=14,
                                         linewidth=1.6, color=GREY))
    # connector from end of this row down to start of next row
    if ri < 2:
        x_last_end = start + n * (box_w + 1.8) - 1.8 + box_w / 2
        next_y = row_y[ri + 1] + box_h
        ax.add_patch(FancyArrowPatch((x_last_end, y - 0.4),
                                     (start + box_w / 2, next_y + 0.4),
                                     connectionstyle="bar,fraction=0.18",
                                     arrowstyle="-|>", mutation_scale=15,
                                     linewidth=1.6, color=GREY,
                                     linestyle=(0, (4, 3))))

ax.text(0.5, 3.0, "Total: 18 stages, about 1,500 guided hours. "
        "Every stage ends with a project, an assessment, and book material.",
        fontsize=10.5, color=GRAPHITE, ha="left", va="center")

fig.savefig(OUT + "/fig1_roadmap.png", dpi=200)
plt.close(fig)

# ---------------------------------------------------------------- Figure 2
fig, ax = plt.subplots(figsize=(12.5, 8.6), constrained_layout=True)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis("off")


def block(x, y, w, h, text, face, fontsize=10.5, tcolor="white", dashed=False,
          bold=True, sub=None, subfs=8.6):
    box = FancyBboxPatch((x, y), w, h,
                         boxstyle="round,pad=0.35,rounding_size=1.4",
                         linewidth=1.5, edgecolor=face,
                         facecolor=face, alpha=0.94,
                         linestyle=(0, (5, 3)) if dashed else "solid")
    ax.add_patch(box)
    if sub:
        ax.text(x + w / 2, y + h * 0.64, text, fontsize=fontsize, color=tcolor,
                ha="center", va="center", fontweight="bold" if bold else "normal",
                linespacing=1.25)
        ax.text(x + w / 2, y + h * 0.27, sub, fontsize=subfs, color=tcolor,
                ha="center", va="center", alpha=0.92, linespacing=1.2)
    else:
        ax.text(x + w / 2, y + h / 2, text, fontsize=fontsize, color=tcolor,
                ha="center", va="center", fontweight="bold" if bold else "normal",
                linespacing=1.25)


def arrow(y_from, y_to, x=50):
    ax.add_patch(FancyArrowPatch((x, y_from), (x, y_to), arrowstyle="-|>",
                                 mutation_scale=16, linewidth=1.8, color=GREY))


# Layer 1: users
block(6, 88, 40, 9, "Learner - web browser", GRAPHITE)
block(54, 88, 40, 9, "Author / Admin - content pipeline", GRAPHITE)

# Layer 2: front end
block(6, 73, 88, 10.5, "Responsive front-end", "#46566B",
      sub="Lesson pages  |  quizzes  |  coding challenges  |  progress dashboard  |  book library")
arrow(88, 83.5)

# Layer 3: services
ax.text(2.5, 66.5, "Application services (Phase 2, server-based)", fontsize=9.5,
        color=GRAPHITE, fontweight="bold")
svc = [
    ("Progress\ntracking", 6), ("Assessment\nengine", 24.4), ("Code sandbox\n(runner)", 42.8),
    ("Book library\n+ downloads", 61.2), ("Search &\nglossary", 79.6),
]
for name, x in svc:
    block(x, 53.5, 14.4, 10.5, name, "#C27E4D", fontsize=9.8)
arrow(73, 64.5)

# sandbox annotation
block(42.8, 41.5, 14.4, 9, "Phase 1: Pyodide\nPython in browser", "white",
      tcolor=GRAPHITE, dashed=True, fontsize=8.8, bold=False)
ax.add_patch(FancyArrowPatch((50, 53.2), (50, 51), arrowstyle="-|>",
                             mutation_scale=12, linewidth=1.4, color=GREY))

# Layer 4: storage
ax.text(2.5, 36.0, "Storage", fontsize=9.5, color=GRAPHITE, fontweight="bold")
block(6, 24, 27.4, 10.5, "Content store", "#6E8B74",
      sub="Markdown + JSON files")
block(36.3, 24, 27.4, 10.5, "Learner records", "#6E8B74",
      sub="progress, attempts, mastery")
block(66.6, 24, 27.4, 10.5, "File storage", "#6E8B74",
      sub="books (DOCX/PDF), media")
arrow(53.5, 35.0, x=50)

ax.text(2.5, 13.5,
        "Phase 1 build: everything above runs as one self-contained site; progress is saved in the browser.\n"
        "Phase 2 build: services move to a server with accounts and sync; code runs in isolated containers.",
        fontsize=9.8, color=GRAPHITE, va="center", linespacing=1.45)

fig.savefig(OUT + "/fig2_architecture.png", dpi=200)
plt.close(fig)

# ---------------------------------------------------------- verification
from PIL import Image
for f in ("fig1_roadmap.png", "fig2_architecture.png"):
    p = OUT + "/" + f
    im = Image.open(p).convert("L")
    h = im.histogram()
    ratio = 1 - h[255] / sum(h)
    print(f, im.size, "non-white ratio %.3f" % ratio)
