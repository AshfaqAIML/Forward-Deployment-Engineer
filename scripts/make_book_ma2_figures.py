"""Figures for Book MA-2: Algebra, Logic, Graphs, and Problem Solving.

Fifteen new illustrations, all distinct from Book MA-1. English labels, muted
GO-1 palette, constrained_layout (no tight_layout), Agg backend.
"""
import matplotlib
matplotlib.use("Agg")
import matplotlib.font_manager as fm

fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch, Rectangle, FancyBboxPatch, Circle, Polygon

plt.rcParams['font.sans-serif'] = ['DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

OUT = "/home/z/my-project/scripts/assets"

INK = "#2C3440"
ACCENT = "#C27E4D"
MUTED = "#8A94A0"
MATH = "#46566B"
SURFACE = "#F8F0EB"

def save(fig, name):
    fig.savefig(OUT + "/" + name, dpi=200)
    plt.close(fig)

def rbox(ax, x, y, w, h, text, fc=SURFACE, ec=MATH, fs=11, tc=INK, lw=1.6):
    ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.06,rounding_size=0.12",
                 fc=fc, ec=ec, lw=lw))
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center", fontsize=fs, color=tc)

# ------------------------------------------------ 1. ch1: mystery box
fig, ax = plt.subplots(figsize=(9.5, 2.8), constrained_layout=True)
ax.set_xlim(0, 12); ax.set_ylim(0, 3); ax.axis("off")
rbox(ax, 0.6, 0.9, 2.0, 1.2, "?", fc=SURFACE, ec=ACCENT, fs=26, tc=ACCENT, lw=2.4)
ax.text(3.0, 1.5, "+", ha="center", fontsize=22, color=INK)
rbox(ax, 3.6, 0.9, 2.0, 1.2, "3", fc="#FFFFFF", ec=MATH, fs=20, tc=INK, lw=1.8)
ax.text(6.0, 1.5, "=", ha="center", fontsize=22, color=INK)
rbox(ax, 6.6, 0.9, 2.0, 1.2, "11", fc="#FFFFFF", ec=MATH, fs=20, tc=INK, lw=1.8)
ax.annotate("", xy=(2.3, 2.45), xytext=(2.3, 2.45),
            arrowprops=dict(arrowstyle="-", color=ACCENT, lw=0))
ax.text(1.6, 0.45, "same number hidden here", ha="center", fontsize=10, color=ACCENT)
ax.text(9.6, 1.5, "The box hides one number.\nAlgebra finds it.", ha="left",
        va="center", fontsize=11, color=MUTED)
save(fig, "fig_ma2_01_mysterybox.png")

# ------------------------------------------------ 2. ch2: expression machine
fig, ax = plt.subplots(figsize=(10, 2.9), constrained_layout=True)
ax.set_xlim(0, 14); ax.set_ylim(0, 3); ax.axis("off")
rbox(ax, 0.4, 1.0, 2.2, 1.1, "choose n", fc="#FFFFFF", ec=MATH, fs=13)
rbox(ax, 4.0, 0.55, 5.2, 2.0, "the rule\nmultiply by 2, then add 3\nwritten: 2n + 3",
     fc=SURFACE, ec=ACCENT, fs=12, tc=INK)
ax.annotate("", xy=(3.9, 1.55), xytext=(2.75, 1.55),
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2))
ax.annotate("", xy=(10.4, 1.55), xytext=(9.35, 1.55),
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2))
rbox(ax, 10.5, 1.0, 2.6, 1.1, "2n + 3", fc="#FFFFFF", ec=MATH, fs=13)
ax.text(7.0, 0.12, "n = 4 gives 2 \u00d7 4 + 3 = 11      n = 10 gives 2 \u00d7 10 + 3 = 23",
        ha="center", fontsize=11, color=MATH)
save(fig, "fig_ma2_02_expression_machine.png")

# ------------------------------------------------ 3. ch3: balance scale
fig, ax = plt.subplots(figsize=(9.5, 3.6), constrained_layout=True)
ax.set_xlim(0, 12); ax.set_ylim(0, 4); ax.axis("off")
ax.plot([2.0, 10.0], [3.0, 3.0], color=INK, lw=3)
ax.plot([6.0, 6.0], [3.0, 1.2], color=INK, lw=3)
ax.add_patch(Polygon([[5.0, 1.2], [7.0, 1.2], [6.6, 0.7], [5.4, 0.7]], fc=INK, ec=INK))
rbox(ax, 1.2, 3.15, 1.3, 0.75, "x", fc=SURFACE, ec=ACCENT, fs=16, tc=ACCENT, lw=2.2)
rbox(ax, 2.7, 3.15, 1.3, 0.75, "4", fc="#FFFFFF", ec=MATH, fs=14)
rbox(ax, 7.6, 3.15, 1.3, 0.75, "9", fc="#FFFFFF", ec=MATH, fs=14)
ax.text(3.35, 4.0 - 0.25, "x + 4", ha="center", fontsize=13, color=INK)
ax.text(8.25, 3.75, "= 9", ha="center", fontsize=13, color=INK)
ax.text(6.0, 0.15, "The scale stays level only when both sides hold the same amount.",
        ha="center", fontsize=11, color=MUTED)
save(fig, "fig_ma2_03_balance.png")

# ------------------------------------------------ 4. ch4: real-world flow (taxi)
fig, ax = plt.subplots(figsize=(11, 2.6), constrained_layout=True)
ax.set_xlim(0, 16); ax.set_ylim(0, 3); ax.axis("off")
rbox(ax, 0.3, 0.9, 3.3, 1.3, "Situation\ntaxi: 2.50 to start,\n1.20 per kilometer", fs=11)
rbox(ax, 4.3, 0.9, 3.4, 1.3, "Equation\n2.50 + 1.20k = 9.70", fs=11, fc=SURFACE, ec=ACCENT)
rbox(ax, 8.4, 0.9, 3.3, 1.3, "Solve\n1.20k = 7.20, k = 6", fs=11)
rbox(ax, 12.4, 0.9, 3.3, 1.3, "Check\n2.50 + 1.20 \u00d7 6 = 9.70", fs=11, fc=SURFACE, ec=ACCENT)
for x0 in (3.75, 7.85, 11.85):
    ax.annotate("", xy=(x0 + 0.5, 1.55), xytext=(x0, 1.55),
                arrowprops=dict(arrowstyle="-|>", color=MATH, lw=2))
save(fig, "fig_ma2_04_realworld_flow.png")

# ------------------------------------------------ 5. ch5: inequality number lines
fig, axes = plt.subplots(2, 1, figsize=(10, 3.4), constrained_layout=True)
for ax, (dot_style, label, sub) in zip(axes, [
        ("closed", "x \u2265 3", "3 is included: filled dot"),
        ("open", "x > 3", "3 is excluded: hollow dot")]):
    ax.set_xlim(-1.2, 9.2); ax.set_ylim(-1.0, 1.3); ax.axis("off")
    ax.plot([-1.0, 9.0], [0, 0], color=INK, lw=1.6)
    for x in range(-1, 9):
        ax.plot([x, x], [-0.12, 0.12], color=INK, lw=1.4)
        ax.text(x, -0.42, str(x), ha="center", fontsize=10, color=INK)
    y = 0
    if dot_style == "closed":
        ax.plot(3, y, "o", ms=11, color=ACCENT)
    else:
        ax.plot(3, y, "o", ms=11, mfc="white", mec=ACCENT, mew=2.4)
    ax.annotate("", xy=(8.8, y), xytext=(3, y),
                arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2.6, linestyle=(0, (5, 3))))
    ax.text(6.4, 0.55, label, fontsize=15, color=ACCENT, ha="center", fontweight="bold")
    ax.text(0.4, 0.95, sub, fontsize=10, color=MUTED)
save(fig, "fig_ma2_05_inequality_line.png")

# ------------------------------------------------ 6. ch6: growing dot pattern
fig, ax = plt.subplots(figsize=(10, 3.2), constrained_layout=True)
ax.set_xlim(0, 13); ax.set_ylim(0, 3.4); ax.axis("off")
stages = [1, 2, 3]
counts = [3, 6, 9]
for i, (n, c) in enumerate(zip(stages, counts)):
    x0 = 0.8 + i * 3.9
    for j in range(c):
        ax.add_patch(Circle((x0 + (j % 3) * 0.55, 1.7 + (j // 3) * 0.55), 0.17,
                     fc=ACCENT, ec="none"))
    ax.text(x0 + 0.9, 0.9, f"stage {n}: {c} dots", ha="center", fontsize=11, color=INK)
ax.annotate("", xy=(12.0, 2.6), xytext=(11.3, 2.6),
            arrowprops=dict(arrowstyle="-|>", color=MATH, lw=2))
ax.text(9.2, 3.05, "each stage adds one row of 3", fontsize=10, color=MUTED)
rbox(ax, 10.4, 0.75, 2.2, 1.1, "rule\n3 \u00d7 n", fc=SURFACE, ec=ACCENT, fs=12)
save(fig, "fig_ma2_06_pattern_growth.png")

# ------------------------------------------------ 7. ch7: coordinate plane with points
fig, ax = plt.subplots(figsize=(6.4, 5.6), constrained_layout=True)
ax.set_xlim(-0.8, 6.8); ax.set_ylim(-0.8, 6.8)
for g in range(0, 7):
    ax.plot([-0.6, 6.6], [g, g], color="#E3D9D2", lw=0.9, zorder=0)
    ax.plot([g, g], [-0.6, 6.6], color="#E3D9D2", lw=0.9, zorder=0)
ax.annotate("", xy=(6.6, 0), xytext=(-0.6, 0), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.8))
ax.annotate("", xy=(0, 6.6), xytext=(0, -0.6), arrowprops=dict(arrowstyle="-|>", color=INK, lw=1.8))
ax.text(6.55, -0.5, "x", fontsize=14, color=INK)
ax.text(-0.5, 6.45, "y", fontsize=14, color=INK)
ax.text(-0.45, -0.5, "0", fontsize=11, color=MUTED)
pts = [("A(2, 3)", 2, 3), ("B(5, 1)", 5, 1), ("C(1, 5)", 1, 5), ("D(4, 4)", 4, 4)]
for lab, px, py in pts:
    ax.plot(px, py, "o", ms=11, color=ACCENT, zorder=3)
    ax.text(px + 0.15, py + 0.22, lab, fontsize=12, color=MATH, fontweight="bold")
for v in range(1, 6):
    ax.text(v, -0.34, str(v), ha="center", fontsize=9, color=MUTED)
    ax.text(-0.3, v - 0.06, str(v), va="center", ha="right", fontsize=9, color=MUTED)
ax.text(3.4, 6.15, "first number: walk right\nsecond number: walk up",
        fontsize=10, color=MUTED, ha="center")
ax.axis("off")
save(fig, "fig_ma2_07_coordinate_plane.png")

# ------------------------------------------------ 8. ch8: straight line with slope triangle
fig, ax = plt.subplots(figsize=(6.8, 5.4), constrained_layout=True)
xs = np.array([0, 3]); ys = 2 * xs + 1
ax.set_xlim(-0.8, 4.8); ax.set_ylim(-0.8, 8.2)
for g in range(0, 9):
    ax.plot([-0.6, 4.6], [g, g], color="#E3D9D2", lw=0.9, zorder=0)
for g in range(0, 5):
    ax.plot([g, g], [-0.6, 8.0], color="#E3D9D2", lw=0.9, zorder=0)
ax.plot([-0.6, 4.6], [0, 0], color=INK, lw=1.5, zorder=1)
ax.plot([0, 0], [-0.6, 8.0], color=INK, lw=1.5, zorder=1)
xl = np.linspace(-0.2, 3.5, 40)
ax.plot(xl, 2 * xl + 1, color=ACCENT, lw=2.8, zorder=2)
ax.plot([1, 2], [3, 5], "o", ms=9, color=MATH, zorder=3)
ax.plot([1, 2], [3, 3], color=MATH, lw=1.8, ls=(0, (4, 3)), zorder=2)
ax.plot([2, 2], [3, 5], color=MATH, lw=1.8, ls=(0, (4, 3)), zorder=2)
ax.text(1.45, 2.62, "run 1", fontsize=10, color=MATH, ha="center")
ax.text(2.22, 4.0, "rise 2", fontsize=10, color=MATH)
ax.text(0.12, 1.0, "starts at 1", fontsize=10, color=ACCENT)
ax.text(0.0, 8.35, "y = 2x + 1: every step right climbs 2", fontsize=12, color=INK)
ax.text(3.62, 2 * 3.5 + 0.55, "y = 2x + 1", fontsize=12, color=ACCENT, fontweight="bold")
ax.axis("off")
save(fig, "fig_ma2_08_line_slope.png")

# ------------------------------------------------ 9. ch9: parabola y = x^2
fig, ax = plt.subplots(figsize=(6.8, 5.2), constrained_layout=True)
xl = np.linspace(0, 3.2, 100)
ax.plot(xl, xl ** 2, color=ACCENT, lw=2.8)
for px in (1, 2, 3):
    ax.plot(px, px ** 2, "o", ms=9, color=MATH, zorder=3)
    ax.text(px + 0.12, px ** 2 + 0.16, f"({px}, {px ** 2})", fontsize=11, color=MATH)
ax.plot([0, 3.4], [0, 0], color=INK, lw=1.5)
ax.plot([0, 0], [0, 10.4], color=INK, lw=1.5)
ax.text(3.5, -0.35, "side s", fontsize=12, color=INK)
ax.text(0.12, 10.3, "area", fontsize=12, color=INK)
ax.text(1.7, 8.6, "y = s^{2} doubles nothing,\nit jumps: 1, 4, 9, 16",
        fontsize=11, color=MUTED, ha="center")
ax.set_xlim(-0.5, 4.0); ax.set_ylim(-0.8, 10.8)
ax.set_xticks([1, 2, 3]); ax.set_yticks([0, 4, 8])
ax.tick_params(colors=MUTED, labelsize=10)
for s in ("top", "right"):
    ax.spines[s].set_visible(False)
for s in ("bottom", "left"):
    ax.spines[s].set_color(INK)
save(fig, "fig_ma2_09_parabola.png")

# ------------------------------------------------ 10. ch10: function machine
fig, ax = plt.subplots(figsize=(10, 3.0), constrained_layout=True)
ax.set_xlim(0, 14); ax.set_ylim(0, 3); ax.axis("off")
rbox(ax, 0.4, 1.0, 2.0, 1.1, "input\nx = 4", fc="#FFFFFF", ec=MATH, fs=12)
rbox(ax, 4.0, 0.55, 5.4, 2.0, "the function f\nrule: multiply by 2, add 3\nf(x) = 2x + 3",
     fc=SURFACE, ec=ACCENT, fs=12)
ax.annotate("", xy=(3.9, 1.55), xytext=(2.55, 1.55),
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2))
ax.annotate("", xy=(10.6, 1.55), xytext=(9.55, 1.55),
            arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2))
rbox(ax, 10.7, 1.0, 2.6, 1.1, "one output\nf(4) = 11", fc="#FFFFFF", ec=MATH, fs=12)
ax.text(7.0, 0.15, "every input gets exactly one output: f(1) = 5,  f(2) = 7,  f(10) = 23",
        ha="center", fontsize=11, color=MATH)
save(fig, "fig_ma2_10_function_machine.png")

# ------------------------------------------------ 11. ch11: AND and OR gates
fig, ax = plt.subplots(figsize=(11, 3.0), constrained_layout=True)
ax.set_xlim(0, 16); ax.set_ylim(0, 3); ax.axis("off")
# AND gate
ax.add_patch(FancyBboxPatch((3.4, 0.9), 2.6, 1.4, boxstyle="round,pad=0.06,rounding_size=0.5",
             fc=SURFACE, ec=MATH, lw=1.8))
ax.text(4.7, 1.6, "AND", ha="center", fontsize=13, color=INK, fontweight="bold")
ax.text(1.6, 2.0, "1", ha="center", fontsize=13, color=ACCENT, fontweight="bold")
ax.text(1.6, 1.1, "1", ha="center", fontsize=13, color=ACCENT, fontweight="bold")
ax.annotate("", xy=(3.3, 2.0), xytext=(1.9, 2.0), arrowprops=dict(arrowstyle="-|>", color=MATH, lw=1.8))
ax.annotate("", xy=(3.3, 1.1), xytext=(1.9, 1.1), arrowprops=dict(arrowstyle="-|>", color=MATH, lw=1.8))
ax.annotate("", xy=(7.6, 1.55), xytext=(6.15, 1.55), arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2.2))
ax.text(8.0, 1.45, "1  (both needed)", fontsize=12, color=ACCENT, va="center")
# OR gate
ax.add_patch(FancyBboxPatch((10.6, 0.9), 2.6, 1.4, boxstyle="round,pad=0.06,rounding_size=0.5",
             fc=SURFACE, ec=MATH, lw=1.8))
ax.text(11.9, 1.6, "OR", ha="center", fontsize=13, color=INK, fontweight="bold")
ax.text(8.9, 2.0, "1", ha="center", fontsize=13, color=ACCENT, fontweight="bold")
ax.text(8.9, 1.1, "0", ha="center", fontsize=13, color=ACCENT, fontweight="bold")
ax.annotate("", xy=(10.5, 2.0), xytext=(9.2, 2.0), arrowprops=dict(arrowstyle="-|>", color=MATH, lw=1.8))
ax.annotate("", xy=(10.5, 1.1), xytext=(9.2, 1.1), arrowprops=dict(arrowstyle="-|>", color=MATH, lw=1.8))
ax.annotate("", xy=(14.8, 1.55), xytext=(13.35, 1.55), arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=2.2))
ax.text(15.0, 1.45, "1  (either is enough)", fontsize=12, color=ACCENT, va="center")
ax.text(8.0, 0.2, "Computers build every decision from these two small rules.",
        ha="center", fontsize=10, color=MUTED)
save(fig, "fig_ma2_11_logic_gates.png")

# ------------------------------------------------ 12. ch12: Venn diagram
fig, ax = plt.subplots(figsize=(7.6, 4.6), constrained_layout=True)
ax.set_xlim(0, 12); ax.set_ylim(0, 6); ax.axis("off")
c1 = Circle((4.4, 3.0), 2.4, fc="#DDE6EE", ec=MATH, lw=2.0, alpha=0.9)
c2 = Circle((7.6, 3.0), 2.4, fc="#F5E3D3", ec=ACCENT, lw=2.0, alpha=0.85)
ax.add_patch(c1); ax.add_patch(c2)
ax.text(3.0, 4.6, "Soccer\n12", ha="center", fontsize=13, color=MATH, fontweight="bold")
ax.text(9.0, 4.6, "Chess\n8", ha="center", fontsize=13, color=ACCENT, fontweight="bold")
ax.text(6.0, 3.35, "both\n5", ha="center", fontsize=12, color=INK, fontweight="bold")
ax.text(3.0, 1.4, "soccer only\n12 \u2212 5 = 7", ha="center", fontsize=10, color=MATH)
ax.text(9.0, 1.4, "chess only\n8 \u2212 5 = 3", ha="center", fontsize=10, color=ACCENT)
ax.text(6.0, 5.7, "class total = 7 + 5 + 3 = 15", ha="center", fontsize=12, color=INK)
save(fig, "fig_ma2_12_venn.png")

# ------------------------------------------------ 13. ch13: counting tree
fig, ax = plt.subplots(figsize=(10.5, 4.4), constrained_layout=True)
ax.set_xlim(0, 14); ax.set_ylim(0, 5); ax.axis("off")
rbox(ax, 0.3, 2.2, 2.2, 1.0, "start", fc="#FFFFFF", ec=MATH, fs=12)
shirts = [("white", 4.0), ("blue", 2.6)]
tr = ["jeans", "skirt", "shorts"]
ys = [4.3, 3.6, 2.9, 2.2, 1.5, 0.8]
# shirts level
for lab, y in shirts:
    rbox(ax, 3.6, y, 2.2, 0.9, lab, fc=SURFACE, ec=ACCENT, fs=11)
    ax.annotate("", xy=(3.5, y + 0.45), xytext=(2.6, 2.7),
                arrowprops=dict(arrowstyle="-|>", color=MATH, lw=1.6))
# trousers level
k = 0
for lab, y in shirts:
    for t in tr:
        yy = ys[k] + 0.15
        rbox(ax, 8.0, yy, 2.6, 0.72, lab.split()[0] + " + " + t, fc="#FFFFFF", ec=MATH, fs=10)
        ax.annotate("", xy=(7.9, yy + 0.36), xytext=(5.9, y + 0.45),
                    arrowprops=dict(arrowstyle="-|>", color=ACCENT, lw=1.4,
                                    connectionstyle="arc3,rad=0.08"))
        k += 1
ax.text(6.0, 4.9, "2 shirts \u00d7 3 trousers = 6 outfits", fontsize=12, color=INK, fontweight="bold")
save(fig, "fig_ma2_13_counting_tree.png")

# ------------------------------------------------ 14. ch14: delivery network
fig, ax = plt.subplots(figsize=(9.5, 4.6), constrained_layout=True)
ax.set_xlim(0, 13); ax.set_ylim(0, 6); ax.axis("off")
nodes = {"Warehouse": (1.6, 3.0), "Hub A": (5.0, 5.0), "Hub B": (5.0, 1.2),
         "Shop 1": (9.2, 5.0), "Shop 2": (9.2, 3.0), "Shop 3": (9.2, 1.2)}
edges = [("Warehouse", "Hub A", "8"), ("Warehouse", "Hub B", "6"),
         ("Hub A", "Shop 1", "4"), ("Hub A", "Shop 2", "9"),
         ("Hub B", "Shop 2", "5"), ("Hub B", "Shop 3", "4")]
pos = {}
for name, (x, y) in nodes.items():
    ax.add_patch(Circle((x, y), 0.52, fc=SURFACE, ec=MATH, lw=2.0, zorder=3))
    ax.text(x, y, name, ha="center", va="center", fontsize=9, color=INK, zorder=4)
    pos[name] = (x, y)
for a, b, wlab in edges:
    xa, ya = pos[a]; xb, yb = pos[b]
    ax.plot([xa, xb], [ya, yb], color=MATH, lw=1.8, zorder=1)
    ax.text((xa + xb) / 2 + 0.12, (ya + yb) / 2 + 0.22, wlab, fontsize=10, color=ACCENT,
            fontweight="bold", zorder=2)
ax.text(6.5, 0.15, "six roads connect six places; the numbers are kilometers",
        ha="center", fontsize=11, color=MUTED)
save(fig, "fig_ma2_14_network.png")

# ------------------------------------------------ 15. ch15: capstone method flow
fig, ax = plt.subplots(figsize=(11.5, 2.9), constrained_layout=True)
ax.set_xlim(0, 17); ax.set_ylim(0, 3); ax.axis("off")
steps = [
    ("1. Understand", "what is given,\nwhat is asked", "#FFFFFF", MATH),
    ("2. Plan", "name the unknown,\nwrite the equation", SURFACE, ACCENT),
    ("3. Solve", "one move per line,\nkeep the balance", "#FFFFFF", MATH),
    ("4. Check", "put the answer back\ninto the story", SURFACE, ACCENT),
]
x = 0.4
for i, (t, sub, fc, ec) in enumerate(steps):
    rbox(ax, x, 0.8, 3.5, 1.5, t + "\n" + sub, fc=fc, ec=ec, fs=11)
    if i < 3:
        ax.annotate("", xy=(x + 4.15, 1.55), xytext=(x + 3.6, 1.55),
                    arrowprops=dict(arrowstyle="-|>", color=MATH, lw=2))
    x += 4.15
ax.text(8.5, 2.65, "the same four moves power every engineering problem",
        ha="center", fontsize=11, color=MUTED)
save(fig, "fig_ma2_15_capstone_steps.png")

print("MA-2 figures written to", OUT)
