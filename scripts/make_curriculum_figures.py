"""Figures for the FDE Academy Curriculum and Book Collection Blueprint.

Figure 1: dependency map - four tracks with prerequisite arrows.
Figure 2: study-sequence matrix - 31 books across 15 study periods.

English-only labels; muted palette consistent with the master blueprint.
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

MATH = "#46566B"
CORE = "#C27E4D"
AI = "#6E8B74"
CRAFT = "#7A6A8A"
GREY = "#8A94A0"
GRAPHITE = "#2C3440"


def box(ax, x, y, w, h, title, sub, color, dashed=False):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
                 boxstyle="round,pad=0.25,rounding_size=1.1",
                 linewidth=1.3, edgecolor=color, facecolor=color, alpha=0.94,
                 linestyle=(0, (4, 3)) if dashed else "solid"))
    ax.text(x + w / 2, y + h * 0.70, title, fontsize=8.0, color="white",
            ha="center", va="center", fontweight="bold")
    ax.text(x + w / 2, y + h * 0.32, sub, fontsize=6.6, color="#F2EAE2",
            ha="center", va="center", linespacing=1.15)


def arrow(ax, x1, y1, x2, y2, color=GREY, dashed=False, rad=0.0):
    ax.add_patch(FancyArrowPatch((x1, y1), (x2, y2),
                 arrowstyle="-|>", mutation_scale=11, linewidth=1.2,
                 color=color, linestyle=(0, (4, 3)) if dashed else "solid",
                 connectionstyle="arc3,rad=%s" % rad))


# ---------------------------------------------------------------- Figure 1
fig, ax = plt.subplots(figsize=(14.2, 9.2), constrained_layout=True)
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis("off")

BW, BH = 13.4, 10.5

def lane(label, y, color):
    ax.text(0.6, y + BH + 4.6, label, fontsize=11, fontweight="bold", color=color)
    return y

def row(items, y, color, start=2.2, dashed_idx=None):
    for i, (t, s) in enumerate(items):
        x = start + i * (BW + 1.55)
        box(ax, x, y, BW, BH, t, s, color, dashed=(dashed_idx is not None and i in dashed_idx))
        if i < len(items) - 1:
            arrow(ax, x + BW + 0.2, y + BH / 2, x + BW + 1.35, y + BH / 2)
    return start

y = lane("MATHEMATICS TRACK", 87, MATH)
math_items = [("MA-1", "Everyday\nMathematics"), ("MA-2", "Algebra, Logic,\nGraphs"), ("MA-3", "Probability, Stats,\nLinear Algebra"), ("MA-X", "Calculus Extension\n(optional)")]
row(math_items, 87, MATH, dashed_idx={3})

y = lane("CORE COMPUTING TRACK - FOUNDATIONS", 71, CORE)
core1 = [("1", "Computer Basics"), ("2", "Computational\nThinking"), ("3", "Programming\nFundamentals"), ("4", "Python Through\nExamples"), ("5", "Data Structures\nand Algorithms"), ("6", "Git, GitHub,\nLinux, CLI")]
row(core1, 71, CORE)

y = lane("CORE COMPUTING TRACK - BUILDING SOFTWARE", 55, CORE)
core2 = [("7", "HTML, CSS,\nJavaScript"), ("8", "TypeScript and\nModern Frontend"), ("9", "Backend and\nREST APIs"), ("10", "Databases and\nPostgreSQL"), ("11", "Software Eng.\nand Testing"), ("12", "Networks and\nOperating Systems"), ("13", "Cloud\nComputing"), ("14", "Docker, DevOps,\nDeployment"), ("15", "Data Engineering")]
row(core2, 55, CORE)

y = lane("DATA AND AI TRACK", 39, AI)
ai_items = [("16", "AI Fundamentals"), ("17", "Machine Learning\nfrom Zero"), ("18", "Deep Learning\nFundamentals"), ("19", "Generative AI\nand LLMs"), ("20", "Embeddings,\nVectors, RAG"), ("21", "AI Agents and\nTool Integration"), ("22", "Production\nAI Systems"), ("23", "Security, Privacy,\nResponsible AI")]
row(ai_items, 39, AI)

y = lane("FDE CRAFT TRACK", 23, CRAFT)
craft = [("24", "Business Problem\nSolving"), ("25", "Customer\nCommunication"), ("26", "FDE System\nDesign"), ("27", "Real-World\nProjects"), ("28", "Interview and\nCareer Prep")]
row(craft, 23, CRAFT)

# cross-track gates (dashed)
def cx(id_, side="right"):
    lanes = {"MA-1": (2.2, 87), "MA-2": (2.2 + 1 * 14.95, 87), "MA-3": (2.2 + 2 * 14.95, 87), "MA-X": (2.2 + 3 * 14.95, 87),
             "1": (2.2, 71), "2": (2.2 + 14.95, 71), "3": (2.2 + 2 * 14.95, 71), "4": (2.2 + 3 * 14.95, 71), "5": (2.2 + 4 * 14.95, 71), "6": (2.2 + 5 * 14.95, 71),
             "7": (2.2, 55), "8": (2.2 + 14.95, 55), "9": (2.2 + 2 * 14.95, 55), "10": (2.2 + 3 * 14.95, 55), "11": (2.2 + 4 * 14.95, 55), "12": (2.2 + 5 * 14.95, 55), "13": (2.2 + 6 * 14.95, 55), "14": (2.2 + 7 * 14.95, 55), "15": (2.2 + 8 * 14.95, 55),
             "16": (2.2, 39), "17": (2.2 + 14.95, 39), "18": (2.2 + 2 * 14.95, 39), "19": (2.2 + 3 * 14.95, 39), "20": (2.2 + 4 * 14.95, 39), "21": (2.2 + 5 * 14.95, 39), "22": (2.2 + 6 * 14.95, 39), "23": (2.2 + 7 * 14.95, 39),
             "24": (2.2, 23), "25": (2.2 + 14.95, 23), "26": (2.2 + 2 * 14.95, 23), "27": (2.2 + 3 * 14.95, 23), "28": (2.2 + 4 * 14.95, 23)}
    x, yy = lanes[id_]
    return x + BW / 2, yy + BH / 2

gates = [("MA-3", "16", "stats gate"), ("10", "20", "vectors"), ("14", "22", "pipeline"), ("19", "20", "LLMs"), ("22", "27", "capstone"), ("26", "27", "design")]
for a, b, label in gates:
    x1, y1 = cx(a)
    x2, y2 = cx(b)
    arrow(ax, x1, y1 - BH / 2, x2, y2 + BH / 2, dashed=True, rad=-0.12)
    ax.text((x1 + x2) / 2 + 1.5, (y1 + y2) / 2, label, fontsize=6.4, color=GRAPHITE,
            rotation=0, ha="left", va="center", style="italic")

ax.text(0.6, 12.0, "Solid arrows: order inside a track.  Dashed arrows: gates across tracks.\n"
        "The gate into the AI track is MA-3 (statistics and linear algebra); programming needs only MA-1 essentials.",
        fontsize=8.8, color=GRAPHITE, va="center", linespacing=1.4)

fig.savefig(OUT + "/cur_fig1_dependencies.png", dpi=200)
plt.close(fig)

# ---------------------------------------------------------------- Figure 2
periods = 15
seq = [
    ("MA-1", 1, 1, MATH, 45, False), ("MA-2", 2, 2, MATH, 50, False), ("MA-3", 6, 6, MATH, 55, False), ("MA-X", 10, 10, MATH, 30, True),
    ("B1", 1, 1, CORE, 40, False), ("B2", 1, 1, CORE, 40, False), ("B3", 2, 2, CORE, 70, False), ("B4", 3, 3, CORE, 60, False),
    ("B5", 3, 3, CORE, 60, False), ("B6", 4, 4, CORE, 55, False), ("B7", 4, 4, CORE, 70, False), ("B8", 5, 5, CORE, 60, False),
    ("B9", 5, 5, CORE, 75, False), ("B10", 6, 6, CORE, 65, False), ("B11", 7, 7, CORE, 65, False), ("B12", 7, 7, CORE, 60, False),
    ("B13", 8, 8, CORE, 60, False), ("B14", 8, 8, CORE, 65, False), ("B15", 9, 9, CORE, 60, False),
    ("B16", 9, 9, AI, 55, False), ("B17", 10, 10, AI, 65, False), ("B18", 10, 10, AI, 65, False), ("B19", 11, 11, AI, 60, False),
    ("B20", 11, 11, AI, 55, False), ("B21", 12, 12, AI, 55, False), ("B22", 13, 13, AI, 60, False), ("B23", 12, 12, AI, 50, False),
    ("B24", 13, 13, CRAFT, 50, False), ("B25", 14, 14, CRAFT, 50, False), ("B26", 14, 14, CRAFT, 55, False),
    ("B27", 15, 15, CRAFT, 70, False), ("B28", 15, 15, CRAFT, 45, False),
]
full = {"MA-1": "MA-1", "MA-2": "MA-2", "MA-3": "MA-3", "MA-X": "MA-X (opt.)", "B1": "1 Computer Basics", "B2": "2 Computational Thinking", "B3": "3 Programming Fundamentals", "B4": "4 Python Through Examples", "B5": "5 Data Structures and Algorithms", "B6": "6 Git, GitHub, Linux, CLI", "B7": "7 HTML, CSS, JavaScript", "B8": "8 TypeScript Frontend", "B9": "9 Backend and REST APIs", "B10": "10 Databases and PostgreSQL", "B11": "11 Software Eng. and Testing", "B12": "12 Networks and OS", "B13": "13 Cloud Computing", "B14": "14 Docker, DevOps, Deployment", "B15": "15 Data Engineering", "B16": "16 AI Fundamentals", "B17": "17 Machine Learning from Zero", "B18": "18 Deep Learning Fundamentals", "B19": "19 Generative AI and LLMs", "B20": "20 Embeddings, Vectors, RAG", "B21": "21 AI Agents and Tools", "B22": "22 Production AI Systems", "B23": "23 Security and Responsible AI", "B24": "24 Business Problem Solving", "B25": "25 Customer Communication", "B26": "26 FDE System Design", "B27": "27 Real-World Projects", "B28": "28 Interview and Career Prep"}

fig, ax = plt.subplots(figsize=(13.5, 11.5), constrained_layout=True)
n = len(seq)
ax.set_xlim(0.5, periods + 0.5)
ax.set_ylim(-0.8, n)
ax.set_xticks(range(1, periods + 1))
ax.set_yticks(range(n))
ax.set_yticklabels([full[r[0]] for r in seq], fontsize=8.6)
ax.set_xticklabels(["P%d" % i for i in range(1, periods + 1)], fontsize=8.6)
ax.grid(axis="x", color="#D8DCE0", linewidth=0.7)
ax.set_axisbelow(True)
for spine in ("top", "right"):
    ax.spines[spine].set_visible(False)

for i, (bid, s, e, color, hours, opt) in enumerate(seq):
    yv = n - 1 - i
    ax.barh(yv, e - s + 0.62, left=s - 0.31, height=0.72, color=color,
            alpha=0.55 if opt else 0.92, hatch="///" if opt else "", edgecolor=color, linewidth=0.8)
    ax.text(s + (e - s) / 2 + 0.34, yv, str(hours), fontsize=7.4, color="white" if not opt else GRAPHITE,
            ha="center", va="center", fontweight="bold")

for yb, lab in [(n - 0.5 - 3.5, "Mathematics"), (n - 0.5 - 16.5, "Core computing"), (n - 0.5 - 24.0, "Data and AI"), (n - 0.5 - 28.5, "FDE craft")]:
    ax.text(0.15, yb, lab, fontsize=8.6, color=GRAPHITE, fontweight="bold", rotation=90, ha="center", va="center")

ax.text(0.5, -0.55, "Each cell shows the book's guided hours. One period is about 120-135 hours of study: "
        "roughly four weeks full time or eight weeks at half pace. MA-X is optional.",
        fontsize=9, color=GRAPHITE, va="center")

fig.savefig(OUT + "/cur_fig2_sequence.png", dpi=200)
plt.close(fig)

from PIL import Image
for f in ("cur_fig1_dependencies.png", "cur_fig2_sequence.png"):
    p = OUT + "/" + f
    im = Image.open(p).convert("L")
    h = im.histogram()
    print(f, im.size, "non-white ratio %.3f" % (1 - h[255] / sum(h)))
